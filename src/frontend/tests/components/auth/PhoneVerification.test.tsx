import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PhoneVerification } from '../../../src/components/auth/PhoneVerification';
import { useAuth } from '../../../src/hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../../src/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the Input and Button components
jest.mock('../../../src/components/common/Input', () => ({
  Input: ({ label, ...props }: any) => <input aria-label={label} {...props} />,
}));
jest.mock('../../../src/components/common/Button', () => ({
  Button: (props: any) => <button {...props} />,
}));

describe('PhoneVerification Component', () => {
  // Mock implementation of verifyPhoneNumber
  const mockVerifyPhoneNumber = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      verifyPhoneNumber: mockVerifyPhoneNumber,
    });
  });

  // Helper function to render the component
  const renderPhoneVerification = () => render(<PhoneVerification />);

  describe('Rendering Tests', () => {
    it('renders phone input field', () => {
      renderPhoneVerification();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    });

    it('renders verify button', () => {
      renderPhoneVerification();
      expect(screen.getByRole('button', { name: /verify phone number/i })).toBeInTheDocument();
    });

    it('displays correct placeholder text', () => {
      renderPhoneVerification();
      expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument();
    });
  });

  describe('User Interaction Tests', () => {
    it('handles phone number input correctly', () => {
      renderPhoneVerification();
      const input = screen.getByLabelText('Phone Number');
      fireEvent.change(input, { target: { value: '1234567890' } });
      expect(input).toHaveValue('1234567890');
    });

    it('removes non-numeric characters from input', () => {
      renderPhoneVerification();
      const input = screen.getByLabelText('Phone Number');
      fireEvent.change(input, { target: { value: '+1 (234) 567-8900' } });
      expect(input).toHaveValue('12345678900');
    });

    it('shows loading state during submission', async () => {
      renderPhoneVerification();
      const input = screen.getByLabelText('Phone Number');
      const button = screen.getByRole('button', { name: /verify phone number/i });

      fireEvent.change(input, { target: { value: '1234567890' } });
      fireEvent.click(button);

      expect(button).toHaveAttribute('disabled');
      await waitFor(() => {
        expect(mockVerifyPhoneNumber).toHaveBeenCalledWith('1234567890');
      });
    });
  });

  describe('Validation Tests', () => {
    it('displays error for invalid phone number', async () => {
      renderPhoneVerification();
      const input = screen.getByLabelText('Phone Number');
      const button = screen.getByRole('button', { name: /verify phone number/i });

      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
      });
      expect(mockVerifyPhoneNumber).not.toHaveBeenCalled();
    });

    it('clears error when input changes', async () => {
      renderPhoneVerification();
      const input = screen.getByLabelText('Phone Number');
      const button = screen.getByRole('button', { name: /verify phone number/i });

      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
      });

      fireEvent.change(input, { target: { value: '1234' } });
      expect(screen.queryByText(/invalid phone number/i)).not.toBeInTheDocument();
    });
  });

  describe('API Integration Tests', () => {
    it('calls verifyPhoneNumber on valid submission', async () => {
      renderPhoneVerification();
      const input = screen.getByLabelText('Phone Number');
      const button = screen.getByRole('button', { name: /verify phone number/i });

      fireEvent.change(input, { target: { value: '1234567890' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockVerifyPhoneNumber).toHaveBeenCalledWith('1234567890');
      });
    });

    it('displays error message on verification failure', async () => {
      mockVerifyPhoneNumber.mockRejectedValue(new Error('Verification failed'));
      renderPhoneVerification();
      const input = screen.getByLabelText('Phone Number');
      const button = screen.getByRole('button', { name: /verify phone number/i });

      fireEvent.change(input, { target: { value: '1234567890' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/failed to send verification code/i)).toBeInTheDocument();
      });
    });
  });

  // Additional tests for accessibility, responsiveness, and edge cases could be added here
});