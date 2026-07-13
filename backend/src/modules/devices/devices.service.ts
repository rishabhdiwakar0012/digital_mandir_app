import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Device, DeviceDocument } from '../../common/database/schemas';

interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  osVersion?: string;
  appVersion?: string;
  deviceModel?: string;
  fcmToken?: string;
}

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async upsertDevice(
    userId: string,
    deviceInfo: DeviceInfo,
    ip?: string,
  ): Promise<DeviceDocument> {
    const location = await this.getLocationFromIp(ip);

    // Build the $set payload — only include fcmToken if a non-null value was
    // provided. Overwriting with null would destroy tokens saved from a
    // previous successful registration whenever token retrieval fails
    // transiently (e.g. network error, Firebase not yet ready on cold start).
    const setFields: Record<string, any> = {
      platform: deviceInfo.platform,
      osVersion: deviceInfo.osVersion,
      appVersion: deviceInfo.appVersion,
      deviceModel: deviceInfo.deviceModel,
      ip,
      approxLocation: location,
      lastActiveAt: new Date(),
    };

    if (deviceInfo.fcmToken != null) {
      setFields.fcmToken = deviceInfo.fcmToken;
    }

    const device = await this.deviceModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        deviceId: deviceInfo.deviceId,
      },
      {
        $set: setFields,
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
          deviceId: deviceInfo.deviceId,
        },
      },
      { upsert: true, returnDocument: 'after' },
    );

    return device;
  }

  async updateFcmToken(userId: string, deviceId: string, fcmToken: string) {
    return this.deviceModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), deviceId },
      { $set: { fcmToken, lastActiveAt: new Date() } },
      { returnDocument: 'after' },
    );
  }

  async getUserDevices(userId: string) {
    return this.deviceModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ lastActiveAt: -1 })
      .lean();
  }

  async getDevicesByUserIds(userIds: string[]) {
    return this.deviceModel
      .find({
        userId: { $in: userIds.map((id) => new Types.ObjectId(id)) },
        fcmToken: { $ne: null },
      })
      .lean();
  }

  private async getLocationFromIp(ip?: string): Promise<{
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }> {
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      return {};
    }

    try {
      // Dynamic import to handle geoip-lite
      const geoip = await import('geoip-lite');
      const geo = geoip.default?.lookup?.(ip) || geoip.lookup?.(ip);
      if (geo) {
        return {
          city: geo.city || undefined,
          region: geo.region || undefined,
          country: geo.country || undefined,
          latitude: geo.ll?.[0],
          longitude: geo.ll?.[1],
        };
      }
    } catch {
      this.logger.warn(`Failed to lookup IP: ${ip}`);
    }

    return {};
  }
}
