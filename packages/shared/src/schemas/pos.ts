import { z } from 'zod';
import { checkoutItemSchema } from './sale.js';

export const holdCartSchema = z
  .object({
    cartLabel: z.string().trim().min(1).max(100).default('Held Cart'),
    customerId: z.string().uuid().optional(),
    items: z.array(checkoutItemSchema).min(1, 'Cart must have at least one item'),
    discount: z.number().int().nonnegative().default(0),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type HoldCartInput = z.infer<typeof holdCartSchema>;
