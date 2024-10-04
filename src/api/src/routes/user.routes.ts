import { Router } from 'express';
import { injectable, inject } from 'inversify';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest, ValidatorType } from '../middleware/validation.middleware';

/**
 * Router class for handling user-related routes in the Pollen8 platform
 * @description This class defines the Express router for user endpoints, mapping HTTP requests to controller functions
 * 
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 *    - Define routes for user verification and profile management
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Expose endpoints for industry selection and management (handled in user update)
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Provide route for retrieving network value
 * 4. User-Centric Design (Technical Specification/1.1 System Objectives)
 *    - Implement RESTful routes with clear naming
 */
@injectable()
export class UserRouter {
  private router: Router;

  constructor(
    @inject(UserController) private userController: UserController
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  /**
   * Initializes the user routes
   * @private
   */
  private initializeRoutes(): void {
    // POST /users - Create a new user
    this.router.post(
      '/',
      validateRequest(ValidatorType.USER_CREATE),
      this.userController.createUser.bind(this.userController)
    );

    // PUT /users - Update user profile (authenticated)
    this.router.put(
      '/',
      authenticate,
      validateRequest(ValidatorType.USER_UPDATE),
      this.userController.updateUser.bind(this.userController)
    );

    // GET /users/profile - Get user profile (authenticated)
    this.router.get(
      '/profile',
      authenticate,
      this.userController.getUserProfile.bind(this.userController)
    );

    // GET /users/network-value - Get user's network value (authenticated)
    this.router.get(
      '/network-value',
      authenticate,
      this.userController.getNetworkValue.bind(this.userController)
    );
  }

  /**
   * Returns the configured Express router
   * @returns {Router} Configured Express router instance
   */
  getRouter(): Router {
    return this.router;
  }
}

/**
 * Function to initialize and return the user routes
 * @param userController Instance of UserController
 * @returns {Router} Configured Express router instance
 */
export const initializeUserRoutes = (userController: UserController): Router => {
  const userRouter = new UserRouter(userController);
  return userRouter.getRouter();
};