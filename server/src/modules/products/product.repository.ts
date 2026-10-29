import type { CreateProductInput, QueryProductInput, UpdateProductInput } from '@dokani/shared';
import { prisma } from '../../config/prisma.js';

export class ProductRepository {
  async create(tenantId: string, input: CreateProductInput, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId,
          name: input.name,
          nameBn: input.nameBn ?? null,
          sku: input.sku,
          barcode: input.barcode ?? null,
          categoryId: input.categoryId ?? null,
          unit: input.unit,
          costPrice: BigInt(input.costPrice),
          sellPrice: BigInt(input.sellPrice),
          vatRate: input.vatRate,
          reorderLevel: input.reorderLevel,
        },
      });

      // Initialize stock level
      const stockLevel = await tx.stockLevel.create({
        data: {
          tenantId,
          productId: product.id,
          quantity: input.initialStock,
        },
      });

      // Record opening stock movement if stock > 0
      if (input.initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: product.id,
            type: 'OPENING',
            quantity: input.initialStock,
            unitCost: BigInt(input.costPrice),
            reason: 'Initial opening stock',
            createdBy: userId ?? null,
          },
        });
      }

      return {
        ...product,
        stockLevel,
      };
    });
  }

  async bulkCreate(tenantId: string, items: CreateProductInput[], userId?: string) {
    return prisma.$transaction(
      async (tx) => {
        const createdProducts = [];
        for (const input of items) {
          const product = await tx.product.create({
            data: {
              tenantId,
              name: input.name,
              nameBn: input.nameBn ?? null,
              sku: input.sku,
              barcode: input.barcode ?? null,
              categoryId: input.categoryId ?? null,
              unit: input.unit,
              costPrice: BigInt(input.costPrice),
              sellPrice: BigInt(input.sellPrice),
              vatRate: input.vatRate,
              reorderLevel: input.reorderLevel,
            },
          });

          const stockLevel = await tx.stockLevel.create({
            data: {
              tenantId,
              productId: product.id,
              quantity: input.initialStock,
            },
          });

          if (input.initialStock > 0) {
            await tx.stockMovement.create({
              data: {
                tenantId,
                productId: product.id,
                type: 'OPENING',
                quantity: input.initialStock,
                unitCost: BigInt(input.costPrice),
                reason: 'Initial opening stock via bulk import',
                createdBy: userId ?? null,
              },
            });
          }

          createdProducts.push({
            ...product,
            stockLevel,
          });
        }
        return createdProducts;
      },
      {
        maxWait: 15000,
        timeout: 45000,
      }
    );
  }

  async findById(tenantId: string, id: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }

    return prisma.product.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        category: true,
        stockLevel: true,
      },
    });
  }

  async findBySku(tenantId: string, sku: string) {
    return prisma.product.findFirst({
      where: {
        tenantId,
        sku,
        deletedAt: null,
      },
    });
  }

  async findByBarcode(tenantId: string, barcode: string) {
    return prisma.product.findFirst({
      where: {
        tenantId,
        barcode,
        deletedAt: null,
      },
    });
  }

  async update(tenantId: string, id: string, input: UpdateProductInput) {
    return prisma.product.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.nameBn !== undefined ? { nameBn: input.nameBn ?? null } : {}),
        ...(input.sku ? { sku: input.sku } : {}),
        ...(input.barcode !== undefined ? { barcode: input.barcode ?? null } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId ?? null } : {}),
        ...(input.unit ? { unit: input.unit } : {}),
        ...(input.costPrice !== undefined ? { costPrice: BigInt(input.costPrice) } : {}),
        ...(input.sellPrice !== undefined ? { sellPrice: BigInt(input.sellPrice) } : {}),
        ...(input.vatRate !== undefined ? { vatRate: input.vatRate } : {}),
        ...(input.reorderLevel !== undefined ? { reorderLevel: input.reorderLevel } : {}),
      },
      include: {
        category: true,
        stockLevel: true,
      },
    });
  }

  async softDelete(tenantId: string, id: string) {
    return prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async search(tenantId: string, query: QueryProductInput) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' as const } },
              { nameBn: { contains: query.q, mode: 'insensitive' as const } },
              { sku: { contains: query.q, mode: 'insensitive' as const } },
              { barcode: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          stockLevel: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const productRepository = new ProductRepository();
