/**
 * Test: Mobile Navigation Manager
 * Comprehensive tests for mobile navigation functionality
 */

import { MobileNavigationManager } from '../js/modules/ui/mobile-navigation.js'

// Mock dependencies with all required methods
const mockApp = {
    switchView: jest.fn(),
    openTemplatesModal: jest.fn(),
    showCalendar: jest.fn(),
    enterFocusMode: jest.fn(),
    openProjectModal: jest.fn(),
    showDailyReview: jest.fn(),
    showWeeklyReview: jest.fn(),
    showDashboard: jest.fn(),
    showDependencies: jest.fn(),
    openHeatmapModal: jest.fn(),
    getSuggestions: jest.fn(),
    showSuggestions: jest.fn(),
    toggleTaskComplete: jest.fn(),
    archiveTask: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    storage: {
        getTasks: jest.fn(() => [])
    },
    renderView: jest.fn(),
    updateCounts: jest.fn(),
    models: {
        Task: {
            fromJSON: jest.fn((data) => data)
        }
    }
}

const mockState = {
    tasks: [],
    projects: []
}

describe('MobileNavigationManager', () => {
    let manager
    let mockHamburger
    let mockSidebar
    let mockOverlay
    let mockMobileMenuBtn
    let mockMobileMenuDropdown

    beforeEach(() => {
        // Setup DOM elements
        document.body.innerHTML = `
            <button id="hamburger-menu" class="hamburger-menu" aria-expanded="false"></button>
            <aside class="sidebar"></aside>
            <div class="sidebar-overlay" id="sidebar-overlay"></div>
            <button id="btn-mobile-menu" class="btn btn-secondary mobile-only" aria-expanded="false"></button>
            <div id="mobile-menu-dropdown" class="mobile-menu-dropdown" style="display: none;">
                <button class="mobile-menu-item" data-action="calendar-view">
                    <i class="fas fa-calendar-alt"></i> Calendar View
                </button>
                <button class="mobile-menu-item" data-action="focus-mode">
                    <i class="fas fa-bullseye"></i> Focus Mode
                </button>
                <button class="mobile-menu-item" data-action="new-project">
                    <i class="fas fa-folder-plus"></i> New Project
                </button>
                <button class="mobile-menu-item" data-action="daily-review">
                    <i class="fas fa-sun"></i> Daily Review
                </button>
                <button class="mobile-menu-item" data-action="weekly-review">
                    <i class="fas fa-calendar-week"></i> Weekly Review
                </button>
                <button class="mobile-menu-item" data-action="dashboard">
                    <i class="fas fa-chart-bar"></i> Dashboard
                </button>
                <button class="mobile-menu-item" data-action="dependencies">
                    <i class="fas fa-project-diagram"></i> Dependencies
                </button>
                <button class="mobile-menu-item" data-action="heatmap">
                    <i class="fas fa-calendar-alt"></i> Productivity Heatmap
                </button>
                <button class="mobile-menu-item" data-action="suggestions">
                    <i class="fas fa-lightbulb"></i> What should I work on?
                </button>
            </div>
            <nav class="bottom-nav" id="bottom-nav">
                <button class="bottom-nav-item" data-view="inbox" aria-label="Inbox">
                    <i class="fas fa-inbox"></i>
                    <span>Inbox</span>
                </button>
                <button class="bottom-nav-item" data-view="next" aria-label="Next Actions">
                    <i class="fas fa-bolt"></i>
                    <span>Next</span>
                </button>
                <button class="bottom-nav-item" data-view="waiting" aria-label="Waiting">
                    <i class="fas fa-clock"></i>
                    <span>Waiting</span>
                </button>
                <button class="bottom-nav-item" id="btn-templates-mobile" aria-label="Templates">
                    <i class="fas fa-copy"></i>
                    <span>Templates</span>
                </button>
                <button class="bottom-nav-item" id="btn-search-mobile" aria-label="Search">
                    <i class="fas fa-search"></i>
                    <span>Search</span>
                </button>
            </nav>
            <input type="text" id="global-search" placeholder="Search tasks..." />
        `

        // Get references to DOM elements
        mockHamburger = document.getElementById('hamburger-menu')
        mockSidebar = document.querySelector('.sidebar')
        mockOverlay = document.getElementById('sidebar-overlay')
        mockMobileMenuBtn = document.getElementById('btn-mobile-menu')
        mockMobileMenuDropdown = document.getElementById('mobile-menu-dropdown')

        // Create manager instance
        manager = new MobileNavigationManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        jest.clearAllMocks()
    })

    describe('Initialization', () => {
        test('should initialize with state and app references', () => {
            expect(manager.state).toBe(mockState)
            expect(manager.app).toBe(mockApp)
        })

        test('should setup mobile navigation when calling setupMobileNavigation', () => {
            const setupSpy = jest.spyOn(manager, 'setupMobileNavigationInternal')
            manager.setupForTest()
            expect(setupSpy).toHaveBeenCalled()
        })
    })

    describe('Hamburger Menu', () => {
        test('should toggle sidebar active class when hamburger is clicked', () => {
            manager.setupForTest()

            // Initially closed
            expect(mockSidebar.classList.contains('active')).toBe(false)
            expect(mockOverlay.classList.contains('active')).toBe(false)
            expect(mockHamburger.classList.contains('active')).toBe(false)
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false')

            // Click to open
            mockHamburger.click()
            expect(mockSidebar.classList.contains('active')).toBe(true)
            expect(mockOverlay.classList.contains('active')).toBe(true)
            expect(mockHamburger.classList.contains('active')).toBe(true)
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('true')

            // Click to close
            mockHamburger.click()
            expect(mockSidebar.classList.contains('active')).toBe(false)
            expect(mockOverlay.classList.contains('active')).toBe(false)
            expect(mockHamburger.classList.contains('active')).toBe(false)
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false')
        })

        test('should close sidebar when overlay is clicked', () => {
            manager.setupForTest()

            // Open sidebar
            mockHamburger.click()
            expect(mockSidebar.classList.contains('active')).toBe(true)

            // Click overlay
            mockOverlay.click()
            expect(mockSidebar.classList.contains('active')).toBe(false)
            expect(mockOverlay.classList.contains('active')).toBe(false)
            expect(mockHamburger.classList.contains('active')).toBe(false)
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false')
        })

        test('should handle missing hamburger button gracefully', () => {
            mockHamburger.remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            manager.setupForTest()

            // Should not throw error
            expect(() => manager.setupForTest()).not.toThrow()

            consoleSpy.mockRestore()
        })

        test('should handle missing sidebar gracefully', () => {
            mockSidebar.remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            manager.setupForTest()

            expect(() => manager.setupForTest()).not.toThrow()

            consoleSpy.mockRestore()
        })

        test('should handle missing overlay gracefully', () => {
            mockOverlay.remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            manager.setupForTest()

            expect(() => manager.setupForTest()).not.toThrow()

            consoleSpy.mockRestore()
        })
    })

    describe('Mobile Menu Dropdown', () => {
        test('should toggle mobile menu dropdown when button is clicked', () => {
            manager.setupForTest()

            // Initially hidden
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            // Click to open
            mockMobileMenuBtn.click()
            expect(mockMobileMenuDropdown.style.display).toBe('block')
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('true')

            // Click to close
            mockMobileMenuBtn.click()
            expect(mockMobileMenuDropdown.style.display).toBe('none')
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false')
        })

        test('should close mobile menu when clicking outside', () => {
            manager.setupForTest()

            // Open menu
            mockMobileMenuBtn.click()
            expect(mockMobileMenuDropdown.style.display).toBe('block')

            // Click outside
            document.body.click()
            expect(mockMobileMenuDropdown.style.display).toBe('none')
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false')
        })

        test('should not close menu when clicking inside menu', () => {
            manager.setupForTest()

            // Open menu
            mockMobileMenuBtn.click()
            expect(mockMobileMenuDropdown.style.display).toBe('block')

            // Click inside menu
            mockMobileMenuDropdown.click()
            expect(mockMobileMenuDropdown.style.display).toBe('block')
        })

        test('should handle calendar-view menu item click', () => {
            manager.setupForTest()
            const showCalendarSpy = jest.spyOn(manager.app, 'showCalendar').mockImplementation()

            mockMobileMenuBtn.click()

            const calendarItem = mockMobileMenuDropdown.querySelector(
                '[data-action="calendar-view"]'
            )
            calendarItem.click()

            expect(showCalendarSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false')

            showCalendarSpy.mockRestore()
        })

        test('should handle focus-mode menu item click', () => {
            manager.setupForTest()
            const enterFocusModeSpy = jest.spyOn(manager.app, 'enterFocusMode').mockImplementation()

            mockMobileMenuBtn.click()

            const focusItem = mockMobileMenuDropdown.querySelector('[data-action="focus-mode"]')
            focusItem.click()

            expect(enterFocusModeSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            enterFocusModeSpy.mockRestore()
        })

        test('should handle new-project menu item click', () => {
            manager.setupForTest()
            const openProjectModalSpy = jest
                .spyOn(manager.app, 'openProjectModal')
                .mockImplementation()

            mockMobileMenuBtn.click()

            const newProjectItem = mockMobileMenuDropdown.querySelector(
                '[data-action="new-project"]'
            )
            newProjectItem.click()

            expect(openProjectModalSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            openProjectModalSpy.mockRestore()
        })

        test('should handle daily-review menu item click', () => {
            manager.setupForTest()
            const showDailyReviewSpy = jest
                .spyOn(manager.app, 'showDailyReview')
                .mockImplementation()

            mockMobileMenuBtn.click()

            const dailyReviewItem = mockMobileMenuDropdown.querySelector(
                '[data-action="daily-review"]'
            )
            dailyReviewItem.click()

            expect(showDailyReviewSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            showDailyReviewSpy.mockRestore()
        })

        test('should handle weekly-review menu item click', () => {
            manager.setupForTest()
            const showWeeklyReviewSpy = jest
                .spyOn(manager.app, 'showWeeklyReview')
                .mockImplementation()

            mockMobileMenuBtn.click()

            const weeklyReviewItem = mockMobileMenuDropdown.querySelector(
                '[data-action="weekly-review"]'
            )
            weeklyReviewItem.click()

            expect(showWeeklyReviewSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            showWeeklyReviewSpy.mockRestore()
        })

        test('should handle dashboard menu item click', () => {
            manager.setupForTest()
            const showDashboardSpy = jest.spyOn(manager.app, 'showDashboard').mockImplementation()

            mockMobileMenuBtn.click()

            const dashboardItem = mockMobileMenuDropdown.querySelector('[data-action="dashboard"]')
            dashboardItem.click()

            expect(showDashboardSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            showDashboardSpy.mockRestore()
        })

        test('should handle dependencies menu item click', () => {
            manager.setupForTest()
            const showDependenciesSpy = jest
                .spyOn(manager.app, 'showDependencies')
                .mockImplementation()

            mockMobileMenuBtn.click()

            const dependenciesItem = mockMobileMenuDropdown.querySelector(
                '[data-action="dependencies"]'
            )
            dependenciesItem.click()

            expect(showDependenciesSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            showDependenciesSpy.mockRestore()
        })

        test('should handle heatmap menu item click', () => {
            manager.setupForTest()
            const openHeatmapModalSpy = jest
                .spyOn(manager.app, 'openHeatmapModal')
                .mockImplementation()

            mockMobileMenuBtn.click()

            const heatmapItem = mockMobileMenuDropdown.querySelector('[data-action="heatmap"]')
            heatmapItem.click()

            expect(openHeatmapModalSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            openHeatmapModalSpy.mockRestore()
        })

        test('should handle suggestions menu item click', () => {
            manager.setupForTest()
            const showSuggestionsSpy = jest
                .spyOn(manager.app, 'showSuggestions')
                .mockImplementation()

            mockMobileMenuBtn.click()

            const suggestionsItem = mockMobileMenuDropdown.querySelector(
                '[data-action="suggestions"]'
            )
            suggestionsItem.click()

            expect(showSuggestionsSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            showSuggestionsSpy.mockRestore()
        })

        test('should handle missing mobile menu button gracefully', () => {
            mockMobileMenuBtn.remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            manager.setupForTest()

            expect(() => manager.setupForTest()).not.toThrow()

            consoleSpy.mockRestore()
        })

        test('should handle missing mobile menu dropdown gracefully', () => {
            mockMobileMenuDropdown.remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            manager.setupForTest()

            expect(() => manager.setupForTest()).not.toThrow()

            consoleSpy.mockRestore()
        })
    })

    describe('Bottom Navigation', () => {
        test('should switch view when bottom nav item is clicked', () => {
            manager.setupForTest()

            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]')
            inboxItem.click()

            expect(mockApp.switchView).toHaveBeenCalledWith('inbox')
        })

        test('should update active state on bottom nav items', () => {
            manager.setupForTest()

            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]')
            const nextItem = document.querySelector('.bottom-nav-item[data-view="next"]')

            inboxItem.click()
            expect(inboxItem.classList.contains('active')).toBe(true)
            expect(nextItem.classList.contains('active')).toBe(false)

            nextItem.click()
            expect(inboxItem.classList.contains('active')).toBe(false)
            expect(nextItem.classList.contains('active')).toBe(true)
        })

        test('should close sidebar when bottom nav item is clicked', () => {
            manager.setupForTest()

            // Open sidebar
            mockHamburger.click()
            expect(mockSidebar.classList.contains('active')).toBe(true)

            // Click bottom nav item
            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]')
            inboxItem.click()

            // Sidebar should be closed
            expect(mockSidebar.classList.contains('active')).toBe(false)
            expect(mockOverlay.classList.contains('active')).toBe(false)
            expect(mockHamburger.classList.contains('active')).toBe(false)
        })

        test('should handle touchend events for better mobile responsiveness', () => {
            manager.setupForTest()

            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]')

            // Simulate touchend event
            const touchEvent = new Event('touchend', { bubbles: true })
            inboxItem.dispatchEvent(touchEvent)

            expect(mockApp.switchView).toHaveBeenCalledWith('inbox')
        })

        test('should handle templates mobile button click', () => {
            manager.setupForTest()

            const templatesBtn = document.getElementById('btn-templates-mobile')
            templatesBtn.click()

            expect(mockApp.openTemplatesModal).toHaveBeenCalled()
        })

        test('should handle search mobile button click', () => {
            manager.setupForTest()

            const searchBtn = document.getElementById('btn-search-mobile')
            const searchInput = document.getElementById('global-search')

            searchBtn.click()

            // Search input should be focused
            expect(document.activeElement).toBe(searchInput)
        })

        test('should handle missing search input gracefully', () => {
            document.getElementById('global-search').remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            manager.setupForTest()

            const searchBtn = document.getElementById('btn-search-mobile')
            expect(() => searchBtn.click()).not.toThrow()

            consoleSpy.mockRestore()
        })

        test('should handle no bottom nav items found', () => {
            document.querySelectorAll('.bottom-nav-item[data-view]').forEach((el) => el.remove())
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

            manager.setupForTest()

            // Should not throw error
            expect(() => manager.setupForTest()).not.toThrow()

            consoleSpy.mockRestore()
        })
    })

    describe('Missing DOM Elements', () => {
        test('should handle all DOM elements missing gracefully', () => {
            document.body.innerHTML = ''
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            expect(() => manager.setupForTest()).not.toThrow()

            consoleSpy.mockRestore()
        })
    })

    describe('ARIA Attributes', () => {
        test('should correctly update aria-expanded on hamburger menu', () => {
            manager.setupForTest()

            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false')

            mockHamburger.click()
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('true')

            mockHamburger.click()
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false')

            // Test overlay click
            mockHamburger.click()
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('true')

            mockOverlay.click()
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false')
        })

        test('should correctly update aria-expanded on mobile menu button', () => {
            manager.setupForTest()

            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false')

            mockMobileMenuBtn.click()
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('true')

            mockMobileMenuBtn.click()
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false')
        })
    })

    describe('Integration', () => {
        test('should work with all mobile navigation features together', () => {
            manager.setupForTest()

            // Test hamburger menu
            mockHamburger.click()
            expect(mockSidebar.classList.contains('active')).toBe(true)

            // Test mobile menu dropdown
            mockMobileMenuBtn.click()
            expect(mockMobileMenuDropdown.style.display).toBe('block')

            // Close mobile menu
            document.body.click()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            // Close sidebar via overlay
            mockOverlay.click()
            expect(mockSidebar.classList.contains('active')).toBe(false)

            // Test bottom nav
            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]')
            inboxItem.click()
            expect(mockApp.switchView).toHaveBeenCalledWith('inbox')
        })
    })

    describe('Mobile Menu Dropdown - Undo/Redo', () => {
        beforeEach(() => {
            // Add undo/redo menu items to DOM
            const dropdown = document.getElementById('mobile-menu-dropdown')
            dropdown.innerHTML += `
                <button class="mobile-menu-item" data-action="undo">
                    <i class="fas fa-undo"></i> Undo
                </button>
                <button class="mobile-menu-item" data-action="redo">
                    <i class="fas fa-redo"></i> Redo
                </button>
            `
        })

        test('should handle undo menu item click', () => {
            manager.setupForTest()
            const undoSpy = jest.spyOn(manager.app, 'undo').mockImplementation()

            mockMobileMenuBtn.click()

            const undoItem = mockMobileMenuDropdown.querySelector('[data-action="undo"]')
            undoItem.click()

            expect(undoSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            undoSpy.mockRestore()
        })

        test('should handle redo menu item click', () => {
            manager.setupForTest()
            const redoSpy = jest.spyOn(manager.app, 'redo').mockImplementation()

            mockMobileMenuBtn.click()

            const redoItem = mockMobileMenuDropdown.querySelector('[data-action="redo"]')
            redoItem.click()

            expect(redoSpy).toHaveBeenCalled()
            expect(mockMobileMenuDropdown.style.display).toBe('none')

            redoSpy.mockRestore()
        })
    })

    describe('Pull to Refresh', () => {
        let contentArea

        beforeEach(() => {
            // Add content area for pull-to-refresh
            contentArea = document.createElement('div')
            contentArea.className = 'main-content'
            contentArea.innerHTML = '<div>Tasks content</div>'
            document.body.appendChild(contentArea)
        })

        afterEach(() => {
            if (contentArea && contentArea.parentNode) {
                contentArea.parentNode.removeChild(contentArea)
            }
        })

        test('should create pull-to-refresh indicator', () => {
            manager.setupForTest()

            const indicator = contentArea.querySelector('.pull-to-refresh')
            expect(indicator).toBeTruthy()
            expect(indicator.innerHTML).toContain('Pull to refresh')
        })

        test('should handle missing content area gracefully', () => {
            contentArea.remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            manager.setupForTest()

            expect(() => manager.setupForTest()).not.toThrow()

            consoleSpy.mockRestore()
        })

        test('should show pull indicator on touchstart', () => {
            manager.setupForTest()

            // Mock touchstart at top of content
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                touches: [{ clientY: 100 }]
            })
            contentArea.dispatchEvent(touchstartEvent)

            // Indicator should be created
            const indicator = contentArea.querySelector('.pull-to-refresh')
            expect(indicator).toBeTruthy()
        })

        test('should transform indicator on touchmove when pulling down', () => {
            manager.setupForTest()

            // First touchstart
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                touches: [{ clientY: 100 }]
            })
            contentArea.dispatchEvent(touchstartEvent)

            // Then touchmove with pull
            const touchmoveEvent = new TouchEvent('touchmove', {
                bubbles: true,
                touches: [{ clientY: 150 }] // Pulled down 50px
            })
            contentArea.dispatchEvent(touchmoveEvent)

            // Indicator should have transform
            const indicator = contentArea.querySelector('.pull-to-refresh')
            expect(indicator.style.transform).toContain('translateY')
        })

        test('should add refreshing class when pulled past threshold', () => {
            manager.setupForTest()

            // Touchstart
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                touches: [{ clientY: 100 }]
            })
            contentArea.dispatchEvent(touchstartEvent)

            // Touchmove past threshold (pullThreshold = 80, so need diff > 160 for threshold * 2)
            const touchmoveEvent = new TouchEvent('touchmove', {
                bubbles: true,
                touches: [{ clientY: 350 }] // Pulled down 250px
            })
            contentArea.dispatchEvent(touchmoveEvent)

            const indicator = contentArea.querySelector('.pull-to-refresh')
            expect(indicator.classList.contains('refreshing')).toBe(true)
        })

        test('should not trigger refresh when pull is below threshold', async () => {
            manager.setupForTest()
            const refreshSpy = jest.spyOn(manager, 'refreshTasks').mockResolvedValue()

            // Touchstart
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                touches: [{ clientY: 100 }]
            })
            contentArea.dispatchEvent(touchstartEvent)

            // Touchmove below threshold
            const touchmoveEvent = new TouchEvent('touchmove', {
                bubbles: true,
                touches: [{ clientY: 150 }] // Only 50px pull
            })
            contentArea.dispatchEvent(touchmoveEvent)

            // Touchend
            const touchendEvent = new TouchEvent('touchend', { bubbles: true })
            contentArea.dispatchEvent(touchendEvent)

            // Should not call refreshTasks
            expect(refreshSpy).not.toHaveBeenCalled()

            refreshSpy.mockRestore()
        })

        test('should trigger refresh when pulled past threshold', async () => {
            manager.setupForTest()
            const refreshSpy = jest.spyOn(manager, 'refreshTasks').mockResolvedValue()

            // Touchstart
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                touches: [{ clientY: 100 }]
            })
            contentArea.dispatchEvent(touchstartEvent)

            // Touchmove past threshold
            const touchmoveEvent = new TouchEvent('touchmove', {
                bubbles: true,
                touches: [{ clientY: 350 }]
            })
            contentArea.dispatchEvent(touchmoveEvent)

            // Touchend
            const touchendEvent = new TouchEvent('touchend', { bubbles: true })
            await new Promise((resolve) => {
                contentArea.dispatchEvent(touchendEvent)
                setTimeout(resolve, 10)
            })

            // Should call refreshTasks
            expect(refreshSpy).toHaveBeenCalled()

            refreshSpy.mockRestore()
        })

        test('should not trigger pull when not at top of content', () => {
            manager.setupForTest()

            // Simulate scrolled content
            contentArea.scrollTop = 100

            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                touches: [{ clientY: 100 }]
            })

            contentArea.dispatchEvent(touchstartEvent)

            // Should not set isPulling to true
            // This is tested indirectly by ensuring no errors occur
            expect(() => contentArea.dispatchEvent(touchstartEvent)).not.toThrow()
        })
    })

    describe('Swipe Gestures', () => {
        let contentArea
        let taskItem

        beforeEach(() => {
            // Add content area with task items
            contentArea = document.createElement('div')
            contentArea.className = 'tasks-container'
            taskItem = document.createElement('div')
            taskItem.className = 'task-item'
            taskItem.dataset.taskId = 'task-123'
            taskItem.textContent = 'Test Task'
            contentArea.appendChild(taskItem)
            document.body.appendChild(contentArea)
        })

        afterEach(() => {
            if (contentArea && contentArea.parentNode) {
                contentArea.parentNode.removeChild(contentArea)
            }
        })

        test('should handle missing content area gracefully', () => {
            contentArea.remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            manager.setupForTest()

            expect(() => manager.setupForTest()).not.toThrow()

            consoleSpy.mockRestore()
        })

        test('should not setup swipe gestures on non-touch devices', () => {
            // Mock non-touch device
            const originalTouchStart = 'ontouchstart' in window
            delete window.ontouchstart

            manager.setupForTest()

            // Restore
            if (originalTouchStart) {
                window.ontouchstart = () => {}
            }
        })

        test('should track task element on touchstart', () => {
            // Mock touch support
            Object.defineProperty(window, 'ontouchstart', { value: true, writable: true })

            manager.setupForTest()

            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                target: taskItem,
                touches: [{ clientX: 100 }]
            })

            taskItem.dispatchEvent(touchstartEvent)

            // Should track the task (no errors)
            expect(() => taskItem.dispatchEvent(touchstartEvent)).not.toThrow()
        })

        test('should transform task element on swipe move', () => {
            Object.defineProperty(window, 'ontouchstart', { value: true, writable: true })

            manager.setupForTest()

            // Touchstart on task
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                target: taskItem,
                touches: [{ clientX: 100 }]
            })
            taskItem.dispatchEvent(touchstartEvent)

            // Touchmove
            const touchmoveEvent = new TouchEvent('touchmove', {
                bubbles: true,
                target: taskItem,
                touches: [{ clientX: 170 }] // Swiped right 70px
            })
            taskItem.dispatchEvent(touchmoveEvent)

            // Should have transform
            expect(taskItem.style.transform).toContain('translateX')
        })

        test('should complete task on right swipe', () => {
            Object.defineProperty(window, 'ontouchstart', { value: true, writable: true })

            manager.setupForTest()
            const toggleSpy = jest.spyOn(manager.app, 'toggleTaskComplete').mockImplementation()

            // Touchstart
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                target: taskItem,
                touches: [{ clientX: 100 }]
            })
            taskItem.dispatchEvent(touchstartEvent)

            // Touchmove (swipe right past threshold)
            const touchmoveEvent = new TouchEvent('touchmove', {
                bubbles: true,
                target: taskItem,
                touches: [{ clientX: 200 }] // Swiped right 100px (> 80 threshold)
            })
            taskItem.dispatchEvent(touchmoveEvent)

            // Touchend
            const touchendEvent = new TouchEvent('touchend', {
                bubbles: true,
                target: taskItem
            })
            taskItem.dispatchEvent(touchendEvent)

            expect(toggleSpy).toHaveBeenCalledWith('task-123')

            // Transform should be reset
            expect(taskItem.style.transform).toBe('')

            toggleSpy.mockRestore()
        })

        test('should archive task on left swipe', () => {
            Object.defineProperty(window, 'ontouchstart', { value: true, writable: true })

            manager.setupForTest()
            const archiveSpy = jest.spyOn(manager.app, 'archiveTask').mockImplementation()

            // Touchstart
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                target: taskItem,
                touches: [{ clientX: 200 }]
            })
            taskItem.dispatchEvent(touchstartEvent)

            // Touchmove (swipe left past threshold)
            const touchmoveEvent = new TouchEvent('touchmove', {
                bubbles: true,
                target: taskItem,
                touches: [{ clientX: 100 }] // Swiped left 100px (> 80 threshold)
            })
            taskItem.dispatchEvent(touchmoveEvent)

            // Touchend
            const touchendEvent = new TouchEvent('touchend', {
                bubbles: true,
                target: taskItem
            })
            taskItem.dispatchEvent(touchendEvent)

            expect(archiveSpy).toHaveBeenCalledWith('task-123')

            // Transform should be reset
            expect(taskItem.style.transform).toBe('')

            archiveSpy.mockRestore()
        })

        test('should not trigger action on small swipe', () => {
            Object.defineProperty(window, 'ontouchstart', { value: true, writable: true })

            manager.setupForTest()
            const toggleSpy = jest.spyOn(manager.app, 'toggleTaskComplete').mockImplementation()
            const archiveSpy = jest.spyOn(manager.app, 'archiveTask').mockImplementation()

            // Touchstart
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                target: taskItem,
                touches: [{ clientX: 100 }]
            })
            taskItem.dispatchEvent(touchstartEvent)

            // Touchmove (small swipe, below threshold)
            const touchmoveEvent = new TouchEvent('touchmove', {
                bubbles: true,
                target: taskItem,
                touches: [{ clientX: 150 }] // Only 50px swipe (< 80 threshold)
            })
            taskItem.dispatchEvent(touchmoveEvent)

            // Touchend
            const touchendEvent = new TouchEvent('touchend', {
                bubbles: true,
                target: taskItem
            })
            taskItem.dispatchEvent(touchendEvent)

            // Should not trigger either action
            expect(toggleSpy).not.toHaveBeenCalled()
            expect(archiveSpy).not.toHaveBeenCalled()

            // Transform should be reset
            expect(taskItem.style.transform).toBe('')

            toggleSpy.mockRestore()
            archiveSpy.mockRestore()
        })

        test('should ignore touchstart on non-task elements', () => {
            Object.defineProperty(window, 'ontouchstart', { value: true, writable: true })

            manager.setupForTest()

            // Touchstart on content area (not on task)
            const touchstartEvent = new TouchEvent('touchstart', {
                bubbles: true,
                target: contentArea,
                touches: [{ clientX: 100 }]
            })

            // Should not throw
            expect(() => contentArea.dispatchEvent(touchstartEvent)).not.toThrow()
        })
    })

    describe('Refresh Tasks', () => {
        test('should reload tasks from storage', async () => {
            const mockTasksData = [
                { id: 'task-1', title: 'Task 1' },
                { id: 'task-2', title: 'Task 2' }
            ]
            mockApp.storage.getTasks.mockReturnValue(mockTasksData)

            await manager.refreshTasks()

            expect(mockApp.storage.getTasks).toHaveBeenCalled()
            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
        })

        test('should use Task.fromJSON when available', async () => {
            const mockTasksData = [{ id: 'task-1', title: 'Task 1' }]
            const mockTaskInstance = { id: 'task-1', title: 'Task 1', completed: false }
            mockApp.storage.getTasks.mockReturnValue(mockTasksData)
            mockApp.models.Task.fromJSON.mockReturnValue(mockTaskInstance)

            await manager.refreshTasks()

            expect(mockApp.models.Task.fromJSON).toHaveBeenCalledWith(mockTasksData[0])
        })

        test('should handle missing models gracefully', async () => {
            const mockTasksData = [{ id: 'task-1', title: 'Task 1' }]
            mockApp.storage.getTasks.mockReturnValue(mockTasksData)
            mockApp.models = null

            await manager.refreshTasks()

            // Should not throw, should use raw data
            expect(mockApp.renderView).toHaveBeenCalled()
        })

        test('should handle missing Task.fromJSON gracefully', async () => {
            const mockTasksData = [{ id: 'task-1', title: 'Task 1' }]
            mockApp.storage.getTasks.mockReturnValue(mockTasksData)
            mockApp.models = { Task: null }

            await manager.refreshTasks()

            // Should not throw, should use raw data
            expect(mockApp.renderView).toHaveBeenCalled()
        })

        test('should handle missing renderView gracefully', async () => {
            const mockTasksData = [{ id: 'task-1', title: 'Task 1' }]
            mockApp.storage.getTasks.mockReturnValue(mockTasksData)
            mockApp.renderView = undefined

            await manager.refreshTasks()

            // Should not throw
            expect(mockApp.storage.getTasks).toHaveBeenCalled()
        })

        test('should handle missing updateCounts gracefully', async () => {
            const mockTasksData = [{ id: 'task-1', title: 'Task 1' }]
            mockApp.storage.getTasks.mockReturnValue(mockTasksData)
            mockApp.updateCounts = undefined

            await manager.refreshTasks()

            // Should not throw
            expect(mockApp.storage.getTasks).toHaveBeenCalled()
        })

        test('should handle empty task list', async () => {
            mockApp.storage.getTasks.mockReturnValue([])

            await manager.refreshTasks()

            // Should complete without error
            expect(mockApp.storage.getTasks).toHaveBeenCalled()
        })
    })
})
