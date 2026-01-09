/**
 * Comprehensive Tests for Subtasks Feature
 */

import { GTDApp } from '../js/app.js'
import { SubtasksManager } from '../js/modules/features/subtasks.js'

describe('SubtasksManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()

        mockState = {
            tasks: []
        }

        mockApp = new GTDApp()
        manager = new SubtasksManager(mockState, mockApp)
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })
})

describe('SubtasksManager - Render Subtasks', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const container = document.createElement('div')
        container.id = 'subtasks-container'
        document.body.appendChild(container)

        mockState = {
            tasks: []
        }

        mockApp = new GTDApp()
        manager = new SubtasksManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('renderSubtasksInModal()', () => {
        test('should show message when no subtasks', () => {
            manager.renderSubtasksInModal([])

            const container = document.getElementById('subtasks-container')
            expect(container.innerHTML).toContain('No subtasks yet')
        })

        test('should handle undefined subtasks', () => {
            manager.renderSubtasksInModal(undefined)

            const container = document.getElementById('subtasks-container')
            expect(container.innerHTML).toContain('No subtasks yet')
        })

        test('should render single subtask', () => {
            const subtasks = [{ title: 'Step 1', completed: false }]

            manager.renderSubtasksInModal(subtasks)

            const container = document.getElementById('subtasks-container')
            expect(container.innerHTML).toContain('Step 1')
        })

        test('should render multiple subtasks', () => {
            const subtasks = [
                { title: 'Step 1', completed: false },
                { title: 'Step 2', completed: true },
                { title: 'Step 3', completed: false }
            ]

            manager.renderSubtasksInModal(subtasks)

            const container = document.getElementById('subtasks-container')
            expect(container.innerHTML).toContain('Step 1')
            expect(container.innerHTML).toContain('Step 2')
            expect(container.innerHTML).toContain('Step 3')
        })

        test('should display checkbox state correctly', () => {
            const subtasks = [
                { title: 'Completed', completed: true },
                { title: 'Not completed', completed: false }
            ]

            manager.renderSubtasksInModal(subtasks)

            const container = document.getElementById('subtasks-container')
            const checkboxes = container.querySelectorAll('input[type="checkbox"]')

            expect(checkboxes[0].checked).toBe(true)
            expect(checkboxes[1].checked).toBe(false)
        })

        test('should apply strikethrough to completed subtasks', () => {
            const subtasks = [{ title: 'Completed task', completed: true }]

            manager.renderSubtasksInModal(subtasks)

            const container = document.getElementById('subtasks-container')
            const span = container.querySelector('span')

            expect(span.style.textDecoration).toBe('line-through')
            expect(span.style.opacity).toBe('0.6')
        })

        test('should not apply strikethrough to incomplete subtasks', () => {
            const subtasks = [{ title: 'Incomplete task', completed: false }]

            manager.renderSubtasksInModal(subtasks)

            const container = document.getElementById('subtasks-container')
            const span = container.querySelector('span')

            expect(span.style.textDecoration).not.toBe('line-through')
        })

        test('should escape HTML in subtask titles', () => {
            const subtasks = [{ title: '<script>alert("xss")</script>', completed: false }]

            manager.renderSubtasksInModal(subtasks)

            const container = document.getElementById('subtasks-container')
            expect(container.innerHTML).not.toContain('<script>')
            expect(container.innerHTML).toContain('&lt;script&gt;')
        })

        test('should set data-subtask-index correctly', () => {
            const subtasks = [
                { title: 'Step 1', completed: false },
                { title: 'Step 2', completed: false },
                { title: 'Step 3', completed: false }
            ]

            manager.renderSubtasksInModal(subtasks)

            const container = document.getElementById('subtasks-container')
            const subtaskElements = container.querySelectorAll('div[data-subtask-index]')

            expect(subtaskElements[0].dataset.subtaskIndex).toBe('0')
            expect(subtaskElements[1].dataset.subtaskIndex).toBe('1')
            expect(subtaskElements[2].dataset.subtaskIndex).toBe('2')
        })

        test('should add remove button for each subtask', () => {
            const subtasks = [
                { title: 'Step 1', completed: false },
                { title: 'Step 2', completed: false }
            ]

            manager.renderSubtasksInModal(subtasks)

            const container = document.getElementById('subtasks-container')
            const removeButtons = container.querySelectorAll('.btn-secondary')

            expect(removeButtons.length).toBe(2)
        })
    })

    describe('getSubtasksFromModal()', () => {
        test('should return empty array when container missing', () => {
            document.body.innerHTML = ''

            const subtasks = manager.getSubtasksFromModal()

            expect(subtasks).toEqual([])
        })

        test('should extract subtasks correctly', () => {
            const subtasks = [
                { title: 'Step 1', completed: false },
                { title: 'Step 2', completed: true }
            ]

            manager.renderSubtasksInModal(subtasks)

            const extracted = manager.getSubtasksFromModal()

            expect(extracted).toHaveLength(2)
            expect(extracted[0].title).toBe('Step 1')
            expect(extracted[0].completed).toBe(false)
            expect(extracted[1].title).toBe('Step 2')
            expect(extracted[1].completed).toBe(true)
        })

        test('should preserve index order', () => {
            const subtasks = [
                { title: 'First', completed: false },
                { title: 'Second', completed: false },
                { title: 'Third', completed: false }
            ]

            manager.renderSubtasksInModal(subtasks)

            const extracted = manager.getSubtasksFromModal()

            expect(extracted[0].title).toBe('First')
            expect(extracted[1].title).toBe('Second')
            expect(extracted[2].title).toBe('Third')
        })
    })
})

describe('SubtasksManager - Add Subtask', () => {
    let manager
    let mockState
    let mockApp
    let input

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const container = document.createElement('div')
        container.id = 'subtasks-container'
        document.body.appendChild(container)

        input = document.createElement('input')
        input.id = 'new-subtask-input'
        document.body.appendChild(input)

        mockState = {
            tasks: []
        }

        mockApp = new GTDApp()
        manager = new SubtasksManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('addSubtask()', () => {
        test('should add new subtask to list', () => {
            input.value = 'New step'

            manager.addSubtask()

            const container = document.getElementById('subtasks-container')
            expect(container.innerHTML).toContain('New step')
        })

        test('should clear input after adding', () => {
            input.value = 'New step'

            manager.addSubtask()

            expect(input.value).toBe('')
        })

        test('should not add empty subtask', () => {
            input.value = '   '

            manager.addSubtask()

            const container = document.getElementById('subtasks-container')
            expect(container.innerHTML).toContain('No subtasks yet')
        })

        test('should not add whitespace-only subtask', () => {
            input.value = ''

            manager.addSubtask()

            const container = document.getElementById('subtasks-container')
            expect(container.innerHTML).toContain('No subtasks yet')
        })

        test('should set new subtask as incomplete', () => {
            input.value = 'New step'

            manager.addSubtask()

            const extracted = manager.getSubtasksFromModal()
            expect(extracted[0].completed).toBe(false)
        })

        test('should append to existing subtasks', () => {
            // Add first subtask manually
            const subtasks = [{ title: 'Step 1', completed: false }]
            manager.renderSubtasksInModal(subtasks)

            // Add second subtask
            input.value = 'Step 2'
            manager.addSubtask()

            const extracted = manager.getSubtasksFromModal()
            expect(extracted).toHaveLength(2)
            expect(extracted[0].title).toBe('Step 1')
            expect(extracted[1].title).toBe('Step 2')
        })

        test('should trim whitespace from title', () => {
            input.value = '  New step  '

            manager.addSubtask()

            const extracted = manager.getSubtasksFromModal()
            expect(extracted[0].title).toBe('New step')
        })
    })
})

describe('SubtasksManager - Remove Subtask', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const container = document.createElement('div')
        container.id = 'subtasks-container'
        document.body.appendChild(container)

        mockState = {
            tasks: []
        }

        mockApp = new GTDApp()
        manager = new SubtasksManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('removeSubtask()', () => {
        test('should remove subtask by index', () => {
            const subtasks = [
                { title: 'Step 1', completed: false },
                { title: 'Step 2', completed: false },
                { title: 'Step 3', completed: false }
            ]

            manager.renderSubtasksInModal(subtasks)
            manager.removeSubtask(1)

            const extracted = manager.getSubtasksFromModal()
            expect(extracted).toHaveLength(2)
            expect(extracted[0].title).toBe('Step 1')
            expect(extracted[1].title).toBe('Step 3')
        })

        test('should remove first subtask', () => {
            const subtasks = [
                { title: 'Step 1', completed: false },
                { title: 'Step 2', completed: false }
            ]

            manager.renderSubtasksInModal(subtasks)
            manager.removeSubtask(0)

            const extracted = manager.getSubtasksFromModal()
            expect(extracted).toHaveLength(1)
            expect(extracted[0].title).toBe('Step 2')
        })

        test('should remove last subtask', () => {
            const subtasks = [
                { title: 'Step 1', completed: false },
                { title: 'Step 2', completed: false }
            ]

            manager.renderSubtasksInModal(subtasks)
            manager.removeSubtask(1)

            const extracted = manager.getSubtasksFromModal()
            expect(extracted).toHaveLength(1)
            expect(extracted[0].title).toBe('Step 1')
        })

        test('should show empty message when all subtasks removed', () => {
            const subtasks = [{ title: 'Only step', completed: false }]

            manager.renderSubtasksInModal(subtasks)
            manager.removeSubtask(0)

            const container = document.getElementById('subtasks-container')
            expect(container.innerHTML).toContain('No subtasks yet')
        })

        test('should handle removing from empty list', () => {
            manager.renderSubtasksInModal([])

            expect(() => {
                manager.removeSubtask(0)
            }).not.toThrow()
        })

        test('should handle invalid index', () => {
            const subtasks = [{ title: 'Step 1', completed: false }]

            manager.renderSubtasksInModal(subtasks)

            expect(() => {
                manager.removeSubtask(10)
            }).not.toThrow()
        })
    })
})

describe('SubtasksManager - Toggle Completion', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const container = document.createElement('div')
        container.id = 'subtasks-container'
        document.body.appendChild(container)

        mockState = {
            tasks: []
        }

        mockApp = new GTDApp()
        manager = new SubtasksManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('toggleSubtaskCompletion()', () => {
        test('should toggle incomplete to complete', () => {
            const subtasks = [{ title: 'Step 1', completed: false }]

            manager.renderSubtasksInModal(subtasks)
            manager.toggleSubtaskCompletion(0)

            const extracted = manager.getSubtasksFromModal()
            expect(extracted[0].completed).toBe(true)
        })

        test('should toggle complete to incomplete', () => {
            const subtasks = [{ title: 'Step 1', completed: true }]

            manager.renderSubtasksInModal(subtasks)
            manager.toggleSubtaskCompletion(0)

            const extracted = manager.getSubtasksFromModal()
            expect(extracted[0].completed).toBe(false)
        })

        test('should only toggle specified subtask', () => {
            const subtasks = [
                { title: 'Step 1', completed: false },
                { title: 'Step 2', completed: false },
                { title: 'Step 3', completed: false }
            ]

            manager.renderSubtasksInModal(subtasks)
            manager.toggleSubtaskCompletion(1)

            const extracted = manager.getSubtasksFromModal()
            expect(extracted[0].completed).toBe(false)
            expect(extracted[1].completed).toBe(true)
            expect(extracted[2].completed).toBe(false)
        })

        test('should update visual display after toggle', () => {
            const subtasks = [{ title: 'Step 1', completed: false }]

            manager.renderSubtasksInModal(subtasks)

            let container = document.getElementById('subtasks-container')
            let span = container.querySelector('span')
            expect(span.style.textDecoration).not.toBe('line-through')

            manager.toggleSubtaskCompletion(0)

            container = document.getElementById('subtasks-container')
            span = container.querySelector('span')
            expect(span.style.textDecoration).toBe('line-through')
        })

        test('should handle invalid index gracefully', () => {
            const subtasks = [{ title: 'Step 1', completed: false }]

            manager.renderSubtasksInModal(subtasks)

            expect(() => {
                manager.toggleSubtaskCompletion(10)
            }).not.toThrow()
        })

        test('should handle empty subtasks list', () => {
            manager.renderSubtasksInModal([])

            expect(() => {
                manager.toggleSubtaskCompletion(0)
            }).not.toThrow()
        })
    })
})

describe('SubtasksManager - Integration', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const container = document.createElement('div')
        container.id = 'subtasks-container'
        document.body.appendChild(container)

        const input = document.createElement('input')
        input.id = 'new-subtask-input'
        document.body.appendChild(input)

        mockState = {
            tasks: []
        }

        mockApp = new GTDApp()
        manager = new SubtasksManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should handle complete workflow: add, toggle, remove', () => {
        // Add subtasks
        const input = document.getElementById('new-subtask-input')
        input.value = 'Step 1'
        manager.addSubtask()

        input.value = 'Step 2'
        manager.addSubtask()

        input.value = 'Step 3'
        manager.addSubtask()

        let extracted = manager.getSubtasksFromModal()
        expect(extracted).toHaveLength(3)

        // Toggle completion
        manager.toggleSubtaskCompletion(0)
        manager.toggleSubtaskCompletion(2)

        extracted = manager.getSubtasksFromModal()
        expect(extracted[0].completed).toBe(true)
        expect(extracted[1].completed).toBe(false)
        expect(extracted[2].completed).toBe(true)

        // Remove middle subtask
        manager.removeSubtask(1)

        extracted = manager.getSubtasksFromModal()
        expect(extracted).toHaveLength(2)
        expect(extracted[0].title).toBe('Step 1')
        expect(extracted[1].title).toBe('Step 3')
    })

    test('should maintain data integrity across operations', () => {
        const input = document.getElementById('new-subtask-input')

        // Add multiple subtasks
        for (let i = 1; i <= 5; i++) {
            input.value = `Step ${i}`
            manager.addSubtask()
        }

        // Remove some
        manager.removeSubtask(1)
        manager.removeSubtask(2)

        // Toggle some
        manager.toggleSubtaskCompletion(0)
        manager.toggleSubtaskCompletion(2)

        const extracted = manager.getSubtasksFromModal()

        expect(extracted).toHaveLength(3)
        expect(extracted[0].title).toBe('Step 1')
        expect(extracted[0].completed).toBe(true)
        expect(extracted[1].title).toBe('Step 3')
        expect(extracted[1].completed).toBe(false)
        expect(extracted[2].title).toBe('Step 5')
        expect(extracted[2].completed).toBe(true)
    })
})
