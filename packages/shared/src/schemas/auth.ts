import { z } from 'zod';

export const phoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;

export const signupSchema = z
  .object({
    tenantName: z.string().trim().min(2).max(255),
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(phoneRegex, 'Invalid Bangladeshi mobile number'),
    email: z.string().trim().email().optional(),
    password: z.string().min(8).max(100),
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z
  .object({
    phone: z.string().trim().regex(phoneRegex, 'Invalid Bangladeshi mobile number'),
    password: z.string().min(1),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
