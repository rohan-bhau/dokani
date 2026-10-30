import { Router } from 'express';
import {
  createSaleSchema,
  Permission,
  querySaleSchema,
  voidSaleSchema,
} from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { idempotencyMiddleware } from './idempotency.middleware.js';
import { salesController } from './sales.controller.js';

export const salesRouter = Router();

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
  requirePermissions(Permission.REPORT_VIEW_OWN),
  validateRequest({ query: querySaleSchema }),
  salesController.list
);

salesRouter.get(
  '/:id',
  requirePermissions(Permission.REPORT_VIEW_OWN),
  salesController.getById
);

salesRouter.post(
  '/:id/void',
  requirePermissions(Permission.SALE_VOID),
  validateRequest({ body: voidSaleSchema }),
  salesController.void
);
