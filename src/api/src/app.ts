import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { configureRoutes } from './routes';
import { errorHandler } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';
import { createApiLogger, createRequestLogger } from './utils/apiLogger';

/**
 * Main Express application configuration file for the Pollen8 API.
 * This file is responsible for setting up middleware, routes, and core application settings.
 * 
 * Requirements addressed:
 * 1. API Gateway (Technical Specification/2.2 High-Level Architecture Diagram)
 * 2. Security Protocols (Technical Specification/5. Security Considerations)
 * 3. User-Centric Design (Technical Specification/1.1 System Objectives)
 * 4. API Documentation (Technical Specification/2.3.2 Backend Components)
 */

const createApp = (): Express => {
  const app: Express = express();

  // Configure security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }));

  // Configure request processing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  // Configure logging
  const apiLogger = createApiLogger();
  const requestLogger = createRequestLogger();
  app.use(requestLogger);

  // Set up Swagger documentation
  setupSwagger(app);

  // Configure API routes
  configureRoutes(app);

  // Add error handling middleware
  app.use(errorHandler);

  // Add 404 route handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    apiLogger.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
};

export { createApp };

/**
 * @fileoverview This module creates and configures the Express application for the Pollen8 API.
 * It sets up all necessary middleware, security measures, and routing for the application.
 * 
 * Key features:
 * - Implements security best practices (helmet, CORS, rate limiting)
 * - Configures request processing (JSON parsing, compression)
 * - Sets up logging for API requests and errors
 * - Integrates Swagger documentation
 * - Configures all API routes
 * - Implements error handling and 404 routing
 * 
 * Usage:
 * import { createApp } from './app';
 * const app = createApp();
 * app.listen(3000, () => console.log('Server started'));
 * 
 * This modular design allows for easy testing and separation of concerns between
 * application setup and server initialization.
 */