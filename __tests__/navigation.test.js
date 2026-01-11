/**
 * Comprehensive Tests for Navigation Manager
 */

import { Task, Project } from '../js/models.js'
import { NavigationManager } from '../js/modules/features/navigation.js'

describe('NavigationManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            currentView: 'inbox',
            currentProjectId: null
        }

        mockApp = {
            renderView: jest.fn(),
            updateNavigation: jest.fn()
        }

        manager = new NavigationManager(mockState, mockApp)
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })
})

describe('NavigationManager - getGreeting()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        mockApp = {}
        manager = new NavigationManager(mockState, mockApp)
    })

    test('should return Morning before 12:00', () => {
        // Mock Date to return 11:00
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(11)

        const greeting = manager.getGreeting()

        expect(greeting).toBe('Morning')
    })

    test('should return Afternoon from 12:00 to 16:59', () => {
        // Mock Date to return 14:00 (2 PM)
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14)

        const greeting = manager.getGreeting()

        expect(greeting).toBe('Afternoon')
    })

    test('should return Afternoon at exactly 12:00', () => {
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12)

        const greeting = manager.getGreeting()

        expect(greeting).toBe('Afternoon')
    })

    test('should return Afternoon at 16:59 (4:59 PM)', () => {
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(16)

        const greeting = manager.getGreeting()

        expect(greeting).toBe('Afternoon')
    })

    test('should return Evening at 17:00 (5 PM) or later', () => {
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(17)

        const greeting = manager.getGreeting()

        expect(greeting).toBe('Evening')
    })

    test('should return Evening late at night', () => {
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(23)

        const greeting = manager.getGreeting()

        expect(greeting).toBe('Evening')
    })

    test('should return Morning at midnight (0:00)', () => {
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(0)

        const greeting = manager.getGreeting()

        expect(greeting).toBe('Morning')
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })
})

describe('NavigationManager - getGreetingMessage()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }
        mockApp = {}
        manager = new NavigationManager(mockState, mockApp)

        // Mock getGreeting to return consistent results
        jest.spyOn(manager, 'getGreeting').mockReturnValue('Morning')
    })

    test('should return "All caught up!" when no tasks', () => {
        mockState.tasks = []

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! All caught up!')
    })

    test('should return "All caught up!" when only completed tasks exist', () => {
        const completedTask = new Task({
            id: '1',
            title: 'Completed Task',
            status: 'completed',
            completed: true,
            completedAt: new Date().toISOString()
        })
        mockState.tasks = [completedTask]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! All caught up!')
    })

    test('should show completed tasks count when tasks completed today', () => {
        const today = new Date()
        today.setHours(12, 0, 0, 0) // Noon today

        const completedTask1 = new Task({
            id: '1',
            title: 'Task 1',
            status: 'inbox',
            completed: true,
            completedAt: today.toISOString()
        })
        const completedTask2 = new Task({
            id: '2',
            title: 'Task 2',
            status: 'inbox',
            completed: true,
            completedAt: today.toISOString()
        })
        const activeTask = new Task({
            id: '3',
            title: 'Active Task',
            status: 'inbox',
            completed: false
        })

        mockState.tasks = [completedTask1, completedTask2, activeTask]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! 2 tasks completed today.')
    })

    test('should use singular "task" when only one task completed today', () => {
        const today = new Date()
        today.setHours(12, 0, 0, 0)

        const completedTask = new Task({
            id: '1',
            title: 'Task 1',
            status: 'inbox',
            completed: true,
            completedAt: today.toISOString()
        })
        const activeTask = new Task({
            id: '2',
            title: 'Active Task',
            status: 'inbox',
            completed: false
        })

        mockState.tasks = [completedTask, activeTask]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! 1 task completed today.')
    })

    test('should not count tasks completed yesterday', () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(12, 0, 0, 0)

        const completedTask = new Task({
            id: '1',
            title: 'Old Task',
            status: 'inbox',
            completed: true,
            completedAt: yesterday.toISOString()
        })
        const activeTask = new Task({
            id: '2',
            title: 'Active Task',
            status: 'inbox',
            completed: false
        })

        mockState.tasks = [completedTask, activeTask]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! You have 1 task to do.')
    })

    test('should show pending tasks count when no tasks completed today', () => {
        const task1 = new Task({
            id: '1',
            title: 'Task 1',
            status: 'inbox',
            completed: false
        })
        const task2 = new Task({
            id: '2',
            title: 'Task 2',
            status: 'next',
            completed: false
        })

        mockState.tasks = [task1, task2]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! You have 2 tasks to do.')
    })

    test('should use singular "task" when only one pending task', () => {
        const task = new Task({
            id: '1',
            title: 'Single Task',
            status: 'inbox',
            completed: false
        })

        mockState.tasks = [task]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! You have 1 task to do.')
    })

    test('should prioritize completed tasks message over pending tasks', () => {
        const today = new Date()
        today.setHours(12, 0, 0, 0)

        const completedTask = new Task({
            id: '1',
            title: 'Completed',
            status: 'inbox',
            completed: true,
            completedAt: today.toISOString()
        })
        const pendingTask = new Task({
            id: '2',
            title: 'Pending',
            status: 'inbox',
            completed: false
        })

        mockState.tasks = [completedTask, pendingTask]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! 1 task completed today.')
    })

    test('should handle tasks completed at exactly midnight today', () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Midnight

        const completedTask = new Task({
            id: '1',
            title: 'Completed at midnight',
            status: 'inbox',
            completed: true,
            completedAt: today.toISOString()
        })
        const activeTask = new Task({
            id: '2',
            title: 'Active',
            status: 'inbox',
            completed: false
        })

        mockState.tasks = [completedTask, activeTask]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! 1 task completed today.')
    })

    test('should handle tasks completed just before midnight', () => {
        const today = new Date()
        today.setHours(23, 59, 59, 999) // 11:59:59 PM

        const completedTask = new Task({
            id: '1',
            title: 'Completed',
            status: 'inbox',
            completed: true,
            completedAt: today.toISOString()
        })

        mockState.tasks = [completedTask]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! All caught up!')
    })

    test('should handle tasks with null completedAt', () => {
        const taskWithNullDate = new Task({
            id: '1',
            title: 'Task with null date',
            status: 'inbox',
            completed: true,
            completedAt: null
        })

        mockState.tasks = [taskWithNullDate]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! All caught up!')
    })

    test('should handle mix of completed and pending tasks', () => {
        const today = new Date()
        today.setHours(12, 0, 0, 0)

        const completedTask = new Task({
            id: '1',
            title: 'Completed',
            status: 'inbox',
            completed: true,
            completedAt: today.toISOString()
        })
        const pendingTask1 = new Task({
            id: '2',
            title: 'Pending 1',
            status: 'next',
            completed: false
        })
        const pendingTask2 = new Task({
            id: '3',
            title: 'Pending 2',
            status: 'waiting',
            completed: false
        })

        mockState.tasks = [completedTask, pendingTask1, pendingTask2]

        const message = manager.getGreetingMessage()

        expect(message).toBe('Good Morning! 1 task completed today.')
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })
})

describe('NavigationManager - navigateTo()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            currentView: 'inbox',
            currentProjectId: 'project-1'
        }

        mockApp = {
            renderView: jest.fn(),
            updateNavigation: jest.fn()
        }

        manager = new NavigationManager(mockState, mockApp)
    })

    test('should update currentView', () => {
        manager.navigateTo('next')

        expect(mockState.currentView).toBe('next')
    })

    test('should reset currentProjectId to null', () => {
        expect(mockState.currentProjectId).toBe('project-1')

        manager.navigateTo('waiting')

        expect(mockState.currentProjectId).toBeNull()
    })

    test('should call renderView', () => {
        manager.navigateTo('someday')

        expect(mockApp.renderView).toHaveBeenCalled()
    })

    test('should call updateNavigation', () => {
        manager.navigateTo('projects')

        expect(mockApp.updateNavigation).toHaveBeenCalled()
    })

    test('should handle missing renderView gracefully', () => {
        mockApp.renderView = undefined

        expect(() => manager.navigateTo('inbox')).not.toThrow()
    })

    test('should handle missing updateNavigation gracefully', () => {
        mockApp.updateNavigation = undefined

        expect(() => manager.navigateTo('inbox')).not.toThrow()
    })

    test('should navigate to all valid views', () => {
        const views = ['inbox', 'next', 'waiting', 'someday', 'projects', 'completed', 'all']

        views.forEach((view) => {
            manager.navigateTo(view)
            expect(mockState.currentView).toBe(view)
        })
    })

    test('should handle custom view names', () => {
        manager.navigateTo('custom-view')

        expect(mockState.currentView).toBe('custom-view')
        expect(mockState.currentProjectId).toBeNull()
    })
})

describe('NavigationManager - getProjectTitle()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }

        mockApp = {}

        manager = new NavigationManager(mockState, mockApp)
    })

    test('should return project title for valid project ID', () => {
        const project = new Project({
            id: 'p1',
            title: 'Test Project',
            status: 'active'
        })
        mockState.projects = [project]

        const title = manager.getProjectTitle('p1')

        expect(title).toBe('Test Project')
    })

    test('should return Unknown Project for non-existent project ID', () => {
        mockState.projects = []

        const title = manager.getProjectTitle('non-existent')

        expect(title).toBe('Unknown Project')
    })

    test('should handle multiple projects correctly', () => {
        const project1 = new Project({ id: 'p1', title: 'Project A', status: 'active' })
        const project2 = new Project({ id: 'p2', title: 'Project B', status: 'active' })
        const project3 = new Project({ id: 'p3', title: 'Project C', status: 'someday' })

        mockState.projects = [project1, project2, project3]

        expect(manager.getProjectTitle('p1')).toBe('Project A')
        expect(manager.getProjectTitle('p2')).toBe('Project B')
        expect(manager.getProjectTitle('p3')).toBe('Project C')
    })

    test('should handle empty string project ID', () => {
        mockState.projects = []

        const title = manager.getProjectTitle('')

        expect(title).toBe('Unknown Project')
    })

    test('should handle null project ID', () => {
        mockState.projects = []

        const title = manager.getProjectTitle(null)

        expect(title).toBe('Unknown Project')
    })

    test('should handle undefined project ID', () => {
        mockState.projects = []

        const title = manager.getProjectTitle(undefined)

        expect(title).toBe('Unknown Project')
    })

    test('should return correct title when project with special characters', () => {
        const project = new Project({
            id: 'p1',
            title: 'Project "Special" & More',
            status: 'active'
        })
        mockState.projects = [project]

        const title = manager.getProjectTitle('p1')

        expect(title).toBe('Project "Special" & More')
    })

    test('should find project by ID even with many projects', () => {
        const projects = Array.from(
            { length: 100 },
            (_, i) =>
                new Project({
                    id: `p${i}`,
                    title: `Project ${i}`,
                    status: 'active'
                })
        )

        mockState.projects = projects

        expect(manager.getProjectTitle('p50')).toBe('Project 50')
        expect(manager.getProjectTitle('p99')).toBe('Project 99')
        expect(manager.getProjectTitle('p0')).toBe('Project 0')
    })
})

describe('NavigationManager - Integration Tests', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            currentView: 'inbox'
        }

        mockApp = {
            renderView: jest.fn(),
            updateNavigation: jest.fn()
        }

        manager = new NavigationManager(mockState, mockApp)
    })

    test('should work with full navigation workflow', () => {
        // Create some projects
        const project1 = new Project({ id: 'p1', title: 'Work Project', status: 'active' })
        const project2 = new Project({ id: 'p2', title: 'Personal Project', status: 'active' })
        mockState.projects = [project1, project2]

        // Get project titles
        expect(manager.getProjectTitle('p1')).toBe('Work Project')
        expect(manager.getProjectTitle('p2')).toBe('Personal Project')

        // Navigate to different views
        manager.navigateTo('next')
        expect(mockState.currentView).toBe('next')
        expect(mockApp.renderView).toHaveBeenCalled()

        manager.navigateTo('projects')
        expect(mockState.currentView).toBe('projects')
    })

    test('should handle greeting based on time of day', () => {
        // Test morning greeting
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(8)
        expect(manager.getGreeting()).toBe('Morning')

        // Test afternoon greeting
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14)
        expect(manager.getGreeting()).toBe('Afternoon')

        // Test evening greeting
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(20)
        expect(manager.getGreeting()).toBe('Evening')

        jest.restoreAllMocks()
    })

    test('should provide context-aware greeting messages', () => {
        // Mock time to morning
        jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9)
        jest.spyOn(manager, 'getGreeting').mockReturnValue('Morning')

        // No tasks scenario
        const message1 = manager.getGreetingMessage()
        expect(message1).toBe('Good Morning! All caught up!')

        // Add some pending tasks
        const task1 = new Task({ id: '1', title: 'Task 1', status: 'inbox' })
        const task2 = new Task({ id: '2', title: 'Task 2', status: 'next' })
        mockState.tasks = [task1, task2]

        const message2 = manager.getGreetingMessage()
        expect(message2).toBe('Good Morning! You have 2 tasks to do.')

        // Mark one as completed today
        const today = new Date()
        today.setHours(10, 0, 0, 0)
        task1.completed = true
        task1.completedAt = today.toISOString()

        const message3 = manager.getGreetingMessage()
        expect(message3).toBe('Good Morning! 1 task completed today.')

        jest.restoreAllMocks()
    })
})
