import { Controller, Get, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateAssetStatusDto } from './dto/update-asset-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('assets')
  @ApiOperation({ summary: 'List all assets (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all assets' })
  async getAllAssets() {
    return this.adminService.getAllAssets();
  }

  @Patch('assets/:id/status')
  @ApiOperation({ summary: 'Update asset status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 200, description: 'Asset status updated' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async updateAssetStatus(
    @Param('id') id: string,
    @Body() updateAssetStatusDto: UpdateAssetStatusDto,
  ) {
    return this.adminService.updateAssetStatus(id, updateAssetStatusDto.status);
  }

  @Delete('assets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an asset (Admin only)' })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiResponse({ status: 204, description: 'Asset deleted' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async deleteAsset(@Param('id') id: string) {
    await this.adminService.deleteAsset(id);
  }
}
