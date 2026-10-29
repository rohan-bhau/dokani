import type { StockAdjustmentInput } from '@dokani/shared';
import { BadRequestError, NotFoundError } from '../../common/errors.js';
import { prisma } from '../../config/prisma.js';

export interface LowStockAlertItem {
  id: string;
  name: string;
  nameBn: string | null;
  sku: string;
  barcode: string | null;
  unit: string;
  reorderLevel: number;
  currentStock: number;
}

export class InventoryRepository {
  async adjustStock(tenantId: string, input: StockAdjustmentInput, userId?: string) {
    return prisma.$transaction(
      async (tx) => {
        const product = await tx.product.findFirst({
          where: {
            id: input.productId,
            tenantId,
            deletedAt: null,
          },
        });

        if (!product) {
          throw new NotFoundError('Product not found.');
        }

        const currentStock = await tx.stockLevel.findUnique({
          where: {
            tenantId_productId: {
              tenantId,
              productId: input.productId,
            },
          },
        });

        const currentQty = currentStock?.quantity ?? 0;
        const newQuantity = currentQty + input.quantity;

        if (newQuantity < 0) {
          throw new BadRequestError(
            `Insufficient stock. Current stock is ${currentQty}, cannot adjust by ${input.quantity}.`
          );
        }

        const updatedStock = await tx.stockLevel.upsert({
          where: {
            tenantId_productId: {
              tenantId,
              productId: input.productId,
            },
          },
          update: {
            quantity: newQuantity,
          },
          create: {
            tenantId,
            productId: input.productId,
            quantity: newQuantity,
          },
        });

        const movement = await tx.stockMovement.create({
          data: {
            tenantId,
            productId: input.productId,
            type: input.type,
            quantity: input.quantity,
            unitCost: product.costPrice,
            reason: input.reason,
            createdBy: userId ?? null,
          },
        });

        return {
          stockLevel: updatedStock,
          movement,
        };
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );
  }

  async getStockLevel(tenantId: string, productId: string) {
    return prisma.stockLevel.findUnique({
      where: {
        tenantId_productId: {
          tenantId,
          productId,
        },
      },
      include: {
        product: true,
      },
    });
  }

  async findMovements(tenantId: string, productId: string, limit = 50) {
    return prisma.stockMovement.findMany({
      where: {
        tenantId,
        productId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async getLowStockAlerts(tenantId: string): Promise<LowStockAlertItem[]> {
    return prisma.$queryRaw<LowStockAlertItem[]>`
      SELECT 
        p.id, 
        p.name, 
        p.name_bn as "nameBn", 
        p.sku, 
        p.barcode, 
        p.unit, 
        p.reorder_level as "reorderLevel",
        COALESCE(sl.quantity, 0) as "currentStock"
      FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id AND sl.tenant_id = p.tenant_id
      WHERE p.tenant_id = ${tenantId}::uuid
        AND p.deleted_at IS NULL
        AND p.is_active = true
        AND COALESCE(sl.quantity, 0) <= p.reorder_level
      ORDER BY (COALESCE(sl.quantity, 0) - p.reorder_level) ASC
    `;
  }
}

export const inventoryRepository = new InventoryRepository();
