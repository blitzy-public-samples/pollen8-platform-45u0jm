import { Socket } from 'socket.io';
import { logSocketError } from './logger';
import { ISocketUser } from '../types/socket.types';

/**
 * Enum for standardized error codes in socket operations
 * @description Enumeration of error codes for various socket-related errors
 * @requirements Error Handling (Technical Specification/2.5 DATA-FLOW DIAGRAM/Backend Services)
 */
export enum SocketErrorCode {
  AUTHENTICATION_FAILED = 'SOCKET_AUTH_FAILED',
  CONNECTION_TIMEOUT = 'SOCKET_CONN_TIMEOUT',
  INVALID_PAYLOAD = 'SOCKET_INVALID_PAYLOAD',
  RATE_LIMIT_EXCEEDED = 'SOCKET_RATE_LIMIT',
  INTERNAL_ERROR = 'SOCKET_INTERNAL_ERROR',
}

/**
 * Record of error messages corresponding to SocketErrorCode
 * @description Provides human-readable error messages for each error code
 */
export const ERROR_MESSAGES: Record<SocketErrorCode, string> = {
  [SocketErrorCode.AUTHENTICATION_FAILED]: 'Authentication failed for socket connection',
  [SocketErrorCode.CONNECTION_TIMEOUT]: 'Socket connection timed out',
  [SocketErrorCode.INVALID_PAYLOAD]: 'Invalid payload received in socket event',
  [SocketErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded for socket operations',
  [SocketErrorCode.INTERNAL_ERROR]: 'Internal server error occurred during socket operation',
};

/**
 * Maximum number of error retries before disconnecting a socket
 */
export const MAX_ERROR_RETRIES = 3;

/**
 * Custom error class for socket-specific errors with additional context
 * @description Extends Error class to include socket-specific properties
 * @requirements Error Handling (Technical Specification/2.5 DATA-FLOW DIAGRAM/Backend Services)
 */
export class SocketError extends Error {
  code: SocketErrorCode;
  socketId: string;
  timestamp: Date;

  constructor(message: string, code: SocketErrorCode, socketId: string) {
    super(message);
    this.name = 'SocketError';
    this.code = code;
    this.socketId = socketId;
    this.timestamp = new Date();
  }
}

/**
 * Factory function to create standardized socket errors
 * @param code The error code
 * @param message Custom error message (optional)
 * @param socketId The ID of the socket
 * @returns A new instance of SocketError
 * @requirements Error Handling (Technical Specification/2.5 DATA-FLOW DIAGRAM/Backend Services)
 */
export function createSocketError(code: SocketErrorCode, message?: string, socketId?: string): SocketError {
  const errorMessage = message || ERROR_MESSAGES[code];
  return new SocketError(errorMessage, code, socketId || 'UNKNOWN');
}

/**
 * Primary error handler for WebSocket errors, logging and emitting appropriate responses
 * @param error The error object
 * @param socket The socket instance
 * @requirements Error Handling (Technical Specification/2.5 DATA-FLOW DIAGRAM/Backend Services)
 * @requirements User Experience (Technical Specification/1.1 System Objectives/User-Centric Design)
 * @requirements Monitoring (Technical Specification/6.5.2 Pipeline Stages/Monitoring)
 */
export function handleSocketError(error: Error | SocketError, socket: Socket): void {
  // Determine error type and severity
  const isSocketError = error instanceof SocketError;
  const errorCode = isSocketError ? error.code : SocketErrorCode.INTERNAL_ERROR;
  const socketId = isSocketError ? error.socketId : socket.id;

  // Log error with appropriate context
  logSocketError(error, socket);

  // Emit error event to client if applicable
  if (socket.connected) {
    socket.emit('error', {
      code: errorCode,
      message: ERROR_MESSAGES[errorCode],
    });
  }

  // Handle connection cleanup if necessary
  if (errorCode === SocketErrorCode.AUTHENTICATION_FAILED || errorCode === SocketErrorCode.RATE_LIMIT_EXCEEDED) {
    socket.disconnect(true);
  } else {
    // Increment error count for the socket
    const socketUser = socket as ISocketUser;
    socketUser.errorCount = (socketUser.errorCount || 0) + 1;

    // Disconnect if error count exceeds MAX_ERROR_RETRIES
    if (socketUser.errorCount > MAX_ERROR_RETRIES) {
      socket.disconnect(true);
    }
  }
}

/**
 * @fileoverview This file implements error handling utilities for the WebSocket server component of the Pollen8 platform.
 * It provides standardized error handling, logging, and client communication for socket-related errors.
 *
 * Key features:
 * 1. Standardized error codes and messages for common socket errors
 * 2. Custom SocketError class for enhanced error context
 * 3. Factory function for creating standardized socket errors
 * 4. Comprehensive error handling function that logs errors, notifies clients, and manages connections
 *
 * This implementation addresses the following requirements:
 * - Error Handling (Technical Specification/2.5 DATA-FLOW DIAGRAM/Backend Services)
 * - User Experience (Technical Specification/1.1 System Objectives/User-Centric Design)
 * - Monitoring (Technical Specification/6.5.2 Pipeline Stages/Monitoring)
 *
 * The error handling mechanism ensures graceful error management, enhances debugging capabilities,
 * and contributes to a robust and reliable WebSocket server for the Pollen8 platform.
 */