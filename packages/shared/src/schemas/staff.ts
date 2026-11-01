import { z } from 'zod';
import { phoneRegex } from './auth.js';

export const inviteStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    emailOrPhone: z.string().trim().refine(
      (val) => z.string().email().safeParse(val).success || phoneRegex.test(val),
      'Must be a valid email or Bangladeshi phone number'
    ),
    roleId: z.string().uuid('Invalid role ID'),
  })
  .strict();

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;

export const acceptInviteSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

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
