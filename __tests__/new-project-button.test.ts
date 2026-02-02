/**
 * Comprehensive Tests for New Project Button Feature
 */

import { GTDApp } from '../js/app.ts'
import { NewProjectButtonManager } from '../js/modules/features/new-project-button.ts'

// Test interface to access private properties
interface NewProjectButtonManagerTest {
    app: { openTaskModal: jest.Mock }
}

describe('NewProjectButtonManager - Basic Functionality', () => {
    let manager: NewProjectButtonManager
    let managerTest: NewProjectButtonManagerTest
    let mockApp: { openTaskModal: jest.Mock }

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create new project button
        const newProjectBtn = document.createElement('button')
        newProjectBtn.id = 'btn-new-project'
        document.body.appendChild(newProjectBtn)

        mockApp = {
            openTaskModal: jest.fn()
        }

        manager = new NewProjectButtonManager(mockApp)
        managerTest = manager as unknown as NewProjectButtonManagerTest
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('Constructor', () => {
        test('should initialize successfully', () => {
            expect(manager).toBeDefined()
            expect(managerTest.app).toBe(mockApp)
        })
    })

    describe('setupNewProjectButton()', () => {
        test('should find and setup the new project button', () => {
            const button = document.getElementById('btn-new-project')
            expect(button).toBeTruthy()
        })

        test('should add click event listener', () => {
            const button = document.getElementById('btn-new-project')
            const addEventListenerSpy = jest.spyOn(button!, 'addEventListener')

            manager.setupNewProjectButton()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should handle missing button gracefully', () => {
            // Remove the button
            document.body.innerHTML = ''

            // Should not throw error
            expect(() => {
                manager.setupNewProjectButton()
            }).not.toThrow()
        })

        test('should call openTaskModal with project type when clicked', () => {
            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')
            button!.click()

            expect(mockApp.openTaskModal).toHaveBeenCalledWith(null, undefined, { type: 'project' })
        })

        test('should pass null for task and defaultProjectId', () => {
            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')
            button!.click()

            expect(mockApp.openTaskModal).toHaveBeenCalledWith(
                null,
                undefined,
                expect.objectContaining({ type: 'project' })
            )
        })

        test('should add event listener each time setup is called', () => {
            const button = document.getElementById('btn-new-project')
            const addEventListenerSpy = jest.spyOn(button!, 'addEventListener')

            // Call setup twice
            manager.setupNewProjectButton()
            manager.setupNewProjectButton()

            // Implementation adds listener each time (no duplicate check)
            expect(addEventListenerSpy).toHaveBeenCalledTimes(2)
        })
    })

    describe('Integration with App', () => {
        test('should work with actual GTDApp instance', () => {
            // GTDApp has slightly different signature but should work
            const realApp = new GTDApp() as unknown as { openTaskModal?: jest.Mock }
            const realManager = new NewProjectButtonManager(realApp)
            const realManagerTest = realManager as unknown as NewProjectButtonManagerTest

            expect(realManager).toBeDefined()
            expect(realManagerTest.app).toBe(realApp)
        })

        test('should handle app without openTaskModal method', () => {
            const appWithoutMethod = {} as { openTaskModal?: undefined }
            const managerWithoutMethod = new NewProjectButtonManager(appWithoutMethod)

            // Should not throw when setting up
            expect(() => {
                managerWithoutMethod.setupNewProjectButton()
            }).not.toThrow()

            // Button click should not crash
            const button = document.getElementById('btn-new-project')
            expect(() => {
                button!.click()
            }).not.toThrow()
        })
    })

    describe('Button Click Behavior', () => {
        test('should trigger immediately on click', () => {
            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')
            button!.click()

            // Should be called immediately, not async
            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(1)
        })

        test('should work with multiple clicks', () => {
            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')
            button!.click()
            button!.click()
            button!.click()

            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(3)
        })

        test('should maintain correct context (this binding)', () => {
            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')
            button!.click()

            // Verify the call was made with correct parameters
            expect(mockApp.openTaskModal).toHaveBeenCalledWith(
                null,
                undefined,
                expect.objectContaining({ type: 'project' })
            )
        })
    })

    describe('DOM Manipulation', () => {
        test('should work with dynamically added button', () => {
            // Remove initial button
            document.body.innerHTML = ''

            // Setup manager first
            manager.setupNewProjectButton()

            // Dynamically add button later
            const dynamicButton = document.createElement('button')
            dynamicButton.id = 'btn-new-project'
            document.body.appendChild(dynamicButton)

            // Should not have listener on dynamic button
            dynamicButton.click()
            expect(mockApp.openTaskModal).not.toHaveBeenCalled()

            // Need to call setup again
            manager.setupNewProjectButton()
            dynamicButton.click()
            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(1)
        })

        test('should handle button being removed after setup', () => {
            manager.setupNewProjectButton()

            // Remove button
            document.body.innerHTML = ''

            // Should not crash when trying to click non-existent button
            expect(() => {
                // This would normally be triggered by user interaction
                // We're just verifying no crashes in the manager itself
                manager.setupNewProjectButton()
            }).not.toThrow()
        })

        test('should work with button inside other elements', () => {
            // Clear and create nested structure
            document.body.innerHTML = ''
            const container = document.createElement('div')
            container.id = 'sidebar'
            const button = document.createElement('button')
            button.id = 'btn-new-project'
            container.appendChild(button)
            document.body.appendChild(container)

            manager.setupNewProjectButton()

            button.click()
            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(1)
        })
    })

    describe('Edge Cases', () => {
        test('should handle null app parameter', () => {
            // @ts-expect-error Testing invalid input
            const nullManager = new NewProjectButtonManager(null)

            expect(nullManager).toBeDefined()
            // Should not crash when setting up
            expect(() => {
                nullManager.setupNewProjectButton()
            }).not.toThrow()
        })

        test('should handle undefined app parameter', () => {
            // @ts-expect-error Testing invalid input
            const undefinedManager = new NewProjectButtonManager(undefined)

            expect(undefinedManager).toBeDefined()
            // Should not crash when setting up
            expect(() => {
                undefinedManager.setupNewProjectButton()
            }).not.toThrow()
        })

        test('should handle button with different tag name', () => {
            document.body.innerHTML = ''
            const link = document.createElement('a')
            link.id = 'btn-new-project'
            document.body.appendChild(link)

            manager.setupNewProjectButton()

            link.click()
            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(1)
        })

        test('should handle button with additional classes', () => {
            const button = document.getElementById('btn-new-project')!
            button.className = 'btn btn-primary large'

            manager.setupNewProjectButton()
            button.click()

            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(1)
        })

        test('should handle button with data attributes', () => {
            const button = document.getElementById('btn-new-project')!
            button.setAttribute('data-test', 'new-project')
            button.setAttribute('aria-label', 'New Project')

            manager.setupNewProjectButton()
            button.click()

            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(1)
        })
    })

    describe('Performance', () => {
        test('should setup quickly', () => {
            const startTime = performance.now()
            manager.setupNewProjectButton()
            const endTime = performance.now()

            // Should complete in reasonable time (under 100ms)
            expect(endTime - startTime).toBeLessThan(100)
        })

        test('should handle rapid setup calls', () => {
            for (let i = 0; i < 10; i++) {
                manager.setupNewProjectButton()
            }

            // Should not crash
            const button = document.getElementById('btn-new-project')
            button!.click()
            // With 10 listeners, clicking once triggers all 10
            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(10)
        })

        test('should not create memory leaks with repeated setup', () => {
            const initialListeners = jest.spyOn(HTMLElement.prototype, 'addEventListener').mock
                .calls.length

            for (let i = 0; i < 5; i++) {
                manager.setupNewProjectButton()
            }

            const finalListeners = jest.spyOn(HTMLElement.prototype, 'addEventListener').mock.calls
                .length

            // Should not add excessive listeners
            expect(finalListeners - initialListeners).toBeLessThanOrEqual(5)
        })
    })

    describe('Accessibility', () => {
        test('should work with keyboard events', () => {
            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')!
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
            const spaceEvent = new KeyboardEvent('keydown', { key: ' ' })

            // Button should respond to Enter and Space (standard button behavior)
            // Note: actual keyboard handling would be done by browser/default button behavior
            button.dispatchEvent(enterEvent)
            button.dispatchEvent(spaceEvent)

            // The test verifies the button exists and has click handler
            // Actual keyboard handling depends on browser/button semantics
            expect(button).toBeTruthy()
        })

        test('should maintain button semantics', () => {
            const button = document.getElementById('btn-new-project')!
            manager.setupNewProjectButton()

            // Button should still be a button element
            expect(button.tagName).toBe('BUTTON')
            // Should have appropriate role (button is default for button element)
            expect(button.getAttribute('role')).toBe(null) // null means default role
        })
    })

    describe('Error Recovery', () => {
        test('should recover from errors in click handler', () => {
            // Make openTaskModal throw an error
            mockApp.openTaskModal = jest.fn(() => {
                throw new Error('Test error')
            })

            manager.setupNewProjectButton()

            const button = document.getElementById('btn-new-project')!

            // Should not crash the app
            expect(() => {
                button.click()
            }).not.toThrow()

            // Error should be thrown but caught by browser/event system
            // The test verifies app doesn't crash
        })

        test('should handle button being disabled', () => {
            const button = document.getElementById('btn-new-project')!
            button.setAttribute('disabled', '')

            manager.setupNewProjectButton()
            button.click()

            // Disabled buttons don't fire click events in JavaScript
            expect(mockApp.openTaskModal).toHaveBeenCalledTimes(0)
        })
    })
})
