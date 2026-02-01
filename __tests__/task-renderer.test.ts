/*
 * Tests for task-renderer.ts - TaskRenderer class
 */

import { TaskRenderer } from '../js/modules/views/task-renderer.ts'
import { Task, Project } from '../js/models.ts'

// Mock dom-utils
jest.mock('../js/dom-utils.ts', () => ({
    escapeHtml: (str: string) => str,
    getElement: (_id: string) => null,
    setTextContent: (el: HTMLElement | null, text: string) => {
        if (el) el.textContent = text
    },
    announce: jest.fn()
}))

// Mock virtual-scroll
jest.mock('../js/modules/ui/virtual-scroll.ts', () => ({
    VirtualScrollManager: jest.fn().mockImplementation(() => ({
        setup: jest.fn(),
        render: jest.fn(),
        destroy: jest.fn(),
        updateItems: jest.fn(),
        setItems: jest.fn()
    }))
}))

describe('TaskRenderer', () => {
    let taskRenderer: TaskRenderer
    let mockState: any
    let mockApp: any
    let mockContainer: HTMLElement

    beforeEach(() => {
        // Create proper Task instances
        const task1 = new Task({
            id: 'task-1',
            title: 'Task 1',
            description: 'Description 1',
            status: 'inbox',
            contexts: ['@work'],
            energy: 'medium',
            time: 30
        })

        const task2 = new Task({
            id: 'task-2',
            title: 'Task 2',
            description: 'Description 2',
            status: 'next',
            contexts: ['@home'],
            energy: 'high',
            time: 60,
            projectId: 'proj-1',
            dueDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        })
        task2.starred = true

        const project1 = new Project({
            id: 'proj-1',
            title: 'Project 1',
            description: '',
            status: 'active'
        })

        // Mock state
        mockState = {
            tasks: [task1, task2],
            projects: [project1]
        }

        // Mock app methods
        mockApp = {
            saveState: jest.fn((_action: string) => {}),
            saveTasks: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(() => {}),
            updateCounts: jest.fn(() => {}),
            showToast: jest.fn((_message: string) => {}),
            showNotification: jest.fn((_message: string, _type: string) => {}),
            openTaskModal: jest.fn(
                (_task: any, _defaultProjectId?: string, _defaultData?: any) => {}
            ),
            deleteTask: jest.fn().mockResolvedValue(undefined),
            toggleTaskStar: jest.fn().mockResolvedValue(undefined),
            toggleTaskComplete: jest.fn().mockResolvedValue(undefined),
            startTimer: jest.fn().mockResolvedValue(undefined),
            stopTimer: jest.fn().mockResolvedValue(undefined),
            updateBulkSelectButtonVisibility: jest.fn(() => {})
        }

        // Mock container
        mockContainer = document.createElement('div')
        mockContainer.id = 'test-container'

        taskRenderer = new TaskRenderer(mockState, mockApp)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            expect(taskRenderer).toBeInstanceOf(TaskRenderer)
            expect(taskRenderer.state).toBe(mockState)
            expect(taskRenderer.app).toBe(mockApp)
        })
    })

    describe('renderTasks', () => {
        test('should render tasks to container', () => {
            taskRenderer.renderTasks(mockContainer)

            // Container should have content
            expect(mockContainer.innerHTML).not.toBe('')
        })

        test('should render empty state when no tasks', () => {
            mockState.tasks = []
            taskRenderer = new TaskRenderer(mockState, mockApp)

            taskRenderer.renderTasks(mockContainer)

            expect(mockContainer.innerHTML).toContain('No tasks found')
        })

        test('should filter tasks when filter function provided', () => {
            const filterFn = (task: Task) => task.status === 'next'

            taskRenderer.renderTasks(mockContainer, filterFn)

            // Should render content (not empty state)
            expect(mockContainer.innerHTML).not.toContain('No tasks found')
        })
    })

    describe('createTaskElement', () => {
        test('should create task element with correct data', () => {
            const task = mockState.tasks[0]
            const element = taskRenderer.createTaskElement(task, 0)

            expect(element).toBeInstanceOf(HTMLElement)
            expect(element.classList.contains('task-item')).toBe(true)
            expect(element.dataset.taskId).toBe(task.id)
        })

        test('should include task title', () => {
            const task = mockState.tasks[0]
            const element = taskRenderer.createTaskElement(task, 0)

            expect(element.innerHTML).toContain(task.title)
        })
    })

    describe('Virtual scrolling', () => {
        test('should use virtual scrolling for 50+ tasks', () => {
            // Create 60 tasks
            const manyTasks = Array.from(
                { length: 60 },
                (_, i) =>
                    new Task({
                        id: `task-${i}`,
                        title: `Task ${i}`,
                        status: 'inbox'
                    })
            )

            mockState.tasks = manyTasks
            taskRenderer = new TaskRenderer(mockState, mockApp)
            taskRenderer.renderTasks(mockContainer)

            // Virtual scroll should be initialized
            expect(taskRenderer.virtualScroll).not.toBeNull()
        })

        test('should use regular rendering for less than 50 tasks', () => {
            taskRenderer.renderTasks(mockContainer)

            // Virtual scroll should not be initialized for small lists
            expect(taskRenderer.virtualScroll).toBeNull()
        })
    })
})
