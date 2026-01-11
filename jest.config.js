export default {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    testPathIgnorePatterns: [
        '/tests-e2e/',
        '/tests/journeys/',
        '/playwright-report/',
        '/test-results/'
    ],
    collectCoverageFrom: [
        'js/**/*.js',
        '!js/app.js', // Skip app.js as it's mostly DOM manipulation
        '!**/node_modules/**'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    verbose: true,
    testTimeout: 10000,
    transformIgnorePatterns: ['node_modules/']
}
