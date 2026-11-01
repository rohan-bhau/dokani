import { Router } from 'express';
import {
  inviteStaffSchema,
  updateStaffRoleSchema,
  updateRolePermissionsSchema,
  Permission,
} from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions, requireAnyPermission } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { staffController } from './staff.controller.js';

export const staffRouter = Router();

staffRouter.use(authenticate);

staffRouter.get(
  '/',
  requireAnyPermission(Permission.STAFF_MANAGE, Permission.STAFF_VIEW),
  staffController.listStaff
);

staffRouter.post(
  '/invite',
  requirePermissions(Permission.STAFF_MANAGE),
  validateRequest({ body: inviteStaffSchema }),
  staffController.inviteStaff
);

staffRouter.patch(
  '/:id/role',
  requirePermissions(Permission.STAFF_MANAGE),
  validateRequest({ body: updateStaffRoleSchema }),
  staffController.updateRole
);

staffRouter.post(
  '/:id/deactivate',
  requirePermissions(Permission.STAFF_MANAGE),
  staffController.deactivate
);

staffRouter.post(
  '/:id/reactivate',
  requirePermissions(Permission.STAFF_MANAGE),
  staffController.reactivate
);

staffRouter.get(
  '/roles/permissions',
  requirePermissions(Permission.STAFF_MANAGE),
  staffController.getRolePermissionMatrix
);

staffRouter.patch(
  '/roles/:roleId/permissions',
  requirePermissions(Permission.TENANT_SETTINGS_MANAGE),
  validateRequest({ body: updateRolePermissionsSchema }),
  staffController.updateRolePermissions
);
