import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssetStatus } from '@prisma/client';

export class UpdateAssetStatusDto {
  @ApiProperty({ enum: AssetStatus, description: 'The new status of the asset' })
  @IsEnum(AssetStatus)
  status: AssetStatus;
}
