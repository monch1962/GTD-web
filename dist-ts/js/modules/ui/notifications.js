'use strict'
/**
 * Notifications module
 * Handles toast notifications and user feedback
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.NotificationManager = void 0
const dom_utils_1 = require('../../dom-utils')
class NotificationManager {
    constructor() {
        this.toasts = []
        this.defaultDuration = 2000
    }
    /**
     * Show a notification toast
     * @param message - Message to display
     * @param type - Notification type (success, error, info, warning)
     * @param duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = null) {
        const toast = this._createToast(message, type)
        document.body.appendChild(toast)
        // Announce to screen readers
        ;(0, dom_utils_1.announce)(message, 'polite')
        // Auto-dismiss after duration
        const dismissDuration = duration || this.defaultDuration
        setTimeout(() => {
            this._dismissToast(toast)
        }, dismissDuration)
    }
    /**
     * Create a toast element
     * @private
     */
    _createToast(message, type) {
        const toast = document.createElement('div')
        toast.className = `toast-notification toast-${type}`
        toast.textContent = message
        // Set styles
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--text-primary);
            color: var(--bg-primary);
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
            text-align: center;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
        `
        // Add to toasts array
        this.toasts.push(toast)
        // Trigger animation
        setTimeout(() => {
            toast.style.opacity = '1'
            toast.style.transform = 'translateX(-50%) translateY(0)'
        }, 10)
        return toast
    }
    /**
     * Dismiss a toast
     * @private
     * @param toast - Toast element to dismiss
     */
    _dismissToast(toast) {
        // Remove from toasts array
        const index = this.toasts.indexOf(toast)
        if (index > -1) {
            this.toasts.splice(index, 1)
        }
        // Animate out
        toast.style.opacity = '0'
        toast.style.transform = 'translateX(-50%) translateY(20px)'
        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast)
            }
        }, 300)
    }
    /**
     * Show success notification
     * @param message - Success message
     * @param duration - Optional duration
     */
    showSuccess(message, duration) {
        this.showNotification(message, 'success', duration || null)
    }
    /**
     * Show error notification
     * @param message - Error message
     * @param duration - Optional duration
     */
    showError(message, duration) {
        this.showNotification(message, 'error', duration || null)
    }
    /**
     * Show info notification
     * @param message - Info message
     * @param duration - Optional duration
     */
    showInfo(message, duration) {
        this.showNotification(message, 'info', duration || null)
    }
    /**
     * Show warning notification
     * @param message - Warning message
     * @param duration - Optional duration
     */
    showWarning(message, duration) {
        this.showNotification(message, 'warning', duration || null)
    }
    /**
     * Dismiss a specific toast
     * @param toast - Toast element to dismiss
     */
    dismissToast(toast) {
        this._dismissToast(toast)
    }
    /**
     * Dismiss all active toasts
     */
    dismissAll() {
        this.toasts.forEach((toast) => {
            this._dismissToast(toast)
        })
    }
    /**
     * Get count of active toasts
     * @returns Number of active toasts
     */
    getActiveCount() {
        return this.toasts.length
    }
}
exports.NotificationManager = NotificationManager
//# sourceMappingURL=notifications.js.map
