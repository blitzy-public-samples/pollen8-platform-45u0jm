import React from 'react';
import '../../styles/animations.css';

// Interface defining the props for the LoadingSpinner component
interface LoadingSpinnerProps {
  size: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * A functional React component that renders an animated loading spinner.
 * 
 * Requirements addressed:
 * 1. User-Centric Design: Implements smooth animations for loading states
 *    Location: Technical Specification/1.1 System Objectives/User-Centric Design
 * 2. Minimalist Interface: Ensures loading indicator adheres to black and white design
 *    Location: Technical Specification/1.1 System Objectives/User-Centric Design
 * 
 * @param {LoadingSpinnerProps} props - The properties passed to the component
 * @returns {JSX.Element} A rendered loading spinner component
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size, className = '' }) => {
  // Determine the appropriate dimensions and border width based on the size prop
  const dimensions = {
    small: { size: '20px', border: '2px' },
    medium: { size: '40px', border: '3px' },
    large: { size: '60px', border: '4px' },
  }[size];

  // Styles for the spinner
  const spinnerStyle: React.CSSProperties = {
    width: dimensions.size,
    height: dimensions.size,
    border: `${dimensions.border} solid #ffffff`,
    borderTop: `${dimensions.border} solid #000000`,
    borderRadius: '50%',
    display: 'inline-block',
  };

  return (
    <div
      className={`loading-spinner ${className}`}
      style={spinnerStyle}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default React.memo(LoadingSpinner);

// Performance optimization: Use React.memo to prevent unnecessary re-renders
// when the component's props haven't changed.

// Accessibility: Added appropriate ARIA attributes for screen readers.

// Styling: Applied black and white styling adhering to platform aesthetics.

// Animation: Utilized the 'loading-spinner' class from animations.css for the spin animation.

// Customization: Allowed for additional className to be passed for further styling if needed.

// Responsiveness: Used different sizes based on the 'size' prop for various use cases.

// Error Prevention: TypeScript interface ensures correct prop types are passed.