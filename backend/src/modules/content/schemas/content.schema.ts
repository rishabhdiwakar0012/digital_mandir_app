import { z } from 'zod';

const I18nTextSchema = z.object({
  en: z.string().max(5000).default(''),
  hi: z.string().max(5000).default(''),
  sa: z.string().max(5000).default(''),
});

// ── Mantra Schemas ──

export const CreateMantraSchema = z.object({
  category: z.enum(['festival', 'god', 'special', 'custom']),
  deityId: z.string().optional().nullable(),
  festivalId: z.string().optional().nullable(),
  title: I18nTextSchema,
  text: I18nTextSchema,
  description: I18nTextSchema.optional(),
  imageUrl: z.preprocess((val) => val === '' ? null : val, z.string().url().optional().nullable()),
  audioUrl: z.preprocess((val) => val === '' ? null : val, z.string().url().optional().nullable()),
  beadCount: z.number().int().min(0).max(10000).optional(),
  coinsReward: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const UpdateMantraSchema = CreateMantraSchema.partial();

// ── Deity Schemas ──

export const CreateDeitySchema = z.object({
  slug: z.string().min(1).max(100).trim(),
  name: I18nTextSchema,
  description: I18nTextSchema.optional(),
  imageUrl: z.preprocess((val) => val === '' ? null : val, z.string().url().optional().nullable()),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const UpdateDeitySchema = CreateDeitySchema.partial();

// ── Content Schemas ──

export const CreateContentSchema = z.object({
  section: z.enum(['festival', 'god', 'special', 'custom']),
  slug: z.string().max(100).optional().nullable(),
  title: I18nTextSchema,
  body: I18nTextSchema.optional(),
  imageUrl: z.preprocess((val) => val === '' ? null : val, z.string().url().optional().nullable()),
  iconName: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const UpdateContentSchema = CreateContentSchema.partial();
