import { z } from 'zod';

export const phoneRegex = /^(?:\+8801|01)[3-9]\d{8}$/;

export const signupSchema = z
  .object({
    tenantName: z.string().trim().min(2, 'Store name must be at least 2 characters').max(255),
    name: z.string().trim().min(2, 'Owner name must be at least 2 characters').max(100),
    phone: z.string().trim().regex(phoneRegex, 'Enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)'),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),
    password: z.string().min(8, 'Password must be at least 8 characters long').max(100),
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

export const requestOtpSchema = z
  .object({
    phone: z.string().trim().regex(phoneRegex, 'Invalid Bangladeshi mobile number'),
  })
  .strict();

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z
  .object({
    phone: z.string().trim().regex(phoneRegex, 'Invalid Bangladeshi mobile number'),
    code: z.string().trim().length(6, 'OTP must be 6 digits'),
  })
  .strict();

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z
  .object({
    phone: z.string().trim().regex(phoneRegex, 'Invalid Bangladeshi mobile number'),
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    phone: z.string().trim().regex(phoneRegex, 'Invalid Bangladeshi mobile number'),
    code: z.string().trim().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long').max(100),
  })
  .strict();

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

