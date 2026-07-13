import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  User,
  UserDocument,
  JaapSession,
  JaapSessionDocument,
} from '../../common/database/schemas';
import { NotificationsService } from './notifications.service';

/**
 * Automated Notifications Service
 * 
 * Handles automatic push/in-app notifications triggered by user events:
 * - Streak broken (user missed days)
 * - Streak milestones (7, 30, 100, 365 days)
 * - Daily reminders (if no jaap today)
 * - Motivational messages for consistency
 */
@Injectable()
export class AutomatedNotificationsService {
  private readonly logger = new Logger(AutomatedNotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notifModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(JaapSession.name)
    private readonly jaapModel: Model<JaapSessionDocument>,
    private readonly notifService: NotificationsService,
  ) {}

  async notifyStreakBroken(userId: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId).select('preferences');
      if (!user) return;

      const lang = user.preferences?.language || 'en';
      const isHindi = lang === 'hi';

      const notification = await this.notifModel.create({
        title: {
          en: '😔 Streak Broken',
          hi: '😔 आपकी स्ट्रीक टूट गई',
          sa: '😔 Streak Broken',
        },
        body: {
          en: 'You missed a day. Start fresh today and rebuild your streak!',
          hi: 'आप एक दिन मिस कर गए। आज से फिर शुरुआत करें और अपनी स्ट्रीक को फिर से बनाएँ!',
          sa: 'You missed a day. Start fresh today and rebuild your streak!',
        },
        type: 'push',
        targetAudience: 'specific_users',
        targetUserIds: [new Types.ObjectId(userId)],
        category: 'streak_broken',
        data: {
          type: 'streak_broken',
          userId: userId,
        },
        sentBy: undefined,
      });

      await this.notifService.send(notification._id?.toString() || '');
      this.logger.log(`✅ Streak broken notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send streak broken notification: ${(error as Error).message}`,
      );
    }
  }

  async notifyStreakMilestone(
    userId: string,
    currentStreak: number,
  ): Promise<void> {
    try {
      const milestones = [7, 14, 21, 30, 50, 100, 365];
      if (!milestones.includes(currentStreak)) return;

      const user = await this.userModel.findById(userId).select('preferences');
      const lang = user?.preferences?.language || 'en';

      const titles = {
        7: { en: '🔥 One Week Streak!', hi: '🔥 एक सप्ताह की स्ट्रीक!' },
        14: { en: '🔥 Two Weeks Strong!', hi: '🔥 दो सप्ताह की मजबूत स्ट्रीक!' },
        21: { en: '🔥 Three Weeks!', hi: '🔥 तीन सप्ताह की स्ट्रीक!' },
        30: { en: '🔥 One Month!', hi: '🔥 एक महीने की स्ट्रीक!' },
        50: { en: '🔥 50 Day Streak!', hi: '🔥 50 दिन की स्ट्रीक!' },
        100: { en: '🔥 100 Day Challenge!', hi: '🔥 100 दिन की स्ट्रीक!' },
        365: { en: '🔥 One Year!', hi: '🔥 एक साल की स्ट्रीक!' },
      };

      const bodies = {
        7: {
          en: 'Your dedication shines! Keep going for greater heights.',
          hi: 'आपका समर्पण चमक रहा है! इसी तरह आगे बढ़ें।',
        },
        14: {
          en: 'Amazing consistency! You are building a habit.',
          hi: 'अद्भुत निरंतरता! आप एक आदत बना रहे हैं।',
        },
        21: {
          en: 'The habit is forming! Stay strong for the final stretch.',
          hi: 'आदत बन रही है! अंतिम दूरी तक मजबूत रहें।',
        },
        30: {
          en: 'One month of unbreakable commitment! You are inspiring.',
          hi: 'एक महीने की अटूट प्रतिबद्धता! आप प्रेरणादायक हैं।',
        },
        50: {
          en: 'Incredible! 50 days of spiritual practice. You are a true seeker.',
          hi: 'अविश्वास्य! 50 दिन की आध्यात्मिक साधना। आप सच्चे साधक हैं।',
        },
        100: {
          en: 'Century achieved! 100 days of unwavering devotion. You are extraordinary.',
          hi: 'शताब्दी पूरी! 100 दिन की अटल भक्ति। आप असाधारण हैं।',
        },
        365: {
          en: 'One full year of dedication! You have transformed your life. Bow to your persistence.',
          hi: 'पूरे एक साल की भक्ति! आपने अपना जीवन बदल दिया। अपनी कृतज्ञता को स्वीकार करें।',
        },
      };

      const notification = await this.notifModel.create({
        title: titles[currentStreak] || {
          en: `🔥 ${currentStreak} Day Streak!`,
          hi: `🔥 ${currentStreak} दिन की स्ट्रीक!`,
        },
        body:
          bodies[currentStreak] ||
          {
            en: `You have maintained a ${currentStreak} day streak! Amazing work!`,
            hi: `आपने ${currentStreak} दिन की स्ट्रीक बनाई है! बहुत शानदार!`,
          },
        type: 'push',
        targetAudience: 'specific_users',
        targetUserIds: [new Types.ObjectId(userId)],
        category: 'streak_milestone',
        data: {
          type: 'streak_milestone',
          userId: userId,
          milestone: currentStreak.toString(),
        },
        sentBy: undefined,
      });

      await this.notifService.send(notification._id?.toString() || '');
      this.logger.log(
        `✅ Streak milestone notification sent to user ${userId} for ${currentStreak} days`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send milestone notification: ${(error as Error).message}`,
      );
    }
  }

  async sendDailyReminders(): Promise<void> {
    try {
      // Get all active users
      const users = await this.userModel
        .find({ isActive: true })
        .select('_id preferences')
        .lean();

      const now = new Date();
      const todayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );

      for (const user of users) {
        // Check if user has any session today
        const sessionsToday = await this.jaapModel.countDocuments({
          userId: user._id,
          completedAt: { $gte: todayStart },
        });

        if (sessionsToday === 0) {
          const lang = (user.preferences as any)?.language || 'en';
          await this.sendDailyReminder(user._id.toString(), lang);
        }
      }

      this.logger.log(`✅ Daily reminders sent to users who haven't practiced today`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send daily reminders: ${(error as Error).message}`,
      );
    }
  }

  private async sendDailyReminder(userId: string, language: string): Promise<void> {
    try {
      const lang = language || 'en';
      // Use IST (UTC+5:30) to determine time of day, since the server runs in UTC
      const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
      const hour = nowIST.getUTCHours();

      // Different messages based on time of day
      let titleKey: 'morning' | 'afternoon' | 'evening';
      if (hour < 12) titleKey = 'morning';
      else if (hour < 17) titleKey = 'afternoon';
      else titleKey = 'evening';

      const titles = {
        morning: {
          en: '🙏 Good Morning!',
          hi: '🙏 सुप्रभात!',
        },
        afternoon: {
          en: '🔔 Good Afternoon',
          hi: '🔔 शुभ दोपहर',
        },
        evening: {
          en: '🌙 Good Evening',
          hi: '🌙 शुभ संध्या',
        },
      };

      const bodies = {
        morning: {
          en: 'Start your day with a spiritual practice. Do your jaap now!',
          hi: 'अपने दिन की शुरुआत आध्यात्मिक साधना के साथ करें। अभी अपना जाप करें!',
        },
        afternoon: {
          en: 'Need a midday boost? Practice your jaap and feel centered.',
          hi: 'दोपहर को एक बूस्ट की जरूरत है? अपना जाप करें और केंद्रित अनुभव करें।',
        },
        evening: {
          en: "Don't forget your daily jaap! Dedicate some time to your practice.",
          hi: 'अपने दैनिक जाप को न भूलें! अपनी साधना के लिए कुछ समय दें।',
        },
      };

      const notification = await this.notifModel.create({
        title: titles[titleKey],
        body: bodies[titleKey],
        type: 'push',
        targetAudience: 'specific_users',
        targetUserIds: [new Types.ObjectId(userId)],
        category: 'mala_reminder',
        data: {
          type: 'mala_reminder',
          userId: userId,
        },
        sentBy: undefined,
      });

      await this.notifService.send(notification._id?.toString() || '');
    } catch (error) {
      this.logger.error(
        `❌ Failed to send daily reminder to user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  async sendMotivationalMessage(
    userId: string,
    sessionDurationMinutes: number,
    beadsCount: number,
  ): Promise<void> {
    try {
      let messageType = 'normal';
      if (sessionDurationMinutes > 30) messageType = 'excellent';
      else if (sessionDurationMinutes > 15) messageType = 'good';
      else if (sessionDurationMinutes > 5) messageType = 'decent';

      if (messageType === 'normal') return; // Only send for good/excellent sessions

      const messages = {
        decent: {
          title: {
            en: '✨ Good Start!',
            hi: '✨ अच्छी शुरुआत!',
          },
          body: {
            en: 'Every moment of practice counts. Keep going!',
            hi: 'साधना का हर पल महत्वपूर्ण है। आगे बढ़ते रहें!',
          },
        },
        good: {
          title: {
            en: '🌟 Great Session!',
            hi: '🌟 शानदार सत्र!',
          },
          body: {
            en: `You practiced for ${sessionDurationMinutes} minutes. Well done!`,
            hi: `आपने ${sessionDurationMinutes} मिनट तक साधना की। बहुत अच्छा!`,
          },
        },
        excellent: {
          title: {
            en: '🔥 Excellent Practice!',
            hi: '🔥 उत्कृष्ट साधना!',
          },
          body: {
            en: `Amazing dedication! ${sessionDurationMinutes} minutes and counting. You are unstoppable!`,
            hi: `अद्भुत समर्पण! ${sessionDurationMinutes} मिनट और भी। आप अपराजेय हैं!`,
          },
        },
      };

      const msg = messages[messageType as keyof typeof messages];
      if (!msg) return;

      const notification = await this.notifModel.create({
        title: msg.title,
        body: msg.body,
        type: 'push',
        targetAudience: 'specific_users',
        targetUserIds: [new Types.ObjectId(userId)],
        category: 'motivational',
        data: {
          type: 'motivational',
          userId: userId,
          sessionDuration: sessionDurationMinutes.toString(),
        },
        sentBy: undefined,
      });

      await this.notifService.send(notification._id?.toString() || '');
      this.logger.log(
        `✅ Motivational notification sent to user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send motivational message: ${(error as Error).message}`,
      );
    }
  }
}
