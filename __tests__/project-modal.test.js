/**
 * Comprehensive Tests for Project Modal Feature
 */

import { Task, Project, Template } from '../js/models'
import { ProjectModalManager } from '../js/modules/features/project-modal.ts'

describe('ProjectModalManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = ''

        // Create project modal structure
        const modal = document.createElement('div')
        modal.id = 'project-modal'
        modal.innerHTML = `
            <div class="modal-header">
                <h2 id="project-modal-title">Add Project</h2>
                <button class="close-modal">×</button>
            </div>
            <form id="project-form">
                <input type="hidden" id="project-id" value="">
                <input type="text" id="project-title" required>
                <textarea id="project-description"></textarea>
                <select id="project-status">
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                </select>
                <input type="text" id="project-contexts" placeholder="@context1, @context2">
            </form>
        `
        document.body.appendChild(modal)

        mockState = {
            projects: []
        }

        mockApp = {
            showNotification: jest.fn(),
            saveState: jest.fn(),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            updateContextFilter: jest.fn(),
            openTaskModal: jest.fn()
        }

        manager = new ProjectModalManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
        expect(manager.pendingTaskData).toBeNull()
    })
})

describe('ProjectModalManager - Open Project Modal', () => {
    let manager
    let mockState
    let mockApp
    let modal

    beforeEach(() => {
        document.body.innerHTML = ''

        modal = document.createElement('div')
        modal.id = 'project-modal'
        modal.innerHTML = `
            <h2 id="project-modal-title">Add Project</h2>
            <form id="project-form">
                <input type="hidden" id="project-id" value="">
                <input type="text" id="project-title">
                <textarea id="project-description"></textarea>
                <select id="project-status">
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                </select>
                <input type="text" id="project-contexts">
            </form>
        `
        document.body.appendChild(modal)

        mockState = {
            projects: [
                {
                    id: '1',
                    title: 'Test Project',
                    description: 'Test',
                    status: 'active',
                    contexts: ['@work']
                }
            ]
        }

        mockApp = {
            showNotification: jest.fn()
        }

        manager = new ProjectModalManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('openProjectModal()', () => {
        test('should open modal for new project', () => {
            manager.openProjectModal()

            expect(modal.classList.contains('active')).toBe(true)
            expect(document.getElementById('project-modal-title').textContent).toBe('Add Project')
            expect(document.getElementById('project-id').value).toBe('')
        })

        test('should open modal for editing existing project', () => {
            const project = mockState.projects[0]
            manager.openProjectModal(project)

            expect(modal.classList.contains('active')).toBe(true)
            expect(document.getElementById('project-modal-title').textContent).toBe('Edit Project')
            expect(document.getElementById('project-id').value).toBe('1')
            expect(document.getElementById('project-title').value).toBe('Test Project')
            expect(document.getElementById('project-description').value).toBe('Test')
            expect(document.getElementById('project-status').value).toBe('active')
            expect(document.getElementById('project-contexts').value).toBe('@work')
        })

        test('should store pending task data', () => {
            const pendingData = { title: 'Pending Task' }
            manager.openProjectModal(null, pendingData)

            expect(manager.pendingTaskData).toEqual(pendingData)
        })

        test('should reset form', () => {
            document.getElementById('project-title').value = 'Existing title'
            document.getElementById('project-id').value = '123'

            manager.openProjectModal()

            expect(document.getElementById('project-title').value).toBe('')
            expect(document.getElementById('project-id').value).toBe('')
        })
    })
})

describe('ProjectModalManager - Close Project Modal', () => {
    let manager
    let mockState
    let mockApp
    let modal

    beforeEach(() => {
        document.body.innerHTML = ''

        modal = document.createElement('div')
        modal.id = 'project-modal'
        modal.classList.add('active')
        document.body.appendChild(modal)

        mockState = {
            projects: []
        }

        mockApp = {}

        manager = new ProjectModalManager(mockState, mockApp)
        manager.pendingTaskData = { title: 'Test' }
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('closeProjectModal()', () => {
        test('should close modal', () => {
            manager.closeProjectModal()

            expect(modal.classList.contains('active')).toBe(false)
        })

        test('should clear pending task data', () => {
            manager.closeProjectModal()

            expect(manager.pendingTaskData).toBeNull()
        })
    })
})

describe('ProjectModalManager - Save Project From Form', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = ''

        const modal = document.createElement('div')
        modal.id = 'project-modal'
        modal.innerHTML = `
            <form id="project-form">
                <input type="hidden" id="project-id" value="">
                <input type="text" id="project-title">
                <textarea id="project-description"></textarea>
                <select id="project-status">
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                </select>
                <input type="text" id="project-contexts">
            </form>
        `
        document.body.appendChild(modal)

        mockState = {
            projects: [
                { id: '1', title: 'Existing Project', status: 'active', contexts: ['@work'] }
            ]
        }

        mockApp = {
            showNotification: jest.fn(),
            saveState: jest.fn(),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            updateContextFilter: jest.fn(),
            projects: mockState.projects
        }

        manager = new ProjectModalManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('saveProjectFromForm()', () => {
        test('should validate title and show notification if empty', async () => {
            document.getElementById('project-title').value = '   '

            await manager.saveProjectFromForm()

            expect(mockApp.showNotification).toHaveBeenCalledWith('Please enter a project title')
        })

        test('should create new project', async () => {
            document.getElementById('project-title').value = 'New Project'
            document.getElementById('project-description').value = 'Description'
            document.getElementById('project-status').value = 'active'
            document.getElementById('project-contexts').value = '@work'

            await manager.saveProjectFromForm()

            // Check that project was added to state
            expect(mockApp.projects.length).toBeGreaterThan(0)
            const newProject = mockApp.projects[mockApp.projects.length - 1]
            expect(newProject.title).toBe('New Project')
        })

        test('should parse contexts from comma-separated string', async () => {
            document.getElementById('project-title').value = 'Project'
            document.getElementById('project-contexts').value = 'work, home'

            await manager.saveProjectFromForm()

            const newProject = mockApp.projects[mockApp.projects.length - 1]
            expect(newProject.contexts).toContain('@work')
            expect(newProject.contexts).toContain('@home')
        })

        test('should add @ to contexts if missing', async () => {
            document.getElementById('project-title').value = 'Project'
            document.getElementById('project-contexts').value = 'work, @home'

            await manager.saveProjectFromForm()

            const newProject = mockApp.projects[mockApp.projects.length - 1]
            expect(newProject.contexts).toContain('@work')
            expect(newProject.contexts).toContain('@home')
        })

        test('should call saveState for new project', async () => {
            document.getElementById('project-title').value = 'New Project'

            await manager.saveProjectFromForm()

            expect(mockApp.saveState).toHaveBeenCalledWith('Create project')
        })

        test('should update UI after saving', async () => {
            document.getElementById('project-title').value = 'New Project'

            await manager.saveProjectFromForm()

            expect(mockApp.saveProjects).toHaveBeenCalled()
            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
        })

        test('should show notification for new project', async () => {
            document.getElementById('project-title').value = 'Test Project'

            await manager.saveProjectFromForm()

            expect(mockApp.showNotification).toHaveBeenCalledWith('Project "Test Project" created')
        })
    })
})

describe('ProjectModalManager - Gantt Chart', () => {
    let manager
    let mockState
    let mockApp
    let modal
    let chartContainer

    beforeEach(() => {
        document.body.innerHTML = ''

        modal = document.createElement('div')
        modal.id = 'gantt-modal'
        modal.innerHTML = `
            <h2 id="gantt-modal-title">Gantt Chart</h2>
            <div id="gantt-chart"></div>
        `
        document.body.appendChild(modal)

        mockState = {
            projects: [{ id: '1', title: 'Test Project' }]
        }

        mockApp = {
            tasks: [
                {
                    id: 't1',
                    title: 'Task 1',
                    projectId: '1',
                    completed: false,
                    status: 'next',
                    waitingForTaskIds: []
                },
                {
                    id: 't2',
                    title: 'Task 2',
                    projectId: '1',
                    completed: false,
                    status: 'next',
                    waitingForTaskIds: ['t1']
                }
            ]
        }

        manager = new ProjectModalManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('openGanttChart()', () => {
        test('should open gantt modal with project title', () => {
            const project = mockState.projects[0]

            manager.openGanttChart(project)

            expect(modal.classList.contains('active')).toBe(true)
            expect(document.getElementById('gantt-modal-title').textContent).toBe(
                'Test Project - Gantt Chart'
            )
        })
    })

    describe('closeGanttModal()', () => {
        test('should close gantt modal', () => {
            modal.classList.add('active')

            manager.closeGanttModal()

            expect(modal.classList.contains('active')).toBe(false)
        })
    })

    describe('renderGanttChart()', () => {
        test('should show empty state when no tasks', () => {
            mockApp.tasks = []
            const project = mockState.projects[0]

            manager.renderGanttChart(project)

            const container = document.getElementById('gantt-chart')
            expect(container.innerHTML).toContain('No Tasks in This Project')
        })

        test('should render tasks in chart', () => {
            const project = mockState.projects[0]

            manager.renderGanttChart(project)

            const container = document.getElementById('gantt-chart')
            expect(container.innerHTML).toContain('Task 1')
            expect(container.innerHTML).toContain('Task 2')
        })

        test('should handle missing container gracefully', () => {
            const project = mockState.projects[0]

            expect(() => {
                manager.renderGanttChart(project)
            }).not.toThrow()
        })
    })
})

describe('ProjectModalManager - Escape HTML', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { projects: [] }
        mockApp = {}

        manager = new ProjectModalManager(mockState, mockApp)
    })

    describe('escapeHtml()', () => {
        test('should escape HTML tags', () => {
            const result = manager.escapeHtml('<script>alert("xss")</script>')

            expect(result).toContain('&lt;')
            expect(result).toContain('&gt;')
            expect(result).not.toContain('<script>')
        })

        test('should escape ampersands', () => {
            const result = manager.escapeHtml('Tom & Jerry')

            expect(result).toContain('&amp;')
        })

        test('should handle empty string', () => {
            const result = manager.escapeHtml('')

            expect(result).toBe('')
        })

        test('should handle plain text', () => {
            const result = manager.escapeHtml('Hello World')

            expect(result).toBe('Hello World')
        })
    })
})

describe('ProjectModalManager - Integration', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = ''

        const modal = document.createElement('div')
        modal.id = 'project-modal'
        modal.innerHTML = `
            <h2 id="project-modal-title">Add Project</h2>
            <form id="project-form">
                <input type="hidden" id="project-id" value="">
                <input type="text" id="project-title">
                <textarea id="project-description"></textarea>
                <select id="project-status">
                    <option value="active">Active</option>
                </select>
                <input type="text" id="project-contexts">
            </form>
        `
        document.body.appendChild(modal)

        mockState = {
            projects: []
        }

        mockApp = {
            showNotification: jest.fn(),
            saveState: jest.fn(),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            updateContextFilter: jest.fn(),
            projects: mockState.projects
        }

        manager = new ProjectModalManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should handle complete project creation workflow', async () => {
        // Open modal
        manager.openProjectModal()
        expect(document.getElementById('project-modal').classList.contains('active')).toBe(true)

        // Fill form
        document.getElementById('project-title').value = 'Complete Workflow Test'

        // Save
        await manager.saveProjectFromForm()

        // Verify
        expect(mockApp.saveState).toHaveBeenCalled()
        expect(mockApp.saveProjects).toHaveBeenCalled()
        expect(mockApp.showNotification).toHaveBeenCalledWith(
            'Project "Complete Workflow Test" created'
        )
    })

    test('should handle pending task data', async () => {
        const pendingData = { title: 'Task from modal' }

        // Open with pending data
        manager.openProjectModal(null, pendingData)
        expect(manager.pendingTaskData).toEqual(pendingData)

        // Fill form and save
        document.getElementById('project-title').value = 'New Project'
        await manager.saveProjectFromForm()

        // Pending data should be cleared
        expect(manager.pendingTaskData).toBeNull()
    })
})
