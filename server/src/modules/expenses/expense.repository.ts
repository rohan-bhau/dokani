import type { CreateExpenseInput, QueryExpenseInput } from '@dokani/shared';
import { prisma, type Prisma } from '../../config/prisma.js';

export class ExpenseRepository {
  async create(tenantId: string, input: CreateExpenseInput, userId?: string) {
    return prisma.expense.create({
      data: {
        tenantId,
        category: input.category,
        amount: BigInt(input.amount),
        note: input.note ?? null,
        spentOn: input.spentOn ? new Date(input.spentOn) : new Date(),
        createdBy: userId ?? null,
      },
      include: {
        creator: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async findById(tenantId: string, id: string) {
    return prisma.expense.findFirst({
      where: { id, tenantId },
      include: {
        creator: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async findMany(tenantId: string, query: QueryExpenseInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = { tenantId };

    if (query.category) {
      where.category = query.category;
    }

    if (query.startDate || query.endDate) {
      where.spentOn = {};
      if (query.startDate) {
        where.spentOn.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.spentOn.lte = new Date(query.endDate);
      }
    }

    const [items, total, aggregate] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { spentOn: 'desc' },
        include: {
          creator: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      items: items.map((e) => ({
        ...e,
        amount: Number(e.amount),
      })),
      total,
      totalAmount: Number(aggregate._sum.amount ?? 0n),
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async delete(tenantId: string, id: string) {
    return prisma.expense.deleteMany({
      where: { id, tenantId },
    });
  }

  async getTotalExpenses(tenantId: string, startDate?: Date, endDate?: Date): Promise<bigint> {
    const where: Prisma.ExpenseWhereInput = { tenantId };
    if (startDate || endDate) {
      where.spentOn = {};
      if (startDate) where.spentOn.gte = startDate;
      if (endDate) where.spentOn.lte = endDate;
    }

    const aggregate = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    return aggregate._sum.amount ?? 0n;
  }
}

export const expenseRepository = new ExpenseRepository();
