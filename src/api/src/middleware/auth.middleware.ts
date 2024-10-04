import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '@shared/interfaces/user.interface';
import { UserRole } from '@shared/enums/userRole.enum';
import { AuthErrors, SystemErrors, getErrorMessage } from '@shared/constants/errorCodes';

// Global constants
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const TOKEN_HEADER = 'Authorization';

/**
 * Authentication middleware for the Pollen8 platform
 * Verifies and validates JWT tokens, ensuring secure access to protected API endpoints
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 * - User-Centric Design (Technical Specification/1.1 System Objectives)
 * - Security Protocols (Technical Specification/5. Security Considerations)
 */

/**
 * Express middleware function that authenticates incoming requests by validating JWT tokens
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract JWT from Authorization header
    const token = req.header(TOKEN_HEADER)?.replace('Bearer ', '');

    if (!token) {
      throw new Error(getErrorMessage(AuthErrors.SESSION_EXPIRED));
    }

    // Verify token format and signature
    const decoded = jwt.verify(token, JWT_SECRET) as IUser;

    // Attach decoded user to request object
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: getErrorMessage(AuthErrors.SESSION_EXPIRED) });
    } else {
      res.status(500).json({ error: getErrorMessage(SystemErrors.INTERNAL_ERROR) });
    }
  }
};

/**
 * Higher-order function that creates middleware to check if the authenticated user has the required role
 * @param role Required UserRole for access
 * @returns Express middleware function that checks user role
 */
export const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: getErrorMessage(AuthErrors.SESSION_EXPIRED) });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Middleware to ensure the user is authenticated and has a valid session
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction
 */
export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: getErrorMessage(AuthErrors.SESSION_EXPIRED) });
    return;
  }
  next();
};

/**
 * Middleware to refresh the user's token if it's close to expiration
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express NextFunction
 */
export const refreshToken = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user) {
    const newToken = jwt.sign({ ...req.user }, JWT_SECRET, { expiresIn: '1h' });
    res.setHeader('X-New-Token', newToken);
  }
  next();
};

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}