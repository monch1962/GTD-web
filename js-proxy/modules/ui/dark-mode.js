/**
 * Mock DarkModeManager for tests
 */
export class DarkModeManager {
    constructor() {
        this.initializeDarkMode = jest.fn()
        this.setupDarkMode = jest.fn()
        this.toggleDarkMode = jest.fn()
        this.updateDarkModeButton = jest.fn()
        this.isDarkMode = jest.fn(() => false)
    }
}
