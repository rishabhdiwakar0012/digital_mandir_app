import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import {
  JaapSession,
  JaapSessionDocument,
  User,
  UserDocument,
} from '../../common/database/schemas';
import { AutomatedNotificationsService } from '../notifications/automated-notifications.service';

interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class JaapService {
  private readonly logger = new Logger(JaapService.name);

  constructor(
    @InjectModel(JaapSession.name)
    private readonly jaapModel: Model<JaapSessionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly automatedNotifService: AutomatedNotificationsService,
  ) {}

  async recordSession(userId: string, data: Partial<JaapSession>) {
    this.logger.debug(
      `recordSession START userId=${userId}, data: ${JSON.stringify(data)}`,
    );

    const session = await this.jaapModel.create({
      ...data,
      userId: new Types.ObjectId(userId),
      mantraId:
        data.mantraId && Types.ObjectId.isValid(data.mantraId as any)
          ? new Types.ObjectId(data.mantraId as any)
          : undefined,
      deityId:
        data.deityId && Types.ObjectId.isValid(data.deityId as any)
          ? new Types.ObjectId(data.deityId as any)
          : undefined,
      deviceId:
        data.deviceId && Types.ObjectId.isValid(data.deviceId as any)
          ? new Types.ObjectId(data.deviceId as any)
          : undefined,
    });

    this.logger.debug(`recordSession CREATED session`);

    const user = await this.userModel.findById(userId);
    let streak = user?.currentStreak || 0;
    const today = new Date();

    // Use IST (UTC+5:30) for date calculations since users are in India
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(today.getTime() + IST_OFFSET_MS);
    const todayDateIST = new Date(
      Date.UTC(
        todayIST.getUTCFullYear(),
        todayIST.getUTCMonth(),
        todayIST.getUTCDate(),
      ),
    );

    if (user) {
      if (user.lastStreakUpdateAt) {
        const lastSession = new Date(user.lastStreakUpdateAt);
        const lastSessionIST = new Date(lastSession.getTime() + IST_OFFSET_MS);
        const lastSessionDateIST = new Date(
          Date.UTC(
            lastSessionIST.getUTCFullYear(),
            lastSessionIST.getUTCMonth(),
            lastSessionIST.getUTCDate(),
          ),
        );
        const diffTime = todayDateIST.getTime() - lastSessionDateIST.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          // Same day: keep current streak (already counted today)
        } else if (diffDays === 1) {
          streak += 1;
        } else {
          // Missed days: reset and start new streak at 1 (user is doing jaap now)
          streak = 1;
        }
      } else {
        streak = 1;
      }
    }

    // Update user aggregate stats
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: {
        totalCoins: data.coinsEarned || 0,
        totalJaapSessions: 1,
        totalBeads: data.totalBeads || 0,
        totalRounds: data.rounds || 0,
      },
      $set: {
        currentStreak: streak,
        lastStreakUpdateAt: today,
      },
    });

    // Send notifications for streak milestones and motivational messages
    try {
      // Check for streak milestones
      await this.automatedNotifService.notifyStreakMilestone(userId, streak);
      
      // Send motivational message based on session duration
      const sessionDurationMinutes = Math.floor((data.duration || 0) / 60);
      if (sessionDurationMinutes > 5) {
        await this.automatedNotifService.sendMotivationalMessage(
          userId,
          sessionDurationMinutes,
          data.totalBeads || 0,
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to send notifications after session: ${err.message}`);
    }

    return session;
  }

  async getUserSessions(userId: string, pagination: PaginationOptions) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const query = { userId: new Types.ObjectId(userId) };

    const [items, totalItems] = await Promise.all([
      this.jaapModel
        .find(query)
        .populate('mantraId')
        .populate('deityId')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.jaapModel.countDocuments(query),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async getUserStats(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      return {
        totalCoins: 0,
        totalJaapSessions: 0,
        totalBeads: 0,
        totalRounds: 0,
        streak: 0,
      };
    }

    let streak = user.currentStreak || 0;
    const today = new Date();

    // Use IST (UTC+5:30) for date calculations since users are in India
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(today.getTime() + IST_OFFSET_MS);
    const todayDateIST = new Date(
      Date.UTC(
        todayIST.getUTCFullYear(),
        todayIST.getUTCMonth(),
        todayIST.getUTCDate(),
      ),
    );

    if (user.lastStreakUpdateAt) {
      const lastSession = new Date(user.lastStreakUpdateAt);
      const lastSessionIST = new Date(lastSession.getTime() + IST_OFFSET_MS);
      const lastSessionDateIST = new Date(
        Date.UTC(
          lastSessionIST.getUTCFullYear(),
          lastSessionIST.getUTCMonth(),
          lastSessionIST.getUTCDate(),
        ),
      );
      const diffTime = todayDateIST.getTime() - lastSessionDateIST.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Reset streak if more than 1 day has passed since last jaap session
      if (diffDays > 1) {
        streak = 0;
      }
      // diffDays === 0 or 1: streak is still valid (today or yesterday)
    }

    const isNewDay =
      !user.lastLoginAt ||
      todayDateIST.getTime() !==
        (() => {
          const lastLogin = new Date(user.lastLoginAt);
          const lastLoginIST = new Date(lastLogin.getTime() + IST_OFFSET_MS);
          return new Date(
            Date.UTC(
              lastLoginIST.getUTCFullYear(),
              lastLoginIST.getUTCMonth(),
              lastLoginIST.getUTCDate(),
            ),
          ).getTime();
        })();

    // Only update lastLoginAt — never write currentStreak here.
    // recordSession() is the sole writer of currentStreak; writing it here
    // would race against recordSession and overwrite the correctly-incremented value.
    if (isNewDay) {
      await this.userModel.findByIdAndUpdate(userId, {
        $set: { lastLoginAt: today },
      });
    }

    return {
      totalCoins: user.totalCoins || 0,
      totalJaapSessions: user.totalJaapSessions || 0,
      totalBeads: user.totalBeads || 0,
      totalRounds: user.totalRounds || 0,
      streak,
      lastStreakUpdateAt: user.lastStreakUpdateAt ?? null,
    };
  }

  private calcStreakCoins(streak: number): number {
    if (streak <= 0) return 0;
    if (streak === 1) return 2;
    if (streak === 2) return 4;
    return Math.min(5 + (streak - 3), 30);
  }

  async dailyCheckin(
    userId: string,
  ): Promise<{ streak: number; coinsAwarded: number; alreadyCheckedIn: boolean }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return { streak: 0, coinsAwarded: 0, alreadyCheckedIn: false };
    }

    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const today = new Date();
    const todayIST = new Date(today.getTime() + IST_OFFSET_MS);
    const todayDateIST = new Date(
      Date.UTC(
        todayIST.getUTCFullYear(),
        todayIST.getUTCMonth(),
        todayIST.getUTCDate(),
      ),
    );

    let streak = user.currentStreak || 0;

    if (user.lastStreakUpdateAt) {
      const last = new Date(user.lastStreakUpdateAt);
      const lastIST = new Date(last.getTime() + IST_OFFSET_MS);
      const lastDateIST = new Date(
        Date.UTC(lastIST.getUTCFullYear(), lastIST.getUTCMonth(), lastIST.getUTCDate()),
      );
      const diffDays = Math.round(
        (todayDateIST.getTime() - lastDateIST.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        // Already visited today — no-op
        return { streak, coinsAwarded: 0, alreadyCheckedIn: true };
      } else if (diffDays === 1) {
        streak += 1;
      } else {
        // Missed one or more days — restart streak
        streak = 1;
      }
    } else {
      streak = 1;
    }

    const coinsAwarded = this.calcStreakCoins(streak);

    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { totalCoins: coinsAwarded },
      $set: { currentStreak: streak, lastStreakUpdateAt: today },
    });

    return { streak, coinsAwarded, alreadyCheckedIn: false };
  }

  async getLeaderboard(
    pagination: PaginationOptions,
    timeFilter?: string,
    excludeAdmins = false,
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    let dateFilter: any = {};
    if (timeFilter === 'week') {
      dateFilter = {
        lastLoginAt: { $gte: new Date(Date.now() - 7 * 86400000) },
      };
    } else if (timeFilter === 'month') {
      dateFilter = {
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 86400000) },
      };
    }

    const query: any = { isActive: true, ...dateFilter };
    if (excludeAdmins) {
      query.roles = { $nin: ['admin', 'super_admin'] };
    }

    // Enforce a max limit to prevent abuse
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const [items, totalItems] = await Promise.all([
      this.userModel
        .find(query)
        .select(
          'firstName lastName username avatar totalBeads totalRounds totalJaapSessions totalCoins lastLoginAt gender',
        )
        .sort({ totalBeads: -1, _id: 1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    const rankedItems = items.map((item, index) => ({
      ...item,
      id: item._id.toString(),
      rank: skip + index + 1,
    }));

    return {
      items: rankedItems,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  // ─── Admin analytics ──────────────────────────────────────

  async getTotalSessions(): Promise<number> {
    return this.jaapModel.countDocuments();
  }

  async getSessionsCount(since: Date): Promise<number> {
    return this.jaapModel.countDocuments({ completedAt: { $gte: since } });
  }

  async getPopularMantras(limit = 5) {
    return this.jaapModel.aggregate([
      {
        $group: {
          _id: '$mantraId',
          count: { $sum: 1 },
          totalBeads: { $sum: '$totalBeads' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'mantras',
          localField: '_id',
          foreignField: '_id',
          as: 'mantra',
        },
      },
      { $unwind: { path: '$mantra', preserveNullAndEmptyArrays: true } },
    ]);
  }

  async getCategoryDistribution() {
    return this.jaapModel.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalBeads: { $sum: '$totalBeads' },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  async getDailyActivity(days = 30) {
    const startDate = new Date(Date.now() - days * 86400000);
    return this.jaapModel.aggregate([
      { $match: { completedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
          },
          sessions: { $sum: 1 },
          totalBeads: { $sum: '$totalBeads' },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          date: '$_id',
          sessions: 1,
          totalBeads: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}
