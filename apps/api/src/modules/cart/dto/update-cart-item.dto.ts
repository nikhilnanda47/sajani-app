import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CART } from '@sajani/shared';

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, minimum: 0, maximum: CART.MAX_QUANTITY_PER_VARIANT, description: '0 = remove' })
  @IsInt()
  @Min(0)
  @Max(CART.MAX_QUANTITY_PER_VARIANT)
  quantity!: number;
}
