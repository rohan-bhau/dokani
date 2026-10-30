import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../common/errors.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.headers['x-request-id']?.toString() || 'unknown';

  if (err instanceof ZodError) {
    const details = err.errors.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request input.',
      details,
      requestId,
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ err, requestId, path: req.path }, err.message);

    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      requestId,
    });
    return;
  }

  // Handle Prisma database errors
  if (err && typeof err === 'object' && 'code' in err) {
    const prismaCode = (err as { code: string }).code;

    if (prismaCode === 'P2002') {
      res.status(409).json({
        success: false,
        statusCode: 409,
        code: 'CONFLICT',
        message: 'A record with this unique identifier already exists.',
        requestId,
      });
      return;
    }

    if (prismaCode === 'P2003') {
      res.status(400).json({
        success: false,
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'Invalid foreign key reference or the referenced record does not exist.',
        requestId,
      });
      return;
    }

    if (prismaCode === 'P2025') {
      res.status(404).json({
        success: false,
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'The requested database record was not found.',
        requestId,
      });
      return;
    }
  }

  logger.error({ err, requestId, path: req.path }, 'Unhandled server exception');

  res.status(500).json({
    success: false,
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal error occurred.',
    requestId,
    ...(env.NODE_ENV !== 'production' && err instanceof Error ? { stack: err.stack } : {}),
  });
};
