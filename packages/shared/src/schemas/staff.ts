import { z } from 'zod';
import { phoneRegex } from './auth.js';

export const createStaffSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    phone: z.string().trim().regex(phoneRegex, 'Invalid Bangladeshi mobile number'),
    email: z.string().trim().email('Invalid email address').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    roleId: z.string().uuid('Invalid role ID'),
  })
  .strict();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffRoleSchema = z
  .object({
    roleId: z.string().uuid(),
  })
  .strict();

export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;

export const updateRolePermissionsSchema = z
  .object({
    permissionIds: z.array(z.string().uuid()),
  })
  .strict();

export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
