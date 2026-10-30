import { z } from 'zod';

export const ExpenseCategoryEnum = z.enum([
  'RENT',
  'ELECTRICITY',
  'SALARY',
  'TRANSPORT',
  'MAINTENANCE',
  'ENTERTAINMENT',
  'MARKETING',
  'OTHER',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export const createExpenseSchema = z
  .object({
    category: ExpenseCategoryEnum,
    amount: z.number().int().positive('Amount must be positive in poisha'),
    note: z.string().trim().max(500).optional(),
    spentOn: z.string().datetime().optional(),
  })
  .strict();
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const queryExpenseSchema = z
  .object({
    category: ExpenseCategoryEnum.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();
export type QueryExpenseInput = z.infer<typeof queryExpenseSchema>;
