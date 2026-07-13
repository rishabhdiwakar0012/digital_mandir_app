import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
  Device,
  DeviceDocument,
  JaapSession,
  JaapSessionDocument,
} from '../../common/database/schemas';
import { UsersService } from '../users/users.service';
import { JaapService } from '../jaap/jaap.service';
import { ContentService } from '../content/content.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(JaapSession.name)
    private readonly jaapModel: Model<JaapSessionDocument>,
    private readonly usersService: UsersService,
    private readonly jaapService: JaapService,
    private readonly contentService: ContentService,
    private readonly notifService: NotificationsService,
  ) {}

  async getDashboardOverview() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(Date.now() - 7 * 86400000);
    const monthStart = new Date(Date.now() - 30 * 86400000);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      activeUsersToday,
      activeUsersWeek,
      activeUsersMonth,
      totalJaapSessions,
      jaapSessionsToday,
      mantrasCount,
      notifSentCount,
      popularMantras,
    ] = await Promise.all([
      this.usersService.getTotalCount(),
      this.usersService.getNewUsersCount(todayStart),
      this.usersService.getNewUsersCount(weekStart),
      this.usersService.getActiveUsersCount(todayStart),
      this.usersService.getActiveUsersCount(weekStart),
      this.usersService.getActiveUsersCount(monthStart),
      this.jaapService.getTotalSessions(),
      this.jaapService.getSessionsCount(todayStart),
      this.contentService.getMantrasCount(),
      this.notifService.getSentCount(),
      this.jaapService.getPopularMantras(5),
    ]);

    return {
      totalUsers,
      newUsersToday,
      newUsersWeek,
      activeUsers: {
        today: activeUsersToday,
        week: activeUsersWeek,
        month: activeUsersMonth,
      },
      totalJaapSessions,
      jaapSessionsToday,
      mantrasCount,
      notificationsSent: notifSentCount,
      popularMantras,
    };
  }

  async getUserGrowth(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days = 30,
  ) {
    const startDate = new Date(Date.now() - days * 86400000);

    let dateFormat: string;
    switch (period) {
      case 'weekly':
        dateFormat = '%Y-W%V';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    return this.userModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);
  }

  async getJaapActivity(days = 30) {
    return this.jaapService.getDailyActivity(days);
  }

  async getDeviceBreakdown() {
    return this.deviceModel.aggregate([
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $project: { platform: '$_id', count: 1, _id: 0 } },
    ]);
  }

  async getContentAnalytics() {
    this.logger.debug('getContentAnalytics: Fetching content counts and distribution');
    const [popularMantras, categoryDist, totalMantras, totalDeities] =
      await Promise.all([
        this.jaapService.getPopularMantras(10),
        this.jaapService.getCategoryDistribution(),
        this.contentService.getMantrasCount(),
        this.contentService.getDeitiesCount(),
      ]);

    return {
      popularMantras,
      categoryDistribution: categoryDist,
      totalMantras,
      totalDeities,
    };
  }

  async getGeographicDistribution() {
    return this.deviceModel.aggregate([
      {
        $match: {
          'approxLocation.country': { $exists: true, $nin: [null, ''] },
        },
      },
      {
        $group: {
          _id: '$approxLocation.country',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 100 },
      { $project: { countryCode: '$_id', count: 1, _id: 0 } },
    ]);
  }

  async getAgeGroupDistribution() {
    const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;
    const now = new Date();

    const [totalUsers, buckets] = await Promise.all([
      this.userModel.countDocuments({}),
      this.userModel.aggregate([
        // Normalise dateOfBirth to a Date regardless of whether it is stored
        // as a Date object or as an ISO string, and set to null if missing.
        {
          $addFields: {
            dobDate: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ['$dateOfBirth', null] },
                    { $ne: ['$dateOfBirth', ''] },
                  ],
                },
                then: { $toDate: '$dateOfBirth' },
                else: null,
              },
            },
          },
        },
        // Compute age in whole years; null when no valid DOB.
        {
          $addFields: {
            ageYears: {
              $cond: {
                if: { $ne: ['$dobDate', null] },
                then: {
                  $floor: {
                    $divide: [{ $subtract: [now, '$dobDate'] }, MS_PER_YEAR],
                  },
                },
                else: null,
              },
            },
          },
        },
        // Split into two facets: users with a computable age, and those without.
        {
          $facet: {
            withAge: [
              { $match: { ageYears: { $ne: null, $gte: 0 } } },
              {
                $bucket: {
                  groupBy: '$ageYears',
                  boundaries: [0, 8, 13, 18, 25, 35, 45, 55, 65, 200],
                  default: 'Other',
                  output: { count: { $sum: 1 } },
                },
              },
            ],
            noDob: [{ $match: { dobDate: null } }, { $count: 'count' }],
          },
        },
      ]),
    ]);

    const labelMap: Record<number, string> = {
      0: '0–7',
      8: '8–12',
      13: '13–17',
      18: '18–24',
      25: '25–34',
      35: '35–44',
      45: '45–54',
      55: '55–64',
      65: '65+',
    };

    const withAge: { _id: number | string; count: number }[] =
      buckets[0]?.withAge ?? [];
    const noDobCount: number = buckets[0]?.noDob?.[0]?.count ?? 0;

    const ordered = [0, 8, 13, 18, 25, 35, 45, 55, 65];
    const ageGroups = ordered.map((boundary) => {
      const found = withAge.find((b) => b._id === boundary);
      return { ageGroup: labelMap[boundary], count: found ? found.count : 0 };
    });

    // Always append "No DOB" so the chart always has a full picture.
    ageGroups.push({ ageGroup: 'No DOB', count: noDobCount });

    const usersWithDob = ageGroups
      .filter((g) => g.ageGroup !== 'No DOB')
      .reduce((s, g) => s + g.count, 0);

    return { ageGroups, totalUsers, usersWithDob };
  }

  async getDeityJaapAnalytics(limit = 10) {
    this.logger.debug(`getDeityJaapAnalytics: Fetching top deities (limit=${limit})`);
    
    const results = await this.jaapModel.aggregate([
      // Stage 1: Group by deityId and mantraId to collect volume
      {
        $group: {
          _id: {
            deityId: '$deityId',
            mantraId: '$mantraId'
          },
          totalBeads: { $sum: { $ifNull: ['$totalBeads', 0] } },
          totalSessions: { $sum: 1 },
          totalRounds: { $sum: { $ifNull: ['$rounds', 0] } },
          userIds: { $addToSet: '$userId' }
        }
      },
      // Stage 2: Join with mantras to get the mantra's deityId if session.deityId is missing
      {
        $lookup: {
          from: 'mantras',
          localField: '_id.mantraId',
          foreignField: '_id',
          as: 'mantra'
        }
      },
      { $unwind: { path: '$mantra', preserveNullAndEmptyArrays: true } },
      // Stage 3: Project the effective deityId
      {
        $project: {
          effectiveDeityId: { $ifNull: ['$_id.deityId', '$mantra.deityId'] },
          totalBeads: 1,
          totalSessions: 1,
          totalRounds: 1,
          userIds: 1
        }
      },
      // Stage 4: Filter out any that have no deity associated
      { $match: { effectiveDeityId: { $ne: null } } },
      // Stage 5: Re-group by the resolved deityId
      {
        $group: {
          _id: '$effectiveDeityId',
          totalBeads: { $sum: '$totalBeads' },
          totalSessions: { $sum: '$totalSessions' },
          totalRounds: { $sum: '$totalRounds' },
          allUserIds: { $push: '$userIds' }
        }
      },
      // Stage 6: Sort and limit
      { $sort: { totalBeads: -1, totalSessions: -1 } },
      { $limit: limit },
      // Stage 7: Lookup deity details
      {
        $lookup: {
          from: 'deities',
          localField: '_id',
          foreignField: '_id',
          as: 'deity'
        }
      },
      { $unwind: { path: '$deity', preserveNullAndEmptyArrays: true } },
      // Stage 8: Final projection
      {
        $project: {
          _id: 1,
          totalBeads: 1,
          totalSessions: 1,
          totalRounds: 1,
          uniqueUsers: {
            $size: {
              $reduce: {
                input: '$allUserIds',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this'] }
              }
            }
          },
          deityName: { $ifNull: ['$deity.name.en', 'Unknown Deity'] },
          deityNameHi: { $ifNull: ['$deity.name.hi', ''] },
          deityImage: { $ifNull: ['$deity.imageUrl', null] },
          deitySlug: { $ifNull: ['$deity.slug', ''] }
        }
      }
    ]);

    this.logger.debug(`getDeityJaapAnalytics: Found ${results.length} deities with jaap data`);

    // Fetch all active deities to ensure we show even those with 0 jaaps
    const allActiveDeities = await this.contentService.getActiveDeities();

    const mergedResults = allActiveDeities.map((deity) => {
      const deityIdStr = deity._id.toString();
      const aggregated = results.find((r: any) => r._id?.toString() === deityIdStr);

      return {
        _id: deity._id,
        totalBeads: aggregated?.totalBeads || 0,
        totalSessions: aggregated?.totalSessions || 0,
        totalRounds: aggregated?.totalRounds || 0,
        uniqueUsers: aggregated?.uniqueUsers || 0,
        deityName: deity.name?.en || 'Unknown Deity',
        deityNameHi: deity.name?.hi || '',
        deityImage: deity.imageUrl || null,
        deitySlug: deity.slug || '',
      };
    });

    // Sort the merged results by total beads descending
    mergedResults.sort((a, b) => b.totalBeads - a.totalBeads);

    // Always return ALL active deities (limit only applies to the aggregation above which fetches jaap data)
    // The list below the chart should always show all deities
    const finalResults = mergedResults;

    const totalBeadsAll = finalResults.reduce(
      (s: number, r: any) => s + (r.totalBeads || 0),
      0,
    );

    return finalResults.map((r: any) => ({
      ...r,
      sharePercent:
        totalBeadsAll > 0
          ? Math.round((r.totalBeads / totalBeadsAll) * 100)
          : 0,
    }));
  }
}
