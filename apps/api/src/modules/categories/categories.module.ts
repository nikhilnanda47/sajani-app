import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController, CategoriesAdminController } from './categories.controller';

@Module({
  controllers: [CategoriesController, CategoriesAdminController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
