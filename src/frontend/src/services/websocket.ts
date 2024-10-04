import { io, Socket } from 'socket.io-client';

// Assuming AuthContext provides a getToken method
import { useAuth } from '../contexts/AuthContext';

// Assuming SocketEvent is an enum or union type of possible socket events
import { SocketEvent } from '../types/socket.types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
const RECONNECTION_ATTEMPTS = 3;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventHandlers: Map<SocketEvent, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Establishes a WebSocket connection with authentication
   * @param token - The authentication token
   * @returns A promise that resolves when the connection is established
   */
  public async connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        reconnectionAttempts: RECONNECTION_ATTEMPTS,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnected = false;
      });

      // Set up listeners for all registered event handlers
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.socket!.on(event, handler);
        });
      });
    });
  }

  /**
   * Subscribes to a specific socket event
   * @param event - The socket event to subscribe to
   * @param handler - The function to handle the event
   */
  public subscribe(event: SocketEvent, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);

    if (this.socket && this.isConnected) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Unsubscribes from a specific socket event
   * @param event - The socket event to unsubscribe from
   * @param handler - The function to remove from the event handlers
   */
  public unsubscribe(event: SocketEvent, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }

    if (this.socket && this.isConnected) {
      this.socket.off(event, handler);
    }
  }

  /**
   * Closes the WebSocket connection and cleans up resources
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
    }
  }
}

export const useWebSocket = () => {
  const { getToken } = useAuth();
  const webSocketService = WebSocketService.getInstance();

  const connectWebSocket = async () => {
    const token = await getToken();
    if (token) {
      await webSocketService.connect(token);
    } else {
      throw new Error('No authentication token available');
    }
  };

  return {
    connect: connectWebSocket,
    subscribe: webSocketService.subscribe.bind(webSocketService),
    unsubscribe: webSocketService.unsubscribe.bind(webSocketService),
    disconnect: webSocketService.disconnect.bind(webSocketService),
  };
};

export default WebSocketService.getInstance();