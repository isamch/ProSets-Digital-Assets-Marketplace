import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private publicBucket: string;
  private privateBucket: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION');
    this.publicBucket = this.configService.get('AWS_S3_PUBLIC_BUCKET');
    this.privateBucket = this.configService.get('AWS_S3_PRIVATE_BUCKET');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadPreview(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    this.validateImageFile(file);

    const key = `previews/${uuidv4()}${path.extname(file.originalname)}`;

    await this.uploadToS3(this.publicBucket, key, file.buffer, file.mimetype, true);

    // Construct public URL
    const url = `https://${this.publicBucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { url, key };
  }

  async uploadAssetFile(file: Express.Multer.File): Promise<{ key: string; originalName: string; size: number }> {
    const key = `assets/${uuidv4()}${path.extname(file.originalname)}`;

    await this.uploadToS3(this.privateBucket, key, file.buffer, file.mimetype, false);

    return {
      key,
      originalName: file.originalname,
      size: file.size,
    };
  }

  private async uploadToS3(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
    isPublic: boolean,
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: isPublic ? 'public-read' : 'private',
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  private validateImageFile(file: Express.Multer.File): void {
    if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      throw new BadRequestException('Only image files are allowed for previews');
    }
  }
}
