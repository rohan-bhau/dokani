import { createServer } from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initSocketServer } from './config/socket.js';
import { startLowStockWorker } from './jobs/low-stock.worker.js';

const app = createApp();
const httpServer = createServer(app);
initSocketServer(httpServer);
const lowStockWorker = startLowStockWorker();

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

