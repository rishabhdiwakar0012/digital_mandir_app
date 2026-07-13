import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MantraDocument = HydratedDocument<Mantra>;

class I18nText {
  @Prop({ type: String, default: '' })
  en: string;

  @Prop({ type: String, default: '' })
  hi: string;

  @Prop({ type: String, default: '' })
  sa: string;
}

@Schema({ timestamps: true, collection: 'mantras' })
export class Mantra {
  @Prop({
    type: String,
    required: true,
    enum: ['festival', 'god', 'special', 'custom'],
  })
  category: string;

  @Prop({ type: Types.ObjectId, ref: 'Deity', default: null })
  deityId?: Types.ObjectId;

  @Prop({ type: String, default: null })
  festivalId?: string;

  @Prop({ type: I18nText, required: true })
  title: I18nText;

  @Prop({ type: I18nText, required: true })
  text: I18nText;

  @Prop({ type: I18nText, default: {} })
  description: I18nText;

  @Prop({ type: String, default: null })
  imageUrl?: string;

  @Prop({ type: String, default: null })
  audioUrl?: string;

  @Prop({ type: Number, default: 108 })
  beadCount: number;

  @Prop({ type: Number, default: 15 })
  coinsReward: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const MantraSchema = SchemaFactory.createForClass(Mantra);

MantraSchema.index({ category: 1, isActive: 1, sortOrder: 1 });
MantraSchema.index({ deityId: 1 });
MantraSchema.index({ festivalId: 1 });
MantraSchema.index({ updatedAt: -1 });
