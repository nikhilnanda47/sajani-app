import { IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CART } from '@sajani/shared';

export class AddToCartDto {
  @ApiProperty()
  @IsUUID()
  variantId!: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: CART.MAX_QUANTITY_PER_VARIANT })
  @IsInt()
  @Min(1)
  @Max(CART.MAX_QUANTITY_PER_VARIANT)
  quantity!: number;
}
