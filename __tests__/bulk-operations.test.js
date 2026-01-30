/**
 * Comprehensive Tests for Bulk Operations Feature
 */

import { GTDApp } from '../js/app.js'
import { BulkOperationsManager } from '../js/modules/features/bulk-operations.ts'

describe('BulkOperationsManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()

        mockState = {
            tasks: [],
            projects: [],
            bulkSelectionMode: false,
            selectedTaskIds: new Set()
        }

        mockApp = new GTDApp()
        // Mock renderView to avoid needing full DOM setup
        mockApp.renderView = jest.fn()
        mockApp.renderProjectsDropdown = jest.fn()
        mockApp.updateCounts = jest.fn()

        manager = new BulkOperationsManager(mockState, mockApp)
    })

    test('should initialize with bulk selection mode disabled', () => {
        expect(manager.state.bulkSelectionMode).toBe(false)
    })

    test('should initialize with empty selected task IDs', () => {
        expect(manager.state.selectedTaskIds.size).toBe(0)
    })
})

describe('BulkOperationsManager - Mode Toggle', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create required DOM elements
        const bulkSelectBtn = document.createElement('button')
        bulkSelectBtn.id = 'btn-bulk-select'
        document.body.appendChild(bulkSelectBtn)

        const bulkActionsBar = document.createElement('div')
        bulkActionsBar.id = 'bulk-actions-bar'
        bulkActionsBar.style.display = 'none'
        document.body.appendChild(bulkActionsBar)

        const bulkCompleteBtn = document.createElement('button')
        bulkCompleteBtn.id = 'btn-bulk-complete'
        document.body.appendChild(bulkCompleteBtn)

        const bulkCancelBtn = document.createElement('button')
        bulkCancelBtn.id = 'btn-bulk-cancel'
        document.body.appendChild(bulkCancelBtn)

        const bulkSelectedCount = document.createElement('span')
        bulkSelectedCount.id = 'bulk-selected-count'
        document.body.appendChild(bulkSelectedCount)

        mockState = {
            tasks: [],
            projects: [],
            bulkSelectionMode: false,
            selectedTaskIds: new Set()
        }

        mockApp = new GTDApp()
        // Mock renderView to avoid needing full DOM setup
        mockApp.renderView = jest.fn()
        mockApp.renderProjectsDropdown = jest.fn()
        mockApp.updateCounts = jest.fn()

        manager = new BulkOperationsManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('toggleBulkSelectionMode()', () => {
        test('should enable bulk selection mode when disabled', () => {
            manager.toggleBulkSelectionMode()

            expect(manager.state.bulkSelectionMode).toBe(true)

            const bulkActionsBar = document.getElementById('bulk-actions-bar')
            expect(bulkActionsBar.style.display).toBe('flex')
        })

        test('should disable bulk selection mode when enabled', () => {
            manager.state.bulkSelectionMode = true
            manager.toggleBulkSelectionMode()

            expect(manager.state.bulkSelectionMode).toBe(false)

            const bulkActionsBar = document.getElementById('bulk-actions-bar')
            expect(bulkActionsBar.style.display).toBe('none')
        })

        test('should update button text when entering mode', () => {
            manager.toggleBulkSelectionMode()

            const bulkSelectBtn = document.getElementById('btn-bulk-select')
            expect(bulkSelectBtn.innerHTML).toContain('Exit Selection')
        })

        test('should clear selected tasks when exiting mode', () => {
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            manager.state.bulkSelectionMode = true

            manager.toggleBulkSelectionMode()

            expect(manager.state.selectedTaskIds.size).toBe(0)
        })
    })

    describe('exitBulkSelectionMode()', () => {
        test('should disable bulk selection mode', () => {
            manager.state.bulkSelectionMode = true
            manager.exitBulkSelectionMode()

            expect(manager.state.bulkSelectionMode).toBe(false)
        })

        test('should clear selected task IDs', () => {
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')

            manager.exitBulkSelectionMode()

            expect(manager.state.selectedTaskIds.size).toBe(0)
        })

        test('should hide bulk actions bar', () => {
            manager.state.bulkSelectionMode = true

            manager.exitBulkSelectionMode()

            const bulkActionsBar = document.getElementById('bulk-actions-bar')
            expect(bulkActionsBar.style.display).toBe('none')
        })

        test('should reset button text', () => {
            manager.exitBulkSelectionMode()

            const bulkSelectBtn = document.getElementById('btn-bulk-select')
            expect(bulkSelectBtn.innerHTML).toContain('Select Multiple')
        })

        test('should update selected count display', () => {
            manager.state.selectedTaskIds.add('task1')

            manager.exitBulkSelectionMode()

            const bulkSelectedCount = document.getElementById('bulk-selected-count')
            expect(bulkSelectedCount.textContent).toBe('0')
        })
    })
})

describe('BulkOperationsManager - Task Selection', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [
                { id: 'task1', title: 'Task 1', completed: false },
                { id: 'task2', title: 'Task 2', completed: false },
                { id: 'task3', title: 'Task 3', completed: false }
            ],
            projects: [],
            bulkSelectionMode: false,
            selectedTaskIds: new Set()
        }

        mockApp = new GTDApp()
        // Mock renderView to avoid needing full DOM setup
        mockApp.renderView = jest.fn()
        mockApp.renderProjectsDropdown = jest.fn()
        mockApp.updateCounts = jest.fn()

        manager = new BulkOperationsManager(mockState, mockApp)
    })

    describe('toggleBulkTaskSelection()', () => {
        test('should add task to selection when not selected', () => {
            manager.toggleBulkTaskSelection('task1')

            expect(manager.state.selectedTaskIds.has('task1')).toBe(true)
        })

        test('should remove task from selection when already selected', () => {
            manager.state.selectedTaskIds.add('task1')

            manager.toggleBulkTaskSelection('task1')

            expect(manager.state.selectedTaskIds.has('task1')).toBe(false)
        })

        test('should update selected count after toggle', () => {
            document.body.innerHTML = ''
            const bulkSelectedCount = document.createElement('span')
            bulkSelectedCount.id = 'bulk-selected-count'
            document.body.appendChild(bulkSelectedCount)

            manager.toggleBulkTaskSelection('task1')

            expect(bulkSelectedCount.textContent).toBe('1')
        })
    })

    describe('updateBulkSelectedCount()', () => {
        beforeEach(() => {
            document.body.innerHTML = ''

            const bulkSelectedCount = document.createElement('span')
            bulkSelectedCount.id = 'bulk-selected-count'
            document.body.appendChild(bulkSelectedCount)

            const bulkCompleteBtn = document.createElement('button')
            bulkCompleteBtn.id = 'btn-bulk-complete'
            document.body.appendChild(bulkCompleteBtn)
        })

        test('should update count display', () => {
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')

            manager.updateBulkSelectedCount()

            const bulkSelectedCount = document.getElementById('bulk-selected-count')
            expect(bulkSelectedCount.textContent).toBe('2')
        })

        test('should disable complete button when no tasks selected', () => {
            manager.updateBulkSelectedCount()

            const bulkCompleteBtn = document.getElementById('btn-bulk-complete')
            expect(bulkCompleteBtn.disabled).toBe(true)
            expect(bulkCompleteBtn.style.opacity).toBe('0.5')
        })

        test('should enable complete button when tasks selected', () => {
            manager.state.selectedTaskIds.add('task1')

            manager.updateBulkSelectedCount()

            const bulkCompleteBtn = document.getElementById('btn-bulk-complete')
            expect(bulkCompleteBtn.disabled).toBe(false)
            expect(bulkCompleteBtn.style.opacity).toBe('1')
        })
    })

    describe('bulkSelectAllVisible()', () => {
        beforeEach(() => {
            document.body.innerHTML = ''

            for (let i = 1; i <= 3; i++) {
                const taskItem = document.createElement('div')
                taskItem.className = 'task-item'
                taskItem.dataset.taskId = `task${i}`

                const checkbox = document.createElement('input')
                checkbox.type = 'checkbox'
                checkbox.className = 'bulk-select-checkbox'
                taskItem.appendChild(checkbox)

                document.body.appendChild(taskItem)
            }
        })

        test('should select all visible tasks', () => {
            manager.bulkSelectAllVisible()

            expect(manager.state.selectedTaskIds.size).toBe(3)
            expect(manager.state.selectedTaskIds.has('task1')).toBe(true)
            expect(manager.state.selectedTaskIds.has('task2')).toBe(true)
            expect(manager.state.selectedTaskIds.has('task3')).toBe(true)
        })

        test('should check all checkboxes', () => {
            manager.bulkSelectAllVisible()

            const checkboxes = document.querySelectorAll('.bulk-select-checkbox')
            checkboxes.forEach((cb) => {
                expect(cb.checked).toBe(true)
            })
        })

        test('should update count display', () => {
            const bulkSelectedCount = document.createElement('span')
            bulkSelectedCount.id = 'bulk-selected-count'
            document.body.appendChild(bulkSelectedCount)

            manager.bulkSelectAllVisible()

            expect(bulkSelectedCount.textContent).toBe('3')
        })
    })
})

describe('BulkOperationsManager - Bulk Actions', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()

        mockState = {
            tasks: [
                { id: 'task1', title: 'Task 1', completed: false, status: 'inbox' },
                { id: 'task2', title: 'Task 2', completed: false, status: 'inbox' },
                { id: 'task3', title: 'Task 3', completed: false, status: 'inbox' }
            ],
            projects: [
                { id: 'proj1', title: 'Project 1' },
                { id: 'proj2', title: 'Project 2' }
            ],
            bulkSelectionMode: false,
            selectedTaskIds: new Set()
        }

        mockApp = new GTDApp()
        // Mock renderView to avoid needing full DOM setup
        mockApp.renderView = jest.fn()
        mockApp.renderProjectsDropdown = jest.fn()
        mockApp.updateCounts = jest.fn()

        manager = new BulkOperationsManager(mockState, mockApp)

        // Mock app methods
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined)
        mockApp.renderView = jest.fn()
        mockApp.updateCounts = jest.fn()
        mockApp.renderProjectsDropdown = jest.fn()
        mockApp.showToast = jest.fn()
        mockApp.saveState = jest.fn()
    })

    describe('bulkCompleteTasks()', () => {
        beforeEach(() => {
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
        })

        test('should complete all selected tasks', async () => {
            await manager.bulkCompleteTasks()

            expect(mockState.tasks[0].completed).toBe(true)
            expect(mockState.tasks[1].completed).toBe(true)
            expect(mockState.tasks[2].completed).toBe(false)
        })

        test('should set completion timestamp', async () => {
            await manager.bulkCompleteTasks()

            expect(mockState.tasks[0].completedAt).toBeDefined()
            expect(mockState.tasks[1].completedAt).toBeDefined()
        })

        test('should persist changes', async () => {
            await manager.bulkCompleteTasks()

            expect(mockApp.saveTasks).toHaveBeenCalled()
        })

        test('should exit bulk selection mode', async () => {
            manager.state.bulkSelectionMode = true

            await manager.bulkCompleteTasks()

            expect(manager.state.bulkSelectionMode).toBe(false)
        })

        test('should show toast notification', async () => {
            await manager.bulkCompleteTasks()

            expect(mockApp.showToast).toHaveBeenCalledWith('2 task(s) completed')
        })

        test('should not modify already completed tasks', async () => {
            mockState.tasks[0].completed = true

            await manager.bulkCompleteTasks()

            expect(mockState.tasks[1].completed).toBe(true)
        })
    })

    describe('bulkSetStatus()', () => {
        beforeEach(() => {
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            global.prompt = jest.fn()
        })

        afterEach(() => {
            global.prompt.mockRestore()
        })

        test('should set status for all selected tasks', async () => {
            global.prompt.mockReturnValue('next')

            await manager.bulkSetStatus()

            expect(mockState.tasks[0].status).toBe('next')
            expect(mockState.tasks[1].status).toBe('next')
            expect(mockState.tasks[2].status).toBe('inbox')
        })

        test('should validate status input', async () => {
            global.prompt.mockReturnValue('invalid')

            await manager.bulkSetStatus()

            expect(mockApp.showToast).toHaveBeenCalledWith('Invalid status')
            expect(mockState.tasks[0].status).toBe('inbox')
        })

        test('should accept valid statuses', async () => {
            // Test inbox status
            global.prompt.mockReturnValue('inbox')
            await manager.bulkSetStatus()
            expect(mockState.tasks[0].status).toBe('inbox')

            // Reset and test next status
            mockState.tasks[0].status = 'inbox'
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            global.prompt.mockReturnValue('next')
            await manager.bulkSetStatus()
            expect(mockState.tasks[0].status).toBe('next')

            // Reset and test waiting status
            mockState.tasks[0].status = 'inbox'
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            global.prompt.mockReturnValue('waiting')
            await manager.bulkSetStatus()
            expect(mockState.tasks[0].status).toBe('waiting')

            // Reset and test someday status
            mockState.tasks[0].status = 'inbox'
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            global.prompt.mockReturnValue('someday')
            await manager.bulkSetStatus()
            expect(mockState.tasks[0].status).toBe('someday')
        })

        test('should update timestamp', async () => {
            global.prompt.mockReturnValue('next')

            await manager.bulkSetStatus()

            expect(mockState.tasks[0].updatedAt).toBeDefined()
        })

        test('should save state for undo', async () => {
            global.prompt.mockReturnValue('next')

            await manager.bulkSetStatus()

            expect(mockApp.saveState).toHaveBeenCalledWith('Bulk set status')
        })
    })

    describe('bulkSetEnergy()', () => {
        beforeEach(() => {
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            global.prompt = jest.fn()
        })

        afterEach(() => {
            global.prompt.mockRestore()
        })

        test('should set energy for all selected tasks', async () => {
            global.prompt.mockReturnValue('high')

            await manager.bulkSetEnergy()

            expect(mockState.tasks[0].energy).toBe('high')
            expect(mockState.tasks[1].energy).toBe('high')
        })

        test('should clear energy when empty string provided', async () => {
            mockState.tasks[0].energy = 'high'

            global.prompt.mockReturnValue('')

            await manager.bulkSetEnergy()

            expect(mockState.tasks[0].energy).toBe('')
        })

        test('should validate energy input', async () => {
            global.prompt.mockReturnValue('invalid')

            await manager.bulkSetEnergy()

            expect(mockApp.showToast).toHaveBeenCalledWith('Invalid energy level')
        })

        test('should accept valid energy levels', async () => {
            // Test high energy
            global.prompt.mockReturnValue('high')
            await manager.bulkSetEnergy()
            expect(mockState.tasks[0].energy).toBe('high')

            // Reset and test medium energy
            mockState.tasks[0].energy = ''
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            global.prompt.mockReturnValue('medium')
            await manager.bulkSetEnergy()
            expect(mockState.tasks[0].energy).toBe('medium')

            // Reset and test low energy
            mockState.tasks[0].energy = ''
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            global.prompt.mockReturnValue('low')
            await manager.bulkSetEnergy()
            expect(mockState.tasks[0].energy).toBe('low')
        })
    })

    describe('bulkSetProject()', () => {
        beforeEach(() => {
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            global.prompt = jest.fn()
        })

        afterEach(() => {
            global.prompt.mockRestore()
        })

        test('should set project for selected tasks', async () => {
            global.prompt.mockReturnValue('1') // First project

            await manager.bulkSetProject()

            expect(mockState.tasks[0].projectId).toBe('proj1')
            expect(mockState.tasks[1].projectId).toBe('proj1')
        })

        test('should remove project when 0 selected', async () => {
            mockState.tasks[0].projectId = 'proj1'

            global.prompt.mockReturnValue('0')

            await manager.bulkSetProject()

            expect(mockState.tasks[0].projectId).toBeNull()
        })

        test('should update timestamp', async () => {
            global.prompt.mockReturnValue('1')

            await manager.bulkSetProject()

            expect(mockState.tasks[0].updatedAt).toBeDefined()
        })
    })

    describe('bulkAddContext()', () => {
        beforeEach(() => {
            manager.state.selectedTaskIds.add('task1')
            global.prompt = jest.fn()
        })

        afterEach(() => {
            global.prompt.mockRestore()
        })

        test('should add context to task', async () => {
            global.prompt.mockReturnValue('work')

            await manager.bulkAddContext()

            expect(mockState.tasks[0].contexts).toContain('@work')
        })

        test('should add @ prefix if not present', async () => {
            global.prompt.mockReturnValue('home')

            await manager.bulkAddContext()

            expect(mockState.tasks[0].contexts).toContain('@home')
        })

        test('should not duplicate existing contexts', async () => {
            mockState.tasks[0].contexts = ['@work']

            global.prompt.mockReturnValue('work')

            await manager.bulkAddContext()

            expect(mockState.tasks[0].contexts.filter((c) => c === '@work').length).toBe(1)
        })

        test('should handle multiple tasks', async () => {
            manager.state.selectedTaskIds.add('task2')

            global.prompt.mockReturnValue('office')

            await manager.bulkAddContext()

            expect(mockState.tasks[0].contexts).toContain('@office')
            expect(mockState.tasks[1].contexts).toContain('@office')
        })
    })

    describe('bulkSetDueDate()', () => {
        beforeEach(() => {
            manager.state.selectedTaskIds.add('task1')
            global.prompt = jest.fn()
        })

        afterEach(() => {
            global.prompt.mockRestore()
        })

        test('should set exact date', async () => {
            const date = '2026-12-25'
            global.prompt.mockReturnValue(date)

            await manager.bulkSetDueDate()

            expect(mockState.tasks[0].dueDate).toBe(date)
        })

        test('should parse "today"', async () => {
            global.prompt.mockReturnValue('today')

            await manager.bulkSetDueDate()

            const today = new Date().toISOString().split('T')[0]
            expect(mockState.tasks[0].dueDate).toBe(today)
        })

        test('should parse "tomorrow"', async () => {
            global.prompt.mockReturnValue('tomorrow')

            await manager.bulkSetDueDate()

            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const expected = tomorrow.toISOString().split('T')[0]
            expect(mockState.tasks[0].dueDate).toBe(expected)
        })

        test('should parse "in X days"', async () => {
            global.prompt.mockReturnValue('in 5 days')

            await manager.bulkSetDueDate()

            const expectedDate = new Date()
            expectedDate.setDate(expectedDate.getDate() + 5)
            expect(mockState.tasks[0].dueDate).toBe(expectedDate.toISOString().split('T')[0])
        })

        test('should parse "in X weeks"', async () => {
            global.prompt.mockReturnValue('in 2 weeks')

            await manager.bulkSetDueDate()

            const expectedDate = new Date()
            expectedDate.setDate(expectedDate.getDate() + 14)
            expect(mockState.tasks[0].dueDate).toBe(expectedDate.toISOString().split('T')[0])
        })
    })

    describe('bulkDeleteTasks()', () => {
        beforeEach(() => {
            manager.state.selectedTaskIds.add('task1')
            manager.state.selectedTaskIds.add('task2')
            global.confirm = jest.fn()
        })

        afterEach(() => {
            global.confirm.mockRestore()
        })

        test('should delete selected tasks when confirmed', async () => {
            global.confirm.mockReturnValue(true)

            await manager.bulkDeleteTasks()

            expect(mockState.tasks.length).toBe(1)
            expect(mockState.tasks.find((t) => t.id === 'task1')).toBeUndefined()
            expect(mockState.tasks.find((t) => t.id === 'task2')).toBeUndefined()
        })

        test('should not delete when cancelled', async () => {
            global.confirm.mockReturnValue(false)

            await manager.bulkDeleteTasks()

            expect(mockState.tasks.length).toBe(3)
        })

        test('should save state for undo', async () => {
            global.confirm.mockReturnValue(true)

            await manager.bulkDeleteTasks()

            expect(mockApp.saveState).toHaveBeenCalledWith('Bulk delete tasks')
        })

        test('should persist changes', async () => {
            global.confirm.mockReturnValue(true)

            await manager.bulkDeleteTasks()

            expect(mockApp.saveTasks).toHaveBeenCalled()
        })

        test('should show toast notification', async () => {
            global.confirm.mockReturnValue(true)

            await manager.bulkDeleteTasks()

            expect(mockApp.showToast).toHaveBeenCalledWith('2 task(s) deleted')
        })
    })
})

describe('BulkOperationsManager - Button Visibility', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = ''
        localStorage.clear()

        // Create bulk select button
        const bulkSelectBtn = document.createElement('button')
        bulkSelectBtn.id = 'btn-bulk-select'
        document.body.appendChild(bulkSelectBtn)

        mockState = {
            tasks: [],
            projects: [],
            bulkSelectionMode: false,
            selectedTaskIds: new Set()
        }

        mockApp = new GTDApp()
        // Mock renderView to avoid needing full DOM setup
        mockApp.renderView = jest.fn()
        mockApp.renderProjectsDropdown = jest.fn()
        mockApp.updateCounts = jest.fn()

        manager = new BulkOperationsManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('updateBulkSelectButtonVisibility()', () => {
        test('should show button when there are tasks', () => {
            for (let i = 1; i <= 3; i++) {
                const taskItem = document.createElement('div')
                taskItem.className = 'task-item'
                document.body.appendChild(taskItem)
            }

            manager.updateBulkSelectButtonVisibility()

            const bulkSelectBtn = document.getElementById('btn-bulk-select')
            expect(bulkSelectBtn.style.display).toBe('block')
        })

        test('should hide button when there are no tasks', () => {
            manager.updateBulkSelectButtonVisibility()

            const bulkSelectBtn = document.getElementById('btn-bulk-select')
            expect(bulkSelectBtn.style.display).toBe('none')
        })

        test('should update when task count changes', () => {
            manager.updateBulkSelectButtonVisibility()
            let bulkSelectBtn = document.getElementById('btn-bulk-select')
            expect(bulkSelectBtn.style.display).toBe('none')

            const taskItem = document.createElement('div')
            taskItem.className = 'task-item'
            document.body.appendChild(taskItem)

            manager.updateBulkSelectButtonVisibility()
            bulkSelectBtn = document.getElementById('btn-bulk-select')
            expect(bulkSelectBtn.style.display).toBe('block')
        })
    })
})
