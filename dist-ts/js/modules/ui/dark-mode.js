'use strict'
/**
 * Dark mode module
 * Handles dark mode theme switching
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.DarkModeManager = void 0
class DarkModeManager {
    constructor() {
        this.storageKey = 'gtd_dark_mode'
        // No initialization needed beyond property assignment
    }
    /**
     * Initialize dark mode from saved or system preference
     */
    initializeDarkMode() {
        // Check for saved preference or system preference
        const savedMode = localStorage.getItem(this.storageKey)
        const systemPrefersDark =
            window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        if (savedMode === 'true' || (!savedMode && systemPrefersDark)) {
            document.body.classList.add('dark-mode')
        }
        // Update button icon
        this.updateDarkModeButton()
    }
    /**
     * Setup dark mode event listeners
     */
    setupDarkMode() {
        const darkModeBtn = document.getElementById('btn-dark-mode')
        if (!darkModeBtn) return
        darkModeBtn.addEventListener('click', () => {
            this.toggleDarkMode()
        })
        // Listen for system theme changes
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
            darkModeQuery.addEventListener('change', () => {
                // Only auto-switch if user hasn't set a preference
                if (!localStorage.getItem(this.storageKey)) {
                    if (darkModeQuery.matches) {
                        document.body.classList.add('dark-mode')
                    } else {
                        document.body.classList.remove('dark-mode')
                    }
                    this.updateDarkModeButton()
                }
            })
        }
    }
    /**
     * Toggle dark mode on/off
     */
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode')
        const isDarkMode = document.body.classList.contains('dark-mode')
        localStorage.setItem(this.storageKey, String(isDarkMode))
        this.updateDarkModeButton()
    }
    /**
     * Set dark mode explicitly
     * @param enabled - Whether dark mode should be enabled
     */
    setDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode')
        } else {
            document.body.classList.remove('dark-mode')
        }
        localStorage.setItem(this.storageKey, String(enabled))
        this.updateDarkModeButton()
    }
    /**
     * Update dark mode button icon
     */
    updateDarkModeButton() {
        const darkModeBtn = document.getElementById('btn-dark-mode')
        if (!darkModeBtn) return
        const isDarkMode = document.body.classList.contains('dark-mode')
        darkModeBtn.innerHTML = isDarkMode
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>'
    }
    /**
     * Check if dark mode is currently enabled
     * @returns boolean indicating if dark mode is enabled
     */
    isDarkMode() {
        return document.body.classList.contains('dark-mode')
    }
    /**
     * Get current dark mode preference
     * @returns 'true', 'false', or null (auto)
     */
    getPreference() {
        return localStorage.getItem(this.storageKey)
    }
    /**
     * Clear saved preference (revert to auto)
     */
    clearPreference() {
        localStorage.removeItem(this.storageKey)
        // Re-initialize with system preference
        this.initializeDarkMode()
    }
}
exports.DarkModeManager = DarkModeManager
//# sourceMappingURL=dark-mode.js.map
