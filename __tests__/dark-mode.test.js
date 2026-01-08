/**
 * Comprehensive Tests for Dark Mode Feature
 * Tests all Dark Mode functionality before modularization
 */

import { GTDApp } from '../js/app.js';

describe('Dark Mode Feature - Comprehensive Tests', () => {
    let app;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();

        // Reset DOM state
        document.body.classList.remove('dark-mode');

        // Create dark mode button if it doesn't exist
        let darkModeBtn = document.getElementById('btn-dark-mode');
        if (!darkModeBtn) {
            darkModeBtn = document.createElement('button');
            darkModeBtn.id = 'btn-dark-mode';
            document.body.appendChild(darkModeBtn);
        } else {
            darkModeBtn.innerHTML = '';
        }

        // Create new app instance
        app = new GTDApp();
    });

    describe('initializeDarkMode()', () => {
        test('should apply dark mode when saved preference is true', () => {
            localStorage.setItem('gtd_dark_mode', 'true');

            app.initializeDarkMode();

            expect(document.body.classList.contains('dark-mode')).toBe(true);
        });

        test('should not apply dark mode when saved preference is false', () => {
            localStorage.setItem('gtd_dark_mode', 'false');

            app.initializeDarkMode();

            expect(document.body.classList.contains('dark-mode')).toBe(false);
        });

        test('should update button to sun icon when dark mode is enabled', () => {
            localStorage.setItem('gtd_dark_mode', 'true');

            app.initializeDarkMode();

            const darkModeBtn = document.getElementById('btn-dark-mode');
            expect(darkModeBtn.innerHTML).toContain('fa-sun');
        });

        test('should update button to moon icon when dark mode is disabled', () => {
            localStorage.setItem('gtd_dark_mode', 'false');

            app.initializeDarkMode();

            const darkModeBtn = document.getElementById('btn-dark-mode');
            expect(darkModeBtn.innerHTML).toContain('fa-moon');
        });
    });

    describe('setupDarkMode()', () => {
        test('should add click event listener to dark mode button', () => {
            const darkModeBtn = document.getElementById('btn-dark-mode');
            const addEventListenerSpy = jest.spyOn(darkModeBtn, 'addEventListener');

            app.setupDarkMode();

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        test('click listener should toggle dark mode', () => {
            app.setupDarkMode();

            const darkModeBtn = document.getElementById('btn-dark-mode');
            const clickHandler = darkModeBtn.addEventListener.mock.calls[0][1];

            // Start with light mode
            expect(document.body.classList.contains('dark-mode')).toBe(false);

            // Click to enable dark mode
            clickHandler();

            expect(document.body.classList.contains('dark-mode')).toBe(true);
            expect(localStorage.getItem('gtd_dark_mode')).toBe('true');
        });
    });

    describe('toggleDarkMode()', () => {
        test('should toggle dark-mode class on body', () => {
            expect(document.body.classList.contains('dark-mode')).toBe(false);

            app.toggleDarkMode();

            expect(document.body.classList.contains('dark-mode')).toBe(true);
        });

        test('should save preference to localStorage when enabling dark mode', () => {
            app.toggleDarkMode();

            expect(localStorage.getItem('gtd_dark_mode')).toBe('true');
        });

        test('should save preference to localStorage when disabling dark mode', () => {
            // Start with dark mode enabled
            document.body.classList.add('dark-mode');

            app.toggleDarkMode();

            expect(localStorage.getItem('gtd_dark_mode')).toBe('false');
        });

        test('should update button icon after toggling to dark mode', () => {
            app.toggleDarkMode();

            const darkModeBtn = document.getElementById('btn-dark-mode');
            expect(darkModeBtn.innerHTML).toContain('fa-sun');
        });

        test('should update button icon after toggling to light mode', () => {
            // Start with dark mode
            document.body.classList.add('dark-mode');

            app.toggleDarkMode();

            const darkModeBtn = document.getElementById('btn-dark-mode');
            expect(darkModeBtn.innerHTML).toContain('fa-moon');
        });
    });

    describe('updateDarkModeButton()', () => {
        test('should show sun icon when in dark mode', () => {
            document.body.classList.add('dark-mode');

            app.updateDarkModeButton();

            const darkModeBtn = document.getElementById('btn-dark-mode');
            expect(darkModeBtn.innerHTML).toBe('<i class="fas fa-sun"></i>');
        });

        test('should show moon icon when not in dark mode', () => {
            document.body.classList.remove('dark-mode');

            app.updateDarkModeButton();

            const darkModeBtn = document.getElementById('btn-dark-mode');
            expect(darkModeBtn.innerHTML).toBe('<i class="fas fa-moon"></i>');
        });
    });

    describe('Integration: Full Dark Mode Workflow', () => {
        test('should enable dark mode from light mode via button click', () => {
            // Start in light mode
            localStorage.setItem('gtd_dark_mode', 'false');
            app.initializeDarkMode();
            expect(document.body.classList.contains('dark-mode')).toBe(false);

            // Setup and click button
            app.setupDarkMode();
            const darkModeBtn = document.getElementById('btn-dark-mode');
            const clickHandler = darkModeBtn.addEventListener.mock.calls[0][1];

            clickHandler();

            expect(document.body.classList.contains('dark-mode')).toBe(true);
            expect(localStorage.getItem('gtd_dark_mode')).toBe('true');
            expect(darkModeBtn.innerHTML).toContain('fa-sun');
        });

        test('should disable dark mode from dark mode via button click', () => {
            // Start in dark mode
            localStorage.setItem('gtd_dark_mode', 'true');
            app.initializeDarkMode();
            expect(document.body.classList.contains('dark-mode')).toBe(true);

            // Setup and click button
            app.setupDarkMode();
            const darkModeBtn = document.getElementById('btn-dark-mode');
            const clickHandler = darkModeBtn.addEventListener.mock.calls[0][1];

            clickHandler();

            expect(document.body.classList.contains('dark-mode')).toBe(false);
            expect(localStorage.getItem('gtd_dark_mode')).toBe('false');
            expect(darkModeBtn.innerHTML).toContain('fa-moon');
        });

        test('should persist dark mode preference across app instances', () => {
            // First instance - enable dark mode
            const app1 = new GTDApp();
            app1.toggleDarkMode();
            expect(document.body.classList.contains('dark-mode')).toBe(true);

            // Second instance - should load dark mode preference
            document.body.classList.remove('dark-mode'); // Reset body class
            const app2 = new GTDApp();
            app2.initializeDarkMode();
            expect(document.body.classList.contains('dark-mode')).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        test('should handle invalid localStorage value gracefully', () => {
            localStorage.setItem('gtd_dark_mode', 'invalid');

            expect(() => app.initializeDarkMode()).not.toThrow();
        });

        test('should handle multiple rapid toggles correctly', () => {
            expect(document.body.classList.contains('dark-mode')).toBe(false);

            // Toggle 3 times rapidly
            app.toggleDarkMode();
            expect(document.body.classList.contains('dark-mode')).toBe(true);

            app.toggleDarkMode();
            expect(document.body.classList.contains('dark-mode')).toBe(false);

            app.toggleDarkMode();
            expect(document.body.classList.contains('dark-mode')).toBe(true);
        });

        test('should not affect other classes on body element', () => {
            document.body.classList.add('some-other-class');

            app.toggleDarkMode();

            expect(document.body.classList.contains('some-other-class')).toBe(true);
            expect(document.body.classList.contains('dark-mode')).toBe(true);
        });
    });
});
