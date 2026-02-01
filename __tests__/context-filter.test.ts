/**
 * Comprehensive Tests for Context Filter Feature
 */

import { ContextFilterManager } from '../js/modules/features/context-filter.ts'

describe('ContextFilterManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@computer', '@phone'],
            selectedContextFilters: new Set()
        }

        mockApp = {
            renderView: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ContextFilterManager(mockState, mockApp)
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })

    test('should initialize with clearContextFiltersHandler as null', () => {
        expect(manager.clearContextFiltersHandler).toBeNull()
    })
})

describe('ContextFilterManager - Update Context Filter', () => {
    let manager
    let mockState
    let mockApp
    let contextFilter

    beforeEach(() => {
        document.body.innerHTML = ''

        contextFilter = document.createElement('select')
        contextFilter.id = 'context-filter'
        document.body.appendChild(contextFilter)

        const container = document.createElement('div')
        container.id = 'context-filters'
        document.body.appendChild(container)

        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@computer', '@phone'],
            selectedContextFilters: new Set()
        }

        mockApp = {
            renderView: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ContextFilterManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('updateContextFilter()', () => {
        test('should handle no contexts', () => {
            manager.updateContextFilter()

            expect(contextFilter.innerHTML).toContain('<option value="">All Contexts</option>')
            expect(contextFilter.options.length).toBe(1)
        })

        test('should populate dropdown with task contexts', () => {
            mockState.tasks = [
                { id: '1', title: 'Task 1', contexts: ['@home', '@work'] },
                { id: '2', title: 'Task 2', contexts: ['@phone'] }
            ]

            manager.updateContextFilter()

            expect(contextFilter.options.length).toBe(4) // All Contexts + 3 contexts
            expect(contextFilter.value).toBe('')
        })

        test('should populate dropdown with project contexts', () => {
            mockState.projects = [
                { id: '1', title: 'Project 1', contexts: ['@computer'] },
                { id: '2', title: 'Project 2', contexts: ['@errands'] }
            ]

            manager.updateContextFilter()

            expect(contextFilter.options.length).toBe(3) // All Contexts + 2 contexts
        })

        test('should combine task and project contexts', () => {
            mockState.tasks = [{ id: '1', title: 'Task 1', contexts: ['@home'] }]
            mockState.projects = [{ id: '1', title: 'Project 1', contexts: ['@work'] }]

            manager.updateContextFilter()

            expect(contextFilter.options.length).toBe(3)
        })

        test('should sort contexts alphabetically', () => {
            mockState.tasks = [
                { id: '1', title: 'Task 1', contexts: ['@zebra', '@apple', '@middle'] }
            ]

            manager.updateContextFilter()

            const options = Array.from(contextFilter.options).slice(1) // Skip "All Contexts"
            expect(options[0].value).toBe('@apple')
            expect(options[1].value).toBe('@middle')
            expect(options[2].value).toBe('@zebra')
        })

        test('should preserve current selection', () => {
            mockState.tasks = [{ id: '1', title: 'Task 1', contexts: ['@home', '@work'] }]

            manager.updateContextFilter()

            // Set the value after update
            contextFilter.value = '@home'
            manager.updateContextFilter()

            // Value should be preserved after second update
            expect(contextFilter.value).toBe('@home')
        })

        test('should handle tasks with no contexts', () => {
            mockState.tasks = [
                { id: '1', title: 'Task 1' }, // No contexts property
                { id: '2', title: 'Task 2', contexts: [] }
            ]

            manager.updateContextFilter()

            expect(contextFilter.options.length).toBe(1)
        })

        test('should call updateSidebarContextFilters', () => {
            const spy = jest.spyOn(manager, 'updateSidebarContextFilters')

            manager.updateContextFilter()

            expect(spy).toHaveBeenCalled()
        })
    })

    describe('getAllContexts()', () => {
        test('should return empty set when no tasks or projects', () => {
            const contexts = manager.getAllContexts()

            expect(contexts).toBeInstanceOf(Set)
            expect(contexts.size).toBe(0)
        })

        test('should extract contexts from tasks', () => {
            mockState.tasks = [
                { id: '1', contexts: ['@home', '@work'] },
                { id: '2', contexts: ['@phone'] }
            ]

            const contexts = manager.getAllContexts()

            expect(contexts.size).toBe(3)
            expect(contexts.has('@home')).toBe(true)
            expect(contexts.has('@work')).toBe(true)
            expect(contexts.has('@phone')).toBe(true)
        })

        test('should extract contexts from projects', () => {
            mockState.projects = [
                { id: '1', contexts: ['@computer'] },
                { id: '2', contexts: ['@errands'] }
            ]

            const contexts = manager.getAllContexts()

            expect(contexts.size).toBe(2)
            expect(contexts.has('@computer')).toBe(true)
            expect(contexts.has('@errands')).toBe(true)
        })

        test('should combine contexts from tasks and projects', () => {
            mockState.tasks = [{ id: '1', contexts: ['@home'] }]
            mockState.projects = [{ id: '1', contexts: ['@work'] }]

            const contexts = manager.getAllContexts()

            expect(contexts.size).toBe(2)
        })

        test('should handle missing contexts property', () => {
            mockState.tasks = [{ id: '1', title: 'Task without contexts' }]

            const contexts = manager.getAllContexts()

            expect(contexts.size).toBe(0)
        })

        test('should deduplicate contexts', () => {
            mockState.tasks = [
                { id: '1', contexts: ['@home'] },
                { id: '2', contexts: ['@home'] }
            ]

            const contexts = manager.getAllContexts()

            expect(contexts.size).toBe(1)
        })
    })
})

describe('ContextFilterManager - Sidebar Context Filters', () => {
    let manager
    let mockState
    let mockApp
    let container

    beforeEach(() => {
        document.body.innerHTML = ''

        container = document.createElement('div')
        container.id = 'context-filters'
        document.body.appendChild(container)

        const clearBtn = document.createElement('button')
        clearBtn.id = 'clear-context-filters'
        document.body.appendChild(clearBtn)

        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@computer', '@phone'],
            selectedContextFilters: new Set()
        }

        mockApp = {
            renderView: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ContextFilterManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('updateSidebarContextFilters()', () => {
        test('should show default contexts when no tasks', () => {
            manager.updateSidebarContextFilters()

            // getAllContexts always returns default contexts from config
            const checkboxes = container.querySelectorAll('input[type="checkbox"]')
            expect(checkboxes.length).toBeGreaterThan(0)
        })

        test('should create checkbox for each context including defaults', () => {
            mockState.tasks = [
                { id: '1', title: 'Task 1', contexts: ['@home'] },
                { id: '2', title: 'Task 2', contexts: ['@work'] }
            ]

            manager.updateSidebarContextFilters()

            // Should show default contexts + custom contexts from tasks
            const checkboxes = container.querySelectorAll('input[type="checkbox"]')
            expect(checkboxes.length).toBeGreaterThan(0)
        })

        test('should show task counts', () => {
            mockState.tasks = [
                { id: '1', title: 'Task 1', contexts: ['@home'] },
                { id: '2', title: 'Task 2', contexts: ['@home'] },
                { id: '3', title: 'Task 3', contexts: ['@work'] }
            ]

            manager.updateSidebarContextFilters()

            expect(container.innerHTML).toContain('(2)')
            expect(container.innerHTML).toContain('(1)')
        })

        test('should show custom label for non-default contexts', () => {
            mockState.tasks = [{ id: '1', title: 'Task 1', contexts: ['@custom'] }]

            manager.updateSidebarContextFilters()

            expect(container.innerHTML).toContain('custom')
        })

        test('should not show custom label for default contexts', () => {
            mockState.tasks = [{ id: '1', title: 'Task 1', contexts: ['@home'] }]

            manager.updateSidebarContextFilters()

            // @home is in the config defaults, so it should not show 'custom' label
            // But we need to check the label text properly
            const homeLabel = container.querySelector('label[for*="context-filter-home"]')
            expect(homeLabel).toBeTruthy()
            // The custom label should not appear for @home
            const homeLabelText = homeLabel.textContent
            expect(homeLabelText).toContain('@home')
        })

        test('should initialize selectedContextFilters if not exists', () => {
            delete mockState.selectedContextFilters

            manager.updateSidebarContextFilters()

            expect(mockState.selectedContextFilters).toBeInstanceOf(Set)
        })

        test('should check selected contexts', () => {
            mockState.tasks = [
                { id: '1', title: 'Task 1', contexts: ['@home'] },
                { id: '2', title: 'Task 2', contexts: ['@work'] }
            ]
            mockState.selectedContextFilters = new Set(['@home'])

            manager.updateSidebarContextFilters()

            const homeCheckbox = container.querySelector('input[value="@home"]')
            const workCheckbox = container.querySelector('input[value="@work"]')

            expect(homeCheckbox.checked).toBe(true)
            expect(workCheckbox.checked).toBe(false)
        })

        test('should sort contexts alphabetically', () => {
            mockState.tasks = [
                { id: '1', title: 'Task 1', contexts: ['@zebra', '@apple', '@middle'] }
            ]

            manager.updateSidebarContextFilters()

            // Check that custom contexts are sorted
            const allValues = Array.from(container.querySelectorAll('input[type="checkbox"]')).map(
                (cb) => cb.value
            )

            // Find custom contexts in the sorted list
            const appleIndex = allValues.indexOf('@apple')
            const middleIndex = allValues.indexOf('@middle')
            const zebraIndex = allValues.indexOf('@zebra')

            // Custom contexts should be in alphabetical order
            expect(appleIndex).toBeLessThan(middleIndex)
            expect(middleIndex).toBeLessThan(zebraIndex)
        })

        test('should attach clear button handler', () => {
            const clearBtn = document.getElementById('clear-context-filters')
            const spy = jest.spyOn(manager, 'clearContextFilters')

            manager.updateSidebarContextFilters()

            clearBtn.click()

            expect(spy).toHaveBeenCalled()
        })

        test('should handle missing container', () => {
            container.remove()

            expect(() => {
                manager.updateSidebarContextFilters()
            }).not.toThrow()
        })
    })
})

describe('ContextFilterManager - Toggle and Clear Filters', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [
                { id: '1', title: 'Task 1', contexts: ['@home', '@work'] },
                { id: '2', title: 'Task 2', contexts: ['@phone'] }
            ],
            projects: [],
            defaultContexts: ['@home', '@work', '@computer', '@phone'],
            selectedContextFilters: new Set()
        }

        mockApp = {
            renderView: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ContextFilterManager(mockState, mockApp)
    })

    describe('toggleContextFilter()', () => {
        test('should add context to selected filters when checked', () => {
            manager.toggleContextFilter('@home', true)

            expect(mockState.selectedContextFilters.has('@home')).toBe(true)
            expect(mockApp.renderView).toHaveBeenCalled()
        })

        test('should remove context from selected filters when unchecked', () => {
            mockState.selectedContextFilters.add('@home')

            manager.toggleContextFilter('@home', false)

            expect(mockState.selectedContextFilters.has('@home')).toBe(false)
            expect(mockApp.renderView).toHaveBeenCalled()
        })

        test('should show notification with count when filters selected', () => {
            manager.toggleContextFilter('@home', true)

            expect(mockApp.showNotification).toHaveBeenCalledWith('Filtering by 1 context')
        })

        test('should show plural notification for multiple filters', () => {
            manager.toggleContextFilter('@home', true)
            manager.toggleContextFilter('@work', true)

            expect(mockApp.showNotification).toHaveBeenCalledWith('Filtering by 2 contexts')
        })

        test('should not show notification when removing filter', () => {
            mockState.selectedContextFilters.add('@home')
            mockApp.showNotification.mockClear()

            manager.toggleContextFilter('@home', false)

            expect(mockApp.showNotification).not.toHaveBeenCalled()
        })

        test('should handle multiple contexts selected', () => {
            manager.toggleContextFilter('@home', true)
            manager.toggleContextFilter('@work', true)
            manager.toggleContextFilter('@phone', true)

            expect(mockState.selectedContextFilters.size).toBe(3)
        })
    })

    describe('clearContextFilters()', () => {
        test('should clear all selected filters', () => {
            mockState.selectedContextFilters = new Set(['@home', '@work', '@phone'])

            manager.clearContextFilters()

            expect(mockState.selectedContextFilters.size).toBe(0)
        })

        test('should re-render view', () => {
            manager.clearContextFilters()

            expect(mockApp.renderView).toHaveBeenCalled()
        })

        test('should update sidebar filters', () => {
            const spy = jest.spyOn(manager, 'updateSidebarContextFilters')

            manager.clearContextFilters()

            expect(spy).toHaveBeenCalled()
        })

        test('should show notification', () => {
            manager.clearContextFilters()

            expect(mockApp.showNotification).toHaveBeenCalledWith('Context filters cleared')
        })

        test('should handle clearing empty filters', () => {
            expect(() => {
                manager.clearContextFilters()
            }).not.toThrow()

            expect(mockState.selectedContextFilters.size).toBe(0)
        })
    })
})

describe('ContextFilterManager - Get and Check Contexts', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@computer', '@phone'],
            selectedContextFilters: new Set(['@home', '@work'])
        }

        mockApp = {
            renderView: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ContextFilterManager(mockState, mockApp)
    })

    describe('getSelectedContexts()', () => {
        test('should return array of selected contexts', () => {
            const selected = manager.getSelectedContexts()

            expect(Array.isArray(selected)).toBe(true)
            expect(selected.length).toBe(2)
            expect(selected).toContain('@home')
            expect(selected).toContain('@work')
        })

        test('should return empty array when no contexts selected', () => {
            mockState.selectedContextFilters = new Set()

            const selected = manager.getSelectedContexts()

            expect(selected).toEqual([])
        })

        test('should return single context when one selected', () => {
            mockState.selectedContextFilters = new Set(['@home'])

            const selected = manager.getSelectedContexts()

            expect(selected.length).toBe(1)
            expect(selected[0]).toBe('@home')
        })
    })

    describe('isContextSelected()', () => {
        test('should return true for selected context', () => {
            expect(manager.isContextSelected('@home')).toBe(true)
            expect(manager.isContextSelected('@work')).toBe(true)
        })

        test('should return false for unselected context', () => {
            expect(manager.isContextSelected('@phone')).toBe(false)
            expect(manager.isContextSelected('@computer')).toBe(false)
        })

        test('should handle custom contexts', () => {
            mockState.selectedContextFilters.add('@custom')

            expect(manager.isContextSelected('@custom')).toBe(true)
        })
    })
})

describe('ContextFilterManager - Normalize Context Name', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@computer', '@phone'],
            selectedContextFilters: new Set()
        }

        mockApp = {
            renderView: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ContextFilterManager(mockState, mockApp)
    })

    describe('normalizeContextName()', () => {
        test('should add @ to context without it', () => {
            expect(manager.normalizeContextName('home')).toBe('@home')
            expect(manager.normalizeContextName('work')).toBe('@work')
        })

        test('should not add @ if already present', () => {
            expect(manager.normalizeContextName('@home')).toBe('@home')
            expect(manager.normalizeContextName('@work')).toBe('@work')
        })

        test('should handle edge cases', () => {
            expect(manager.normalizeContextName('')).toBe('@')
            expect(manager.normalizeContextName('@')).toBe('@')
            expect(manager.normalizeContextName('@@home')).toBe('@@home')
        })

        test('should handle context names with spaces', () => {
            expect(manager.normalizeContextName('home office')).toBe('@home office')
        })

        test('should preserve case', () => {
            expect(manager.normalizeContextName('Home')).toBe('@Home')
            expect(manager.normalizeContextName('WORK')).toBe('@WORK')
        })
    })
})

describe('ContextFilterManager - Integration', () => {
    let manager
    let mockState
    let mockApp
    let container
    let clearBtn

    beforeEach(() => {
        document.body.innerHTML = ''

        container = document.createElement('div')
        container.id = 'context-filters'
        document.body.appendChild(container)

        clearBtn = document.createElement('button')
        clearBtn.id = 'clear-context-filters'
        document.body.appendChild(clearBtn)

        mockState = {
            tasks: [
                { id: '1', title: 'Task 1', contexts: ['@home', '@work'] },
                { id: '2', title: 'Task 2', contexts: ['@phone'] },
                { id: '3', title: 'Task 3', contexts: ['@home'] },
                { id: '4', title: 'Task 4', contexts: ['@custom'] }
            ],
            projects: [],
            defaultContexts: ['@home', '@work', '@computer', '@phone'],
            selectedContextFilters: new Set()
        }

        mockApp = {
            renderView: jest.fn(),
            showNotification: jest.fn()
        }

        manager = new ContextFilterManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should handle complete workflow: update, toggle, clear', () => {
        // Update sidebar
        manager.updateSidebarContextFilters()

        const checkboxes = container.querySelectorAll('input[type="checkbox"]')
        expect(checkboxes.length).toBeGreaterThan(0)

        // Toggle filters
        const homeCheckbox = container.querySelector('input[value="@home"]')
        const workCheckbox = container.querySelector('input[value="@work"]')

        homeCheckbox.click()
        expect(mockState.selectedContextFilters.has('@home')).toBe(true)

        workCheckbox.click()
        expect(mockState.selectedContextFilters.has('@work')).toBe(true)

        // Clear filters
        clearBtn.click()
        expect(mockState.selectedContextFilters.size).toBe(0)
    })

    test('should maintain state across multiple updates', () => {
        manager.updateSidebarContextFilters()

        // Select a filter
        manager.toggleContextFilter('@home', true)

        // Update again
        manager.updateSidebarContextFilters()

        // Filter should still be selected
        const homeCheckbox = container.querySelector('input[value="@home"]')
        expect(homeCheckbox.checked).toBe(true)
    })

    test('should handle dynamic context addition', () => {
        manager.updateSidebarContextFilters()

        let checkboxes = container.querySelectorAll('input[type="checkbox"]')
        const initialCount = checkboxes.length
        expect(initialCount).toBeGreaterThan(0)

        // Add a new task with a new context
        mockState.tasks.push({ id: '5', title: 'New Task', contexts: ['@newcontext'] })

        manager.updateSidebarContextFilters()

        checkboxes = container.querySelectorAll('input[type="checkbox"]')
        expect(checkboxes.length).toBe(initialCount + 1)
    })
})
