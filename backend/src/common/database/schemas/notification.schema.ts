import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

class I18nText {
  @Prop({ type: String, default: '' })
  en: string;

  @Prop({ type: String, default: '' })
  hi: string;

  @Prop({ type: String, default: '' })
  sa: string;
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: I18nText, required: true })
  title: I18nText;

  @Prop({ type: I18nText, required: true })
  body: I18nText;

  @Prop({
    type: String,
    enum: ['push', 'in-app', 'both'],
    default: 'both',
  })
  type: string;

  @Prop({
    type: String,
    enum: ['all', 'specific_users', 'role_based'],
    default: 'all',
  })
  targetAudience: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  targetUserIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  targetRoles: string[];

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop({
    type: String,
    enum: ['custom', 'mala_reminder', 'streak_reminder', 'festival', 'daily_prayer', 'streak_broken', 'streak_milestone'],
    default: 'custom',
  })
  category: string;

  @Prop({ type: Date, default: null })
  sentAt?: Date;

  @Prop({
    type: String,
    enum: ['draft', 'sending', 'sent', 'failed'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  totalRecipients: number;

  @Prop({ type: Number, default: 0 })
  deliveredCount: number;

  @Prop({ type: Number, default: 0 })
  failedCount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  sentBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ status: 1, createdAt: -1 });
NotificationSchema.index({ sentBy: 1 });
