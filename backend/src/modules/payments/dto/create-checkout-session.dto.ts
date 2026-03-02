import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one asset must be selected' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  assetIds: string[];

  @IsString()
  @IsNotEmpty()
  successUrl: string;

  @IsString()
  @IsNotEmpty()
  cancelUrl: string;
}