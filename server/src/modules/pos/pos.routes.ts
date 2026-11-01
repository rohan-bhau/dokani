import { Router, type Request, type Response, type NextFunction } from 'express';
import { holdCartSchema, Permission } from '@dokani/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermissions } from '../../middleware/requirePermissions.js';
import { validateRequest } from '../../middleware/validate.js';
import { getRequestContext } from '../../common/context.js';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../common/errors.js';

export const posRouter = Router();

posRouter.use(authenticate);

// 1. Hold a cart (F9)
posRouter.post(
  '/hold',
  requirePermissions(Permission.SALE_CREATE),
  validateRequest({ body: holdCartSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = getRequestContext();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

      const heldCart = await prisma.heldCart.create({
        data: {
          tenantId,
          userId,
          cartLabel: req.body.cartLabel || 'Held Cart',
          cartData: req.body,
          expiresAt,
        },
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Cart held successfully.',
        data: heldCart,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 2. List held carts
posRouter.get(
  '/held',
  requirePermissions(Permission.SALE_CREATE),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const carts = await prisma.heldCart.findMany({
        where: {
          tenantId,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Held carts retrieved.',
        data: carts,
      });
    } catch (err) {
      next(err);
    }
  }
);

// 3. Delete or resume held cart
posRouter.delete(
  '/held/:id',
  requirePermissions(Permission.SALE_CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = getRequestContext();
      const id = req.params.id as string;

      const cart = await prisma.heldCart.findFirst({
        where: { id, tenantId },
      });

      if (!cart) {
        throw new NotFoundError('Held cart not found or already deleted.');
      }

      await prisma.heldCart.delete({ where: { id } });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Held cart removed.',
      });
    } catch (err) {
      next(err);
    }
  }
);
