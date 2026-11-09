import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
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

  handleSslSuccess = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const payload = { ...req.query, ...req.body };
    const frontendUrl =
      (typeof req.query.return_origin === 'string' && req.query.return_origin) || env.CORS_ORIGIN;

    try {
      const result = await this.service.handleCallbackOrIpn('SSLCOMMERZ', payload);

      if (result.success) {
        const invoiceId = result.invoiceId || '';
        const tranId = (payload.tran_id || '') as string;
        const valId = (payload.val_id || '') as string;
        const bankTranId = (payload.bank_tran_id || '') as string;
        const amount = (payload.amount || result.amount || '') as string;

        res.redirect(
          `${frontendUrl}/pos?payment_status=success&invoice_id=${encodeURIComponent(invoiceId)}&tran_id=${encodeURIComponent(tranId)}&val_id=${encodeURIComponent(valId)}&bank_tran_id=${encodeURIComponent(bankTranId)}&amount=${encodeURIComponent(amount)}`
        );
      } else {
        const reason = result.reason || 'Payment verification failed';
        res.redirect(`${frontendUrl}/pos?payment_status=failed&reason=${encodeURIComponent(reason)}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment error';
      res.redirect(`${frontendUrl}/pos?payment_status=failed&reason=${encodeURIComponent(message)}`);
    }
  };

  handleSslFail = async (req: Request, res: Response): Promise<void> => {
    const payload = { ...req.query, ...req.body };
    const frontendUrl =
      (typeof req.query.return_origin === 'string' && req.query.return_origin) || env.CORS_ORIGIN;
    const reason = (payload.error || payload.failedreason || 'Payment failed') as string;
    res.redirect(`${frontendUrl}/pos?payment_status=failed&reason=${encodeURIComponent(reason)}`);
  };

  handleSslCancel = async (req: Request, res: Response): Promise<void> => {
    const frontendUrl =
      (typeof req.query.return_origin === 'string' && req.query.return_origin) || env.CORS_ORIGIN;
    res.redirect(`${frontendUrl}/pos?payment_status=cancelled`);
  };

  handleSslIpn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = { ...req.query, ...req.body };
      const result = await this.service.handleCallbackOrIpn('SSLCOMMERZ', payload);
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
