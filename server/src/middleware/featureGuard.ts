import type { Request, Response, NextFunction } from 'express';

export const checkProductLimit = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next();
};

export const checkStaffLimit = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next();
};
