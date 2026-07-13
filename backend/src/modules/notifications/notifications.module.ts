import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';
import { AutomatedNotificationsService } from './automated-notifications.service';
import { NotificationsTaskService } from './notifications-task.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    FcmService,
    AutomatedNotificationsService,
    NotificationsTaskService,
  ],
  exports: [NotificationsService, FcmService, AutomatedNotificationsService],
})
export class NotificationsModule {}
