import type { NextFunction, Request, Response } from 'express';
import { requestContext } from '../common/context.js';
import { UnauthorizedError } from '../common/errors.js';
import { verifyAccessToken } from '../modules/auth/auth.jwt.js';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or malformed Authorization header.'));
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);

    requestContext.run(
      {
        userId: payload.userId,
        tenantId: payload.tenantId,
        permissions: payload.permissions,
      },
      () => {
        next();
      }
    );
  } catch {
    next(new UnauthorizedError('Invalid or expired authentication token.'));
  }
};
