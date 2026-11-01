import { z } from 'zod';

export const ReturnReasonEnum = z.enum([
  'DAMAGED',
  'EXPIRED',
  'CHANGED_MIND',
  'WRONG_ITEM',
  'OTHER',
]);

export const RefundMethodEnum = z.enum([
  'CASH',
  'BKASH',
  'CREDIT_ADJUST',
]);

export const returnItemInputSchema = z
  .object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive('Return quantity must be greater than zero'),
  })
  .strict();

export const createSaleReturnSchema = z
  .object({
    items: z.array(returnItemInputSchema).min(1, 'Return must include at least one item'),
    reason: ReturnReasonEnum.default('CHANGED_MIND'),
    refundMethod: RefundMethodEnum.default('CASH'),
    notes: z.string().trim().max(500).optional(),
    approvalPin: z.string().length(4, 'Manager approval PIN must be 4 digits').optional(),
  })
  .strict();

export type CreateSaleReturnInput = z.infer<typeof createSaleReturnSchema>;

export const querySaleReturnSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    invoiceId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .strict();

export type QuerySaleReturnInput = z.infer<typeof querySaleReturnSchema>;
