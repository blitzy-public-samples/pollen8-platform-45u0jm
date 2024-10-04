import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the shape of our theme context
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook for accessing the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize isDark state
  const [isDark, setIsDark] = useState<boolean>(true);

  // Function to toggle the theme
  const toggleTheme = () => {
    setIsDark((prevIsDark) => !prevIsDark);
  };

  // Effect to update CSS variables and data-theme attribute
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--primary-bg', '#000000');
      root.style.setProperty('--primary-text', '#FFFFFF');
      root.style.setProperty('--accent', '#EFEFEF');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.style.setProperty('--primary-bg', '#FFFFFF');
      root.style.setProperty('--primary-text', '#000000');
      root.style.setProperty('--accent', '#EFEFEF');
      root.setAttribute('data-theme', 'light');
    }
  }, [isDark]);

  // Create the value object for the context
  const value: ThemeContextType = {
    isDark,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Export the ThemeContext as a named export
export { ThemeContext };

// Export a default object with both ThemeProvider and useTheme
export default { ThemeProvider, useTheme };