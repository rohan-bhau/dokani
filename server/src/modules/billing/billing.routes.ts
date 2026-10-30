import { Router } from 'express';
import { z } from 'zod';
import { Permission } from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { billingController } from './billing.controller.js';

export const billingRouter = Router();

const subscribeSchema = z.object({
  planCode: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
});

// Plans list is public for merchants
billingRouter.get('/plans', billingController.listPlans);

// Tenant subscription requires auth & settings manage permission
billingRouter.use(authenticate);

billingRouter.get(
  '/subscription',
  requirePermissions(Permission.TENANT_SETTINGS_MANAGE),
  billingController.getSubscription
);

billingRouter.post(
  '/subscribe',
  requirePermissions(Permission.TENANT_SETTINGS_MANAGE),
  validateRequest({ body: subscribeSchema }),
  billingController.subscribe
);
