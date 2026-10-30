import { z } from 'zod';

export const purchaseItemInputSchema = z
  .object({
    productId: z.string().uuid('Valid product ID is required'),
    quantity: z.number().int().positive('Quantity must be greater than zero'),
    unitCost: z.number().int().nonnegative('Unit cost must be non-negative'),
  })
  .strict();

export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;

export const createPurchaseSchema = z
  .object({
    supplierId: z.string().uuid('Valid supplier ID is required'),
    items: z.array(purchaseItemInputSchema).min(1, 'At least one product item is required'),
    paidAmount: z.number().int().nonnegative().default(0),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const queryPurchaseSchema = z
  .object({
    supplierId: z.string().uuid().optional(),
    status: z.enum(['PENDING', 'RECEIVED', 'CANCELLED']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type QueryPurchaseInput = z.infer<typeof queryPurchaseSchema>;
