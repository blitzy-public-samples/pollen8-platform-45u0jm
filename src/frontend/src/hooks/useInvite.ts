import { useState, useEffect, useCallback } from 'react';
import { IInvite, InviteAnalytics } from '@shared/interfaces/invite.interface';
import ApiService from '../services/api';
import WebSocketService from '../services/websocket';
import { useWebSocket } from '../services/websocket';
import { SocketEvent } from '../types/socket.types';

const DEBOUNCE_DELAY: number = 300;

interface UseInviteReturn {
  invites: IInvite[];
  analytics: Record<string, InviteAnalytics>;
  isLoading: boolean;
  error: string | null;
  createInvite: (name: string) => Promise<IInvite>;
  deleteInvite: (inviteId: string) => Promise<void>;
  updateInvite: (inviteId: string, data: Partial<IInvite>) => Promise<IInvite>;
}

/**
 * Custom hook for managing invite functionality in the Pollen8 platform
 * @returns {UseInviteReturn} Object containing invite management functions and state
 */
export const useInvite = (): UseInviteReturn => {
  const [invites, setInvites] = useState<IInvite[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, InviteAnalytics>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { subscribe, unsubscribe } = useWebSocket();

  // Fetch existing invites on mount
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        setIsLoading(true);
        const response = await ApiService.getInvites();
        if (response.success && response.data) {
          setInvites(response.data.invites);
          setAnalytics(response.data.analytics);
        }
      } catch (err) {
        setError('Failed to fetch invites');
        console.error('Error fetching invites:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvites();
  }, []);

  // Set up WebSocket subscription for real-time updates
  useEffect(() => {
    const handleInviteUpdate = (updatedInvite: IInvite) => {
      setInvites(prevInvites => 
        prevInvites.map(invite => 
          invite._id === updatedInvite._id ? updatedInvite : invite
        )
      );
    };

    const handleAnalyticsUpdate = (updatedAnalytics: { inviteId: string, analytics: InviteAnalytics }) => {
      setAnalytics(prevAnalytics => ({
        ...prevAnalytics,
        [updatedAnalytics.inviteId]: updatedAnalytics.analytics
      }));
    };

    subscribe(SocketEvent.INVITE_UPDATED, handleInviteUpdate);
    subscribe(SocketEvent.INVITE_ANALYTICS_UPDATED, handleAnalyticsUpdate);

    return () => {
      unsubscribe(SocketEvent.INVITE_UPDATED, handleInviteUpdate);
      unsubscribe(SocketEvent.INVITE_ANALYTICS_UPDATED, handleAnalyticsUpdate);
    };
  }, [subscribe, unsubscribe]);

  // Define memoized callback functions for invite operations
  const createInvite = useCallback(async (name: string): Promise<IInvite> => {
    try {
      const response = await ApiService.generateInviteLink(name);
      if (response.success && response.data) {
        const newInvite = response.data;
        setInvites(prevInvites => [...prevInvites, newInvite]);
        return newInvite;
      } else {
        throw new Error('Failed to create invite');
      }
    } catch (err) {
      setError('Failed to create invite');
      console.error('Error creating invite:', err);
      throw err;
    }
  }, []);

  const deleteInvite = useCallback(async (inviteId: string): Promise<void> => {
    try {
      const response = await ApiService.deleteInvite(inviteId);
      if (response.success) {
        setInvites(prevInvites => prevInvites.filter(invite => invite._id !== inviteId));
        setAnalytics(prevAnalytics => {
          const { [inviteId]: _, ...rest } = prevAnalytics;
          return rest;
        });
      } else {
        throw new Error('Failed to delete invite');
      }
    } catch (err) {
      setError('Failed to delete invite');
      console.error('Error deleting invite:', err);
      throw err;
    }
  }, []);

  const updateInvite = useCallback(async (inviteId: string, data: Partial<IInvite>): Promise<IInvite> => {
    try {
      const response = await ApiService.updateInvite(inviteId, data);
      if (response.success && response.data) {
        const updatedInvite = response.data;
        setInvites(prevInvites => 
          prevInvites.map(invite => 
            invite._id === inviteId ? updatedInvite : invite
          )
        );
        return updatedInvite;
      } else {
        throw new Error('Failed to update invite');
      }
    } catch (err) {
      setError('Failed to update invite');
      console.error('Error updating invite:', err);
      throw err;
    }
  }, []);

  return {
    invites,
    analytics,
    isLoading,
    error,
    createInvite,
    deleteInvite,
    updateInvite
  };
};

/**
 * @fileoverview This module provides a custom React hook for managing invite functionality in the Pollen8 platform.
 * It handles invite creation, tracking, and analytics, addressing the following requirements:
 * 
 * 1. Invitation System: Implements trackable invite link generation (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 2. Analytics Visualization: Enables invite performance tracking (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 3. One-click Sharing: Facilitates easy invite link sharing (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 
 * The hook manages state for invites and their analytics, provides functions for CRUD operations on invites,
 * and sets up real-time updates via WebSocket connections for invite and analytics data.
 */