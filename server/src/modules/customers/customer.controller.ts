import type { NextFunction, Request, Response } from 'express';
import { getRequestContext } from '../../common/context.js';
import { CustomerService } from './customer.service.js';
import { CustomerRepository } from './customer.repository.js';
import type { QueryCustomerInput } from '@dokani/shared';

const customerRepo = new CustomerRepository();
export const customerService = new CustomerService(customerRepo);

export class CustomerController {
  constructor(private readonly service: CustomerService = customerService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const customer = await this.service.create(tenantId, req.body, userId);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Customer created successfully.',
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const query = (req.query as unknown) as QueryCustomerInput;
      const result = await this.service.findAll(tenantId, query);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Customers retrieved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const customer = await this.service.findById(tenantId, req.params.id as string);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Customer retrieved successfully.',
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const customer = await this.service.update(tenantId, req.params.id as string, req.body);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Customer updated successfully.',
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  };

  collectDue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const result = await this.service.collectDue(
        tenantId,
        req.params.id as string,
        req.body,
        userId
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Due collection recorded successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await this.service.getLedger(tenantId, req.params.id as string, page, limit);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Customer ledger retrieved successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const customerController = new CustomerController();
