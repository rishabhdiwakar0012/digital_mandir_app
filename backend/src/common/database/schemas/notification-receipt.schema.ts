import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationReceiptDocument = HydratedDocument<NotificationReceipt>;

@Schema({ timestamps: true, collection: 'notification_receipts' })
export class NotificationReceipt {
  @Prop({ type: Types.ObjectId, ref: 'Notification', required: true })
  notificationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Device', default: null })
  deviceId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['pending', 'delivered', 'read', 'failed'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Date, default: null })
  readAt?: Date;

  @Prop({ type: String, default: null })
  failureReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationReceiptSchema =
  SchemaFactory.createForClass(NotificationReceipt);

NotificationReceiptSchema.index(
  { notificationId: 1, userId: 1 },
  { unique: true },
);
NotificationReceiptSchema.index({ userId: 1, status: 1 });
NotificationReceiptSchema.index({ notificationId: 1, status: 1 });
