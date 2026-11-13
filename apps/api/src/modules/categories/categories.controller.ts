import { Controller, Get, Post, Patch, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { JwtAuthGuard, AdminAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../../common/decorators/roles.decorator';

// ── Public Endpoints ──
@ApiTags('Categories')
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List active categories' })
  async findAll() {
    return this.categoriesService.findAllActive();
  }
}

// ── Admin Endpoints ──
@ApiTags('Admin: Catalog')
@Controller('api/v1/admin/categories')
@UseGuards(JwtAuthGuard, AdminAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesAdminController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories (including inactive)' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @Roles('owner', 'catalog_editor')
  @ApiOperation({ summary: 'Create category' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles('owner', 'catalog_editor')
  @ApiOperation({ summary: 'Update category' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }
}
