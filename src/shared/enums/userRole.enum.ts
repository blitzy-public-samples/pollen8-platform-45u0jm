/**
 * UserRole Enumeration
 * 
 * This enumeration defines the possible roles a user can have in the Pollen8 platform.
 * It is used for role-based access control throughout the application.
 * 
 * Requirements addressed:
 * - User Authentication (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 *   Define user role types for authorization
 * - System Security (Technical Specification/5. Security Considerations)
 *   Establish role-based access control
 */

export enum UserRole {
  /**
   * Standard user role for regular platform users.
   * This is the default role assigned to new users.
   */
  USER = 'user',

  /**
   * Administrative role with elevated privileges.
   * Reserved for platform administrators who need access to advanced features and settings.
   */
  ADMIN = 'admin',

  /**
   * System-level role for automated processes.
   * Used for system-level operations and background tasks.
   */
  SYSTEM = 'system'
}

/**
 * Notes:
 * - The values are case-sensitive and should be used exactly as defined.
 * - No additional roles are planned in the current scope.
 * - The enum is intentionally simple to maintain a clear and straightforward permission model.
 */

/**
 * Example usage in type definitions:
 * 
 * type UserWithRole = {
 *   id: string;
 *   role: UserRole;
 * };
 */

/**
 * Example usage in conditions:
 * 
 * if (user.role === UserRole.ADMIN) {
 *   // Perform admin-specific operations
 * }
 */

/**
 * This enum supports the platform's security model as outlined in the technical specification.
 * It provides a clear distinction between regular users, administrators, and system processes,
 * allowing for precise control over access and permissions throughout the application.
 */