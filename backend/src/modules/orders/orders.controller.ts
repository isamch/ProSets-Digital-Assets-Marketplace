import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get buyer order history' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async findMyOrders(@Request() req) {
    return this.ordersService.findMyOrders(req.user.id);
  }
}
