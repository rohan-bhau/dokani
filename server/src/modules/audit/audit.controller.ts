import type { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service.js';
import { getRequestContext } from '../../common/context.js';

export class AuditController {
  getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const { entityType, entityId, page, limit } = req.query;

      const result = await auditService.getLogs({
        tenantId,
        ...(typeof entityType === 'string' && entityType ? { entityType } : {}),
        ...(typeof entityId === 'string' && entityId ? { entityId } : {}),
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Audit logs fetched successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const auditController = new AuditController();
