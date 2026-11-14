import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReservationExpiryCron {
  private readonly logger = new Logger(ReservationExpiryCron.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every minute. Finds held reservations past their expiry time,
   * releases the reserved stock back to the available pool.
   * Each reservation is processed in its own transaction so one failure
   * doesn't block others.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    const expired = await this.prisma.inventoryReservation.findMany({
      where: {
        status: 'held',
        expiresAt: { lt: new Date() },
      },
    });

    if (expired.length === 0) return;

    let released = 0;
    for (const reservation of expired) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.inventory.update({
            where: { variantId: reservation.variantId },
            data: {
              reserved: { decrement: reservation.qty },
              version: { increment: 1 },
            },
          });

          await tx.inventoryReservation.update({
            where: { id: reservation.id },
            data: { status: 'expired' },
          });
        });
        released++;
      } catch (err) {
        this.logger.error(
          `Failed to expire reservation ${reservation.id}: ${(err as Error).message}`,
        );
      }
    }

    if (released > 0) {
      this.logger.log(`Released ${released} expired reservation(s)`);
    }
  }
}
