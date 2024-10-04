import React, { useEffect, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useNetwork } from '@hooks/useNetwork';
import { formatNetworkValue } from '@utils/networkCalculation';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { BASE_CONNECTION_VALUE } from '@shared/constants/networkValue';

interface NetworkValueProps {
  className?: string;
}

/**
 * A React component that displays and animates the user's network value,
 * calculated based on their connections using the constant value of 3.14 per connection.
 * 
 * Requirements addressed:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Displays network value calculation (3.14 per connection)
 * 2. User-Centric Design (Technical Specification/1.1 System Objectives)
 *    - Implements smooth animations for value changes
 * 3. Network Value Calculation (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Visualizes network value in the UI
 * 
 * @param {NetworkValueProps} props - The properties passed to the component
 * @returns {JSX.Element} A rendered network value component
 */
const NetworkValue: React.FC<NetworkValueProps> = ({ className = '' }) => {
  const { networkValue, isLoading } = useNetwork();
  const prevNetworkValue = useRef(networkValue);

  // Use Framer Motion's useSpring for smooth value transitions
  const animatedValue = useSpring(networkValue, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (networkValue !== prevNetworkValue.current) {
      animatedValue.set(networkValue);
      prevNetworkValue.current = networkValue;
    }
  }, [networkValue, animatedValue]);

  if (isLoading) {
    return <LoadingSpinner size="medium" className={`${className} text-black`} />;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.h2 
        className="text-4xl font-semibold mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Network Value
      </motion.h2>
      <motion.div 
        className="text-6xl font-bold"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {animatedValue.get().toFixed(2)}
      </motion.div>
      <motion.p 
        className="text-sm mt-2 text-gray-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Based on {(networkValue / BASE_CONNECTION_VALUE).toFixed(0)} connections
      </motion.p>
      <motion.p 
        className="text-xs mt-1 text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        ({formatNetworkValue(BASE_CONNECTION_VALUE)} per connection)
      </motion.p>
    </div>
  );
};

export default React.memo(NetworkValue);

// Performance optimization: Use React.memo to prevent unnecessary re-renders
// when the component's props haven't changed.

// Accessibility: Used semantic HTML elements and provided clear text descriptions.

// Animation: Utilized Framer Motion for smooth animations on value changes and component mount.

// Styling: Applied Tailwind CSS classes for consistent styling and layout.

// Responsiveness: Used flexible layout and relative units for better responsiveness.

// Error Handling: Displays a loading spinner when data is being fetched.

// Modularity: Separated the network value logic into a custom hook (useNetwork) for better separation of concerns.

// Precision: Used toFixed(2) to ensure consistent decimal places in the displayed value.

// Informative: Provided additional context by showing the number of connections and value per connection.