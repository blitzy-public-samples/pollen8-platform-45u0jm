import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { InviteService } from '@services/invite.service';
import { IInviteCreate, IInviteUpdate, InviteResponse } from '@shared/interfaces/invite.interface';
import { validateInviteCreate, validateInviteUpdate } from '@shared/validators/invite.validator';
import { formatResponse } from '@utils/responseFormatter';
import { ApiError } from '@utils/ApiError';

/**
 * Controller class for handling invite-related HTTP requests
 * This class implements the API endpoints for managing invites in the Pollen8 platform
 */
export class InviteController {
  private inviteService: InviteService;

  constructor(inviteService: InviteService) {
    this.inviteService = inviteService;
  }

  /**
   * Handles POST request to create a new invite link
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction
   */
  public createInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, name } = req.body as IInviteCreate;

      // Validate invite data
      const validationResult = validateInviteCreate({ userId, name });
      if (!validationResult.isValid) {
        throw new ApiError(400, 'Invalid invite data', validationResult.errors);
      }

      // Call service to create invite
      const result = await this.inviteService.createInvite(new ObjectId(userId), name);

      // Send response
      res.status(201).json(formatResponse<InviteResponse>(result));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET request to retrieve analytics for a specific invite
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction
   */
  public getInviteAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const inviteId = new ObjectId(req.params.inviteId);

      // Call service to get invite analytics
      const result = await this.inviteService.getInviteAnalytics(inviteId);

      // Send response
      res.status(200).json(formatResponse<InviteResponse>(result));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST request to record a click on an invite link
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction
   */
  public trackInviteClick = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.params;

      // Call service to track invite click
      await this.inviteService.trackInviteClick(code);

      // Send 204 No Content response
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles PUT request to update an existing invite
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction
   */
  public updateInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const inviteId = new ObjectId(req.params.inviteId);
      const updateData: IInviteUpdate = req.body;

      // Validate update data
      const validationResult = validateInviteUpdate(updateData);
      if (!validationResult.isValid) {
        throw new ApiError(400, 'Invalid update data', validationResult.errors);
      }

      // Call service to update invite
      const result = await this.inviteService.updateInvite(inviteId, updateData);

      // Send response
      res.status(200).json(formatResponse<InviteResponse>(result));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE request to deactivate an invite link
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Express NextFunction
   */
  public deactivateInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const inviteId = new ObjectId(req.params.inviteId);

      // Call service to deactivate invite
      const result = await this.inviteService.deactivateInvite(inviteId);

      // Send response
      res.status(200).json(formatResponse<InviteResponse>(result));
    } catch (error) {
      next(error);
    }
  };
}

/**
 * @fileoverview This module implements the InviteController class, which handles HTTP requests for invite-related operations in the Pollen8 platform.
 * It addresses the following requirements:
 * 1. Trackable Invite Links (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 3. One-click Sharing (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 4. Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 *
 * Key features:
 * - Create new invite links
 * - Retrieve invite analytics
 * - Track invite link clicks
 * - Update invite properties
 * - Deactivate invite links
 *
 * This controller uses the InviteService to handle business logic and data operations.
 * It also implements error handling and input validation to ensure data integrity and proper error responses.
 */