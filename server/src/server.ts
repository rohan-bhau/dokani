import { createServer } from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { initSocketServer } from './config/socket.js';
import { startLowStockWorker } from './jobs/low-stock.worker.js';
import { seedDemoData } from './scripts/seed-demo-data.js';

const app = createApp();
const httpServer = createServer(app);
initSocketServer(httpServer);
const lowStockWorker = startLowStockWorker();

// Auto-seed demo stores in development if missing so demo users are never lost
if (env.NODE_ENV !== 'production') {
  prisma.user
    .findFirst({ where: { phone: '01711111111' } })
    .then(async (demoUser) => {
      if (!demoUser) {
        logger.info('Demo stores not detected. Seeding demo accounts and products...');
        await seedDemoData().catch((err) => {
          logger.error({ err }, 'Failed to auto-seed demo data');
        });
      }
    })
    .catch(() => {});
}

const server = httpServer.listen(env.PORT, () => {
  logger.info(`Dokani API listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const handleShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await lowStockWorker.close();
  } catch {}
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

