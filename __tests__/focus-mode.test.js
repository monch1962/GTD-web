/**
 * Test: Focus Mode and Pomodoro Timer
 * Comprehensive tests for focus mode and Pomodoro timer functionality
 */

// Mock dom-utils before importing
import { FocusPomodoroManager } from '../js/modules/features/focus-pomodoro.ts'

jest.mock('../js-proxy/dom-utils.js', () => ({
    escapeHtml: (str) => str,
    getElement: (id) => null,
    setTextContent: (el, text) => {
        if (el) el.textContent = text
    },
    announce: jest.fn()
}))

// Mock dependencies
const mockApp = {
    showToast: jest.fn(),
    showNotification: jest.fn(),
    showWarning: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
    renderView: jest.fn(),
    saveTasks: jest.fn().mockResolvedValue(undefined),
    toggleTaskComplete: jest.fn().mockResolvedValue(undefined),
    openTaskModal: jest.fn(),
    getSmartSuggestions: jest.fn().mockReturnValue([])
}

const mockState = {
    tasks: [],
    projects: []
}

describe('FocusPomodoroManager', () => {
    let manager

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()

        // Reset state
        mockState.tasks = []
        mockState.projects = []

        // Setup DOM elements
        document.body.innerHTML = `
            <button id="btn-focus-mode">Focus Mode</button>
            <button id="btn-exit-focus">Exit Focus</button>
            <button id="btn-pomodoro-start">Start Pomodoro</button>
            <button id="btn-pomodoro-pause">Pause Pomodoro</button>
            <button id="btn-pomodoro-reset">Reset Pomodoro</button>
            <div id="focus-mode-overlay" style="display: none;"></div>
            <div id="focus-task-container"></div>
            <div id="pomodoro-timer"></div>
            <div id="announcer"></div>
        `

        // Mock window.alert and window.confirm
        global.alert = jest.fn()
        global.prompt = jest.fn()
        global.confirm = jest.fn()

        manager = new FocusPomodoroManager(mockState, mockApp)
    })

    afterEach(() => {
        jest.useRealTimers()
        document.body.innerHTML = ''
        if (manager.pomodoroTimer) {
            clearInterval(manager.pomodoroTimer)
        }
    })

    describe('Initialization', () => {
        test('should initialize with state and app references', () => {
            expect(manager.state).toBe(mockState)
            expect(manager.app).toBe(mockApp)
        })

        test('should initialize with default Pomodoro state', () => {
            expect(manager.pomodoroTimeLeft).toBe(25 * 60)
            expect(manager.pomodoroIsRunning).toBe(false)
            expect(manager.pomodoroIsBreak).toBe(false)
            expect(manager.pomodoroTimer).toBeNull()
        })

        test('should initialize with default focus mode state', () => {
            expect(manager.focusTaskId).toBeNull()
            expect(manager.focusModeStartTime).toBeNull()
        })
    })

    describe('setupFocusMode', () => {
        test('should attach event listeners to focus mode buttons', () => {
            const enterSpy = jest.spyOn(manager, 'enterFocusMode')
            const exitSpy = jest.spyOn(manager, 'exitFocusMode')
            const startSpy = jest.spyOn(manager, 'startPomodoro')
            const pauseSpy = jest.spyOn(manager, 'pausePomodoro')
            const resetSpy = jest.spyOn(manager, 'resetPomodoro')

            manager.setupFocusMode()

            const focusBtn = document.getElementById('btn-focus-mode')
            const exitFocusBtn = document.getElementById('btn-exit-focus')
            const pomodoroStartBtn = document.getElementById('btn-pomodoro-start')
            const pomodoroPauseBtn = document.getElementById('btn-pomodoro-pause')
            const pomodoroResetBtn = document.getElementById('btn-pomodoro-reset')

            focusBtn.click()
            expect(enterSpy).toHaveBeenCalled()

            exitFocusBtn.click()
            expect(exitSpy).toHaveBeenCalled()

            pomodoroStartBtn.click()
            expect(startSpy).toHaveBeenCalled()

            pomodoroPauseBtn.click()
            expect(pauseSpy).toHaveBeenCalled()

            pomodoroResetBtn.click()
            expect(resetSpy).toHaveBeenCalled()
        })

        test('should handle missing buttons gracefully', () => {
            document.body.innerHTML = '<div></div>'

            expect(() => manager.setupFocusMode()).not.toThrow()
        })
    })

    describe('enterFocusMode', () => {
        test('should show alert when no tasks available', () => {
            mockApp.getSmartSuggestions.mockReturnValue([])

            manager.enterFocusMode()

            expect(mockApp.showWarning).toHaveBeenCalledWith(
                'No tasks available for focus mode. Create some tasks first!'
            )
        })

        test('should show prompt when entering without taskId', () => {
            const mockTask = { id: 'task-1', title: 'Test Task' }
            mockApp.getSmartSuggestions.mockReturnValue([
                { task: mockTask, reasons: ['high priority'] }
            ])
            global.prompt.mockReturnValue('1')

            manager.enterFocusMode()

            expect(global.prompt).toHaveBeenCalled()
        })

        test('should enter focus mode with valid taskId', () => {
            const task = {
                id: 'task-1',
                title: 'Focus Task',
                description: 'Test description',
                contexts: ['@work'],
                energy: 'high',
                time: 30
            }
            mockState.tasks.push(task)

            manager.enterFocusMode('task-1')

            expect(manager.focusTaskId).toBe('task-1')
            expect(manager.focusModeStartTime).toBeInstanceOf(Date)
            expect(document.getElementById('focus-mode-overlay').style.display).toBe('flex')
        })

        test('should auto-start Pomodoro timer when entering focus mode', () => {
            const task = { id: 'task-1', title: 'Focus Task' }
            mockState.tasks.push(task)

            manager.enterFocusMode('task-1')

            expect(manager.pomodoroIsRunning).toBe(true)
            expect(manager.pomodoroTimer).not.toBeNull()
        })

        test('should show notification when entering focus mode', () => {
            const task = { id: 'task-1', title: 'Focus Task' }
            mockState.tasks.push(task)

            manager.enterFocusMode('task-1')

            expect(mockApp.showNotification).toHaveBeenCalledWith(
                'Focus mode activated! Timer started automatically.'
            )
        })

        test('should handle invalid task selection gracefully', () => {
            mockApp.getSmartSuggestions.mockReturnValue([
                { task: { id: 'task-1', title: 'Task 1' }, reasons: ['test'] }
            ])
            global.prompt.mockReturnValue('invalid')

            manager.enterFocusMode()

            expect(mockApp.showError).toHaveBeenCalledWith('Invalid selection')
            expect(manager.focusTaskId).toBeNull()
        })

        test('should handle cancelled prompt gracefully', () => {
            mockApp.getSmartSuggestions.mockReturnValue([
                { task: { id: 'task-1', title: 'Task 1' }, reasons: ['test'] }
            ])
            global.prompt.mockReturnValue(null)

            manager.enterFocusMode()

            expect(manager.focusTaskId).toBeNull()
        })
    })

    describe('renderFocusTask', () => {
        test('should render task details', () => {
            const task = {
                id: 'task-1',
                title: 'Focus Task',
                description: 'Test description',
                contexts: ['@work'],
                energy: 'high',
                time: 30,
                dueDate: '2026-01-10'
            }
            mockState.tasks.push(task)
            manager.focusTaskId = 'task-1'

            manager.renderFocusTask(task)

            const container = document.getElementById('focus-task-container')
            expect(container.innerHTML).toContain('Focus Task')
            expect(container.innerHTML).toContain('Test description')
            expect(container.innerHTML).toContain('@work')
            expect(container.innerHTML).toContain('high')
            expect(container.innerHTML).toContain('30m')
            expect(container.innerHTML).toContain('2026-01-10')
        })

        test('should render subtasks', () => {
            const task = {
                id: 'task-1',
                title: 'Focus Task',
                subtasks: [
                    { title: 'Subtask 1', completed: false },
                    { title: 'Subtask 2', completed: true }
                ]
            }
            mockState.tasks.push(task)

            manager.renderFocusTask(task)

            const container = document.getElementById('focus-task-container')
            expect(container.innerHTML).toContain('Subtask 1')
            expect(container.innerHTML).toContain('Subtask 2')
            expect(container.innerHTML).toContain('toggleSubtaskFromFocus')
        })

        test('should render notes', () => {
            const task = {
                id: 'task-1',
                title: 'Focus Task',
                notes: 'Test notes for the task'
            }
            mockState.tasks.push(task)

            manager.renderFocusTask(task)

            const container = document.getElementById('focus-task-container')
            expect(container.innerHTML).toContain('Test notes for the task')
        })

        test('should handle missing container gracefully', () => {
            document.getElementById('focus-task-container').remove()

            const task = { id: 'task-1', title: 'Focus Task' }
            mockState.tasks.push(task)

            expect(() => manager.renderFocusTask(task)).not.toThrow()
        })
    })

    describe('exitFocusMode', () => {
        test('should exit focus mode and hide overlay', async () => {
            manager.focusTaskId = 'task-1'
            manager.focusModeStartTime = new Date()
            document.getElementById('focus-mode-overlay').style.display = 'flex'

            await manager.exitFocusMode()

            expect(manager.focusTaskId).toBeNull()
            expect(manager.focusModeStartTime).toBeNull()
            expect(document.getElementById('focus-mode-overlay').style.display).toBe('none')
        })

        test('should pause Pomodoro timer when exiting', async () => {
            manager.focusTaskId = 'task-1'
            manager.pomodoroIsRunning = true
            const pauseSpy = jest.spyOn(manager, 'pausePomodoro')

            await manager.exitFocusMode()

            expect(pauseSpy).toHaveBeenCalled()
        })

        test('should auto-track time spent when exiting', async () => {
            const task = {
                id: 'task-1',
                title: 'Focus Task',
                timeSpent: 10
            }
            mockState.tasks.push(task)
            manager.focusTaskId = 'task-1'
            manager.focusModeStartTime = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago

            await manager.exitFocusMode()

            expect(task.timeSpent).toBe(15) // 10 + 5
            expect(mockApp.saveTasks).toHaveBeenCalled()
        })

        test('should call renderView after exiting', async () => {
            manager.focusTaskId = 'task-1'

            await manager.exitFocusMode()

            expect(mockApp.renderView).toHaveBeenCalled()
        })
    })

    describe('autoTrackTimeSpent', () => {
        test('should track time spent on focused task', async () => {
            const task = {
                id: 'task-1',
                title: 'Focus Task',
                timeSpent: 10
            }
            mockState.tasks.push(task)
            manager.focusTaskId = 'task-1'
            manager.focusModeStartTime = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago

            await manager.autoTrackTimeSpent()

            expect(task.timeSpent).toBe(15)
            expect(mockApp.saveTasks).toHaveBeenCalled()
            expect(mockApp.showNotification).toHaveBeenCalledWith(
                'Tracked 5 minutes on "Focus Task"'
            )
        })

        test('should handle no focus task gracefully', async () => {
            manager.focusTaskId = null

            await manager.autoTrackTimeSpent()

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })

        test('should handle no start time gracefully', async () => {
            manager.focusTaskId = 'task-1'
            manager.focusModeStartTime = null

            await manager.autoTrackTimeSpent()

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })

        test('should handle missing task gracefully', async () => {
            manager.focusTaskId = 'non-existent'
            manager.focusModeStartTime = new Date()

            await manager.autoTrackTimeSpent()

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })

        test('should not track time if less than 1 minute', async () => {
            const task = { id: 'task-1', title: 'Focus Task' }
            mockState.tasks.push(task)
            manager.focusTaskId = 'task-1'
            manager.focusModeStartTime = new Date(Date.now() - 29 * 1000) // 29 seconds ago (rounds to 0)

            await manager.autoTrackTimeSpent()

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })
    })

    describe('toggleSubtaskFromFocus', () => {
        test('should toggle subtask completion', async () => {
            const task = {
                id: 'task-1',
                title: 'Focus Task',
                subtasks: [{ title: 'Subtask 1', completed: false }]
            }
            mockState.tasks.push(task)

            await manager.toggleSubtaskFromFocus('task-1', 0)

            expect(task.subtasks[0].completed).toBe(true)
            expect(mockApp.saveTasks).toHaveBeenCalled()
        })

        test('should re-render task after toggling', async () => {
            const task = {
                id: 'task-1',
                title: 'Focus Task',
                subtasks: [{ title: 'Subtask 1', completed: false }]
            }
            mockState.tasks.push(task)
            const renderSpy = jest.spyOn(manager, 'renderFocusTask')

            await manager.toggleSubtaskFromFocus('task-1', 0)

            expect(renderSpy).toHaveBeenCalledWith(task)
        })

        test('should handle missing task gracefully', async () => {
            await manager.toggleSubtaskFromFocus('non-existent', 0)

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })

        test('should handle missing subtasks gracefully', async () => {
            const task = { id: 'task-1', title: 'Focus Task' }
            mockState.tasks.push(task)

            await manager.toggleSubtaskFromFocus('task-1', 0)

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })
    })

    describe('completeTaskAndExitFocus', () => {
        test('should complete task and exit focus mode', async () => {
            const task = { id: 'task-1', title: 'Focus Task' }
            mockState.tasks.push(task)
            manager.focusTaskId = 'task-1'

            await manager.completeTaskAndExitFocus('task-1')

            expect(mockApp.toggleTaskComplete).toHaveBeenCalledWith('task-1')
            expect(mockApp.showNotification).toHaveBeenCalledWith(
                'Task completed! Timer stopped automatically.'
            )
        })

        test('should auto-track time before completing', async () => {
            const task = {
                id: 'task-1',
                title: 'Focus Task',
                timeSpent: 10
            }
            mockState.tasks.push(task)
            manager.focusTaskId = 'task-1'
            manager.focusModeStartTime = new Date(Date.now() - 5 * 60 * 1000)

            // Mock exitFocusMode to avoid double-tracking
            const originalExitFocusMode = manager.exitFocusMode
            manager.exitFocusMode = jest.fn().mockResolvedValue(undefined)

            await manager.completeTaskAndExitFocus('task-1')

            // Should be 15 (10 original + 5 tracked)
            expect(task.timeSpent).toBe(15)

            // Restore original method
            manager.exitFocusMode = originalExitFocusMode
        })

        test('should pause Pomodoro before completing', async () => {
            const task = { id: 'task-1', title: 'Focus Task' }
            mockState.tasks.push(task)
            manager.focusTaskId = 'task-1'
            manager.pomodoroIsRunning = true
            const pauseSpy = jest.spyOn(manager, 'pausePomodoro')

            await manager.completeTaskAndExitFocus('task-1')

            expect(pauseSpy).toHaveBeenCalled()
        })
    })

    describe('editTaskFromFocus', () => {
        test('should exit focus mode and open task modal', () => {
            const task = { id: 'task-1', title: 'Focus Task' }
            mockState.tasks.push(task)
            manager.focusTaskId = 'task-1'
            const exitSpy = jest.spyOn(manager, 'exitFocusMode')

            manager.editTaskFromFocus('task-1')

            expect(exitSpy).toHaveBeenCalled()
            expect(mockApp.openTaskModal).toHaveBeenCalledWith(task)
        })

        test('should handle missing task gracefully', () => {
            manager.editTaskFromFocus('non-existent')

            expect(mockApp.openTaskModal).not.toHaveBeenCalled()
        })
    })

    describe('startPomodoro', () => {
        test('should start Pomodoro timer', () => {
            manager.startPomodoro()

            expect(manager.pomodoroIsRunning).toBe(true)
            expect(manager.pomodoroTimer).not.toBeNull()
        })

        test('should not start if already running', () => {
            manager.pomodoroIsRunning = true
            manager.startPomodoro()

            expect(manager.pomodoroTimer).toBeNull()
        })

        test('should decrement time left every second', () => {
            manager.startPomodoro()

            const initialTime = manager.pomodoroTimeLeft
            jest.advanceTimersByTime(1000)

            expect(manager.pomodoroTimeLeft).toBe(initialTime - 1)
        })

        test('should trigger completion when time reaches zero', () => {
            manager.pomodoroTimeLeft = 1
            const completeSpy = jest.spyOn(manager, 'pomodoroComplete')

            manager.startPomodoro()
            // First tick decrements to 0, second tick triggers completion
            jest.advanceTimersByTime(2000)

            expect(completeSpy).toHaveBeenCalled()
        })
    })

    describe('pausePomodoro', () => {
        test('should pause Pomodoro timer', () => {
            manager.startPomodoro()
            manager.pausePomodoro()

            expect(manager.pomodoroIsRunning).toBe(false)
            expect(manager.pomodoroTimer).toBeNull()
        })

        test('should not pause if not running', () => {
            manager.pomodoroIsRunning = false

            expect(() => manager.pausePomodoro()).not.toThrow()
        })
    })

    describe('resetPomodoro', () => {
        test('should reset Pomodoro timer to default', () => {
            manager.pomodoroTimeLeft = 100
            manager.pomodoroIsBreak = true
            manager.pomodoroIsRunning = true

            manager.resetPomodoro()

            expect(manager.pomodoroIsRunning).toBe(false)
            expect(manager.pomodoroIsBreak).toBe(false)
            expect(manager.pomodoroTimeLeft).toBe(25 * 60)
        })

        test('should update display after reset', () => {
            const updateSpy = jest.spyOn(manager, 'updatePomodoroDisplay')

            manager.resetPomodoro()

            expect(updateSpy).toHaveBeenCalled()
        })
    })

    describe('pomodoroComplete', () => {
        test('should show break prompt after work session', () => {
            manager.pomodoroIsBreak = false
            global.confirm.mockReturnValue(true)

            manager.pomodoroComplete()

            expect(global.confirm).toHaveBeenCalledWith('Pomodoro complete! Take a 5-minute break?')
        })

        test('should start break timer when confirmed', () => {
            manager.pomodoroIsBreak = false
            global.confirm.mockReturnValue(true)

            manager.pomodoroComplete()

            expect(manager.pomodoroIsBreak).toBe(true)
            expect(manager.pomodoroTimeLeft).toBe(5 * 60)
        })

        test('should reset to work timer when break declined', () => {
            manager.pomodoroIsBreak = false
            global.confirm.mockReturnValue(false)

            manager.pomodoroComplete()

            expect(manager.pomodoroIsBreak).toBe(false)
            expect(manager.pomodoroTimeLeft).toBe(25 * 60)
        })

        test('should show alert when break complete', () => {
            manager.pomodoroIsBreak = true

            manager.pomodoroComplete()

            expect(mockApp.showSuccess).toHaveBeenCalledWith(
                'Break complete! Ready to focus again?'
            )
            expect(manager.pomodoroIsBreak).toBe(false)
            expect(manager.pomodoroTimeLeft).toBe(25 * 60)
        })
    })

    describe('updatePomodoroDisplay', () => {
        test('should update timer display', () => {
            manager.pomodoroTimeLeft = 3661 // 61:01

            manager.updatePomodoroDisplay()

            const timerDisplay = document.getElementById('pomodoro-timer')
            expect(timerDisplay.textContent).toBe('61:01')
        })

        test('should pad minutes and seconds with zeros', () => {
            manager.pomodoroTimeLeft = 65 // 1:05

            manager.updatePomodoroDisplay()

            const timerDisplay = document.getElementById('pomodoro-timer')
            expect(timerDisplay.textContent).toBe('01:05')
        })

        test('should update document title', () => {
            manager.pomodoroTimeLeft = 1500 // 25:00
            manager.pomodoroIsBreak = false

            manager.updatePomodoroDisplay()

            expect(document.title).toBe('25:00 - Focus')
        })

        test('should update document title with break label', () => {
            manager.pomodoroTimeLeft = 300 // 5:00
            manager.pomodoroIsBreak = true

            manager.updatePomodoroDisplay()

            expect(document.title).toBe('05:00 - Break')
        })

        test('should handle missing timer display gracefully', () => {
            document.getElementById('pomodoro-timer').remove()

            expect(() => manager.updatePomodoroDisplay()).not.toThrow()
        })
    })

    describe('updatePomodoroButtons', () => {
        test('should hide start button when running', () => {
            manager.pomodoroIsRunning = true
            const startBtn = document.getElementById('btn-pomodoro-start')
            const pauseBtn = document.getElementById('btn-pomodoro-pause')

            manager.updatePomodoroButtons()

            expect(startBtn.style.display).toBe('none')
            expect(pauseBtn.style.display).toBe('inline-block')
        })

        test('should show start button when not running', () => {
            manager.pomodoroIsRunning = false
            const startBtn = document.getElementById('btn-pomodoro-start')
            const pauseBtn = document.getElementById('btn-pomodoro-pause')

            manager.updatePomodoroButtons()

            expect(startBtn.style.display).toBe('inline-block')
            expect(pauseBtn.style.display).toBe('none')
        })

        test('should handle missing buttons gracefully', () => {
            document.getElementById('btn-pomodoro-start').remove()
            document.getElementById('btn-pomodoro-pause').remove()

            expect(() => manager.updatePomodoroButtons()).not.toThrow()
        })
    })

    describe('State Getters', () => {
        test('getFocusTaskId should return current focus task ID', () => {
            manager.focusTaskId = 'task-123'

            expect(manager.getFocusTaskId()).toBe('task-123')
        })

        test('isFocusModeActive should return true when in focus mode', () => {
            manager.focusTaskId = 'task-123'

            expect(manager.isFocusModeActive()).toBe(true)
        })

        test('isFocusModeActive should return false when not in focus mode', () => {
            manager.focusTaskId = null

            expect(manager.isFocusModeActive()).toBe(false)
        })

        test('isPomodoroRunning should return timer status', () => {
            manager.pomodoroIsRunning = true

            expect(manager.isPomodoroRunning()).toBe(true)
        })

        test('getPomodoroTimeLeft should return remaining time', () => {
            manager.pomodoroTimeLeft = 300

            expect(manager.getPomodoroTimeLeft()).toBe(300)
        })

        test('isOnBreak should return break status', () => {
            manager.pomodoroIsBreak = true

            expect(manager.isOnBreak()).toBe(true)
        })
    })

    describe('destroy', () => {
        test('should cleanup timer on destroy', () => {
            manager.startPomodoro()

            manager.destroy()

            expect(manager.pomodoroIsRunning).toBe(false)
            expect(manager.pomodoroTimer).toBeNull()
        })
    })

    describe('Integration', () => {
        test('should work with complete focus mode workflow', async () => {
            const task = {
                id: 'task-1',
                title: 'Integration Test Task',
                description: 'Test description',
                contexts: ['@work'],
                subtasks: [{ title: 'Subtask 1', completed: false }]
            }
            mockState.tasks.push(task)

            // Setup
            manager.setupFocusMode()

            // Enter focus mode
            manager.enterFocusMode('task-1')
            expect(manager.isFocusModeActive()).toBe(true)
            expect(manager.isPomodoroRunning()).toBe(true)

            // Toggle subtask
            await manager.toggleSubtaskFromFocus('task-1', 0)
            expect(task.subtasks[0].completed).toBe(true)

            // Exit focus mode
            await manager.exitFocusMode()
            expect(manager.isFocusModeActive()).toBe(false)
            expect(manager.isPomodoroRunning()).toBe(false)
        })

        test('should handle complete Pomodoro cycle', () => {
            // Start work session
            manager.startPomodoro()
            expect(manager.isPomodoroRunning()).toBe(true)
            expect(manager.isOnBreak()).toBe(false)

            // Complete work session
            manager.pomodoroTimeLeft = 0
            global.confirm.mockReturnValue(true)
            manager.pomodoroComplete()

            // Should be on break
            expect(manager.isOnBreak()).toBe(true)
            expect(manager.pomodoroTimeLeft).toBe(5 * 60)

            // Complete break
            jest.advanceTimersByTime(5 * 60 * 1000)
            manager.pomodoroTimeLeft = 0
            manager.pomodoroComplete()

            // Should be back to work session
            expect(mockApp.showSuccess).toHaveBeenCalledWith(
                'Break complete! Ready to focus again?'
            )
            expect(manager.isOnBreak()).toBe(false)
            expect(manager.pomodoroTimeLeft).toBe(25 * 60)
        })
    })
})
