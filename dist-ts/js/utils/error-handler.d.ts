/**
 * Centralized error handling and reporting system
 * Provides consistent error handling, logging, and user notifications
 */
export declare const ErrorSeverity: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
    readonly CRITICAL: "critical";
};
export declare const ErrorCategory: {
    readonly STORAGE: "storage";
    readonly NETWORK: "network";
    readonly VALIDATION: "validation";
    readonly PERMISSION: "permission";
    readonly RUNTIME: "runtime";
    readonly UNKNOWN: "unknown";
};
type ErrorSeverityType = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];
type ErrorCategoryType = (typeof ErrorCategory)[keyof typeof ErrorCategory];
interface ErrorDetails {
    [key: string]: any;
}
/**
 * Custom application error class
 */
export declare class AppError extends Error {
    category: ErrorCategoryType;
    severity: ErrorSeverityType;
    details: ErrorDetails;
    timestamp: string;
    userMessage: string;
    constructor(message: string, category?: ErrorCategoryType, severity?: ErrorSeverityType, details?: ErrorDetails);
    /**
     * Get user-friendly error message
     */
    getUserMessage(): string;
    /**
     * Convert to plain object for serialization
     */
    toJSON(): Record<string, any>;
}
interface ErrorHandlerOptions {
    maxErrors: number;
    showNotifications: boolean;
    logToConsole: boolean;
    autoRecover: boolean;
}
interface ErrorReport {
    error: AppError;
    context: Record<string, any>;
    timestamp: string;
    recovered: boolean;
}
/**
 * Main error handler class
 */
export declare class ErrorHandler {
    private errors;
    private options;
    private notificationCallback?;
    constructor(options?: Partial<ErrorHandlerOptions>);
    /**
     * Set notification callback for showing user notifications
     */
    setNotificationCallback(callback: (title: string, message: string, type: string) => void): void;
    /**
     * Handle an error
     */
    handle(error: Error | AppError, context?: Record<string, any>): boolean;
    /**
     * Wrap a standard Error in AppError
     */
    private wrapError;
    /**
     * Log error to console with appropriate level
     */
    private logToConsole;
    /**
     * Show user notification
     */
    private showNotification;
    /**
     * Attempt to recover from error
     */
    private attemptRecovery;
    /**
     * Recover from storage errors
     */
    private recoverFromStorageError;
    /**
     * Recover from network errors
     */
    private recoverFromNetworkError;
    /**
     * Get error history
     */
    getErrorHistory(): ErrorReport[];
    /**
     * Clear error history
     */
    clearErrorHistory(): void;
    /**
     * Get error statistics
     */
    getErrorStats(): Record<string, any>;
}
/**
 * Global error handler instance
 */
export declare const errorHandler: ErrorHandler;
/**
 * Setup global error handling for uncaught errors
 */
export declare function setupGlobalErrorHandling(): void;
export {};
//# sourceMappingURL=error-handler.d.ts.map