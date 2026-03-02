import {
  Controller,
  Post,
  Body,
  Headers,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { Public } from '../auth/decorators/public.decorator';
import Stripe from 'stripe';

@Controller('payments/webhook')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);
  private stripe: Stripe;

  constructor(
    private readonly paymentsService: PaymentsService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  @Public()
  @Post('stripe')
  async handleStripeWebhook(
    @Body() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid signature');
    }

    this.logger.log(`Received webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Processing completed checkout session: ${session.id}`);

    if (session.payment_status === 'paid') {
      await this.paymentsService.handleSuccessfulPayment(session.id);
      this.logger.log(`Order created for session: ${session.id}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
    // Additional processing if needed
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.error(`Payment intent failed: ${paymentIntent.id}`);
    // Handle failed payment (e.g., notify user, update order status)
  }
}