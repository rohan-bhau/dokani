import { Router } from 'express';
import { z } from 'zod';
import { Permission } from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { adminController } from './admin.controller.js';

export const adminRouter = Router();

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']),
});

const assignPlanSchema = z.object({
  planCode: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']),
});

adminRouter.use(authenticate);
adminRouter.use(requirePermissions(Permission.PLATFORM_MANAGE));

adminRouter.get('/tenants', adminController.listTenants);
adminRouter.get('/tenants/:id', adminController.getTenantDetails);
adminRouter.patch('/tenants/:id/status', validateRequest({ body: updateStatusSchema }), adminController.updateStatus);
adminRouter.post('/tenants/:id/subscription', validateRequest({ body: assignPlanSchema }), adminController.assignSubscription);
