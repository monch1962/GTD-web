/**
 * Comprehensive Tests for Undo/Redo Manager
 */

import { Task, Project, Template } from '../js/models.ts'
import { UndoRedoManager } from '../js/modules/features/undo-redo.ts'

describe('UndoRedoManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }

        mockApp = {
            saveTasks: jest.fn().mockResolvedValue(undefined),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new UndoRedoManager(mockState, mockApp)
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })

    test('should initialize history array', () => {
        expect(manager.state.history).toEqual([])
    })

    test('should initialize historyIndex to -1', () => {
        expect(manager.state.historyIndex).toBe(-1)
    })

    test('should initialize maxHistorySize to 50', () => {
        expect(manager.state.maxHistorySize).toBe(50)
    })
})

describe('UndoRedoManager - setupUndoRedo()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = ''

        const undoBtn = document.createElement('button')
        undoBtn.id = 'btn-undo'
        document.body.appendChild(undoBtn)

        const redoBtn = document.createElement('button')
        redoBtn.id = 'btn-redo'
        document.body.appendChild(redoBtn)

        mockState = {
            tasks: [],
            projects: [],
            history: [],
            historyIndex: -1,
            maxHistorySize: 50
        }

        mockApp = {
            saveTasks: jest.fn().mockResolvedValue(undefined),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new UndoRedoManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should setup keyboard listener for Ctrl+Z (undo)', () => {
        const undoSpy = jest.spyOn(manager, 'undo')

        manager.setupUndoRedo()

        const event = new KeyboardEvent('keydown', {
            ctrlKey: true,
            key: 'z'
        })
        document.dispatchEvent(event)

        expect(undoSpy).toHaveBeenCalled()
    })

    test('should setup keyboard listener for Ctrl+Y (redo)', () => {
        const redoSpy = jest.spyOn(manager, 'redo')

        manager.setupUndoRedo()

        const event = new KeyboardEvent('keydown', {
            ctrlKey: true,
            key: 'y'
        })
        document.dispatchEvent(event)

        expect(redoSpy).toHaveBeenCalled()
    })

    test('should setup keyboard listener for Ctrl+Shift+Z (redo)', () => {
        const redoSpy = jest.spyOn(manager, 'redo')

        manager.setupUndoRedo()

        const event = new KeyboardEvent('keydown', {
            ctrlKey: true,
            shiftKey: true,
            key: 'z'
        })
        document.dispatchEvent(event)

        expect(redoSpy).toHaveBeenCalled()
    })

    test('should setup keyboard listener for Cmd+Z (undo on Mac)', () => {
        const undoSpy = jest.spyOn(manager, 'undo')

        manager.setupUndoRedo()

        const event = new KeyboardEvent('keydown', {
            metaKey: true,
            key: 'z'
        })
        document.dispatchEvent(event)

        expect(undoSpy).toHaveBeenCalled()
    })

    test('should setup undo button click listener', () => {
        // Create a mock implementation to track calls
        const undoMock = jest.fn()
        manager.undo = undoMock

        manager.setupUndoRedo()

        const undoBtn = document.getElementById('btn-undo')
        const clickEvent = new MouseEvent('click', { bubbles: true })
        undoBtn.dispatchEvent(clickEvent)

        expect(undoMock).toHaveBeenCalled()
    })

    test('should setup redo button click listener', () => {
        // Create a mock implementation to track calls
        const redoMock = jest.fn()
        manager.redo = redoMock

        manager.setupUndoRedo()

        const redoBtn = document.getElementById('btn-redo')
        const clickEvent = new MouseEvent('click', { bubbles: true })
        redoBtn.dispatchEvent(clickEvent)

        expect(redoMock).toHaveBeenCalled()
    })

    test('should update button states on setup', () => {
        manager.setupUndoRedo()

        const undoBtn = document.getElementById('btn-undo')
        const redoBtn = document.getElementById('btn-redo')

        expect(undoBtn.disabled).toBe(true)
        expect(redoBtn.disabled).toBe(true)
    })
})

describe('UndoRedoManager - saveState()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="btn-undo"></button>
            <button id="btn-redo"></button>
        `

        mockState = {
            tasks: [new Task({ id: '1', title: 'Task 1', status: 'inbox' })],
            projects: [new Project({ id: 'p1', title: 'Project 1', status: 'active' })],
            history: [],
            historyIndex: -1,
            maxHistorySize: 50
        }

        mockApp = {}

        manager = new UndoRedoManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should save state to history', () => {
        manager.saveState('Test action')

        expect(manager.state.history).toHaveLength(1)
        expect(manager.state.history[0].action).toBe('Test action')
    })

    test('should increment historyIndex', () => {
        manager.saveState('Test action')

        expect(manager.state.historyIndex).toBe(0)
    })

    test('should include timestamp', () => {
        manager.saveState('Test action')

        expect(manager.state.history[0].timestamp).toBeDefined()
    })

    test('should deep copy tasks', () => {
        manager.saveState('Test action')

        const savedTasks = manager.state.history[0].tasks
        savedTasks[0].title = 'Modified'

        expect(manager.state.tasks[0].title).toBe('Task 1')
    })

    test('should deep copy projects', () => {
        manager.saveState('Test action')

        const savedProjects = manager.state.history[0].projects
        savedProjects[0].title = 'Modified'

        expect(manager.state.projects[0].title).toBe('Project 1')
    })

    test('should truncate history when saving at index less than end', () => {
        manager.state.history = [
            { action: 'Action 1', tasks: [], projects: [], timestamp: new Date().toISOString() }
        ]
        manager.state.historyIndex = 0

        manager.saveState('Action 2')

        expect(manager.state.history).toHaveLength(2)
        expect(manager.state.historyIndex).toBe(1)
    })

    test('should limit history size to maxHistorySize', () => {
        manager.state.maxHistorySize = 3

        for (let i = 0; i < 5; i++) {
            manager.saveState(`Action ${i}`)
        }

        expect(manager.state.history).toHaveLength(3)
        expect(manager.state.history[0].action).toBe('Action 2')
        expect(manager.state.history[2].action).toBe('Action 4')
    })

    test('should update undo/redo buttons', () => {
        const updateSpy = jest.spyOn(manager, 'updateUndoRedoButtons')

        manager.saveState('Test action')

        expect(updateSpy).toHaveBeenCalled()
    })
})

describe('UndoRedoManager - undo()', () => {
    let manager
    let mockState
    let mockApp
    let task1
    let task2

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="btn-undo"></button>
            <button id="btn-redo"></button>
        `

        task1 = new Task({ id: '1', title: 'Task 1', status: 'inbox' })
        task2 = new Task({ id: '2', title: 'Task 2', status: 'next' })

        mockState = {
            tasks: [task2],
            projects: [],
            maxHistorySize: 50
        }

        mockApp = {
            saveTasks: jest.fn().mockResolvedValue(undefined),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new UndoRedoManager(mockState, mockApp)

        // Set up history AFTER construction (constructor resets it)
        manager.state.history = [
            {
                action: 'Action 1',
                tasks: [task1.toJSON()],
                projects: [],
                timestamp: new Date().toISOString()
            },
            {
                action: 'Action 2',
                tasks: [task2.toJSON()],
                projects: [],
                timestamp: new Date().toISOString()
            }
        ]
        manager.state.historyIndex = 1
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should restore previous state', async () => {
        await manager.undo()

        expect(manager.state.tasks).toHaveLength(1)
        expect(manager.state.tasks[0].id).toBe('1')
        expect(manager.state.tasks[0].title).toBe('Task 1')
    })

    test('should decrement historyIndex', async () => {
        await manager.undo()

        expect(manager.state.historyIndex).toBe(0)
    })

    test('should call saveTasks', async () => {
        await manager.undo()

        expect(mockApp.saveTasks).toHaveBeenCalled()
    })

    test('should call saveProjects', async () => {
        await manager.undo()

        expect(mockApp.saveProjects).toHaveBeenCalled()
    })

    test('should call renderView', async () => {
        await manager.undo()

        expect(mockApp.renderView).toHaveBeenCalled()
    })

    test('should call updateCounts', async () => {
        await manager.undo()

        expect(mockApp.updateCounts).toHaveBeenCalled()
    })

    test('should call renderProjectsDropdown', async () => {
        await manager.undo()

        expect(mockApp.renderProjectsDropdown).toHaveBeenCalled()
    })

    test('should show notification', async () => {
        await manager.undo()

        expect(mockApp.showNotification).toHaveBeenCalledWith('Undid: Action 1')
    })

    test('should return early when historyIndex <= 0', async () => {
        manager.state.historyIndex = 0

        await manager.undo()

        expect(mockApp.saveTasks).not.toHaveBeenCalled()
    })

    test('should update undo/redo buttons', async () => {
        await manager.undo()

        const undoBtn = document.getElementById('btn-undo')
        expect(undoBtn.disabled).toBe(true)
    })
})

describe('UndoRedoManager - redo()', () => {
    let manager
    let mockState
    let mockApp
    let task1
    let task2

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="btn-undo"></button>
            <button id="btn-redo"></button>
        `

        task1 = new Task({ id: '1', title: 'Task 1', status: 'inbox' })
        task2 = new Task({ id: '2', title: 'Task 2', status: 'next' })

        mockState = {
            tasks: [task1],
            projects: [],
            maxHistorySize: 50
        }

        mockApp = {
            saveTasks: jest.fn().mockResolvedValue(undefined),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new UndoRedoManager(mockState, mockApp)

        // Set up history AFTER construction (constructor resets it)
        manager.state.history = [
            {
                action: 'Action 1',
                tasks: [task1.toJSON()],
                projects: [],
                timestamp: new Date().toISOString()
            },
            {
                action: 'Action 2',
                tasks: [task2.toJSON()],
                projects: [],
                timestamp: new Date().toISOString()
            }
        ]
        manager.state.historyIndex = 0
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should restore next state', async () => {
        await manager.redo()

        expect(manager.state.tasks).toHaveLength(1)
        expect(manager.state.tasks[0].id).toBe('2')
        expect(manager.state.tasks[0].title).toBe('Task 2')
    })

    test('should increment historyIndex', async () => {
        await manager.redo()

        expect(manager.state.historyIndex).toBe(1)
    })

    test('should call saveTasks', async () => {
        await manager.redo()

        expect(mockApp.saveTasks).toHaveBeenCalled()
    })

    test('should call saveProjects', async () => {
        await manager.redo()

        expect(mockApp.saveProjects).toHaveBeenCalled()
    })

    test('should call renderView', async () => {
        await manager.redo()

        expect(mockApp.renderView).toHaveBeenCalled()
    })

    test('should call updateCounts', async () => {
        await manager.redo()

        expect(mockApp.updateCounts).toHaveBeenCalled()
    })

    test('should call renderProjectsDropdown', async () => {
        await manager.redo()

        expect(mockApp.renderProjectsDropdown).toHaveBeenCalled()
    })

    test('should show notification', async () => {
        await manager.redo()

        expect(mockApp.showNotification).toHaveBeenCalledWith('Redid: Action 2')
    })

    test('should return early when at end of history', async () => {
        manager.state.historyIndex = 1

        await manager.redo()

        expect(mockApp.saveTasks).not.toHaveBeenCalled()
    })

    test('should update undo/redo buttons', async () => {
        await manager.redo()

        const redoBtn = document.getElementById('btn-redo')
        expect(redoBtn.disabled).toBe(true)
    })
})

describe('UndoRedoManager - updateUndoRedoButtons()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="btn-undo"></button>
            <button id="btn-redo"></button>
        `

        mockState = {
            tasks: [],
            projects: [],
            history: [],
            historyIndex: -1,
            maxHistorySize: 50
        }

        mockApp = {}

        manager = new UndoRedoManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should disable undo button when historyIndex <= 0', () => {
        manager.state.historyIndex = 0

        manager.updateUndoRedoButtons()

        const undoBtn = document.getElementById('btn-undo')
        expect(undoBtn.disabled).toBe(true)
    })

    test('should enable undo button when historyIndex > 0', () => {
        manager.state.historyIndex = 1

        manager.updateUndoRedoButtons()

        const undoBtn = document.getElementById('btn-undo')
        expect(undoBtn.disabled).toBe(false)
    })

    test('should disable redo button when at end of history', () => {
        manager.state.history = [
            { action: 'Test', tasks: [], projects: [], timestamp: new Date().toISOString() }
        ]
        manager.state.historyIndex = 0

        manager.updateUndoRedoButtons()

        const redoBtn = document.getElementById('btn-redo')
        expect(redoBtn.disabled).toBe(true)
    })

    test('should enable redo button when not at end of history', () => {
        manager.state.history = [
            { action: 'Test 1', tasks: [], projects: [], timestamp: new Date().toISOString() },
            { action: 'Test 2', tasks: [], projects: [], timestamp: new Date().toISOString() }
        ]
        manager.state.historyIndex = 0

        manager.updateUndoRedoButtons()

        const redoBtn = document.getElementById('btn-redo')
        expect(redoBtn.disabled).toBe(false)
    })

    test('should set undo opacity to 0.5 when disabled', () => {
        manager.state.historyIndex = 0

        manager.updateUndoRedoButtons()

        const undoBtn = document.getElementById('btn-undo')
        expect(undoBtn.style.opacity).toBe('0.5')
    })

    test('should set undo opacity to 1 when enabled', () => {
        manager.state.historyIndex = 1

        manager.updateUndoRedoButtons()

        const undoBtn = document.getElementById('btn-undo')
        expect(undoBtn.style.opacity).toBe('1')
    })

    test('should set redo opacity to 0.5 when disabled', () => {
        manager.state.history = [
            { action: 'Test', tasks: [], projects: [], timestamp: new Date().toISOString() }
        ]
        manager.state.historyIndex = 0

        manager.updateUndoRedoButtons()

        const redoBtn = document.getElementById('btn-redo')
        expect(redoBtn.style.opacity).toBe('0.5')
    })

    test('should set redo opacity to 1 when enabled', () => {
        manager.state.history = [
            { action: 'Test 1', tasks: [], projects: [], timestamp: new Date().toISOString() },
            { action: 'Test 2', tasks: [], projects: [], timestamp: new Date().toISOString() }
        ]
        manager.state.historyIndex = 0

        manager.updateUndoRedoButtons()

        const redoBtn = document.getElementById('btn-redo')
        expect(redoBtn.style.opacity).toBe('1')
    })

    test('should handle missing undo button', () => {
        document.getElementById('btn-undo').remove()

        expect(() => manager.updateUndoRedoButtons()).not.toThrow()
    })

    test('should handle missing redo button', () => {
        document.getElementById('btn-redo').remove()

        expect(() => manager.updateUndoRedoButtons()).not.toThrow()
    })
})

describe('UndoRedoManager - Integration Tests', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="btn-undo"></button>
            <button id="btn-redo"></button>
        `

        mockState = {
            tasks: [],
            projects: [],
            history: [],
            historyIndex: -1,
            maxHistorySize: 50
        }

        mockApp = {
            saveTasks: jest.fn().mockResolvedValue(undefined),
            saveProjects: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new UndoRedoManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should handle full undo/redo cycle', async () => {
        // Create initial state
        const task1 = new Task({ id: '1', title: 'Original', status: 'inbox' })
        mockState.tasks = [task1]
        manager.saveState('Create task')

        // Modify and save
        const task2 = new Task({ id: '1', title: 'Modified', status: 'next' })
        mockState.tasks = [task2]
        manager.saveState('Modify task')

        // Undo
        await manager.undo()
        expect(mockState.tasks[0].title).toBe('Original')

        // Redo
        await manager.redo()
        expect(mockState.tasks[0].title).toBe('Modified')
    })

    test('should handle multiple undo operations', async () => {
        // Create three states
        for (let i = 1; i <= 3; i++) {
            mockState.tasks = [new Task({ id: '1', title: `State ${i}`, status: 'inbox' })]
            manager.saveState(`Action ${i}`)
        }

        // Undo twice
        await manager.undo()
        expect(mockState.tasks[0].title).toBe('State 2')

        await manager.undo()
        expect(mockState.tasks[0].title).toBe('State 1')
    })

    test('should handle new action after undo', async () => {
        // Create two states
        mockState.tasks = [new Task({ id: '1', title: 'State 1', status: 'inbox' })]
        manager.saveState('Action 1')

        mockState.tasks = [new Task({ id: '1', title: 'State 2', status: 'next' })]
        manager.saveState('Action 2')

        // Undo
        await manager.undo()
        expect(mockState.tasks[0].title).toBe('State 1')

        // Create new action (should truncate forward history)
        mockState.tasks = [new Task({ id: '1', title: 'State 3', status: 'waiting' })]
        manager.saveState('Action 3')

        expect(manager.state.history).toHaveLength(2)
        expect(manager.state.history[1].action).toBe('Action 3')

        // Cannot redo to Action 2
        manager.state.historyIndex = 0
        await manager.redo()
        expect(mockState.tasks[0].title).toBe('State 3')
    })

    test('should handle undo/redo with both tasks and projects', async () => {
        const task1 = new Task({ id: '1', title: 'Task 1', status: 'inbox' })
        const project1 = new Project({ id: 'p1', title: 'Project 1', status: 'active' })

        mockState.tasks = [task1]
        mockState.projects = [project1]
        manager.saveState('Create task and project')

        const task2 = new Task({ id: '1', title: 'Modified Task', status: 'next' })
        const project2 = new Project({ id: 'p1', title: 'Modified Project', status: 'someday' })

        mockState.tasks = [task2]
        mockState.projects = [project2]
        manager.saveState('Modify both')

        // Undo
        await manager.undo()
        expect(mockState.tasks[0].title).toBe('Task 1')
        expect(mockState.projects[0].title).toBe('Project 1')

        // Redo
        await manager.redo()
        expect(mockState.tasks[0].title).toBe('Modified Task')
        expect(mockState.projects[0].title).toBe('Modified Project')
    })
})
