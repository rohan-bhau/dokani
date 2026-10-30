import { prisma, Prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors.js';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  QueryCustomerInput,
  CollectDueInput,
} from '@dokani/shared';

export class CustomerRepository {
  async create(tenantId: string, input: CreateCustomerInput, createdBy?: string) {
    const openingDue = BigInt(input.openingDue ?? 0);

    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          tenantId,
          name: input.name,
          phone: input.phone,
          email: input.email ?? null,
          address: input.address ?? null,
          dueBalance: openingDue,
        },
      });

      if (openingDue > 0n) {
        await tx.customerLedger.create({
          data: {
            tenantId,
            customerId: customer.id,
            type: 'OPENING_BALANCE',
            amount: openingDue,
            balanceAfter: openingDue,
            notes: 'Opening due balance',
            createdBy: createdBy ?? null,
          },
        });
      }

      return customer;
    });
  }

  async findAll(tenantId: string, query: QueryCustomerInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = { tenantId };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }

    return prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            invoices: true,
            ledger: true,
          },
        },
      },
    });
  }

  async update(tenantId: string, id: string, input: UpdateCustomerInput) {
    return prisma.customer.updateMany({
      where: { id, tenantId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email ?? null }),
        ...(input.address !== undefined && { address: input.address ?? null }),
      },
    });
  }

  async collectDue(
    tenantId: string,
    customerId: string,
    input: CollectDueInput,
    createdBy?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: customerId, tenantId },
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      const paymentAmount = BigInt(input.amount);
      const newBalance = customer.dueBalance - paymentAmount;

      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          dueBalance: newBalance,
        },
      });

      const payment = await tx.payment.create({
        data: {
          tenantId,
          customerId,
          method: input.method,
          amount: paymentAmount,
          reference: input.reference ?? null,
        },
      });

      const ledger = await tx.customerLedger.create({
        data: {
          tenantId,
          customerId,
          type: 'PAYMENT_RECEIVED',
          amount: paymentAmount,
          balanceAfter: newBalance,
          referenceId: payment.id,
          notes: input.notes ?? `Due collection via ${input.method}`,
          createdBy: createdBy ?? null,
        },
      });

      return {
        customer: updatedCustomer,
        payment,
        ledger,
      };
    });
  }

  async getLedger(tenantId: string, customerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      customerId,
    };

    const [items, total] = await Promise.all([
      prisma.customerLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customerLedger.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
