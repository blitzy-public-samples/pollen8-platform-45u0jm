import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PhoneVerification from '../components/auth/PhoneVerification';
import Logo from '../assets/images/logo.svg';

/**
 * Welcome Component
 * 
 * The main landing page component for the Pollen8 platform, featuring a minimalist
 * black and white design with smooth animations and phone verification functionality.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Implements initial phone verification interface
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Delivers minimalist black and white interface
 * - Modern User Experience (Technical Specification/1.2 Scope/Benefits): Provides smooth animations and intuitive design
 * 
 * @returns {JSX.Element} The rendered welcome page component
 */
const Welcome: React.FC = () => {
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to the profile page
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/profile');
    }
  }, [isAuthenticated, isLoading, navigate]);

  /**
   * Triggers the display of the phone verification component
   */
  const handleGetConnected = () => {
    setShowVerification(true);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <img src={Logo} alt="Pollen8 Logo" className="w-32 h-32 mb-8 animate-fade-in" />
      <h1 className="text-4xl font-semibold mb-4 animate-slide-up">Welcome to Pollen8</h1>
      <p className="text-xl mb-8 text-center animate-slide-up delay-100">
        Connect with professionals in your industry and grow your network.
      </p>
      {!showVerification ? (
        <button
          onClick={handleGetConnected}
          className="bg-white text-black px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-200 animate-pulse"
        >
          Get Connected
        </button>
      ) : (
        <div className="w-full max-w-md animate-fade-in">
          <PhoneVerification />
        </div>
      )}
    </div>
  );
};

export default Welcome;

// CSS animations (to be added to your global CSS or a separate animations file)
const animationStyles = `
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.5s ease-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.delay-100 {
  animation-delay: 100ms;
}
`;