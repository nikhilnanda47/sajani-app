import {
  Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto';
import { JwtAuthGuard, AdminAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin: Inventory')
@Controller('api/v1/admin/inventory')
@UseGuards(JwtAuthGuard, AdminAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':variantId')
  @ApiOperation({ summary: 'Get stock for a variant' })
  async getStock(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.inventoryService.getStock(variantId);
  }

  @Post('adjust')
  @Roles('owner', 'catalog_editor')
  @ApiOperation({ summary: 'Adjust stock (add/remove)' })
  async adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.adjustStock(dto, user.id);
  }
}
