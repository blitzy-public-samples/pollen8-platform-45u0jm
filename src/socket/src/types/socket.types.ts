import { Socket, Server } from 'socket.io';
import { IUser } from '../../../shared/interfaces/user.interface';
import { NetworkNode, NetworkLink } from '../../../shared/types/network.types';

/**
 * Interface extending Socket for user-specific socket connections
 * @description Extends the Socket interface to include user-specific properties
 * @requirements Real-time Updates (Technical Specification/2.3.1 Frontend Components/NetworkModule)
 */
export interface ISocketUser extends Socket {
  userId: string;
  industries: string[];
}

/**
 * Type for network graph update events
 * @description Defines the payload structure for real-time network graph updates
 * @requirements Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export type NetworkUpdatePayload = {
  nodes: NetworkNode[];
  links: NetworkLink[];
  industry: string;
};

/**
 * Type for network value change events
 * @description Defines the payload structure for real-time network value updates
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
export type NetworkValuePayload = {
  userId: string;
  newValue: number;
  change: number;
};

/**
 * Type for invite link click events
 * @description Defines the payload structure for real-time invite link click notifications
 * @requirements Real-time Updates (Technical Specification/2.3.1 Frontend Components/NetworkModule)
 */
export type InviteClickPayload = {
  inviteId: string;
  clickCount: number;
};

/**
 * Interface defining all server-to-client event types
 * @description Specifies the events that the server can emit to connected clients
 * @requirements Real-time Updates (Technical Specification/2.3.1 Frontend Components/NetworkModule)
 */
export interface IServerToClientEvents {
  networkUpdate: (data: NetworkUpdatePayload) => void;
  networkValueChange: (data: NetworkValuePayload) => void;
  inviteClicked: (data: InviteClickPayload) => void;
}

/**
 * Interface defining all client-to-server event types
 * @description Specifies the events that clients can emit to the server
 * @requirements Real-time Updates (Technical Specification/2.3.1 Frontend Components/NetworkModule)
 */
export interface IClientToServerEvents {
  subscribeToNetwork: (industries: string[]) => void;
  unsubscribeFromNetwork: (industries: string[]) => void;
}

/**
 * Type alias for the Socket.IO server instance with custom event interfaces
 * @description Extends the Socket.IO Server type with custom event interfaces
 */
export type SocketIOServer = Server<IClientToServerEvents, IServerToClientEvents>;

/**
 * Type alias for the Socket.IO socket instance with custom event interfaces and user properties
 * @description Extends the Socket.IO Socket type with custom event interfaces and user-specific properties
 */
export type SocketIOSocket = ISocketUser & {
  emit: <T extends keyof IServerToClientEvents>(
    event: T,
    ...args: Parameters<IServerToClientEvents[T]>
  ) => boolean;
};

/**
 * @fileoverview This TypeScript file defines the types and interfaces for WebSocket communication in the Pollen8 platform,
 * ensuring type safety for real-time events and data transfer between the client and server.
 * 
 * Key requirements addressed:
 * 1. Real-time Updates (Technical Specification/2.3.1 Frontend Components/NetworkModule)
 *    - Defined interfaces for real-time socket events (IServerToClientEvents, IClientToServerEvents)
 * 2. Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Provided types for real-time network graph updates (NetworkUpdatePayload)
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Enabled real-time network value updates (NetworkValuePayload)
 * 
 * This file ensures type safety and consistency in WebSocket communication, facilitating real-time
 * updates for network visualizations, value changes, and invite link interactions.
 */