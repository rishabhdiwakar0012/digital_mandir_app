import { z } from 'zod';

export const AdminUpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().max(50).trim().optional().nullable(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional().nullable(),
  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .optional()
    .nullable(),
  avatar: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  roles: z.array(z.enum(['user', 'admin', 'super_admin'])).optional(),
  isActive: z.boolean().optional(),
  favoriteDeity: z.string().max(100).optional().nullable(),
});

export type AdminUpdateUserDto = z.infer<typeof AdminUpdateUserSchema>;
