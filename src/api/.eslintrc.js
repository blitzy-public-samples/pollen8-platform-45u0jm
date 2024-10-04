module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // Enforce explicit function return types
    '@typescript-eslint/explicit-function-return-type': ['error'],

    // Disallow the use of 'any' type
    '@typescript-eslint/no-explicit-any': ['error'],

    // Enforce import order
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      },
    ],

    // Disallow console.log statements in production code
    'no-console': ['error'],

    // Allow unused variables in function parameters if they start with an underscore
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Disable 'no-unused-expressions' for test files
      files: ['**/*.test.ts', '**/*.spec.ts'],
      rules: {
        'no-unused-expressions': 'off',
      },
    },
  ],
};