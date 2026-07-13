import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeityDocument = HydratedDocument<Deity>;

/** i18n text field shape */
class I18nText {
  @Prop({ type: String, default: '' })
  en: string;

  @Prop({ type: String, default: '' })
  hi: string;

  @Prop({ type: String, default: '' })
  sa: string;
}

@Schema({ timestamps: true, collection: 'deities' })
export class Deity {
  @Prop({ type: String, required: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: I18nText, required: true })
  name: I18nText;

  @Prop({ type: I18nText, default: {} })
  description: I18nText;

  @Prop({ type: String, default: null })
  imageUrl?: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export const DeitySchema = SchemaFactory.createForClass(Deity);

DeitySchema.index({ slug: 1 }, { unique: true });
DeitySchema.index({ isActive: 1, sortOrder: 1 });
