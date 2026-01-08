/**
 * Centralized error handling and reporting system
 * Provides consistent error handling, logging, and user notifications
 */

// Error severity levels
export const ErrorSeverity = {
    LOW: 'low',           // Non-critical, can be recovered
    MEDIUM: 'medium',     // Affects functionality but app continues
    HIGH: 'high',         // Critical, affects core features
    CRITICAL: 'critical'  // App-breaking, requires immediate attention
};

// Error categories
export const ErrorCategory = {
    STORAGE: 'storage',
    NETWORK: 'network',
    VALIDATION: 'validation',
    PERMISSION: 'permission',
    RUNTIME: 'runtime',
    UNKNOWN: 'unknown'
};

/**
 * Custom application error class
 */
export class AppError extends Error {
    constructor(message, category = ErrorCategory.UNKNOWN, severity = ErrorSeverity.MEDIUM, details = {}) {
        super(message);
        this.name = 'AppError';
        this.category = category;
        this.severity = severity;
        this.details = details;
        this.timestamp = new Date().toISOString();
        this.userMessage = this.getUserMessage();
    }

    /**
     * Get user-friendly error message
     */
    getUserMessage() {
        const messages = {
            [ErrorCategory.STORAGE]: 'Storage error occurred. Your data may not be saved.',
            [ErrorCategory.NETWORK]: 'Network error. Please check your connection.',
            [ErrorCategory.VALIDATION]: 'Invalid input. Please check your data.',
            [ErrorCategory.PERMISSION]: 'Permission denied. Please check your settings.',
            [ErrorCategory.RUNTIME]: 'Application error occurred.',
            [ErrorCategory.UNKNOWN]: 'An unexpected error occurred.'
        };
        return messages[this.category] || messages[ErrorCategory.UNKNOWN];
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            category: this.category,
            severity: this.severity,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

/**
 * Error handler class
 */
export class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100; // Keep last 100 errors in memory
        this.listeners = new Set();
        this.isEnabled = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
    }

    /**
     * Handle an error
     * @param {Error} error - Error to handle
     * @param {Object} context - Additional context (function, module, etc.)
     */
    handle(error, context = {}) {
        const appError = this.normalizeError(error);

        // Add context
        appError.details = {
            ...appError.details,
            ...context
        };

        // Log error
        this.logError(appError);

        // Store error
        this.storeError(appError);

        // Notify listeners
        this.notifyListeners(appError);

        // Show user notification if severe
        if (appError.severity === ErrorSeverity.HIGH || appError.severity === ErrorSeverity.CRITICAL) {
            this.showUserNotification(appError);
        }

        return appError;
    }

    /**
     * Normalize any error to AppError
     */
    normalizeError(error) {
        if (error instanceof AppError) {
            return error;
        }

        // Determine category based on error message/name
        let category = ErrorCategory.UNKNOWN;
        let severity = ErrorSeverity.MEDIUM;

        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_FILE_NO_DEVICE_SPACE') {
            category = ErrorCategory.STORAGE;
            severity = ErrorSeverity.HIGH;
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
            category = ErrorCategory.NETWORK;
            severity = ErrorSeverity.MEDIUM;
        } else if (error.message?.includes('permission') || error.message?.includes('denied')) {
            category = ErrorCategory.PERMISSION;
            severity = ErrorSeverity.HIGH;
        } else if (error.name === 'TypeError' || error.name === 'ReferenceError') {
            category = ErrorCategory.RUNTIME;
            severity = ErrorSeverity.HIGH;
        }

        return new AppError(
            error.message || 'Unknown error',
            category,
            severity,
            { originalError: error.name, stack: error.stack }
        );
    }

    /**
     * Log error to console
     */
    logError(error) {
        if (!this.isEnabled) return;

        const severityIcons = {
            [ErrorSeverity.LOW]: 'ℹ️',
            [ErrorSeverity.MEDIUM]: '⚠️',
            [ErrorSeverity.HIGH]: '🔴',
            [ErrorSeverity.CRITICAL]: '🚨'
        };

        const icon = severityIcons[error.severity] || '⚠️';

        console.group(`${icon} Error: ${error.message}`);
        console.error('Category:', error.category);
        console.error('Severity:', error.severity);
        console.error('Timestamp:', error.timestamp);
        if (error.details && Object.keys(error.details).length > 0) {
            console.error('Details:', error.details);
        }
        if (error.stack && this.isEnabled) {
            console.error('Stack:', error.stack);
        }
        console.groupEnd();
    }

    /**
     * Store error in memory
     */
    storeError(error) {
        this.errors.push(error);

        // Keep only last N errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
    }

    /**
     * Show user notification for severe errors
     */
    showUserNotification(error) {
        if (typeof window === 'undefined') return;

        const message = `${error.userMessage}\n\nDetails: ${error.message}`;

        // Try to show via app notification system
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        } else {
            // Fallback to console
            console.error('User Notification:', message);
        }
    }

    /**
     * Notify error listeners
     */
    notifyListeners(error) {
        this.listeners.forEach(listener => {
            try {
                listener(error);
            } catch (e) {
                console.error('Error in error listener:', e);
            }
        });
    }

    /**
     * Add error listener
     */
    addListener(listener) {
        if (typeof listener === 'function') {
            this.listeners.add(listener);
        }
    }

    /**
     * Remove error listener
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }

    /**
     * Get all errors
     */
    getErrors() {
        return [...this.errors];
    }

    /**
     * Get errors by category
     */
    getErrorsByCategory(category) {
        return this.errors.filter(e => e.category === category);
    }

    /**
     * Get errors by severity
     */
    getErrorsBySeverity(severity) {
        return this.errors.filter(e => e.severity === severity);
    }

    /**
     * Clear all errors
     */
    clearErrors() {
        this.errors = [];
    }

    /**
     * Get error summary
     */
    getSummary() {
        const summary = {
            total: this.errors.length,
            byCategory: {},
            bySeverity: {}
        };

        this.errors.forEach(error => {
            summary.byCategory[error.category] = (summary.byCategory[error.category] || 0) + 1;
            summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
        });

        return summary;
    }

    /**
     * Wrap an async function with error handling
     */
    wrapAsync(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.handle(error, {
                    ...context,
                    args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a)
                });
                throw error; // Re-throw for caller to handle
            }
        };
    }

    /**
     * Wrap a sync function with error handling
     */
    wrap(fn, context = {}) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handle(error, {
                    ...context,
                    args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a)
                });
                throw error; // Re-throw for caller to handle
            }
        };
    }

    /**
     * Execute async function with error handling
     */
    async execute(fn, context = {}) {
        try {
            return await fn();
        } catch (error) {
            this.handle(error, context);
            throw error;
        }
    }

    /**
     * Execute sync function with error handling
     */
    executeSync(fn, context = {}) {
        try {
            return fn();
        } catch (error) {
            this.handle(error, context);
            throw error;
        }
    }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandling() {
    if (typeof window === 'undefined') return;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        errorHandler.handle(event.error, {
            source: 'global',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        errorHandler.handle(event.reason, {
            source: 'unhandledrejection',
            promise: true
        });
    });
}

/**
 * Decorator to add error handling to methods
 */
export function handleErrors(context = {}) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args) {
            try {
                return await originalMethod.apply(this, args);
            } catch (error) {
                errorHandler.handle(error, {
                    ...context,
                    class: target.constructor.name,
                    method: propertyKey
                });
                throw error;
            }
        };

        return descriptor;
    };
}

export default errorHandler;
