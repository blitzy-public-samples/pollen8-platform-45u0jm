import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Welcome from '@pages/Welcome';
import Profile from '@pages/Profile';
import Network from '@pages/Network';
import Invite from '@pages/Invite';

/**
 * PrivateRoute component to protect routes that require authentication
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {JSX.Element} Rendered component or redirect
 */
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

/**
 * Main App component that sets up the routing and context providers for the Pollen8 application
 * 
 * Requirements addressed:
 * - User-Centric Design (Technical Specification/1.1 System Objectives)
 * - Modern User Experience (Technical Specification/1.2 Scope/Benefits)
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 * 
 * @returns {JSX.Element} The rendered application
 */
const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-primary-bg text-primary-text">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 mt-16">
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/network" element={<PrivateRoute><Network /></PrivateRoute>} />
                <Route path="/invite" element={<PrivateRoute><Invite /></PrivateRoute>} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;