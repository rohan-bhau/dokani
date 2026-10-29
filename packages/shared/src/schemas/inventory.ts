import { z } from 'zod';

export const stockAdjustmentSchema = z
  .object({
    productId: z.string().uuid(),
    type: z.enum(['ADJUSTMENT_DAMAGE', 'ADJUSTMENT_EXPIRY', 'ADJUSTMENT_CORRECTION']),
    quantity: z.number().int().refine((val) => val !== 0, 'Quantity adjustment must be non-zero'),
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
