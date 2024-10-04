import { useEffect, useCallback, useState } from 'react';
import WebSocketService from '../services/websocket';
import { useAuth } from './useAuth';
import { NetworkGraphData } from '@shared/types/network.types';

/**
 * Interface defining the return type of the useWebSocket hook
 */
interface WebSocketHook {
  isConnected: boolean;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string, callback: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
}

/**
 * A custom React hook that provides WebSocket functionality for real-time updates
 * in the Pollen8 platform, managing connections, subscriptions, and event handling
 * for network values, connections, and invite analytics.
 *
 * @returns {WebSocketHook} Object containing WebSocket state and methods
 *
 * Requirements addressed:
 * - Real-time Updates (Technical Specification/2.1 High-Level Architecture Diagram): Enable live updates for network changes and invite analytics
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives): Facilitate real-time network value updates
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Provide seamless real-time experience
 */
export const useWebSocket = (): WebSocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const { getToken } = useAuth();
  const webSocketService = WebSocketService.getInstance();

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        const token = await getToken();
        if (token) {
          await webSocketService.connect(token);
          setIsConnected(true);
        } else {
          console.error('No authentication token available');
        }
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      webSocketService.disconnect();
      setIsConnected(false);
    };
  }, [getToken]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    webSocketService.subscribe(event as any, callback);
  }, []);

  const unsubscribe = useCallback((event: string, callback: (data: any) => void) => {
    webSocketService.unsubscribe(event as any, callback);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (webSocketService.socket) {
      webSocketService.socket.emit(event, data);
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    emit,
  };
};

/**
 * Example usage of the useWebSocket hook:
 *
 * const MyComponent = () => {
 *   const { isConnected, subscribe, unsubscribe } = useWebSocket();
 *
 *   useEffect(() => {
 *     const handleNetworkUpdate = (data: NetworkGraphData) => {
 *       // Handle network update
 *     };
 *
 *     if (isConnected) {
 *       subscribe('network.update', handleNetworkUpdate);
 *     }
 *
 *     return () => {
 *       unsubscribe('network.update', handleNetworkUpdate);
 *     };
 *   }, [isConnected, subscribe, unsubscribe]);
 *
 *   return (
 *     <div>
 *       WebSocket status: {isConnected ? 'Connected' : 'Disconnected'}
 *     </div>
 *   );
 * };
 */

export default useWebSocket;