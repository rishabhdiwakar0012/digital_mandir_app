import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import { Roles, Public } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes';
import {
  CreateMantraSchema,
  UpdateMantraSchema,
  CreateDeitySchema,
  UpdateDeitySchema,
  CreateContentSchema,
  UpdateContentSchema,
} from './schemas/content.schema';

// ─── Admin Content Controller ──────────────────────────────────

@ApiTags('Admin - Content')
@ApiBearerAuth()
@Controller('admin')
@Roles('admin', 'super_admin')
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  // ── Mantras ──

  @Post('mantras')
  @ApiOperation({ summary: 'Create a mantra' })
  async createMantra(
    @Body(new ZodValidationPipe(CreateMantraSchema)) data: any,
  ) {
    return this.contentService.createMantra(data);
  }

  @Get('mantras')
  @ApiOperation({ summary: 'List mantras (admin)' })
  async findMantras(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('category') category?: string,
    @Query('deityId') deityId?: string,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.contentService.findMantras(
      { page: +page, limit: Math.min(+limit, 100), sortBy, sortOrder },
      {
        category,
        deityId,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      },
    );
  }

  @Get('mantras/:id')
  @ApiOperation({ summary: 'Get mantra by ID' })
  async findMantra(@Param('id') id: string) {
    return this.contentService.findMantraById(id);
  }

  @Put('mantras/:id')
  @ApiOperation({ summary: 'Update mantra' })
  async updateMantra(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMantraSchema)) data: any,
  ) {
    return this.contentService.updateMantra(id, data);
  }

  @Delete('mantras/:id')
  @ApiOperation({ summary: 'Delete mantra (soft)' })
  async deleteMantra(@Param('id') id: string) {
    return this.contentService.deleteMantra(id);
  }

  // ── Deities ──

  @Post('deities')
  @ApiOperation({ summary: 'Create a deity' })
  async createDeity(@Body(new ZodValidationPipe(CreateDeitySchema)) data: any) {
    return this.contentService.createDeity(data);
  }

  @Get('deities')
  @ApiOperation({ summary: 'List deities (admin)' })
  async findDeities(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('isActive') isActive?: string,
  ) {
    return this.contentService.findDeities(
      { page: +page, limit: +limit },
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  @Put('deities/:id')
  @ApiOperation({ summary: 'Update deity' })
  async updateDeity(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDeitySchema)) data: any,
  ) {
    return this.contentService.updateDeity(id, data);
  }

  @Delete('deities/:id')
  @ApiOperation({ summary: 'Delete deity (soft)' })
  async deleteDeity(@Param('id') id: string) {
    return this.contentService.deleteDeity(id);
  }

  // ── Content sections ──

  @Post('content')
  @ApiOperation({ summary: 'Create content item' })
  async createContent(
    @Body(new ZodValidationPipe(CreateContentSchema)) data: any,
  ) {
    return this.contentService.createContent(data);
  }

  @Get('content')
  @ApiOperation({ summary: 'List content items (admin)' })
  async findContents(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('section') section?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.contentService.findContents(
      { page: +page, limit: +limit },
      {
        section,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      },
    );
  }

  @Put('content/:id')
  @ApiOperation({ summary: 'Update content item' })
  async updateContent(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateContentSchema)) data: any,
  ) {
    return this.contentService.updateContent(id, data);
  }

  @Delete('content/:id')
  @ApiOperation({ summary: 'Delete content item (soft)' })
  async deleteContent(@Param('id') id: string) {
    return this.contentService.deleteContent(id);
  }
}

// ─── Public Content Controller (Mobile App) ──────────────────

@ApiTags('Content')
@Controller('content')
export class PublicContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get('mantras')
  @ApiOperation({ summary: 'Get active mantras' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'deityId', required: false })
  @ApiQuery({ name: 'festivalId', required: false })
  async getMantras(
    @Query('category') category?: string,
    @Query('deityId') deityId?: string,
    @Query('festivalId') festivalId?: string,
  ) {
    return this.contentService.getActiveMantras(category, deityId, festivalId);
  }

  @Public()
  @Get('deities')
  @ApiOperation({ summary: 'Get active deities' })
  async getDeities() {
    return this.contentService.getActiveDeities();
  }

  @Public()
  @Get('sections/:section')
  @ApiOperation({ summary: 'Get content by section' })
  async getContentBySection(@Param('section') section: string) {
    return this.contentService.getActiveContentBySection(section);
  }

  @Public()
  @Get('sync-check')
  @ApiOperation({ summary: 'Get content version timestamps for offline sync' })
  async syncCheck() {
    return this.contentService.getSyncVersions();
  }
}
