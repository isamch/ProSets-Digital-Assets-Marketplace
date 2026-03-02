import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum } from 'class-validator';
import { AssetStatus } from '@prisma/client';
import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;
}