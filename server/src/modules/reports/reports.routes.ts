import { Router } from 'express';
import { Permission } from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAnyPermission } from '../../middleware/requirePermissions.js';
import { reportsController } from './reports.controller.js';

export const reportsRouter = Router();

reportsRouter.use(authenticate);

reportsRouter.get(
  '/summary',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  reportsController.getSummary
);

reportsRouter.get(
  '/top-products',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  reportsController.getTopProducts
);

reportsRouter.get(
  '/dues-aging',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  reportsController.getDuesAging
);

reportsRouter.get(
  '/sales-detailed',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  reportsController.getSalesDetailed
);

reportsRouter.get(
  '/profit-loss',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  reportsController.getProfitLoss
);

reportsRouter.get(
  '/stock-value',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  reportsController.getStockValuation
);

reportsRouter.get(
  '/vat-summary',
  requireAnyPermission(Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL),
  reportsController.getVatSummary
);

