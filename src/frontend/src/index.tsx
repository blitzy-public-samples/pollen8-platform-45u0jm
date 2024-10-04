import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import ErrorFallback from './components/common/ErrorFallback';
import './styles/index.css';

/**
 * The entry point for the Pollen8 React frontend application.
 * This file is responsible for initializing the app and rendering the root component.
 * 
 * Requirements addressed:
 * - User-Centric Design (Technical Specification/1.1 System Objectives)
 *   Initializes the minimalist interface
 * - Modern User Experience (Technical Specification/1.2 Scope/Benefits)
 *   Sets up responsive design foundation
 * - Frontend Core (Technical Specification/4.2 Frameworks and Libraries)
 *   Establishes React.js as the frontend framework
 */

/**
 * The root element where the React app will be mounted
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

/**
 * Creates a root for concurrent rendering
 */
const root = ReactDOM.createRoot(rootElement);

/**
 * Renders the React application into the DOM
 * 
 * This function wraps the main App component with necessary providers and error boundaries
 */
const renderApp = () => {
  root.render(
    <React.StrictMode>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => window.location.reload()}
      >
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Render the application
renderApp();

// Enable hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    renderApp();
  });
}

// Log a message to confirm the app has started
console.log('Pollen8 application initialized');