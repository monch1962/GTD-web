module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['standard', 'plugin:@typescript-eslint/recommended'],
    rules: {
        // TypeScript specific rules
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }
        ],
        '@typescript-eslint/no-explicit-any': 'warn',

        // Override JavaScript rules for TypeScript
        'no-unused-vars': 'off', // Use TypeScript version instead

        // Project-specific rules
        semi: ['error', 'never'],
        quotes: ['error', 'single'],
        indent: ['error', 4],
        'comma-dangle': ['error', 'only-multiline']
    },
    env: {
        browser: true,
        es2020: true,
        jest: true
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.ts']
            }
        }
    }
}
