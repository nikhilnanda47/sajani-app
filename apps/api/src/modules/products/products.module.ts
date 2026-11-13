import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController, ProductsAdminController } from './products.controller';

@Module({
  controllers: [ProductsController, ProductsAdminController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
