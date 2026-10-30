import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from './env.js';
import { logger } from './logger.js';
import { verifyAccessToken } from '../modules/auth/auth.jwt.js';

let ioInstance: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  tenantId?: string;
  userId?: string;
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.tenantId = payload.tenantId;
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (socket.tenantId) {
      const tenantRoom = `tenant:${socket.tenantId}`;
      socket.join(tenantRoom);
      logger.info({ socketId: socket.id, tenantId: socket.tenantId }, 'Socket client joined tenant room');
    }

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Socket client disconnected');
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return ioInstance;
}

export function emitToTenant(tenantId: string, event: string, data: unknown): void {
  if (!ioInstance) {
    return;
  }
  ioInstance.to(`tenant:${tenantId}`).emit(event, data);
}
