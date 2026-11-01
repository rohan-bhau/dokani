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

  getProfile = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (await import('../../common/context.js')).getRequestContext();
      const profile = await this.service.getProfile(userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Profile retrieved successfully.',
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (await import('../../common/context.js')).getRequestContext();
      const profile = await this.service.updateProfile(userId, req.body);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Profile updated successfully.',
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  };

  setApprovalPin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (await import('../../common/context.js')).getRequestContext();
      const result = await this.service.setApprovalPin(userId, req.body.pin);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  };

  verifyApprovalPin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = (await import('../../common/context.js')).getRequestContext();
      const result = await this.service.verifyApprovalPin(tenantId, req.body.pin);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  requestOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.requestOtp(req.body.phone);
      res.status(200).json({
        statusCode: 200,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.verifyOtp(req.body.phone, req.body.code);
      res.status(200).json({
        statusCode: 200,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.forgotPassword(req.body.phone);
      res.status(200).json({
        statusCode: 200,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.resetPassword(req.body.phone, req.body.code, req.body.newPassword);
      res.status(200).json({
        statusCode: 200,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  };

}

export const authController = new AuthController();

