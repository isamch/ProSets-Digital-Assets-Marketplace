import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DownloadsService, DownloadResponse } from './downloads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Downloads')
@Controller('downloads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) { }

  @Get(':assetId')
  @ApiOperation({ summary: 'Get secure download URL for a purchased asset' })
  @ApiParam({ name: 'assetId', description: 'ID of the asset to download' })
  @ApiResponse({
    status: 200,
    description: 'Returns a presigned URL for downloading the file',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string' },
        expiresIn: { type: 'number' },
        fileName: { type: 'string' },
        fileSize: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'User has not purchased this asset' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getDownloadUrl(
    @Param('assetId') assetId: string,
    @Request() req,
  ): Promise<DownloadResponse> {
    return this.downloadsService.generateDownloadUrl(assetId, req.user.id);
  }
}
