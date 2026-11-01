import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors.js';
import type { UpdateSettingsInput } from '@dokani/shared';

export class SettingsRepository {
  async getSettings(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundError('Shop settings not found.');
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      businessType: tenant.businessType || 'Retail',
      address: tenant.address,
      phone: tenant.phone,
      binNumber: tenant.binNumber,
      logoUrl: tenant.logoUrl,
      currency: tenant.currency,
      invoicePrefix: tenant.invoicePrefix,
      paperSize: tenant.paperSize,
      receiptFooter: tenant.receiptFooter,
      showLogoOnInvoice: tenant.showLogoOnInvoice,
      showBinOnInvoice: tenant.showBinOnInvoice,
      showBanglaOnInvoice: tenant.showBanglaOnInvoice,
      pricesIncludeVat: tenant.pricesIncludeVat,
      allowNegativeStock: tenant.allowNegativeStock,
      maxCashierDiscount: tenant.maxCashierDiscount,
      returnApprovalLimit: Number(tenant.returnApprovalLimit),
      defaultCreditLimit: tenant.defaultCreditLimit ? Number(tenant.defaultCreditLimit) : null,
      overdueDays: tenant.overdueDays,
      status: tenant.status,
      currentPlan: tenant.subscriptions[0]?.plan?.name || 'Free',
    };
  }

  async updateSettings(tenantId: string, input: UpdateSettingsInput) {
    const data: Record<string, unknown> = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.businessType !== undefined) data.businessType = input.businessType;
    if (input.address !== undefined) data.address = input.address;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.binNumber !== undefined) data.binNumber = input.binNumber;
    if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl;
    if (input.invoicePrefix !== undefined) data.invoicePrefix = input.invoicePrefix;
    if (input.paperSize !== undefined) data.paperSize = input.paperSize;
    if (input.receiptFooter !== undefined) data.receiptFooter = input.receiptFooter;
    if (input.showLogoOnInvoice !== undefined) data.showLogoOnInvoice = input.showLogoOnInvoice;
    if (input.showBinOnInvoice !== undefined) data.showBinOnInvoice = input.showBinOnInvoice;
    if (input.showBanglaOnInvoice !== undefined) data.showBanglaOnInvoice = input.showBanglaOnInvoice;
    if (input.pricesIncludeVat !== undefined) data.pricesIncludeVat = input.pricesIncludeVat;
    if (input.allowNegativeStock !== undefined) data.allowNegativeStock = input.allowNegativeStock;
    if (input.maxCashierDiscount !== undefined) data.maxCashierDiscount = input.maxCashierDiscount;
    if (input.returnApprovalLimit !== undefined) data.returnApprovalLimit = BigInt(input.returnApprovalLimit);
    if (input.defaultCreditLimit !== undefined) {
      data.defaultCreditLimit = input.defaultCreditLimit !== null ? BigInt(input.defaultCreditLimit) : null;
    }
    if (input.overdueDays !== undefined) data.overdueDays = input.overdueDays;

    await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    return this.getSettings(tenantId);
  }
}

export const settingsRepository = new SettingsRepository();
