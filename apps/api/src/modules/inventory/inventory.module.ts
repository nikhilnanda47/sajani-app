import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ReservationExpiryCron } from './reservation-expiry.cron';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, ReservationExpiryCron],
  exports: [InventoryService],
})
export class InventoryModule {}
