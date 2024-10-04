import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Header component for the Pollen8 platform
 * 
 * This component provides navigation and authentication status in a minimalist,
 * black and white design. It adapts to the user's authentication state and
 * provides appropriate actions.
 * 
 * Requirements addressed:
 * - User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * - Modern User Experience (Technical Specification/1.2 Scope/Benefits)
 * - Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 * 
 * @returns {JSX.Element} The rendered header component
 */
const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 bg-primary-bg text-primary-text z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        <Navigation isAuthenticated={isAuthenticated} />
        <AuthSection isAuthenticated={isAuthenticated} user={user} logout={logout} />
        <button onClick={toggleTheme} className="ml-4">
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};

/**
 * Logo component that renders the Pollen8 logo as a link to the home page
 * 
 * @returns {JSX.Element} The rendered logo component
 */
const Logo: React.FC = () => (
  <Link to="/" className="text-2xl font-semibold">
    Pollen8
  </Link>
);

/**
 * Navigation component that renders navigation links when the user is authenticated
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @returns {JSX.Element | null} The rendered navigation component or null
 */
const Navigation: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  if (!isAuthenticated) return null;

  return (
    <nav>
      <ul className="flex space-x-4">
        <li><Link to="/network" className="hover:text-accent">Network</Link></li>
        <li><Link to="/invite" className="hover:text-accent">Invite</Link></li>
      </ul>
    </nav>
  );
};

/**
 * AuthSection component that renders authentication-related content
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated
 * @param {Object | null} props.user - The authenticated user object
 * @param {Function} props.logout - Logout function
 * @returns {JSX.Element} The rendered auth section
 */
const AuthSection: React.FC<{ isAuthenticated: boolean; user: any; logout: () => void }> = ({ isAuthenticated, user, logout }) => {
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-4">
        <span>Network Value: {user.networkValue?.toFixed(2)}</span>
        <Button variant="secondary" size="small" onClick={logout}>Logout</Button>
      </div>
    );
  }

  return (
    <Link to="/login">
      <Button variant="primary" size="small">Get Connected</Button>
    </Link>
  );
};

export default Header;