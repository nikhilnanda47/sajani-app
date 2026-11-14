import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';
import { CART } from '@sajani/shared';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get full cart with server-calculated prices and availability.
   * Joins: cart_items → product_variants → inventory → products.
   */
  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        variant: {
          include: {
            product: {
              select: { title: true, slug: true, publishStatus: true },
            },
            inventory: {
              select: { onHand: true, reserved: true, unavailable: true },
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    const cartItems = items.map((item) => {
      const v = item.variant;
      const inv = v.inventory;
      const available = inv ? inv.onHand - inv.reserved - inv.unavailable : 0;
      const isAvailable = available >= item.quantity && v.active && v.product.publishStatus === 'published';

      let availabilityWarning: string | undefined;
      if (available <= 0) {
        availabilityWarning = 'Out of stock';
      } else if (available < item.quantity) {
        availabilityWarning = `Only ${available} available`;
      } else if (available <= 3) {
        availabilityWarning = `Only ${available} left`;
      }

      return {
        id: item.id,
        variant: {
          id: v.id,
          sku: v.sku,
          name: v.name,
          color: v.color,
          pricePaise: v.pricePaise,
          compareAtPaise: v.compareAtPaise,
          available,
          productTitle: v.product.title,
          productSlug: v.product.slug,
          imageUrl: null, // Media upload coming in Phase 5
        },
        quantity: item.quantity,
        lineTotalPaise: item.quantity * v.pricePaise,
        isAvailable,
        availabilityWarning,
      };
    });

    const subtotalPaise = cartItems.reduce((sum, i) => sum + i.lineTotalPaise, 0);

    return {
      items: cartItems,
      subtotalPaise,
      itemCount: cartItems.length,
    };
  }

  /**
   * Add variant to cart. If already in cart, increment quantity.
   */
  async addItem(userId: string, dto: AddToCartDto) {
    // Validate variant exists, is active, and belongs to a published product
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: { product: { select: { publishStatus: true } } },
    });

    if (!variant || !variant.active) {
      throw new NotFoundException('VARIANT_NOT_FOUND');
    }
    if (variant.product.publishStatus !== 'published') {
      throw new BadRequestException('VARIANT_UNAVAILABLE');
    }

    // Check if already in cart
    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_variantId: { userId, variantId: dto.variantId } },
    });

    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (newQty > CART.MAX_QUANTITY_PER_VARIANT) {
        throw new BadRequestException('QUANTITY_EXCEEDS_LIMIT');
      }
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          userId,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update cart item quantity. Qty=0 removes the item.
   */
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new NotFoundException('CART_ITEM_NOT_FOUND');

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: dto.quantity },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Remove item from cart.
   */
  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new NotFoundException('CART_ITEM_NOT_FOUND');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  /**
   * Clear all cart items for a user (called after order placement).
   */
  async clearCart(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
  }
}
