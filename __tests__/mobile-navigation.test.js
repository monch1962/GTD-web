/**
 * Test: Mobile Navigation Manager
 * Comprehensive tests for mobile navigation functionality
 */

import { MobileNavigationManager } from '../js/modules/ui/mobile-navigation.js';

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
    toggleTaskComplete: jest.fn(),
    archiveTask: jest.fn(),
    storage: {
        getTasks: jest.fn(() => []),
    },
    renderView: jest.fn(),
    updateCounts: jest.fn(),
};

const mockState = {
    tasks: [],
    projects: [],
};

describe('MobileNavigationManager', () => {
    let manager;
    let mockHamburger;
    let mockSidebar;
    let mockOverlay;
    let mockMobileMenuBtn;
    let mockMobileMenuDropdown;

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
        `;

        // Get references to DOM elements
        mockHamburger = document.getElementById('hamburger-menu');
        mockSidebar = document.querySelector('.sidebar');
        mockOverlay = document.getElementById('sidebar-overlay');
        mockMobileMenuBtn = document.getElementById('btn-mobile-menu');
        mockMobileMenuDropdown = document.getElementById('mobile-menu-dropdown');

        // Create manager instance
        manager = new MobileNavigationManager(mockState, mockApp);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with state and app references', () => {
            expect(manager.state).toBe(mockState);
            expect(manager.app).toBe(mockApp);
        });

        test('should setup mobile navigation when calling setupMobileNavigation', () => {
            const setupSpy = jest.spyOn(manager, 'setupMobileNavigationInternal');
            manager.setupForTest();
            expect(setupSpy).toHaveBeenCalled();
        });
    });

    describe('Hamburger Menu', () => {
        test('should toggle sidebar active class when hamburger is clicked', () => {
            manager.setupForTest();

            // Initially closed
            expect(mockSidebar.classList.contains('active')).toBe(false);
            expect(mockOverlay.classList.contains('active')).toBe(false);
            expect(mockHamburger.classList.contains('active')).toBe(false);
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false');

            // Click to open
            mockHamburger.click();
            expect(mockSidebar.classList.contains('active')).toBe(true);
            expect(mockOverlay.classList.contains('active')).toBe(true);
            expect(mockHamburger.classList.contains('active')).toBe(true);
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('true');

            // Click to close
            mockHamburger.click();
            expect(mockSidebar.classList.contains('active')).toBe(false);
            expect(mockOverlay.classList.contains('active')).toBe(false);
            expect(mockHamburger.classList.contains('active')).toBe(false);
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false');
        });

        test('should close sidebar when overlay is clicked', () => {
            manager.setupForTest();

            // Open sidebar
            mockHamburger.click();
            expect(mockSidebar.classList.contains('active')).toBe(true);

            // Click overlay
            mockOverlay.click();
            expect(mockSidebar.classList.contains('active')).toBe(false);
            expect(mockOverlay.classList.contains('active')).toBe(false);
            expect(mockHamburger.classList.contains('active')).toBe(false);
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false');
        });

        test('should handle missing hamburger button gracefully', () => {
            mockHamburger.remove();
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            manager.setupForTest();

            // Should not throw error
            expect(() => manager.setupForTest()).not.toThrow();

            consoleSpy.mockRestore();
        });

        test('should handle missing sidebar gracefully', () => {
            mockSidebar.remove();
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            manager.setupForTest();

            expect(() => manager.setupForTest()).not.toThrow();

            consoleSpy.mockRestore();
        });

        test('should handle missing overlay gracefully', () => {
            mockOverlay.remove();
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            manager.setupForTest();

            expect(() => manager.setupForTest()).not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe('Mobile Menu Dropdown', () => {
        test('should toggle mobile menu dropdown when button is clicked', () => {
            manager.setupForTest();

            // Initially hidden
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            // Click to open
            mockMobileMenuBtn.click();
            expect(mockMobileMenuDropdown.style.display).toBe('block');
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('true');

            // Click to close
            mockMobileMenuBtn.click();
            expect(mockMobileMenuDropdown.style.display).toBe('none');
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
        });

        test('should close mobile menu when clicking outside', () => {
            manager.setupForTest();

            // Open menu
            mockMobileMenuBtn.click();
            expect(mockMobileMenuDropdown.style.display).toBe('block');

            // Click outside
            document.body.click();
            expect(mockMobileMenuDropdown.style.display).toBe('none');
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
        });

        test('should not close menu when clicking inside menu', () => {
            manager.setupForTest();

            // Open menu
            mockMobileMenuBtn.click();
            expect(mockMobileMenuDropdown.style.display).toBe('block');

            // Click inside menu
            mockMobileMenuDropdown.click();
            expect(mockMobileMenuDropdown.style.display).toBe('block');
        });

        test('should handle calendar-view menu item click', () => {
            manager.setupForTest();
            const showCalendarSpy = jest.spyOn(manager.app, 'showCalendar').mockImplementation();

            mockMobileMenuBtn.click();

            const calendarItem = mockMobileMenuDropdown.querySelector('[data-action="calendar-view"]');
            calendarItem.click();

            expect(showCalendarSpy).toHaveBeenCalled();
            expect(mockMobileMenuDropdown.style.display).toBe('none');
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false');

            showCalendarSpy.mockRestore();
        });

        test('should handle focus-mode menu item click', () => {
            manager.setupForTest();
            const enterFocusModeSpy = jest.spyOn(manager.app, 'enterFocusMode').mockImplementation();

            mockMobileMenuBtn.click();

            const focusItem = mockMobileMenuDropdown.querySelector('[data-action="focus-mode"]');
            focusItem.click();

            expect(enterFocusModeSpy).toHaveBeenCalled();
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            enterFocusModeSpy.mockRestore();
        });

        test('should handle new-project menu item click', () => {
            manager.setupForTest();
            const openProjectModalSpy = jest.spyOn(manager.app, 'openProjectModal').mockImplementation();

            mockMobileMenuBtn.click();

            const newProjectItem = mockMobileMenuDropdown.querySelector('[data-action="new-project"]');
            newProjectItem.click();

            expect(openProjectModalSpy).toHaveBeenCalled();
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            openProjectModalSpy.mockRestore();
        });

        test('should handle daily-review menu item click', () => {
            manager.setupForTest();
            const showDailyReviewSpy = jest.spyOn(manager.app, 'showDailyReview').mockImplementation();

            mockMobileMenuBtn.click();

            const dailyReviewItem = mockMobileMenuDropdown.querySelector('[data-action="daily-review"]');
            dailyReviewItem.click();

            expect(showDailyReviewSpy).toHaveBeenCalled();
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            showDailyReviewSpy.mockRestore();
        });

        test('should handle weekly-review menu item click', () => {
            manager.setupForTest();
            const showWeeklyReviewSpy = jest.spyOn(manager.app, 'showWeeklyReview').mockImplementation();

            mockMobileMenuBtn.click();

            const weeklyReviewItem = mockMobileMenuDropdown.querySelector('[data-action="weekly-review"]');
            weeklyReviewItem.click();

            expect(showWeeklyReviewSpy).toHaveBeenCalled();
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            showWeeklyReviewSpy.mockRestore();
        });

        test('should handle dashboard menu item click', () => {
            manager.setupForTest();
            const showDashboardSpy = jest.spyOn(manager.app, 'showDashboard').mockImplementation();

            mockMobileMenuBtn.click();

            const dashboardItem = mockMobileMenuDropdown.querySelector('[data-action="dashboard"]');
            dashboardItem.click();

            expect(showDashboardSpy).toHaveBeenCalled();
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            showDashboardSpy.mockRestore();
        });

        test('should handle dependencies menu item click', () => {
            manager.setupForTest();
            const showDependenciesSpy = jest.spyOn(manager.app, 'showDependencies').mockImplementation();

            mockMobileMenuBtn.click();

            const dependenciesItem = mockMobileMenuDropdown.querySelector('[data-action="dependencies"]');
            dependenciesItem.click();

            expect(showDependenciesSpy).toHaveBeenCalled();
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            showDependenciesSpy.mockRestore();
        });

        test('should handle heatmap menu item click', () => {
            manager.setupForTest();
            const openHeatmapModalSpy = jest.spyOn(manager.app, 'openHeatmapModal').mockImplementation();

            mockMobileMenuBtn.click();

            const heatmapItem = mockMobileMenuDropdown.querySelector('[data-action="heatmap"]');
            heatmapItem.click();

            expect(openHeatmapModalSpy).toHaveBeenCalled();
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            openHeatmapModalSpy.mockRestore();
        });

        test('should handle suggestions menu item click', () => {
            manager.setupForTest();
            const getSuggestionsSpy = jest.spyOn(manager.app, 'getSuggestions').mockImplementation();

            mockMobileMenuBtn.click();

            const suggestionsItem = mockMobileMenuDropdown.querySelector('[data-action="suggestions"]');
            suggestionsItem.click();

            expect(getSuggestionsSpy).toHaveBeenCalled();
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            getSuggestionsSpy.mockRestore();
        });

        test('should handle missing mobile menu button gracefully', () => {
            mockMobileMenuBtn.remove();
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            manager.setupForTest();

            expect(() => manager.setupForTest()).not.toThrow();

            consoleSpy.mockRestore();
        });

        test('should handle missing mobile menu dropdown gracefully', () => {
            mockMobileMenuDropdown.remove();
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            manager.setupForTest();

            expect(() => manager.setupForTest()).not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe('Bottom Navigation', () => {
        test('should switch view when bottom nav item is clicked', () => {
            manager.setupForTest();

            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]');
            inboxItem.click();

            expect(mockApp.switchView).toHaveBeenCalledWith('inbox');
        });

        test('should update active state on bottom nav items', () => {
            manager.setupForTest();

            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]');
            const nextItem = document.querySelector('.bottom-nav-item[data-view="next"]');

            inboxItem.click();
            expect(inboxItem.classList.contains('active')).toBe(true);
            expect(nextItem.classList.contains('active')).toBe(false);

            nextItem.click();
            expect(inboxItem.classList.contains('active')).toBe(false);
            expect(nextItem.classList.contains('active')).toBe(true);
        });

        test('should close sidebar when bottom nav item is clicked', () => {
            manager.setupForTest();

            // Open sidebar
            mockHamburger.click();
            expect(mockSidebar.classList.contains('active')).toBe(true);

            // Click bottom nav item
            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]');
            inboxItem.click();

            // Sidebar should be closed
            expect(mockSidebar.classList.contains('active')).toBe(false);
            expect(mockOverlay.classList.contains('active')).toBe(false);
            expect(mockHamburger.classList.contains('active')).toBe(false);
        });

        test('should handle touchend events for better mobile responsiveness', () => {
            manager.setupForTest();

            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]');

            // Simulate touchend event
            const touchEvent = new Event('touchend', { bubbles: true });
            inboxItem.dispatchEvent(touchEvent);

            expect(mockApp.switchView).toHaveBeenCalledWith('inbox');
        });

        test('should handle templates mobile button click', () => {
            manager.setupForTest();

            const templatesBtn = document.getElementById('btn-templates-mobile');
            templatesBtn.click();

            expect(mockApp.openTemplatesModal).toHaveBeenCalled();
        });

        test('should handle search mobile button click', () => {
            manager.setupForTest();

            const searchBtn = document.getElementById('btn-search-mobile');
            const searchInput = document.getElementById('global-search');

            searchBtn.click();

            // Search input should be focused
            expect(document.activeElement).toBe(searchInput);
        });

        test('should handle missing search input gracefully', () => {
            document.getElementById('global-search').remove();
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            manager.setupForTest();

            const searchBtn = document.getElementById('btn-search-mobile');
            expect(() => searchBtn.click()).not.toThrow();

            consoleSpy.mockRestore();
        });

        test('should handle no bottom nav items found', () => {
            document.querySelectorAll('.bottom-nav-item[data-view]').forEach(el => el.remove());
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            manager.setupForTest();

            // Should not throw error
            expect(() => manager.setupForTest()).not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe('Missing DOM Elements', () => {
        test('should handle all DOM elements missing gracefully', () => {
            document.body.innerHTML = '';
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            expect(() => manager.setupForTest()).not.toThrow();

            consoleSpy.mockRestore();
        });
    });

    describe('ARIA Attributes', () => {
        test('should correctly update aria-expanded on hamburger menu', () => {
            manager.setupForTest();

            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false');

            mockHamburger.click();
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('true');

            mockHamburger.click();
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false');

            // Test overlay click
            mockHamburger.click();
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('true');

            mockOverlay.click();
            expect(mockHamburger.getAttribute('aria-expanded')).toBe('false');
        });

        test('should correctly update aria-expanded on mobile menu button', () => {
            manager.setupForTest();

            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false');

            mockMobileMenuBtn.click();
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('true');

            mockMobileMenuBtn.click();
            expect(mockMobileMenuBtn.getAttribute('aria-expanded')).toBe('false');
        });
    });

    describe('Integration', () => {
        test('should work with all mobile navigation features together', () => {
            manager.setupForTest();

            // Test hamburger menu
            mockHamburger.click();
            expect(mockSidebar.classList.contains('active')).toBe(true);

            // Test mobile menu dropdown
            mockMobileMenuBtn.click();
            expect(mockMobileMenuDropdown.style.display).toBe('block');

            // Close mobile menu
            document.body.click();
            expect(mockMobileMenuDropdown.style.display).toBe('none');

            // Close sidebar via overlay
            mockOverlay.click();
            expect(mockSidebar.classList.contains('active')).toBe(false);

            // Test bottom nav
            const inboxItem = document.querySelector('.bottom-nav-item[data-view="inbox"]');
            inboxItem.click();
            expect(mockApp.switchView).toHaveBeenCalledWith('inbox');
        });
    });
});
