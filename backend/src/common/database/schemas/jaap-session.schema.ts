import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type JaapSessionDocument = HydratedDocument<JaapSession>;

@Schema({ timestamps: true, collection: 'jaap_sessions' })
export class JaapSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Mantra', default: null })
  mantraId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Deity', default: null })
  deityId?: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['festival', 'god', 'special', 'custom'],
  })
  category: string;

  @Prop({ type: Number, required: true, min: 0 })
  rounds: number;

  @Prop({ type: Number, required: true, min: 0 })
  totalBeads: number;

  @Prop({ type: Number, required: true, min: 0 })
  duration: number; // seconds

  @Prop({ type: Number, default: 0 })
  coinsEarned: number;

  @Prop({ type: Number, default: 100, min: 0, max: 100 })
  performance: number;

  @Prop({ type: Date, default: () => new Date() })
  completedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Device', default: null })
  deviceId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const JaapSessionSchema = SchemaFactory.createForClass(JaapSession);

JaapSessionSchema.index({ userId: 1, completedAt: -1 });
JaapSessionSchema.index({ category: 1 });
JaapSessionSchema.index({ completedAt: -1 });
JaapSessionSchema.index({ mantraId: 1 });
JaapSessionSchema.index({ deityId: 1 });
