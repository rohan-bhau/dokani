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
    const [invoices, products, customers, expenseAggregate] = await Promise.all([
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
      prisma.expense.aggregate({
        where: {
          tenantId: filter.tenantId,
          ...(filter.startDate || filter.endDate
            ? {
                spentOn: {
                  ...(filter.startDate ? { gte: filter.startDate } : {}),
                  ...(filter.endDate ? { lte: filter.endDate } : {}),
                },
              }
            : {}),
        },
        _sum: { amount: true },
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

    const totalExpenses = expenseAggregate._sum.amount ?? 0n;
    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;

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
        totalExpenses: Number(totalExpenses),
        netProfit: Number(netProfit),
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

  async getSalesDetailed(filter: ReportDateFilter & { groupBy?: 'day' | 'week' | 'month' }) {
    const invoiceWhere: { tenantId: string; status: 'COMPLETED'; createdAt?: { gte?: Date; lte?: Date } } = {
      tenantId: filter.tenantId,
      status: 'COMPLETED',
    };

    if (filter.startDate || filter.endDate) {
      invoiceWhere.createdAt = {};
      if (filter.startDate) invoiceWhere.createdAt.gte = filter.startDate;
      if (filter.endDate) invoiceWhere.createdAt.lte = filter.endDate;
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        payments: true,
        items: true,
        user: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const cashierMap = new Map<string, { cashierId: string; name: string; invoiceCount: number; totalRevenue: number }>();
    const tenderTotals: Record<string, number> = { CASH: 0, BKASH: 0, NAGAD: 0, CARD: 0, CREDIT_BAKI: 0, OTHER: 0 };
    const timelineMap = new Map<string, { date: string; sales: number; count: number }>();

    for (const inv of invoices) {
      const cashierName = inv.user?.name ?? 'Unknown';
      const cashierId = inv.user?.id ?? 'system';
      const c = cashierMap.get(cashierId) ?? { cashierId, name: cashierName, invoiceCount: 0, totalRevenue: 0 };
      c.invoiceCount++;
      c.totalRevenue += Number(inv.total);
      cashierMap.set(cashierId, c);


      for (const p of inv.payments) {
        const m = p.method in tenderTotals ? p.method : 'OTHER';
        tenderTotals[m] = (tenderTotals[m] ?? 0) + Number(p.amount);
      }

      const dateStr = inv.createdAt.toISOString().slice(0, 10);
      const t = timelineMap.get(dateStr) ?? { date: dateStr, sales: 0, count: 0 };
      t.sales += Number(inv.total);
      t.count++;
      timelineMap.set(dateStr, t);
    }

    return {
      totalInvoices: invoices.length,
      totalRevenue: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
      timeline: Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      byCashier: Array.from(cashierMap.values()),
      byPaymentMethod: tenderTotals,
    };
  }

  async getProfitLoss(filter: ReportDateFilter) {
    const summary = await this.getExecutiveSummary(filter);

    const expenseWhere: { tenantId: string; spentOn?: { gte?: Date; lte?: Date } } = {
      tenantId: filter.tenantId,
    };

    if (filter.startDate || filter.endDate) {
      expenseWhere.spentOn = {};
      if (filter.startDate) expenseWhere.spentOn.gte = filter.startDate;
      if (filter.endDate) expenseWhere.spentOn.lte = filter.endDate;
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      select: { category: true, amount: true },
    });

    const categoryBreakdown: Record<string, number> = {};
    for (const exp of expenses) {
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] ?? 0) + Number(exp.amount);
    }

    const revenue = summary.sales.totalRevenue;
    const cogs = summary.sales.cogs;
    const grossProfit = summary.sales.grossProfit;
    const totalExpenses = summary.sales.totalExpenses;
    const netProfit = summary.sales.netProfit;

    return {
      revenue,
      cogs,
      grossProfit,
      grossMarginPercentage: revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(2)) : 0,
      totalExpenses,
      netProfit,
      netMarginPercentage: revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(2)) : 0,
      expensesByCategory: categoryBreakdown,
    };
  }

  async getStockValuation(tenantId: string) {
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      include: {
        stockLevel: true,
        category: { select: { id: true, name: true } },
      },
    });

    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;

    const categoryMap = new Map<string, { categoryId: string; categoryName: string; productCount: number; units: number; costValuation: number; retailValuation: number }>();

    for (const prod of products) {
      const units = prod.stockLevel?.quantity ?? 0;
      const cost = Number(prod.costPrice) * units;
      const retail = Number(prod.sellPrice) * units;

      totalUnits += units;
      totalCostValuation += cost;
      totalRetailValuation += retail;

      const catName = prod.category?.name ?? 'Uncategorized';
      const catId = prod.category?.id ?? 'uncategorized';
      const cat = categoryMap.get(catId) ?? {
        categoryId: catId,
        categoryName: catName,
        productCount: 0,
        units: 0,
        costValuation: 0,
        retailValuation: 0,
      };

      cat.productCount++;
      cat.units += units;
      cat.costValuation += cost;
      cat.retailValuation += retail;
      categoryMap.set(catId, cat);
    }

    return {
      totalProducts: products.length,
      totalUnits,
      costValuation: totalCostValuation,
      retailValuation: totalRetailValuation,
      potentialGrossProfit: totalRetailValuation - totalCostValuation,
      categories: Array.from(categoryMap.values()),
    };
  }

  async getVatSummary(filter: ReportDateFilter) {
    const invoiceWhere: { tenantId: string; status: 'COMPLETED'; createdAt?: { gte?: Date; lte?: Date } } = {
      tenantId: filter.tenantId,
      status: 'COMPLETED',
    };

    if (filter.startDate || filter.endDate) {
      invoiceWhere.createdAt = {};
      if (filter.startDate) invoiceWhere.createdAt.gte = filter.startDate;
      if (filter.endDate) invoiceWhere.createdAt.lte = filter.endDate;
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        subtotal: true,
        vatTotal: true,
        total: true,
      },
    });

    let totalSales = 0;
    let totalVat = 0;
    let taxableSales = 0;

    for (const inv of invoices) {
      totalSales += Number(inv.total);
      const vat = Number(inv.vatTotal);
      totalVat += vat;
      if (vat > 0) {
        taxableSales += Number(inv.subtotal);
      }
    }

    return {
      totalSales,
      taxableSales,
      collectedVat: totalVat,
      effectiveVatRate: taxableSales > 0 ? Number(((totalVat / taxableSales) * 100).toFixed(2)) : 0,
      netVatPayable: totalVat,
    };
  }
}

export const reportsService = new ReportsService();

