import { IsUUID, IsInt, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdjustmentReason } from '@sajani/shared';

export class AdjustStockDto {
  @ApiProperty()
  @IsUUID()
  variantId!: string;

  @ApiProperty({ example: 5, description: 'Positive = add, negative = remove' })
  @IsInt()
  adjustment!: number;

  @ApiProperty({ enum: AdjustmentReason })
  @IsEnum(AdjustmentReason)
  reason!: AdjustmentReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
