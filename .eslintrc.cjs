module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['**/dist/**', '**/release/**', '**/coverage/**', 'node_modules/**'],
  env: { es2021: true, node: true },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'no-useless-escape': 'off',
  },
  overrides: [
    {
      files: ['dashboard/**/*.{ts,tsx}'],
      env: { browser: true, es2021: true },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.ts'],
      env: { jest: true },
    },
  ],
};
