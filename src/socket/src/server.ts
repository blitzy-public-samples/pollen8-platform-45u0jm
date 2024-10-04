import http from 'http';
import { Server } from 'socket.io';
import App from './app';
import { getSocketConfig } from './config';
import { socketLogger } from './utils/logger';
import { initializeMetrics } from './utils/metrics';

let server: http.Server;
let app: App;

/**
 * Starts the WebSocket server
 * @function startServer
 * @description Initializes and starts the Socket.IO server with all configurations and handlers.
 * @returns {Promise<void>}
 */
async function startServer(): Promise<void> {
  try {
    const config = getSocketConfig();
    server = http.createServer();
    app = new App();

    // Initialize the app
    await app.initialize();

    const io: Server = app.getIO();
    io.attach(server);

    // Set up signal handlers for graceful shutdown
    setupSignalHandlers();

    // Start the server
    server.listen(config.port, () => {
      socketLogger.info(`WebSocket server is running on port ${config.port}`);
    });

    // Initialize metrics collection
    initializeMetrics(io);

  } catch (error) {
    socketLogger.error('Failed to start WebSocket server', error);
    process.exit(1);
  }
}

/**
 * Sets up signal handlers for graceful shutdown
 * @function setupSignalHandlers
 * @description Configures process signal handlers to ensure graceful shutdown of the server.
 */
function setupSignalHandlers(): void {
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  signals.forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
  });
}

/**
 * Handles graceful shutdown of the server
 * @function gracefulShutdown
 * @description Closes the server and performs cleanup operations for a graceful shutdown.
 * @param {string} signal - The signal that triggered the shutdown
 */
function gracefulShutdown(signal: string): void {
  socketLogger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    socketLogger.info('HTTP server closed');

    try {
      // Close existing socket connections
      const io = app.getIO();
      io.close(() => {
        socketLogger.info('All socket connections closed');
      });

      // Perform any additional cleanup (e.g., closing database connections)
      // Add any necessary cleanup code here

      socketLogger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      socketLogger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  });

  // Set a timeout for force shutdown in case graceful shutdown takes too long
  setTimeout(() => {
    socketLogger.error('Graceful shutdown timed out. Force shutting down...');
    process.exit(1);
  }, 10000); // 10 seconds timeout
}

// Start the server
startServer();

// Export for testing purposes
export { startServer, gracefulShutdown };