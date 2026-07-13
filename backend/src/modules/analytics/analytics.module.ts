import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { UsersModule } from '../users';
import { JaapModule } from '../jaap';
import { ContentModule } from '../content';
import { NotificationsModule } from '../notifications';

@Module({
  imports: [UsersModule, JaapModule, ContentModule, NotificationsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
