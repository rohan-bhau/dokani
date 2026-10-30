import type { NextFunction, Request, Response } from 'express';
import { getRequestContext } from '../common/context.js';
import { ForbiddenError } from '../common/errors.js';

export const requirePermissions = (...required: string[]) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    try {
      const { permissions } = getRequestContext();

      const hasAll = required.every((reqPerm) => permissions.includes(reqPerm));

      if (!hasAll) {
        next(new ForbiddenError('You do not have permission to perform this action.'));
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export const requireAnyPermission = (...required: string[]) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    try {
      const { permissions } = getRequestContext();

      const hasAny = required.some((reqPerm) => permissions.includes(reqPerm));

      if (!hasAny) {
        next(new ForbiddenError('You do not have permission to perform this action.'));
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

