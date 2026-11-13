import { IsOptional, IsString, IsInt, Min, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ProductSortBy } from '@sajani/shared';

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Search in title, description, tags' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Pure Silk' })
  @IsOptional()
  @IsString()
  fabric?: string;

  @ApiPropertyOptional({ example: 'Handloom Ikat' })
  @IsOptional()
  @IsString()
  weaveMethod?: string;

  @ApiPropertyOptional({ example: 'Maroon' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Min price in paise' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Max price in paise' })
  @IsOptional()
  @IsInt()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ProductSortBy, default: ProductSortBy.NEWEST })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy = ProductSortBy.NEWEST;
}
