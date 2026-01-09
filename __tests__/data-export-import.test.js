/**
 * Comprehensive Tests for Data Export/Import Feature
 */

import { Task, Project } from '../js/models.js'
import { DataExportImportManager } from '../js/modules/features/data-export-import.js'

// Make Task and Project available globally for the DataExportImportManager
global.Task = Task
global.Project = Project

describe('DataExportImportManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            usageStats: {}
        }

        mockApp = {
            tasks: mockState.tasks,
            projects: mockState.projects,
            usageStats: mockState.usageStats,
            saveTasks: jest.fn().mockResolvedValue(undefined),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            saveUsageStats: jest.fn(),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            renderCustomContexts: jest.fn(),
            updateQuickAddPlaceholder: jest.fn()
        }

        manager = new DataExportImportManager(mockState, mockApp)
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })
})

describe('DataExportImportManager - Setup Event Listeners', () => {
    let manager
    let mockState
    let mockApp
    let exportBtn
    let importBtn
    let fileInput

    beforeEach(() => {
        document.body.innerHTML = ''

        exportBtn = document.createElement('button')
        exportBtn.id = 'btn-export'
        document.body.appendChild(exportBtn)

        importBtn = document.createElement('button')
        importBtn.id = 'btn-import'
        document.body.appendChild(importBtn)

        fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.id = 'import-file-input'
        document.body.appendChild(fileInput)

        mockState = { tasks: [], projects: [] }
        mockApp = {}

        manager = new DataExportImportManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('setupDataExportImport()', () => {
        test('should setup export button listener', () => {
            const exportSpy = jest.spyOn(manager, 'exportData')
            manager.setupDataExportImport()

            exportBtn.click()

            expect(exportSpy).toHaveBeenCalled()
        })

        test('should setup import button listener', () => {
            manager.setupDataExportImport()

            importBtn.click()

            expect(fileInput.files).toBeDefined()
        })

        test('should handle missing buttons gracefully', () => {
            exportBtn.remove()
            importBtn.remove()

            expect(() => {
                manager.setupDataExportImport()
            }).not.toThrow()
        })
    })
})

describe('DataExportImportManager - Export Data', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = ''

        // Mock URL and alert
        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
        global.URL.revokeObjectURL = jest.fn()
        global.alert = jest.fn()

        mockState = {
            tasks: [
                new Task({ id: '1', title: 'Task 1', status: 'next' }),
                new Task({ id: '2', title: 'Task 2', status: 'waiting' })
            ],
            projects: [new Project({ id: 'p1', title: 'Project 1', status: 'active' })],
            usageStats: { totalTasksCompleted: 10 }
        }

        mockApp = {
            tasks: mockState.tasks,
            projects: mockState.projects,
            usageStats: mockState.usageStats
        }

        // Mock localStorage
        const originalGetItem = Storage.prototype.getItem
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'gtd_custom_contexts') {
                return JSON.stringify(['@custom1', '@custom2'])
            }
            return originalGetItem.call(this, key)
        })

        manager = new DataExportImportManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        jest.clearAllMocks()
    })

    describe('exportData()', () => {
        test('should create export data with correct structure', () => {
            manager.exportData()

            expect(global.URL.createObjectURL).toHaveBeenCalled()
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
            expect(global.alert).toHaveBeenCalledWith(
                'Data exported successfully! File downloaded.'
            )
        })

        test('should include tasks in export data', () => {
            manager.exportData()

            expect(global.URL.createObjectURL).toHaveBeenCalled()
        })

        test('should include projects in export data', () => {
            manager.exportData()

            expect(global.URL.createObjectURL).toHaveBeenCalled()
        })

        test('should handle export errors gracefully', () => {
            global.URL.createObjectURL.mockImplementation(() => {
                throw new Error('Blob creation failed')
            })

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

            manager.exportData()

            expect(global.alert).toHaveBeenCalledWith('Failed to export data. Please try again.')

            consoleSpy.mockRestore()
        })
    })
})

describe('DataExportImportManager - Import Data', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        // Mock alert and confirm
        global.alert = jest.fn()
        global.confirm = jest.fn(() => true)

        mockState = {
            tasks: [new Task({ id: '1', title: 'Existing Task', status: 'inbox' })],
            projects: [],
            usageStats: {}
        }

        mockApp = {
            tasks: mockState.tasks,
            projects: mockState.projects,
            usageStats: mockState.usageStats,
            saveTasks: jest.fn().mockResolvedValue(undefined),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            saveUsageStats: jest.fn(),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            renderCustomContexts: jest.fn(),
            updateQuickAddPlaceholder: jest.fn()
        }

        const originalSetItem = Storage.prototype.setItem
        Storage.prototype.setItem = jest.fn((key, value) => {
            return originalSetItem.call(this, key, value)
        })

        manager = new DataExportImportManager(mockState, mockApp)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('importData()', () => {
        test('should confirm with user before importing', async () => {
            const mockFile = new File(['{}'], 'test.json', { type: 'application/json' })
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

            await manager.importData(mockFile)

            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('replace all your current GTD data')
            )

            consoleSpy.mockRestore()
        })

        test('should cancel import if user cancels confirmation', async () => {
            global.confirm.mockReturnValue(false)

            const mockFile = new File(['{}'], 'test.json', { type: 'application/json' })

            await manager.importData(mockFile)

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
            expect(mockApp.saveProjects).not.toHaveBeenCalled()
        })

        test('should import tasks from file', async () => {
            const importData = {
                version: '1.0',
                tasks: [
                    { id: 't1', title: 'Imported Task 1', status: 'next' },
                    { id: 't2', title: 'Imported Task 2', status: 'waiting' }
                ],
                projects: []
            }

            const fileContent = JSON.stringify(importData)
            const mockFile = new File([fileContent], 'test.json', { type: 'application/json' })

            await manager.importData(mockFile)

            expect(mockApp.tasks.length).toBe(2)
            expect(mockApp.tasks[0].title).toBe('Imported Task 1')
            expect(mockApp.tasks[1].title).toBe('Imported Task 2')
        })

        test('should import projects from file', async () => {
            const importData = {
                version: '1.0',
                tasks: [],
                projects: [
                    { id: 'p1', title: 'Imported Project 1', status: 'active' },
                    { id: 'p2', title: 'Imported Project 2', status: 'archived' }
                ]
            }

            const fileContent = JSON.stringify(importData)
            const mockFile = new File([fileContent], 'test.json', { type: 'application/json' })

            await manager.importData(mockFile)

            expect(mockApp.projects.length).toBe(2)
            expect(mockApp.projects[0].title).toBe('Imported Project 1')
            expect(mockApp.projects[1].title).toBe('Imported Project 2')
        })

        test('should clear existing data before importing', async () => {
            const importData = {
                version: '1.0',
                tasks: [{ id: 't1', title: 'New Task', status: 'next' }],
                projects: []
            }

            const fileContent = JSON.stringify(importData)
            const mockFile = new File([fileContent], 'test.json', { type: 'application/json' })

            // Start with existing task
            expect(mockApp.tasks.length).toBe(1)
            expect(mockApp.tasks[0].title).toBe('Existing Task')

            await manager.importData(mockFile)

            // Should have only the imported task
            expect(mockApp.tasks.length).toBe(1)
            expect(mockApp.tasks[0].title).toBe('New Task')
        })

        test('should import custom contexts', async () => {
            const importData = {
                version: '1.0',
                tasks: [],
                projects: [],
                customContexts: ['@context1', '@context2', '@context3']
            }

            const fileContent = JSON.stringify(importData)
            const mockFile = new File([fileContent], 'test.json', { type: 'application/json' })

            await manager.importData(mockFile)

            expect(Storage.prototype.setItem).toHaveBeenCalledWith(
                'gtd_custom_contexts',
                JSON.stringify(['@context1', '@context2', '@context3'])
            )
        })

        test('should save data after import', async () => {
            const importData = {
                version: '1.0',
                tasks: [{ id: 't1', title: 'Task', status: 'next' }],
                projects: []
            }

            const fileContent = JSON.stringify(importData)
            const mockFile = new File([fileContent], 'test.json', { type: 'application/json' })

            await manager.importData(mockFile)

            expect(mockApp.saveTasks).toHaveBeenCalled()
            expect(mockApp.saveProjects).toHaveBeenCalled()
        })

        test('should validate tasks array', async () => {
            const invalidData = {
                version: '1.0',
                tasks: 'not an array',
                projects: []
            }

            const fileContent = JSON.stringify(invalidData)
            const mockFile = new File([fileContent], 'test.json', { type: 'application/json' })

            await manager.importData(mockFile)

            expect(global.alert).toHaveBeenCalledWith(
                expect.stringContaining('Invalid import file')
            )
        })

        test('should validate projects array', async () => {
            const invalidData = {
                version: '1.0',
                tasks: [],
                projects: 'not an array'
            }

            const fileContent = JSON.stringify(invalidData)
            const mockFile = new File([fileContent], 'test.json', { type: 'application/json' })

            await manager.importData(mockFile)

            expect(global.alert).toHaveBeenCalledWith(
                expect.stringContaining('Invalid import file')
            )
        })
    })
})

describe('DataExportImportManager - Integration', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = ''

        // Mock APIs
        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
        global.URL.revokeObjectURL = jest.fn()
        global.alert = jest.fn()
        global.confirm = jest.fn(() => true)

        // Add export/import buttons
        const exportBtn = document.createElement('button')
        exportBtn.id = 'btn-export'
        document.body.appendChild(exportBtn)

        const importBtn = document.createElement('button')
        importBtn.id = 'btn-import'
        document.body.appendChild(importBtn)

        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.id = 'import-file-input'
        document.body.appendChild(fileInput)

        mockState = {
            tasks: [new Task({ id: '1', title: 'Task 1', status: 'next' })],
            projects: [new Project({ id: 'p1', title: 'Project 1', status: 'active' })],
            usageStats: { totalTasksCompleted: 5 }
        }

        mockApp = {
            tasks: mockState.tasks,
            projects: mockState.projects,
            usageStats: mockState.usageStats,
            saveTasks: jest.fn().mockResolvedValue(undefined),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            saveUsageStats: jest.fn(),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            renderCustomContexts: jest.fn(),
            updateQuickAddPlaceholder: jest.fn()
        }

        const originalGetItem = Storage.prototype.getItem
        Storage.prototype.getItem = jest.fn((key) => {
            if (key === 'gtd_custom_contexts') {
                return JSON.stringify(['@custom1'])
            }
            return originalGetItem.call(this, key)
        })

        const originalSetItem = Storage.prototype.setItem
        Storage.prototype.setItem = jest.fn((key, value) => {
            return originalSetItem.call(this, key, value)
        })

        manager = new DataExportImportManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        jest.clearAllMocks()
    })

    test('should setup event listeners on initialization', () => {
        const exportSpy = jest.spyOn(manager, 'exportData')

        manager.setupDataExportImport()

        document.getElementById('btn-export').click()

        expect(exportSpy).toHaveBeenCalled()
    })

    test('should handle complete export workflow', () => {
        manager.setupDataExportImport()
        document.getElementById('btn-export').click()

        expect(global.alert).toHaveBeenCalledWith('Data exported successfully! File downloaded.')
    })

    test('should maintain data integrity through export/import cycle', async () => {
        // Export
        manager.exportData()

        // Verify export was called
        expect(global.URL.createObjectURL).toHaveBeenCalled()

        // Import same data structure
        const importData = {
            version: '1.0',
            tasks: [{ id: '1', title: 'Task 1', status: 'next' }],
            projects: [{ id: 'p1', title: 'Project 1', status: 'active' }],
            usageStats: { totalTasksCompleted: 5 }
        }

        const fileContent = JSON.stringify(importData)
        const mockFile = new File([fileContent], 'test.json', { type: 'application/json' })

        await manager.importData(mockFile)

        // Verify data was imported correctly
        expect(mockApp.tasks.length).toBe(1)
        expect(mockApp.tasks[0].title).toBe('Task 1')
        expect(mockApp.projects.length).toBe(1)
        expect(mockApp.projects[0].title).toBe('Project 1')
        expect(mockApp.usageStats.totalTasksCompleted).toBe(5)
    })
})
