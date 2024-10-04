import winston from 'winston';
import morgan from 'morgan';
import { config } from '../config';

// Define log levels
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Define logger configuration interface
interface LoggerConfig {
  level: LogLevel;
  format: winston.Logform.Format;
  transports: winston.transport[];
}

/**
 * Creates and configures a Winston logger instance based on the provided configuration.
 * 
 * @param {LoggerConfig} config - The configuration for the logger
 * @returns {winston.Logger} Configured logger instance
 */
const createLogger = (config: LoggerConfig): winston.Logger => {
  return winston.createLogger({
    level: config.level,
    format: config.format,
    transports: config.transports,
  });
};

// Define log formats based on environment
const logFormat = config.NODE_ENV === 'production'
  ? winston.format.json()
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level}]: ${message}`;
      })
    );

// Configure logger based on environment
const loggerConfig: LoggerConfig = {
  level: config.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: LogLevel.ERROR }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
};

// Create the logger instance
export const logger = createLogger(loggerConfig);

/**
 * Creates a Morgan HTTP request logger middleware configured for the application.
 * 
 * @returns {express.RequestHandler} Configured Morgan middleware
 */
export const createHttpLogger = (): express.RequestHandler => {
  const format = config.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :response-time ms - :res[content-length]';

  return morgan(format, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
    skip: (req) => req.url === '/health' || req.url === '/metrics',
  });
};

// Add a custom token for response time logging
morgan.token('response-time', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
             (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});

/**
 * This module provides standardized logging functionality for the backend service of the Pollen8 platform,
 * ensuring consistent and configurable logging across the application.
 * 
 * Requirements addressed:
 * 1. Centralized Logging (Technical Specification/2.2 HIGH-LEVEL ARCHITECTURE DIAGRAM)
 *    - Provides a unified logging solution for the backend service
 * 2. Environment-aware Logging (Technical Specification/6.1 DEPLOYMENT ENVIRONMENT)
 *    - Supports different log levels and formats based on the environment
 * 3. Performance Monitoring (Technical Specification/6.4 CI/CD PIPELINE)
 *    - Enables logging for performance tracking through response time logging
 * 
 * The module exports:
 * - logger: A configured Winston logger instance for application-wide logging
 * - createHttpLogger: A function to create a Morgan middleware for HTTP request logging
 * 
 * The logging configuration adapts based on the environment:
 * - Production: JSON format, INFO level, file transports for error and combined logs
 * - Non-production: Colorized console output, DEBUG level, additional file transports
 * 
 * HTTP request logging excludes health check and metrics endpoints to reduce noise.
 */

export default logger;