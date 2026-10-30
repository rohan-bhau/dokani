import { PurchaseRepository } from './purchase.repository.js';
import { NotFoundError } from '../../common/errors.js';
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
  QuerySupplierInput,
  CreatePurchaseInput,
  QueryPurchaseInput,
} from '@dokani/shared';

function serializePurchase(purchase: any) {
  if (!purchase) return null;
  return {
    ...purchase,
    subtotal: Number(purchase.subtotal),
    total: Number(purchase.total),
    paidAmount: Number(purchase.paidAmount),
    dueAmount: Number(purchase.dueAmount),
    items: purchase.items?.map((item: any) => ({
      ...item,
      unitCost: Number(item.unitCost),
      lineTotal: Number(item.lineTotal),
    })),
  };
}

export class PurchaseService {
  constructor(private readonly purchaseRepo: PurchaseRepository) {}

  // Supplier
  async createSupplier(tenantId: string, input: CreateSupplierInput) {
    return this.purchaseRepo.createSupplier(tenantId, input);
  }

  async findAllSuppliers(tenantId: string, query: QuerySupplierInput) {
    return this.purchaseRepo.findAllSuppliers(tenantId, query);
  }

  async findSupplierById(tenantId: string, id: string) {
    const supplier = await this.purchaseRepo.findSupplierById(tenantId, id);
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }
    return supplier;
  }

  async updateSupplier(tenantId: string, id: string, input: UpdateSupplierInput) {
    const existing = await this.purchaseRepo.findSupplierById(tenantId, id);
    if (!existing) {
      throw new NotFoundError('Supplier not found');
    }
    await this.purchaseRepo.updateSupplier(tenantId, id, input);
    return this.findSupplierById(tenantId, id);
  }

  // Purchases
  async createPurchase(tenantId: string, input: CreatePurchaseInput, userId?: string) {
    const purchase = await this.purchaseRepo.createPurchase(tenantId, input, userId);
    return serializePurchase(purchase);
  }

  async findAllPurchases(tenantId: string, query: QueryPurchaseInput) {
    const result = await this.purchaseRepo.findAllPurchases(tenantId, query);
    return {
      ...result,
      items: result.items.map(serializePurchase),
    };
  }

  async findPurchaseById(tenantId: string, id: string) {
    const purchase = await this.purchaseRepo.findPurchaseById(tenantId, id);
    if (!purchase) {
      throw new NotFoundError('Purchase not found');
    }
    return serializePurchase(purchase);
  }
}
