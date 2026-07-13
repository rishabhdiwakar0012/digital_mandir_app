import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true, collection: 'sessions' })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Device', default: null })
  deviceId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  refreshToken: string;

  @Prop({ type: String, default: null })
  ip?: string;

  @Prop({ type: String, default: null })
  userAgent?: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// TTL index — automatically remove expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ refreshToken: 1 }, { unique: true });
SessionSchema.index({ userId: 1 });
