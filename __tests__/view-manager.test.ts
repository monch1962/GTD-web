/*
 * Tests for view-manager.ts - ViewManager class
 */

import { ViewManager } from '../js/modules/views/view-manager.ts'
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

// Mock task-renderer
const mockTaskRenderer = {
    renderTasks: jest.fn()
}
jest.mock('../js/modules/views/task-renderer.ts', () => ({
    TaskRenderer: jest.fn(() => mockTaskRenderer)
}))

// Mock project-renderer
const mockProjectRenderer = {
    renderProjects: jest.fn()
}
jest.mock('../js/modules/views/project-renderer.ts', () => ({
    ProjectRenderer: jest.fn(() => mockProjectRenderer)
}))

describe('ViewManager', () => {
    let viewManager: ViewManager
    let mockState: any
    let mockApp: any

    beforeEach(() => {
        // Create proper Task and Project instances
        const task1 = new Task({
            id: 'task-1',
            title: 'Task 1',
            status: 'inbox'
        })

        const task2 = new Task({
            id: 'task-2',
            title: 'Task 2',
            status: 'next'
        })

        const project1 = new Project({
            id: 'proj-1',
            title: 'Project 1',
            status: 'active'
        })

        // Mock state
        mockState = {
            tasks: [task1, task2],
            projects: [project1],
            templates: [],
            currentView: 'inbox',
            currentProjectId: null,
            showingArchivedProjects: false,
            selectedContextFilters: new Set(),
            selectedTaskIds: new Set(),
            filters: {}
        }

        // Mock app methods
        mockApp = {
            updateBulkSelectButtonVisibility: jest.fn(() => {})
        }

        viewManager = new ViewManager(mockState, mockApp)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            expect(viewManager).toBeInstanceOf(ViewManager)
        })
    })

    describe('switchView', () => {
        test('should switch to a new view', () => {
            const newView = 'next'
            viewManager.switchView(newView)

            expect(mockState.currentView).toBe(newView)
        })

        test('should clear project filter when switching views', () => {
            mockState.currentProjectId = 'proj-1'

            viewManager.switchView('inbox')

            expect(mockState.currentProjectId).toBeNull()
        })

        test('should reset archived projects view when switching away from projects', () => {
            mockState.showingArchivedProjects = true
            mockState.currentView = 'projects'

            viewManager.switchView('inbox')

            expect(mockState.showingArchivedProjects).toBe(false)
        })
    })

    describe('renderView', () => {
        beforeEach(() => {
            // Mock DOM elements
            const mockContainer = document.createElement('div')
            mockContainer.id = 'tasks-container'
            document.body.appendChild(mockContainer)

            const mockProjectsContainer = document.createElement('div')
            mockProjectsContainer.id = 'projects-container'
            document.body.appendChild(mockProjectsContainer)

            const mockReferenceContainer = document.createElement('div')
            mockReferenceContainer.id = 'reference-container'
            document.body.appendChild(mockReferenceContainer)
        })

        afterEach(() => {
            // Clean up DOM elements
            const containers = ['tasks-container', 'projects-container', 'reference-container']
            containers.forEach((id) => {
                const el = document.getElementById(id)
                if (el) document.body.removeChild(el)
            })
        })

        test('should render projects view', () => {
            mockState.currentView = 'projects'

            viewManager.renderView()

            // Should call projectRenderer.renderProjects
            expect(mockProjectRenderer.renderProjects).toHaveBeenCalled()
        })

        test('should render task views', () => {
            const taskViews = ['inbox', 'next', 'waiting', 'scheduled', 'someday']

            taskViews.forEach((view) => {
                mockState.currentView = view
                mockTaskRenderer.renderTasks.mockClear()

                viewManager.renderView()

                // Should call taskRenderer.renderTasks for task views
                expect(mockTaskRenderer.renderTasks).toHaveBeenCalled()
            })
        })

        test('should update bulk select button visibility after rendering', () => {
            viewManager.renderView()

            expect(mockApp.updateBulkSelectButtonVisibility).toHaveBeenCalled()
        })
    })

    describe('renderReference', () => {
        beforeEach(() => {
            // Mock DOM element
            const mockContainer = document.createElement('div')
            mockContainer.id = 'reference-container'
            document.body.appendChild(mockContainer)
        })

        afterEach(() => {
            const el = document.getElementById('reference-container')
            if (el) document.body.removeChild(el)
        })

        test('should render empty state when no reference items', () => {
            // Mock tasks to not have any reference items
            mockState.tasks = []

            viewManager.renderReference()

            const container = document.getElementById('reference-container')
            expect(container?.innerHTML).toContain('No reference items found')
        })
    })
})
