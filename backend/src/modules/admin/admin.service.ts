import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Asset, AssetStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }

  async getAllAssets(): Promise<Asset[]> {
    return this.prisma.asset.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateAssetStatus(id: string, status: AssetStatus): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return this.prisma.asset.update({
      where: { id },
      data: { status },
    });
  }

  async deleteAsset(id: string): Promise<void> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    await this.prisma.asset.delete({
      where: { id },
    });
  }
}
