import { z } from 'zod';

export const checkoutItemSchema = z
  .object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive('Item quantity must be greater than zero'),
    discount: z.number().int().nonnegative().default(0),
  })
  .strict();

export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;

export const paymentInputSchema = z
  .object({
    method: z.enum(['CASH', 'BKASH', 'NAGAD', 'CARD', 'CREDIT_BAKI']),
    amount: z.number().int().nonnegative('Payment amount cannot be negative'),
    reference: z.string().trim().max(100).optional(),
  })
  .strict();

export type PaymentInput = z.infer<typeof paymentInputSchema>;

export const createSaleSchema = z
  .object({
    customerId: z.string().uuid().optional(),
    items: z.array(checkoutItemSchema).min(1, 'Sale must include at least one item'),
    discount: z.number().int().nonnegative().default(0),
    payments: z.array(paymentInputSchema).min(1, 'Must include at least one payment method'),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const querySaleSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['COMPLETED', 'VOIDED', 'PARTIAL_RETURN', 'FULL_RETURN']).optional(),
    customerId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .strict();

export type QuerySaleInput = z.infer<typeof querySaleSchema>;

export const voidSaleSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
