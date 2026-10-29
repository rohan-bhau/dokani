import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

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
