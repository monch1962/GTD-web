'use strict'
/**
 * Centralized error handling and reporting system
 * Provides consistent error handling, logging, and user notifications
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.errorHandler =
    exports.ErrorHandler =
    exports.AppError =
    exports.ErrorCategory =
    exports.ErrorSeverity =
        void 0
exports.setupGlobalErrorHandling = setupGlobalErrorHandling
// Error severity levels
exports.ErrorSeverity = {
    LOW: 'low', // Non-critical, can be recovered
    MEDIUM: 'medium', // Affects functionality but app continues
    HIGH: 'high', // Critical, affects core features
    CRITICAL: 'critical' // App-breaking, requires immediate attention
}
// Error categories
exports.ErrorCategory = {
    STORAGE: 'storage',
    NETWORK: 'network',
    VALIDATION: 'validation',
    PERMISSION: 'permission',
    RUNTIME: 'runtime',
    UNKNOWN: 'unknown'
}
/**
 * Custom application error class
 */
class AppError extends Error {
    constructor(
        message,
        category = exports.ErrorCategory.UNKNOWN,
        severity = exports.ErrorSeverity.MEDIUM,
        details = {}
    ) {
        super(message)
        this.name = 'AppError'
        this.category = category
        this.severity = severity
        this.details = details
        this.timestamp = new Date().toISOString()
        this.userMessage = this.getUserMessage()
    }
    /**
     * Get user-friendly error message
     */
    getUserMessage() {
        const messages = {
            [exports.ErrorCategory.STORAGE]: 'Storage error occurred. Your data may not be saved.',
            [exports.ErrorCategory.NETWORK]: 'Network error. Please check your connection.',
            [exports.ErrorCategory.VALIDATION]: 'Invalid input. Please check your data.',
            [exports.ErrorCategory.PERMISSION]: 'Permission denied. Please check your settings.',
            [exports.ErrorCategory.RUNTIME]: 'An error occurred. Please try again.',
            [exports.ErrorCategory.UNKNOWN]: 'An unexpected error occurred.'
        }
        return messages[this.category] || messages[exports.ErrorCategory.UNKNOWN]
    }
    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            category: this.category,
            severity: this.severity,
            details: this.details,
            timestamp: this.timestamp,
            userMessage: this.userMessage,
            stack: this.stack
        }
    }
}
exports.AppError = AppError
/**
 * Main error handler class
 */
class ErrorHandler {
    constructor(options = {}) {
        this.errors = []
        this.options = {
            maxErrors: 100,
            showNotifications: true,
            logToConsole: true,
            autoRecover: true,
            ...options
        }
    }
    /**
     * Set notification callback for showing user notifications
     */
    setNotificationCallback(callback) {
        this.notificationCallback = callback
    }
    /**
     * Handle an error
     */
    handle(error, context = {}) {
        const appError = error instanceof AppError ? error : this.wrapError(error)
        const report = {
            error: appError,
            context,
            timestamp: new Date().toISOString(),
            recovered: false
        }
        // Add to error history
        this.errors.push(report)
        if (this.errors.length > this.options.maxErrors) {
            this.errors.shift()
        }
        // Log to console
        if (this.options.logToConsole) {
            this.logToConsole(appError, context)
        }
        // Show user notification
        if (this.options.showNotifications && this.notificationCallback) {
            this.showNotification(appError)
        }
        // Attempt auto-recovery
        if (this.options.autoRecover) {
            report.recovered = this.attemptRecovery(appError, context)
        }
        return report.recovered
    }
    /**
     * Wrap a standard Error in AppError
     */
    wrapError(error) {
        let category = exports.ErrorCategory.UNKNOWN
        let severity = exports.ErrorSeverity.MEDIUM
        // Determine category from error message or type
        if (error.message.includes('localStorage') || error.message.includes('storage')) {
            category = exports.ErrorCategory.STORAGE
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            category = exports.ErrorCategory.NETWORK
        } else if (error.message.includes('permission') || error.message.includes('access')) {
            category = exports.ErrorCategory.PERMISSION
        }
        // Determine severity
        if (error.message.includes('quota') || error.message.includes('full')) {
            severity = exports.ErrorSeverity.HIGH
        } else if (error.message.includes('syntax') || error.message.includes('parse')) {
            severity = exports.ErrorSeverity.MEDIUM
        }
        return new AppError(error.message, category, severity, { originalError: error })
    }
    /**
     * Log error to console with appropriate level
     */
    logToConsole(error, context) {
        const logLevels = {
            [exports.ErrorSeverity.LOW]: 'log',
            [exports.ErrorSeverity.MEDIUM]: 'warn',
            [exports.ErrorSeverity.HIGH]: 'error',
            [exports.ErrorSeverity.CRITICAL]: 'error'
        }
        const logMethod = logLevels[error.severity] || 'error'
        const logData = {
            error: error.toJSON(),
            context,
            timestamp: new Date().toISOString()
        }
        console[logMethod]('Application Error:', logData)
        // Also log stack trace for debugging
        if (error.stack && error.severity !== exports.ErrorSeverity.LOW) {
            console[logMethod]('Stack trace:', error.stack)
        }
    }
    /**
     * Show user notification
     */
    showNotification(error) {
        if (!this.notificationCallback) return
        const notificationTypes = {
            [exports.ErrorSeverity.LOW]: 'info',
            [exports.ErrorSeverity.MEDIUM]: 'warning',
            [exports.ErrorSeverity.HIGH]: 'error',
            [exports.ErrorSeverity.CRITICAL]: 'error'
        }
        const type = notificationTypes[error.severity] || 'error'
        this.notificationCallback('Error', error.userMessage, type)
    }
    /**
     * Attempt to recover from error
     */
    attemptRecovery(error, context) {
        switch (error.category) {
            case exports.ErrorCategory.STORAGE:
                return this.recoverFromStorageError(error, context)
            case exports.ErrorCategory.NETWORK:
                return this.recoverFromNetworkError(error, context)
            default:
                return false
        }
    }
    /**
     * Recover from storage errors
     */
    recoverFromStorageError(error, context) {
        // Clear localStorage if quota exceeded
        if (error.message.includes('quota') || error.message.includes('full')) {
            try {
                localStorage.clear()
                console.log('Storage quota exceeded, cleared localStorage')
                return true
            } catch (e) {
                return false
            }
        }
        // Remove corrupted data
        if (error.message.includes('JSON') || error.message.includes('parse')) {
            const key = context.key || 'gtd_data'
            try {
                localStorage.removeItem(key)
                console.log(`Removed corrupted data from key: ${key}`)
                return true
            } catch (e) {
                return false
            }
        }
        return false
    }
    /**
     * Recover from network errors
     */
    recoverFromNetworkError(_error, context) {
        // Network errors typically can't be auto-recovered
        // but we can retry the operation
        if (context.retryCount && context.retryCount < 3) {
            console.log(`Retrying network operation (attempt ${context.retryCount + 1})`)
            return true // Signal that retry should be attempted
        }
        return false
    }
    /**
     * Get error history
     */
    getErrorHistory() {
        return [...this.errors]
    }
    /**
     * Clear error history
     */
    clearErrorHistory() {
        this.errors = []
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errors.length,
            recovered: this.errors.filter((e) => e.recovered).length,
            byCategory: {},
            bySeverity: {}
        }
        // Count by category
        this.errors.forEach((report) => {
            const category = report.error.category
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
        })
        // Count by severity
        this.errors.forEach((report) => {
            const severity = report.error.severity
            stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1
        })
        return stats
    }
}
exports.ErrorHandler = ErrorHandler
/**
 * Global error handler instance
 */
exports.errorHandler = new ErrorHandler()
/**
 * Setup global error handling for uncaught errors
 */
function setupGlobalErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        const error = new AppError(
            event.message,
            exports.ErrorCategory.RUNTIME,
            exports.ErrorSeverity.HIGH,
            {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        )
        exports.errorHandler.handle(error, { source: 'uncaught' })
    })
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
        const appError = new AppError(
            error.message,
            exports.ErrorCategory.RUNTIME,
            exports.ErrorSeverity.MEDIUM,
            {
                promise: event.promise
            }
        )
        exports.errorHandler.handle(appError, { source: 'unhandledrejection' })
    })
    console.log('Global error handling setup complete')
}
//# sourceMappingURL=error-handler.js.map
