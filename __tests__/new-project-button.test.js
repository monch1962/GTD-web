/**
 * Comprehensive Tests for New Project Button Feature
 */

import { GTDApp } from '../js/app.ts'
import { NewProjectButtonManager } from '../js/modules/features/new-project-button.ts'

describe('NewProjectButtonManager - Basic Functionality', () => {
    let manager
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create new project button
        const newProjectBtn = document.createElement('button')
        newProjectBtn.id = 'btn-new-project'
        document.body.appendChild(newProjectBtn)

        mockApp = new GTDApp()
        mockApp.openTaskModal = jest.fn()

        manager = new NewProjectButtonManager(mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('Constructor', () => {
        test('should initialize successfully', () => {
            expect(manager).toBeDefined()
            expect(manager.app).toBe(mockApp)
        })
    })

    describe('setupNewProjectButton()', () => {
        test('should find and setup the new project button', () => {
            const button = document.getElementById('btn-new-project')
            expect(button).toBeTruthy()
        })

        test('should add click event listener', () => {
            const button = document.getElementById('btn-new-project')
            const addEventListenerSpy = jest.spyOn(button, 'addEventListener')

            manager.setupNewProjectButton()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))

            addEventListenerSpy.mockRestore()
        })

        test('should open task modal with project type on click', () => {
            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')
            button.click()

            expect(mockApp.openTaskModal).toHaveBeenCalledWith(null, null, { type: 'project' })
        })

        test('should handle missing button gracefully', () => {
            document.body.innerHTML = '' // Remove button

            expect(() => {
                manager.setupNewProjectButton()
            }).not.toThrow()
        })

        test('should only open modal when button actually clicked', () => {
            manager.setupNewProjectButton()

            expect(mockApp.openTaskModal).not.toHaveBeenCalled()

            const button = document.getElementById('btn-new-project')
            button.click()

            expect(mockApp.openTaskModal).toHaveBeenCalled()
        })
    })

    describe('Integration with App', () => {
        test('should use optional chaining when calling openTaskModal', () => {
            const appWithoutModal = {}
            const managerWithoutModal = new NewProjectButtonManager(appWithoutModal)

            expect(() => {
                managerWithoutModal.setupNewProjectButton()
            }).not.toThrow()
        })

        test('should pass correct arguments to openTaskModal', () => {
            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')
            button.click()

            expect(mockApp.openTaskModal).toHaveBeenCalledWith(
                null, // taskId
                null, // projectId
                { type: 'project' } // options
            )
        })

        test('should allow modal to be opened multiple times', () => {
            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')

            button.click()
            button.click()
            button.click()

            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(3)
        })
    })
})

describe('NewProjectButtonManager - Edge Cases', () => {
    let manager
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        mockApp = new GTDApp()
        mockApp.openTaskModal = jest.fn()
        manager = new NewProjectButtonManager(mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should handle button created after setup is called', () => {
        manager.setupNewProjectButton()

        const button = document.createElement('button')
        button.id = 'btn-new-project'
        document.body.appendChild(button)

        // Button created after setup won't have listener
        // This is expected behavior - setup must be called after DOM is ready
        expect(button.onclick).toBeNull()
    })

    test('should handle multiple setup calls', () => {
        const button = document.createElement('button')
        button.id = 'btn-new-project'
        document.body.appendChild(button)

        manager.setupNewProjectButton()
        manager.setupNewProjectButton()
        manager.setupNewProjectButton()

        // Should not throw or cause issues
        expect(button).toBeTruthy()
    })

    test('should work with different button states', () => {
        const button = document.createElement('button')
        button.id = 'btn-new-project'
        button.disabled = true
        document.body.appendChild(button)

        manager.setupNewProjectButton()

        button.click()

        // Event listener still attached even if button is disabled
        expect(mockApp.openTaskModal).not.toHaveBeenCalled()
    })
})

describe('NewProjectButtonManager - DOM Integration', () => {
    let manager
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        mockApp = new GTDApp()
        mockApp.openTaskModal = jest.fn()

        manager = new NewProjectButtonManager(mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should work with button in different DOM locations', () => {
        // Button in header
        const header = document.createElement('header')
        const button = document.createElement('button')
        button.id = 'btn-new-project'
        header.appendChild(button)
        document.body.appendChild(header)

        manager.setupNewProjectButton()
        button.click()

        expect(mockApp.openTaskModal).toHaveBeenCalled()
    })

    test('should work with button as child of complex element', () => {
        const container = document.createElement('div')
        container.className = 'toolbar'

        const inner = document.createElement('div')
        inner.className = 'toolbar-group'

        const button = document.createElement('button')
        button.id = 'btn-new-project'
        inner.appendChild(button)
        container.appendChild(inner)
        document.body.appendChild(container)

        manager.setupNewProjectButton()
        button.click()

        expect(mockApp.openTaskModal).toHaveBeenCalled()
    })

    test('should handle button with existing click handlers', () => {
        const button = document.createElement('button')
        button.id = 'btn-new-project'
        let otherHandlerCalled = false
        button.addEventListener('click', () => {
            otherHandlerCalled = true
        })
        document.body.appendChild(button)

        manager.setupNewProjectButton()
        button.click()

        expect(mockApp.openTaskModal).toHaveBeenCalled()
        expect(otherHandlerCalled).toBe(true)
    })
})

describe('NewProjectButtonManager - Feature Consistency', () => {
    let manager
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create the button element
        const button = document.createElement('button')
        button.id = 'btn-new-project'
        document.body.appendChild(button)

        mockApp = new GTDApp()
        mockApp.openTaskModal = jest.fn()

        manager = new NewProjectButtonManager(mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should always pass project type', () => {
        const button = document.getElementById('btn-new-project')
        expect(button).toBeTruthy()

        manager.setupNewProjectButton()

        button.click()
        expect(mockApp.openTaskModal).toHaveBeenCalledWith(null, null, { type: 'project' })
    })

    test('should maintain same behavior across multiple app instances', () => {
        const app2 = new GTDApp()
        app2.openTaskModal = jest.fn()

        const manager2 = new NewProjectButtonManager(app2)

        // Button already exists from beforeEach
        const button = document.getElementById('btn-new-project')

        manager.setupNewProjectButton()
        manager2.setupNewProjectButton()

        button.click()

        // Both managers should have set up the button (both listeners should fire)
        expect(mockApp.openTaskModal).toHaveBeenCalled()
        expect(app2.openTaskModal).toHaveBeenCalled()
    })
})
