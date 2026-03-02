import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { Asset, User, Prisma } from '@prisma/client';

export interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
}

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(
    createCheckoutDto: CreateCheckoutSessionDto,
    userId: string,
  ): Promise<CheckoutSessionResponse> {
    const { assetIds, successUrl, cancelUrl } = createCheckoutDto;

    // Validate and fetch assets from database
    const assets = await this.validateAndFetchAssets(assetIds, userId);

    // Calculate total amount from database prices (never trust frontend)
    const totalAmount = this.calculateTotalAmount(assets);

    // Create line items for Stripe
    const lineItems = this.createLineItems(assets);

    try {
      // Create Stripe Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: await this.getUserEmail(userId),
        metadata: {
          userId,
          assetIds: JSON.stringify(assetIds),
          totalAmount: totalAmount.toString(),
        },
        payment_intent_data: {
          metadata: {
            userId,
            assetIds: JSON.stringify(assetIds),
          },
        },
      });

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create checkout session: ${error.message}`);
    }
  }

  private async validateAndFetchAssets(assetIds: string[], userId: string): Promise<Asset[]> {
    // Remove duplicates
    const uniqueAssetIds = [...new Set(assetIds)];

    // Fetch assets from database
    const assets = await this.prisma.asset.findMany({
      where: {
        id: { in: uniqueAssetIds },
        status: 'ACTIVE',
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Check if all assets exist and are active
    if (assets.length !== uniqueAssetIds.length) {
      const foundIds = assets.map(asset => asset.id);
      const missingIds = uniqueAssetIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Assets not found or inactive: ${missingIds.join(', ')}`);
    }

    // Check if user is trying to buy their own assets
    const ownAssets = assets.filter(asset => asset.sellerId === userId);
    if (ownAssets.length > 0) {
      throw new BadRequestException('You cannot purchase your own assets');
    }

    // Check if user already owns these assets
    const existingOrders = await this.prisma.orderItem.findMany({
      where: {
        assetId: { in: uniqueAssetIds },
        order: {
          buyerId: userId,
          paymentStatus: 'SUCCEEDED',
        },
      },
    });

    if (existingOrders.length > 0) {
      const ownedAssetIds = existingOrders.map(item => item.assetId);
      const ownedAssets = assets.filter(asset => ownedAssetIds.includes(asset.id));
      throw new BadRequestException(
        `You already own these assets: ${ownedAssets.map(a => a.title).join(', ')}`
      );
    }

    return assets;
  }

  private calculateTotalAmount(assets: Asset[]): number {
    return assets.reduce((total, asset) => {
      return total + Number(asset.price);
    }, 0);
  }

  private createLineItems(assets: Asset[]): Stripe.Checkout.SessionCreateParams.LineItem[] {
    return assets.map(asset => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: asset.title,
          description: asset.description,
          images: asset.previewUrl ? [asset.previewUrl] : [],
          metadata: {
            assetId: asset.id,
            sellerId: asset.sellerId,
          },
        },
        unit_amount: Math.round(Number(asset.price) * 100), // Convert to cents
      },
      quantity: 1,
    }));
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.email;
  }

  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      throw new NotFoundException(`Checkout session not found: ${error.message}`);
    }
  }

  async handleSuccessfulPayment(sessionId: string): Promise<void> {
    const session = await this.getCheckoutSession(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment not completed');
    }

    const { userId, assetIds } = session.metadata;
    const parsedAssetIds: string[] = JSON.parse(assetIds);

    // Create order and order items
    await this.createOrderFromSession(session, userId, parsedAssetIds);
  }

  private async createOrderFromSession(
    session: Stripe.Checkout.Session,
    userId: string,
    assetIds: string[],
  ): Promise<void> {
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds } },
    });

    const totalAmount = new Prisma.Decimal(Number(session.amount_total) / 100);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    await this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId: userId,
          totalAmount,
          stripePaymentIntentId: session.payment_intent as string,
          status: 'COMPLETED',
          paymentStatus: 'SUCCEEDED',
        },
      });

      // Create order items
      const orderItems = assets.map(asset => ({
        orderId: order.id,
        assetId: asset.id,
        price: asset.price,
        quantity: 1,
      }));

      await tx.orderItem.createMany({
        data: orderItems,
      });

      // Create earnings records for sellers
      const earningsData = assets.map(asset => {
        const assetPrice = Number(asset.price);
        const platformFee = assetPrice * 0.1; // 10% platform fee
        const sellerEarning = assetPrice - platformFee;

        return {
          sellerId: asset.sellerId,
          orderId: order.id,
          assetId: asset.id,
          amount: new Prisma.Decimal(assetPrice),
          platformFee: new Prisma.Decimal(platformFee),
          sellerEarning: new Prisma.Decimal(sellerEarning),
          stripeTransactionId: session.payment_intent as string,
        };
      });

      await tx.earning.createMany({
        data: earningsData,
      });
    });
  }
}