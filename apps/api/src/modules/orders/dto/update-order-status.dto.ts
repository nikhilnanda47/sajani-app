import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@sajani/shared';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiPropertyOptional({ description: 'Tracking ID (required when shipping)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingId?: string;

  @ApiPropertyOptional({ description: 'Courier name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  courierName?: string;
}

export class CancelOrderDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  reason!: string;
}
