import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AutomatedNotificationsService } from './automated-notifications.service';

/**
 * Scheduled notification tasks
 * Sends reminders and other automated notifications on a schedule
 */
@Injectable()
export class NotificationsTaskService {
  private readonly logger = new Logger(NotificationsTaskService.name);
  private isDailyReminderRunning = false;

  constructor(
    private readonly automatedNotifService: AutomatedNotificationsService,
  ) {}

  /**
   * Send daily reminders to users who haven't done their jaap today
   * Runs every day at 8:00 PM IST (2:30 PM UTC)
   */
  @Cron('30 14 * * *') // 2:30 PM UTC = 8:00 PM IST (UTC+5:30)
  async sendDailyReminders() {
    if (this.isDailyReminderRunning) {
      this.logger.warn('⚠️ Daily reminder task already running, skipping duplicate execution');
      return;
    }
    this.isDailyReminderRunning = true;
    this.logger.log('⏰ Starting daily reminder task...');
    try {
      await this.automatedNotifService.sendDailyReminders();
      this.logger.log('✅ Daily reminder task completed');
    } catch (error) {
      this.logger.error('❌ Daily reminder task failed:', error);
    } finally {
      this.isDailyReminderRunning = false;
    }
  }

  /**
   * Alternative time: Morning reminder at 6:00 AM IST
   * Uncomment to enable, but recommended to use only one daily reminder
   */
  // @Cron('30 0 * * *') // 12:30 AM UTC = 6:00 AM IST
  // async sendMorningReminders() {
  //   this.logger.log('🌅 Starting morning reminder task...');
  //   try {
  //     await this.automatedNotifService.sendDailyReminders();
  //     this.logger.log('✅ Morning reminder task completed');
  //   } catch (error) {
  //     this.logger.error('❌ Morning reminder task failed:', error);
  //   }
  // }
}
