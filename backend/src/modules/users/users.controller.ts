import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users / Seller Dashboard')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('seller/assets')
  @ApiOperation({ summary: 'Get all assets created by the seller' })
  @ApiResponse({ status: 200, description: 'List of seller assets' })
  async getSellerAssets(@Request() req) {
    return this.usersService.getSellerAssets(req.user.id);
  }

  @Get('seller/sales')
  @ApiOperation({ summary: 'Get seller sales history' })
  @ApiResponse({ status: 200, description: 'List of earnings/sales' })
  async getSellerSalesHistory(@Request() req) {
    return this.usersService.getSellerSalesHistory(req.user.id);
  }

  @Get('seller/revenue')
  @ApiOperation({ summary: 'Get total seller revenue' })
  @ApiResponse({ status: 200, description: 'Total revenue amount' })
  async getSellerTotalRevenue(@Request() req) {
    return this.usersService.getSellerTotalRevenue(req.user.id);
  }
}
