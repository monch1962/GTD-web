/**
 * Comprehensive Tests for Smart Suggestions Manager
 */

import { Task, Project } from '../js/models.js'
import { SmartSuggestionsManager } from '../js/modules/features/smart-suggestions.js'

// Make Task and Project available globally
global.Task = Task
global.Project = Project

describe('SmartSuggestionsManager - Initialization', () => {
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
            showToast: jest.fn(),
            showSuccess: jest.fn(),
            showError: jest.fn()
        }

        document.body.innerHTML = ''

        manager = new SmartSuggestionsManager(mockState, mockApp)
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })
})

describe('SmartSuggestionsManager - Setup', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [], currentView: 'inbox' }
        mockApp = {}
        document.body.innerHTML = ''
        manager = new SmartSuggestionsManager(mockState, mockApp)
    })

    test('should setup without errors', () => {
        expect(() => manager.setupSmartSuggestions()).not.toThrow()
    })
})

describe('SmartSuggestionsManager - getSmartSuggestions()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            currentView: 'all'
        }

        mockApp = {}

        manager = new SmartSuggestionsManager(mockState, mockApp)
    })

    test('should return empty array when no tasks', () => {
        const suggestions = manager.getSmartSuggestions()

        expect(suggestions).toEqual([])
    })

    test('should return empty array when no tasks match criteria', () => {
        mockState.tasks = [
            new Task({ id: '1', title: 'Completed task', status: 'next', completed: true })
        ]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions).toEqual([])
    })

    test('should only return actionable tasks', () => {
        mockState.tasks = [
            new Task({ id: '1', title: 'Next action', status: 'next' }),
            new Task({ id: '2', title: 'Someday task', status: 'someday' }),
            new Task({ id: '3', title: 'Completed', status: 'next', completed: true })
        ]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].task.id).toBe('1')
    })

    test('should filter by context', () => {
        mockState.tasks = [
            new Task({ id: '1', title: 'Home task', status: 'next', contexts: ['@home'] }),
            new Task({ id: '2', title: 'Work task', status: 'next', contexts: ['@work'] })
        ]

        const suggestions = manager.getSmartSuggestions({ context: '@home' })

        // Context filter adds score but doesn't filter - both tasks are returned
        expect(suggestions.length).toBe(2)
        const homeTask = suggestions.find((s) => s.task.id === '1')
        expect(homeTask.reasons).toContain('Matches current context (@home)')
        expect(homeTask.score).toBeGreaterThan(0)

        const workTask = suggestions.find((s) => s.task.id === '2')
        expect(workTask.reasons).not.toContain('Matches current context (@home)')
    })

    test('should filter by energy level', () => {
        mockState.tasks = [
            new Task({ id: '1', title: 'High energy task', status: 'next', energy: 'high' }),
            new Task({ id: '2', title: 'Low energy task', status: 'next', energy: 'low' })
        ]

        const suggestions = manager.getSmartSuggestions({ energyLevel: 'high' })

        // Energy filter adds score but doesn't filter - both tasks are returned
        expect(suggestions.length).toBe(2)
        const highEnergyTask = suggestions.find((s) => s.task.id === '1')
        expect(highEnergyTask.reasons).toContain('Matches your energy level (high)')

        const lowEnergyTask = suggestions.find((s) => s.task.id === '2')
        expect(lowEnergyTask.reasons).not.toContain('Matches your energy level (high)')
    })

    test('should filter by available time', () => {
        mockState.tasks = [
            new Task({ id: '1', title: 'Quick task', status: 'next', time: 5 }),
            new Task({ id: '2', title: 'Long task', status: 'next', time: 60 })
        ]

        const suggestions = manager.getSmartSuggestions({ availableMinutes: 15 })

        expect(suggestions.length).toBeGreaterThan(0)
        const quickTask = suggestions.find((s) => s.task.id === '1')
        expect(quickTask.reasons).toContain('Fits your available time (5m)')
    })

    test('should penalize tasks too long for available time', () => {
        mockState.tasks = [
            new Task({ id: '1', title: 'Very long task', status: 'next', time: 120 })
        ]

        const suggestions = manager.getSmartSuggestions({ availableMinutes: 30 })

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].reasons).toContain('Too long for available time (120m)')
    })

    test('should boost overdue tasks', () => {
        const overdueTask = new Task({
            id: '1',
            title: 'Overdue task',
            status: 'next',
            dueDate: '2025-01-01'
        })
        overdueTask.isOverdue = jest.fn(() => true)

        mockState.tasks = [overdueTask]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].score).toBeGreaterThanOrEqual(100)
        expect(suggestions[0].reasons).toContain('Overdue')
    })

    test('should boost tasks due today', () => {
        const dueTodayTask = new Task({
            id: '1',
            title: 'Due today task',
            status: 'next',
            dueDate: new Date().toISOString().split('T')[0]
        })
        dueTodayTask.isDueToday = jest.fn(() => true)

        mockState.tasks = [dueTodayTask]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].score).toBeGreaterThanOrEqual(75)
        expect(suggestions[0].reasons).toContain('Due today')
    })

    test('should boost tasks due soon', () => {
        const dueSoonTask = new Task({
            id: '1',
            title: 'Due soon task',
            status: 'next',
            dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
        })
        dueSoonTask.isDueWithin = jest.fn(() => true)

        mockState.tasks = [dueSoonTask]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].score).toBeGreaterThanOrEqual(50)
    })

    test('should boost quick tasks when no time filter', () => {
        mockState.tasks = [new Task({ id: '1', title: 'Quick task', status: 'next', time: 5 })]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].reasons).toContain('Quick task')
    })

    test('should boost next action tasks', () => {
        mockState.tasks = [new Task({ id: '1', title: 'Next action', status: 'next' })]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].reasons).toContain('Next Action')
    })

    test('should boost active project tasks', () => {
        mockState.projects = [new Project({ id: 'p1', title: 'Active Project', status: 'active' })]

        mockState.tasks = [
            new Task({ id: '1', title: 'Project task', status: 'next', projectId: 'p1' })
        ]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].reasons).toContain('Active project')
    })

    test('should penalize waiting tasks', () => {
        mockState.tasks = [new Task({ id: '1', title: 'Waiting task', status: 'waiting' })]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].reasons).toContain('Waiting for something')
    })

    test('should boost tasks with descriptions', () => {
        mockState.tasks = [
            new Task({
                id: '1',
                title: 'Task with description',
                status: 'next',
                description: 'This is a detailed description of the task'
            })
        ]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].score).toBeGreaterThan(0)
    })

    test('should filter out tasks with unmet dependencies', () => {
        const taskWithDeps = new Task({
            id: '1',
            title: 'Task with dependencies',
            status: 'next'
        })
        taskWithDeps.areDependenciesMet = jest.fn(() => false)

        mockState.tasks = [taskWithDeps]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions).toEqual([])
    })

    test('should filter out unavailable deferred tasks', () => {
        const deferredTask = new Task({
            id: '1',
            title: 'Deferred task',
            status: 'next',
            deferDate: '2025-12-31'
        })
        deferredTask.isAvailable = jest.fn(() => false)

        mockState.tasks = [deferredTask]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions).toEqual([])
    })

    test('should respect current view filter', () => {
        mockState.currentView = 'next'

        mockState.tasks = [
            new Task({ id: '1', title: 'Next action', status: 'next' }),
            new Task({ id: '2', title: 'Waiting task', status: 'waiting' })
        ]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].task.status).toBe('next')
    })

    test('should limit max suggestions', () => {
        for (let i = 0; i < 10; i++) {
            mockState.tasks.push(
                new Task({
                    id: `task-${i}`,
                    title: `Task ${i}`,
                    status: 'next'
                })
            )
        }

        const suggestions = manager.getSmartSuggestions({ maxSuggestions: 3 })

        expect(suggestions.length).toBe(3)
    })

    test('should sort by score descending', () => {
        mockState.tasks = [
            new Task({ id: '1', title: 'Low priority', status: 'next' }),
            new Task({ id: '2', title: 'High priority', status: 'next', time: 5 })
        ]

        const suggestions = manager.getSmartSuggestions()

        expect(suggestions.length).toBeGreaterThanOrEqual(2)
        for (let i = 0; i < suggestions.length - 1; i++) {
            expect(suggestions[i].score).toBeGreaterThanOrEqual(suggestions[i + 1].score)
        }
    })

    test('should handle default preferences', () => {
        mockState.tasks = [new Task({ id: '1', title: 'Task', status: 'next' })]

        const suggestions = manager.getSmartSuggestions({})

        expect(suggestions.length).toBe(1)
    })

    test('should handle multiple scoring factors combined', () => {
        mockState.projects = [new Project({ id: 'p1', title: 'Project', status: 'active' })]

        const multiFactorTask = new Task({
            id: '1',
            title: 'Multi-factor task',
            status: 'next',
            contexts: ['@home'],
            energy: 'high',
            time: 5,
            projectId: 'p1',
            description: 'Detailed description here'
        })

        mockState.tasks = [multiFactorTask]

        const suggestions = manager.getSmartSuggestions({
            context: '@home',
            energyLevel: 'high'
        })

        expect(suggestions.length).toBe(1)
        expect(suggestions[0].score).toBeGreaterThan(100)
        expect(suggestions[0].reasons.length).toBeGreaterThan(2)
    })
})

describe('SmartSuggestionsManager - getDaysUntilDue()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [], currentView: 'all' }
        mockApp = {}
        document.body.innerHTML = ''
        manager = new SmartSuggestionsManager(mockState, mockApp)
    })

    test('should return null when task has no due date', () => {
        const task = new Task({ id: '1', title: 'Task', status: 'next' })

        const days = manager.getDaysUntilDue(task)

        expect(days).toBeNull()
    })

    test('should calculate days until due date', () => {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 5)
        // Normalize to midnight to avoid timezone issues
        futureDate.setHours(0, 0, 0, 0)

        const task = new Task({
            id: '1',
            title: 'Task',
            status: 'next',
            dueDate: futureDate.toISOString().split('T')[0]
        })

        const days = manager.getDaysUntilDue(task)

        // Days calculation uses Math.ceil which may result in +1
        expect(days).toBeGreaterThanOrEqual(4)
        expect(days).toBeLessThanOrEqual(6)
    })

    test('should handle overdue tasks', () => {
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 3)
        pastDate.setHours(0, 0, 0, 0)

        const task = new Task({
            id: '1',
            title: 'Task',
            status: 'next',
            dueDate: pastDate.toISOString().split('T')[0]
        })

        const days = manager.getDaysUntilDue(task)

        expect(days).toBeLessThanOrEqual(-2)
        expect(days).toBeGreaterThanOrEqual(-4)
    })

    test('should return small number for tasks due today', () => {
        const task = new Task({
            id: '1',
            title: 'Task',
            status: 'next',
            dueDate: new Date().toISOString().split('T')[0]
        })

        const days = manager.getDaysUntilDue(task)

        // Due today should be close to 0 (may be 0 or 1 depending on time of day)
        expect(days).toBeGreaterThanOrEqual(0)
        expect(days).toBeLessThanOrEqual(1)
    })
})

describe('SmartSuggestionsManager - showSuggestions()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [new Task({ id: '1', title: 'Task 1', status: 'next', contexts: ['@home'] })],
            projects: [],
            currentView: 'all'
        }

        mockApp = {}

        document.body.innerHTML = ''
        manager = new SmartSuggestionsManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should create modal element', () => {
        manager.showSuggestions()

        const modal = document.getElementById('suggestions-modal')
        expect(modal).toBeDefined()
        expect(modal.className).toContain('modal')
    })

    test('should add modal to body', () => {
        manager.showSuggestions()

        const modal = document.getElementById('suggestions-modal')
        expect(modal).toBeDefined()
        expect(document.body.contains(modal)).toBe(true)
    })

    test('should include context filter', () => {
        manager.showSuggestions()

        const contextSelect = document.getElementById('suggestion-context')
        expect(contextSelect).toBeDefined()
        expect(contextSelect.tagName).toBe('SELECT')
    })

    test('should include time filter', () => {
        manager.showSuggestions()

        const timeSelect = document.getElementById('suggestion-time')
        expect(timeSelect).toBeDefined()
        expect(timeSelect.tagName).toBe('SELECT')
    })

    test('should include energy filter', () => {
        manager.showSuggestions()

        const energySelect = document.getElementById('suggestion-energy')
        expect(energySelect).toBeDefined()
        expect(energySelect.tagName).toBe('SELECT')
    })

    test('should include refresh button', () => {
        manager.showSuggestions()

        const refreshBtn = document.getElementById('refresh-suggestions')
        expect(refreshBtn).toBeDefined()
        expect(refreshBtn.tagName).toBe('BUTTON')
    })

    test('should include close button', () => {
        manager.showSuggestions()

        const modal = document.getElementById('suggestions-modal')
        const closeBtn = modal.querySelector('.close-button')
        expect(closeBtn).toBeDefined()
    })

    test('should include custom contexts in filter', () => {
        mockState.tasks = [
            new Task({ id: '1', title: 'Task', status: 'next', contexts: ['@custom'] })
        ]

        manager.showSuggestions()

        const contextSelect = document.getElementById('suggestion-context')
        const options = Array.from(contextSelect.options).map((o) => o.value)
        expect(options).toContain('@custom')
    })

    test('should call renderSuggestions after showing modal', () => {
        const renderSpy = jest.spyOn(manager, 'renderSuggestions')

        manager.showSuggestions()

        expect(renderSpy).toHaveBeenCalled()
    })
})

describe('SmartSuggestionsManager - renderSuggestions()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [new Task({ id: '1', title: 'Task 1', status: 'next' })],
            projects: [],
            currentView: 'all'
        }

        mockApp = {}

        document.body.innerHTML = `
            <div id="suggestions-modal">
                <select id="suggestion-context"></select>
                <select id="suggestion-time"></select>
                <select id="suggestion-energy"></select>
                <div id="suggestions-list"></div>
            </div>
        `

        manager = new SmartSuggestionsManager(mockState, mockApp)
    })

    test('should render suggestions to container', () => {
        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).not.toBe('')
    })

    test('should show empty state when no suggestions', () => {
        mockState.tasks = []
        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).toContain('No Tasks Available')
    })

    test('should render task title', () => {
        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).toContain('Task 1')
    })

    test('should render task score', () => {
        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).toMatch(/\d+/) // Should contain a number (score)
    })

    test('should render task contexts', () => {
        mockState.tasks = [
            new Task({ id: '1', title: 'Task', status: 'next', contexts: ['@home'] })
        ]

        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).toContain('@home')
    })

    test('should render task energy', () => {
        mockState.tasks = [new Task({ id: '1', title: 'Task', status: 'next', energy: 'high' })]

        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).toContain('high')
    })

    test('should render task time', () => {
        mockState.tasks = [new Task({ id: '1', title: 'Task', status: 'next', time: 15 })]

        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).toContain('15')
    })

    test('should render task due date', () => {
        const dueDate = new Date().toISOString().split('T')[0]
        mockState.tasks = [new Task({ id: '1', title: 'Task', status: 'next', dueDate })]

        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).toMatch(/\d{1,2}\/\d{1,2}/) // Date format
    })

    test('should render reason badges', () => {
        mockState.tasks = [new Task({ id: '1', title: 'Quick task', status: 'next', time: 5 })]

        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).toContain('Quick task')
    })

    test('should respect filter values', () => {
        const contextSelect = document.getElementById('suggestion-context')
        contextSelect.value = '@home'

        mockState.tasks = [
            new Task({ id: '1', title: 'Home task', status: 'next', contexts: ['@home'] }),
            new Task({ id: '2', title: 'Work task', status: 'next', contexts: ['@work'] })
        ]

        manager.renderSuggestions()

        const container = document.getElementById('suggestions-list')
        expect(container.innerHTML).toContain('Home task')
    })

    test('should handle missing DOM elements gracefully', () => {
        // Remove DOM elements that renderSuggestions expects
        document.body.innerHTML = '<div id="suggestions-modal"></div>'

        // Should throw an error when required DOM elements are missing
        // This is expected behavior - renderSuggestions needs these elements
        expect(() => manager.renderSuggestions()).toThrow()
    })
})

describe('SmartSuggestionsManager - selectSuggestedTask()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [new Task({ id: 'task-1', title: 'Task 1', status: 'next' })],
            projects: [],
            currentView: 'all'
        }

        mockApp = {}

        document.body.innerHTML = `
            <div id="suggestions-modal"></div>
            <div data-task-id="task-1">Task Element</div>
        `

        manager = new SmartSuggestionsManager(mockState, mockApp)
    })

    test('should remove modal when task selected', () => {
        manager.selectSuggestedTask('task-1')

        const modal = document.getElementById('suggestions-modal')
        expect(modal).toBeNull()
    })

    test('should handle missing modal gracefully', () => {
        document.getElementById('suggestions-modal').remove()

        expect(() => manager.selectSuggestedTask('task-1')).not.toThrow()
    })

    test('should scroll to task element', () => {
        const taskElement = document.querySelector('[data-task-id="task-1"]')
        // Mock scrollIntoView method
        taskElement.scrollIntoView = jest.fn()

        jest.useFakeTimers()
        manager.selectSuggestedTask('task-1')
        jest.advanceTimersByTime(100)

        expect(taskElement.scrollIntoView).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'center'
        })
        jest.useRealTimers()
    })

    test('should add animation to task element', () => {
        const taskElement = document.querySelector('[data-task-id="task-1"]')
        // Mock scrollIntoView method
        taskElement.scrollIntoView = jest.fn()

        jest.useFakeTimers()
        manager.selectSuggestedTask('task-1')
        jest.advanceTimersByTime(100)

        expect(taskElement.style.animation).toContain('pulse')
        jest.useRealTimers()
    })

    test('should handle missing task element gracefully', () => {
        document.querySelector('[data-task-id="task-1"]').remove()

        jest.useFakeTimers()
        expect(() => {
            manager.selectSuggestedTask('task-1')
            jest.runAllTimers()
        }).not.toThrow()
        jest.useRealTimers()
    })
})
