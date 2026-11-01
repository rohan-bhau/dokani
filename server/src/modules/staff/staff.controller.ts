import type { NextFunction, Request, Response } from 'express';
import { getRequestContext } from '../../common/context.js';
import { staffService, type StaffService } from './staff.service.js';

export class StaffController {
  constructor(private readonly service: StaffService = staffService) {}

  listStaff = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.listStaff(tenantId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Staff directory retrieved.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  inviteStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.inviteStaff(tenantId, req.body);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Staff invitation created successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.updateRole(tenantId, req.params.id as string, req.body.roleId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Staff role updated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.deactivateStaff(tenantId, req.params.id as string);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Staff member deactivated and active sessions revoked.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  reactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.reactivateStaff(tenantId, req.params.id as string);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Staff member reactivated.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getRolePermissionMatrix = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.getRolePermissionMatrix(tenantId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Role permissions matrix retrieved.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  updateRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.updateRolePermissions(tenantId, req.params.roleId as string, req.body);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Role permissions updated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const staffController = new StaffController();
