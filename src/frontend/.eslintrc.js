module.exports = {
  // Parser options for TypeScript and modern JavaScript features
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },

  // Environment configuration
  env: {
    browser: true,
    es2021: true,
  },

  // Extend recommended configurations and plugins
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/typescript',
    'prettier', // Prevents conflicts with Prettier formatting
  ],

  // Custom rules
  rules: {
    // Enforce explicit return types for functions
    '@typescript-eslint/explicit-function-return-type': ['error'],

    // Disallow the use of 'any' type
    '@typescript-eslint/no-explicit-any': ['error'],

    // Disable prop-types as we're using TypeScript for type checking
    'react/prop-types': ['off'],

    // Not needed for React 17+ with new JSX transform
    'react/react-in-jsx-scope': ['off'],

    // Enforce import order
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      },
    ],

    // Disallow console statements in production code
    'no-console': ['error'],

    // Allow unused variables when prefixed with an underscore
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },

  // Specific overrides for certain file patterns
  overrides: [
    {
      // Disable certain rules for test files
      files: ['**/*.test.tsx', '**/*.test.ts', '**/*.spec.tsx', '**/*.spec.ts'],
      rules: {
        'no-unused-expressions': 'off',
      },
    },
    {
      // Allow default export in Vite config file
      files: ['vite.config.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};