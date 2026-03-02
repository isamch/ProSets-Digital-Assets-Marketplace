import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: {
        buyerId: userId,
        status: 'COMPLETED',
      },
      include: {
        orderItems: {
          include: {
            asset: {
              select: {
                id: true,
                title: true,
                previewUrl: true,
                price: true,
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
}
