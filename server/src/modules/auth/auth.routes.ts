import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  requestOtpSchema,
  resetPasswordSchema,
  signupSchema,
  verifyOtpSchema,
} from '@dokani/shared';
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/signup', validateRequest({ body: signupSchema }), authController.signup);
authRouter.post('/login', validateRequest({ body: loginSchema }), authController.login);
authRouter.post('/refresh', validateRequest({ body: refreshTokenSchema }), authController.refresh);
authRouter.post('/logout', authController.logout);

// Phone OTP verification & Password reset
authRouter.post('/request-otp', validateRequest({ body: requestOtpSchema }), authController.requestOtp);
authRouter.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), authController.verifyOtp);
authRouter.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), authController.forgotPassword);
authRouter.post('/reset-password', validateRequest({ body: resetPasswordSchema }), authController.resetPassword);


// Protected User Profile & Approval PIN
authRouter.get('/profile', authenticate, authController.getProfile);
authRouter.patch('/profile', authenticate, authController.updateProfile);
authRouter.post('/set-approval-pin', authenticate, authController.setApprovalPin);
authRouter.post('/verify-approval-pin', authenticate, authController.verifyApprovalPin);

