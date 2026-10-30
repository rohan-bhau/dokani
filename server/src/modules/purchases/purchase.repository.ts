import type {
  CreateSupplierInput,
  UpdateSupplierInput,
  QuerySupplierInput,
  CreatePurchaseInput,
  QueryPurchaseInput,
} from '@dokani/shared';
import { prisma, Prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError } from '../../common/errors.js';

export class PurchaseRepository {
  // Supplier Operations
  async createSupplier(tenantId: string, input: CreateSupplierInput) {
    return prisma.supplier.create({
      data: {
        tenantId,
        name: input.name,
        company: input.company ?? null,
        phone: input.phone,
        email: input.email ?? null,
        address: input.address ?? null,
      },
    });
  }

  async findAllSuppliers(tenantId: string, query: QuerySupplierInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = { tenantId };
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { company: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSupplierById(tenantId: string, id: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }
    return prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });
  }

  async updateSupplier(tenantId: string, id: string, input: UpdateSupplierInput) {
    return prisma.supplier.updateMany({
      where: { id, tenantId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.company !== undefined && { company: input.company ?? null }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email ?? null }),
        ...(input.address !== undefined && { address: input.address ?? null }),
      },
    });
  }

  // Gapless Purchase Number
  async getNextPurchaseNumber(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    tenantId: string
  ): Promise<string> {
    const counter = await tx.$queryRaw<Array<{ last_value: bigint }>>`
      INSERT INTO tenant_counters (tenant_id, counter_type, last_value, updated_at)
      VALUES (${tenantId}::uuid, 'PURCHASE', 1, NOW())
      ON CONFLICT (tenant_id, counter_type)
      DO UPDATE SET last_value = tenant_counters.last_value + 1, updated_at = NOW()
      RETURNING last_value
    `;

    const lastVal = counter[0]?.last_value ?? 1n;
    const year = new Date().getFullYear();
    return `PO-${year}-${String(lastVal).padStart(6, '0')}`;
  }

  // Purchase Operations
  async createPurchase(tenantId: string, input: CreatePurchaseInput, userId?: string) {
    return prisma.$transaction(
      async (tx) => {
        const supplier = await tx.supplier.findFirst({
          where: { id: input.supplierId, tenantId },
        });

        if (!supplier) {
          throw new NotFoundError('Supplier not found');
        }

        const productIds = input.items.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: {
            id: { in: productIds },
            tenantId,
          },
          include: {
            stockLevel: true,
          },
        });

        if (products.length !== productIds.length) {
          throw new BadRequestError('One or more products were not found for this tenant.');
        }

        const productMap = new Map(products.map((p) => [p.id, p]));

        let subtotal = 0n;
        const calculatedItems = input.items.map((item) => {
          const product = productMap.get(item.productId)!;
          const lineTotal = BigInt(item.unitCost) * BigInt(item.quantity);
          subtotal += lineTotal;

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitCost: BigInt(item.unitCost),
            lineTotal,
            product,
          };
        });

        const total = subtotal;
        const paidAmount = BigInt(input.paidAmount ?? 0);
        const dueAmount = total > paidAmount ? total - paidAmount : 0n;

        const purchaseNumber = await this.getNextPurchaseNumber(tx, tenantId);

        const purchase = await tx.purchase.create({
          data: {
            tenantId,
            supplierId: input.supplierId,
            purchaseNumber,
            status: 'RECEIVED',
            subtotal,
            total,
            paidAmount,
            dueAmount,
            notes: input.notes ?? null,
            createdBy: userId ?? null,
            items: {
              create: calculatedItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                lineTotal: item.lineTotal,
              })),
            },
          },
          include: {
            supplier: true,
            items: {
              include: {
                product: {
                  select: { name: true, nameBn: true, sku: true, unit: true },
                },
              },
            },
          },
        });

        // Update inventory, weighted average cost price, and stock movements
        for (const item of calculatedItems) {
          const oldStock = BigInt(item.product.stockLevel?.quantity ?? 0);
          const oldCost = item.product.costPrice;
          const purchasedQty = BigInt(item.quantity);
          const purchasedCost = item.unitCost;

          let newCostPrice = purchasedCost;
          if (oldStock > 0n && oldStock + purchasedQty > 0n) {
            newCostPrice =
              (oldStock * oldCost + purchasedQty * purchasedCost) / (oldStock + purchasedQty);
          }

          // Update cost price on product
          await tx.product.update({
            where: { id: item.productId },
            data: { costPrice: newCostPrice },
          });

          // Increment stock levels
          await tx.stockLevel.upsert({
            where: {
              tenantId_productId: {
                tenantId,
                productId: item.productId,
              },
            },
            create: {
              tenantId,
              productId: item.productId,
              quantity: item.quantity,
            },
            update: {
              quantity: { increment: item.quantity },
            },
          });

          // Insert immutable stock movement
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: 'PURCHASE',
              quantity: item.quantity,
              unitCost: purchasedCost,
              referenceType: 'PURCHASE',
              referenceId: purchase.id,
              reason: `Purchase ${purchaseNumber}`,
              createdBy: userId ?? null,
            },
          });
        }

        return purchase;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );
  }

  async findAllPurchases(tenantId: string, query: QueryPurchaseInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseWhereInput = { tenantId };
    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: {
            select: { id: true, name: true, phone: true, company: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPurchaseById(tenantId: string, id: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }

    return prisma.purchase.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              select: { name: true, nameBn: true, sku: true, unit: true },
            },
          },
        },
      },
    });
  }
}
