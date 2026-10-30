import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';
import { NotFoundError } from './common/errors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productRouter } from './modules/products/product.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
import { salesRouter } from './modules/sales/sales.routes.js';
import { customerRouter } from './modules/customers/customer.routes.js';
import { purchaseRouter } from './modules/purchases/purchase.routes.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { billingRouter } from './modules/billing/billing.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';

(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Dokani Retail Engine API',
      version: 'v1',
    });
  });

  app.get('/api/v1/health', async (_req, res) => {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    try {
      await redis.ping();
    } catch {
      redisStatus = 'unhealthy';
    }

    const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/products', productRouter);
  app.use('/api/v1/inventory', inventoryRouter);
  app.use('/api/v1/sales', salesRouter);
  app.use('/api/v1/customers', customerRouter);
  app.use('/api/v1/purchases', purchaseRouter);
  app.use('/api/v1/payments', paymentRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.use('/api/v1/audit', auditRouter);
  app.use('/api/v1/billing', billingRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use((_req, _res, next) => {
    next(new NotFoundError('Requested endpoint does not exist.'));
  });

  app.use(errorHandler);

  return app;
};
