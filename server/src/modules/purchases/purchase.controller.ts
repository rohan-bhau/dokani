import type { NextFunction, Request, Response } from 'express';
import { getRequestContext } from '../../common/context.js';
import { PurchaseService } from './purchase.service.js';
import { PurchaseRepository } from './purchase.repository.js';
import type { QuerySupplierInput, QueryPurchaseInput } from '@dokani/shared';

const purchaseRepo = new PurchaseRepository();
export const purchaseService = new PurchaseService(purchaseRepo);

export class PurchaseController {
  constructor(private readonly service: PurchaseService = purchaseService) {}

  // Suppliers
  createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const supplier = await this.service.createSupplier(tenantId, req.body);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Supplier created successfully.',
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  };

  findAllSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const query = (req.query as unknown) as QuerySupplierInput;
      const result = await this.service.findAllSuppliers(tenantId, query);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Suppliers retrieved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  findSupplierById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const supplier = await this.service.findSupplierById(tenantId, req.params.id as string);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Supplier retrieved successfully.',
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  };

  updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const supplier = await this.service.updateSupplier(tenantId, req.params.id as string, req.body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Supplier updated successfully.',
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  };

  // Purchases
  createPurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const purchase = await this.service.createPurchase(tenantId, req.body, userId);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Purchase created successfully and stock updated.',
        data: purchase,
      });
    } catch (err) {
      next(err);
    }
  };

  findAllPurchases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const query = (req.query as unknown) as QueryPurchaseInput;
      const result = await this.service.findAllPurchases(tenantId, query);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Purchases retrieved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  findPurchaseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const purchase = await this.service.findPurchaseById(tenantId, req.params.id as string);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Purchase retrieved successfully.',
        data: purchase,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const purchaseController = new PurchaseController();
