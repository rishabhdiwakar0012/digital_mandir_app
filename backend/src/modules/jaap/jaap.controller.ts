import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JaapService } from './jaap.service';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/pipes';
import { RecordSessionSchema } from './schemas/jaap.schema';

@ApiTags('Jaap')
@ApiBearerAuth()
@Controller('jaap')
export class JaapController {
  constructor(private readonly jaapService: JaapService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Record a completed jaap session' })
  async recordSession(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(RecordSessionSchema)) data: any,
  ) {
    return this.jaapService.recordSession(userId, data);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get current user jaap history' })
  async getUserSessions(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.jaapService.getUserSessions(userId, {
      page: +page,
      limit: +limit,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get current user jaap stats' })
  async getUserStats(@CurrentUser('id') userId: string) {
    return this.jaapService.getUserStats(userId);
  }

  @Post('daily-checkin')
  @ApiOperation({ summary: 'Daily login check-in — increments streak and awards coins once per IST day' })
  async dailyCheckin(@CurrentUser('id') userId: string) {
    return this.jaapService.dailyCheckin(userId);
  }

  @Public()
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get global leaderboard' })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: ['all', 'week', 'month'],
  })
  async getLeaderboard(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('timeFilter') timeFilter?: string,
  ) {
    return this.jaapService.getLeaderboard(
      { page: +page, limit: +limit },
      timeFilter,
      false, // all users (including admins) appear on public leaderboard
    );
  }
}

@ApiTags('Admin - Jaap')
@ApiBearerAuth()
@Controller('admin/jaap')
@Roles('admin', 'super_admin')
export class AdminJaapController {
  constructor(private readonly jaapService: JaapService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get full leaderboard with details' })
  async getLeaderboard(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('timeFilter') timeFilter?: string,
  ) {
    return this.jaapService.getLeaderboard(
      { page: +page, limit: +limit },
      timeFilter,
      false, // all users appear so admin leaderboard matches the app leaderboard
    );
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get jaap analytics' })
  async getAnalytics() {
    const [totalSessions, popularMantras, categoryDist, dailyActivity] =
      await Promise.all([
        this.jaapService.getTotalSessions(),
        this.jaapService.getPopularMantras(),
        this.jaapService.getCategoryDistribution(),
        this.jaapService.getDailyActivity(),
      ]);

    return {
      totalSessions,
      popularMantras,
      categoryDistribution: categoryDist,
      dailyActivity,
    };
  }
}
