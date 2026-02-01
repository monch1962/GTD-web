/**
 * Test: Navigation Integration
 * Ensures all navigation buttons work and delegation methods are properly connected
 */

// Mock all the dependencies
import { GTDApp } from '../js/app.ts'
import { Task, Project } from '../js/models.ts'

jest.mock('../js/dom-utils.ts', () => ({
    escapeHtml: (str: string) => str,
    getElement: (_id: string) => null,
    setTextContent: (el: HTMLElement | null, text: string) => {
        if (el) el.textContent = text
    },
    announce: jest.fn()
}))

// Mock all manager modules
jest.mock('../js/modules/ui/dark-mode.ts', () => ({
    DarkModeManager: jest.fn().mockImplementation(() => ({
        initializeDarkMode: jest.fn(),
        setupDarkMode: jest.fn(),
        toggleDarkMode: jest.fn(),
        updateDarkModeButton: jest.fn()
    }))
}))

jest.mock('../js/modules/features/calendar.ts', () => ({
    CalendarManager: jest.fn().mockImplementation(() => ({
        setupCalendarView: jest.fn(),
        showCalendar: jest.fn(),
        closeCalendar: jest.fn(),
        renderCalendar: jest.fn(),
        navigateCalendar: jest.fn(),
        getTasksForMonth: jest.fn().mockReturnValue([]),
        showTasksForDate: jest.fn()
    }))
}))

jest.mock('../js/modules/features/weekly-review.ts', () => ({
    WeeklyReviewManager: jest.fn().mockImplementation(() => ({
        setupWeeklyReview: jest.fn(),
        showWeeklyReview: jest.fn(),
        closeWeeklyReview: jest.fn(),
        renderWeeklyReview: jest.fn()
    }))
}))

jest.mock('../js/modules/features/dashboard.ts', () => ({
    DashboardManager: jest.fn().mockImplementation(() => ({
        setupDashboard: jest.fn(),
        showDashboard: jest.fn(),
        closeDashboard: jest.fn(),
        renderDashboard: jest.fn()
    }))
}))

jest.mock('../js/modules/features/archive.ts', () => ({
    ArchiveManager: jest.fn().mockImplementation(() => ({
        setupArchive: jest.fn(),
        openArchiveModal: jest.fn(),
        closeArchiveModal: jest.fn(),
        autoArchiveOldTasks: jest.fn(),
        archiveTasks: jest.fn(),
        archiveTask: jest.fn(),
        restoreFromArchive: jest.fn(),
        deleteFromArchive: jest.fn(),
        renderArchive: jest.fn(),
        populateArchiveProjectFilter: jest.fn()
    }))
}))

jest.mock('../js/modules/ui/context-menu.ts', () => ({
    ContextMenuManager: jest.fn().mockImplementation(() => ({
        setupContextMenu: jest.fn(),
        showContextMenu: jest.fn(),
        hideContextMenu: jest.fn(),
        populateContextMenuProjects: jest.fn(),
        handleContextMenuAction: jest.fn()
    }))
}))

jest.mock('../js/modules/features/dependencies', () => ({
    DependenciesManager: jest.fn().mockImplementation(() => ({
        setupDependenciesVisualization: jest.fn(),
        populateDepsProjectFilter: jest.fn(),
        openDependenciesModal: jest.fn(),
        closeDependenciesModal: jest.fn(),
        updateDepsViewButtons: jest.fn()
    }))
}))

jest.mock('../js/modules/features/templates', () => ({
    TemplatesManager: jest.fn().mockImplementation(() => ({
        setupTemplates: jest.fn(),
        openTemplatesModal: jest.fn(),
        closeTemplatesModal: jest.fn(),
        handleTemplateFormSubmit: jest.fn(),
        deleteTemplate: jest.fn(),
        createTaskFromTemplate: jest.fn(),
        renderTemplatesList: jest.fn(),
        addTemplateSubtask: jest.fn(),
        removeTemplateSubtask: jest.fn(),
        getTemplateSubtasks: jest.fn(),
        editTemplate: jest.fn(),
        openTemplateEditModal: jest.fn(),
        closeTemplateEditModal: jest.fn(),
        getCustomContexts: jest.fn()
    }))
}))

jest.mock('../js/modules/ui/mobile-navigation.ts', () => ({
    MobileNavigationManager: jest.fn().mockImplementation(() => ({
        setupMobileNavigation: jest.fn(),
        setupHamburgerMenu: jest.fn(),
        setupMobileMenuDropdown: jest.fn(),
        setupBottomNavigation: jest.fn(),
        setupPullToRefresh: jest.fn(),
        setupSwipeGestures: jest.fn(),
        refreshTasks: jest.fn()
    }))
}))

jest.mock('../js/storage.ts', () => ({
    Storage: jest.fn().mockImplementation(() => ({
        loadState: jest.fn().mockReturnValue({}),
        saveState: jest.fn(),
        getTasks: jest.fn().mockReturnValue([]),
        saveTasks: jest.fn(),
        getProjects: jest.fn().mockReturnValue([]),
        saveProjects: jest.fn(),
        getSettings: jest.fn().mockReturnValue({}),
        saveSettings: jest.fn()
    }))
}))

describe('Navigation Integration Tests', () => {
    let app: GTDApp
    let consoleWarnSpy: jest.SpyInstance
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <button id="btn-dashboard">Dashboard</button>
            <button id="btn-calendar">Calendar</button>
            <button id="btn-weekly-review">Weekly Review</button>
            <button id="btn-daily-review">Daily Review</button>
            <button id="btn-archive">Archive</button>
            <button id="btn-dependencies">Dependencies</button>
            <button id="btn-templates">Templates</button>
            <button id="dark-mode-toggle">Dark Mode</button>
            <div id="modal-container"></div>
            <div id="content-area"></div>
        `

        // Suppress console warnings/errors during tests
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

        // Create app instance
        app = new GTDApp()
    })

    afterEach(() => {
        document.body.innerHTML = ''
        consoleWarnSpy.mockRestore()
        consoleErrorSpy.mockRestore()
    })

    describe('Required Delegation Methods Exist', () => {
        test('should have all dark mode delegation methods', () => {
            expect(typeof app.initializeDarkMode).toBe('function')
            expect(typeof app.setupDarkMode).toBe('function')
            expect(typeof app.toggleDarkMode).toBe('function')
            expect(typeof app.updateDarkModeButton).toBe('function')
        })

        test('should have all calendar delegation methods', () => {
            expect(typeof app.setupCalendarView).toBe('function')
            expect(typeof app.showCalendar).toBe('function')
            expect(typeof app.closeCalendar).toBe('function')
            expect(typeof app.renderCalendar).toBe('function')
            expect(typeof app.navigateCalendar).toBe('function')
            expect(typeof app.getTasksForMonth).toBe('function')
            expect(typeof app.showTasksForDate).toBe('function')
        })

        test('should have all weekly review delegation methods', () => {
            expect(typeof app.setupWeeklyReview).toBe('function')
            expect(typeof app.showWeeklyReview).toBe('function')
            expect(typeof app.closeWeeklyReview).toBe('function')
            expect(typeof app.renderWeeklyReview).toBe('function')
        })

        test('should have all dashboard delegation methods', () => {
            expect(typeof app.setupDashboard).toBe('function')
            expect(typeof app.showDashboard).toBe('function')
            expect(typeof app.closeDashboard).toBe('function')
            expect(typeof app.renderDashboard).toBe('function')
        })

        test('should have all archive delegation methods', () => {
            expect(typeof app.setupArchive).toBe('function')
            expect(typeof app.openArchiveModal).toBe('function')
            expect(typeof app.closeArchiveModal).toBe('function')
            expect(typeof app.autoArchiveOldTasks).toBe('function')
            expect(typeof app.archiveTasks).toBe('function')
            expect(typeof app.archiveTask).toBe('function')
            expect(typeof app.restoreFromArchive).toBe('function')
            expect(typeof app.deleteFromArchive).toBe('function')
            expect(typeof app.renderArchive).toBe('function')
            expect(typeof app.populateArchiveProjectFilter).toBe('function')
        })

        test('should have all context menu delegation methods', () => {
            expect(typeof app.setupContextMenu).toBe('function')
            expect(typeof app.showContextMenu).toBe('function')
            expect(typeof app.hideContextMenu).toBe('function')
            expect(typeof app.populateContextMenuProjects).toBe('function')
            expect(typeof app.handleContextMenuAction).toBe('function')
        })

        test('should have all dependencies delegation methods', () => {
            expect(typeof app.setupDependenciesVisualization).toBe('function')
            expect(typeof app.populateDepsProjectFilter).toBe('function')
            expect(typeof app.openDependenciesModal).toBe('function')
            expect(typeof app.closeDependenciesModal).toBe('function')
        })

        test('should have all templates delegation methods', () => {
            expect(typeof app.setupTemplates).toBe('function')
            expect(typeof app.openTemplatesModal).toBe('function')
            expect(typeof app.closeTemplatesModal).toBe('function')
            expect(typeof app.handleTemplateFormSubmit).toBe('function')
            expect(typeof app.deleteTemplate).toBe('function')
            expect(typeof app.createTaskFromTemplate).toBe('function')
            expect(typeof app.renderTemplatesList).toBe('function')
            expect(typeof app.addTemplateSubtask).toBe('function')
            expect(typeof app.removeTemplateSubtask).toBe('function')
            expect(typeof app.getTemplateSubtasks).toBe('function')
            expect(typeof app.editTemplate).toBe('function')
            expect(typeof app.openTemplateEditModal).toBe('function')
            expect(typeof app.closeTemplateEditModal).toBe('function')
        })

        test('should have all mobile navigation delegation methods', () => {
            expect(typeof app.setupMobileNavigation).toBe('function')
        })

        test('should have all daily review methods', () => {
            expect(typeof app.setupDailyReview).toBe('function')
            expect(typeof app.showDailyReview).toBe('function')
            expect(typeof app.closeDailyReview).toBe('function')
            expect(typeof app.renderDailyReview).toBe('function')
            expect(typeof app.renderDailyReviewTask).toBe('function')
        })

        test('should have all time tracking methods', () => {
            expect(typeof app.setupTimeTracking).toBe('function')
            expect(typeof app.startTaskTimer).toBe('function')
            expect(typeof app.stopTaskTimer).toBe('function')
        })

        test('should have all helper methods', () => {
            expect(typeof app.getGreeting).toBe('function')
            expect(typeof app.getGreetingMessage).toBe('function')
            expect(typeof app.navigateTo).toBe('function')
            expect(typeof app.getProjectTitle).toBe('function')
        })
    })

    describe('Delegation Methods Call Manager Methods', () => {
        test('dark mode methods should delegate to darkMode manager', () => {
            app.initializeDarkMode()
            app.setupDarkMode()
            app.toggleDarkMode()
            app.updateDarkModeButton()

            expect(app.darkMode.initializeDarkMode).toHaveBeenCalled()
            expect(app.darkMode.setupDarkMode).toHaveBeenCalled()
            expect(app.darkMode.toggleDarkMode).toHaveBeenCalled()
            expect(app.darkMode.updateDarkModeButton).toHaveBeenCalled()
        })

        test('calendar methods should delegate to calendar manager', () => {
            app.setupCalendarView()
            app.showCalendar()
            app.closeCalendar()
            app.renderCalendar()
            app.navigateCalendar('next')
            app.getTasksForMonth(2026, 0)
            app.showTasksForDate(2026, 0, 9)

            expect(app.calendar.setupCalendarView).toHaveBeenCalled()
            expect(app.calendar.showCalendar).toHaveBeenCalled()
            expect(app.calendar.closeCalendar).toHaveBeenCalled()
            expect(app.calendar.renderCalendar).toHaveBeenCalled()
            expect(app.calendar.navigateCalendar).toHaveBeenCalledWith('next')
            expect(app.calendar.getTasksForMonth).toHaveBeenCalledWith(2026, 0)
            expect(app.calendar.showTasksForDate).toHaveBeenCalledWith(2026, 0, 9)
        })

        test('weekly review methods should delegate to weeklyReview manager', () => {
            app.setupWeeklyReview()
            app.showWeeklyReview()
            app.closeWeeklyReview()
            app.renderWeeklyReview()

            expect(app.weeklyReview.setupWeeklyReview).toHaveBeenCalled()
            expect(app.weeklyReview.showWeeklyReview).toHaveBeenCalled()
            expect(app.weeklyReview.closeWeeklyReview).toHaveBeenCalled()
            expect(app.weeklyReview.renderWeeklyReview).toHaveBeenCalled()
        })

        test('dashboard methods should delegate to dashboard manager', () => {
            app.setupDashboard()
            app.showDashboard()
            app.closeDashboard()
            app.renderDashboard()

            expect(app.dashboard.setupDashboard).toHaveBeenCalled()
            expect(app.dashboard.showDashboard).toHaveBeenCalled()
            expect(app.dashboard.closeDashboard).toHaveBeenCalled()
            expect(app.dashboard.renderDashboard).toHaveBeenCalled()
        })

        test('archive methods should delegate to archive manager', () => {
            app.setupArchive()
            app.openArchiveModal()
            app.closeArchiveModal()
            app.renderArchive()

            expect(app.archive.setupArchive).toHaveBeenCalled()
            expect(app.archive.openArchiveModal).toHaveBeenCalled()
            expect(app.archive.closeArchiveModal).toHaveBeenCalled()
            expect(app.archive.renderArchive).toHaveBeenCalled()
        })

        test('context menu methods should delegate to contextMenu manager', () => {
            const mockEvent = { clientX: 100, clientY: 100, preventDefault: jest.fn() }

            app.setupContextMenu()
            app.showContextMenu(mockEvent, 'task-1')
            app.hideContextMenu()

            expect(app.contextMenu.setupContextMenu).toHaveBeenCalled()
            expect(app.contextMenu.showContextMenu).toHaveBeenCalledWith(mockEvent, 'task-1')
            expect(app.contextMenu.hideContextMenu).toHaveBeenCalled()
        })

        test('dependencies methods should delegate to dependencies manager', () => {
            app.setupDependenciesVisualization()
            app.populateDepsProjectFilter()
            app.openDependenciesModal()
            app.closeDependenciesModal()

            expect(app.dependencies.setupDependenciesVisualization).toHaveBeenCalled()
            expect(app.dependencies.populateDepsProjectFilter).toHaveBeenCalled()
            expect(app.dependencies.openDependenciesModal).toHaveBeenCalled()
            expect(app.dependencies.closeDependenciesModal).toHaveBeenCalled()
        })

        test('templates methods should delegate to templatesManager manager', () => {
            app.setupTemplates()
            app.openTemplatesModal()
            app.closeTemplatesModal()
            app.renderTemplatesList()

            expect(app.templatesManager.setupTemplates).toHaveBeenCalled()
            expect(app.templatesManager.openTemplatesModal).toHaveBeenCalled()
            expect(app.templatesManager.closeTemplatesModal).toHaveBeenCalled()
            expect(app.templatesManager.renderTemplatesList).toHaveBeenCalled()
        })

        test('mobile navigation should delegate to mobileNavigation manager', () => {
            app.setupMobileNavigation()

            expect(app.mobileNavigation.setupMobileNavigation).toHaveBeenCalled()
        })
    })

    describe('Helper Methods Work Correctly', () => {
        test('getGreeting should return correct greeting based on time', () => {
            const mockGetHours = jest
                .spyOn(Date.prototype, 'getHours')
                .mockReturnValueOnce(8) // Morning
                .mockReturnValueOnce(14) // Afternoon
                .mockReturnValueOnce(19) // Evening

            expect(app.getGreeting()).toBe('Morning')
            expect(app.getGreeting()).toBe('Afternoon')
            expect(app.getGreeting()).toBe('Evening')

            mockGetHours.mockRestore()
        })

        test('getGreetingMessage should return personalized message', () => {
            const mockGetHours = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9) // Morning

            // Mock tasks with no completed tasks
            app.tasks = [
                new Task({ id: '1', title: 'Task 1', completed: false }),
                new Task({ id: '2', title: 'Task 2', completed: false })
            ]

            const message = app.getGreetingMessage()
            expect(message).toContain('Morning')
            expect(message).toContain('2 tasks')

            mockGetHours.mockRestore()
        })

        test('getProjectTitle should return project title or Unknown', () => {
            app.projects = [
                new Project({ id: 'p1', title: 'Project 1' }),
                new Project({ id: 'p2', title: 'Project 2' })
            ]

            expect(app.getProjectTitle('p1')).toBe('Project 1')
            expect(app.getProjectTitle('p2')).toBe('Project 2')
            expect(app.getProjectTitle('unknown')).toBe('Unknown Project')
        })

        test('navigateTo should update current view and re-render', () => {
            app.renderView = jest.fn()
            ;(app as any).updateNavigation = jest.fn()

            app.navigateTo('inbox')

            expect(app.currentView).toBe('inbox')
            expect(app.currentProjectId).toBeNull()
            expect(app.renderView).toHaveBeenCalled()
            expect((app as any).updateNavigation).toHaveBeenCalled()
        })
    })

    describe('Critical Integration Test - All Navigation Buttons Work', () => {
        test('should be able to call all navigation methods without errors', () => {
            // Mock renderView and updateNavigation to avoid DOM issues
            app.renderView = jest.fn()
            ;(app as any).updateNavigation = jest.fn()

            // This is a smoke test to ensure all navigation methods exist and can be called
            expect(() => {
                // Dark mode
                app.initializeDarkMode()
                app.toggleDarkMode()

                // Calendar
                app.showCalendar()
                app.closeCalendar()

                // Weekly review
                app.showWeeklyReview()
                app.closeWeeklyReview()

                // Dashboard
                app.showDashboard()
                app.closeDashboard()

                // Archive
                app.openArchiveModal()
                app.closeArchiveModal()

                // Dependencies
                app.openDependenciesModal()
                app.closeDependenciesModal()

                // Templates
                app.openTemplatesModal()
                app.closeTemplatesModal()

                // Daily review
                app.showDailyReview()
                app.closeDailyReview()

                // Navigation
                app.navigateTo('inbox')
                app.navigateTo('next-actions')
            }).not.toThrow()
        })

        test('setupEventListeners should complete without errors', () => {
            expect(() => {
                app.setupEventListeners()
            }).not.toThrow()
        })
    })

    describe('Method Names Match Expected Conventions', () => {
        test('all delegation methods should follow naming pattern', () => {
            // Dark mode
            expect(app.initializeDarkMode).toBeDefined()
            expect(app.setupDarkMode).toBeDefined()
            expect(app.toggleDarkMode).toBeDefined()

            // Calendar
            expect(app.setupCalendarView).toBeDefined()
            expect(app.showCalendar).toBeDefined()
            expect(app.closeCalendar).toBeDefined()
            expect(app.renderCalendar).toBeDefined()

            // Weekly review
            expect(app.setupWeeklyReview).toBeDefined()
            expect(app.showWeeklyReview).toBeDefined()
            expect(app.closeWeeklyReview).toBeDefined()
            expect(app.renderWeeklyReview).toBeDefined()

            // Dashboard
            expect(app.setupDashboard).toBeDefined()
            expect(app.showDashboard).toBeDefined()
            expect(app.closeDashboard).toBeDefined()
            expect(app.renderDashboard).toBeDefined()

            // Archive
            expect(app.setupArchive).toBeDefined()
            expect(app.openArchiveModal).toBeDefined()
            expect(app.closeArchiveModal).toBeDefined()
            expect(app.renderArchive).toBeDefined()

            // Context menu
            expect(app.setupContextMenu).toBeDefined()
            expect(app.showContextMenu).toBeDefined()
            expect(app.hideContextMenu).toBeDefined()

            // Dependencies
            expect(app.setupDependenciesVisualization).toBeDefined()
            expect(app.openDependenciesModal).toBeDefined()
            expect(app.closeDependenciesModal).toBeDefined()

            // Templates
            expect(app.setupTemplates).toBeDefined()
            expect(app.openTemplatesModal).toBeDefined()
            expect(app.closeTemplatesModal).toBeDefined()
            expect(app.renderTemplatesList).toBeDefined()

            // Mobile navigation
            expect(app.setupMobileNavigation).toBeDefined()

            // Daily review
            expect(app.setupDailyReview).toBeDefined()
            expect(app.showDailyReview).toBeDefined()
            expect(app.closeDailyReview).toBeDefined()
            expect(app.renderDailyReview).toBeDefined()

            // Time tracking
            expect(app.setupTimeTracking).toBeDefined()
            expect(app.startTaskTimer).toBeDefined()
            expect(app.stopTaskTimer).toBeDefined()
        })
    })
})
