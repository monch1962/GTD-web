'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.default = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': [
            'babel-jest',
            {
                presets: [
                    ['@babel/preset-env', { targets: { node: 'current' } }],
                    '@babel/preset-typescript'
                ]
            }
        ]
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.(js|jsx|ts|tsx)$': '$1',
        '^@/(.*)$': '<rootDir>/js/$1',
        '^@modules/(.*)$': '<rootDir>/js/modules/$1',
        '^@tests/(.*)$': '<rootDir>/__tests__/$1'
    },
    testMatch: ['**/__tests__/**/*.(js|jsx|ts|tsx)', '**/?(*.)+(spec|test).(js|jsx|ts|tsx)'],
    testPathIgnorePatterns: [
        '/tests-e2e/',
        '/tests/journeys/',
        '/playwright-report/',
        '/test-results/'
    ],
    collectCoverageFrom: [
        'js/**/*.(js|ts)',
        '!js/app.js', // Skip app.js as it's mostly DOM manipulation
        '!js/app-refactored.ts',
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
//# sourceMappingURL=jest.config.js.map
