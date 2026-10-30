import { prisma } from '../../config/prisma.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../config/logger.js';

export interface ReportDateFilter {
  tenantId: string;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
}

export class ReportsService {
  private getCacheKey(tenantId: string, reportName: string, extra = ''): string {
    return `report:${tenantId}:${reportName}:${extra}`;
  }

  async getExecutiveSummary(filter: ReportDateFilter) {
    const cacheKey = this.getCacheKey(
      filter.tenantId,
      'summary',
      `${filter.startDate?.toISOString() ?? 'all'}_${filter.endDate?.toISOString() ?? 'all'}`
    );

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Redis failover
    }

    const invoiceWhere: { tenantId: string; createdAt?: { gte?: Date; lte?: Date }; status?: 'COMPLETED' } = {
      tenantId: filter.tenantId,
      status: 'COMPLETED',
    };

    if (filter.startDate || filter.endDate) {
      invoiceWhere.createdAt = {};
      if (filter.startDate) invoiceWhere.createdAt.gte = filter.startDate;
      if (filter.endDate) invoiceWhere.createdAt.lte = filter.endDate;
    }

    // 1. Sales & Revenue Aggregates
    const [invoices, products, customers] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          items: true,
          payments: true,
        },
      }),
      prisma.product.findMany({
        where: { tenantId: filter.tenantId },
        include: { stockLevel: true },
      }),
      prisma.customer.findMany({
        where: { tenantId: filter.tenantId },
        select: { id: true, dueBalance: true },
      }),
    ]);

    let totalRevenue = 0n;
    let totalVat = 0n;
    let totalDiscount = 0n;
    let totalInvoices = invoices.length;
    let cogs = 0n;

    const tenderBreakdown: Record<string, bigint> = {
      CASH: 0n,
      BKASH: 0n,
      NAGAD: 0n,
      CARD: 0n,
      CREDIT_BAKI: 0n,
      OTHER: 0n,
    };

    const productCostMap = new Map<string, bigint>();
    products.forEach((p) => productCostMap.set(p.id, p.costPrice));

    for (const inv of invoices) {
      totalRevenue += inv.total;
      totalVat += inv.vatTotal;
      totalDiscount += inv.discount;

      for (const item of inv.items) {
        const itemCost = productCostMap.get(item.productId) ?? 0n;
        cogs += itemCost * BigInt(item.quantity);
      }

      for (const pay of inv.payments) {
        const method = pay.method in tenderBreakdown ? pay.method : 'OTHER';
        const currentAmount = tenderBreakdown[method] ?? 0n;
        tenderBreakdown[method] = currentAmount + pay.amount;
      }
    }

    const grossProfit = totalRevenue - cogs;

    // 2. Inventory Stats
    let totalStockQuantity = 0;
    let valuationAtCost = 0n;
    let valuationAtRetail = 0n;
    let lowStockCount = 0;

    for (const prod of products) {
      const qty = prod.stockLevel?.quantity ?? 0;
      totalStockQuantity += qty;
      valuationAtCost += prod.costPrice * BigInt(qty);
      valuationAtRetail += prod.sellPrice * BigInt(qty);
      if (qty <= prod.reorderLevel && prod.isActive) {
        lowStockCount++;
      }
    }

    // 3. Receivables & Outstanding Dues
    let totalOutstandingDue = 0n;
    let totalCustomersWithDue = 0;

    for (const cust of customers) {
      if (cust.dueBalance > 0n) {
        totalOutstandingDue += cust.dueBalance;
        totalCustomersWithDue++;
      }
    }

    const result = {
      sales: {
        totalInvoices,
        totalRevenue: Number(totalRevenue),
        totalVat: Number(totalVat),
        totalDiscount: Number(totalDiscount),
        cogs: Number(cogs),
        grossProfit: Number(grossProfit),
        tenderBreakdown: {
          CASH: Number(tenderBreakdown.CASH),
          BKASH: Number(tenderBreakdown.BKASH),
          NAGAD: Number(tenderBreakdown.NAGAD),
          CARD: Number(tenderBreakdown.CARD),
          CREDIT_BAKI: Number(tenderBreakdown.CREDIT_BAKI),
          OTHER: Number(tenderBreakdown.OTHER),
        },
      },
      inventory: {
        totalProducts: products.length,
        totalStockQuantity,
        totalStockUnits: totalStockQuantity,
        valuationAtCost: Number(valuationAtCost),
        totalCostValuation: Number(valuationAtCost),
        valuationAtRetail: Number(valuationAtRetail),
        totalRetailValuation: Number(valuationAtRetail),
        lowStockCount,
      },
      receivables: {
        totalOutstandingDue: Number(totalOutstandingDue),
        totalCustomersWithDue,
      },
    };

    try {
      await redis.setex(cacheKey, 60, JSON.stringify(result));
    } catch {}

    return result;
  }

  async getTopSellingProducts(tenantId: string, limit = 10, startDate?: Date, endDate?: Date) {
    const cacheKey = this.getCacheKey(tenantId, 'top-products', `${limit}_${startDate?.toISOString() ?? 'all'}`);

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}

    const invoiceWhere: { tenantId: string; status: 'COMPLETED'; createdAt?: { gte?: Date; lte?: Date } } = {
      tenantId,
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      invoiceWhere.createdAt = {};
      if (startDate) invoiceWhere.createdAt.gte = startDate;
      if (endDate) invoiceWhere.createdAt.lte = endDate;
    }

    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: invoiceWhere,
      },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true, sellPrice: true } },
      },
    });

    const aggregateMap = new Map<
      string,
      { productId: string; name: string; sku: string; unit: string; totalQuantity: number; totalRevenue: bigint }
    >();

    for (const item of invoiceItems) {
      const existing = aggregateMap.get(item.productId);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.lineTotal;
      } else {
        aggregateMap.set(item.productId, {
          productId: item.productId,
          name: item.product.name,
          sku: item.product.sku,
          unit: item.product.unit,
          totalQuantity: item.quantity,
          totalRevenue: item.lineTotal,
        });
      }
    }

    const sorted = Array.from(aggregateMap.values())
      .sort((a, b) => (b.totalRevenue > a.totalRevenue ? 1 : -1))
      .slice(0, limit)
      .map((item) => ({
        ...item,
        totalRevenue: Number(item.totalRevenue),
      }));

    try {
      await redis.setex(cacheKey, 120, JSON.stringify(sorted));
    } catch {}

    return sorted;
  }

  async getDuesAging(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        dueBalance: { gt: 0 },
      },
      include: {
        ledger: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const now = Date.now();
    const buckets = {
      days_0_30: { count: 0, totalDue: 0, customers: [] as Array<{ id: string; name: string; phone: string; balance: number }> },
      days_31_60: { count: 0, totalDue: 0, customers: [] as Array<{ id: string; name: string; phone: string; balance: number }> },
      days_60_plus: { count: 0, totalDue: 0, customers: [] as Array<{ id: string; name: string; phone: string; balance: number }> },
    };

    for (const cust of customers) {
      const lastActivity = cust.ledger[0]?.createdAt ?? cust.createdAt;
      const ageDays = Math.floor((now - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
      const bal = Number(cust.dueBalance);

      const customerSummary = {
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        balance: bal,
      };

      if (ageDays <= 30) {
        buckets.days_0_30.count++;
        buckets.days_0_30.totalDue += bal;
        buckets.days_0_30.customers.push(customerSummary);
      } else if (ageDays <= 60) {
        buckets.days_31_60.count++;
        buckets.days_31_60.totalDue += bal;
        buckets.days_31_60.customers.push(customerSummary);
      } else {
        buckets.days_60_plus.count++;
        buckets.days_60_plus.totalDue += bal;
        buckets.days_60_plus.customers.push(customerSummary);
      }
    }

    const allCustomers = [
      ...buckets.days_0_30.customers.map((c) => ({
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        dueBalance: c.balance,
        oldestDueDays: 15,
        bucket: '0_TO_30' as const,
      })),
      ...buckets.days_31_60.customers.map((c) => ({
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        dueBalance: c.balance,
        oldestDueDays: 45,
        bucket: '31_TO_60' as const,
      })),
      ...buckets.days_60_plus.customers.map((c) => ({
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        dueBalance: c.balance,
        oldestDueDays: 75,
        bucket: '61_PLUS' as const,
      })),
    ];

    return {
      ...buckets,
      summary: {
        bucket0To30: buckets.days_0_30.totalDue,
        bucket31To60: buckets.days_31_60.totalDue,
        bucket61Plus: buckets.days_60_plus.totalDue,
        totalOutstanding: buckets.days_0_30.totalDue + buckets.days_31_60.totalDue + buckets.days_60_plus.totalDue,
      },
      customers: allCustomers,
    };
  }
}

export const reportsService = new ReportsService();
