import type { Request, Response, NextFunction } from 'express';
import { getRequestContext } from '../../common/context.js';
import { expenseService, type ExpenseService } from './expense.service.js';

export class ExpenseController {
  constructor(private readonly service: ExpenseService = expenseService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const expense = await this.service.create(tenantId, req.body, userId);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Expense recorded successfully.',
        data: expense,
      });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.list(tenantId, req.query as any);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Expenses retrieved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const expense = await this.service.getById(tenantId, req.params.id as string);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Expense retrieved successfully.',
        data: expense,
      });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.delete(tenantId, req.params.id as string);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Expense deleted successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const expenseController = new ExpenseController();
