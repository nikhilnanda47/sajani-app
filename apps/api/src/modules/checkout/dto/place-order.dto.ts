import { IsUUID, IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMode } from '@sajani/shared';

export class PlaceOrderDto {
  @ApiProperty()
  @IsUUID()
  addressId!: string;

  @ApiProperty({ enum: PaymentMode })
  @IsEnum(PaymentMode)
  paymentMode!: PaymentMode;

  @ApiProperty({ description: 'Client-generated UUID for idempotency' })
  @IsString()
  @MaxLength(100)
  idempotencyKey!: string;

  @ApiPropertyOptional({ description: 'Delivery instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
