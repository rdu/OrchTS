import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
    {
        files: ['src/**/*.ts'],
        ignores: ['src/**/*.test.ts', 'src/__tests__/**/*'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: './tsconfig.base.json',
                ecmaVersion: 2020,
                sourceType: 'module'
            },
            globals: {
                ...globals.node
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            // Allman Style
            'brace-style': ['error', 'allman', { 'allowSingleLine': true }],
            'curly': ['error', 'all'],

            // Basic Formatting
            'indent': ['error', 4, {
                'SwitchCase': 1,
                'FunctionDeclaration': { 'parameters': 'first' },
                'FunctionExpression': { 'parameters': 'first' },
                'CallExpression': { 'arguments': 'first' }
            }],
            'linebreak-style': ['error', 'unix'],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'comma-dangle': ['error', 'never'],
            'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 1 }],
            'padding-line-between-statements': [
                'error',
                { 'blankLine': 'always', 'prev': '*', 'next': 'return' },
                { 'blankLine': 'always', 'prev': ['const', 'let', 'var'], 'next': '*' },
                { 'blankLine': 'any', 'prev': ['const', 'let', 'var'], 'next': ['const', 'let', 'var'] }
            ],

            // TypeScript Specific
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',

            // General
            'no-console': ['error', { 'allow': ['warn', 'error'] }]
        }
    },
    {
        files: ['src/examples/**/*.ts'],
        rules: {
            'no-console': 'off'
        }
    }
];