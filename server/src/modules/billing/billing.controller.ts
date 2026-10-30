import type { Request, Response, NextFunction } from 'express';
import { getRequestContext } from '../../common/context.js';
import { billingService } from './billing.service.js';

export class BillingController {
  listPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plans = await billingService.listPlans();
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Plans retrieved successfully.',
        data: plans,
      });
    } catch (err) {
      next(err);
    }
  };

  getSubscription = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const subscription = await billingService.getTenantSubscription(tenantId);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Current subscription retrieved.',
        data: subscription,
      });
    } catch (err) {
      next(err);
    }
  };

  subscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const { planCode } = req.body;
      const result = await billingService.assignPlan(tenantId, planCode);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Successfully upgraded to ${result.plan.name} plan.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const billingController = new BillingController();
