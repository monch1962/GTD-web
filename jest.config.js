export default {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.(js|jsx)$': 'babel-jest'
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.(js|jsx|ts|tsx)$': '$1',
        '^@/(.*)$': '<rootDir>/js/$1',
        '^@modules/(.*)$': '<rootDir>/js/modules/$1',
        '^@tests/(.*)$': '<rootDir>/__tests__/$1'
    },
    testMatch: ['**/__tests__/**/*.(js|jsx|ts|tsx)', '**/?(*.)+(spec|test).(js|jsx|ts|tsx)'],
    testPathIgnorePatterns: ['/playwright-report/', '/test-results/'],
    collectCoverageFrom: [
        'js/**/*.(js|ts)',
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
    testTimeout: 30000,
    transformIgnorePatterns: ['node_modules/']
}
