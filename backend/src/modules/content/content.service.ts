import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Mantra,
  MantraDocument,
  Deity,
  DeityDocument,
  Content,
  ContentDocument,
  ContentVersion,
  ContentVersionDocument,
} from '../../common/database/schemas';
import { UploadService } from '../upload/upload.service';

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectModel(Mantra.name)
    private readonly mantraModel: Model<MantraDocument>,
    @InjectModel(Deity.name) private readonly deityModel: Model<DeityDocument>,
    @InjectModel(Content.name)
    private readonly contentModel: Model<ContentDocument>,
    @InjectModel(ContentVersion.name)
    private readonly versionModel: Model<ContentVersionDocument>,
    private readonly uploadService: UploadService,
  ) {}

  // ─── Mantras ────────────────────────────────────────────────

  async createMantra(data: Partial<Mantra>) {
    const mantra = await this.mantraModel.create(data);
    await this.touchVersion('mantras');
    return mantra;
  }

  async updateMantra(id: string, data: Partial<Mantra>) {
    // Fetch existing record so we can clean up replaced files from R2
    const existing = await this.mantraModel.findById(id).lean();
    if (!existing) throw new NotFoundException('Mantra not found');

    const mantra = await this.mantraModel
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .lean();
    if (!mantra) throw new NotFoundException('Mantra not found');

    // If the recitation audio URL changed, delete the old file from R2 (fire-and-forget)
    if (
      data.audioUrl !== undefined &&
      existing.audioUrl &&
      existing.audioUrl !== data.audioUrl
    ) {
      const oldKey = existing.audioUrl.split('/').pop();
      if (oldKey) {
        this.uploadService
          .delete(oldKey)
          .catch((err) =>
            this.logger.warn(`Failed to delete old audio from R2: ${oldKey} — ${err?.message}`),
          );
      }
    }

    // If the image URL changed, delete the old image from R2 (fire-and-forget)
    if (
      data.imageUrl !== undefined &&
      existing.imageUrl &&
      existing.imageUrl !== data.imageUrl
    ) {
      const oldKey = existing.imageUrl.split('/').pop();
      if (oldKey) {
        this.uploadService
          .delete(oldKey)
          .catch((err) =>
            this.logger.warn(`Failed to delete old image from R2: ${oldKey} — ${err?.message}`),
          );
      }
    }

    await this.touchVersion('mantras');
    return mantra;
  }

  async deleteMantra(id: string) {
    const mantra = await this.mantraModel.findByIdAndDelete(id).lean();
    if (!mantra) throw new NotFoundException('Mantra not found');

    // Delete associated files from R2 (fire-and-forget)
    if (mantra.audioUrl) {
      const key = mantra.audioUrl.split('/').pop();
      if (key) {
        this.uploadService
          .delete(key)
          .catch((err) =>
            this.logger.warn(`Failed to delete audio from R2 on mantra delete: ${key} — ${err?.message}`),
          );
      }
    }
    if (mantra.imageUrl) {
      const key = mantra.imageUrl.split('/').pop();
      if (key) {
        this.uploadService
          .delete(key)
          .catch((err) =>
            this.logger.warn(`Failed to delete image from R2 on mantra delete: ${key} — ${err?.message}`),
          );
      }
    }

    await this.touchVersion('mantras');
    return { message: 'Mantra deleted' };
  }

  async findMantras(
    pagination: PaginationOptions,
    filters: { category?: string; deityId?: string; isActive?: boolean },
  ) {
    const { page, limit, sortBy = 'sortOrder', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filters.category) query.category = filters.category;
    if (filters.deityId) query.deityId = new Types.ObjectId(filters.deityId);
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const [items, totalItems] = await Promise.all([
      this.mantraModel
        .find(query)
        .populate('deityId')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.mantraModel.countDocuments(query),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findMantraById(id: string) {
    const mantra = await this.mantraModel
      .findById(id)
      .populate('deityId')
      .lean();
    if (!mantra) throw new NotFoundException('Mantra not found');
    return mantra;
  }

  // ─── Public: Mobile app endpoints ──────────────────────────

  async getActiveMantras(
    category?: string,
    deityId?: string,
    festivalId?: string,
  ) {
    const query: Record<string, any> = { isActive: true };
    if (category) query.category = category;
    if (deityId) query.deityId = new Types.ObjectId(deityId);
    if (festivalId) query.festivalId = festivalId;

    return this.mantraModel
      .find(query)
      .populate('deityId')
      .sort({ sortOrder: 1 })
      .lean();
  }

  // ─── Deities ────────────────────────────────────────────────

  async createDeity(data: Partial<Deity>) {
    const deity = await this.deityModel.create(data);
    await this.touchVersion('deities');
    return deity;
  }

  async updateDeity(id: string, data: Partial<Deity>) {
    const deity = await this.deityModel
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .lean();
    if (!deity) throw new NotFoundException('Deity not found');
    await this.touchVersion('deities');
    return deity;
  }

  async deleteDeity(id: string) {
    const deity = await this.deityModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: 'after' },
    );
    if (!deity) throw new NotFoundException('Deity not found');
    await this.touchVersion('deities');
    return { message: 'Deity deleted' };
  }

  async findDeities(pagination: PaginationOptions, isActive?: boolean) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (isActive !== undefined) query.isActive = isActive;

    const [items, totalItems] = await Promise.all([
      this.deityModel
        .find(query)
        .sort({ sortOrder: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.deityModel.countDocuments(query),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async getActiveDeities() {
    return this.deityModel
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
  }

  // ─── Content Sections ──────────────────────────────────────

  async createContent(data: Partial<Content>) {
    const content = await this.contentModel.create(data);
    await this.touchVersion('content');
    return content;
  }

  async updateContent(id: string, data: Partial<Content>) {
    const content = await this.contentModel
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .lean();
    if (!content) throw new NotFoundException('Content not found');
    await this.touchVersion('content');
    return content;
  }

  async deleteContent(id: string) {
    const content = await this.contentModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: 'after' },
    );
    if (!content) throw new NotFoundException('Content not found');
    await this.touchVersion('content');
    return { message: 'Content deleted' };
  }

  async findContents(
    pagination: PaginationOptions,
    filters: { section?: string; isActive?: boolean },
  ) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filters.section) query.section = filters.section;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    const [items, totalItems] = await Promise.all([
      this.contentModel
        .find(query)
        .sort({ sortOrder: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.contentModel.countDocuments(query),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async getActiveContentBySection(section: string) {
    return this.contentModel
      .find({ section, isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
  }

  // ─── Sync Check ─────────────────────────────────────────────

  async getSyncVersions() {
    const versions = await this.versionModel.find().lean();
    const result: Record<string, string> = {};
    for (const v of versions) {
      result[v.entityType] = v.lastUpdatedAt.toISOString();
    }
    return result;
  }

  // ─── Counts ────────────────────────────────────────────────

  async getMantrasCount(): Promise<number> {
    return this.mantraModel.countDocuments({ isActive: true });
  }

  async getDeitiesCount(): Promise<number> {
    return this.deityModel.countDocuments({ isActive: true });
  }

  // ─── Helpers ────────────────────────────────────────────────

  private async touchVersion(entityType: string) {
    await this.versionModel.findOneAndUpdate(
      { entityType },
      { lastUpdatedAt: new Date() },
      { upsert: true },
    );
  }
}
