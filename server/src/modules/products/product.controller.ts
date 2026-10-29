import type { NextFunction, Request, Response } from 'express';
import type { QueryProductInput } from '@dokani/shared';
import { getRequestContext } from '../../common/context.js';
import { productService, type ProductService } from './product.service.js';

export class ProductController {
  constructor(private readonly service: ProductService = productService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const product = await this.service.create(tenantId, req.body, userId);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Product created successfully.',
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const product = await this.service.getById(tenantId, req.params.id as string);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Product retrieved successfully.',
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.list(tenantId, req.query as unknown as QueryProductInput);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Products retrieved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const product = await this.service.update(tenantId, req.params.id as string, req.body);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Product updated successfully.',
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      await this.service.delete(tenantId, req.params.id as string);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Product deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  };

  importCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const csvData = typeof req.body === 'string' ? req.body : req.body.csvData;
      const result = await this.service.importCsv(tenantId, csvData, userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'CSV import processed.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const productController = new ProductController();
