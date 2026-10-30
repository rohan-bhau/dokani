import { Router } from 'express';
import {
  createCustomerSchema,
  updateCustomerSchema,
  queryCustomerSchema,
  collectDueSchema,
  Permission,
} from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { customerController } from './customer.controller.js';

export const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.post(
  '/',
  requirePermissions(Permission.CUSTOMER_MANAGE),
  validateRequest({ body: createCustomerSchema }),
  customerController.create
);

customerRouter.get(
  '/',
  requirePermissions(Permission.CUSTOMER_VIEW),
  validateRequest({ query: queryCustomerSchema }),
  customerController.findAll
);

customerRouter.get(
  '/:id',
  requirePermissions(Permission.CUSTOMER_VIEW),
  customerController.findById
);

customerRouter.patch(
  '/:id',
  requirePermissions(Permission.CUSTOMER_MANAGE),
  validateRequest({ body: updateCustomerSchema }),
  customerController.update
);

customerRouter.post(
  '/:id/collect-due',
  requirePermissions(Permission.DUE_COLLECT),
  validateRequest({ body: collectDueSchema }),
  customerController.collectDue
);

customerRouter.get(
  '/:id/ledger',
  requirePermissions(Permission.CUSTOMER_VIEW),
  customerController.getLedger
);
