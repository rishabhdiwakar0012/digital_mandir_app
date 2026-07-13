import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContentVersionDocument = HydratedDocument<ContentVersion>;

/**
 * Tracks the last update time per entity type.
 * Mobile app calls GET /api/content/sync-check and compares local timestamps.
 */
@Schema({ timestamps: true, collection: 'content_versions' })
export class ContentVersion {
  @Prop({
    type: String,
    required: true,
    enum: ['mantras', 'deities', 'content'],
  })
  entityType: string;

  @Prop({ type: Date, required: true, default: Date.now })
  lastUpdatedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ContentVersionSchema =
  SchemaFactory.createForClass(ContentVersion);

ContentVersionSchema.index({ entityType: 1 }, { unique: true });
