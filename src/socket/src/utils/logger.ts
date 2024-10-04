import winston from 'winston';
import { Socket } from 'socket.io';

// Importing the CONFIG from the config file
// Note: This import might need to be adjusted once the config file is implemented
import { CONFIG } from '../config';

// Define the SocketLoggerConfig interface
interface SocketLoggerConfig {
  level: LogLevel;
  format: winston.LoggerOptions['format'];
  transports: winston.transport[];
  socketOptions?: object;
}

// Define the LogLevel enum
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Declare the global socketLogger variable
declare global {
  var socketLogger: winston.Logger;
}

/**
 * Creates and configures a Winston logger instance specifically for WebSocket events and connections.
 * @param config The configuration object for the logger
 * @returns Configured Winston logger instance
 */
export function createSocketLogger(config: SocketLoggerConfig): winston.Logger {
  // Parse configuration object
  const { level, format, transports, socketOptions } = config;

  // Set up Winston transports
  const loggerTransports = transports.map((transport) => {
    if (transport instanceof winston.transports.Console) {
      return new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      });
    }
    return transport;
  });

  // Configure log format
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    format
  );

  // Create and return logger instance
  const logger = winston.createLogger({
    level,
    format: logFormat,
    transports: loggerTransports,
    ...socketOptions,
  });

  // Assign the logger to the global variable
  global.socketLogger = logger;

  return logger;
}

/**
 * Logs WebSocket events with optional payload data.
 * @param event The name of the event
 * @param data Optional payload data
 */
export function logSocketEvent(event: string, data?: any): void {
  // Sanitize event data
  const sanitizedData = data ? JSON.stringify(data) : 'No data';

  // Format log message
  const logMessage = `Socket Event: ${event}, Data: ${sanitizedData}`;

  // Use socketLogger to log event
  global.socketLogger.info(logMessage);
}

/**
 * Logs WebSocket-specific errors with socket context.
 * @param error The error object
 * @param socket The socket instance
 */
export function logSocketError(error: Error, socket: Socket): void {
  // Extract relevant socket context
  const socketContext = {
    id: socket.id,
    handshake: socket.handshake,
    rooms: Array.from(socket.rooms),
  };

  // Format error message with context
  const errorMessage = `Socket Error: ${error.message}`;
  const contextMessage = `Socket Context: ${JSON.stringify(socketContext)}`;

  // Log error using socketLogger
  global.socketLogger.error(`${errorMessage}\n${contextMessage}`, {
    stack: error.stack,
  });
}

// Initialize the logger with default configuration
// This should be called when the application starts
export function initializeLogger() {
  const defaultConfig: SocketLoggerConfig = {
    level: LogLevel.INFO,
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
  };

  createSocketLogger(CONFIG.logger || defaultConfig);
}