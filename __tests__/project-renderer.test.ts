/*
 * Tests for project-renderer.ts - ProjectRenderer class
 */

import { ProjectRenderer } from '../js/modules/views/project-renderer.ts'
import { Project } from '../js/models.ts'

// Mock dom-utils
jest.mock('../js/dom-utils.ts', () => ({
    escapeHtml: (str: string) => str,
    getElement: (_id: string) => null,
    setTextContent: (el: HTMLElement | null, text: string) => {
        if (el) el.textContent = text
    },
    announce: jest.fn()
}))

describe('ProjectRenderer', () => {
    let projectRenderer: ProjectRenderer
    let mockState: any
    let mockApp: any
    let mockContainer: HTMLElement

    beforeEach(() => {
        // Create proper Project instances
        const project1 = new Project({
            id: 'proj-1',
            title: 'Project 1',
            description: 'Description 1',
            status: 'active'
        })

        const project2 = new Project({
            id: 'proj-2',
            title: 'Project 2',
            description: 'Description 2',
            status: 'active'
        })

        const archivedProject = new Project({
            id: 'proj-3',
            title: 'Archived Project',
            description: 'Archived description',
            status: 'archived'
        })

        // Mock state
        mockState = {
            projects: [project1, project2, archivedProject],
            filters: {},
            showingArchivedProjects: false
        }

        // Mock app methods
        mockApp = {
            saveState: jest.fn((_action: string) => {}),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(() => {}),
            updateCounts: jest.fn(() => {}),
            showNotification: jest.fn((_message: string, _type: string) => {}),
            openProjectModal: jest.fn((_project: any) => {}),
            deleteProject: jest.fn().mockResolvedValue(undefined),
            archiveProject: jest.fn().mockResolvedValue(undefined),
            unarchiveProject: jest.fn().mockResolvedValue(undefined)
        }

        // Mock container
        mockContainer = document.createElement('div')
        mockContainer.id = 'test-container'

        projectRenderer = new ProjectRenderer(mockState, mockApp)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            expect(projectRenderer).toBeInstanceOf(ProjectRenderer)
        })
    })

    describe('renderProjects', () => {
        test('should render projects to container', () => {
            projectRenderer.renderProjects(mockContainer)

            // Container should have content
            expect(mockContainer.innerHTML).not.toBe('')

            // Should render project elements
            expect(mockContainer.innerHTML).not.toBe('')
        })

        test('should render empty state when no projects', () => {
            mockState.projects = []
            projectRenderer = new ProjectRenderer(mockState, mockApp)

            projectRenderer.renderProjects(mockContainer)

            expect(mockContainer.innerHTML).toContain('No projects found')
        })

        test('should filter archived projects when not showing archived', () => {
            projectRenderer.renderProjects(mockContainer)

            // Should only show active projects (2 active, 1 archived)
            // Check that archived project is not shown
            expect(mockContainer.innerHTML).not.toContain('Archived Project')
        })

        test('should show archived projects when showingArchivedProjects is true', () => {
            mockState.showingArchivedProjects = true
            projectRenderer = new ProjectRenderer(mockState, mockApp)

            projectRenderer.renderProjects(mockContainer)

            // Should show all projects including archived
            expect(mockContainer.innerHTML).toContain('Archived Project')
        })
    })

    describe('renderProjects behavior', () => {
        test('should render project cards with correct information', () => {
            projectRenderer.renderProjects(mockContainer)

            // Should render project titles
            expect(mockContainer.innerHTML).toContain('Project 1')
            expect(mockContainer.innerHTML).toContain('Project 2')

            // Should not render archived project when not showing archived
            expect(mockContainer.innerHTML).not.toContain('Archived Project')
        })

        test('should render archived projects when showingArchivedProjects is true', () => {
            mockState.showingArchivedProjects = true
            projectRenderer = new ProjectRenderer(mockState, mockApp)

            projectRenderer.renderProjects(mockContainer)

            // Should render archived project
            expect(mockContainer.innerHTML).toContain('Archived Project')
        })
    })
})
