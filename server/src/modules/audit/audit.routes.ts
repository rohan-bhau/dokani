import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { auditController } from './audit.controller.js';

export const auditRouter = Router();

auditRouter.use(authenticate);

auditRouter.get(
  '/logs',
  requirePermissions('audit_log:view'),
  auditController.getLogs
);
