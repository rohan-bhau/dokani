import type { CreateSaleInput, QuerySaleInput } from '@dokani/shared';
import { ConflictError, NotFoundError, BadRequestError } from '../../common/errors.js';
import { prisma } from '../../config/prisma.js';

export class SalesRepository {
  async getNextInvoiceNumber(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], tenantId: string) {
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: { invoicePrefix: true },
    });

    const prefix = tenant?.invoicePrefix || 'INV-';

    const counter = await tx.$queryRaw<Array<{ last_value: bigint }>>`
      INSERT INTO tenant_counters (tenant_id, counter_type, last_value, updated_at)
      VALUES (${tenantId}::uuid, 'INVOICE', 1, NOW())
      ON CONFLICT (tenant_id, counter_type)
      DO UPDATE SET last_value = tenant_counters.last_value + 1, updated_at = NOW()
      RETURNING last_value
    `;

    const lastVal = counter[0]?.last_value ?? 1n;
    const year = new Date().getFullYear();
    return `${prefix}${year}-${String(lastVal).padStart(6, '0')}`;
  }

  async checkout(
    tenantId: string,
    input: CreateSaleInput,
    userId?: string,
    idempotencyKey?: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        // Sort unique product IDs ascending to prevent deadlocks across concurrent checkouts
        const sortedProductIds = Array.from(new Set(input.items.map((i) => i.productId))).sort();

        // Lock rows in stock_levels for atomic concurrency
        const stockRows = await tx.$queryRaw<Array<{ product_id: string; quantity: number }>>`
          SELECT product_id, quantity 
          FROM stock_levels
          WHERE tenant_id = ${tenantId}::uuid 
            AND product_id = ANY(${sortedProductIds}::uuid[])
          FOR UPDATE
        `;

        const stockMap = new Map(stockRows.map((r) => [r.product_id, r.quantity]));

        // Fetch products to verify pricing and existence
        const products = await tx.product.findMany({
          where: {
            tenantId,
            id: { in: sortedProductIds },
            deletedAt: null,
            isActive: true,
          },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        // Check stock and calculate item totals
        let subtotal = 0n;
        let vatTotal = 0n;

        const calculatedItems = input.items.map((item) => {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new NotFoundError(`Product '${item.productId}' not found or inactive.`);
          }

          const currentStock = stockMap.get(item.productId) ?? 0;
          if (currentStock < item.quantity) {
            throw new ConflictError(
              `Insufficient stock for '${product.name}'. Available: ${currentStock}, requested: ${item.quantity}.`
            );
          }

          const unitPrice = product.sellPrice;
          const unitCost = product.costPrice;
          const itemDiscount = BigInt(item.discount || 0);
          const lineSubtotal = unitPrice * BigInt(item.quantity) - itemDiscount;
          const lineVat = (lineSubtotal * BigInt(product.vatRate)) / 10000n;
          const lineTotal = lineSubtotal + lineVat;

          subtotal += lineSubtotal;
          vatTotal += lineVat;

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            unitCost,
            discount: itemDiscount,
            vatRate: product.vatRate,
            lineTotal,
            productName: product.name,
          };
        });

        const overallDiscount = BigInt(input.discount || 0);
        const total = subtotal + vatTotal - overallDiscount;

        const paidTotal = input.payments.reduce((acc, p) => acc + BigInt(p.amount), 0n);
        const dueTotal = total > paidTotal ? total - paidTotal : 0n;

        // Atomically decrement stock levels
        for (const item of calculatedItems) {
          await tx.stockLevel.update({
            where: {
              tenantId_productId: {
                tenantId,
                productId: item.productId,
              },
            },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        }

        // Generate gapless sequential invoice number
        const invoiceNumber = await this.getNextInvoiceNumber(tx, tenantId);

        // Create Invoice
        const invoice = await tx.invoice.create({
          data: {
            tenantId,
            invoiceNumber,
            customerId: input.customerId ?? null,
            subtotal,
            discount: overallDiscount,
            vatTotal,
            total,
            paidTotal,
            dueTotal,
            idempotencyKey: idempotencyKey ?? null,
            notes: input.notes ?? null,
            createdBy: userId ?? null,
            items: {
              create: calculatedItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitCost: item.unitCost,
                discount: item.discount,
                vatRate: item.vatRate,
                lineTotal: item.lineTotal,
              })),
            },
            payments: {
              create: input.payments.map((p) => ({
                tenantId,
                customerId: input.customerId ?? null,
                method: p.method,
                amount: BigInt(p.amount),
                reference: p.reference ?? null,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: {
                  select: { name: true, nameBn: true, sku: true, unit: true },
                },
              },
            },
            payments: true,
          },
        });

        // Insert stock movement records for immutable ledger
        for (const item of calculatedItems) {
          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              unitCost: item.unitCost,
              referenceType: 'INVOICE',
              referenceId: invoice.id,
              reason: `Sale ${invoice.invoiceNumber}`,
              createdBy: userId ?? null,
            },
          });
        }

        return invoice;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );
  }

  async findById(tenantId: string, id: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }

    return prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, nameBn: true, sku: true, unit: true },
            },
          },
        },
        payments: true,
        user: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async list(tenantId: string, query: QuerySaleInput) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
          payments: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async voidInvoice(tenantId: string, id: string, reason: string, userId?: string) {
    return prisma.$transaction(
      async (tx) => {
        const invoice = await tx.invoice.findFirst({
          where: { id, tenantId },
          include: { items: true },
        });

        if (!invoice) {
          throw new NotFoundError('Invoice not found.');
        }

        if (invoice.status === 'VOIDED') {
          throw new BadRequestError('Invoice is already voided.');
        }

        // Restore stock levels and create return movement
        for (const item of invoice.items) {
          await tx.stockLevel.update({
            where: {
              tenantId_productId: {
                tenantId,
                productId: item.productId,
              },
            },
            data: {
              quantity: { increment: item.quantity },
            },
          });

          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: 'SALE_RETURN',
              quantity: item.quantity,
              unitCost: item.unitCost,
              referenceType: 'INVOICE',
              referenceId: invoice.id,
              reason: `Void invoice ${invoice.invoiceNumber}: ${reason}`,
              createdBy: userId ?? null,
            },
          });
        }

        // Update invoice status
        return tx.invoice.update({
          where: { id },
          data: {
            status: 'VOIDED',
            notes: invoice.notes ? `${invoice.notes} | Voided: ${reason}` : `Voided: ${reason}`,
          },
          include: {
            items: true,
            payments: true,
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );
  }
}

export const salesRepository = new SalesRepository();
