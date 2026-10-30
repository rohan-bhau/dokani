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
