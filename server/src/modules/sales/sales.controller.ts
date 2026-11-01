import type { NextFunction, Request, Response } from 'express';
import type { QuerySaleInput } from '@dokani/shared';
import { getRequestContext } from '../../common/context.js';
import { salesService, type SalesService } from './sales.service.js';

export class SalesController {
  constructor(private readonly service: SalesService = salesService) {}

  checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const idempotencyKey = (req.headers['idempotency-key'] ||
        req.headers['x-idempotency-key']) as string | undefined;

      const invoice = await this.service.checkout(tenantId, req.body, userId, idempotencyKey);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Sale completed successfully.',
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const invoice = await this.service.getById(tenantId, req.params.id as string);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Invoice retrieved successfully.',
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.list(tenantId, req.query as unknown as QuerySaleInput);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Invoices retrieved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  void = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const invoice = await this.service.voidInvoice(
        tenantId,
        req.params.id as string,
        req.body.reason,
        userId
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Invoice voided successfully.',
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  };

  processReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const saleReturn = await this.service.processReturn(
        tenantId,
        req.params.id as string,
        req.body,
        userId
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Return processed and inventory restocked successfully.',
        data: saleReturn,
      });
    } catch (err) {
      next(err);
    }
  };

  listReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const returns = await this.service.listReturns(
        tenantId,
        req.query.invoiceId as string | undefined
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Returns retrieved successfully.',
        data: returns,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const salesController = new SalesController();
