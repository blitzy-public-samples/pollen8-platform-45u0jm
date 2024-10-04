// PostCSS configuration for Pollen8 platform
// This file defines the CSS processing pipeline, focusing on Tailwind CSS and other necessary transformations.

// Requirements addressed:
// - User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
// - CSS Framework (Technical Specification/1.2 Scope/Technical Scope)
// - Modern UI (Technical Specification/1.2 Scope/Benefits)

// Import Tailwind CSS configuration
const tailwindConfig = require('./tailwind.config.js');

// Define PostCSS configuration
module.exports = {
  // Define plugins for CSS processing
  plugins: [
    // Include Tailwind CSS for utility-first styling
    // This addresses the CSS Framework requirement and enables minimalist UI development
    require('tailwindcss')(tailwindConfig),

    // Use Autoprefixer to add vendor prefixes automatically
    // This ensures compatibility with various browsers, supporting the Modern UI requirement
    require('autoprefixer'),

    // Additional plugins can be added here for further CSS processing if needed
  ],
};