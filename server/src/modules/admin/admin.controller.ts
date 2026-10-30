import type { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';

export class AdminController {
  listTenants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, q, status } = req.query;
      const result = await adminService.listTenants({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        q: q as string | undefined,
        status: status as any,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Tenants listed successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getTenantDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = await adminService.getTenantDetails(req.params.id as string);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Tenant details fetched successfully.',
        data: tenant,
      });
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body;
      const tenant = await adminService.updateTenantStatus(req.params.id as string, status);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Tenant status updated to ${status}.`,
        data: tenant,
      });
    } catch (err) {
      next(err);
    }
  };

  assignSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { planCode } = req.body;
      const subscription = await adminService.assignSubscription(req.params.id as string, planCode);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Plan ${planCode} assigned to tenant successfully.`,
        data: subscription,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const adminController = new AdminController();
