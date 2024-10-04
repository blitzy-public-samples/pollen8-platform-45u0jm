import React from 'react';
import classNames from 'classnames';

// Define the LoadingSpinner component
const LoadingSpinner: React.FC = () => (
  <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
);

// Define the ButtonProps interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * Button component
 * 
 * A reusable, minimalist button component that adheres to the Pollen8 platform's
 * black and white design aesthetic while providing various states and animations
 * for enhanced user interaction.
 * 
 * @param {ButtonProps} props - The props for the Button component
 * @returns {React.ReactElement} The Button component
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  fullWidth = false,
  children,
  className,
  disabled,
  ...rest
}) => {
  // Define base classes for the button
  const baseClasses = 'font-semibold rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Define variant-specific classes
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-gray-500',
    secondary: 'bg-white text-black border border-black hover:bg-gray-100 focus:ring-gray-300',
  };

  // Define size-specific classes
  const sizeClasses = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg',
  };

  // Combine all classes
  const buttonClasses = classNames(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    {
      'w-full': fullWidth,
      'opacity-50 cursor-not-allowed': disabled || isLoading,
    },
    className
  );

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-2">Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;