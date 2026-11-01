import type { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';
import { getRequestContext } from '../../common/context.js';

export class ReportsController {
  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const { startDate, endDate } = req.query;

      const summary = await reportsService.getExecutiveSummary({
        tenantId,
        ...(typeof startDate === 'string' && startDate ? { startDate: new Date(startDate) } : {}),
        ...(typeof endDate === 'string' && endDate ? { endDate: new Date(endDate) } : {}),
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Executive summary report fetched successfully.',
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  };

  getTopProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const { startDate, endDate } = req.query;

      const topProducts = await reportsService.getTopSellingProducts(
        tenantId,
        limit,
        typeof startDate === 'string' && startDate ? new Date(startDate) : undefined,
        typeof endDate === 'string' && endDate ? new Date(endDate) : undefined
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Top selling products fetched successfully.',
        data: topProducts,
      });
    } catch (err) {
      next(err);
    }
  };

  getDuesAging = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const aging = await reportsService.getDuesAging(tenantId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Dues aging analysis report fetched successfully.',
        data: aging,
      });
    } catch (err) {
      next(err);
    }
  };

  getSalesDetailed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const { startDate, endDate, groupBy } = req.query;

      const report = await reportsService.getSalesDetailed({
        tenantId,
        ...(groupBy === 'day' || groupBy === 'week' || groupBy === 'month' ? { groupBy } : {}),
        ...(typeof startDate === 'string' && startDate ? { startDate: new Date(startDate) } : {}),
        ...(typeof endDate === 'string' && endDate ? { endDate: new Date(endDate) } : {}),
      });


      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Detailed sales report fetched successfully.',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  };

  getProfitLoss = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const { startDate, endDate } = req.query;

      const report = await reportsService.getProfitLoss({
        tenantId,
        ...(typeof startDate === 'string' && startDate ? { startDate: new Date(startDate) } : {}),
        ...(typeof endDate === 'string' && endDate ? { endDate: new Date(endDate) } : {}),
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Profit & Loss report fetched successfully.',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  };

  getStockValuation = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const report = await reportsService.getStockValuation(tenantId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Stock valuation report fetched successfully.',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  };

  getVatSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const { startDate, endDate } = req.query;

      const report = await reportsService.getVatSummary({
        tenantId,
        ...(typeof startDate === 'string' && startDate ? { startDate: new Date(startDate) } : {}),
        ...(typeof endDate === 'string' && endDate ? { endDate: new Date(endDate) } : {}),
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'VAT summary report fetched successfully.',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const reportsController = new ReportsController();

