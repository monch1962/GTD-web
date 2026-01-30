/**
 * Dark mode module
 * Handles dark mode theme switching
 */
export declare class DarkModeManager {
    private storageKey;
    constructor();
    /**
     * Initialize dark mode from saved or system preference
     */
    initializeDarkMode(): void;
    /**
     * Setup dark mode event listeners
     */
    setupDarkMode(): void;
    /**
     * Toggle dark mode on/off
     */
    toggleDarkMode(): void;
    /**
     * Set dark mode explicitly
     * @param enabled - Whether dark mode should be enabled
     */
    setDarkMode(enabled: boolean): void;
    /**
     * Update dark mode button icon
     */
    updateDarkModeButton(): void;
    /**
     * Check if dark mode is currently enabled
     * @returns boolean indicating if dark mode is enabled
     */
    isDarkMode(): boolean;
    /**
     * Get current dark mode preference
     * @returns 'true', 'false', or null (auto)
     */
    getPreference(): string | null;
    /**
     * Clear saved preference (revert to auto)
     */
    clearPreference(): void;
}
//# sourceMappingURL=dark-mode.d.ts.map