import { Router } from 'express';
import { Permission, initiatePaymentSchema } from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { paymentController } from './payment.controller.js';

export const paymentRouter = Router();

// Public Customer-Facing Payment Checkout Link
paymentRouter.get('/public/:token', paymentController.getPublicInvoice);
paymentRouter.post('/public/:token/complete-simulated', paymentController.completeSimulatedPublicPayment);

// Protected routes (Cashier / POS staff)
paymentRouter.post(
  '/initiate',
  authenticate,
  requirePermissions(Permission.SALE_CREATE),
  validateRequest({ body: initiatePaymentSchema }),
  paymentController.initiate
);

paymentRouter.get(
  '/:id/status',
  authenticate,
  requirePermissions(Permission.SALE_CREATE),
  paymentController.getStatus
);

// Dedicated SSLCommerz Gateway Callbacks (both POST and GET supported)
paymentRouter.post('/sslcommerz/success', paymentController.handleSslSuccess);
paymentRouter.get('/sslcommerz/success', paymentController.handleSslSuccess);
paymentRouter.post('/sslcommerz/fail', paymentController.handleSslFail);
paymentRouter.get('/sslcommerz/fail', paymentController.handleSslFail);
paymentRouter.post('/sslcommerz/cancel', paymentController.handleSslCancel);
paymentRouter.get('/sslcommerz/cancel', paymentController.handleSslCancel);
paymentRouter.post('/sslcommerz/ipn', paymentController.handleSslIpn);

// Public Gateway Callbacks & IPNs
paymentRouter.post('/:provider/callback', paymentController.handleCallback);
paymentRouter.get('/:provider/callback', paymentController.handleCallback);
paymentRouter.post('/:provider/ipn', paymentController.handleIpn);
