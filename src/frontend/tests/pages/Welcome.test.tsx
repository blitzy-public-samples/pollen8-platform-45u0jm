import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthContext } from '../../src/contexts/AuthContext';
import Welcome from '../../src/pages/Welcome';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Helper function to render the Welcome component with mock auth context
const renderWelcome = (authState = { isAuthenticated: false, isLoading: false }) => {
  return render(
    <Router>
      <AuthContext.Provider value={authState}>
        <Welcome />
      </AuthContext.Provider>
    </Router>
  );
};

describe('Welcome Page Rendering', () => {
  test('renders welcome page with logo and get connected button', () => {
    renderWelcome();
    
    expect(screen.getByAltText('Pollen8 Logo')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Pollen8')).toBeInTheDocument();
    expect(screen.getByText('Get Connected')).toBeInTheDocument();
  });

  test('displays loading state when auth is loading', () => {
    renderWelcome({ isAuthenticated: false, isLoading: true });
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('User Interaction Tests', () => {
  test('displays phone verification component when get connected is clicked', async () => {
    renderWelcome();
    
    fireEvent.click(screen.getByText('Get Connected'));
    
    await waitFor(() => {
      expect(screen.getByTestId('phone-verification')).toBeInTheDocument();
    });
  });
});

describe('Authentication Flow Tests', () => {
  test('redirects to profile when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderWelcome();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  test('does not redirect when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderWelcome();
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('Animation Tests', () => {
  test('applies fade-in animation to logo', () => {
    renderWelcome();
    
    const logo = screen.getByAltText('Pollen8 Logo');
    expect(logo).toHaveClass('animate-fade-in');
  });

  test('applies slide-up animation to welcome text', () => {
    renderWelcome();
    
    const welcomeText = screen.getByText('Welcome to Pollen8');
    expect(welcomeText).toHaveClass('animate-slide-up');
  });

  test('applies pulse animation to Get Connected button', () => {
    renderWelcome();
    
    const button = screen.getByText('Get Connected');
    expect(button).toHaveClass('animate-pulse');
  });
});

describe('Accessibility Tests', () => {
  test('ensures all interactive elements are accessible by keyboard', () => {
    renderWelcome();
    
    const button = screen.getByText('Get Connected');
    expect(button).toHaveFocus();
    fireEvent.keyPress(button, { key: 'Enter', code: 13, charCode: 13 });
    
    waitFor(() => {
      expect(screen.getByTestId('phone-verification')).toBeInTheDocument();
    });
  });
});

describe('Error Handling Tests', () => {
  test('displays error message when authentication fails', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false, error: 'Authentication failed' });
    renderWelcome();
    
    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
  });
});

describe('Performance Tests', () => {
  test('renders welcome page within acceptable time frame', async () => {
    const startTime = performance.now();
    renderWelcome();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(200); // Assuming 200ms is an acceptable render time
  });
});