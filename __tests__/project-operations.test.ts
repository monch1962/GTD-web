/**
 * Comprehensive Tests for Project Operations Feature
 */

import { Project } from '../js/models.ts'
import { ProjectOperations } from '../js/modules/features/project-operations.ts'

describe('ProjectOperations - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            projects: [],
            tasks: []
        }

        mockApp = {
            saveState: jest.fn(),
            saveProjects: jest.fn(),
            saveTasks: jest.fn(),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ProjectOperations(mockState, mockApp)
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })
})

describe('ProjectOperations - Create Project', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            projects: [],
            tasks: []
        }

        mockApp = {
            saveState: jest.fn(),
            saveProjects: jest.fn(),
            saveTasks: jest.fn(),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ProjectOperations(mockState, mockApp)
    })

    describe('createProject()', () => {
        test('should create a new project', () => {
            const projectData = {
                title: 'Test Project',
                description: 'Test description'
            }

            const project = manager.createProject(projectData)

            expect(project).toBeInstanceOf(Project)
            expect(mockState.projects).toContain(project)
            expect(project.title).toBe('Test Project')
        })

        test('should add project to state', () => {
            const initialCount = mockState.projects.length

            manager.createProject({ title: 'New Project' })

            expect(mockState.projects.length).toBe(initialCount + 1)
        })

        test('should return created project', () => {
            const projectData = { title: 'My Project' }

            const result = manager.createProject(projectData)

            expect(result).toBeDefined()
            expect(result.title).toBe('My Project')
        })

        test('should create project with all properties', () => {
            const projectData = {
                title: 'Complete Project',
                description: 'Full description',
                status: 'active'
            }

            const project = manager.createProject(projectData)

            expect(project.title).toBe('Complete Project')
            expect(project.description).toBe('Full description')
            expect(project.status).toBe('active')
        })
    })
})

describe('ProjectOperations - Delete Project', () => {
    let manager
    let mockState
    let mockApp
    let confirmSpy

    beforeEach(() => {
        confirmSpy = jest.spyOn(global, 'confirm').mockReturnValue(true)

        mockState = {
            projects: [
                { id: '1', title: 'Project 1', status: 'active' },
                { id: '2', title: 'Project 2', status: 'active' }
            ],
            tasks: [
                { id: 't1', title: 'Task 1', projectId: '1' },
                { id: 't2', title: 'Task 2', projectId: '2' },
                { id: 't3', title: 'Task 3', projectId: null }
            ]
        }

        mockApp = {
            saveState: jest.fn(),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            saveTasks: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ProjectOperations(mockState, mockApp)
    })

    afterEach(() => {
        confirmSpy.mockRestore()
    })

    describe('deleteProject()', () => {
        test('should delete project when confirmed', async () => {
            await manager.deleteProject('1')

            expect(mockState.projects.find((p) => p.id === '1')).toBeUndefined()
            expect(mockState.projects.length).toBe(1)
        })

        test('should not delete project when cancelled', async () => {
            confirmSpy.mockReturnValue(false)

            await manager.deleteProject('1')

            expect(mockState.projects.find((p) => p.id === '1')).toBeDefined()
            expect(mockState.projects.length).toBe(2)
        })

        test('should remove project reference from tasks', async () => {
            await manager.deleteProject('1')

            expect(mockState.tasks[0].projectId).toBeNull()
            expect(mockState.tasks[1].projectId).toBe('2')
            expect(mockState.tasks[2].projectId).toBeNull()
        })

        test('should save state for undo', async () => {
            await manager.deleteProject('1')

            expect(mockApp.saveState).toHaveBeenCalledWith('Delete project')
        })

        test('should save projects', async () => {
            await manager.deleteProject('1')

            expect(mockApp.saveProjects).toHaveBeenCalled()
        })

        test('should save tasks', async () => {
            await manager.deleteProject('1')

            expect(mockApp.saveTasks).toHaveBeenCalled()
        })

        test('should update UI', async () => {
            await manager.deleteProject('1')

            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
            expect(mockApp.renderProjectsDropdown).toHaveBeenCalled()
        })

        test('should handle non-existent project', async () => {
            await expect(manager.deleteProject('999')).resolves.not.toThrow()
        })

        test('should only affect tasks with deleted project', async () => {
            await manager.deleteProject('1')

            expect(mockState.tasks[0].projectId).toBeNull()
            expect(mockState.tasks[1].projectId).toBe('2')
        })
    })
})

describe('ProjectOperations - Archive Project', () => {
    let manager
    let mockState
    let mockApp
    let confirmSpy

    beforeEach(() => {
        confirmSpy = jest.spyOn(global, 'confirm').mockReturnValue(true)

        mockState = {
            projects: [
                { id: '1', title: 'Active Project', status: 'active' },
                { id: '2', title: 'Another Project', status: 'active' }
            ],
            tasks: []
        }

        mockApp = {
            saveState: jest.fn(),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ProjectOperations(mockState, mockApp)
    })

    afterEach(() => {
        confirmSpy.mockRestore()
    })

    describe('archiveProject()', () => {
        test('should archive project when confirmed', async () => {
            await manager.archiveProject('1')

            expect(mockState.projects[0].status).toBe('archived')
        })

        test('should not archive project when cancelled', async () => {
            confirmSpy.mockReturnValue(false)

            await manager.archiveProject('1')

            expect(mockState.projects[0].status).toBe('active')
        })

        test('should update timestamp', async () => {
            await manager.archiveProject('1')

            expect(mockState.projects[0].updatedAt).toBeDefined()
        })

        test('should save state for undo', async () => {
            await manager.archiveProject('1')

            expect(mockApp.saveState).toHaveBeenCalledWith('Archive project')
        })

        test('should save projects', async () => {
            await manager.archiveProject('1')

            expect(mockApp.saveProjects).toHaveBeenCalled()
        })

        test('should update UI', async () => {
            await manager.archiveProject('1')

            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
            expect(mockApp.renderProjectsDropdown).toHaveBeenCalled()
        })

        test('should show notification', async () => {
            await manager.archiveProject('1')

            expect(mockApp.showNotification).toHaveBeenCalledWith(
                'Project "Active Project" archived'
            )
        })

        test('should handle non-existent project', async () => {
            await expect(manager.archiveProject('999')).resolves.not.toThrow()
        })
    })
})

describe('ProjectOperations - Restore Project', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            projects: [
                { id: '1', title: 'Archived Project', status: 'archived' },
                { id: '2', title: 'Another Project', status: 'active' }
            ],
            tasks: []
        }

        mockApp = {
            saveState: jest.fn(),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ProjectOperations(mockState, mockApp)
    })

    describe('restoreProject()', () => {
        test('should restore archived project', async () => {
            await manager.restoreProject('1')

            expect(mockState.projects[0].status).toBe('active')
        })

        test('should update timestamp', async () => {
            await manager.restoreProject('1')

            expect(mockState.projects[0].updatedAt).toBeDefined()
        })

        test('should save state for undo', async () => {
            await manager.restoreProject('1')

            expect(mockApp.saveState).toHaveBeenCalledWith('Restore project')
        })

        test('should save projects', async () => {
            await manager.restoreProject('1')

            expect(mockApp.saveProjects).toHaveBeenCalled()
        })

        test('should update UI', async () => {
            await manager.restoreProject('1')

            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
            expect(mockApp.renderProjectsDropdown).toHaveBeenCalled()
        })

        test('should show notification', async () => {
            await manager.restoreProject('1')

            expect(mockApp.showNotification).toHaveBeenCalledWith(
                'Project "Archived Project" restored'
            )
        })

        test('should handle non-existent project', async () => {
            await expect(manager.restoreProject('999')).resolves.not.toThrow()
        })
    })
})

describe('ProjectOperations - Update Project Positions', () => {
    let manager
    let mockState
    let mockApp
    let container

    beforeEach(() => {
        document.body.innerHTML = ''

        container = document.createElement('div')
        container.className = 'projects-container'

        const project1 = document.createElement('div')
        project1.className = 'project-card'
        project1.dataset.projectId = '1'

        const project2 = document.createElement('div')
        project2.className = 'project-card'
        project2.dataset.projectId = '2'

        container.appendChild(project1)
        container.appendChild(project2)
        document.body.appendChild(container)

        mockState = {
            projects: [
                { id: '1', title: 'Project 1', position: 0 },
                { id: '2', title: 'Project 2', position: 1 }
            ],
            tasks: []
        }

        mockApp = {
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderProjectsDropdown: jest.fn()
        }

        manager = new ProjectOperations(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('updateProjectPositions()', () => {
        test('should update project positions based on DOM order', async () => {
            await manager.updateProjectPositions()

            expect(mockState.projects[0].position).toBe(0)
            expect(mockState.projects[1].position).toBe(1)
        })

        test('should update timestamps', async () => {
            await manager.updateProjectPositions()

            expect(mockState.projects[0].updatedAt).toBeDefined()
            expect(mockState.projects[1].updatedAt).toBeDefined()
        })

        test('should save projects', async () => {
            await manager.updateProjectPositions()

            expect(mockApp.saveProjects).toHaveBeenCalled()
        })

        test('should update dropdown', async () => {
            await manager.updateProjectPositions()

            expect(mockApp.renderProjectsDropdown).toHaveBeenCalled()
        })

        test('should handle missing container', async () => {
            container.remove()

            await expect(manager.updateProjectPositions()).resolves.not.toThrow()
        })

        test('should handle empty container', async () => {
            container.innerHTML = ''

            await expect(manager.updateProjectPositions()).resolves.not.toThrow()
        })

        test('should preserve project order from DOM', async () => {
            // Reverse DOM order
            const project2 = container.querySelector('[data-project-id="2"]')
            const project1 = container.querySelector('[data-project-id="1"]')
            container.insertBefore(project2, project1)

            await manager.updateProjectPositions()

            // Positions should be updated based on new DOM order
            expect(mockState.projects.find((p) => p.id === '2').position).toBe(0)
            expect(mockState.projects.find((p) => p.id === '1').position).toBe(1)
        })
    })
})

describe('ProjectOperations - Get Project', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            projects: [
                { id: '1', title: 'Project 1' },
                { id: '2', title: 'Project 2' }
            ],
            tasks: []
        }

        mockApp = {
            saveState: jest.fn(),
            saveProjects: jest.fn(),
            renderView: jest.fn()
        }

        manager = new ProjectOperations(mockState, mockApp)
    })

    describe('getProjectById()', () => {
        test('should return project by ID', () => {
            const result = manager.getProjectById('1')

            expect(result).toBeDefined()
            expect(result.id).toBe('1')
        })

        test('should return null for non-existent project', () => {
            const result = manager.getProjectById('999')

            expect(result).toBeNull()
        })

        test('should return correct project', () => {
            const result = manager.getProjectById('2')

            expect(result.title).toBe('Project 2')
        })
    })

    describe('getActiveProjects()', () => {
        test('should return only active projects', () => {
            mockState.projects = [
                { id: '1', title: 'Project 1', status: 'active' },
                { id: '2', title: 'Project 2', status: 'active' },
                { id: '3', title: 'Active', status: 'active' },
                { id: '4', title: 'Archived', status: 'archived' }
            ]

            const result = manager.getActiveProjects()

            expect(result.length).toBe(3)
            expect(result.every((p) => p.status === 'active')).toBe(true)
        })

        test('should return empty array when no active projects', () => {
            mockState.projects = [{ id: '1', status: 'archived' }]

            const result = manager.getActiveProjects()

            expect(result).toEqual([])
        })
    })

    describe('getArchivedProjects()', () => {
        test('should return only archived projects', () => {
            mockState.projects.push(
                { id: '3', title: 'Active', status: 'active' },
                { id: '4', title: 'Archived', status: 'archived' }
            )

            const result = manager.getArchivedProjects()

            expect(result.length).toBe(1)
            expect(result.every((p) => p.status === 'archived')).toBe(true)
        })

        test('should return empty array when no archived projects', () => {
            const result = manager.getArchivedProjects()

            expect(result).toEqual([])
        })
    })

    describe('getProjectsByStatus()', () => {
        test('should return projects with specified status', () => {
            mockState.projects = [
                { id: '1', title: 'Project 1', status: 'active' },
                { id: '2', title: 'Project 2', status: 'active' },
                { id: '3', title: 'Active 1', status: 'active' },
                { id: '4', title: 'Active 2', status: 'active' }
            ]

            const result = manager.getProjectsByStatus('active')

            expect(result.length).toBe(4)
            expect(result.every((p) => p.status === 'active')).toBe(true)
        })

        test('should return empty array for non-existent status', () => {
            const result = manager.getProjectsByStatus('completed')

            expect(result).toEqual([])
        })
    })
})

describe('ProjectOperations - Get Tasks for Project', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            projects: [
                { id: '1', title: 'Project 1' },
                { id: '2', title: 'Project 2' }
            ],
            tasks: [
                { id: 't1', title: 'Task 1', projectId: '1', completed: false },
                { id: 't2', title: 'Task 2', projectId: '1', completed: true },
                { id: 't3', title: 'Task 3', projectId: '2', completed: false },
                { id: 't4', title: 'Task 4', projectId: null, completed: false }
            ]
        }

        mockApp = {}

        manager = new ProjectOperations(mockState, mockApp)
    })

    describe('getTasksForProject()', () => {
        test('should return all tasks for project', () => {
            const result = manager.getTasksForProject('1')

            expect(result.length).toBe(2)
            expect(result.every((t) => t.projectId === '1')).toBe(true)
        })

        test('should return empty array for project with no tasks', () => {
            const result = manager.getTasksForProject('999')

            expect(result).toEqual([])
        })
    })

    describe('getIncompleteTasksForProject()', () => {
        test('should return only incomplete tasks', () => {
            const result = manager.getIncompleteTasksForProject('1')

            expect(result.length).toBe(1)
            expect(result[0].id).toBe('t1')
            expect(result[0].completed).toBe(false)
        })

        test('should return empty array when all tasks completed', () => {
            mockState.tasks[0].completed = true
            mockState.tasks[1].completed = true

            const result = manager.getIncompleteTasksForProject('1')

            expect(result).toEqual([])
        })
    })

    describe('getCompletedTasksForProject()', () => {
        test('should return only completed tasks', () => {
            const result = manager.getCompletedTasksForProject('1')

            expect(result.length).toBe(1)
            expect(result[0].id).toBe('t2')
            expect(result[0].completed).toBe(true)
        })

        test('should return empty array when no tasks completed', () => {
            const result = manager.getCompletedTasksForProject('2')

            expect(result).toEqual([])
        })
    })
})

describe('ProjectOperations - Project Statistics', () => {
    let manager
    let mockState

    beforeEach(() => {
        mockState = {
            projects: [{ id: '1', title: 'Project 1' }],
            tasks: [
                { id: 't1', projectId: '1', completed: true },
                { id: 't2', projectId: '1', completed: false },
                { id: 't3', projectId: '1', completed: false },
                { id: 't4', projectId: '2', completed: true }
            ]
        }

        manager = new ProjectOperations(mockState, {})
    })

    describe('getProjectCompletion()', () => {
        test('should calculate completion percentage', () => {
            const result = manager.getProjectCompletion('1')

            expect(result).toBe(33) // 1/3 = 33%
        })

        test('should return 0 for project with no tasks', () => {
            const result = manager.getProjectCompletion('999')

            expect(result).toBe(0)
        })

        test('should return 100 for completed project', () => {
            mockState.tasks = [
                { id: 't1', projectId: '1', completed: true },
                { id: 't2', projectId: '1', completed: true }
            ]

            const result = manager.getProjectCompletion('1')

            expect(result).toBe(100)
        })
    })

    describe('getProjectStats()', () => {
        test('should return project statistics', () => {
            // Add isOverdue method to tasks
            mockState.tasks.forEach((t) => {
                t.isOverdue = () => false
            })

            const result = manager.getProjectStats('1')

            expect(result.total).toBe(3)
            expect(result.completed).toBe(1)
            expect(result.incomplete).toBe(2)
            expect(result.overdue).toBe(0)
            expect(result.completionPercent).toBe(33)
        })

        test('should return zero stats for empty project', () => {
            const result = manager.getProjectStats('999')

            expect(result.total).toBe(0)
            expect(result.completed).toBe(0)
            expect(result.incomplete).toBe(0)
            expect(result.overdue).toBe(0)
            expect(result.completionPercent).toBe(0)
        })
    })
})

describe('ProjectOperations - Update Project', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            projects: [{ id: '1', title: 'Original Title', description: 'Original' }],
            tasks: []
        }

        mockApp = {
            saveState: jest.fn(),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn()
        }

        manager = new ProjectOperations(mockState, mockApp)
    })

    describe('updateProject()', () => {
        test('should update project properties', async () => {
            await manager.updateProject('1', {
                title: 'Updated Title',
                description: 'Updated description'
            })

            const project = mockState.projects[0]
            expect(project.title).toBe('Updated Title')
            expect(project.description).toBe('Updated description')
        })

        test('should update timestamp', async () => {
            await manager.updateProject('1', { title: 'New' })

            expect(mockState.projects[0].updatedAt).toBeDefined()
        })

        test('should save state for undo', async () => {
            await manager.updateProject('1', { title: 'New' })

            expect(mockApp.saveState).toHaveBeenCalledWith('Update project')
        })

        test('should save projects', async () => {
            await manager.updateProject('1', { title: 'New' })

            expect(mockApp.saveProjects).toHaveBeenCalled()
        })

        test('should update UI', async () => {
            await manager.updateProject('1', { title: 'New' })

            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
            expect(mockApp.renderProjectsDropdown).toHaveBeenCalled()
        })

        test('should handle non-existent project', async () => {
            await expect(manager.updateProject('999', { title: 'New' })).resolves.not.toThrow()
        })
    })
})

describe('ProjectOperations - Search Projects', () => {
    let manager
    let mockState

    beforeEach(() => {
        mockState = {
            projects: [
                { id: '1', title: 'Home Renovation', description: 'Fix the kitchen' },
                { id: '2', title: 'Work Project', description: 'Quarterly report' },
                { id: '3', title: 'Garden', description: 'Plant flowers' }
            ],
            tasks: []
        }

        manager = new ProjectOperations(mockState, {})
    })

    describe('searchProjects()', () => {
        test('should find projects by title', () => {
            const result = manager.searchProjects('home')

            expect(result.length).toBe(1)
            expect(result[0].title).toBe('Home Renovation')
        })

        test('should find projects by description', () => {
            const result = manager.searchProjects('kitchen')

            expect(result.length).toBe(1)
            expect(result[0].id).toBe('1')
        })

        test('should be case insensitive', () => {
            const result = manager.searchProjects('WORK')

            expect(result.length).toBe(1)
            expect(result[0].title).toBe('Work Project')
        })

        test('should return empty array for no matches', () => {
            const result = manager.searchProjects('nonexistent')

            expect(result).toEqual([])
        })

        test('should find multiple matching projects', () => {
            mockState.projects = [
                { id: '1', title: 'Project One' },
                { id: '2', title: 'Project Two' },
                { id: '3', title: 'Task Three' }
            ]

            const result = manager.searchProjects('project')

            expect(result.length).toBe(2)
        })
    })
})

describe('ProjectOperations - Integration', () => {
    let manager
    let mockState
    let mockApp
    let confirmSpy

    beforeEach(() => {
        confirmSpy = jest.spyOn(global, 'confirm').mockReturnValue(true)

        mockState = {
            projects: [],
            tasks: []
        }

        mockApp = {
            saveState: jest.fn(),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            saveTasks: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ProjectOperations(mockState, mockApp)
    })

    afterEach(() => {
        confirmSpy.mockRestore()
    })

    test('should handle complete project lifecycle', async () => {
        // Create project
        const project = manager.createProject({
            title: 'Lifecycle Project',
            description: 'Test'
        })

        expect(project.id).toBeDefined()
        expect(mockState.projects).toContain(project)

        // Update project
        await manager.updateProject(project.id, {
            title: 'Updated Project'
        })

        expect(project.title).toBe('Updated Project')

        // Archive project
        await manager.archiveProject(project.id)

        expect(project.status).toBe('archived')

        // Restore project
        await manager.restoreProject(project.id)

        expect(project.status).toBe('active')

        // Delete project
        await manager.deleteProject(project.id)

        expect(mockState.projects).not.toContain(project)
    })

    test('should handle multiple projects correctly', () => {
        manager.createProject({ title: 'Project 1' })
        manager.createProject({ title: 'Project 2' })
        manager.createProject({ title: 'Project 3' })

        expect(mockState.projects.length).toBe(3)

        const active = manager.getActiveProjects()
        expect(active.length).toBe(3)
    })

    test('should handle project with tasks', async () => {
        const project = manager.createProject({ title: 'Project with Tasks' })

        mockState.tasks.push(
            { id: 't1', projectId: project.id, completed: false, isOverdue: () => false },
            { id: 't2', projectId: project.id, completed: true, isOverdue: () => false }
        )

        const stats = manager.getProjectStats(project.id)

        expect(stats.total).toBe(2)
        expect(stats.completed).toBe(1)
        expect(stats.incomplete).toBe(1)

        // Delete project should unassign tasks
        await manager.deleteProject(project.id)

        expect(mockState.tasks[0].projectId).toBeNull()
        expect(mockState.tasks[1].projectId).toBeNull()
    })
})
