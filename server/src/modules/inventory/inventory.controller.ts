import type { NextFunction, Request, Response } from 'express';
import { getRequestContext } from '../../common/context.js';
import { inventoryService, type InventoryService } from './inventory.service.js';

export class InventoryController {
  constructor(private readonly service: InventoryService = inventoryService) {}

  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const result = await this.service.adjustStock(tenantId, req.body, userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Stock adjusted successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getProductStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const stock = await this.service.getProductStock(tenantId, req.params.productId as string);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Stock level retrieved successfully.',
        data: stock,
      });
    } catch (err) {
      next(err);
    }
  };

  listMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const movements = await this.service.listStockMovements(
        tenantId,
        req.params.productId as string,
        limit
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Stock movements retrieved successfully.',
        data: movements,
      });
    } catch (err) {
      next(err);
    }
  };

  getLowStockAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const alerts = await this.service.getLowStockAlerts(tenantId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Low stock alerts retrieved successfully.',
        data: alerts,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const inventoryController = new InventoryController();
