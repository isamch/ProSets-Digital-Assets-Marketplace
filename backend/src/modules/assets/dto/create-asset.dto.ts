import { IsString, IsNotEmpty, IsDecimal, IsEnum, IsOptional, IsArray, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AssetCategory } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;

  @IsString()
  @IsNotEmpty()
  previewUrl: string;

  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @Type(() => Number)
  @Min(1, { message: 'File size must be greater than 0' })
  fileSize: number;

  @IsEnum(AssetCategory)
  category: AssetCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}