import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({ timestamps: true, collection: 'devices' })
export class Device {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  deviceId: string;

  @Prop({ type: String, enum: ['ios', 'android', 'web'], required: true })
  platform: string;

  @Prop({ type: String, default: null })
  osVersion?: string;

  @Prop({ type: String, default: null })
  appVersion?: string;

  @Prop({ type: String, default: null })
  deviceModel?: string;

  @Prop({ type: String, default: null })
  fcmToken?: string;

  @Prop({ type: String, default: null })
  ip?: string;

  @Prop({
    type: {
      city: { type: String, default: null },
      region: { type: String, default: null },
      country: { type: String, default: null },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    default: {},
  })
  approxLocation: {
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };

  @Prop({ type: Date, default: Date.now })
  lastActiveAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Compound index for upsert
DeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
DeviceSchema.index({ fcmToken: 1 }, { sparse: true });
DeviceSchema.index({ lastActiveAt: -1 });
