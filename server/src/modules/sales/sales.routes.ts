import { Router } from 'express';
import {
  createSaleSchema,
  createSaleReturnSchema,
  Permission,
  querySaleSchema,
  voidSaleSchema,
} from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions, requireAnyPermission } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { idempotencyMiddleware } from './idempotency.middleware.js';
import { salesController } from './sales.controller.js';

export const salesRouter: Router = Router();

salesRouter.use(authenticate);

salesRouter.post(
  '/',
  requirePermissions(Permission.SALE_CREATE),
  idempotencyMiddleware,
  validateRequest({ body: createSaleSchema }),
  salesController.checkout
);

salesRouter.get(
  '/',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  validateRequest({ query: querySaleSchema }),
  salesController.list
);

salesRouter.get(
  '/returns/list',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  salesController.listReturns
);

salesRouter.get(
  '/:id',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  salesController.getById
);

salesRouter.post(
  '/:id/void',
  requirePermissions(Permission.SALE_VOID),
  validateRequest({ body: voidSaleSchema }),
  salesController.void
);

salesRouter.post(
  '/:id/return',
  requireAnyPermission(Permission.SALE_RETURN, Permission.SALE_VOID),
  validateRequest({ body: createSaleReturnSchema }),
  salesController.processReturn
);
