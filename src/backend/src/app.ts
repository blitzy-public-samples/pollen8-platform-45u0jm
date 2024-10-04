import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils/logger';
import { handleError } from './utils/errorHandlers';
import { setupDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import networkRoutes from './routes/network.routes';
import inviteRoutes from './routes/invite.routes';

/**
 * Creates and configures the Express application with all necessary middleware and settings.
 * 
 * Requirements addressed:
 * 1. Backend Core Setup (Technical Specification/2.2 HIGH-LEVEL ARCHITECTURE DIAGRAM)
 *    - Establishes the main backend application instance
 * 2. Security Implementation (Technical Specification/5. SECURITY CONSIDERATIONS)
 *    - Applies security protocols and middleware
 * 3. Data-Driven Networking (Technical Specification/1.2 Scope/Core Functionalities)
 *    - Sets up backend services for network management
 * 4. Industry Specificity (Technical Specification/1.1 System Objectives)
 *    - Configures industry-specific backend services
 * 
 * @returns {Express} The configured Express application instance
 */
export const createApp = (): Express => {
  const app: Express = express();

  // Apply security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.CORS_ORIGINS,
    credentials: true,
  }));

  // Configure request processing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  // Set up logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });

  // Initialize health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', version: config.API_VERSION });
  });

  // Set up API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/network', networkRoutes);
  app.use('/api/invites', inviteRoutes);

  // Configure error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    handleError(err, res);
  });

  return app;
};

/**
 * Initializes all required backend services such as database connections and caching.
 * 
 * @returns {Promise<void>} Promise that resolves when all services are initialized
 */
export const initializeServices = async (): Promise<void> => {
  try {
    // Initialize database connection
    await setupDatabase();

    // Set up caching mechanisms (Redis initialization would go here)

    // Configure connection pooling (if needed)

    // Initialize other required services
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
};

/**
 * Main application setup and initialization.
 * This function creates the Express app, initializes services, and starts the server.
 */
const startServer = async () => {
  try {
    await initializeServices();
    const app = createApp();

    app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export the app for testing purposes
export default createApp;