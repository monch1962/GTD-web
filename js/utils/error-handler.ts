/**
 * Centralized error handling and reporting system
 * Provides consistent error handling, logging, and user notifications
 */

// Error severity levels
export const ErrorSeverity = {
    LOW: 'low', // Non-critical, can be recovered
    MEDIUM: 'medium', // Affects functionality but app continues
    HIGH: 'high', // Critical, affects core features
    CRITICAL: 'critical' // App-breaking, requires immediate attention
} as const

// Error categories
export const ErrorCategory = {
    STORAGE: 'storage',
    NETWORK: 'network',
    VALIDATION: 'validation',
    PERMISSION: 'permission',
    RUNTIME: 'runtime',
    UNKNOWN: 'unknown'
} as const

type ErrorSeverityType = (typeof ErrorSeverity)[keyof typeof ErrorSeverity]
type ErrorCategoryType = (typeof ErrorCategory)[keyof typeof ErrorCategory]

interface ErrorDetails {
    [key: string]: any
}

/**
 * Custom application error class
 */
export class AppError extends Error {
    category: ErrorCategoryType
    severity: ErrorSeverityType
    details: ErrorDetails
    timestamp: string
    userMessage: string

    constructor (
        message: string,
        category: ErrorCategoryType = ErrorCategory.UNKNOWN,
        severity: ErrorSeverityType = ErrorSeverity.MEDIUM,
        details: ErrorDetails = {}
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
    getUserMessage (): string {
        const messages: Record<ErrorCategoryType, string> = {
            [ErrorCategory.STORAGE]: 'Storage error occurred. Your data may not be saved.',
            [ErrorCategory.NETWORK]: 'Network error. Please check your connection.',
            [ErrorCategory.VALIDATION]: 'Invalid input. Please check your data.',
            [ErrorCategory.PERMISSION]: 'Permission denied. Please check your settings.',
            [ErrorCategory.RUNTIME]: 'An error occurred. Please try again.',
            [ErrorCategory.UNKNOWN]: 'An unexpected error occurred.'
        }

        return messages[this.category] || messages[ErrorCategory.UNKNOWN]
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON (): Record<string, any> {
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

interface ErrorHandlerOptions {
    maxErrors: number
    showNotifications: boolean
    logToConsole: boolean
    autoRecover: boolean
}

interface ErrorReport {
    error: AppError
    context: Record<string, any>
    timestamp: string
    recovered: boolean
}

/**
 * Main error handler class
 */
export class ErrorHandler {
    private errors: ErrorReport[]
    private options: ErrorHandlerOptions
    private notificationCallback?: (title: string, message: string, type: string) => void

    constructor (options: Partial<ErrorHandlerOptions> = {}) {
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
    setNotificationCallback (
        callback: (title: string, message: string, type: string) => void
    ): void {
        this.notificationCallback = callback
    }

    /**
     * Handle an error
     */
    handle (error: Error | AppError, context: Record<string, any> = {}): boolean {
        const appError = error instanceof AppError ? error : this.wrapError(error)
        const report: ErrorReport = {
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
    private wrapError (error: Error): AppError {
        let category: ErrorCategoryType = ErrorCategory.UNKNOWN
        let severity: ErrorSeverityType = ErrorSeverity.MEDIUM

        // Determine category from error message or type
        if (error.message.includes('localStorage') || error.message.includes('storage')) {
            category = ErrorCategory.STORAGE as ErrorCategoryType
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            category = ErrorCategory.NETWORK as ErrorCategoryType
        } else if (error.message.includes('permission') || error.message.includes('access')) {
            category = ErrorCategory.PERMISSION as ErrorCategoryType
        }

        // Determine severity
        if (error.message.includes('quota') || error.message.includes('full')) {
            severity = ErrorSeverity.HIGH as ErrorSeverityType
        } else if (error.message.includes('syntax') || error.message.includes('parse')) {
            severity = ErrorSeverity.MEDIUM as ErrorSeverityType
        }

        return new AppError(error.message, category, severity, { originalError: error })
    }

    /**
     * Log error to console with appropriate level
     */
    private logToConsole (error: AppError, context: Record<string, any>): void {
        const logLevels: Record<ErrorSeverityType, 'log' | 'warn' | 'error'> = {
            [ErrorSeverity.LOW]: 'log',
            [ErrorSeverity.MEDIUM]: 'warn',
            [ErrorSeverity.HIGH]: 'error',
            [ErrorSeverity.CRITICAL]: 'error'
        }

        const logMethod = logLevels[error.severity] || 'error'
        const logData = {
            error: error.toJSON(),
            context,
            timestamp: new Date().toISOString()
        }

        console[logMethod]('Application Error:', logData)

        // Also log stack trace for debugging
        if (error.stack && error.severity !== ErrorSeverity.LOW) {
            console[logMethod]('Stack trace:', error.stack)
        }
    }

    /**
     * Show user notification
     */
    private showNotification (error: AppError): void {
        if (!this.notificationCallback) return

        const notificationTypes: Record<ErrorSeverityType, string> = {
            [ErrorSeverity.LOW]: 'info',
            [ErrorSeverity.MEDIUM]: 'warning',
            [ErrorSeverity.HIGH]: 'error',
            [ErrorSeverity.CRITICAL]: 'error'
        }

        const type = notificationTypes[error.severity] || 'error'
        this.notificationCallback('Error', error.userMessage, type)
    }

    /**
     * Attempt to recover from error
     */
    private attemptRecovery (error: AppError, context: Record<string, any>): boolean {
        switch (error.category) {
        case ErrorCategory.STORAGE:
            return this.recoverFromStorageError(error, context)
        case ErrorCategory.NETWORK:
            return this.recoverFromNetworkError(error, context)
        default:
            return false
        }
    }

    /**
     * Recover from storage errors
     */
    private recoverFromStorageError (error: AppError, context: Record<string, any>): boolean {
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
    private recoverFromNetworkError (_error: AppError, context: Record<string, any>): boolean {
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
    getErrorHistory (): ErrorReport[] {
        return [...this.errors]
    }

    /**
     * Clear error history
     */
    clearErrorHistory (): void {
        this.errors = []
    }

    /**
     * Get error statistics
     */
    getErrorStats (): Record<string, any> {
        const stats: Record<string, any> = {
            total: this.errors.length,
            recovered: this.errors.filter((e) => e.recovered).length,
            byCategory: {} as Record<ErrorCategoryType, number>,
            bySeverity: {} as Record<ErrorSeverityType, number>
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

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler()

/**
 * Setup global error handling for uncaught errors
 */
export function setupGlobalErrorHandling (): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        const error = new AppError(event.message, ErrorCategory.RUNTIME, ErrorSeverity.HIGH, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        })
        errorHandler.handle(error, { source: 'uncaught' })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))

        const appError = new AppError(error.message, ErrorCategory.RUNTIME, ErrorSeverity.MEDIUM, {
            promise: event.promise
        })
        errorHandler.handle(appError, { source: 'unhandledrejection' })
    })

    console.log('Global error handling setup complete')
}
