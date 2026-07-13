import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpDocument = HydratedDocument<Otp>;

export type OtpType = 'phone' | 'email';

@Schema({ timestamps: true, collection: 'otps' })
export class Otp {
  @Prop({ type: String, enum: ['phone', 'email'], default: 'phone' })
  type: OtpType;

  @Prop({ type: String, sparse: true })
  phone?: string;

  @Prop({ type: String, sparse: true })
  email?: string;

  @Prop({ type: String, required: true })
  otp: string;

  @Prop({ type: Number, default: 0 })
  attempts: number;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  createdAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// TTL index — auto-cleanup expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ phone: 1, otp: 1 });
OtpSchema.index({ email: 1, otp: 1 });
