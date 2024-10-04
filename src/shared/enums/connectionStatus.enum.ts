/**
 * ConnectionStatus Enum
 * 
 * This enum defines the possible states of a connection between users in the Pollen8 platform.
 * It supports the verified connections feature by providing a clear and type-safe way to track connection statuses.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Define possible states for authentic professional connections
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives): Support connection state tracking for network value calculation
 */
export enum ConnectionStatus {
    /**
     * Initial state when a connection request is created
     */
    INITIATED = 'initiated',

    /**
     * State when the connection request is sent but not yet accepted
     */
    PENDING = 'pending',

    /**
     * State when the connection request is accepted by the recipient
     */
    ACCEPTED = 'accepted',

    /**
     * State when the connection request is rejected by the recipient
     */
    REJECTED = 'rejected',

    /**
     * State when an existing connection is removed by either user
     */
    REMOVED = 'removed'
}

/**
 * Additional details:
 * - Only ACCEPTED connections contribute to the network value calculation (3.14 per connection)
 * - State transitions:
 *   - INITIATED -> PENDING (when request is sent)
 *   - PENDING -> ACCEPTED or REJECTED (based on recipient's action)
 *   - ACCEPTED -> REMOVED (when either user removes the connection)
 * - Usage contexts:
 *   - Connection status is a key factor in filtering and displaying network visualizations
 *   - Analytics and reporting use these statuses to track network growth and health
 *   - The enum values are used in both frontend and backend to ensure consistency
 *   - WebSocket events use these statuses for real-time connection updates
 */

/**
 * Example usage in connection creation:
 * 
 * const newConnection: IConnection = {
 *   userId: initiatorId,
 *   connectedUserId: recipientId,
 *   status: ConnectionStatus.INITIATED,
 *   // ... other properties
 * };
 */

/**
 * Example usage in connection update:
 * 
 * const updateConnection: IConnectionUpdate = {
 *   status: ConnectionStatus.ACCEPTED
 * };
 */

/**
 * Example usage in filtering:
 * 
 * const activeConnections = allConnections.filter(
 *   conn => conn.status === ConnectionStatus.ACCEPTED
 * );
 */