/**
 * Notifications module
 * Handles toast notifications and user feedback
 */
type NotificationType = 'success' | 'error' | 'info' | 'warning';
export declare class NotificationManager {
    private toasts;
    private defaultDuration;
    constructor();
    /**
     * Show a notification toast
     * @param message - Message to display
     * @param type - Notification type (success, error, info, warning)
     * @param duration - Duration in milliseconds
     */
    showNotification(message: string, type?: NotificationType, duration?: number | null): void;
    /**
     * Create a toast element
     * @private
     */
    private _createToast;
    /**
     * Dismiss a toast
     * @private
     * @param toast - Toast element to dismiss
     */
    private _dismissToast;
    /**
     * Show success notification
     * @param message - Success message
     * @param duration - Optional duration
     */
    showSuccess(message: string, duration?: number): void;
    /**
     * Show error notification
     * @param message - Error message
     * @param duration - Optional duration
     */
    showError(message: string, duration?: number): void;
    /**
     * Show info notification
     * @param message - Info message
     * @param duration - Optional duration
     */
    showInfo(message: string, duration?: number): void;
    /**
     * Show warning notification
     * @param message - Warning message
     * @param duration - Optional duration
     */
    showWarning(message: string, duration?: number): void;
    /**
     * Dismiss a specific toast
     * @param toast - Toast element to dismiss
     */
    dismissToast(toast: HTMLElement): void;
    /**
     * Dismiss all active toasts
     */
    dismissAll(): void;
    /**
     * Get count of active toasts
     * @returns Number of active toasts
     */
    getActiveCount(): number;
}
export {};
//# sourceMappingURL=notifications.d.ts.map