import { z } from 'zod';

export const paymentProviderEnum = z.enum(['BKASH', 'SSLCOMMERZ']);
export type PaymentProviderType = z.infer<typeof paymentProviderEnum>;

export const initiatePaymentSchema = z
  .object({
    provider: paymentProviderEnum,
    amount: z.number().int().positive('Payment amount must be greater than zero'),
    invoiceId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    customerPhone: z.string().trim().min(6).max(20).optional(),
    customerName: z.string().trim().max(150).optional(),
    callbackUrl: z.string().url().optional(),
  })
  .strict();

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

export const paymentCallbackQuerySchema = z
  .object({
    paymentId: z.string().optional(),
    status: z.string().optional(),
    val_id: z.string().optional(),
    tran_id: z.string().optional(),
  })
  .passthrough();

export type PaymentCallbackQueryInput = z.infer<typeof paymentCallbackQuerySchema>;
