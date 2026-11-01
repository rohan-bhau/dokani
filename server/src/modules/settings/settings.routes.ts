import { Router } from 'express';
import { updateSettingsSchema, Permission } from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { settingsController } from './settings.controller.js';

export const settingsRouter = Router();

settingsRouter.use(authenticate);

settingsRouter.get(
  '/',
  requirePermissions(Permission.TENANT_SETTINGS_MANAGE),
  settingsController.getSettings
);

settingsRouter.patch(
  '/',
  requirePermissions(Permission.TENANT_SETTINGS_MANAGE),
  validateRequest({ body: updateSettingsSchema }),
  settingsController.updateSettings
);
