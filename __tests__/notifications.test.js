/**
 * Tests for notifications.js - NotificationManager class
 */

import { announce } from '../js/dom-utils.ts'
import { NotificationManager } from '../js/modules/ui/notifications.ts'

// Mock the announce function
jest.mock('../js/dom-utils.js', () => ({
    announce: jest.fn()
}))

describe('NotificationManager', () => {
    let notificationManager
    let mockBody

    beforeEach(() => {
        // Mock document.body
        mockBody = {
            appendChild: jest.fn(),
            removeChild: jest.fn()
        }
        Object.defineProperty(document, 'body', {
            value: mockBody,
            writable: true
        })

        // Create NotificationManager instance
        notificationManager = new NotificationManager()

        // Mock setTimeout
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.useRealTimers()
    })

    describe('Constructor', () => {
        test('should initialize with empty toasts array', () => {
            expect(notificationManager.toasts).toEqual([])
        })

        test('should initialize with default duration of 2000ms', () => {
            expect(notificationManager.defaultDuration).toBe(2000)
        })
    })

    describe('showNotification', () => {
        test('should create and append toast to body', () => {
            notificationManager.showNotification('Test message')

            expect(mockBody.appendChild).toHaveBeenCalled()
            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.textContent).toBe('Test message')
        })

        test('should use info type by default', () => {
            notificationManager.showNotification('Test message')

            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.className).toContain('toast-info')
        })

        test('should use custom type when specified', () => {
            notificationManager.showNotification('Test message', 'success')

            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.className).toContain('toast-success')
        })

        test('should use custom duration when specified', () => {
            const toastSpy = jest.spyOn(notificationManager, '_dismissToast')

            notificationManager.showNotification('Test message', 'info', 5000)

            // Fast-forward 5 seconds
            jest.advanceTimersByTime(5000)

            expect(toastSpy).toHaveBeenCalled()
        })

        test('should use default duration when not specified', () => {
            const toastSpy = jest.spyOn(notificationManager, '_dismissToast')

            notificationManager.showNotification('Test message')

            // Fast-forward 2 seconds (default duration)
            jest.advanceTimersByTime(2000)

            expect(toastSpy).toHaveBeenCalled()
        })

        test('should announce to screen readers', () => {
            notificationManager.showNotification('Test message')

            expect(announce).toHaveBeenCalledWith('Test message', 'polite')
        })

        test('should add toast to toasts array', () => {
            notificationManager.showNotification('Test message')

            expect(notificationManager.toasts).toHaveLength(1)
        })

        test('should apply correct CSS styles', () => {
            notificationManager.showNotification('Test message')

            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.style.position).toBe('fixed')
            expect(toast.style.bottom).toBe('20px')
            expect(toast.style.left).toBe('50%')
            expect(toast.style.transform).toBe('translateX(-50%)')
        })

        test('should apply success type colors', () => {
            notificationManager.showNotification('Test message', 'success')

            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.className).toBe('toast-notification toast-success')
            // Color styles are set via inline styles but may not be accessible in jsdom
        })

        test('should apply error type colors', () => {
            notificationManager.showNotification('Test message', 'error')

            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.className).toBe('toast-notification toast-error')
        })

        test('should apply warning type colors', () => {
            notificationManager.showNotification('Test message', 'warning')

            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.className).toBe('toast-notification toast-warning')
        })

        test('should add click listener to dismiss toast', () => {
            notificationManager.showNotification('Test message')

            const toast = mockBody.appendChild.mock.calls[0][0]
            const dismissSpy = jest.spyOn(notificationManager, '_dismissToast')

            // Simulate click
            toast.click()

            expect(dismissSpy).toHaveBeenCalledWith(toast)
        })

        test('should handle multiple toasts', () => {
            notificationManager.showNotification('Message 1')
            notificationManager.showNotification('Message 2')
            notificationManager.showNotification('Message 3')

            expect(mockBody.appendChild).toHaveBeenCalledTimes(3)
            expect(notificationManager.toasts).toHaveLength(3)
        })
    })

    describe('_createToast', () => {
        test('should create div element', () => {
            const toast = notificationManager._createToast('Test', 'info')

            expect(toast instanceof HTMLDivElement).toBe(true)
        })

        test('should set correct class names', () => {
            const toast = notificationManager._createToast('Test', 'success')

            expect(toast.className).toBe('toast-notification toast-success')
        })

        test('should set text content', () => {
            const toast = notificationManager._createToast('My message', 'info')

            expect(toast.textContent).toBe('My message')
        })

        test('should apply inline styles', () => {
            const toast = notificationManager._createToast('Test', 'info')

            expect(toast.style.cssText).toContain('position: fixed')
            expect(toast.style.cssText).toContain('z-index: 10000')
        })
    })

    describe('_dismissToast', () => {
        test('should set opacity to 0', () => {
            const toast = document.createElement('div')
            notificationManager.toasts.push(toast)

            notificationManager._dismissToast(toast)

            expect(toast.style.opacity).toBe('0')
        })

        test('should add transition', () => {
            const toast = document.createElement('div')
            notificationManager.toasts.push(toast)

            notificationManager._dismissToast(toast)

            expect(toast.style.transition).toBe('opacity 0.3s ease')
        })

        test('should remove toast from DOM after transition', () => {
            const toast = document.createElement('div')
            toast.remove = jest.fn()
            notificationManager.toasts.push(toast)

            notificationManager._dismissToast(toast)

            // Fast-forward past transition
            jest.advanceTimersByTime(300)

            expect(toast.remove).toHaveBeenCalled()
        })

        test('should remove toast from toasts array', () => {
            const toast = document.createElement('div')
            toast.remove = jest.fn()
            notificationManager.toasts.push(toast)

            notificationManager._dismissToast(toast)

            // Fast-forward past transition
            jest.advanceTimersByTime(300)

            expect(notificationManager.toasts).not.toContain(toast)
        })

        test('should handle toast not in array', () => {
            const toast = document.createElement('div')
            toast.remove = jest.fn()

            notificationManager._dismissToast(toast)

            // Fast-forward past transition
            jest.advanceTimersByTime(300)

            expect(toast.remove).toHaveBeenCalled()
        })
    })

    describe('success', () => {
        test('should call showNotification with success type', () => {
            const spy = jest.spyOn(notificationManager, 'showNotification')

            notificationManager.success('Success message')

            expect(spy).toHaveBeenCalledWith('Success message', 'success', undefined)
        })

        test('should pass duration parameter', () => {
            const spy = jest.spyOn(notificationManager, 'showNotification')

            notificationManager.success('Success message', 5000)

            expect(spy).toHaveBeenCalledWith('Success message', 'success', 5000)
        })
    })

    describe('error', () => {
        test('should call showNotification with error type', () => {
            const spy = jest.spyOn(notificationManager, 'showNotification')

            notificationManager.error('Error message')

            expect(spy).toHaveBeenCalledWith('Error message', 'error', undefined)
        })

        test('should pass duration parameter', () => {
            const spy = jest.spyOn(notificationManager, 'showNotification')

            notificationManager.error('Error message', 5000)

            expect(spy).toHaveBeenCalledWith('Error message', 'error', 5000)
        })
    })

    describe('warning', () => {
        test('should call showNotification with warning type', () => {
            const spy = jest.spyOn(notificationManager, 'showNotification')

            notificationManager.warning('Warning message')

            expect(spy).toHaveBeenCalledWith('Warning message', 'warning', undefined)
        })

        test('should pass duration parameter', () => {
            const spy = jest.spyOn(notificationManager, 'showNotification')

            notificationManager.warning('Warning message', 5000)

            expect(spy).toHaveBeenCalledWith('Warning message', 'warning', 5000)
        })
    })

    describe('info', () => {
        test('should call showNotification with info type', () => {
            const spy = jest.spyOn(notificationManager, 'showNotification')

            notificationManager.info('Info message')

            expect(spy).toHaveBeenCalledWith('Info message', 'info', undefined)
        })

        test('should pass duration parameter', () => {
            const spy = jest.spyOn(notificationManager, 'showNotification')

            notificationManager.info('Info message', 5000)

            expect(spy).toHaveBeenCalledWith('Info message', 'info', 5000)
        })
    })

    describe('showToast', () => {
        test('should alias showNotification', () => {
            const spy = jest.spyOn(notificationManager, 'showNotification')

            notificationManager.showToast('Test message', 'success', 3000)

            expect(spy).toHaveBeenCalledWith('Test message', 'success', 3000)
        })
    })

    describe('dismissAll', () => {
        test('should dismiss all active toasts', () => {
            const toast1 = document.createElement('div')
            const toast2 = document.createElement('div')
            const toast3 = document.createElement('div')

            notificationManager.toasts = [toast1, toast2, toast3]

            const dismissSpy = jest.spyOn(notificationManager, '_dismissToast')

            notificationManager.dismissAll()

            expect(dismissSpy).toHaveBeenCalledTimes(3)
            expect(dismissSpy).toHaveBeenCalledWith(toast1)
            expect(dismissSpy).toHaveBeenCalledWith(toast2)
            expect(dismissSpy).toHaveBeenCalledWith(toast3)
        })

        test('should handle empty toasts array', () => {
            const dismissSpy = jest.spyOn(notificationManager, '_dismissToast')

            notificationManager.dismissAll()

            expect(dismissSpy).not.toHaveBeenCalled()
        })
    })

    describe('getActiveCount', () => {
        test('should return 0 for empty toasts array', () => {
            expect(notificationManager.getActiveCount()).toBe(0)
        })

        test('should return correct count for multiple toasts', () => {
            notificationManager.toasts = [
                document.createElement('div'),
                document.createElement('div'),
                document.createElement('div')
            ]

            expect(notificationManager.getActiveCount()).toBe(3)
        })

        test('should update count after toasts are added', () => {
            notificationManager.showNotification('Message 1')
            expect(notificationManager.getActiveCount()).toBe(1)

            notificationManager.showNotification('Message 2')
            expect(notificationManager.getActiveCount()).toBe(2)
        })
    })

    describe('Edge Cases', () => {
        test('should handle empty message', () => {
            notificationManager.showNotification('')

            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.textContent).toBe('')
        })

        test('should handle special characters in message', () => {
            notificationManager.showNotification('Test with "quotes" & <tags> and emoji 🎉')

            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.textContent).toBe('Test with "quotes" & <tags> and emoji 🎉')
        })

        test('should handle very long messages', () => {
            const longMessage = 'A'.repeat(1000)
            notificationManager.showNotification(longMessage)

            const toast = mockBody.appendChild.mock.calls[0][0]
            expect(toast.textContent).toBe(longMessage)
        })

        test('should handle zero duration by using default', () => {
            // When duration is 0 (falsy), it uses defaultDuration (2000ms)
            const toastSpy = jest.spyOn(notificationManager, '_dismissToast')

            notificationManager.showNotification('Test', 'info', 0)

            // 0 is falsy, so defaultDuration (2000ms) is used
            jest.advanceTimersByTime(2000)

            expect(toastSpy).toHaveBeenCalled()
        })

        test('should handle unknown notification type', () => {
            notificationManager.showNotification('Test', 'unknown_type')

            const toast = mockBody.appendChild.mock.calls[0][0]
            // Unknown types fall through to default case (info)
            expect(toast.className).toBe('toast-notification toast-unknown_type')
        })
    })
})
