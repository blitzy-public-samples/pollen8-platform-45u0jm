import React, { useState, useCallback } from 'react';
import classNames from 'classnames';
import { validatePhoneNumber, validateZipCode } from '../../utils/validation';

// Interface for the Input component props
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'text' | 'phone' | 'zipcode';
  size?: 'small' | 'medium' | 'large';
  error?: string;
  label?: string;
  fullWidth?: boolean;
}

/**
 * A reusable, minimalist input component adhering to Pollen8's black and white design aesthetic,
 * providing various input types and states for form interactions across the platform.
 * 
 * Requirements addressed:
 * - User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * - Modern User Experience (Technical Specification/1.2 Scope/Benefits)
 * - Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 */
export const Input: React.FC<InputProps> = ({
  variant = 'text',
  size = 'medium',
  error,
  label,
  fullWidth = false,
  className,
  onChange,
  ...props
}) => {
  const [internalError, setInternalError] = useState<string | undefined>(error);

  // Handle input changes and apply appropriate validation based on variant
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    let validationResult;

    switch (variant) {
      case 'phone':
        validationResult = validatePhoneNumber(value);
        break;
      case 'zipcode':
        validationResult = validateZipCode(value);
        break;
      default:
        validationResult = { isValid: true };
    }

    setInternalError(validationResult.isValid ? undefined : validationResult.error);

    if (onChange) {
      onChange(event);
    }
  }, [variant, onChange]);

  // Determine input classes based on props
  const inputClasses = classNames(
    'border border-black rounded-l-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black',
    {
      'w-full': fullWidth,
      'text-sm': size === 'small',
      'text-base': size === 'medium',
      'text-lg': size === 'large',
      'border-red-500': internalError,
    },
    className
  );

  return (
    <div className={classNames('flex flex-col', { 'w-full': fullWidth })}>
      {label && (
        <label className="mb-1 text-sm font-semibold text-black">
          {label}
        </label>
      )}
      <input
        className={inputClasses}
        onChange={handleInputChange}
        {...props}
      />
      {internalError && (
        <span className="mt-1 text-xs text-red-500">{internalError}</span>
      )}
    </div>
  );
};

export default Input;