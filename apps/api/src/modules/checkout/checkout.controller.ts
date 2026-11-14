import {
  Controller, Post, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CheckoutQuoteDto, PlaceOrderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Checkout')
@Controller('api/v1')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('checkout/quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get checkout quote (does NOT reserve stock)' })
  async getQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutQuoteDto,
  ) {
    return this.checkoutService.getQuote(user.id, dto);
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place order (atomic: reserve stock + create order + clear cart)' })
  async placeOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PlaceOrderDto,
  ) {
    return this.checkoutService.placeOrder(user.id, dto);
  }
}
