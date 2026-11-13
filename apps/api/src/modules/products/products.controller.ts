import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductQueryDto, CreateProductDto, UpdateProductDto, UpdateVariantDto } from './dto';
import { CreateVariantDto } from './dto/create-product.dto';
import { JwtAuthGuard, AdminAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../../common/decorators/roles.decorator';

// ── Public Endpoints ──
@ApiTags('Products')
@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter products' })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product detail by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}

// ── Admin Endpoints ──
@ApiTags('Admin: Catalog')
@Controller('api/v1/admin/products')
@UseGuards(JwtAuthGuard, AdminAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsAdminController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products (including drafts)' })
  async findAll(@Query() query: ProductQueryDto & { publishStatus?: string }) {
    return this.productsService.findAllAdmin(query);
  }

  @Post()
  @Roles('owner', 'catalog_editor')
  @ApiOperation({ summary: 'Create product with variants' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles('owner', 'catalog_editor')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Post(':id/variants')
  @Roles('owner', 'catalog_editor')
  @ApiOperation({ summary: 'Add variant to product' })
  async addVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productsService.addVariant(id, dto);
  }

  @Patch(':id/variants/:variantId')
  @Roles('owner', 'catalog_editor')
  @ApiOperation({ summary: 'Update variant' })
  async updateVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productsService.updateVariant(id, variantId, dto);
  }
}
