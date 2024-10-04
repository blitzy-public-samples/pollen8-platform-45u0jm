import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { createRateLimiter } from '../middleware/rateLimiter.middleware';
import { UserValidator } from '../../shared/validators/user.validator';

/**
 * Creates and configures the authentication router with all necessary routes and middleware
 * @param authController - Instance of AuthController
 * @returns Configured Express router for authentication routes
 */
export function createAuthRouter(authController: AuthController): Router {
  const router = Router();
  const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth routes
  });

  // Apply rate limiter to all auth routes
  router.use(authRateLimiter);

  // POST /verify - Initiate phone verification
  router.post(
    '/verify',
    validateRequest(UserValidator.validatePhoneNumber),
    authController.sendVerificationCode.bind(authController)
  );

  // POST /confirm - Confirm verification code
  router.post(
    '/confirm',
    validateRequest(UserValidator.validateVerificationCode),
    authController.verifyCode.bind(authController)
  );

  return router;
}

/**
 * @fileoverview This module defines the authentication routes for the Pollen8 platform.
 * It sets up the necessary endpoints for phone verification and user authentication,
 * applying appropriate middleware for request validation and rate limiting.
 *
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 *    - Implements routes for phone verification process
 * 2. User-Centric Design (Technical Specification/1.1 System Objectives)
 *    - Provides intuitive authentication endpoints
 * 3. Security Protocols (Technical Specification/5. Security Considerations)
 *    - Sets up secure routing with proper middleware
 *
 * The module exports a single function `createAuthRouter` which creates and configures
 * the authentication router. This design allows for easy testing and modular integration
 * into the main application.
 *
 * Usage:
 * import { createAuthRouter } from './routes/auth.routes';
 * import { AuthController } from './controllers/auth.controller';
 *
 * const authController = new AuthController(authService, userValidator);
 * const authRouter = createAuthRouter(authController);
 * app.use('/auth', authRouter);
 */