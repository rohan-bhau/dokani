import { loginSchema, refreshTokenSchema, signupSchema } from '@dokani/shared';
import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/signup', validateRequest({ body: signupSchema }), authController.signup);
authRouter.post('/login', validateRequest({ body: loginSchema }), authController.login);
authRouter.post('/refresh', validateRequest({ body: refreshTokenSchema }), authController.refresh);
authRouter.post('/logout', authController.logout);
