import type { StockAdjustmentInput } from '@dokani/shared';
import { NotFoundError } from '../../common/errors.js';
import { auditService } from '../audit/audit.service.js';
import {
  inventoryRepository,
  type InventoryRepository,
  type LowStockAlertItem,
} from './inventory.repository.js';

export class InventoryService {
  constructor(private readonly repo: InventoryRepository = inventoryRepository) {}

  async adjustStock(tenantId: string, input: StockAdjustmentInput, userId?: string) {
    const result = await this.repo.adjustStock(tenantId, input, userId);

    // Record audit log
    await auditService.log({
      tenantId,
      userId: userId ?? null,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'Product',
      entityId: input.productId,
      details: {
        adjustmentType: input.type,
        quantity: input.quantity,
        reason: input.reason,
        newStockLevel: result.stockLevel.quantity,
      },
    });

    return {
      stockLevel: result.stockLevel,
      movement: {
        ...result.movement,
        unitCost: Number(result.movement.unitCost),
      },
    };
  }

  async getProductStock(tenantId: string, productId: string) {
    const stock = await this.repo.getStockLevel(tenantId, productId);
    if (!stock) {
      throw new NotFoundError('Stock information not found for this product.');
    }
    return {
      ...stock,
      product: stock.product
        ? {
            ...stock.product,
            costPrice: Number(stock.product.costPrice),
            sellPrice: Number(stock.product.sellPrice),
          }
        : undefined,
    };
  }

  async listStockMovements(tenantId: string, productId: string, limit?: number) {
    const movements = await this.repo.findMovements(tenantId, productId, limit);
    return movements.map((m) => ({
      ...m,
      unitCost: Number(m.unitCost),
    }));
  }

  async getLowStockAlerts(tenantId: string): Promise<LowStockAlertItem[]> {
    return this.repo.getLowStockAlerts(tenantId);
  }
}

export const inventoryService = new InventoryService();
