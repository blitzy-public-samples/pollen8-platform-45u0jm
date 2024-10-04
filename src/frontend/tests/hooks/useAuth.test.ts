import { renderHook, act } from '@testing-library/react';
import { useAuth, AuthHookResult } from '@frontend/hooks/useAuth';
import { AuthContext, AuthContextType } from '@frontend/contexts/AuthContext';
import React from 'react';
import { IUser } from '@shared/interfaces/user.interface';

// Mock the API service
jest.mock('@frontend/services/api', () => ({
  verifyPhoneNumber: jest.fn(),
  confirmVerification: jest.fn(),
}));

describe('useAuth Hook', () => {
  // Helper function to create a wrapper with AuthContext
  const createWrapper = (contextValue: Partial<AuthContextType>) => {
    return ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={contextValue as AuthContextType}>
        {children}
      </AuthContext.Provider>
    );
  };

  // Helper function to wait for the next update
  const waitForNextUpdate = async (result: { current: AuthHookResult }) => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  it('should start with null user', () => {
    const wrapper = createWrapper({ user: null, isAuthenticated: false });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should start with isAuthenticated as false', () => {
    const wrapper = createWrapper({ user: null, isAuthenticated: false });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle verifyPhoneNumber success', async () => {
    const mockVerifyPhoneNumber = jest.fn().mockResolvedValue({ verificationId: '123' });
    const wrapper = createWrapper({
      user: null,
      isAuthenticated: false,
      verifyPhoneNumber: mockVerifyPhoneNumber,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.verifyPhoneNumber('+1234567890');
    });

    expect(mockVerifyPhoneNumber).toHaveBeenCalledWith('+1234567890');
    expect(result.current.verificationId).toBe('123');
  });

  it('should handle verifyPhoneNumber failure', async () => {
    const mockVerifyPhoneNumber = jest.fn().mockRejectedValue(new Error('Invalid phone number'));
    const wrapper = createWrapper({
      user: null,
      isAuthenticated: false,
      verifyPhoneNumber: mockVerifyPhoneNumber,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(result.current.verifyPhoneNumber('+1234567890')).rejects.toThrow('Invalid phone number');
  });

  it('should handle confirmVerification success', async () => {
    const mockUser: IUser = { id: 'user1', phoneNumber: '+1234567890' };
    const mockConfirmVerification = jest.fn().mockResolvedValue(mockUser);
    const wrapper = createWrapper({
      user: null,
      isAuthenticated: false,
      confirmVerification: mockConfirmVerification,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.confirmVerification('123456');
    });

    expect(mockConfirmVerification).toHaveBeenCalledWith('123456');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle confirmVerification failure', async () => {
    const mockConfirmVerification = jest.fn().mockRejectedValue(new Error('Invalid code'));
    const wrapper = createWrapper({
      user: null,
      isAuthenticated: false,
      confirmVerification: mockConfirmVerification,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(result.current.confirmVerification('123456')).rejects.toThrow('Invalid code');
  });

  it('should clear authentication state on logout', () => {
    const mockLogout = jest.fn();
    const wrapper = createWrapper({
      user: { id: 'user1', phoneNumber: '+1234567890' },
      isAuthenticated: true,
      logout: mockLogout,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle loading state during async operations', async () => {
    const mockVerifyPhoneNumber = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    const wrapper = createWrapper({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      verifyPhoneNumber: mockVerifyPhoneNumber,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(false);

    const verifyPromise = result.current.verifyPhoneNumber('+1234567890');

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await verifyPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should throw an error when used outside of AuthProvider', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.error).toEqual(Error('useAuth must be used within an AuthProvider'));
  });
});