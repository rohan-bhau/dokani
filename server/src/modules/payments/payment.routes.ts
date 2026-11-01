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

// Public Gateway Callbacks & IPNs
paymentRouter.post('/:provider/callback', paymentController.handleCallback);
paymentRouter.get('/:provider/callback', paymentController.handleCallback);
paymentRouter.post('/:provider/ipn', paymentController.handleIpn);
