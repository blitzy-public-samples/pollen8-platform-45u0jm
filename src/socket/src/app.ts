import { Server } from 'socket.io';
import { createServer } from 'http';
import { RedisAdapter } from 'socket.io-redis';
import { getSocketConfig } from './config';
import { authenticateSocket } from './middleware/authMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { loggingMiddleware } from './middleware/loggingMiddleware';
import { ConnectionHandler } from './handlers/connectionHandler';
import { InviteHandler } from './handlers/inviteHandler';
import { NetworkValueHandler } from './handlers/networkValueHandler';
import { RedisService } from './services/redisService';
import { socketLogger } from './utils/logger';
import { initializeMetrics } from './utils/metrics';

/**
 * Main application class for the WebSocket server
 * @class App
 * @description Core application setup file for the Pollen8 WebSocket server, configuring and initializing the Socket.IO instance with necessary middleware, handlers, and services.
 */
class App {
  private io: Server;
  private redisService: RedisService;

  /**
   * Creates an instance of App.
   * @memberof App
   * @description Initializes the App instance, creating the Socket.IO server
   */
  constructor() {
    this.io = this.createSocketServer();
    this.redisService = new RedisService();
  }

  /**
   * Creates and configures the Socket.IO server instance with all necessary middleware and handlers.
   * @private
   * @returns {Server} Configured Socket.IO server instance
   * @memberof App
   */
  private createSocketServer(): Server {
    const config = getSocketConfig();
    const httpServer = createServer();
    const io = new Server(httpServer, {
      cors: config.cors,
      pingTimeout: config.pingTimeout,
      pingInterval: config.pingInterval,
    });

    // Set up Redis adapter
    const redisAdapter = new RedisAdapter(config.redis);
    io.adapter(redisAdapter);

    // Configure middleware
    this.setupMiddleware(io);

    return io;
  }

  /**
   * Sets up all middleware for the Socket.IO server.
   * @private
   * @param {Server} io - Socket.IO server instance
   * @memberof App
   */
  private setupMiddleware(io: Server): void {
    io.use(authenticateSocket);
    io.use(rateLimitMiddleware);
    io.use(loggingMiddleware);
  }

  /**
   * Initializes all event handlers for the Socket.IO server.
   * @private
   * @param {Server} io - Socket.IO server instance
   * @memberof App
   */
  private initializeHandlers(io: Server): void {
    new ConnectionHandler(io);
    new InviteHandler(io);
    new NetworkValueHandler(io);
  }

  /**
   * Initializes all services, middleware, and handlers
   * @returns {Promise<void>}
   * @memberof App
   */
  public async initialize(): Promise<void> {
    try {
      // Connect to Redis
      await this.redisService.connect();

      // Set up middleware
      this.setupMiddleware(this.io);

      // Initialize handlers
      this.initializeHandlers(this.io);

      // Initialize metrics collection
      initializeMetrics(this.io);

      socketLogger.info('WebSocket server initialized successfully');
    } catch (error) {
      socketLogger.error('Failed to initialize WebSocket server', error);
      throw error;
    }
  }

  /**
   * Returns the Socket.IO server instance
   * @returns {Server} Socket.IO server instance
   * @memberof App
   */
  public getIO(): Server {
    return this.io;
  }
}

export default App;