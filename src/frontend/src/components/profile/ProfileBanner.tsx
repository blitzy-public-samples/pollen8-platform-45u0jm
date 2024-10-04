import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { select } from 'd3-selection';
import NetworkValue from '@components/network/NetworkValue';
import { useNetwork } from '@hooks/useNetwork';
import { createStarConstellation } from '@utils/d3Helpers';
import { IUser } from '@shared/interfaces/user.interface';

// Animation duration constant
const ANIMATION_DURATION = 1000;

interface ProfileBannerProps {
  className?: string;
  user: IUser;
}

/**
 * A React component that renders a visually striking, minimalist banner for user profiles,
 * featuring a dynamic star constellation animation and displaying key user information.
 * 
 * Requirements addressed:
 * 1. User-Centric Design (Technical Specification/1.1 System Objectives)
 *    - Implements black and white minimalist interface with smooth animations
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Displays user's selected industries
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Showcases network value calculation
 * 
 * @param {ProfileBannerProps} props - The properties passed to the component
 * @returns {JSX.Element} A rendered profile banner component
 */
const ProfileBanner: React.FC<ProfileBannerProps> = ({ className = '', user }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { networkValue } = useNetwork();

  // Custom hook for constellation animation
  useConstellationAnimation(containerRef);

  return (
    <motion.div
      ref={containerRef}
      className={`relative w-full h-64 bg-black text-white overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: ANIMATION_DURATION / 1000 }}
    >
      {/* Constellation background */}
      <div className="absolute inset-0" aria-hidden="true"></div>

      {/* User information */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center">
        <motion.h1
          className="text-4xl font-semibold mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {user.name}
        </motion.h1>

        {/* Industry tags */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {user.industries.map((industry, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white text-black text-sm rounded-full"
            >
              {industry}
            </span>
          ))}
        </motion.div>

        {/* Network Value component */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <NetworkValue />
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * Custom hook to manage the star constellation animation in the banner background.
 * 
 * @param {React.RefObject<HTMLDivElement>} containerRef - Reference to the container element
 */
const useConstellationAnimation = (containerRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    if (!containerRef.current) return;

    const svg = select(containerRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
      .style('z-index', 1);

    const { cleanup } = createStarConstellation(svg);

    const handleResize = () => {
      svg.attr('width', containerRef.current?.clientWidth)
         .attr('height', containerRef.current?.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cleanup();
      window.removeEventListener('resize', handleResize);
      svg.remove();
    };
  }, []);
};

export default React.memo(ProfileBanner);

// Performance optimization: Use React.memo to prevent unnecessary re-renders
// when the component's props haven't changed.

// Accessibility: Used semantic HTML elements, ARIA attributes, and ensured proper color contrast.

// Animation: Utilized Framer Motion for smooth animations on component mount and user information display.

// Styling: Applied Tailwind CSS classes for consistent styling and layout.

// Responsiveness: Used flexible layout and relative units for better responsiveness.

// Modularity: Separated the constellation animation logic into a custom hook for better separation of concerns.

// Error Handling: Ensure proper null checks before accessing containerRef.current.

// Cleanup: Properly remove event listeners and SVG elements on component unmount.

// Customization: Allowed for custom className to be passed for further styling flexibility.