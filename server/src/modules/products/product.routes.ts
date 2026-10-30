import { Router } from 'express';
import {
  createProductSchema,
  Permission,
  queryProductSchema,
  updateProductSchema,
} from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { checkProductLimit } from '../../middleware/featureGuard.js';
import { productController } from './product.controller.js';

export const productRouter = Router();

productRouter.use(authenticate);

productRouter.post(
  '/',
  requirePermissions(Permission.PRODUCT_CREATE),
  checkProductLimit,
  validateRequest({ body: createProductSchema }),
  productController.create
);

productRouter.get(
  '/',
  requirePermissions(Permission.PRODUCT_VIEW),
  validateRequest({ query: queryProductSchema }),
  productController.list
);

productRouter.get(
  '/:id',
  requirePermissions(Permission.PRODUCT_VIEW),
  productController.getById
);

productRouter.patch(
  '/:id',
  requirePermissions(Permission.PRODUCT_UPDATE),
  validateRequest({ body: updateProductSchema }),
  productController.update
);

productRouter.delete(
  '/:id',
  requirePermissions(Permission.PRODUCT_DELETE),
  productController.delete
);

productRouter.post(
  '/import-csv',
  requirePermissions(Permission.PRODUCT_CREATE),
  checkProductLimit,
  productController.importCsv
);
