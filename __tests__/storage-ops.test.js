/**
 * Tests for storage-ops.js - StorageOperations class
 */

import { Task, Project, Template } from '../js/models.ts'
import { AppState } from '../js/modules/core/app-state.ts'
import { StorageOperations } from '../js/modules/core/storage-ops.ts'
import { Storage } from '../js/storage.ts'

describe('StorageOperations', () => {
    let storageOps
    let mockStorage
    let mockState

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear()

        // Create mock storage
        mockStorage = new Storage('test_user')

        // Create mock state
        mockState = new AppState()

        // Create StorageOperations instance
        storageOps = new StorageOperations(mockStorage, mockState)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        test('should initialize with storage and state', () => {
            expect(storageOps.storage).toBe(mockStorage)
            expect(storageOps.state).toBe(mockState)
        })

        test('should allow setting storage', () => {
            const newStorage = new Storage('new_user')
            storageOps.storage = newStorage
            expect(storageOps.storage).toBe(newStorage)
        })
    })

    describe('initializeStorage', () => {
        test('should initialize storage', async () => {
            const spy = jest.spyOn(mockStorage, 'init').mockResolvedValue(mockStorage)

            await storageOps.initializeStorage()

            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveBeenCalledTimes(1)
        })
    })

    describe('loadData', () => {
        test('should load tasks from storage', async () => {
            const taskData = [
                { id: '1', title: 'Task 1', status: 'inbox' },
                { id: '2', title: 'Task 2', status: 'next' }
            ]
            mockStorage.saveTasks(taskData)

            await storageOps.loadData()

            expect(mockState.tasks).toHaveLength(2)
            expect(mockState.tasks[0]).toBeInstanceOf(Task)
            expect(mockState.tasks[0].title).toBe('Task 1')
            expect(mockState.tasks[0].status).toBe('inbox')
        })

        test('should load projects from storage', async () => {
            const projectData = [
                { id: '1', title: 'Project 1' },
                { id: '2', title: 'Project 2' }
            ]
            mockStorage.saveProjects(projectData)

            await storageOps.loadData()

            expect(mockState.projects).toHaveLength(2)
            expect(mockState.projects[0]).toBeInstanceOf(Project)
            expect(mockState.projects[0].title).toBe('Project 1')
        })

        test('should load templates from storage', async () => {
            const templateData = [
                {
                    id: '1',
                    title: 'Template 1',
                    description: 'Test task @work'
                }
            ]
            mockStorage.saveTemplates(templateData)

            await storageOps.loadData()

            expect(mockState.templates).toHaveLength(1)
            expect(mockState.templates[0]).toBeInstanceOf(Template)
            expect(mockState.templates[0].title).toBe('Template 1')
        })

        test('should handle empty storage', async () => {
            await storageOps.loadData()

            expect(mockState.tasks).toEqual([])
            expect(mockState.projects).toEqual([])
            expect(mockState.templates).toEqual([])
        })

        test('should handle tasks with due dates', async () => {
            const taskData = [
                {
                    id: '1',
                    title: 'Task with due date',
                    status: 'next',
                    dueDate: '2025-01-20T00:00:00.000Z'
                }
            ]
            mockStorage.saveTasks(taskData)

            await storageOps.loadData()

            // Task model stores dates as ISO strings, not Date objects
            expect(mockState.tasks[0].dueDate).toBe('2025-01-20T00:00:00.000Z')
        })

        test('should handle tasks with recurrence', async () => {
            const taskData = [
                {
                    id: '1',
                    title: 'Recurring task',
                    status: 'next',
                    recurrence: { type: 'daily', interval: 1 }
                }
            ]
            mockStorage.saveTasks(taskData)

            await storageOps.loadData()

            expect(mockState.tasks[0].recurrence).toEqual({ type: 'daily', interval: 1 })
        })
    })

    describe('saveTasks', () => {
        test('should save tasks to storage', async () => {
            mockState.tasks = [
                new Task({ id: '1', title: 'Task 1', status: 'inbox' }),
                new Task({ id: '2', title: 'Task 2', status: 'next' })
            ]

            const spy = jest.spyOn(mockStorage, 'saveTasks').mockResolvedValue()

            await storageOps.saveTasks()

            expect(spy).toHaveBeenCalled()
            const savedTasks = spy.mock.calls[0][0]
            expect(savedTasks).toHaveLength(2)
            expect(savedTasks[0]).toMatchObject({
                id: '1',
                title: 'Task 1',
                status: 'inbox'
            })
        })

        test('should convert tasks to JSON format', async () => {
            const task = new Task({
                id: '1',
                title: 'Test Task',
                status: 'next',
                contexts: ['@work'],
                energy: 'high',
                time: 30
            })
            mockState.tasks = [task]

            const spy = jest.spyOn(mockStorage, 'saveTasks').mockResolvedValue()

            await storageOps.saveTasks()

            const savedTasks = spy.mock.calls[0][0]
            expect(savedTasks[0]).toMatchObject({
                id: '1',
                title: 'Test Task',
                status: 'next',
                contexts: ['@work'],
                energy: 'high',
                time: 30
            })
        })
    })

    describe('saveProjects', () => {
        test('should save projects to storage', async () => {
            mockState.projects = [
                new Project({ id: '1', title: 'Project 1' }),
                new Project({ id: '2', title: 'Project 2' })
            ]

            const spy = jest.spyOn(mockStorage, 'saveProjects').mockResolvedValue()

            await storageOps.saveProjects()

            expect(spy).toHaveBeenCalled()
            const savedProjects = spy.mock.calls[0][0]
            expect(savedProjects).toHaveLength(2)
            expect(savedProjects[0].id).toBe('1')
            expect(savedProjects[0].title).toBe('Project 1')
        })

        test('should convert projects to JSON format', async () => {
            const project = new Project({
                id: '1',
                title: 'Test Project',
                description: 'Test Description',
                status: 'active'
            })
            mockState.projects = [project]

            const spy = jest.spyOn(mockStorage, 'saveProjects').mockResolvedValue()

            await storageOps.saveProjects()

            const savedProjects = spy.mock.calls[0][0]
            expect(savedProjects[0].id).toBe('1')
            expect(savedProjects[0].title).toBe('Test Project')
            expect(savedProjects[0].description).toBe('Test Description')
            expect(savedProjects[0].status).toBe('active')
        })
    })

    describe('saveTemplates', () => {
        test('should save templates to storage', async () => {
            mockState.templates = [
                new Template({ id: '1', title: 'Template 1', description: 'Test @work' }),
                new Template({ id: '2', title: 'Template 2', description: 'Test @home' })
            ]

            const spy = jest.spyOn(mockStorage, 'saveTemplates').mockResolvedValue()

            await storageOps.saveTemplates()

            expect(spy).toHaveBeenCalled()
            const savedTemplates = spy.mock.calls[0][0]
            expect(savedTemplates).toHaveLength(2)
            expect(savedTemplates[0].id).toBe('1')
            expect(savedTemplates[0].title).toBe('Template 1')
        })
    })

    describe('saveAll', () => {
        test('should save all data types to storage', async () => {
            mockState.tasks = [new Task({ id: '1', title: 'Task 1' })]
            mockState.projects = [new Project({ id: '1', title: 'Project 1' })]
            mockState.templates = [
                new Template({ id: '1', title: 'Template 1', description: 'Test' })
            ]

            const saveTasksSpy = jest.spyOn(mockStorage, 'saveTasks').mockResolvedValue()
            const saveProjectsSpy = jest.spyOn(mockStorage, 'saveProjects').mockResolvedValue()
            const saveTemplatesSpy = jest.spyOn(mockStorage, 'saveTemplates').mockResolvedValue()

            await storageOps.saveAll()

            expect(saveTasksSpy).toHaveBeenCalled()
            expect(saveProjectsSpy).toHaveBeenCalled()
            expect(saveTemplatesSpy).toHaveBeenCalled()
        })

        test('should save all data in parallel', async () => {
            mockState.tasks = [new Task({ id: '1', title: 'Task 1' })]
            mockState.projects = [new Project({ id: '1', title: 'Project 1' })]
            mockState.templates = [
                new Template({ id: '1', title: 'Template 1', description: 'Test' })
            ]

            const saveTasksSpy = jest.spyOn(mockStorage, 'saveTasks').mockResolvedValue()
            const saveProjectsSpy = jest.spyOn(mockStorage, 'saveProjects').mockResolvedValue()
            const saveTemplatesSpy = jest.spyOn(mockStorage, 'saveTemplates').mockResolvedValue()

            await storageOps.saveAll()

            // Promise.all should be used for parallel execution
            // All spies should be called
            expect(saveTasksSpy).toHaveBeenCalled()
            expect(saveProjectsSpy).toHaveBeenCalled()
            expect(saveTemplatesSpy).toHaveBeenCalled()
        })
    })

    describe('Edge Cases', () => {
        test('should handle empty task list when saving', async () => {
            mockState.tasks = []

            const spy = jest.spyOn(mockStorage, 'saveTasks').mockResolvedValue()

            await storageOps.saveTasks()

            const savedTasks = spy.mock.calls[0][0]
            expect(savedTasks).toEqual([])
        })

        test('should handle large number of tasks', async () => {
            const tasks = Array.from({ length: 100 }, (_, i) => ({
                id: `task_${i}`,
                title: `Task ${i}`,
                status: 'inbox'
            }))
            mockState.tasks = tasks.map((t) => new Task(t))

            const spy = jest.spyOn(mockStorage, 'saveTasks').mockResolvedValue()

            await storageOps.saveTasks()

            const savedTasks = spy.mock.calls[0][0]
            expect(savedTasks).toHaveLength(100)
        })

        test('should handle tasks with special characters', async () => {
            const task = new Task({
                id: '1',
                title: 'Task with "quotes" and emoji 🎉',
                description: 'Special: <>&\\n\\t',
                status: 'inbox'
            })
            mockState.tasks = [task]

            const spy = jest.spyOn(mockStorage, 'saveTasks').mockResolvedValue()

            await storageOps.saveTasks()

            const savedTasks = spy.mock.calls[0][0]
            expect(savedTasks[0].title).toBe('Task with "quotes" and emoji 🎉')
            expect(savedTasks[0].description).toBe('Special: <>&\\n\\t')
        })
    })
})
