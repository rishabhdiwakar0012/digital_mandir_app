import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators';

@ApiTags('Admin - Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
@Roles('admin', 'super_admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard overview metrics' })
  async getDashboard() {
    return this.analyticsService.getDashboardOverview();
  }

  @Get('users')
  @ApiOperation({ summary: 'User growth over time' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getUserGrowth(
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('days') days?: number,
  ) {
    return this.analyticsService.getUserGrowth(
      period,
      days ? +days : undefined,
    );
  }

  @Get('jaap')
  @ApiOperation({ summary: 'Jaap activity over time' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getJaapActivity(@Query('days') days?: number) {
    return this.analyticsService.getJaapActivity(days ? +days : undefined);
  }

  @Get('devices')
  @ApiOperation({ summary: 'Device/OS breakdown' })
  async getDeviceBreakdown() {
    return this.analyticsService.getDeviceBreakdown();
  }

  @Get('content')
  @ApiOperation({ summary: 'Content analytics' })
  async getContentAnalytics() {
    return this.analyticsService.getContentAnalytics();
  }

  @Get('geography')
  @ApiOperation({ summary: 'Geographic distribution' })
  async getGeography() {
    return this.analyticsService.getGeographicDistribution();
  }

  @Get('age-groups')
  @ApiOperation({
    summary: 'Audience age group distribution based on date of birth',
  })
  async getAgeGroups() {
    return this.analyticsService.getAgeGroupDistribution();
  }

  @Get('deity-jaap')
  @ApiOperation({ summary: 'Top deities by total beads chanted' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDeityJaapAnalytics(@Query('limit') limit?: number) {
    return this.analyticsService.getDeityJaapAnalytics(limit ? +limit : undefined);
  }
}
