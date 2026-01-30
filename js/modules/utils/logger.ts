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
export const LogLevel = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
} as const

export type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel]

interface LoggerOptions {
    minLevel?: LogLevelType
    enabled?: boolean
}

/**
 * Logger class for application-wide logging
 */
export class Logger {
    private module: string
    private minLevel: LogLevelType
    private enabled: boolean

    /**
     * Create a new Logger instance
     * @param module - Module name for log prefixes
     * @param options - Logger options
     * @param options.minLevel - Minimum log level to output (default: INFO)
     * @param options.enabled - Whether logging is enabled (default: true)
     */
    constructor(module: string, options: LoggerOptions = {}) {
        this.module = module
        this.minLevel = options.minLevel !== undefined ? options.minLevel : LogLevel.INFO
        this.enabled = options.enabled !== undefined ? options.enabled : true

        // Auto-detect environment
        if (options.minLevel === undefined) {
            // Check if we're in a browser environment
            const isBrowser = typeof window !== 'undefined'
            if (isBrowser && window.location && window.location.hostname === 'localhost') {
                this.minLevel = LogLevel.DEBUG
            } else {
                // Default to INFO for Node.js/SSR/production environments
                this.minLevel = LogLevel.INFO
            }
        }
    }

    /**
     * Check if a log level should be output
     * @private
     * @param level - Log level to check
     * @returns True if should log
     */
    private _shouldLog(level: LogLevelType): boolean {
        return this.enabled && level <= this.minLevel
    }

    /**
     * Format log message with module prefix
     * @private
     * @param level - Log level name
     * @param message - Log message
     * @returns Formatted message
     */
    private _format(level: string, message: string): string {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
        return `[${timestamp}] [${this.module}] ${level}: ${message}`
    }

    /**
     * Log debug message (detailed diagnostics)
     * @param args - Arguments to log
     */
    debug(...args: any[]): void {
        if (this._shouldLog(LogLevel.DEBUG)) {
            console.log(this._format('DEBUG', args[0]), ...args.slice(1))
        }
    }

    /**
     * Log info message (general information)
     * @param args - Arguments to log
     */
    info(...args: any[]): void {
        if (this._shouldLog(LogLevel.INFO)) {
            console.log(this._format('INFO', args[0]), ...args.slice(1))
        }
    }

    /**
     * Log warning message (unexpected but recoverable)
     * @param args - Arguments to log
     */
    warn(...args: any[]): void {
        if (this._shouldLog(LogLevel.WARN)) {
            console.warn(this._format('WARN', args[0]), ...args.slice(1))
        }
    }

    /**
     * Log error message (critical issues)
     * @param args - Arguments to log
     */
    error(...args: any[]): void {
        if (this._shouldLog(LogLevel.ERROR)) {
            console.error(this._format('ERROR', args[0]), ...args.slice(1))
        }
    }

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
    time(label: string): () => void {
        if (!this._shouldLog(LogLevel.DEBUG)) {
            return () => {}
        }

        const startTime = performance.now()
        this.debug(`⏱️ ${label} - START`)

        return () => {
            const duration = (performance.now() - startTime).toFixed(2)
            this.debug(`⏱️ ${label} - END (${duration}ms)`)
        }
    }
}

/**
 * Global logger configuration
 */
export const LoggerConfig = {
    /**
     * Set global minimum log level
     * @param level - Minimum log level
     */
    setMinLevel(level: LogLevelType): void {
        ;(globalThis as any).__GTD_LOG_LEVEL__ = level
    },

    /**
     * Enable/disable all logging
     * @param enabled - Whether logging is enabled
     */
    setEnabled(enabled: boolean): void {
        ;(globalThis as any).__GTD_LOGGING_ENABLED__ = enabled
    }
}

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
export function createLogger(module: string, options: LoggerOptions = {}): Logger {
    return new Logger(module, options)
}

/**
 * Default logger for general application logging
 */
export const logger = new Logger('GTD')
