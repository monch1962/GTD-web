/**
 * ESLint Configuration for GTD Web Application
 *
 * Extends Standard style with customizations for:
 * - ES6 modules
 * - Browser environment
 * - Jest testing
 * - Playwright E2E testing
 * - Custom utility functions
 */

module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
        node: false
    },
    extends: [
        'standard'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        // Custom rules for GTD-web codebase style

        // Project uses semicolons (matching existing code)
        'semi': ['off'],

        // Project uses 4-space indentation (matching existing code)
        'indent': ['off'],

        // Allow console statements for our logger (they're intentional)
        'no-console': 'off',

        // Allow async functions without await (sometimes needed for interfaces)
        'require-await': 'off',

        // Allow dangling underscores for private methods (_render, _build, etc.)
        'no-underscore-dangle': 'off',

        // Allow empty catch blocks (when error handling is optional)
        'no-empty': ['off'],

        // Prefer const over let (but allow let when needed)
        'prefer-const': 'off',

        // Allow unused vars (existing code has many)
        'no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],

        // Allow using optional chaining (?.) which we use extensively
        'no-unused-expressions': ['off'],

        // Allow template strings in strings (used in tests)
        'no-template-curly-in-string': 'off',

        // Spacing and formatting
        'space-before-function-paren': ['off'],

        // Consistent naming conventions
        camelcase: ['off'],

        // No duplicate class members
        'no-dupe-class-members': 'error',

        // Import ordering (optional but nice)
        'import/order': ['warn', {
            groups: [
                'builtin',
                'external',
                'internal',
                'parent',
                'sibling',
                'index'
            ],
            'newlines-between': 'never',
            alphabetize: {
                order: 'asc',
                caseInsensitive: true
            }
        }]
    },
    overrides: [
        // Test files: Allow more relaxed rules
        {
            files: ['**/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],
            env: {
                jest: true,
                node: true
            },
            plugins: ['jest'],
            extends: ['plugin:jest/recommended'],
            rules: {
                'no-console': 'off',
                'no-template-curly-in-string': 'off',
                'no-unused-vars': 'off',
                'no-useless-escape': 'off',
                'no-extend-native': 'off',
                'jest/no-conditional-expect': 'off',
                'jest/no-done-callback': 'off',
                'no-undef': 'off'
            }
        },
        // E2E test files: Playwright environment
        {
            files: ['**/e2e/**/*.js', '**/tests/e2e/**/*.js'],
            env: {
                node: true
            },
            globals: {
                page: true,
                browser: true,
                context: true,
                expect: true
            },
            rules: {
                'no-console': 'off'
            }
        },
        // Configuration files
        {
            files: ['*.config.js', '.eslintrc.js', 'babel.config.js'],
            env: {
                node: true
            },
            rules: {
                'no-console': 'off'
            }
        },
        // jest.config.js
        {
            files: ['jest.config.js'],
            env: {
                node: true,
                jest: true
            },
            rules: {
                'no-console': 'off'
            }
        }
    ],
    globals: {
        // GTD-web specific globals (if any)
        // Add any global variables here
    }
};
