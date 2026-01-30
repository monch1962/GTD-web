/**
 * Comprehensive Tests for Global Quick Capture Feature
 */

import { GTDApp } from '../js/app.ts'
import { GlobalQuickCaptureManager } from '../js/modules/features/global-quick-capture.ts'

describe('GlobalQuickCaptureManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create required DOM elements
        const overlay = document.createElement('div')
        overlay.id = 'global-quick-capture-overlay'
        overlay.style.display = 'none'
        document.body.appendChild(overlay)

        const input = document.createElement('input')
        input.id = 'global-quick-capture-input'
        overlay.appendChild(input)

        const closeBtn = document.createElement('button')
        closeBtn.id = 'close-global-quick-capture'
        overlay.appendChild(closeBtn)

        const templates = document.createElement('div')
        templates.id = 'global-quick-capture-templates'
        templates.style.display = 'none'
        overlay.appendChild(templates)

        const templatesList = document.createElement('div')
        templatesList.id = 'global-quick-capture-templates-list'
        templates.appendChild(templatesList)

        mockState = {
            tasks: [],
            projects: [],
            templates: []
        }

        mockApp = new GTDApp()
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined)
        mockApp.renderView = jest.fn()
        mockApp.updateCounts = jest.fn()
        mockApp.saveState = jest.fn()
        mockApp.showToast = jest.fn()

        manager = new GlobalQuickCaptureManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })
})

describe('GlobalQuickCaptureManager - Open/Close Overlay', () => {
    let manager
    let mockState
    let mockApp
    let overlay
    let input

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        overlay = document.createElement('div')
        overlay.id = 'global-quick-capture-overlay'
        overlay.style.display = 'none'
        document.body.appendChild(overlay)

        input = document.createElement('input')
        input.id = 'global-quick-capture-input'
        overlay.appendChild(input)

        const closeBtn = document.createElement('button')
        closeBtn.id = 'close-global-quick-capture'
        overlay.appendChild(closeBtn)

        const templates = document.createElement('div')
        templates.id = 'global-quick-capture-templates'
        templates.style.display = 'none'
        overlay.appendChild(templates)

        const templatesList = document.createElement('div')
        templatesList.id = 'global-quick-capture-templates-list'
        templates.appendChild(templatesList)

        mockState = {
            tasks: [],
            projects: [],
            templates: []
        }

        mockApp = new GTDApp()
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined)
        mockApp.renderView = jest.fn()
        mockApp.updateCounts = jest.fn()
        mockApp.saveState = jest.fn()
        mockApp.showToast = jest.fn()

        manager = new GlobalQuickCaptureManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('openGlobalQuickCapture()', () => {
        test('should show overlay', () => {
            manager.openGlobalQuickCapture()

            expect(overlay.style.display).toBe('flex')
        })

        test('should clear input value', () => {
            input.value = 'previous value'

            manager.openGlobalQuickCapture()

            expect(input.value).toBe('')
        })

        test('should focus input', () => {
            input.focus = jest.fn()

            manager.openGlobalQuickCapture()

            expect(input.focus).toHaveBeenCalled()
        })

        test('should hide templates initially', () => {
            const templates = document.getElementById('global-quick-capture-templates')
            templates.style.display = 'block'

            manager.openGlobalQuickCapture()

            expect(templates.style.display).toBe('none')
        })
    })

    describe('closeGlobalQuickCapture()', () => {
        test('should hide overlay', () => {
            overlay.style.display = 'flex'

            manager.closeGlobalQuickCapture()

            expect(overlay.style.display).toBe('none')
        })
    })
})

describe('GlobalQuickCaptureManager - Input Parsing', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        mockState = {
            tasks: [],
            projects: [
                { id: 'proj1', title: 'Work' },
                { id: 'proj2', title: 'Personal' }
            ],
            templates: []
        }

        mockApp = new GTDApp()
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined)
        mockApp.renderView = jest.fn()
        mockApp.updateCounts = jest.fn()
        mockApp.saveState = jest.fn()
        mockApp.showToast = jest.fn()

        manager = new GlobalQuickCaptureManager(mockState, mockApp)
    })

    describe('parseQuickCaptureInput()', () => {
        test('should parse simple task', () => {
            const result = manager.parseQuickCaptureInput('Buy groceries')

            expect(result.title).toBe('Buy groceries')
            expect(result.status).toBe('inbox')
        })

        test('should extract @contexts', () => {
            const result = manager.parseQuickCaptureInput('Call @john about @work project')

            expect(result.contexts).toContain('@john')
            expect(result.contexts).toContain('@work')
            expect(result.title).toBe('Call  about  project')
        })

        test('should extract !energy', () => {
            const result = manager.parseQuickCaptureInput('Quick task !high')

            expect(result.energy).toBe('high')
            expect(result.title).toBe('Quick task')
        })

        test('should extract !medium energy', () => {
            const result = manager.parseQuickCaptureInput('Task !medium')

            expect(result.energy).toBe('medium')
        })

        test('should extract !low energy', () => {
            const result = manager.parseQuickCaptureInput('Task !low')

            expect(result.energy).toBe('low')
        })

        test('should extract #project', () => {
            const result = manager.parseQuickCaptureInput('Finish report #Work')

            expect(result.projectId).toBe('proj1')
            expect(result.title).toBe('Finish report')
        })

        test('should match project case-insensitively', () => {
            const result = manager.parseQuickCaptureInput('Task #work')

            expect(result.projectId).toBe('proj1')
        })

        test('should not match non-existent project', () => {
            const result = manager.parseQuickCaptureInput('Task #nonexistent')

            expect(result.projectId).toBeUndefined()
            expect(result.title).toBe('Task')
        })

        test('should parse "today"', () => {
            const result = manager.parseQuickCaptureInput('Task due today')

            const today = new Date().toISOString().split('T')[0]
            expect(result.dueDate).toBe(today)
            expect(result.title).toBe('Task')
        })

        test('should parse "tomorrow"', () => {
            const result = manager.parseQuickCaptureInput('Task due tomorrow')

            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const expected = tomorrow.toISOString().split('T')[0]

            expect(result.dueDate).toBe(expected)
            expect(result.title).toBe('Task')
        })

        test('should parse "in X days"', () => {
            const result = manager.parseQuickCaptureInput('Task in 5 days')

            const expectedDate = new Date()
            expectedDate.setDate(expectedDate.getDate() + 5)

            expect(result.dueDate).toBe(expectedDate.toISOString().split('T')[0])
            expect(result.title).toBe('Task')
        })

        test('should parse complex input with multiple elements', () => {
            const result = manager.parseQuickCaptureInput(
                'Call @john about report #Work due today !high'
            )

            expect(result.title).toBeDefined()
            expect(result.contexts).toContain('@john')
            expect(result.projectId).toBe('proj1')
            expect(result.dueDate).toBeDefined()
            expect(result.energy).toBe('high')
        })
    })
})

describe('GlobalQuickCaptureManager - Task Creation', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        mockState = {
            tasks: [],
            projects: [{ id: 'proj1', title: 'Work' }],
            templates: []
        }

        mockApp = new GTDApp()
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined)
        mockApp.renderView = jest.fn()
        mockApp.updateCounts = jest.fn()
        mockApp.saveState = jest.fn()
        mockApp.showToast = jest.fn()

        manager = new GlobalQuickCaptureManager(mockState, mockApp)

        // Create required DOM elements
        const overlay = document.createElement('div')
        overlay.id = 'global-quick-capture-overlay'
        overlay.style.display = 'none'
        document.body.appendChild(overlay)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('handleGlobalQuickCapture()', () => {
        test('should create new task', () => {
            manager.handleGlobalQuickCapture('Buy groceries')

            expect(mockState.tasks.length).toBe(1)
            expect(mockState.tasks[0].title).toBe('Buy groceries')
        })

        test('should add task to beginning of array', () => {
            mockState.tasks.push({ id: 'existing', title: 'Existing task' })

            manager.handleGlobalQuickCapture('New task')

            expect(mockState.tasks[0].title).toBe('New task')
            expect(mockState.tasks[1].title).toBe('Existing task')
        })

        test('should persist changes', () => {
            manager.handleGlobalQuickCapture('Task')

            expect(mockApp.saveTasks).toHaveBeenCalled()
        })

        test('should update UI', () => {
            manager.handleGlobalQuickCapture('Task')

            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
        })

        test('should close overlay', () => {
            const overlay = document.getElementById('global-quick-capture-overlay')
            overlay.style.display = 'flex'

            manager.handleGlobalQuickCapture('Task')

            expect(overlay.style.display).toBe('none')
        })

        test('should show toast notification', () => {
            manager.handleGlobalQuickCapture('Task')

            expect(mockApp.showToast).toHaveBeenCalledWith('Task captured!')
        })

        test('should save state for undo', () => {
            manager.handleGlobalQuickCapture('Task')

            expect(mockApp.saveState).toHaveBeenCalledWith('Quick capture task')
        })

        test('should parse input with NLP', () => {
            manager.handleGlobalQuickCapture('Call @john !high')

            expect(mockState.tasks[0].contexts).toContain('@john')
            expect(mockState.tasks[0].energy).toBe('high')
        })
    })
})

describe('GlobalQuickCaptureManager - Templates', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const overlay = document.createElement('div')
        overlay.id = 'global-quick-capture-overlay'
        overlay.style.display = 'none'
        document.body.appendChild(overlay)

        const templates = document.createElement('div')
        templates.id = 'global-quick-capture-templates'
        templates.style.display = 'none'
        overlay.appendChild(templates)

        const templatesList = document.createElement('div')
        templatesList.id = 'global-quick-capture-templates-list'
        templates.appendChild(templatesList)

        mockState = {
            tasks: [],
            projects: [],
            templates: [
                {
                    id: 'tmpl1',
                    title: 'Weekly Review',
                    description: 'Review tasks for the week',
                    category: 'Review',
                    createTask: function () {
                        return { id: 'task1', title: this.title, description: this.description }
                    }
                },
                {
                    id: 'tmpl2',
                    title: 'Morning Routine',
                    category: 'Daily',
                    createTask: function () {
                        return { id: 'task2', title: this.title }
                    }
                }
            ]
        }

        mockApp = new GTDApp()
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined)
        mockApp.renderView = jest.fn()
        mockApp.updateCounts = jest.fn()
        mockApp.showToast = jest.fn()

        manager = new GlobalQuickCaptureManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('toggleQuickCaptureTemplates()', () => {
        test('should show templates when hidden', () => {
            const templates = document.getElementById('global-quick-capture-templates')

            manager.toggleQuickCaptureTemplates()

            expect(templates.style.display).toBe('block')
        })

        test('should hide templates when shown', () => {
            const templates = document.getElementById('global-quick-capture-templates')
            templates.style.display = 'block'

            manager.toggleQuickCaptureTemplates()

            expect(templates.style.display).toBe('none')
        })

        test('should render templates list when showing', () => {
            const templatesList = document.getElementById('global-quick-capture-templates-list')

            manager.toggleQuickCaptureTemplates()

            expect(templatesList.innerHTML).toContain('Weekly Review')
            expect(templatesList.innerHTML).toContain('Morning Routine')
        })

        test('should show message when no templates', () => {
            mockState.templates = []

            const templatesList = document.getElementById('global-quick-capture-templates-list')

            manager.toggleQuickCaptureTemplates()

            expect(templatesList.innerHTML).toContain('No templates available')
        })
    })

    describe('selectTemplateForQuickCapture()', () => {
        test('should create task from template', () => {
            manager.selectTemplateForQuickCapture('tmpl1')

            expect(mockState.tasks.length).toBe(1)
            expect(mockState.tasks[0].title).toBe('Weekly Review')
        })

        test('should do nothing for non-existent template', () => {
            manager.selectTemplateForQuickCapture('nonexistent')

            expect(mockState.tasks.length).toBe(0)
        })

        test('should persist changes', () => {
            manager.selectTemplateForQuickCapture('tmpl1')

            expect(mockApp.saveTasks).toHaveBeenCalled()
        })

        test('should update UI', () => {
            manager.selectTemplateForQuickCapture('tmpl1')

            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
        })

        test('should close overlay', () => {
            const overlay = document.getElementById('global-quick-capture-overlay')
            overlay.style.display = 'flex'

            manager.selectTemplateForQuickCapture('tmpl1')

            expect(overlay.style.display).toBe('none')
        })

        test('should show toast with template title', () => {
            manager.selectTemplateForQuickCapture('tmpl1')

            expect(mockApp.showToast).toHaveBeenCalledWith(
                'Created task from template: Weekly Review'
            )
        })
    })
})

describe('GlobalQuickCaptureManager - Keyboard Shortcuts', () => {
    let manager
    let mockState
    let mockApp
    let input

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const overlay = document.createElement('div')
        overlay.id = 'global-quick-capture-overlay'
        overlay.style.display = 'none'
        document.body.appendChild(overlay)

        input = document.createElement('input')
        input.id = 'global-quick-capture-input'
        overlay.appendChild(input)

        const closeBtn = document.createElement('button')
        closeBtn.id = 'close-global-quick-capture'
        overlay.appendChild(closeBtn)

        const templates = document.createElement('div')
        templates.id = 'global-quick-capture-templates'
        templates.style.display = 'none'
        overlay.appendChild(templates)

        const templatesList = document.createElement('div')
        templatesList.id = 'global-quick-capture-templates-list'
        templates.appendChild(templatesList)

        mockState = {
            tasks: [],
            projects: [],
            templates: []
        }

        mockApp = new GTDApp()
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined)
        mockApp.renderView = jest.fn()
        mockApp.updateCounts = jest.fn()
        mockApp.saveState = jest.fn()
        mockApp.showToast = jest.fn()

        manager = new GlobalQuickCaptureManager(mockState, mockApp)
        manager.setupGlobalQuickCapture()
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should open on Alt+N', () => {
        manager.openGlobalQuickCapture = jest.fn()

        const event = new KeyboardEvent('keydown', { altKey: true, key: 'n' })
        document.dispatchEvent(event)

        expect(manager.openGlobalQuickCapture).toHaveBeenCalled()
    })

    test('should handle Enter key in input', () => {
        manager.handleGlobalQuickCapture = jest.fn()
        input.value = 'Test task'

        const event = new KeyboardEvent('keypress', { key: 'Enter' })
        input.dispatchEvent(event)

        expect(manager.handleGlobalQuickCapture).toHaveBeenCalledWith('Test task')
    })

    test('should not handle Enter with empty input', () => {
        manager.handleGlobalQuickCapture = jest.fn()
        input.value = ''

        const event = new KeyboardEvent('keypress', { key: 'Enter' })
        input.dispatchEvent(event)

        expect(manager.handleGlobalQuickCapture).not.toHaveBeenCalled()
    })

    test('should toggle templates on T key', () => {
        manager.toggleQuickCaptureTemplates = jest.fn()

        const event = new KeyboardEvent('keydown', { key: 't' })
        input.dispatchEvent(event)

        expect(manager.toggleQuickCaptureTemplates).toHaveBeenCalled()
    })

    test('should close on Escape key', () => {
        const overlay = document.getElementById('global-quick-capture-overlay')
        overlay.style.display = 'flex'

        const event = new KeyboardEvent('keydown', { key: 'Escape' })
        document.dispatchEvent(event)

        expect(overlay.style.display).toBe('none')
    })

    test('should close on overlay click', () => {
        const overlay = document.getElementById('global-quick-capture-overlay')
        overlay.style.display = 'flex'

        overlay.dispatchEvent(new Event('click'))

        expect(overlay.style.display).toBe('none')
    })
})
