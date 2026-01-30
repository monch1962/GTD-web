/**
 * Notifications module
 * Handles toast notifications and user feedback
 */

import { announce } from '../../dom-utils'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

export class NotificationManager {
    private toasts: HTMLElement[]
    private defaultDuration: number

    constructor () {
        this.toasts = []
        this.defaultDuration = 2000
    }

    /**
     * Show a notification toast
     * @param message - Message to display
     * @param type - Notification type (success, error, info, warning)
     * @param duration - Duration in milliseconds
     */
    showNotification (
        message: string,
        type: NotificationType = 'info',
        duration: number | null = null
    ): void {
        const toast = this._createToast(message, type)
        document.body.appendChild(toast)

        // Announce to screen readers
        announce(message, 'polite')

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
    private _createToast (message: string, type: NotificationType): HTMLElement {
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

        // Add click to dismiss
        toast.addEventListener('click', () => {
            this._dismissToast(toast)
        })

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
    private _dismissToast (toast: HTMLElement): void {
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
    showSuccess (message: string, duration?: number): void {
        this.showNotification(message, 'success', duration || null)
    }

    /**
     * Show error notification
     * @param message - Error message
     * @param duration - Optional duration
     */
    showError (message: string, duration?: number): void {
        this.showNotification(message, 'error', duration || null)
    }

    /**
     * Show info notification
     * @param message - Info message
     * @param duration - Optional duration
     */
    showInfo (message: string, duration?: number): void {
        this.showNotification(message, 'info', duration || null)
    }

    /**
     * Show warning notification
     * @param message - Warning message
     * @param duration - Optional duration
     */
    showWarning (message: string, duration?: number): void {
        this.showNotification(message, 'warning', duration || null)
    }

    /**
     * Show toast notification (alias for showNotification)
     */
    showToast (message: string, type: string = 'info', duration?: number): void {
        this.showNotification(message, type as any, duration)
    }

    /**
     * Convenience method for success notifications
     */
    success (message: string, duration?: number): void {
        this.showNotification(message, 'success', duration)
    }

    /**
     * Convenience method for error notifications
     */
    error (message: string, duration?: number): void {
        this.showNotification(message, 'error', duration)
    }

    /**
     * Convenience method for warning notifications
     */
    warning (message: string, duration?: number): void {
        this.showNotification(message, 'warning', duration)
    }

    /**
     * Convenience method for info notifications
     */
    info (message: string, duration?: number): void {
        this.showNotification(message, 'info', duration)
    }

    /**
     * Dismiss a specific toast
     * @param toast - Toast element to dismiss
     */
    dismissToast (toast: HTMLElement): void {
        this._dismissToast(toast)
    }

    /**
     * Dismiss all active toasts
     */
    dismissAll (): void {
        // Create a copy to avoid modification during iteration
        const toastsCopy = [...this.toasts]
        toastsCopy.forEach((toast) => {
            this._dismissToast(toast)
        })
    }

    /**
     * Get count of active toasts
     * @returns Number of active toasts
     */
    getActiveCount (): number {
        return this.toasts.length
    }
}
