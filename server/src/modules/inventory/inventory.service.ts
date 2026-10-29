import type { StockAdjustmentInput } from '@dokani/shared';
import { NotFoundError } from '../../common/errors.js';
import {
  inventoryRepository,
  type InventoryRepository,
  type LowStockAlertItem,
} from './inventory.repository.js';

export class InventoryService {
  constructor(private readonly repo: InventoryRepository = inventoryRepository) {}

  async adjustStock(tenantId: string, input: StockAdjustmentInput, userId?: string) {
    const result = await this.repo.adjustStock(tenantId, input, userId);
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
    return stock;
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
