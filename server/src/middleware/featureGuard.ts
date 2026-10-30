import type { Request, Response, NextFunction } from 'express';
import { getRequestContext } from '../common/context.js';
import { billingService } from '../modules/billing/billing.service.js';

export const checkProductLimit = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tenantId } = getRequestContext();
    await billingService.checkProductLimit(tenantId);
    next();
  } catch (err) {
    next(err);
  }
};

export const checkStaffLimit = async (
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tenantId } = getRequestContext();
    await billingService.checkStaffLimit(tenantId);
    next();
  } catch (err) {
    next(err);
  }
};
