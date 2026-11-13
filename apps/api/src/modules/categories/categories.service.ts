import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { generateSlug } from '@sajani/shared';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List active categories sorted by sortOrder (public).
   */
  async findAllActive() {
    return this.prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * List all categories including inactive (admin).
   */
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get category by ID.
   */
  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException({ code: 'CAT_001', message: 'Category not found' });
    }
    return category;
  }

  /**
   * Create a new category (admin).
   */
  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || generateSlug(dto.name);

    // Check slug uniqueness
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException({ code: 'CAT_002', message: `Category slug "${slug}" already exists` });
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  /**
   * Update a category (admin).
   */
  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id); // Throws 404 if not found

    // Check slug uniqueness if changing
    if (dto.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException({ code: 'CAT_002', message: `Category slug "${dto.slug}" already exists` });
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }
}
