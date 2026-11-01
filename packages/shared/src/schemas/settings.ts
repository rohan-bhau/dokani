import { z } from 'zod';

export const updateSettingsSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    businessType: z.enum(['Grocery', 'Pharmacy', 'Electronics', 'Clothing', 'Wholesale', 'Other']).optional(),
    address: z.string().trim().max(250).optional(),
    phone: z.string().trim().max(20).optional(),
    binNumber: z.string().trim().max(50).optional(),
    logoUrl: z.string().url().max(500).optional().nullable(),
    invoicePrefix: z.string().trim().min(1).max(10).optional(),
    paperSize: z.enum(['RECEIPT_80MM', 'A4']).optional(),
    receiptFooter: z.string().trim().max(200).optional(),
    showLogoOnInvoice: z.boolean().optional(),
    showBinOnInvoice: z.boolean().optional(),
    showBanglaOnInvoice: z.boolean().optional(),
    pricesIncludeVat: z.boolean().optional(),
    allowNegativeStock: z.boolean().optional(),
    maxCashierDiscount: z.number().int().min(0).max(100).optional(),
    returnApprovalLimit: z.number().int().nonnegative().optional(),
    defaultCreditLimit: z.number().int().nonnegative().optional().nullable(),
    overdueDays: z.number().int().positive().max(365).optional(),
  })
  .strict();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const updateGatewaySettingsSchema = z
  .object({
    provider: z.enum(['BKASH', 'SSLCOMMERZ']),
    isEnabled: z.boolean(),
    isSandbox: z.boolean(),
    credentials: z.record(z.string()),
  })
  .strict();

export type UpdateGatewaySettingsInput = z.infer<typeof updateGatewaySettingsSchema>;
