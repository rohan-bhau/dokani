import { Queue, Worker, type Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { prisma } from '../config/prisma.js';

export const LOW_STOCK_QUEUE_NAME = 'low-stock-alerts';

export const lowStockQueue = new Queue(LOW_STOCK_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export async function processLowStockCheck(tenantId?: string): Promise<{ alertedProductsCount: number }> {
  const whereClause: { tenantId?: string } = {};
  if (tenantId) {
    whereClause.tenantId = tenantId;
  }

  // Find products where current stock <= reorderLevel
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      stockLevel: true,
      tenant: { select: { id: true, name: true, phone: true } },
    },
  });

  const lowStockItems = products.filter(
    (p) => (p.stockLevel?.quantity ?? 0) <= p.reorderLevel && p.isActive
  );

  if (lowStockItems.length > 0) {
    logger.info(
      {
        count: lowStockItems.length,
        items: lowStockItems.map((item) => ({
          sku: item.sku,
          name: item.name,
          currentStock: item.stockLevel?.quantity ?? 0,
          reorderLevel: item.reorderLevel,
          tenant: item.tenant.name,
        })),
      },
      'Low stock threshold triggered for merchant products'
    );
  }

  return { alertedProductsCount: lowStockItems.length };
}

export function startLowStockWorker(): Worker {
  const worker = new Worker(
    LOW_STOCK_QUEUE_NAME,
    async (job: Job) => {
      logger.info({ jobId: job.id, data: job.data }, 'Processing low-stock check job');
      const result = await processLowStockCheck(job.data?.tenantId);
      return result;
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on('completed', (job: Job, result: unknown) => {
    logger.info({ jobId: job.id, result }, 'Low stock check job completed successfully');
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error({ jobId: job?.id, err }, 'Low stock check job failed');
  });

  return worker;
}
