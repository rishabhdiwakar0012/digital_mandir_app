import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContentDocument = HydratedDocument<Content>;

class I18nText {
  @Prop({ type: String, default: '' })
  en: string;

  @Prop({ type: String, default: '' })
  hi: string;

  @Prop({ type: String, default: '' })
  sa: string;
}

@Schema({ timestamps: true, collection: 'contents' })
export class Content {
  @Prop({
    type: String,
    required: true,
    enum: ['festival', 'god', 'special', 'custom'],
  })
  section: string;

  @Prop({ type: String, default: null })
  slug?: string;

  @Prop({ type: I18nText, required: true })
  title: I18nText;

  @Prop({ type: I18nText, default: {} })
  body: I18nText;

  @Prop({ type: String, default: null })
  imageUrl?: string;

  @Prop({ type: String, default: null })
  iconName?: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ContentSchema = SchemaFactory.createForClass(Content);

ContentSchema.index({ section: 1, isActive: 1, sortOrder: 1 });
ContentSchema.index({ updatedAt: -1 });
