import type { NextFunction, Request, Response } from 'express';
import { getRequestContext } from '../../common/context.js';
import { ConflictError } from '../../common/errors.js';
import { redis } from '../../config/redis.js';

export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as
    | string
    | undefined;

  if (!idempotencyKey) {
    next();
    return;
  }

  try {
    const { tenantId } = getRequestContext();
    const redisKey = `sales:idemp:${tenantId}:${idempotencyKey}`;

    // Try acquiring lock with 120s TTL
    const acquired = await redis.set(redisKey, 'IN_PROGRESS', 'EX', 120, 'NX');

    if (!acquired) {
      const cached = await redis.get(redisKey);
      if (cached === 'IN_PROGRESS') {
        next(new ConflictError('A checkout request with this idempotency key is already in progress.'));
        return;
      }

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          res.setHeader('X-Idempotent-Replay', 'true');
          res.status(200).json(parsed);
          return;
        } catch {
          // If parse fails, continue
        }
      }
    }

    // Intercept response to store result or clean up on failure
    const originalJson = res.json.bind(res);
    res.json = (body: unknown): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Cache successful response for 24 hours
        redis.set(redisKey, JSON.stringify(body), 'EX', 86400).catch(() => {});
      } else {
        // Unlock on non-2xx so client can retry
        redis.del(redisKey).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    next(err);
  }
};
