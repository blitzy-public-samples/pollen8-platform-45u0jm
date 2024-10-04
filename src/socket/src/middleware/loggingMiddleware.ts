import { Socket } from 'socket.io';
import { logSocketEvent, logSocketError } from '../utils/logger';
import { socketMetrics } from '../utils/metrics';
import { ISocketUser } from '../types/socket.types';

/**
 * Socket.IO middleware function that logs all socket events and attaches logging handlers to the socket instance.
 * @param socket - The Socket instance
 * @param next - The next function in the middleware chain
 * @description This middleware provides comprehensive logging for all socket events, connections, and errors in the Pollen8 platform.
 * @requirements_addressed 
 * - Real-time Monitoring (Technical Specification/2.2 HIGH-LEVEL ARCHITECTURE DIAGRAM/Communication Layer)
 * - Performance Tracking (Technical Specification/6.5.2 Pipeline Stages/Monitoring)
 * - Debugging Support (Technical Specification/8.1.2 Performance Benchmarks)
 */
export const loggingMiddleware = (socket: Socket, next: (err?: Error) => void): void => {
  // Log initial connection attempt
  logSocketEvent('connection_attempt', { socketId: socket.id });

  // Attach event loggers to socket
  attachEventLoggers(socket as ISocketUser);

  // Set up error handling and logging
  socket.on('error', (error: Error) => {
    logSocketError(error, socket);
    socketMetrics.recordMetric('socket_errors', 1, { socketId: socket.id });
  });

  // Call next middleware in chain
  next();
};

/**
 * Attaches event-specific loggers to various socket events.
 * @param socket - The Socket instance with user information
 */
function attachEventLoggers(socket: ISocketUser): void {
  // Attach connection event loggers
  socket.on('connect', () => logSocketConnection(socket));
  socket.on('disconnect', (reason) => logSocketDisconnection(socket, reason));

  // Attach business event loggers
  socket.on('subscribeToNetwork', (industries) => {
    logSocketEvent('subscribeToNetwork', { socketId: socket.id, userId: socket.userId, industries });
  });
  socket.on('unsubscribeFromNetwork', (industries) => {
    logSocketEvent('unsubscribeFromNetwork', { socketId: socket.id, userId: socket.userId, industries });
  });

  // Set up performance metric logging
  const startTime = Date.now();
  socket.on('disconnect', () => {
    const duration = Date.now() - startTime;
    socketMetrics.updateConnectionDuration(socket.userId, duration);
  });
}

/**
 * Logs details when a new socket connection is established.
 * @param socket - The Socket instance with user information
 */
function logSocketConnection(socket: ISocketUser): void {
  const connectionInfo = {
    socketId: socket.id,
    userId: socket.userId,
    industries: socket.industries,
    timestamp: new Date().toISOString()
  };
  logSocketEvent('connection_established', connectionInfo);
  socketMetrics.incrementConnectionCount(socket.userId);
}

/**
 * Logs details when a socket connection is terminated.
 * @param socket - The Socket instance with user information
 * @param reason - The reason for disconnection
 */
function logSocketDisconnection(socket: ISocketUser, reason: string): void {
  const disconnectionInfo = {
    socketId: socket.id,
    userId: socket.userId,
    reason,
    timestamp: new Date().toISOString()
  };
  logSocketEvent('connection_terminated', disconnectionInfo);
  socketMetrics.decrementConnectionCount(socket.userId);
}

/**
 * @fileoverview This module implements a comprehensive logging middleware for Socket.IO connections in the Pollen8 platform.
 * It addresses the following requirements:
 * 1. Real-time Monitoring (Technical Specification/2.2 HIGH-LEVEL ARCHITECTURE DIAGRAM/Communication Layer)
 *    - Logs all socket events, connections, and disconnections in real-time.
 * 2. Performance Tracking (Technical Specification/6.5.2 Pipeline Stages/Monitoring)
 *    - Records connection durations and integrates with the socketMetrics utility for performance measurement.
 * 3. Debugging Support (Technical Specification/8.1.2 Performance Benchmarks)
 *    - Provides detailed logs for troubleshooting and debugging socket-related issues.
 * 
 * The middleware attaches loggers to various socket events, ensuring comprehensive coverage of all socket activities.
 * It also integrates with the metrics system to track performance-related data, supporting the platform's analytics capabilities.
 */