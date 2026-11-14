import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderQueryDto, AdminOrderQueryDto, UpdateOrderStatusDto, CancelOrderDto } from './dto';
import { canTransitionOrder, OrderStatus, PAGINATION } from '@sajani/shared';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  // ─────────────────────────────────────────
  // CUSTOMER ENDPOINTS
  // ─────────────────────────────────────────

  /**
   * List customer's orders, newest first.
   */
  async findMyOrders(userId: string, query: OrderQueryDto) {
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;

    const where: Prisma.OrderWhereInput = { userId };
    if (query.status) where.status = query.status;

    const findArgs: Prisma.OrderFindManyArgs = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        items: {
          select: {
            id: true, productTitle: true, variantName: true, sku: true,
            qty: true, unitPricePaise: true, totalPaise: true,
          },
        },
      },
    };

    if (query.cursor) {
      findArgs.cursor = { id: query.cursor };
      findArgs.skip = 1;
    }

    const orders = await this.prisma.order.findMany(findArgs);
    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, limit) : orders;

    return {
      items: items.map((o) => this.toOrderSummary(o)),
      cursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  /**
   * Get single order detail (customer — own orders only).
   */
  async findMyOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        shipments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.toOrderDetail(order);
  }

  /**
   * Customer cancels their own order (only if placed or confirmed).
   */
  async cancelMyOrder(userId: string, orderId: string, dto: CancelOrderDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!canTransitionOrder(order.status as OrderStatus, OrderStatus.CANCELLED)) {
      throw new BadRequestException(
        `Cannot cancel order in "${order.status}" status`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Release inventory reservations
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId, status: { in: ['held', 'committed'] } },
      });
      for (const res of reservations) {
        await this.inventoryService.releaseReservation(tx, res.id);
      }

      // Update order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: dto.reason,
        },
        include: { items: true },
      });

      return this.toOrderDetail(updated);
    });
  }

  // ─────────────────────────────────────────
  // ADMIN ENDPOINTS
  // ─────────────────────────────────────────

  /**
   * Admin: list all orders with search/filter.
   */
  async findAllAdmin(query: AdminOrderQueryDto) {
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;

    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { publicNumber: { contains: query.search, mode: 'insensitive' } },
        { user: { phone: { contains: query.search } } },
      ];
    }

    const findArgs: Prisma.OrderFindManyArgs = {
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        items: {
          select: { productTitle: true, qty: true, totalPaise: true },
        },
        user: { select: { phone: true, name: true } },
      },
    };

    if (query.cursor) {
      findArgs.cursor = { id: query.cursor };
      findArgs.skip = 1;
    }

    const orders = await this.prisma.order.findMany(findArgs);
    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, limit) : orders;

    return {
      items: items.map((o: any) => ({
        ...this.toOrderSummary(o),
        customer: o.user ? { phone: o.user.phone, name: o.user.name } : null,
      })),
      cursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    };
  }

  /**
   * Admin: update order status with state machine validation.
   */
  async updateStatus(orderId: string, dto: UpdateOrderStatusDto, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!canTransitionOrder(order.status as OrderStatus, dto.status as OrderStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${order.status}" to "${dto.status}"`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Build update data with timestamps
      const data: Prisma.OrderUpdateInput = { status: dto.status };

      switch (dto.status) {
        case OrderStatus.CONFIRMED:
          data.confirmedAt = new Date();
          break;
        case OrderStatus.PACKED:
          data.packedAt = new Date();
          break;
        case OrderStatus.SHIPPED:
          data.shippedAt = new Date();
          // Create shipment record
          if (dto.trackingId) {
            await tx.shipment.create({
              data: {
                orderId,
                carrier: dto.courierName || 'Manual',
                trackingId: dto.trackingId,
                status: 'in_transit',
              },
            });
          }
          break;
        case OrderStatus.DELIVERED:
          data.deliveredAt = new Date();
          // Update shipment
          await tx.shipment.updateMany({
            where: { orderId },
            data: { status: 'delivered', deliveredAt: new Date() },
          });
          break;
        case OrderStatus.CANCELLED:
          data.cancelledAt = new Date();
          // Release reservations
          const reservations = await tx.inventoryReservation.findMany({
            where: { orderId, status: { in: ['held', 'committed'] } },
          });
          for (const res of reservations) {
            await this.inventoryService.releaseReservation(tx, res.id);
          }
          break;
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data,
        include: { items: true, shipments: true },
      });

      // Audit log
      await tx.auditEvent.create({
        data: {
          action: 'order.status_changed',
          entityType: 'order',
          entityId: orderId,
          actorType: 'admin',
          actorId: adminId,
          beforeState: { status: order.status } as any,
          afterState: { status: dto.status } as any,
        },
      });

      return this.toOrderDetail(updated);
    });
  }

  // ─────────────────────────────────────────
  // RESPONSE FORMATTERS
  // ─────────────────────────────────────────

  private toOrderSummary(order: any) {
    return {
      id: order.id,
      publicNumber: order.publicNumber,
      status: order.status,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      totalPaise: order.totalPaise,
      itemCount: order.items?.length ?? 0,
      items: order.items?.map((i: any) => ({
        productTitle: i.productTitle,
        variantName: i.variantName,
        qty: i.qty,
        totalPaise: i.totalPaise,
      })) || [],
      createdAt: order.createdAt,
    };
  }

  private toOrderDetail(order: any) {
    return {
      id: order.id,
      publicNumber: order.publicNumber,
      status: order.status,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      subtotalPaise: order.subtotalPaise,
      shippingPaise: order.shippingPaise,
      taxPaise: order.taxPaise,
      discountPaise: order.discountPaise,
      totalPaise: order.totalPaise,
      addressSnapshot: order.addressSnapshot,
      notes: order.notes,
      estimatedDelivery: '5–7 business days',
      items: order.items?.map((i: any) => ({
        id: i.id,
        productTitle: i.productTitle,
        variantName: i.variantName,
        sku: i.sku,
        qty: i.qty,
        unitPricePaise: i.unitPricePaise,
        totalPaise: i.totalPaise,
      })) || [],
      shipments: order.shipments?.map((s: any) => ({
        id: s.id,
        carrier: s.carrier,
        trackingId: s.trackingId,
        status: s.status,
        dispatchedAt: s.dispatchedAt,
        deliveredAt: s.deliveredAt,
      })) || [],
      confirmedAt: order.confirmedAt,
      packedAt: order.packedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
    };
  }
}
