import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface DownloadResponse {
  downloadUrl: string;
  expiresIn: number;
  fileName: string;
  fileSize: number;
}

@Injectable()
export class DownloadsService {
  private s3Client: S3Client;
  private privateBucket: string;
  private presignedUrlExpiry: number;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.privateBucket = this.configService.get('AWS_S3_PRIVATE_BUCKET');
    this.presignedUrlExpiry = parseInt(this.configService.get('PRESIGNED_URL_EXPIRY', '300')); // 5 minutes default
  }

  async generateDownloadUrl(assetId: string, userId: string): Promise<DownloadResponse> {
    // Verify asset exists and is active
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        title: true,
        fileKey: true,
        fileName: true,
        fileSize: true,
        status: true,
        sellerId: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException('Asset is not available for download');
    }

    // Check if user has purchased this asset
    const hasPurchased = await this.verifyPurchase(assetId, userId);
    if (!hasPurchased) {
      throw new ForbiddenException('You must purchase this asset before downloading');
    }

    // Generate presigned URL
    const downloadUrl = await this.createPresignedUrl(asset.fileKey);

    // Log the download attempt
    await this.logDownload(assetId, userId);

    // Increment download count
    await this.incrementDownloadCount(assetId);

    return {
      downloadUrl,
      expiresIn: this.presignedUrlExpiry,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
    };
  }

  private async verifyPurchase(assetId: string, userId: string): Promise<boolean> {
    const purchase = await this.prisma.orderItem.findFirst({
      where: {
        assetId,
        order: {
          buyerId: userId,
          paymentStatus: 'SUCCEEDED',
          status: 'COMPLETED',
        },
      },
      include: {
        order: {
          select: {
            id: true,
            paymentStatus: true,
            status: true,
          },
        },
      },
    });

    return !!purchase;
  }

  private async createPresignedUrl(fileKey: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.privateBucket,
        Key: fileKey,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.presignedUrlExpiry,
      });

      return signedUrl;
    } catch (error) {
      throw new BadRequestException(`Failed to generate download URL: ${error.message}`);
    }
  }

  private async logDownload(assetId: string, userId: string): Promise<void> {
    try {
      // Find the order for this asset and user
      const orderItem = await this.prisma.orderItem.findFirst({
        where: {
          assetId,
          order: {
            buyerId: userId,
            paymentStatus: 'SUCCEEDED',
          },
        },
        include: {
          order: {
            select: {
              id: true,
            },
          },
        },
      });

      if (orderItem) {
        await this.prisma.downloadLog.create({
          data: {
            userId,
            assetId,
            orderId: orderItem.order.id,
            downloadedAt: new Date(),
          },
        });
      }
    } catch (error) {
      // Log error but don't fail the download
      console.error('Failed to log download:', error);
    }
  }

  private async incrementDownloadCount(assetId: string): Promise<void> {
    try {
      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          downloadCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      // Log error but don't fail the download
      console.error('Failed to increment download count:', error);
    }
  }
}