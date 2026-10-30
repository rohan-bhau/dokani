import { z } from 'zod';

export const createCustomerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(150),
    phone: z.string().trim().min(6, 'Valid phone number is required').max(20),
    email: z.string().trim().email().optional(),
    address: z.string().trim().max(500).optional(),
    openingDue: z.number().int().nonnegative().default(0),
  })
  .strict();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const queryCustomerSchema = z
  .object({
    q: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type QueryCustomerInput = z.infer<typeof queryCustomerSchema>;

export const collectDueSchema = z
  .object({
    amount: z.number().int().positive('Payment amount must be greater than zero'),
    method: z.enum(['CASH', 'BKASH', 'NAGAD', 'CARD']).default('CASH'),
    reference: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type CollectDueInput = z.infer<typeof collectDueSchema>;
