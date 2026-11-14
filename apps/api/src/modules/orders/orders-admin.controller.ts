import {
  Controller, Get, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { AdminOrderQueryDto, UpdateOrderStatusDto } from './dto';
import { JwtAuthGuard, AdminAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin: Orders')
@Controller('api/v1/admin/orders')
@UseGuards(JwtAuthGuard, AdminAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders (admin)' })
  async findAll(@Query() query: AdminOrderQueryDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @Patch(':id/status')
  @Roles('owner', 'fulfillment_operator')
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateStatus(id, dto, user.id);
  }
}
