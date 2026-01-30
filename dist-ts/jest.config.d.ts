declare namespace _default {
    let testEnvironment: string;
    let transform: {
        '^.+\\.(js|jsx|ts|tsx)$': (string | {
            presets: (string | (string | {
                targets: {
                    node: string;
                };
            })[])[];
        })[];
    };
    let moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.(js|jsx|ts|tsx)$': string;
        '^@/(.*)$': string;
        '^@modules/(.*)$': string;
        '^@tests/(.*)$': string;
    };
    let testMatch: string[];
    let testPathIgnorePatterns: string[];
    let collectCoverageFrom: string[];
    namespace coverageThreshold {
        namespace global {
            let branches: number;
            let functions: number;
            let lines: number;
            let statements: number;
        }
    }
    let verbose: boolean;
    let testTimeout: number;
    let transformIgnorePatterns: string[];
}
export default _default;
//# sourceMappingURL=jest.config.d.ts.map