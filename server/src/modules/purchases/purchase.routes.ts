import { Router } from 'express';
import {
  createSupplierSchema,
  updateSupplierSchema,
  querySupplierSchema,
  createPurchaseSchema,
  queryPurchaseSchema,
  Permission,
} from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { purchaseController } from './purchase.controller.js';

export const purchaseRouter = Router();

purchaseRouter.use(authenticate);

// Suppliers
purchaseRouter.post(
  '/suppliers',
  requirePermissions(Permission.SUPPLIER_MANAGE),
  validateRequest({ body: createSupplierSchema }),
  purchaseController.createSupplier
);

purchaseRouter.get(
  '/suppliers',
  requirePermissions(Permission.SUPPLIER_MANAGE),
  validateRequest({ query: querySupplierSchema }),
  purchaseController.findAllSuppliers
);

purchaseRouter.get(
  '/suppliers/:id',
  requirePermissions(Permission.SUPPLIER_MANAGE),
  purchaseController.findSupplierById
);

purchaseRouter.patch(
  '/suppliers/:id',
  requirePermissions(Permission.SUPPLIER_MANAGE),
  validateRequest({ body: updateSupplierSchema }),
  purchaseController.updateSupplier
);

// Purchases
purchaseRouter.post(
  '/',
  requirePermissions(Permission.PURCHASE_MANAGE),
  validateRequest({ body: createPurchaseSchema }),
  purchaseController.createPurchase
);

purchaseRouter.get(
  '/',
  requirePermissions(Permission.PURCHASE_MANAGE),
  validateRequest({ query: queryPurchaseSchema }),
  purchaseController.findAllPurchases
);

purchaseRouter.get(
  '/:id',
  requirePermissions(Permission.PURCHASE_MANAGE),
  purchaseController.findPurchaseById
);
