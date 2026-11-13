import {
  IsString, IsOptional, IsUUID, IsEnum, IsArray, IsInt, Min, MaxLength,
  ValidateNested, ArrayMinSize, IsObject, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublishStatus } from '@sajani/shared';

export class CreateVariantDto {
  @ApiProperty({ example: 'SAJ-IKT-MRN-001' })
  @IsString()
  @MaxLength(50)
  sku!: string;

  @ApiPropertyOptional({ example: 'Maroon with Gold Border' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Maroon' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: { border: 'gold zari', pallu: 'contrast' } })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @ApiProperty({ example: 350000, description: 'Price in paise' })
  @IsInt()
  @Min(1)
  pricePaise!: number;

  @ApiPropertyOptional({ example: 450000, description: 'Compare/MRP price in paise' })
  @IsOptional()
  @IsInt()
  @Min(1)
  compareAtPaise?: number;

  @ApiProperty({ example: 5, description: 'Initial stock count' })
  @IsInt()
  @Min(0)
  initialStock!: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Sambalpuri Ikat Silk Saree – Maroon & Gold' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ enum: PublishStatus, default: PublishStatus.DRAFT })
  @IsOptional()
  @IsEnum(PublishStatus)
  publishStatus?: PublishStatus;

  @ApiPropertyOptional({ example: 'Pure Silk' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fabric?: string;

  @ApiPropertyOptional({ example: 'Handloom Ikat' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  weaveMethod?: string;

  @ApiPropertyOptional({ example: 'Sonepur, Subarnapur District, Odisha' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  origin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  careInstructions?: string;

  @ApiPropertyOptional({ example: 'Included – 0.8m unstitched' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  blousePiece?: string;

  @ApiPropertyOptional({ example: '5.5 meters' })
  @IsOptional()
  @IsString()
  length?: string;

  @ApiPropertyOptional({ example: '46 inches' })
  @IsOptional()
  @IsString()
  width?: string;

  @ApiPropertyOptional({ example: '450 grams' })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiPropertyOptional({ example: ['Festive', 'Wedding'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  occasion?: string[];

  @ApiPropertyOptional({ example: ['silk', 'ikat', 'bapta'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ type: [CreateVariantDto], minItems: 1 })
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @ArrayMinSize(1)
  variants!: CreateVariantDto[];
}
