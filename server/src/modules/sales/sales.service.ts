import type { CreateSaleInput, QuerySaleInput } from '@dokani/shared';
import { NotFoundError } from '../../common/errors.js';
import { salesRepository, type SalesRepository } from './sales.repository.js';

export class SalesService {
  constructor(private readonly repo: SalesRepository = salesRepository) {}

  async checkout(
    tenantId: string,
    input: CreateSaleInput,
    userId?: string,
    idempotencyKey?: string
  ) {
    const invoice = await this.repo.checkout(tenantId, input, userId, idempotencyKey);
    return this.serializeInvoice(invoice);
  }

  async getById(tenantId: string, id: string) {
    const invoice = await this.repo.findById(tenantId, id);
    if (!invoice) {
      throw new NotFoundError('Invoice not found.');
    }
    return this.serializeInvoice(invoice);
  }

  async list(tenantId: string, query: QuerySaleInput) {
    const result = await this.repo.list(tenantId, query);
    return {
      ...result,
      invoices: result.invoices.map((inv) => this.serializeInvoice(inv)),
    };
  }

  async voidInvoice(tenantId: string, id: string, reason: string, userId?: string) {
    const invoice = await this.repo.voidInvoice(tenantId, id, reason, userId);
    return this.serializeInvoice(invoice);
  }

  async processReturn(
    tenantId: string,
    invoiceId: string,
    input: import('@dokani/shared').CreateSaleReturnInput,
    userId?: string
  ) {
    const saleReturn = await this.repo.processReturn(tenantId, invoiceId, input, userId);
    return {
      ...saleReturn,
      refundAmount: Number(saleReturn.refundAmount),
      items: saleReturn.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        unitCost: Number(i.unitCost),
        lineTotal: Number(i.lineTotal),
      })),
    };
  }

  async listReturns(tenantId: string, invoiceId?: string) {
    const returns = await this.repo.listReturns(tenantId, invoiceId);
    return returns.map((sr) => ({
      ...sr,
      refundAmount: Number(sr.refundAmount),
      items: sr.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        unitCost: Number(i.unitCost),
        lineTotal: Number(i.lineTotal),
      })),
    }));
  }

  private serializeInvoice(invoice: {
    subtotal: bigint;
    discount: bigint;
    vatTotal: bigint;
    total: bigint;
    paidTotal: bigint;
    dueTotal: bigint;
    items?: Array<{
      unitPrice: bigint;
      unitCost: bigint;
      discount: bigint;
      lineTotal: bigint;
      [key: string]: unknown;
    }>;
    payments?: Array<{
      amount: bigint;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }) {
    return {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount),
      vatTotal: Number(invoice.vatTotal),
      total: Number(invoice.total),
      paidTotal: Number(invoice.paidTotal),
      dueTotal: Number(invoice.dueTotal),
      items: invoice.items?.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        unitCost: Number(item.unitCost),
        discount: Number(item.discount),
        lineTotal: Number(item.lineTotal),
      })),
      payments: invoice.payments?.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    };
  }
}

export const salesService = new SalesService();
