import { Router } from 'express';
import { InviteController } from '../controllers/invite.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest, ValidatorType } from '../middleware/validation.middleware';
import { createRateLimiter } from '../middleware/rateLimiter.middleware';
import { UserRole } from '../../shared/enums/userRole.enum';
import { InviteService } from '../services/invite.service';

/**
 * Express router module that defines the API endpoints for invite-related operations in the Pollen8 platform.
 * 
 * This module addresses the following requirements:
 * 1. Trackable Invite Links (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 3. One-click Sharing (Technical Specification/1.2 Scope/Core Functionalities/3)
 */

const router = Router();
const inviteService = new InviteService(); // Assuming InviteService is implemented elsewhere
const inviteController = new InviteController(inviteService);

// Rate limiter for invite tracking
const trackInviteRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 minutes
});

/**
 * POST /invites
 * Create a new invite link
 * Requires authentication and user role
 */
router.post(
  '/',
  authenticate,
  requireRole(UserRole.USER),
  validateRequest(ValidatorType.INVITE_CREATE),
  inviteController.createInvite
);

/**
 * GET /invites/:id/analytics
 * Retrieve analytics for a specific invite
 * Requires authentication
 */
router.get(
  '/:inviteId/analytics',
  authenticate,
  inviteController.getInviteAnalytics
);

/**
 * POST /invites/:code/track
 * Track a click on an invite link
 * Public endpoint with rate limiting
 */
router.post(
  '/:code/track',
  trackInviteRateLimiter,
  validateRequest(ValidatorType.INVITE_CODE),
  inviteController.trackInviteClick
);

/**
 * PUT /invites/:id
 * Update an existing invite
 * Requires authentication and user role
 */
router.put(
  '/:inviteId',
  authenticate,
  requireRole(UserRole.USER),
  validateRequest(ValidatorType.INVITE_UPDATE),
  inviteController.updateInvite
);

/**
 * DELETE /invites/:id
 * Deactivate an invite link
 * Requires authentication and user role
 */
router.delete(
  '/:inviteId',
  authenticate,
  requireRole(UserRole.USER),
  inviteController.deactivateInvite
);

export default router;

/**
 * @fileoverview This module defines the routes for invite-related operations in the Pollen8 platform.
 * It uses the InviteController to handle the business logic for each route.
 * 
 * Key features:
 * - Create new invite links
 * - Retrieve invite analytics
 * - Track invite link clicks with rate limiting
 * - Update invite properties
 * - Deactivate invite links
 * 
 * Security measures:
 * - Authentication required for most endpoints
 * - Role-based access control
 * - Input validation
 * - Rate limiting for public tracking endpoint
 * 
 * This router module is designed to be modular and can be easily integrated into the main Express application.
 */