import { Router } from 'express';
import { createAuthRouter } from './auth.routes';
import { initializeUserRoutes } from './user.routes';
import { NetworkRouter } from './network.routes';
import { default as inviteRouter } from './invite.routes';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { NetworkController } from '../controllers/network.controller';

/**
 * Central routing module that aggregates and exports all API routes for the Pollen8 platform.
 * 
 * This module addresses the following requirements:
 * 1. API Organization (Technical Specification/2.2 High-Level Architecture Diagram)
 * 2. Modular Design (Technical Specification/2.3.2 Backend Components)
 * 3. RESTful API (Technical Specification/3.3 API Design)
 */

export const API_VERSION = 'v1';
export const BASE_PATH = `/api/${API_VERSION}`;

/**
 * Configures and attaches all API routes to the Express application
 * @param app Express application instance
 */
export function configureRoutes(app: Router): void {
  const router = Router();

  // Initialize controllers (assuming they are injected or created elsewhere)
  const authController = new AuthController();
  const userController = new UserController();
  const networkController = new NetworkController();

  // Attach authentication routes
  const authRouter = createAuthRouter(authController);
  router.use('/auth', authRouter);

  // Attach user routes
  const userRouter = initializeUserRoutes(userController);
  router.use('/users', userRouter);

  // Attach network routes
  const networkRouter = new NetworkRouter(networkController);
  router.use('/network', networkRouter.getRouter());

  // Attach invite routes
  router.use('/invites', inviteRouter);

  // Configure health check endpoint
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', version: API_VERSION });
  });

  // Attach all routes to app under BASE_PATH
  app.use(BASE_PATH, router);
}

/**
 * @fileoverview This module serves as the central routing configuration for the Pollen8 API.
 * It imports all route modules and aggregates them into a single configuration function.
 * 
 * Key features:
 * - Centralizes all API routes
 * - Implements versioning through BASE_PATH
 * - Provides a health check endpoint
 * - Modular structure for easy maintenance and scalability
 * 
 * Usage:
 * import express from 'express';
 * import { configureRoutes } from './routes';
 * 
 * const app = express();
 * configureRoutes(app);
 * 
 * This design allows for easy testing, versioning, and future expansion of the API.
 */