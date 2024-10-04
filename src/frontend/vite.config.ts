import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Enable React support in Vite
  // Requirement: Frontend Technology (React.js integration)
  // Location: Technical Specification/1.2 Scope/Technical Scope
  plugins: [react()],

  // Configure path aliases for module resolution
  // Requirement: Development Efficiency (Enable easier imports)
  // Location: Technical Specification/2.1 Programming Languages
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },

  // Configure development server settings
  // Requirement: Development Efficiency (Enable hot module replacement and fast refresh)
  // Location: Technical Specification/2.1 Programming Languages
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  // Configure build options for production optimization
  // Requirement: Production Optimization (Configure build optimization for minimalist UI delivery)
  // Location: Technical Specification/1.2 Scope/Benefits
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          d3: ['d3'],
        },
      },
    },
  },

  // Configure CSS processing
  // Requirement: Frontend Technology (Tailwind CSS integration)
  // Location: Technical Specification/1.2 Scope/Technical Scope
  css: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },

  // Enable type checking in development mode
  // Requirement: Development Efficiency (Improve code quality and catch errors early)
  // Location: Technical Specification/2.1 Programming Languages
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        jsx: 'react-jsx',
      },
    },
  },

  // Configure environment variables
  // Requirement: Modern User Experience (Enable environment-specific configurations)
  // Location: Technical Specification/1.1 System Objectives/User-Centric Design
  envPrefix: 'POLLEN8_',
});