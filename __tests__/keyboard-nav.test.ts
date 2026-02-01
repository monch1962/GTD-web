/**
 * Tests for keyboard-nav.js - KeyboardNavigation class
 */

import { KeyboardNavigation } from '../js/modules/ui/keyboard-nav.ts'
import { Task } from '../js/models.ts'

describe('KeyboardNavigation', () => {
    let keyboardNav: KeyboardNavigation
    let mockState: { tasks: Task[] }
    let mockApp: any

    let mockTaskElements: any[]
    let mockQuickAddInput: HTMLInputElement

    beforeEach(() => {
        // Mock state with tasks
        mockState = {
            tasks: [
                new Task({ id: 'task-1', title: 'Task 1', status: 'inbox' }),
                new Task({ id: 'task-2', title: 'Task 2', status: 'inbox' }),
                new Task({ id: 'task-3', title: 'Task 3', status: 'inbox' })
            ]
        }

        // Mock app methods
        mockApp = {
            showSuggestions: jest.fn(),
            duplicateTask: jest.fn(),
            openTaskModal: jest.fn(),
            toggleTaskComplete: jest.fn(),
            deleteTask: jest.fn(),
            enterFocusMode: jest.fn(),
            switchView: jest.fn(),
            showInfo: jest.fn()
        }

        // Mock window.confirm for delete confirmation
        global.confirm = jest.fn().mockReturnValue(true)

        // Create mock task elements
        mockTaskElements = [
            {
                dataset: { taskId: 'task-1' },
                classList: { add: jest.fn(), remove: jest.fn() },
                scrollIntoView: jest.fn()
            },
            {
                dataset: { taskId: 'task-2' },
                classList: { add: jest.fn(), remove: jest.fn() },
                scrollIntoView: jest.fn()
            },
            {
                dataset: { taskId: 'task-3' },
                classList: { add: jest.fn(), remove: jest.fn() },
                scrollIntoView: jest.fn()
            }
        ]

        // Mock quick-add input
        mockQuickAddInput = {
            focus: jest.fn(),
            select: jest.fn(),
            id: 'quick-add-input'
        } as unknown as HTMLInputElement

        // Mock document methods with jest.fn()
        global.document.querySelector = jest.fn((selector) => {
            if (selector.startsWith('[data-task-id')) {
                const match = selector.match(/data-task-id="([^"]+)"/)
                if (match) {
                    const taskId = match[1]
                    return mockTaskElements.find((t) => t.dataset.taskId === taskId) || null
                }
                return null
            }
            if (selector === '#quick-add-input') {
                return mockQuickAddInput
            }
            if (selector === '#btn-suggestions') {
                return { id: 'btn-suggestions' }
            }
            return null
        })

        global.document.querySelectorAll = jest.fn(() => {
            // Convert array to NodeList-like object with array indexing support
            const nodeList = {
                length: mockTaskElements.length,
                item: (index: number) => mockTaskElements[index] || null,
                [Symbol.iterator]: function * () {
                    for (let i = 0; i < this.length; i++) {
                        yield this.item(i)
                    }
                },
                forEach: (callback: (value: any, index: number, array: any[]) => void) => {
                    mockTaskElements.forEach(callback)
                }
            }
            // Add array indexing support
            const proxy = new Proxy(nodeList, {
                get (target, prop) {
                    if (typeof prop === 'string' && !isNaN(parseInt(prop))) {
                        return target.item(parseInt(prop))
                    }
                    return (target as any)[prop]
                }
            })
            return proxy as unknown as NodeList
        })
        global.document.addEventListener = jest.fn()
        global.document.getElementById = jest.fn((id) => {
            if (id === 'quick-add-input') {
                return mockQuickAddInput
            }
            if (id === 'btn-suggestions') {
                return { id: 'btn-suggestions' } as HTMLElement
            }
            return null
        })

        keyboardNav = new KeyboardNavigation(mockState, mockApp)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        test('should initialize with state and app', () => {
            expect((keyboardNav as any).state).toBe(mockState)
            expect((keyboardNav as any).app).toBe(mockApp)
        })

        test('should initialize with no selected task', () => {
            expect((keyboardNav as any).selectedTaskId).toBeNull()
        })
    })

    describe('setupKeyboardShortcuts', () => {
        test('should add keydown event listener', () => {
            keyboardNav.setupKeyboardShortcuts()

            expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
        })
    })

    describe('selectTask', () => {
        test('should set selectedTaskId', () => {
            keyboardNav.selectTask('task-1')

            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })

        test('should add selected class to task element', () => {
            keyboardNav.selectTask('task-1')

            const taskElement = document.querySelector('[data-task-id="task-1"]')
            expect(taskElement!.classList.add).toHaveBeenCalledWith('selected')
        })

        test('should scroll task into view', () => {
            keyboardNav.selectTask('task-1')

            const taskElement = document.querySelector('[data-task-id="task-1"]')
            expect(taskElement!.scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'nearest'
            })
        })

        test('should deselect previous task', () => {
            keyboardNav.selectTask('task-1')
            keyboardNav.selectTask('task-2')

            expect((keyboardNav as any).selectedTaskId).toBe('task-2')
        })
    })

    describe('deselectTask', () => {
        test('should remove selected class from task element', () => {
            keyboardNav.selectTask('task-1')
            keyboardNav.deselectTask()

            const taskElement = document.querySelector('[data-task-id="task-1"]')
            expect(taskElement!.classList.remove).toHaveBeenCalledWith('selected')
        })

        test('should set selectedTaskId to null', () => {
            keyboardNav.selectTask('task-1')
            keyboardNav.deselectTask()

            expect((keyboardNav as any).selectedTaskId).toBeNull()
        })

        test('should do nothing if no task selected', () => {
            expect(() => keyboardNav.deselectTask()).not.toThrow()
        })
    })

    describe('getSelectedTaskId', () => {
        test('should return null when no task selected', () => {
            expect(keyboardNav.getSelectedTaskId()).toBeNull()
        })

        test('should return selected task ID', () => {
            keyboardNav.selectTask('task-1')
            expect(keyboardNav.getSelectedTaskId()).toBe('task-1')
        })
    })

    describe('hasSelection', () => {
        test('should return false when no task selected', () => {
            expect(keyboardNav.hasSelection()).toBe(false)
        })

        test('should return true when task is selected', () => {
            keyboardNav.selectTask('task-1')
            expect(keyboardNav.hasSelection()).toBe(true)
        })
    })

    describe('selectFirstTask', () => {
        test('should select first task', () => {
            keyboardNav.selectFirstTask()

            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })

        test('should do nothing if no tasks', () => {
            ;(document.querySelectorAll as jest.Mock).mockReturnValueOnce([])

            keyboardNav.selectFirstTask()

            expect((keyboardNav as any).selectedTaskId).toBeNull()
        })
    })

    describe('selectLastTask', () => {
        test('should select last task', () => {
            keyboardNav.selectLastTask()

            expect((keyboardNav as any).selectedTaskId).toBe('task-3')
        })

        test('should do nothing if no tasks', () => {
            ;(document.querySelectorAll as jest.Mock).mockReturnValueOnce([])

            keyboardNav.selectLastTask()

            expect((keyboardNav as any).selectedTaskId).toBeNull()
        })
    })

    describe('selectNextTask', () => {
        test('should select first task if no selection', () => {
            keyboardNav.selectNextTask()

            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })

        test('should select next task', () => {
            keyboardNav.selectTask('task-1')
            keyboardNav.selectNextTask()

            expect((keyboardNav as any).selectedTaskId).toBe('task-2')
        })

        test('should wrap to first task when at end', () => {
            keyboardNav.selectTask('task-3')
            keyboardNav.selectNextTask()

            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })
    })

    describe('selectPreviousTask', () => {
        test('should select last task if no selection', () => {
            keyboardNav.selectPreviousTask()

            expect((keyboardNav as any).selectedTaskId).toBe('task-3')
        })

        test('should select previous task', () => {
            keyboardNav.selectTask('task-2')
            keyboardNav.selectPreviousTask()

            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })

        test('should wrap to last task when at start', () => {
            keyboardNav.selectTask('task-1')
            keyboardNav.selectPreviousTask()

            expect((keyboardNav as any).selectedTaskId).toBe('task-3')
        })
    })

    describe('clearSelection', () => {
        test('should deselect current task', () => {
            keyboardNav.selectTask('task-1')
            keyboardNav.clearSelection()

            expect((keyboardNav as any).selectedTaskId).toBeNull()
        })
    })

    describe('_handleKeyDown - Navigation Keys', () => {
        beforeEach(() => {
            keyboardNav.setupKeyboardShortcuts()
        })

        test('should handle ArrowDown key', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'ArrowDown',
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })

        test('should handle ArrowUp key', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = { key: 'ArrowUp', target: { tagName: 'DIV' }, preventDefault: jest.fn() }

            handler(event)

            expect((keyboardNav as any).selectedTaskId).toBe('task-3')
        })

        test('should handle j key', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = { key: 'j', target: { tagName: 'DIV' }, preventDefault: jest.fn() }

            handler(event)

            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })

        test('should handle k key', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = { key: 'k', target: { tagName: 'DIV' }, preventDefault: jest.fn() }

            handler(event)

            expect((keyboardNav as any).selectedTaskId).toBe('task-3')
        })
    })

    describe('_handleKeyDown - Action Keys', () => {
        beforeEach(() => {
            keyboardNav.setupKeyboardShortcuts()
        })

        test('should handle Enter key to edit task', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = { key: 'Enter', target: { tagName: 'DIV' }, preventDefault: jest.fn() }

            handler(event)

            expect(mockApp.openTaskModal).toHaveBeenCalledWith(mockState.tasks[0])
        })

        test('should handle Escape key to deselect', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = { key: 'Escape', target: { tagName: 'DIV' }, preventDefault: jest.fn() }

            handler(event)

            expect((keyboardNav as any).selectedTaskId).toBeNull()
        })

        test('should handle Space key to toggle complete', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = { key: ' ', target: { tagName: 'DIV' }, preventDefault: jest.fn() }

            handler(event)

            expect(mockApp.toggleTaskComplete).toHaveBeenCalledWith('task-1')
        })

        test('should handle Delete key', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = { key: 'Delete', target: { tagName: 'DIV' }, preventDefault: jest.fn() }

            handler(event)

            expect(mockApp.deleteTask).toHaveBeenCalledWith('task-1')
        })

        test('should handle Backspace key', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'Backspace',
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect(mockApp.deleteTask).toHaveBeenCalledWith('task-1')
        })
    })

    describe('_handleKeyDown - Ctrl Shortcuts', () => {
        beforeEach(() => {
            keyboardNav.setupKeyboardShortcuts()
        })

        test('should handle Ctrl+K to focus quick-add', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'k',
                ctrlKey: true,
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            const quickAddInput = document.querySelector('#quick-add-input') as HTMLInputElement
            expect(quickAddInput!.focus).toHaveBeenCalled()
        })

        test('should handle Ctrl+N to show suggestions', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'n',
                ctrlKey: true,
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect(mockApp.showSuggestions).toHaveBeenCalled()
        })

        test('should handle Ctrl+D to duplicate task', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'd',
                ctrlKey: true,
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect(mockApp.duplicateTask).toHaveBeenCalledWith('task-1')
        })

        test('should handle Ctrl+/ to enter focus mode', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: '/',
                ctrlKey: true,
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect(mockApp.enterFocusMode).toHaveBeenCalledWith('task-1')
        })

        test('should handle Ctrl+1 to switch to inbox', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: '1',
                ctrlKey: true,
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect(mockApp.switchView).toHaveBeenCalledWith('inbox')
        })

        test('should handle Ctrl+2 to switch to next', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: '2',
                ctrlKey: true,
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect(mockApp.switchView).toHaveBeenCalledWith('next')
        })

        test('should handle Ctrl+3 to switch to waiting', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: '3',
                ctrlKey: true,
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect(mockApp.switchView).toHaveBeenCalledWith('waiting')
        })
    })

    describe('_handleKeyDown - Input Field Handling', () => {
        beforeEach(() => {
            keyboardNav.setupKeyboardShortcuts()
        })

        test('should ignore keys when typing in INPUT', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'j',
                target: { tagName: 'INPUT' },
                preventDefault: jest.fn()
            }

            handler(event)

            // Task should remain selected (no navigation)
            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })

        test('should ignore keys when typing in TEXTAREA', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'j',
                target: { tagName: 'TEXTAREA' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })

        test('should ignore keys when contentEditable', () => {
            keyboardNav.selectTask('task-1')
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'j',
                target: { tagName: 'DIV', isContentEditable: true },
                preventDefault: jest.fn()
            }

            handler(event)

            expect((keyboardNav as any).selectedTaskId).toBe('task-1')
        })

        test('should allow Ctrl+K from non-quick-add inputs', () => {
            const handler = (document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'k',
                ctrlKey: true,
                target: { tagName: 'INPUT', id: 'other-input' },
                preventDefault: jest.fn()
            }

            handler(event)

            const quickAddInput = document.querySelector('#quick-add-input')
            expect(quickAddInput.focus).toHaveBeenCalled()
        })
    })

    describe('showShortcutsHelp', () => {
        test('should show info message', () => {
            keyboardNav.showShortcutsHelp()

            expect(mockApp.showInfo).toHaveBeenCalledWith('Keyboard shortcuts: Press ? for help')
        })
    })

    describe('Edge Cases', () => {
        test('should handle empty task list', () => {
            const originalQuerySelectorAll = global.document.querySelectorAll
            global.document.querySelectorAll = jest.fn(() => [])

            keyboardNav.selectFirstTask()

            expect((keyboardNav as any).selectedTaskId).toBeNull()

            // Restore original
            global.document.querySelectorAll = originalQuerySelectorAll
        })

        test('should handle Enter key without selection', () => {
            keyboardNav.setupKeyboardShortcuts()
            const handler = (global.document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = { key: 'Enter', target: { tagName: 'DIV' }, preventDefault: jest.fn() }

            handler(event)

            expect(mockApp.openTaskModal).not.toHaveBeenCalled()
        })

        test('should handle Space key without selection', () => {
            keyboardNav.setupKeyboardShortcuts()
            const handler = (global.document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = { key: ' ', target: { tagName: 'DIV' }, preventDefault: jest.fn() }

            handler(event)

            expect(mockApp.toggleTaskComplete).not.toHaveBeenCalled()
        })

        test('should handle Ctrl+D without selection', () => {
            keyboardNav.setupKeyboardShortcuts()
            const handler = (global.document.addEventListener as jest.Mock).mock.calls[0][1]
            const event = {
                key: 'd',
                ctrlKey: true,
                target: { tagName: 'DIV' },
                preventDefault: jest.fn()
            }

            handler(event)

            expect(mockApp.duplicateTask).not.toHaveBeenCalled()
        })

        test('should handle navigation with missing task element', () => {
            keyboardNav.selectTask('task-1')
            const originalQuerySelector = global.document.querySelector
            global.document.querySelector = jest.fn(() => null)

            keyboardNav.selectNextTask()

            // Should remain on task-1 since current element not found
            expect((keyboardNav as any).selectedTaskId).toBe('task-1')

            // Restore original
            global.document.querySelector = originalQuerySelector
        })
    })
})
