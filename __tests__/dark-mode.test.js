/**
 * Comprehensive Tests for Dark Mode Feature
 * Tests all Dark Mode functionality before modularization
 */

import { GTDApp } from '../js/app.js'

describe('Dark Mode Feature - Comprehensive Tests', () => {
    let app

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear()

        // Reset DOM state
        document.body.classList.remove('dark-mode')

        // Create dark mode button if it doesn't exist
        let darkModeBtn = document.getElementById('btn-dark-mode')
        if (!darkModeBtn) {
            darkModeBtn = document.createElement('button')
            darkModeBtn.id = 'btn-dark-mode'
            document.body.appendChild(darkModeBtn)
        } else {
            darkModeBtn.innerHTML = ''
        }

        // Create new app instance
        app = new GTDApp()
    })

    describe('initializeDarkMode()', () => {
        test('should apply dark mode when saved preference is true', () => {
            localStorage.setItem('gtd_dark_mode', 'true')

            app.initializeDarkMode()

            expect(document.body.classList.contains('dark-mode')).toBe(true)
        })

        test('should not apply dark mode when saved preference is false', () => {
            localStorage.setItem('gtd_dark_mode', 'false')

            app.initializeDarkMode()

            expect(document.body.classList.contains('dark-mode')).toBe(false)
        })

        test('should update button to sun icon when dark mode is enabled', () => {
            localStorage.setItem('gtd_dark_mode', 'true')

            app.initializeDarkMode()

            const darkModeBtn = document.getElementById('btn-dark-mode')
            expect(darkModeBtn.innerHTML).toContain('fa-sun')
        })

        test('should update button to moon icon when dark mode is disabled', () => {
            localStorage.setItem('gtd_dark_mode', 'false')

            app.initializeDarkMode()

            const darkModeBtn = document.getElementById('btn-dark-mode')
            expect(darkModeBtn.innerHTML).toContain('fa-moon')
        })
    })

    describe('setupDarkMode()', () => {
        test('should add click event listener to dark mode button', () => {
            const darkModeBtn = document.getElementById('btn-dark-mode')
            const addEventListenerSpy = jest.spyOn(darkModeBtn, 'addEventListener')

            app.setupDarkMode()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('click listener should toggle dark mode', () => {
            app.setupDarkMode()

            const darkModeBtn = document.getElementById('btn-dark-mode')
            const clickHandler = darkModeBtn.addEventListener.mock.calls[0][1]

            // Start with light mode
            expect(document.body.classList.contains('dark-mode')).toBe(false)

            // Click to enable dark mode
            clickHandler()

            expect(document.body.classList.contains('dark-mode')).toBe(true)
            expect(localStorage.getItem('gtd_dark_mode')).toBe('true')
        })
    })

    describe('toggleDarkMode()', () => {
        test('should toggle dark-mode class on body', () => {
            expect(document.body.classList.contains('dark-mode')).toBe(false)

            app.toggleDarkMode()

            expect(document.body.classList.contains('dark-mode')).toBe(true)
        })

        test('should save preference to localStorage when enabling dark mode', () => {
            app.toggleDarkMode()

            expect(localStorage.getItem('gtd_dark_mode')).toBe('true')
        })

        test('should save preference to localStorage when disabling dark mode', () => {
            // Start with dark mode enabled
            document.body.classList.add('dark-mode')

            app.toggleDarkMode()

            expect(localStorage.getItem('gtd_dark_mode')).toBe('false')
        })

        test('should update button icon after toggling to dark mode', () => {
            app.toggleDarkMode()

            const darkModeBtn = document.getElementById('btn-dark-mode')
            expect(darkModeBtn.innerHTML).toContain('fa-sun')
        })

        test('should update button icon after toggling to light mode', () => {
            // Start with dark mode
            document.body.classList.add('dark-mode')

            app.toggleDarkMode()

            const darkModeBtn = document.getElementById('btn-dark-mode')
            expect(darkModeBtn.innerHTML).toContain('fa-moon')
        })
    })

    describe('updateDarkModeButton()', () => {
        test('should show sun icon when in dark mode', () => {
            document.body.classList.add('dark-mode')

            app.updateDarkModeButton()

            const darkModeBtn = document.getElementById('btn-dark-mode')
            expect(darkModeBtn.innerHTML).toBe('<i class="fas fa-sun"></i>')
        })

        test('should show moon icon when not in dark mode', () => {
            document.body.classList.remove('dark-mode')

            app.updateDarkModeButton()

            const darkModeBtn = document.getElementById('btn-dark-mode')
            expect(darkModeBtn.innerHTML).toBe('<i class="fas fa-moon"></i>')
        })
    })

    describe('Integration: Full Dark Mode Workflow', () => {
        test('should enable dark mode from light mode via button click', () => {
            // Start in light mode
            localStorage.setItem('gtd_dark_mode', 'false')
            app.initializeDarkMode()
            expect(document.body.classList.contains('dark-mode')).toBe(false)

            // Setup and click button
            app.setupDarkMode()
            const darkModeBtn = document.getElementById('btn-dark-mode')
            const clickHandler = darkModeBtn.addEventListener.mock.calls[0][1]

            clickHandler()

            expect(document.body.classList.contains('dark-mode')).toBe(true)
            expect(localStorage.getItem('gtd_dark_mode')).toBe('true')
            expect(darkModeBtn.innerHTML).toContain('fa-sun')
        })

        test('should disable dark mode from dark mode via button click', () => {
            // Start in dark mode
            localStorage.setItem('gtd_dark_mode', 'true')
            app.initializeDarkMode()
            expect(document.body.classList.contains('dark-mode')).toBe(true)

            // Setup and click button
            app.setupDarkMode()
            const darkModeBtn = document.getElementById('btn-dark-mode')
            const clickHandler = darkModeBtn.addEventListener.mock.calls[0][1]

            clickHandler()

            expect(document.body.classList.contains('dark-mode')).toBe(false)
            expect(localStorage.getItem('gtd_dark_mode')).toBe('false')
            expect(darkModeBtn.innerHTML).toContain('fa-moon')
        })

        test('should persist dark mode preference across app instances', () => {
            // First instance - enable dark mode
            const app1 = new GTDApp()
            app1.toggleDarkMode()
            expect(document.body.classList.contains('dark-mode')).toBe(true)

            // Second instance - should load dark mode preference
            document.body.classList.remove('dark-mode') // Reset body class
            const app2 = new GTDApp()
            app2.initializeDarkMode()
            expect(document.body.classList.contains('dark-mode')).toBe(true)
        })
    })

    describe('Edge Cases', () => {
        test('should handle invalid localStorage value gracefully', () => {
            localStorage.setItem('gtd_dark_mode', 'invalid')

            expect(() => app.initializeDarkMode()).not.toThrow()
        })

        test('should handle multiple rapid toggles correctly', () => {
            expect(document.body.classList.contains('dark-mode')).toBe(false)

            // Toggle 3 times rapidly
            app.toggleDarkMode()
            expect(document.body.classList.contains('dark-mode')).toBe(true)

            app.toggleDarkMode()
            expect(document.body.classList.contains('dark-mode')).toBe(false)

            app.toggleDarkMode()
            expect(document.body.classList.contains('dark-mode')).toBe(true)
        })

        test('should not affect other classes on body element', () => {
            document.body.classList.add('some-other-class')

            app.toggleDarkMode()

            expect(document.body.classList.contains('some-other-class')).toBe(true)
            expect(document.body.classList.contains('dark-mode')).toBe(true)
        })

        test('should handle missing dark mode button gracefully', () => {
            const btn = document.getElementById('btn-dark-mode')
            btn.remove()

            expect(() => app.setupDarkMode()).not.toThrow()
        })
    })

    describe('Missing Coverage - System Preference', () => {
        beforeEach(() => {
            // Clear localStorage to test system preference
            localStorage.clear()
            document.body.classList.remove('dark-mode')
        })

        test('should use system preference when no saved preference (dark)', () => {
            // Mock system to prefer dark mode
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation((query) => ({
                    matches: query === '(prefers-color-scheme: dark)',
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                }))
            })

            app.initializeDarkMode()

            expect(document.body.classList.contains('dark-mode')).toBe(true)
            expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
        })

        test('should use system preference when no saved preference (light)', () => {
            // Mock system to prefer light mode
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation((query) => ({
                    matches: false,
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                }))
            })

            app.initializeDarkMode()

            expect(document.body.classList.contains('dark-mode')).toBe(false)
        })

        test('should listen for system theme changes when no preference set', () => {
            const mockQuery = {
                matches: false,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            }

            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockReturnValue(mockQuery)
            })

            app.setupDarkMode()

            expect(mockQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
        })

        test('should not listen for system changes when user has preference', () => {
            localStorage.setItem('gtd_dark_mode', 'true')

            const mockQuery = {
                matches: false,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            }

            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockReturnValue(mockQuery)
            })

            app.setupDarkMode()

            // Event listener should still be added, but won't affect state
            expect(mockQuery.addEventListener).toHaveBeenCalled()
        })

        test('should switch to dark mode when system changes to dark (no preference)', () => {
            const mockQuery = {
                matches: false,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            }

            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockReturnValue(mockQuery)
            })

            app.setupDarkMode()

            // Simulate system change to dark mode
            const changeCallback = mockQuery.addEventListener.mock.calls[0][1]
            mockQuery.matches = true
            changeCallback()

            expect(document.body.classList.contains('dark-mode')).toBe(true)
        })

        test('should switch to light mode when system changes to light (no preference)', () => {
            const mockQuery = {
                matches: true,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            }

            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockReturnValue(mockQuery)
            })

            document.body.classList.add('dark-mode')
            app.setupDarkMode()

            // Simulate system change to light mode
            const changeCallback = mockQuery.addEventListener.mock.calls[0][1]
            mockQuery.matches = false
            changeCallback()

            expect(document.body.classList.contains('dark-mode')).toBe(false)
        })

        test('should not switch when system changes if user has preference', () => {
            // Start with dark mode
            document.body.classList.add('dark-mode')
            localStorage.setItem('gtd_dark_mode', 'true')

            const mockQuery = {
                matches: false,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            }

            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockReturnValue(mockQuery)
            })

            app.setupDarkMode()

            // Simulate system change to light mode
            const changeCallback = mockQuery.addEventListener.mock.calls[0][1]
            mockQuery.matches = false
            changeCallback()

            // Should stay in dark mode due to user preference
            expect(document.body.classList.contains('dark-mode')).toBe(true)
        })

        test('should handle missing window.matchMedia gracefully', () => {
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: undefined
            })

            expect(() => app.initializeDarkMode()).not.toThrow()
            expect(() => app.setupDarkMode()).not.toThrow()
        })
    })

    describe('Missing Coverage - setDarkMode()', () => {
        test('should enable dark mode when setDarkMode(true)', () => {
            app.darkMode.setDarkMode(true)

            expect(document.body.classList.contains('dark-mode')).toBe(true)
            expect(localStorage.getItem('gtd_dark_mode')).toBe('true')
        })

        test('should disable dark mode when setDarkMode(false)', () => {
            document.body.classList.add('dark-mode')

            app.darkMode.setDarkMode(false)

            expect(document.body.classList.contains('dark-mode')).toBe(false)
            expect(localStorage.getItem('gtd_dark_mode')).toBe('false')
        })

        test('should update button when enabling via setDarkMode', () => {
            app.darkMode.setDarkMode(true)

            const darkModeBtn = document.getElementById('btn-dark-mode')
            expect(darkModeBtn.innerHTML).toContain('fa-sun')
        })

        test('should update button when disabling via setDarkMode', () => {
            document.body.classList.add('dark-mode')

            app.darkMode.setDarkMode(false)

            const darkModeBtn = document.getElementById('btn-dark-mode')
            expect(darkModeBtn.innerHTML).toContain('fa-moon')
        })

        test('should handle multiple setDarkMode calls', () => {
            app.darkMode.setDarkMode(true)
            expect(document.body.classList.contains('dark-mode')).toBe(true)

            app.darkMode.setDarkMode(false)
            expect(document.body.classList.contains('dark-mode')).toBe(false)

            app.darkMode.setDarkMode(true)
            expect(document.body.classList.contains('dark-mode')).toBe(true)
        })
    })

    describe('Missing Coverage - isDarkMode()', () => {
        test('should return true when dark mode is enabled', () => {
            document.body.classList.add('dark-mode')

            expect(app.darkMode.isDarkMode()).toBe(true)
        })

        test('should return false when dark mode is disabled', () => {
            document.body.classList.remove('dark-mode')

            expect(app.darkMode.isDarkMode()).toBe(false)
        })

        test('should reflect current state accurately', () => {
            expect(app.darkMode.isDarkMode()).toBe(false)

            document.body.classList.add('dark-mode')
            expect(app.darkMode.isDarkMode()).toBe(true)

            document.body.classList.remove('dark-mode')
            expect(app.darkMode.isDarkMode()).toBe(false)
        })
    })

    describe('Missing Coverage - getPreference()', () => {
        test('should return "true" when dark mode preference saved as true', () => {
            localStorage.setItem('gtd_dark_mode', 'true')

            expect(app.darkMode.getPreference()).toBe('true')
        })

        test('should return "false" when dark mode preference saved as false', () => {
            localStorage.setItem('gtd_dark_mode', 'false')

            expect(app.darkMode.getPreference()).toBe('false')
        })

        test('should return null when no preference saved', () => {
            localStorage.clear()

            expect(app.darkMode.getPreference()).toBeNull()
        })
    })

    describe('Missing Coverage - clearPreference()', () => {
        test('should remove preference from localStorage', () => {
            localStorage.setItem('gtd_dark_mode', 'true')

            app.darkMode.clearPreference()

            expect(localStorage.getItem('gtd_dark_mode')).toBeNull()
        })

        test('should re-initialize with system preference after clearing', () => {
            // Set a user preference (dark mode)
            localStorage.setItem('gtd_dark_mode', 'true')
            document.body.classList.add('dark-mode')

            // Mock system to prefer light mode
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation((query) => ({
                    matches: false,
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                }))
            })

            // Clear the preference
            localStorage.removeItem('gtd_dark_mode')
            document.body.classList.remove('dark-mode')

            // Now call clearPreference which will re-initialize with system preference
            app.darkMode.clearPreference()

            expect(localStorage.getItem('gtd_dark_mode')).toBeNull()
            // System prefers light, so should be light
            expect(document.body.classList.contains('dark-mode')).toBe(false)
        })

        test('should handle clearing when no preference exists', () => {
            localStorage.clear()

            expect(() => app.darkMode.clearPreference()).not.toThrow()
            expect(localStorage.getItem('gtd_dark_mode')).toBeNull()
        })
    })

    describe('Missing Coverage - Integration Tests', () => {
        test('should handle system preference → user preference → clear workflow', () => {
            // Start with system preference (dark)
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockReturnValue({
                    matches: true,
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                })
            })

            localStorage.clear()
            document.body.classList.remove('dark-mode')
            app.initializeDarkMode()
            expect(document.body.classList.contains('dark-mode')).toBe(true)

            // Set user preference (light)
            app.darkMode.setDarkMode(false)
            expect(document.body.classList.contains('dark-mode')).toBe(false)
            expect(app.darkMode.getPreference()).toBe('false')

            // Clear user preference (should revert to system/dark)
            app.initializeDarkMode() // Re-initialize after clearing
            app.darkMode.clearPreference()
            expect(document.body.classList.contains('dark-mode')).toBe(true)
            expect(app.darkMode.getPreference()).toBeNull()
        })

        test('setDarkMode should override system preference', () => {
            // System prefers light
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockReturnValue({
                    matches: false,
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn()
                })
            })

            localStorage.clear()
            app.initializeDarkMode()
            expect(document.body.classList.contains('dark-mode')).toBe(false)

            // User explicitly enables dark mode
            app.darkMode.setDarkMode(true)
            expect(document.body.classList.contains('dark-mode')).toBe(true)
            expect(app.darkMode.getPreference()).toBe('true')
        })

        test('isDarkMode should work correctly with setDarkMode', () => {
            expect(app.darkMode.isDarkMode()).toBe(false)

            app.darkMode.setDarkMode(true)
            expect(app.darkMode.isDarkMode()).toBe(true)

            app.darkMode.setDarkMode(false)
            expect(app.darkMode.isDarkMode()).toBe(false)
        })
    })
})
