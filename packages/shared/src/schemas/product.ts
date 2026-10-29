import { z } from 'zod';

export const createProductSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    nameBn: z.string().trim().max(255).optional(),
    sku: z.string().trim().min(1).max(50),
    barcode: z.string().trim().max(50).optional(),
    categoryId: z.string().uuid().optional(),
    unit: z.string().trim().min(1).max(20).default('pcs'),
    costPrice: z.number().int().nonnegative(),
    sellPrice: z.number().int().nonnegative(),
    vatRate: z.number().int().min(0).max(10000).default(0),
    reorderLevel: z.number().int().min(0).default(5),
    initialStock: z.number().int().min(0).default(0),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const queryProductSchema = z
  .object({
    q: z.string().trim().optional(),
    categoryId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type QueryProductInput = z.infer<typeof queryProductSchema>;
