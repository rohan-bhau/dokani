import type { CreateExpenseInput, QueryExpenseInput } from '@dokani/shared';
import { NotFoundError } from '../../common/errors.js';
import { expenseRepository, type ExpenseRepository } from './expense.repository.js';

export class ExpenseService {
  constructor(private readonly repo: ExpenseRepository = expenseRepository) {}

  async create(tenantId: string, input: CreateExpenseInput, userId?: string) {
    const expense = await this.repo.create(tenantId, input, userId);
    return {
      ...expense,
      amount: Number(expense.amount),
    };
  }

  async list(tenantId: string, query: QueryExpenseInput) {
    return this.repo.findMany(tenantId, query);
  }

  async getById(tenantId: string, id: string) {
    const expense = await this.repo.findById(tenantId, id);
    if (!expense) {
      throw new NotFoundError('Expense record not found.');
    }
    return {
      ...expense,
      amount: Number(expense.amount),
    };
  }

  async delete(tenantId: string, id: string) {
    const expense = await this.repo.findById(tenantId, id);
    if (!expense) {
      throw new NotFoundError('Expense record not found.');
    }
    await this.repo.delete(tenantId, id);
    return { id, deleted: true };
  }
}

export const expenseService = new ExpenseService();
