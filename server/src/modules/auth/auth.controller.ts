import type { NextFunction, Request, Response } from 'express';
import { authService, type AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.signup(req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Account created successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.login(req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Logged in successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.refreshToken(req.body.refreshToken, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Token refreshed successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.body?.refreshToken) {
        await this.service.logout(req.body.refreshToken);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Logged out successfully.',
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
