import { Router } from 'express';
import { Permission, stockAdjustmentSchema } from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { inventoryController } from './inventory.controller.js';

export const inventoryRouter = Router();

inventoryRouter.use(authenticate);

inventoryRouter.post(
  '/adjust',
  requirePermissions(Permission.STOCK_ADJUST),
  validateRequest({ body: stockAdjustmentSchema }),
  inventoryController.adjustStock
);

inventoryRouter.get(
  '/alerts/low-stock',
  requirePermissions(Permission.STOCK_VIEW),
  inventoryController.getLowStockAlerts
);

inventoryRouter.get(
  '/:productId',
  requirePermissions(Permission.STOCK_VIEW),
  inventoryController.getProductStock
);

inventoryRouter.get(
  '/:productId/movements',
  requirePermissions(Permission.STOCK_VIEW),
  inventoryController.listMovements
);
