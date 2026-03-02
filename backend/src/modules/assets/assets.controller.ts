import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { QueryAssetsDto } from './dto/query-assets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User, UserRole } from '@prisma/client';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post()
  async create(
    @Body() createAssetDto: CreateAssetDto,
    @CurrentUser() user: User,
  ) {
    const asset = await this.assetsService.create(createAssetDto, user.id);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Asset created successfully',
      data: asset,
    };
  }

  @Public()
  @Get()
  async findAll(@Query() queryDto: QueryAssetsDto) {
    const result = await this.assetsService.findAll(queryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Assets retrieved successfully',
      ...result,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Get('my-assets')
  async findMyAssets(
    @Query() queryDto: QueryAssetsDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.assetsService.findByUser(user.id, queryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Your assets retrieved successfully',
      ...result,
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const asset = await this.assetsService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Asset retrieved successfully',
      data: asset,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
    @CurrentUser() user: User,
  ) {
    const asset = await this.assetsService.update(id, updateAssetDto, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Asset updated successfully',
      data: asset,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    const result = await this.assetsService.remove(id, user.id);
    return {
      statusCode: HttpStatus.OK,
      ...result,
    };
  }
}