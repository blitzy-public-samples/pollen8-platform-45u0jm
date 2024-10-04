import { Router } from 'express';
import { injectable, inject } from 'inversify';
import { NetworkController } from '../controllers/network.controller';
import { authenticate, ensureAuthenticated, refreshToken } from '../middleware/auth.middleware';
import { validateRequest, ValidatorType } from '../middleware/validation.middleware';

/**
 * NetworkRouter class that defines all network-related routes
 * @description This class sets up the Express router for network-related endpoints in the Pollen8 platform,
 * handling routes for connections, network values, and industry-specific networking features.
 * @requirements_addressed 
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * - Industry Focus (Technical Specification/1.1 System Objectives)
 * - Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
@injectable()
export class NetworkRouter {
  private router: Router;

  constructor(
    @inject(NetworkController) private networkController: NetworkController
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  /**
   * Initializes all network-related routes with their respective middlewares and handlers
   */
  private initializeRoutes(): void {
    // Create a new connection
    this.router.post(
      '/',
      authenticate,
      ensureAuthenticated,
      validateRequest(ValidatorType.CONNECTION_CREATE),
      refreshToken,
      this.networkController.createConnection.bind(this.networkController)
    );

    // Get network value for a user
    this.router.get(
      '/value/:userId',
      authenticate,
      ensureAuthenticated,
      refreshToken,
      this.networkController.getNetworkValue.bind(this.networkController)
    );

    // Get industry-specific network statistics
    this.router.get(
      '/industry/:userId/:industryId',
      authenticate,
      ensureAuthenticated,
      refreshToken,
      this.networkController.getNetworkByIndustry.bind(this.networkController)
    );

    // Get network graph data for visualization
    this.router.get(
      '/graph/:userId',
      authenticate,
      ensureAuthenticated,
      refreshToken,
      this.networkController.getNetworkGraphData.bind(this.networkController)
    );

    // Update connection status
    this.router.patch(
      '/:connectionId',
      authenticate,
      ensureAuthenticated,
      validateRequest(ValidatorType.CONNECTION_UPDATE),
      refreshToken,
      this.networkController.updateConnectionStatus.bind(this.networkController)
    );
  }

  /**
   * Returns the configured router
   * @returns Router
   */
  getRouter(): Router {
    return this.router;
  }
}

/**
 * @fileoverview This module defines the Express router for network-related endpoints in the Pollen8 platform.
 * It sets up routes for creating and managing connections, retrieving network values, 
 * accessing industry-specific network data, and fetching network graph data for visualization.
 * 
 * Key requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 *    - Implemented in POST '/' and PATCH '/:connectionId' routes
 * 2. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Implemented in GET '/value/:userId' route
 * 3. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Implemented in GET '/industry/:userId/:industryId' route
 * 4. Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Implemented in GET '/graph/:userId' route
 * 
 * This router uses authentication, validation, and token refresh middlewares to ensure
 * secure and valid requests. It delegates the actual request handling to the NetworkController.
 */

export const ROUTES = {
  NETWORK: '/network'
};