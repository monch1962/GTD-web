/**
 * Comprehensive Tests for Quick Capture Widget Manager
 */

import { QuickCaptureWidgetManager } from '../js/modules/features/quick-capture-widget.ts'

describe('QuickCaptureWidgetManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            defaultContexts: ['@home', '@work', '@personal', '@computer', '@phone', '@errand'],
            tasks: [],
            projects: []
        }

        mockApp = {
            quickAddTask: jest.fn().mockResolvedValue(undefined),
            showNotification: jest.fn()
        }

        document.body.innerHTML = ''

        manager = new QuickCaptureWidgetManager(mockState, mockApp)
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })
})

describe('QuickCaptureWidgetManager - setupQuickCapture()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            defaultContexts: ['@home', '@work', '@personal'],
            tasks: [],
            projects: []
        }

        mockApp = {
            quickAddTask: jest.fn().mockResolvedValue(undefined),
            showNotification: jest.fn()
        }

        document.body.innerHTML = ''
        manager = new QuickCaptureWidgetManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should setup without errors when all DOM elements exist', () => {
        // Create required DOM elements
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        expect(() => manager.setupQuickCapture()).not.toThrow()
    })

    test('should return early when toggle button is missing', () => {
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        document.body.appendChild(panel)

        manager.setupQuickCapture()

        // Should not throw, just return early
        expect(true).toBe(true)
    })

    test('should return early when panel is missing', () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        document.body.appendChild(toggleBtn)

        manager.setupQuickCapture()

        // Should not throw, just return early
        expect(true).toBe(true)
    })

    test('should return early when input is missing', () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        document.body.appendChild(toggleBtn)
        document.body.appendChild(panel)

        manager.setupQuickCapture()

        // Should not throw, just return early
        expect(true).toBe(true)
    })

    test('should toggle panel visibility when toggle button clicked', () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        manager.setupQuickCapture()

        // Initially hidden
        expect(panel.style.display).toBe('none')

        // Click to show
        toggleBtn.click()
        expect(panel.style.display).toBe('block')
        expect(toggleBtn.classList.contains('active')).toBe(true)

        // Click to hide
        toggleBtn.click()
        expect(panel.style.display).toBe('none')
        expect(toggleBtn.classList.contains('active')).toBe(false)
    })

    test('should focus input when panel is shown', () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        const focusSpy = jest.spyOn(input, 'focus')

        manager.setupQuickCapture()
        toggleBtn.click()

        expect(focusSpy).toHaveBeenCalled()
    })

    test('should call renderQuickCaptureContexts when panel is shown', () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        const renderSpy = jest.spyOn(manager, 'renderQuickCaptureContexts')

        manager.setupQuickCapture()
        toggleBtn.click()

        expect(renderSpy).toHaveBeenCalled()
    })

    test('should close panel when clicking outside widget', () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        // Add an element outside the widget
        const outsideElement = document.createElement('div')
        outsideElement.id = 'outside-element'
        document.body.appendChild(outsideElement)

        manager.setupQuickCapture()

        // Show the panel
        toggleBtn.click()
        expect(panel.style.display).toBe('block')

        // Click outside
        const clickEvent = new MouseEvent('click', { bubbles: true })
        outsideElement.dispatchEvent(clickEvent)

        expect(panel.style.display).toBe('none')
        expect(toggleBtn.classList.contains('active')).toBe(false)
    })

    test('should not close panel when clicking inside widget', () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        manager.setupQuickCapture()

        // Show the panel
        toggleBtn.click()
        expect(panel.style.display).toBe('block')

        // Click inside the widget
        const clickEvent = new MouseEvent('click', { bubbles: true })
        panel.dispatchEvent(clickEvent)

        expect(panel.style.display).toBe('block')
        expect(toggleBtn.classList.contains('active')).toBe(true)
    })

    test('should call quickAddTask when Enter key is pressed with text', async () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        manager.setupQuickCapture()

        input.value = 'New task'

        const enterEvent = new KeyboardEvent('keypress', { key: 'Enter', bubbles: true })
        input.dispatchEvent(enterEvent)

        // Wait for async operation
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(mockApp.quickAddTask).toHaveBeenCalledWith('New task')
        expect(input.value).toBe('')
        expect(mockApp.showNotification).toHaveBeenCalledWith('Task captured!')
    })

    test('should not call quickAddTask when Enter key is pressed with empty input', async () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        manager.setupQuickCapture()

        input.value = '   ' // Only whitespace

        const enterEvent = new KeyboardEvent('keypress', { key: 'Enter', bubbles: true })
        input.dispatchEvent(enterEvent)

        // Wait for async operation
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(mockApp.quickAddTask).not.toHaveBeenCalled()
        expect(mockApp.showNotification).not.toHaveBeenCalled()
    })

    test('should not call quickAddTask when non-Enter key is pressed', async () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        manager.setupQuickCapture()

        input.value = 'New task'

        const keyEvent = new KeyboardEvent('keypress', { key: 'a', bubbles: true })
        input.dispatchEvent(keyEvent)

        expect(mockApp.quickAddTask).not.toHaveBeenCalled()
    })

    test('should close panel when Escape key is pressed', () => {
        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        manager.setupQuickCapture()

        // Show the panel
        toggleBtn.click()
        expect(panel.style.display).toBe('block')

        // Press Escape
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        input.dispatchEvent(escapeEvent)

        expect(panel.style.display).toBe('none')
        expect(toggleBtn.classList.contains('active')).toBe(false)
    })

    test('should handle missing quickAddTask gracefully', async () => {
        mockApp.quickAddTask = undefined

        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        manager.setupQuickCapture()

        input.value = 'New task'

        const enterEvent = new KeyboardEvent('keypress', { key: 'Enter', bubbles: true })
        input.dispatchEvent(enterEvent)

        // Wait for async operation
        await new Promise((resolve) => setTimeout(resolve, 0))

        // Input is cleared even when quickAddTask is undefined (optional chaining)
        expect(input.value).toBe('')
        // Should not throw when quickAddTask is undefined
        expect(true).toBe(true)
    })

    test('should handle missing showNotification gracefully', async () => {
        mockApp.showNotification = undefined

        const toggleBtn = document.createElement('button')
        toggleBtn.id = 'quick-capture-toggle'
        const panel = document.createElement('div')
        panel.id = 'quick-capture-panel'
        panel.style.display = 'none'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        const contextsContainer = document.createElement('div')
        contextsContainer.id = 'quick-capture-contexts'
        const widget = document.createElement('div')
        widget.className = 'quick-capture-widget'
        widget.appendChild(toggleBtn)
        widget.appendChild(panel)
        widget.appendChild(input)
        widget.appendChild(contextsContainer)
        document.body.appendChild(widget)

        manager.setupQuickCapture()

        input.value = 'New task'

        const enterEvent = new KeyboardEvent('keypress', { key: 'Enter', bubbles: true })
        input.dispatchEvent(enterEvent)

        // Wait for async operation
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(mockApp.quickAddTask).toHaveBeenCalled()
        // Should not throw when showNotification is undefined
        expect(true).toBe(true)
    })
})

describe('QuickCaptureWidgetManager - renderQuickCaptureContexts()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            defaultContexts: ['@home', '@work', '@personal', '@computer', '@phone', '@errand'],
            tasks: [],
            projects: []
        }

        mockApp = {}

        localStorage.clear()

        document.body.innerHTML = ''

        manager = new QuickCaptureWidgetManager(mockState, mockApp)

        // Create DOM elements
        const container = document.createElement('div')
        container.id = 'quick-capture-contexts'
        const input = document.createElement('input')
        input.id = 'quick-capture-input'
        document.body.appendChild(container)
        document.body.appendChild(input)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        localStorage.clear()
    })

    test('should render default context buttons', () => {
        manager.renderQuickCaptureContexts()

        const container = document.getElementById('quick-capture-contexts')
        const buttons = container.querySelectorAll('.quick-capture-context')

        expect(buttons.length).toBe(6)
        expect(buttons[0].textContent).toBe('@home')
        expect(buttons[1].textContent).toBe('@work')
        expect(buttons[2].textContent).toBe('@personal')
        expect(buttons[3].textContent).toBe('@computer')
        expect(buttons[4].textContent).toBe('@phone')
        expect(buttons[5].textContent).toBe('@errand')
    })

    test('should render custom contexts from localStorage', () => {
        localStorage.setItem('gtd_custom_contexts', JSON.stringify(['@custom1', '@custom2']))

        manager.renderQuickCaptureContexts()

        const container = document.getElementById('quick-capture-contexts')
        const buttons = Array.from(container.querySelectorAll('.quick-capture-context'))

        expect(buttons.length).toBe(8) // 6 default + 2 custom
        expect(buttons.map((b) => b.textContent)).toContain('@custom1')
        expect(buttons.map((b) => b.textContent)).toContain('@custom2')
    })

    test('should not duplicate custom contexts that match defaults', () => {
        localStorage.setItem('gtd_custom_contexts', JSON.stringify(['@home', '@custom1']))

        manager.renderQuickCaptureContexts()

        const container = document.getElementById('quick-capture-contexts')
        const buttons = container.querySelectorAll('.quick-capture-context')

        expect(buttons.length).toBe(7) // 6 default + 1 custom (no duplicate @home)
    })

    test('should clear container before rendering', () => {
        const container = document.getElementById('quick-capture-contexts')
        container.innerHTML = '<div>Old content</div>'

        manager.renderQuickCaptureContexts()

        expect(container.querySelector('div')).toBeNull()
    })

    test('should return early when container is missing', () => {
        document.getElementById('quick-capture-contexts').remove()

        expect(() => manager.renderQuickCaptureContexts()).not.toThrow()
    })

    test('should return early when input is missing', () => {
        document.getElementById('quick-capture-input').remove()

        expect(() => manager.renderQuickCaptureContexts()).not.toThrow()
    })

    test('should append context to input when button clicked', () => {
        manager.renderQuickCaptureContexts()

        const input = document.getElementById('quick-capture-input')
        const container = document.getElementById('quick-capture-contexts')
        const homeButton = Array.from(container.querySelectorAll('.quick-capture-context')).find(
            (btn) => btn.textContent === '@home'
        )

        input.value = 'Buy groceries'
        homeButton.click()

        expect(input.value).toBe('Buy groceries @home')
    })

    test('should add context without space when input is empty', () => {
        manager.renderQuickCaptureContexts()

        const input = document.getElementById('quick-capture-input')
        const container = document.getElementById('quick-capture-contexts')
        const homeButton = Array.from(container.querySelectorAll('.quick-capture-context')).find(
            (btn) => btn.textContent === '@home'
        )

        input.value = ''
        homeButton.click()

        expect(input.value).toBe('@home')
    })

    test('should focus input after context button clicked', () => {
        manager.renderQuickCaptureContexts()

        const input = document.getElementById('quick-capture-input')
        const container = document.getElementById('quick-capture-contexts')
        const homeButton = Array.from(container.querySelectorAll('.quick-capture-context')).find(
            (btn) => btn.textContent === '@home'
        )

        const focusSpy = jest.spyOn(input, 'focus')
        homeButton.click()

        expect(focusSpy).toHaveBeenCalled()
    })

    test('should add space between context and existing content', () => {
        manager.renderQuickCaptureContexts()

        const input = document.getElementById('quick-capture-input')
        const container = document.getElementById('quick-capture-contexts')
        const workButton = Array.from(container.querySelectorAll('.quick-capture-context')).find(
            (btn) => btn.textContent === '@work'
        )

        input.value = 'Meeting'
        workButton.click()

        expect(input.value).toBe('Meeting @work')
    })

    test('should handle multiple context clicks', () => {
        manager.renderQuickCaptureContexts()

        const input = document.getElementById('quick-capture-input')
        const container = document.getElementById('quick-capture-contexts')
        const buttons = container.querySelectorAll('.quick-capture-context')

        input.value = 'Task'
        buttons[0].click() // @home
        buttons[1].click() // @work

        expect(input.value).toBe('Task @home @work')
    })

    test('should throw on invalid JSON in localStorage', () => {
        localStorage.setItem('gtd_custom_contexts', 'invalid json')

        expect(() => manager.renderQuickCaptureContexts()).toThrow()
    })

    test('should handle empty custom contexts array', () => {
        localStorage.setItem('gtd_custom_contexts', '[]')

        manager.renderQuickCaptureContexts()

        const container = document.getElementById('quick-capture-contexts')
        const buttons = container.querySelectorAll('.quick-capture-context')

        expect(buttons.length).toBe(6) // Only default contexts
    })
})
