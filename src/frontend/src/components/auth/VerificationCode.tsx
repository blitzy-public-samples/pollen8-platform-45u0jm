import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../common/Input';
import Button from '../common/Button';

/**
 * Interface for the component's state
 */
interface VerificationCodeState {
  code: string;
  error: string | null;
  isSubmitting: boolean;
}

/**
 * VerificationCode component
 * 
 * A React component responsible for handling the SMS verification code input
 * and submission during the phone verification process in the Pollen8 platform.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Implements SMS-based authentication
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Provides intuitive verification code input
 * - Phone Verification (Technical Specification/1.2 Scope/Core Functionalities): Handles verification code confirmation
 * 
 * @returns {JSX.Element} Rendered verification code interface
 */
const VerificationCode: React.FC = () => {
  const [state, setState] = useState<VerificationCodeState>({
    code: '',
    error: null,
    isSubmitting: false,
  });

  const navigate = useNavigate();
  const { confirmVerification } = useAuth();

  /**
   * Handle code input changes
   * Ensures numeric input and max length of 6 characters
   */
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setState(prevState => ({ ...prevState, code: value, error: null }));
  }, []);

  /**
   * Handle form submission
   * Validates the code and calls the confirmVerification function
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.code.length !== 6) {
      setState(prevState => ({ ...prevState, error: 'Please enter a 6-digit code' }));
      return;
    }

    setState(prevState => ({ ...prevState, isSubmitting: true, error: null }));

    try {
      await confirmVerification(state.code);
      navigate('/profile'); // Navigate to profile page on successful verification
    } catch (error) {
      setState(prevState => ({
        ...prevState,
        error: 'Invalid verification code. Please try again.',
        isSubmitting: false,
      }));
    }
  }, [state.code, confirmVerification, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-semibold text-center mb-6">Verify Your Phone</h2>
        <p className="text-center mb-8">
          Enter the 6-digit code we sent to your phone number.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={state.code}
            onChange={handleCodeChange}
            placeholder="000000"
            label="Verification Code"
            variant="text"
            fullWidth
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            autoFocus
          />
          {state.error && (
            <p className="text-red-500 text-sm text-center">{state.error}</p>
          )}
          <Button
            type="submit"
            isLoading={state.isSubmitting}
            disabled={state.code.length !== 6 || state.isSubmitting}
            fullWidth
          >
            Verify
          </Button>
        </form>
        <p className="text-center mt-4 text-sm">
          Didn't receive a code? <button className="text-black underline" onClick={() => {}}>Resend</button>
        </p>
      </div>
    </div>
  );
};

export default VerificationCode;