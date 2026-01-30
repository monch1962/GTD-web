/**
 * Logger utility for consistent logging across the application
 *
 * Features:
 * - Configurable log levels (error, warn, info, debug)
 * - Environment-based filtering (production vs development)
 * - Consistent formatting
 * - Performance tracking
 *
 * @example
 * import { Logger } from './modules/utils/logger';
 * const logger = new Logger('MyModule');
 * logger.debug('Detailed debug info');
 * logger.info('User action completed');
 * logger.warn('Unexpected but recoverable issue');
 * logger.error('Critical error:', error);
 */
/**
 * Log levels enum
 */
export declare const LogLevel: {
    readonly ERROR: 0;
    readonly WARN: 1;
    readonly INFO: 2;
    readonly DEBUG: 3;
};
export type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel];
interface LoggerOptions {
    minLevel?: LogLevelType;
    enabled?: boolean;
}
/**
 * Logger class for application-wide logging
 */
export declare class Logger {
    private module;
    private minLevel;
    private enabled;
    /**
     * Create a new Logger instance
     * @param module - Module name for log prefixes
     * @param options - Logger options
     * @param options.minLevel - Minimum log level to output (default: INFO)
     * @param options.enabled - Whether logging is enabled (default: true)
     */
    constructor(module: string, options?: LoggerOptions);
    /**
     * Check if a log level should be output
     * @private
     * @param level - Log level to check
     * @returns True if should log
     */
    private _shouldLog;
    /**
     * Format log message with module prefix
     * @private
     * @param level - Log level name
     * @param message - Log message
     * @returns Formatted message
     */
    private _format;
    /**
     * Log debug message (detailed diagnostics)
     * @param args - Arguments to log
     */
    debug(...args: any[]): void;
    /**
     * Log info message (general information)
     * @param args - Arguments to log
     */
    info(...args: any[]): void;
    /**
     * Log warning message (unexpected but recoverable)
     * @param args - Arguments to log
     */
    warn(...args: any[]): void;
    /**
     * Log error message (critical issues)
     * @param args - Arguments to log
     */
    error(...args: any[]): void;
    /**
     * Time a operation for performance tracking
     * @param label - Label for the timing
     * @returns Call to end timing
     *
     * @example
     * const endTimer = logger.time('expensiveOperation');
     * // ... do work ...
     * endTimer();
     */
    time(label: string): () => void;
}
/**
 * Global logger configuration
 */
export declare const LoggerConfig: {
    /**
     * Set global minimum log level
     * @param level - Minimum log level
     */
    setMinLevel(level: LogLevelType): void;
    /**
     * Enable/disable all logging
     * @param enabled - Whether logging is enabled
     */
    setEnabled(enabled: boolean): void;
};
/**
 * Create a logger instance for a module
 * @param module - Module name
 * @param options - Logger options
 * @returns Logger instance
 *
 * @example
 * const logger = createLogger('MyModule');
 * logger.info('Something happened');
 */
export declare function createLogger(module: string, options?: LoggerOptions): Logger;
/**
 * Default logger for general application logging
 */
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map