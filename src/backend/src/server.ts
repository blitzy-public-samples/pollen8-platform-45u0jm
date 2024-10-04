import http from 'http';
import { createApp, initializeServices } from './app';
import { config } from './config';
import logger from './utils/logger';
import { startJobs } from './jobs';

/**
 * Global server instance
 */
let server: http.Server;

/**
 * Starts the HTTP server and initializes all required services.
 * 
 * Requirements addressed:
 * 1. Backend Server Initialization (Technical Specification/2.2 HIGH-LEVEL ARCHITECTURE DIAGRAM)
 *    - Initializes and starts the backend server
 * 2. Error Handling (Technical Specification/5. SECURITY CONSIDERATIONS)
 *    - Implements proper error handling for server startup
 * 3. Server Monitoring (Technical Specification/6.1 DEPLOYMENT ENVIRONMENT)
 *    - Sets up server monitoring through logging
 * 
 * @returns {Promise<void>} Promise that resolves when server is started
 */
async function startServer(): Promise<void> {
  try {
    // Initialize services (database, cache, etc.)
    await initializeServices();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    server = http.createServer(app);

    // Start listening on configured port
    server.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
      logger.info(`API version: ${config.API_VERSION}`);
    });

    // Initialize background jobs
    startJobs();

    // Set up error handling for unhandled rejections and exceptions
    process.on('unhandledRejection', (reason: Error | any) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Handles graceful shutdown of the server, closing all connections and performing cleanup.
 * 
 * @param {string} signal - The signal that triggered the shutdown
 */
function gracefulShutdown(signal: string): void {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close((err) => {
      if (err) {
        logger.error('Error during server close:', err);
        process.exit(1);
      }

      logger.info('Server closed successfully');

      // Perform additional cleanup (e.g., close database connections, stop background jobs)
      // This is a placeholder for actual cleanup logic
      logger.info('Performing cleanup...');

      // Exit the process
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  } else {
    logger.warn('Server not initialized. Exiting...');
    process.exit(0);
  }
}

// Set up signal handlers for graceful shutdown
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

// Start the server
startServer();

// Export for testing purposes
export { server, startServer, gracefulShutdown };