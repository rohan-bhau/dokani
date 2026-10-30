import { Router } from 'express';
import {
  createExpenseSchema,
  queryExpenseSchema,
  Permission,
} from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { expenseController } from './expense.controller.js';

export const expenseRouter = Router();

expenseRouter.use(authenticate);

expenseRouter.post(
  '/',
  requirePermissions(Permission.EXPENSE_MANAGE),
  validateRequest({ body: createExpenseSchema }),
  expenseController.create
);

expenseRouter.get(
  '/',
  requirePermissions(Permission.EXPENSE_VIEW),
  validateRequest({ query: queryExpenseSchema }),
  expenseController.list
);

expenseRouter.get(
  '/:id',
  requirePermissions(Permission.EXPENSE_VIEW),
  expenseController.getById
);

expenseRouter.delete(
  '/:id',
  requirePermissions(Permission.EXPENSE_MANAGE),
  expenseController.delete
);
