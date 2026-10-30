import { z } from 'zod';

export const createSupplierSchema = z
  .object({
    name: z.string().trim().min(1, 'Supplier name is required').max(150),
    company: z.string().trim().max(150).optional(),
    phone: z.string().trim().min(6, 'Valid phone number is required').max(20),
    email: z.string().trim().email().optional(),
    address: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = createSupplierSchema.partial();
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export const querySupplierSchema = z
  .object({
    q: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type QuerySupplierInput = z.infer<typeof querySupplierSchema>;
