import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Asset, AssetStatus, User, Prisma } from '@prisma/client';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { QueryAssetsDto } from './dto/query-assets.dto';

export interface PaginatedAssets {
  data: Asset[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(createAssetDto: CreateAssetDto, sellerId: string): Promise<Asset> {
    try {
      const asset = await this.prisma.asset.create({
        data: {
          ...createAssetDto,
          price: new Prisma.Decimal(createAssetDto.price),
          sellerId,
          status: AssetStatus.PENDING_APPROVAL,
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return asset;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Asset with this title already exists');
      }
      throw error;
    }
  }

  async findAll(queryDto: QueryAssetsDto): Promise<PaginatedAssets> {
    const { page, limit, search, category, status, tags, minPrice, maxPrice, sortBy, sortOrder } = queryDto;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Prisma.AssetWhereInput = {
      status,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ],
      }),
      ...(category && { category }),
      ...(tags && tags.length > 0 && { tags: { hasSome: tags } }),
      ...(minPrice !== undefined && { price: { gte: new Prisma.Decimal(minPrice) } }),
      ...(maxPrice !== undefined && { price: { lte: new Prisma.Decimal(maxPrice) } }),
      ...(minPrice !== undefined && maxPrice !== undefined && {
        price: {
          gte: new Prisma.Decimal(minPrice),
          lte: new Prisma.Decimal(maxPrice),
        },
      }),
    };

    // Build orderBy clause
    const orderBy: Prisma.AssetOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: assets,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async findByUser(userId: string, queryDto: QueryAssetsDto): Promise<PaginatedAssets> {
    const { page, limit, search, category, status, sortBy, sortOrder } = queryDto;
    
    const skip = (page - 1) * limit;
    
    const where: Prisma.AssetWhereInput = {
      sellerId: userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category }),
      ...(status && { status }),
    };

    const orderBy: Prisma.AssetOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.asset.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: assets,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, userId: string): Promise<Asset> {
    const asset = await this.findOne(id);

    if (asset.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own assets');
    }

    try {
      const updatedAsset = await this.prisma.asset.update({
        where: { id },
        data: {
          ...updateAssetDto,
          ...(updateAssetDto.price && { price: new Prisma.Decimal(updateAssetDto.price) }),
        },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedAsset;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Asset with this title already exists');
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const asset = await this.findOne(id);

    if (asset.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own assets');
    }

    // Soft delete by setting status to INACTIVE
    await this.prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.INACTIVE,
      },
    });

    return { message: 'Asset deleted successfully' };
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await this.prisma.asset.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });
  }
}