/**
 * Notifications module
 * Handles toast notifications and user feedback
 */

import { announce } from '../../dom-utils.js';

export class NotificationManager {
    constructor() {
        this.toasts = [];
        this.defaultDuration = 2000;
    }

    /**
     * Show a notification toast
     * @param {string} message - Message to display
     * @param {string} type - Notification type (success, error, info, warning)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = null) {
        const toast = this._createToast(message, type);
        document.body.appendChild(toast);

        // Announce to screen readers
        announce(message, 'polite');

        // Auto-dismiss after duration
        const dismissDuration = duration || this.defaultDuration;
        setTimeout(() => {
            this._dismissToast(toast);
        }, dismissDuration);
    }

    /**
     * Create a toast element
     * @private
     */
    _createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;

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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideUp 0.3s ease;
            max-width: 90vw;
            text-align: center;
        `;

        // Apply type-specific colors
        switch (type) {
            case 'success':
                toast.style.backgroundColor = 'var(--success-color, #5cb85c)';
                toast.style.color = 'white';
                break;
            case 'error':
                toast.style.backgroundColor = 'var(--danger-color, #d9534f)';
                toast.style.color = 'white';
                break;
            case 'warning':
                toast.style.backgroundColor = 'var(--warning-color, #f0ad4e)';
                toast.style.color = 'white';
                break;
            case 'info':
            default:
                toast.style.backgroundColor = 'var(--info-color, #5bc0de)';
                toast.style.color = 'white';
                break;
        }

        // Add click to dismiss
        toast.addEventListener('click', () => {
            this._dismissToast(toast);
        });

        this.toasts.push(toast);
        return toast;
    }

    /**
     * Dismiss a toast
     * @private
     */
    _dismissToast(toast) {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            toast.remove();
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Show success notification
     */
    success(message, duration) {
        this.showNotification(message, 'success', duration);
    }

    /**
     * Show error notification
     */
    error(message, duration) {
        this.showNotification(message, 'error', duration);
    }

    /**
     * Show warning notification
     */
    warning(message, duration) {
        this.showNotification(message, 'warning', duration);
    }

    /**
     * Show info notification
     */
    info(message, duration) {
        this.showNotification(message, 'info', duration);
    }

    /**
     * Alias for showNotification (for backward compatibility)
     */
    showToast(message, type, duration) {
        this.showNotification(message, type, duration);
    }

    /**
     * Dismiss all active toasts
     */
    dismissAll() {
        this.toasts.forEach(toast => {
            this._dismissToast(toast);
        });
    }

    /**
     * Get count of active toasts
     */
    getActiveCount() {
        return this.toasts.length;
    }
}
