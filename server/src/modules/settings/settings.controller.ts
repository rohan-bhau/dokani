import type { NextFunction, Request, Response } from 'express';
import { getRequestContext } from '../../common/context.js';
import { settingsService, type SettingsService } from './settings.service.js';

export class SettingsController {
  constructor(private readonly service: SettingsService = settingsService) {}

  getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.getSettings(tenantId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Settings retrieved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.updateSettings(tenantId, req.body);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Settings updated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const settingsController = new SettingsController();
