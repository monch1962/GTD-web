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
 * import { Logger } from './modules/utils/logger.js';
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
};

/**
 * Logger class for application-wide logging
 */
export class Logger {
    /**
     * Create a new Logger instance
     * @param {string} module - Module name for log prefixes
     * @param {Object} options - Logger options
     * @param {number} options.minLevel - Minimum log level to output (default: INFO)
     * @param {boolean} options.enabled - Whether logging is enabled (default: true)
     */
    constructor(module, options = {}) {
        this.module = module;
        this.minLevel = options.minLevel !== undefined ? options.minLevel : LogLevel.INFO;
        this.enabled = options.enabled !== undefined ? options.enabled : true;

        // Auto-detect environment
        if (options.minLevel === undefined) {
            this.minLevel = window.location.hostname === 'localhost' ? LogLevel.DEBUG : LogLevel.INFO;
        }
    }

    /**
     * Check if a log level should be output
     * @private
     * @param {number} level - Log level to check
     * @returns {boolean} True if should log
     */
    _shouldLog(level) {
        return this.enabled && level <= this.minLevel;
    }

    /**
     * Format log message with module prefix
     * @private
     * @param {string} level - Log level name
     * @param {string} message - Log message
     * @returns {string} Formatted message
     */
    _format(level, message) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        return `[${timestamp}] [${this.module}] ${level}: ${message}`;
    }

    /**
     * Log debug message (detailed diagnostics)
     * @param {...any} args - Arguments to log
     */
    debug(...args) {
        if (this._shouldLog(LogLevel.DEBUG)) {
            console.log(this._format('DEBUG', args[0]), ...args.slice(1));
        }
    }

    /**
     * Log info message (general information)
     * @param {...any} args - Arguments to log
     */
    info(...args) {
        if (this._shouldLog(LogLevel.INFO)) {
            console.log(this._format('INFO', args[0]), ...args.slice(1));
        }
    }

    /**
     * Log warning message (unexpected but recoverable)
     * @param {...any} args - Arguments to log
     */
    warn(...args) {
        if (this._shouldLog(LogLevel.WARN)) {
            console.warn(this._format('WARN', args[0]), ...args.slice(1));
        }
    }

    /**
     * Log error message (critical issues)
     * @param {...any} args - Arguments to log
     */
    error(...args) {
        if (this._shouldLog(LogLevel.ERROR)) {
            console.error(this._format('ERROR', args[0]), ...args.slice(1));
        }
    }

    /**
     * Time a operation for performance tracking
     * @param {string} label - Label for the timing
     * @returns {Function} Call to end timing
     *
     * @example
     * const endTimer = logger.time('expensiveOperation');
     * // ... do work ...
     * endTimer();
     */
    time(label) {
        if (!this._shouldLog(LogLevel.DEBUG)) {
            return () => {};
        }

        const startTime = performance.now();
        this.debug(`⏱️ ${label} - START`);

        return () => {
            const duration = (performance.now() - startTime).toFixed(2);
            this.debug(`⏱️ ${label} - END (${duration}ms)`);
        };
    }
}

/**
 * Global logger configuration
 */
export const LoggerConfig = {
    /**
     * Set global minimum log level
     * @param {number} level - Minimum log level
     */
    setMinLevel(level) {
        globalThis.__GTD_LOG_LEVEL__ = level;
    },

    /**
     * Enable/disable all logging
     * @param {boolean} enabled - Whether logging is enabled
     */
    setEnabled(enabled) {
        globalThis.__GTD_LOGGING_ENABLED__ = enabled;
    }
};

/**
 * Create a logger instance for a module
 * @param {string} module - Module name
 * @param {Object} options - Logger options
 * @returns {Logger} Logger instance
 *
 * @example
 * const logger = createLogger('MyModule');
 * logger.info('Something happened');
 */
export function createLogger(module, options = {}) {
    return new Logger(module, options);
}

/**
 * Default logger for general application logging
 */
export const logger = new Logger('GTD');
