import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Asset, Earning } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async getSellerAssets(userId: string): Promise<Asset[]> {
    return this.prisma.asset.findMany({
      where: {
        sellerId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSellerSalesHistory(userId: string): Promise<Earning[]> {
    return this.prisma.earning.findMany({
      where: {
        sellerId: userId,
      },
      include: {
        asset: {
          select: {
            title: true,
            previewUrl: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            buyer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSellerTotalRevenue(userId: string): Promise<{ totalRevenue: number }> {
    const result = await this.prisma.earning.aggregate({
      where: {
        sellerId: userId,
      },
      _sum: {
        sellerEarning: true,
      },
    });

    return {
      totalRevenue: Number(result._sum.sellerEarning) || 0,
    };
  }
}
