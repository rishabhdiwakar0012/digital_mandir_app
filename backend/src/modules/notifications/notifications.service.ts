import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationReceipt,
  NotificationReceiptDocument,
  User,
  UserDocument,
  Device,
  DeviceDocument,
} from '../../common/database/schemas';
import { FcmService } from './fcm.service';

interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notifModel: Model<NotificationDocument>,
    @InjectModel(NotificationReceipt.name)
    private readonly receiptModel: Model<NotificationReceiptDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    private readonly fcmService: FcmService,
  ) {}

  async create(data: Partial<Notification>, sentById: string) {
    const notification = await this.notifModel.create({
      ...data,
      sentBy: new Types.ObjectId(sentById),
      targetUserIds: data.targetUserIds?.map(
        (id) => new Types.ObjectId(id as any),
      ),
    });

    return notification;
  }

  async send(notificationId: string): Promise<any> {
    const notification = await this.notifModel.findById(notificationId);
    if (!notification) throw new NotFoundException('Notification not found');

    notification.status = 'sending';
    await notification.save();

    try {
      // Determine target users
      let targetUserIds: Types.ObjectId[] = [];

      if (notification.targetAudience === 'all') {
        const users = await this.userModel
          .find({ isActive: true })
          .select('_id')
          .lean();
        targetUserIds = users.map((u) => u._id);
      } else if (notification.targetAudience === 'specific_users') {
        targetUserIds = notification.targetUserIds;
      } else if (notification.targetAudience === 'role_based') {
        const users = await this.userModel
          .find({ roles: { $in: notification.targetRoles }, isActive: true })
          .select('_id')
          .lean();
        targetUserIds = users.map((u) => u._id);
      }

      // Get FCM tokens for all target users' devices
      const devices = await this.deviceModel
        .find({
          userId: { $in: targetUserIds },
          fcmToken: { $ne: null },
        })
        .lean();

      const fcmTokens = [
        ...new Set(
          devices.map((d) => d.fcmToken).filter((t): t is string => !!t),
        ),
      ];

      // For push notifications totalRecipients = number of devices with push
      // tokens (not user count), so that delivered + failed == totalRecipients
      // and the admin panel shows accurate numbers.
      // For in-app-only, use the user count since no device tokens are involved.
      if (notification.type === 'push') {
        notification.totalRecipients = fcmTokens.length;
      } else if (notification.type === 'in-app') {
        notification.totalRecipients = targetUserIds.length;
      } else {
        // 'both' — show user count (in-app covers all users)
        notification.totalRecipients = targetUserIds.length;
      }

      // Send via FCM if type includes push
      if (notification.type === 'push' || notification.type === 'both') {
        if (fcmTokens.length > 0) {
          // Send in batches of 500
          const batchSize = 500;
          let totalSuccess = 0;
          let totalFailure = 0;

          for (let i = 0; i < fcmTokens.length; i += batchSize) {
            const batch = fcmTokens.slice(i, i + batchSize);
            const result = await this.fcmService.sendToMultiple(
              batch,
              {
                title: notification.title.en || notification.title.hi,
                body: notification.body.en || notification.body.hi,
              },
              {
                ...(notification.data as Record<string, string>),
                // Include category so the frontend can route/handle the notification
                type: notification.category || 'custom',
              },
            );
            totalSuccess += result.successCount;
            totalFailure += result.failureCount;
          }

          notification.deliveredCount = totalSuccess;
          notification.failedCount = totalFailure;
        } else {
          this.logger.warn(
            `Notification ${notification._id}: 0 devices have push tokens out of ${targetUserIds.length} targeted users`,
          );
        }
      }

      // Create receipts for in-app notifications
      if (notification.type === 'in-app' || notification.type === 'both') {
        const receipts = targetUserIds.map((userId) => ({
          notificationId: notification._id,
          userId,
          status: 'pending',
        }));

        if (receipts.length > 0) {
          await this.receiptModel.insertMany(receipts, { ordered: false });
        }
      }

      notification.status = 'sent';
      notification.sentAt = new Date();
      await notification.save();

      return notification;
    } catch (error) {
      notification.status = 'failed';
      await notification.save();
      throw error;
    }
  }

  async createAndSend(data: Partial<Notification>, sentById: string) {
    const notification = await this.create(data, sentById);
    return this.send(notification._id.toString());
  }

  async findAll(pagination: PaginationOptions) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.notifModel
        .find()
        .populate('sentBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notifModel.countDocuments(),
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

  async findById(id: string) {
    const notification = await this.notifModel
      .findById(id)
      .populate('sentBy', 'firstName lastName email')
      .lean();

    if (!notification) throw new NotFoundException('Notification not found');

    // Get delivery stats
    const stats = await this.receiptModel.aggregate([
      { $match: { notificationId: new Types.ObjectId(id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return { ...notification, deliveryStats: stats };
  }

  async getSentCount(): Promise<number> {
    return this.notifModel.countDocuments({ status: 'sent' });
  }
}
