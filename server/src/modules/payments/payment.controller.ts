import type { NextFunction, Request, Response } from 'express';
import { getRequestContext } from '../../common/context.js';
import { PaymentService } from './payment.service.js';
import { PaymentRepository } from './payment.repository.js';
import { initiatePaymentSchema } from '@dokani/shared';

const paymentRepo = new PaymentRepository();
export const paymentService = new PaymentService(paymentRepo);

export class PaymentController {
  constructor(private readonly service: PaymentService = paymentService) {}

  initiate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const input = initiatePaymentSchema.parse(req.body);
      const result = await this.service.initiatePayment(tenantId, input);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Payment session initiated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  handleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provider = req.params.provider as string;
      const payload = { ...req.query, ...req.body };
      const result = await this.service.handleCallbackOrIpn(provider, payload);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Payment callback processed successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  handleIpn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provider = req.params.provider as string;
      const payload = { ...req.query, ...req.body };
      const result = await this.service.handleCallbackOrIpn(provider, payload);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'IPN processed successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const result = await this.service.getPaymentStatus(tenantId, req.params.id as string);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Payment status retrieved.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  getPublicInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.params.token as string;
      const invoice = await this.service.getPublicInvoiceByToken(token);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Invoice retrieved for public payment.',
        data: invoice,
      });
    } catch (err) {
      next(err);
    }
  };

  completeSimulatedPublicPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.params.token as string;
      const { provider, transactionId } = req.body;
      const result = await this.service.completeSimulatedPublicPayment(token, provider, transactionId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const paymentController = new PaymentController();
