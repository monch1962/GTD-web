/**
 * Archive module tests
 * Tests for the ArchiveManager class that handles task archiving and restoration
 */

import { ArchiveManager } from '../js/modules/features/archive'
import { Task, Project } from '../js/models'

// Mock storage functions
const mockStorage = {
    getArchivedTasks: jest.fn(),
    addToArchive: jest.fn(),
    removeFromArchive: jest.fn()
}

// Mock app dependencies
const mockApp = {
    storage: mockStorage,
    saveState: jest.fn(),
    saveTasks: jest.fn(),
    renderView: jest.fn(),
    updateCounts: jest.fn(),
    showToast: jest.fn(),
    showNotification: jest.fn()
}

describe('ArchiveManager', () => {
    let archiveManager: ArchiveManager
    let mockState: { tasks: Task[]; projects: Project[] }

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()

        // Create test data
        const testTask = new Task({
            id: 'task-1',
            title: 'Test Task',
            description: 'Test description',
            completed: true,
            completedAt: new Date('2024-01-01').toISOString()
        })

        const testProject = new Project({
            id: 'project-1',
            title: 'Test Project'
        })

        mockState = {
            tasks: [testTask],
            projects: [testProject]
        }

        archiveManager = new ArchiveManager(mockState, mockApp)
    })

    describe('Constructor', () => {
        test('should initialize with state and app', () => {
            expect(archiveManager).toBeInstanceOf(ArchiveManager)
        })
    })

    describe('setupArchive', () => {
        test('should add event listeners to archive button', () => {
            // Mock DOM elements
            const mockArchiveBtn = document.createElement('button')
            mockArchiveBtn.id = 'archive-button'
            const mockCloseBtn = document.createElement('button')
            mockCloseBtn.id = 'close-archive-modal'
            const mockAutoArchiveBtn = document.createElement('button')
            mockAutoArchiveBtn.id = 'btn-auto-archive'
            const mockSearch = document.createElement('input')
            mockSearch.id = 'archive-search'
            const mockProjectFilter = document.createElement('select')
            mockProjectFilter.id = 'archive-filter-project'

            // Mock querySelector to return our elements
            jest.spyOn(document, 'getElementById').mockImplementation((id) => {
                switch (id) {
                case 'archive-button':
                    return mockArchiveBtn
                case 'close-archive-modal':
                    return mockCloseBtn
                case 'btn-auto-archive':
                    return mockAutoArchiveBtn
                case 'archive-search':
                    return mockSearch
                case 'archive-filter-project':
                    return mockProjectFilter
                default:
                    return null
                }
            })

            // Mock openArchiveModal
            const openArchiveModalSpy = jest.spyOn(archiveManager as any, 'openArchiveModal')
            const closeArchiveModalSpy = jest.spyOn(archiveManager as any, 'closeArchiveModal')
            const autoArchiveOldTasksSpy = jest.spyOn(archiveManager as any, 'autoArchiveOldTasks')
            const renderArchiveSpy = jest.spyOn(archiveManager as any, 'renderArchive')

            // Call setup
            archiveManager.setupArchive()

            // Test archive button
            mockArchiveBtn.click()
            expect(openArchiveModalSpy).toHaveBeenCalled()

            // Test close button
            mockCloseBtn.click()
            expect(closeArchiveModalSpy).toHaveBeenCalled()

            // Test auto-archive button
            mockAutoArchiveBtn.click()
            expect(autoArchiveOldTasksSpy).toHaveBeenCalled()

            // Test search input
            mockSearch.value = 'test'
            mockSearch.dispatchEvent(new Event('input'))
            expect(renderArchiveSpy).toHaveBeenCalledWith('test')

            // Test project filter
            mockProjectFilter.value = 'project-1'
            mockProjectFilter.dispatchEvent(new Event('change'))
            expect(renderArchiveSpy).toHaveBeenCalled()
        })

        test('should handle missing DOM elements gracefully', () => {
            // Mock getElementById to return null for all elements
            jest.spyOn(document, 'getElementById').mockReturnValue(null)

            // Should not throw errors
            expect(() => archiveManager.setupArchive()).not.toThrow()
        })
    })

    describe('openArchiveModal', () => {
        test('should open modal and render archive', () => {
            const mockModal = document.createElement('div')
            mockModal.id = 'archive-modal'
            mockModal.classList.add = jest.fn()

            // Mock storage to return empty array
            mockStorage.getArchivedTasks.mockReturnValue([])

            // Mock DOM elements needed by populateArchiveProjectFilter
            const mockSelect = document.createElement('select')
            mockSelect.id = 'archive-filter-project'
            // Create a mock options property
            Object.defineProperty(mockSelect, 'options', {
                value: [],
                writable: true
            })
            mockSelect.appendChild = jest.fn()
            mockSelect.remove = jest.fn()

            jest.spyOn(document, 'getElementById').mockImplementation((id) => {
                switch (id) {
                case 'archive-modal':
                    return mockModal
                case 'archive-filter-project':
                    return mockSelect
                default:
                    return null
                }
            })

            const renderArchiveSpy = jest.spyOn(archiveManager as any, 'renderArchive')
            const populateFilterSpy = jest.spyOn(
                archiveManager as any,
                'populateArchiveProjectFilter'
            )

            archiveManager.openArchiveModal()

            expect(mockModal.classList.add).toHaveBeenCalledWith('active')
            expect(renderArchiveSpy).toHaveBeenCalled()
            expect(populateFilterSpy).toHaveBeenCalled()
        })

        test('should handle missing modal gracefully', () => {
            jest.spyOn(document, 'getElementById').mockReturnValue(null)
            expect(() => archiveManager.openArchiveModal()).not.toThrow()
        })
    })

    describe('closeArchiveModal', () => {
        test('should close modal', () => {
            const mockModal = document.createElement('div')
            mockModal.id = 'archive-modal'
            mockModal.classList.remove = jest.fn()

            jest.spyOn(document, 'getElementById').mockReturnValue(mockModal)

            archiveManager.closeArchiveModal()

            expect(mockModal.classList.remove).toHaveBeenCalledWith('active')
        })

        test('should handle missing modal gracefully', () => {
            jest.spyOn(document, 'getElementById').mockReturnValue(null)
            expect(() => archiveManager.closeArchiveModal()).not.toThrow()
        })
    })

    describe('autoArchiveOldTasks', () => {
        test('should archive old completed tasks', async () => {
            // Create old completed task
            const oldDate = new Date()
            oldDate.setDate(oldDate.getDate() - 31) // 31 days old
            const oldTask = new Task({
                id: 'old-task',
                title: 'Old Task',
                completed: true,
                completedAt: oldDate.toISOString()
            })

            // Create recent completed task
            const recentDate = new Date()
            recentDate.setDate(recentDate.getDate() - 10) // 10 days old
            const recentTask = new Task({
                id: 'recent-task',
                title: 'Recent Task',
                completed: true,
                completedAt: recentDate.toISOString()
            })

            mockState.tasks = [oldTask, recentTask]

            // Mock confirm to return true
            window.confirm = jest.fn(() => true)

            // Mock archiveTasks
            const archiveTasksSpy = jest
                .spyOn(archiveManager as any, 'archiveTasks')
                .mockResolvedValue(undefined)

            await archiveManager.autoArchiveOldTasks(30)

            // Should only archive the old task
            expect(archiveTasksSpy).toHaveBeenCalledWith([oldTask])
            expect(mockApp.saveState).toHaveBeenCalledWith('Auto-archive tasks')
            expect(mockApp.saveTasks).toHaveBeenCalled()
            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
            expect(mockApp.showToast).toHaveBeenCalledWith('Archived 1 tasks')
        })

        test('should show message when no tasks to archive', async () => {
            // Create recent task only
            const recentDate = new Date()
            recentDate.setDate(recentDate.getDate() - 10)
            const recentTask = new Task({
                id: 'recent-task',
                title: 'Recent Task',
                completed: true,
                completedAt: recentDate.toISOString()
            })

            mockState.tasks = [recentTask]

            await archiveManager.autoArchiveOldTasks(30)

            expect(mockApp.showToast).toHaveBeenCalledWith(
                'No tasks to archive (none older than 30 days)'
            )
            expect(mockApp.saveState).not.toHaveBeenCalled()
        })

        test('should not archive when user cancels', async () => {
            // Create old task
            const oldDate = new Date()
            oldDate.setDate(oldDate.getDate() - 31)
            const oldTask = new Task({
                id: 'old-task',
                title: 'Old Task',
                completed: true,
                completedAt: oldDate.toISOString()
            })

            mockState.tasks = [oldTask]

            // Mock confirm to return false
            window.confirm = jest.fn(() => false)

            await archiveManager.autoArchiveOldTasks(30)

            expect(mockApp.saveState).not.toHaveBeenCalled()
            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })
    })

    describe('archiveTask', () => {
        test('should archive a single task', async () => {
            const task = mockState.tasks[0]

            // Mock confirm to return true
            window.confirm = jest.fn(() => true)

            await archiveManager.archiveTask('task-1')

            expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Test Task'))
            expect(mockApp.saveState).toHaveBeenCalledWith('Archive task')
            expect(mockStorage.addToArchive).toHaveBeenCalledWith([task])
            expect(mockApp.saveTasks).toHaveBeenCalled()
            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
            expect(mockApp.showToast).toHaveBeenCalledWith('Task "Test Task" archived')
            expect(mockState.tasks).toHaveLength(0) // Task should be removed
        })

        test('should not archive non-existent task', async () => {
            await archiveManager.archiveTask('non-existent')

            expect(mockApp.saveState).not.toHaveBeenCalled()
            expect(mockStorage.addToArchive).not.toHaveBeenCalled()
        })

        test('should not archive when user cancels', async () => {
            window.confirm = jest.fn(() => false)

            await archiveManager.archiveTask('task-1')

            expect(mockApp.saveState).not.toHaveBeenCalled()
            expect(mockStorage.addToArchive).not.toHaveBeenCalled()
        })
    })

    describe('restoreFromArchive', () => {
        test('should restore task from archive', async () => {
            const archivedTask = {
                task: {
                    id: 'archived-task',
                    title: 'Archived Task',
                    status: 'next',
                    projectId: 'project-1'
                },
                originalStatus: 'completed',
                originalProjectId: 'project-1',
                archivedAt: new Date().toISOString()
            }

            mockStorage.getArchivedTasks.mockReturnValue([archivedTask])

            // Mock confirm to return true
            window.confirm = jest.fn(() => true)

            await archiveManager.restoreFromArchive('archived-task')

            expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Archived Task'))
            expect(mockApp.saveState).toHaveBeenCalledWith('Restore from archive')
            expect(mockApp.saveTasks).toHaveBeenCalled()
            expect(mockStorage.removeFromArchive).toHaveBeenCalledWith('archived-task')
            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
            expect(mockApp.showToast).toHaveBeenCalledWith('Task "Archived Task" restored')
            expect(mockState.tasks).toHaveLength(2) // Original task + restored task
        })

        test('should not restore non-existent task', async () => {
            mockStorage.getArchivedTasks.mockReturnValue([])

            await archiveManager.restoreFromArchive('non-existent')

            expect(mockApp.saveState).not.toHaveBeenCalled()
            expect(mockStorage.removeFromArchive).not.toHaveBeenCalled()
        })

        test('should not restore when user cancels', async () => {
            const archivedTask = {
                task: { id: 'archived-task', title: 'Archived Task' },
                originalStatus: 'completed',
                originalProjectId: 'project-1',
                archivedAt: new Date().toISOString()
            }

            mockStorage.getArchivedTasks.mockReturnValue([archivedTask])
            window.confirm = jest.fn(() => false)

            await archiveManager.restoreFromArchive('archived-task')

            expect(mockApp.saveState).not.toHaveBeenCalled()
            expect(mockStorage.removeFromArchive).not.toHaveBeenCalled()
        })
    })

    describe('deleteFromArchive', () => {
        test('should delete task from archive permanently', async () => {
            const archivedTask = {
                task: { id: 'archived-task', title: 'Archived Task' },
                originalStatus: 'completed',
                originalProjectId: 'project-1',
                archivedAt: new Date().toISOString()
            }

            mockStorage.getArchivedTasks.mockReturnValue([archivedTask])

            // Mock confirm to return true
            window.confirm = jest.fn(() => true)

            await archiveManager.deleteFromArchive('archived-task')

            expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Archived Task'))
            expect(mockApp.saveState).toHaveBeenCalledWith('Delete from archive')
            expect(mockStorage.removeFromArchive).toHaveBeenCalledWith('archived-task')
            expect(mockApp.showToast).toHaveBeenCalledWith(
                'Task "Archived Task" permanently deleted'
            )
        })

        test('should not delete non-existent task', async () => {
            mockStorage.getArchivedTasks.mockReturnValue([])

            await archiveManager.deleteFromArchive('non-existent')

            expect(mockApp.saveState).not.toHaveBeenCalled()
            expect(mockStorage.removeFromArchive).not.toHaveBeenCalled()
        })

        test('should not delete when user cancels', async () => {
            const archivedTask = {
                task: { id: 'archived-task', title: 'Archived Task' },
                originalStatus: 'completed',
                originalProjectId: 'project-1',
                archivedAt: new Date().toISOString()
            }

            mockStorage.getArchivedTasks.mockReturnValue([archivedTask])
            window.confirm = jest.fn(() => false)

            await archiveManager.deleteFromArchive('archived-task')

            expect(mockApp.saveState).not.toHaveBeenCalled()
            expect(mockStorage.removeFromArchive).not.toHaveBeenCalled()
        })
    })

    describe('renderArchive', () => {
        test('should render empty state when no archived tasks', () => {
            mockStorage.getArchivedTasks.mockReturnValue([])

            const mockContainer = document.createElement('div')
            mockContainer.id = 'archive-content'
            const mockCountSpan = document.createElement('span')
            mockCountSpan.id = 'archive-count'

            jest.spyOn(document, 'getElementById').mockImplementation((id) => {
                switch (id) {
                case 'archive-content':
                    return mockContainer
                case 'archive-count':
                    return mockCountSpan
                default:
                    return null
                }
            })

            archiveManager.renderArchive()

            expect(mockCountSpan.textContent).toBe('0')
            expect(mockContainer.innerHTML).toContain('No archived tasks')
        })

        test('should render archived tasks with filters', () => {
            const archivedTask = {
                task: {
                    id: 'archived-task',
                    title: 'Archived Task',
                    description: 'Task description',
                    contexts: ['@home'],
                    completed: true,
                    completedAt: new Date().toISOString()
                },
                originalStatus: 'completed',
                originalProjectId: 'project-1',
                archivedAt: new Date().toISOString()
            }

            mockStorage.getArchivedTasks.mockReturnValue([archivedTask])

            const mockContainer = document.createElement('div')
            mockContainer.id = 'archive-content'
            const mockCountSpan = document.createElement('span')
            mockCountSpan.id = 'archive-count'
            const mockProjectFilter = document.createElement('select')
            mockProjectFilter.id = 'archive-filter-project'
            mockProjectFilter.value = ''

            jest.spyOn(document, 'getElementById').mockImplementation((id) => {
                switch (id) {
                case 'archive-content':
                    return mockContainer
                case 'archive-count':
                    return mockCountSpan
                case 'archive-filter-project':
                    return mockProjectFilter
                default:
                    return null
                }
            })

            // Mock getProjectTitle
            jest.spyOn(archiveManager as any, 'getProjectTitle').mockReturnValue('Test Project')

            archiveManager.renderArchive('archived')

            expect(mockCountSpan.textContent).toBe('1')
            expect(mockContainer.innerHTML).toContain('Archived Task')
            expect(mockContainer.innerHTML).toContain('Task description')
            expect(mockContainer.innerHTML).toContain('@home')
        })

        test('should handle missing container gracefully', () => {
            mockStorage.getArchivedTasks.mockReturnValue([])
            jest.spyOn(document, 'getElementById').mockReturnValue(null)

            expect(() => archiveManager.renderArchive()).not.toThrow()
        })
    })

    describe('getProjectTitle', () => {
        test('should return project title for valid project ID', () => {
            const title = archiveManager.getProjectTitle('project-1')
            expect(title).toBe('Test Project')
        })

        test('should return empty string for invalid project ID', () => {
            const title = archiveManager.getProjectTitle('non-existent')
            expect(title).toBe('')
        })
    })

    describe('getArchivedTasks', () => {
        test('should return archived tasks', () => {
            const archivedTasks = [{ id: 'task-1' }]
            mockStorage.getArchivedTasks.mockReturnValue(archivedTasks)

            const result = archiveManager.getArchivedTasks()
            expect(result).toBe(archivedTasks)
        })

        test('should return empty array when storage is not available', () => {
            const managerWithoutStorage = new ArchiveManager(mockState, {})
            const result = managerWithoutStorage.getArchivedTasks()
            expect(result).toEqual([])
        })
    })

    describe('getArchiveCount', () => {
        test('should return archive count', () => {
            mockStorage.getArchivedTasks.mockReturnValue([{ id: 'task-1' }, { id: 'task-2' }])

            const count = archiveManager.getArchiveCount()
            expect(count).toBe(2)
        })

        test('should return 0 when storage is not available', () => {
            const managerWithoutStorage = new ArchiveManager(mockState, {})
            const count = managerWithoutStorage.getArchiveCount()
            expect(count).toBe(0)
        })
    })

    describe('searchArchive', () => {
        test('should search archived tasks by title', () => {
            const archivedTasks = [
                {
                    task: {
                        id: 'task-1',
                        title: 'Buy groceries',
                        description: 'Milk and eggs',
                        contexts: ['@store']
                    },
                    originalStatus: 'completed',
                    originalProjectId: 'project-1',
                    archivedAt: new Date().toISOString()
                },
                {
                    task: {
                        id: 'task-2',
                        title: 'Write report',
                        description: 'Quarterly report',
                        contexts: ['@work']
                    },
                    originalStatus: 'completed',
                    originalProjectId: 'project-2',
                    archivedAt: new Date().toISOString()
                }
            ]

            mockStorage.getArchivedTasks.mockReturnValue(archivedTasks)

            const results = archiveManager.searchArchive('groceries')
            expect(results).toHaveLength(1)
            expect(results[0].task.title).toBe('Buy groceries')
        })

        test('should search archived tasks by description', () => {
            const archivedTasks = [
                {
                    task: {
                        id: 'task-1',
                        title: 'Buy groceries',
                        description: 'Milk and eggs',
                        contexts: ['@store']
                    },
                    originalStatus: 'completed',
                    originalProjectId: 'project-1',
                    archivedAt: new Date().toISOString()
                }
            ]

            mockStorage.getArchivedTasks.mockReturnValue(archivedTasks)

            const results = archiveManager.searchArchive('milk')
            expect(results).toHaveLength(1)
            expect(results[0].task.description).toBe('Milk and eggs')
        })

        test('should search archived tasks by context', () => {
            const archivedTasks = [
                {
                    task: {
                        id: 'task-1',
                        title: 'Buy groceries',
                        description: 'Milk and eggs',
                        contexts: ['@store']
                    },
                    originalStatus: 'completed',
                    originalProjectId: 'project-1',
                    archivedAt: new Date().toISOString()
                }
            ]

            mockStorage.getArchivedTasks.mockReturnValue(archivedTasks)

            const results = archiveManager.searchArchive('store')
            expect(results).toHaveLength(1)
            expect(results[0].task.contexts).toContain('@store')
        })

        test('should return empty array when storage is not available', () => {
            const managerWithoutStorage = new ArchiveManager(mockState, {})
            const results = managerWithoutStorage.searchArchive('test')
            expect(results).toEqual([])
        })
    })
})
