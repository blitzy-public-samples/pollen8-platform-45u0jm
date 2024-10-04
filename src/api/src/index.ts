import dotenv from 'dotenv';
import http from 'http';
import { createApp } from './app';
import { createApiLogger } from './utils/apiLogger';

/**
 * Entry point for the Pollen8 API server.
 * This file is responsible for initializing and starting the Express application.
 * 
 * Requirements addressed:
 * 1. API Server Initialization (Technical Specification/2.2 High-Level Architecture Diagram)
 * 2. Server Configuration (Technical Specification/2.3.2 Backend Components)
 * 3. Graceful Shutdown (Technical Specification/6.1 Deployment Environment)
 */

// Load environment variables
dotenv.config();

// Set up global constants
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const logger = createApiLogger({ level: 'info' });

/**
 * Starts the server and sets up error handling and graceful shutdown.
 */
async function startServer(): Promise<void> {
  try {
    const app = createApp();
    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
    });

    // Set up graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Sets up graceful shutdown handlers for the server.
 * @param server - The HTTP server instance
 */
function setupGracefulShutdown(server: http.Server): void {
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
      logger.info('Server closed. Exiting process.');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time. Forcefully shutting down.');
      process.exit(1);
    }, 30000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
}

// Start the server
startServer().catch((error) => {
  logger.error('Unhandled error during server startup:', error);
  process.exit(1);
});

/**
 * @fileoverview This is the entry point for the Pollen8 API server.
 * It initializes the Express application, starts the HTTP server,
 * and sets up graceful shutdown procedures.
 * 
 * Key features:
 * - Loads environment variables
 * - Creates and starts the Express application
 * - Sets up logging for server events
 * - Implements graceful shutdown handling
 * - Handles uncaught exceptions and unhandled rejections
 * 
 * This file ensures that the server starts correctly and can shut down
 * gracefully when needed, addressing requirements for server initialization,
 * configuration, and deployment considerations.
 */