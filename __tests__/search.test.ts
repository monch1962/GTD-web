/**
 * Comprehensive Tests for Search Feature
 */

import { GTDApp } from '../js/app.ts'
import { SearchManager } from '../js/modules/features/search.ts'

// Helper function to add options to select elements
function addOption (select: HTMLSelectElement, value: string, text: string): void {
    const option = document.createElement('option')
    option.value = value
    option.textContent = text
    select.appendChild(option)
}

describe('SearchManager - Initialization', () => {
    let manager: SearchManager
    let mockState: any
    let mockApp: GTDApp

    beforeEach(() => {
        localStorage.clear()

        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@phone'],
            searchQuery: '',
            advancedSearchFilters: {
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()
        mockApp.renderView = jest.fn()

        manager = new SearchManager(mockState, mockApp)
        manager.setupSearch()
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.getSearchQuery()).toBe('')
    })

    test('should initialize search state', () => {
        expect(manager.getSearchQuery()).toBe('')
        expect(manager.getAdvancedFilters().sort).toBe('updated')
    })

    test('should load saved searches from localStorage', () => {
        const savedSearches = [{ id: '1', name: 'Work tasks', query: 'work', filters: {} }]
        localStorage.setItem('gtd_saved_searches', JSON.stringify(savedSearches))

        // Create a state without savedSearches defined
        const stateWithoutSaved = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@phone'],
            searchQuery: '',
            advancedSearchFilters: {
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            }
            // Note: savedSearches is NOT defined, so it should load from localStorage
        }

        const managerWithSaved = new SearchManager(stateWithoutSaved, mockApp)

        expect(managerWithSaved.getSavedSearches()).toEqual(savedSearches)

        localStorage.removeItem('gtd_saved_searches')
    })
})

describe('SearchManager - Search Query', () => {
    let manager: SearchManager
    let mockState: any
    let mockApp: GTDApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create required DOM elements
        const searchInput = document.createElement('input')
        searchInput.id = 'global-search'
        document.body.appendChild(searchInput)

        const clearBtn = document.createElement('button')
        clearBtn.id = 'clear-search'
        clearBtn.style.display = 'none'
        document.body.appendChild(clearBtn)

        const searchResults = document.createElement('div')
        searchResults.id = 'search-results'
        document.body.appendChild(searchResults)

        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@phone'],
            searchQuery: '',
            advancedSearchFilters: {
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()
        mockApp.renderView = jest.fn()

        manager = new SearchManager(mockState, mockApp)
        manager.setupSearch()
    })

    test('should update search query in state when input event fires', () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement
        searchInput.value = 'test query'

        // Simulate input event (this is how SearchManager updates the query)
        searchInput.dispatchEvent(new Event('input'))

        expect(mockState.searchQuery).toBe('test query')
    })

    test('should show clear button when search query is not empty', () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement
        const clearBtn = document.getElementById('clear-search') as HTMLButtonElement

        searchInput.value = 'test'
        searchInput.dispatchEvent(new Event('input'))

        expect(clearBtn.style.display).toBe('block')
    })

    test('should hide clear button when search query is empty', () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement
        const clearBtn = document.getElementById('clear-search') as HTMLButtonElement

        searchInput.value = ''
        searchInput.dispatchEvent(new Event('input'))

        expect(clearBtn.style.display).toBe('none')
    })

    test('should render view after search input event', () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement
        searchInput.value = 'test'
        searchInput.dispatchEvent(new Event('input'))

        expect(mockApp.renderView).toHaveBeenCalled()
    })

    test('should handle search input events', () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement

        searchInput.value = 'new query'
        searchInput.dispatchEvent(new Event('input'))

        expect(mockState.searchQuery).toBe('new query')
        expect(mockApp.renderView).toHaveBeenCalled()
    })

    test('should handle search with special characters', () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement
        searchInput.value = 'test & "quotes" <tags>'
        searchInput.dispatchEvent(new Event('input'))

        expect(mockState.searchQuery).toBe('test & "quotes" <tags>')
    })

    test('should handle empty search input', () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement
        searchInput.value = '   ' // Spaces only
        searchInput.dispatchEvent(new Event('input'))

        expect(mockState.searchQuery).toBe('   ')
    })

    test('should preserve existing advanced filters when updating search', () => {
        mockState.advancedSearchFilters.context = '@work'
        mockState.advancedSearchFilters.energy = 'high'

        const searchInput = document.getElementById('global-search') as HTMLInputElement
        searchInput.value = 'new query'
        searchInput.dispatchEvent(new Event('input'))

        expect(mockState.advancedSearchFilters.context).toBe('@work')
        expect(mockState.advancedSearchFilters.energy).toBe('high')
    })
})

describe('SearchManager - Clear Search', () => {
    let manager: SearchManager
    let mockState: any
    let mockApp: GTDApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create required DOM elements
        const searchInput = document.createElement('input')
        searchInput.id = 'global-search'
        document.body.appendChild(searchInput)

        const clearBtn = document.createElement('button')
        clearBtn.id = 'clear-search'
        clearBtn.style.display = 'block'
        document.body.appendChild(clearBtn)

        const searchResults = document.createElement('div')
        searchResults.id = 'search-results'
        document.body.appendChild(searchResults)

        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@phone'],
            searchQuery: 'existing query',
            advancedSearchFilters: {
                context: '@work',
                energy: 'high',
                status: 'next',
                due: 'today',
                sort: 'updated'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()
        mockApp.renderView = jest.fn()

        manager = new SearchManager(mockState, mockApp)
        manager.setupSearch()
    })

    test('should clear search query', () => {
        manager.clearSearch()

        expect(mockState.searchQuery).toBe('')
    })

    test('should clear advanced search filters', () => {
        manager.clearSearch()

        expect(mockState.advancedSearchFilters.context).toBe('')
        expect(mockState.advancedSearchFilters.energy).toBe('')
        expect(mockState.advancedSearchFilters.status).toBe('')
        expect(mockState.advancedSearchFilters.due).toBe('')
        // Sort should be preserved
        expect(mockState.advancedSearchFilters.sort).toBe('updated')
    })

    test('should clear search input field', () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement
        searchInput.value = 'test query'

        manager.clearSearch()

        expect(searchInput.value).toBe('')
    })

    test('should hide clear button', () => {
        const clearBtn = document.getElementById('clear-search') as HTMLButtonElement
        clearBtn.style.display = 'block'

        manager.clearSearch()

        expect(clearBtn.style.display).toBe('none')
    })

    test('should clear search input and filters', () => {
        const searchInput = document.getElementById('global-search') as HTMLInputElement
        searchInput.value = 'test query'

        manager.clearSearch()

        expect(searchInput.value).toBe('')
        expect(mockState.searchQuery).toBe('')
    })

    test('should render view after clearing', () => {
        manager.clearSearch()

        expect(mockApp.renderView).toHaveBeenCalled()
    })

    test('should handle clear button click', () => {
        const clearBtn = document.getElementById('clear-search') as HTMLButtonElement
        const searchInput = document.getElementById('global-search') as HTMLInputElement

        // Set up initial state
        searchInput.value = 'test query'
        searchInput.dispatchEvent(new Event('input'))

        // Now click clear button
        clearBtn.click()

        expect(searchInput.value).toBe('')
        expect(mockState.searchQuery).toBe('')
    })

    test('should reset to default sort when clearing', () => {
        mockState.advancedSearchFilters.sort = 'dueDate'

        manager.clearSearch()

        expect(mockState.advancedSearchFilters.sort).toBe('updated')
    })

    test('should not affect saved searches', () => {
        mockState.savedSearches = [{ id: '1', name: 'Work', query: '@work', filters: {} }]

        manager.clearSearch()

        expect(mockState.savedSearches).toHaveLength(1)
    })

    test('should handle multiple clear calls', () => {
        manager.clearSearch()
        manager.clearSearch() // Second call should not break

        expect(mockState.searchQuery).toBe('')
        expect(mockApp.renderView).toHaveBeenCalledTimes(2)
    })

    test('should work when search is already empty', () => {
        mockState.searchQuery = ''
        mockState.advancedSearchFilters.context = ''
        mockState.advancedSearchFilters.energy = ''

        manager.clearSearch()

        expect(mockState.searchQuery).toBe('')
        expect(mockState.advancedSearchFilters.context).toBe('')
    })
})

describe('SearchManager - Advanced Filters', () => {
    let manager: SearchManager
    let mockState: any
    let mockApp: GTDApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create required elements for setupSearch
        const searchInput = document.createElement('input')
        searchInput.id = 'global-search'
        document.body.appendChild(searchInput)

        const clearSearchBtn = document.createElement('button')
        clearSearchBtn.id = 'clear-search'
        document.body.appendChild(clearSearchBtn)

        const advancedSearchPanel = document.createElement('div')
        advancedSearchPanel.id = 'advanced-search-panel'
        document.body.appendChild(advancedSearchPanel)

        // Create filter elements with options
        const searchContext = document.createElement('select')
        searchContext.id = 'search-context'
        addOption(searchContext, '', 'All Contexts')
        addOption(searchContext, '@home', '@home')
        addOption(searchContext, '@work', '@work')
        addOption(searchContext, '@office', '@office')
        document.body.appendChild(searchContext)

        const searchEnergy = document.createElement('select')
        searchEnergy.id = 'search-energy'
        addOption(searchEnergy, '', 'All')
        addOption(searchEnergy, 'high', 'High')
        addOption(searchEnergy, 'medium', 'Medium')
        addOption(searchEnergy, 'low', 'Low')
        document.body.appendChild(searchEnergy)

        const searchStatus = document.createElement('select')
        searchStatus.id = 'search-status'
        addOption(searchStatus, '', 'All')
        addOption(searchStatus, 'inbox', 'Inbox')
        addOption(searchStatus, 'next', 'Next')
        addOption(searchStatus, 'waiting', 'Waiting')
        addOption(searchStatus, 'someday', 'Someday')
        document.body.appendChild(searchStatus)

        const searchDue = document.createElement('select')
        searchDue.id = 'search-due'
        addOption(searchDue, '', 'Any')
        addOption(searchDue, 'today', 'Today')
        addOption(searchDue, 'week', 'This Week')
        addOption(searchDue, 'month', 'This Month')
        document.body.appendChild(searchDue)

        const searchSort = document.createElement('select')
        searchSort.id = 'search-sort'
        addOption(searchSort, 'updated', 'Recently Updated')
        addOption(searchSort, 'priority', 'Priority')
        addOption(searchSort, 'due', 'Due Date')
        searchSort.value = 'updated'
        document.body.appendChild(searchSort)

        const saveSearchBtn = document.createElement('button')
        saveSearchBtn.id = 'save-search'
        document.body.appendChild(saveSearchBtn)

        const savedSearchesSelect = document.createElement('select')
        savedSearchesSelect.id = 'saved-searches'
        document.body.appendChild(savedSearchesSelect)

        const deleteSavedSearchBtn = document.createElement('button')
        deleteSavedSearchBtn.id = 'delete-saved-search'
        document.body.appendChild(deleteSavedSearchBtn)

        const clearAdvancedSearchBtn = document.createElement('button')
        clearAdvancedSearchBtn.id = 'clear-advanced-search'
        document.body.appendChild(clearAdvancedSearchBtn)

        mockState = {
            tasks: [
                {
                    id: '1',
                    title: 'Task at work',
                    contexts: ['@work'],
                    energy: 'high',
                    status: 'next'
                },
                {
                    id: '2',
                    title: 'Task at home',
                    contexts: ['@home'],
                    energy: 'low',
                    status: 'inbox'
                }
            ],
            projects: [],
            defaultContexts: ['@home', '@work', '@phone'],
            searchQuery: '',
            advancedSearchFilters: {
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()
        mockApp.renderView = jest.fn()

        manager = new SearchManager(mockState, mockApp)
        manager.setupSearch()
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should update context filter', () => {
        const searchContext = document.getElementById('search-context') as HTMLSelectElement
        searchContext.value = '@work'
        searchContext.dispatchEvent(new Event('change'))

        expect(mockState.advancedSearchFilters.context).toBe('@work')
    })

    test('should update energy filter', () => {
        const searchEnergy = document.getElementById('search-energy') as HTMLSelectElement
        searchEnergy.value = 'high'
        searchEnergy.dispatchEvent(new Event('change'))

        expect(mockState.advancedSearchFilters.energy).toBe('high')
    })

    test('should update status filter', () => {
        const searchStatus = document.getElementById('search-status') as HTMLSelectElement
        searchStatus.value = 'next'
        searchStatus.dispatchEvent(new Event('change'))

        expect(mockState.advancedSearchFilters.status).toBe('next')
    })

    test('should update sort option', () => {
        const searchSort = document.getElementById('search-sort') as HTMLSelectElement
        searchSort.value = 'priority'
        searchSort.dispatchEvent(new Event('change'))

        expect(mockState.advancedSearchFilters.sort).toBe('priority')
    })

    test('should trigger render on filter change', () => {
        const searchContext = document.getElementById('search-context') as HTMLSelectElement
        searchContext.dispatchEvent(new Event('change'))

        expect(mockApp.renderView).toHaveBeenCalled()
    })
})

describe('SearchManager - Populate Contexts', () => {
    let manager: SearchManager
    let mockState: any
    let mockApp: GTDApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const searchContext = document.createElement('select')
        searchContext.id = 'search-context'
        // Add default "All Contexts" option
        const defaultOption = document.createElement('option')
        defaultOption.value = ''
        defaultOption.textContent = 'All Contexts'
        searchContext.appendChild(defaultOption)
        document.body.appendChild(searchContext)

        mockState = {
            tasks: [
                { id: '1', title: 'Task 1', contexts: ['@work', '@office'] },
                { id: '2', title: 'Task 2', contexts: ['@home'] },
                { id: '3', title: 'Task 3', contexts: ['@phone', '@mobile'] }
            ],
            projects: [],
            defaultContexts: ['@home', '@work'],
            searchQuery: '',
            advancedSearchFilters: {
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()
        manager = new SearchManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should populate contexts from default and tasks', () => {
        manager.populateSearchContexts(
            document.getElementById('search-context') as HTMLSelectElement
        )

        const select = document.getElementById('search-context') as HTMLSelectElement
        const options = Array.from(select.options).map((opt) => opt.value)

        expect(options).toContain('@home')
        expect(options).toContain('@work')
        expect(options).toContain('@office')
        expect(options).toContain('@phone')
        expect(options).toContain('@mobile')
    })

    test('should sort contexts alphabetically', () => {
        manager.populateSearchContexts(
            document.getElementById('search-context') as HTMLSelectElement
        )

        const select = document.getElementById('search-context') as HTMLSelectElement
        const optionValues = Array.from(select.options)
            .slice(1)
            .map((opt) => opt.value)

        const sorted = [...optionValues].sort()
        expect(optionValues).toEqual(sorted)
    })

    test('should preserve first option (empty)', () => {
        manager.populateSearchContexts(
            document.getElementById('search-context') as HTMLSelectElement
        )

        const select = document.getElementById('search-context') as HTMLSelectElement
        expect(select.options[0].value).toBe('')
    })
})

describe('SearchManager - Saved Searches', () => {
    let manager: SearchManager
    let mockState: any
    let mockApp: GTDApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create saved searches dropdown
        const savedSearchesSelect = document.createElement('select')
        savedSearchesSelect.id = 'saved-searches'
        // Add default "Select saved search..." option
        const defaultOption = document.createElement('option')
        defaultOption.value = ''
        defaultOption.textContent = 'Select saved search...'
        savedSearchesSelect.appendChild(defaultOption)
        document.body.appendChild(savedSearchesSelect)

        const deleteSavedSearchBtn = document.createElement('button')
        deleteSavedSearchBtn.id = 'delete-saved-search'
        deleteSavedSearchBtn.style.display = 'none'
        document.body.appendChild(deleteSavedSearchBtn)

        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work'],
            searchQuery: '',
            advancedSearchFilters: {
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()
        mockApp.showNotification = jest.fn()
        mockApp.renderView = jest.fn()

        manager = new SearchManager(mockState, mockApp)
        manager.setupSearch()
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('saveCurrentSearch()', () => {
        beforeEach(() => {
            global.prompt = jest.fn()
        })

        afterEach(() => {
            ;(global.prompt as jest.Mock).mockRestore()
        })

        test('should save current search with name', () => {
            mockState.searchQuery = 'work tasks'
            mockState.advancedSearchFilters.context = '@work'
            ;(global.prompt as jest.Mock).mockReturnValue('My Work Search')

            manager.saveCurrentSearch()

            expect(mockState.savedSearches).toHaveLength(1)
            expect(mockState.savedSearches[0].name).toBe('My Work Search')
            expect(mockState.savedSearches[0].query).toBe('work tasks')
            expect(mockState.savedSearches[0].filters.context).toBe('@work')
        })

        test('should generate unique ID for saved search', () => {
            mockState.searchQuery = 'test'
            ;(global.prompt as jest.Mock).mockReturnValue('Test Search')

            manager.saveCurrentSearch()

            const saved = mockState.savedSearches[0]
            expect(saved.id).toBeDefined()
            expect(typeof saved.id).toBe('string')
        })

        test('should add timestamp to saved search', () => {
            mockState.searchQuery = 'test'
            ;(global.prompt as jest.Mock).mockReturnValue('Test Search')

            manager.saveCurrentSearch()

            const saved = mockState.savedSearches[0]
            expect(saved.createdAt).toBeDefined()
        })

        test('should save to localStorage', () => {
            mockState.searchQuery = 'test'
            ;(global.prompt as jest.Mock).mockReturnValue('Test Search')

            manager.saveCurrentSearch()

            const stored = JSON.parse(localStorage.getItem('gtd_saved_searches') || '[]')
            expect(stored).toHaveLength(1)
            expect(stored[0].name).toBe('Test Search')
        })

        test('should not save when name is empty', () => {
            mockState.searchQuery = 'test'
            ;(global.prompt as jest.Mock).mockReturnValue(null)

            manager.saveCurrentSearch()

            expect(mockState.savedSearches).toHaveLength(0)
        })

        test('should show notification after saving', () => {
            mockState.searchQuery = 'test'
            ;(global.prompt as jest.Mock).mockReturnValue('Test Search')

            manager.saveCurrentSearch()

            expect(mockApp.showNotification).toHaveBeenCalledWith('Search saved!')
        })
    })

    describe('loadSavedSearch()', () => {
        beforeEach(() => {
            document.body.innerHTML = ''

            const savedSearchesSelect = document.createElement('select')
            savedSearchesSelect.id = 'saved-searches'
            document.body.appendChild(savedSearchesSelect)

            const clearSearchBtn = document.createElement('button')
            clearSearchBtn.id = 'clear-search'
            document.body.appendChild(clearSearchBtn)

            const advancedPanel = document.createElement('div')
            advancedPanel.id = 'advanced-search-panel'
            document.body.appendChild(advancedPanel)

            const searchInput = document.createElement('input')
            searchInput.id = 'global-search'
            document.body.appendChild(searchInput)

            const searchContext = document.createElement('select')
            searchContext.id = 'search-context'
            document.body.appendChild(searchContext)

            const searchSort = document.createElement('select')
            searchSort.id = 'search-sort'
            document.body.appendChild(searchSort)

            // Re-initialize manager with new DOM
            manager = new SearchManager(mockState, mockApp)
            manager.setupSearch()
        })

        test('should load saved search parameters', () => {
            const savedSearch = {
                id: '1',
                name: 'Work',
                query: 'work tasks',
                filters: { context: '@work', sort: 'priority' }
            }

            mockState.savedSearches.push(savedSearch)

            manager.loadSavedSearch('1')

            expect(mockState.searchQuery).toBe('work tasks')
            expect(mockState.advancedSearchFilters.context).toBe('@work')
            expect(mockState.advancedSearchFilters.sort).toBe('priority')
        })

        test('should update search input value', () => {
            const savedSearch = {
                id: '1',
                name: 'Test',
                query: 'test query',
                filters: {}
            }

            mockState.savedSearches.push(savedSearch)

            manager.loadSavedSearch('1')

            const searchInput = document.getElementById('global-search') as HTMLInputElement
            expect(searchInput.value).toBe('test query')
        })

        test('should show advanced panel', () => {
            const savedSearch = {
                id: '1',
                name: 'Test',
                query: 'test',
                filters: {}
            }

            mockState.savedSearches.push(savedSearch)

            manager.loadSavedSearch('1')

            const advancedPanel = document.getElementById('advanced-search-panel') as HTMLDivElement
            expect(advancedPanel.style.display).toBe('block')
        })

        test('should handle non-existent search', () => {
            expect(() => {
                manager.loadSavedSearch('nonexistent')
            }).not.toThrow()
        })

        test('should trigger render', () => {
            const savedSearch = {
                id: '1',
                name: 'Test',
                query: 'test',
                filters: {}
            }

            mockState.savedSearches.push(savedSearch)

            manager.loadSavedSearch('1')

            expect(mockApp.renderView).toHaveBeenCalled()
        })
    })
})

describe('SearchManager - filterTasksBySearch()', () => {
    let manager: SearchManager
    let mockState: any
    let mockApp: GTDApp
    let tasks: any[]

    beforeEach(() => {
        tasks = [
            {
                id: '1',
                title: 'Buy groceries',
                description: 'Get milk and eggs',
                contexts: ['@home', '@errand'],
                energy: 'high',
                status: 'next',
                dueDate: '2025-01-15',
                isOverdue: () => false,
                isDueToday: () => false
            } as any,
            {
                id: '2',
                title: 'Write report',
                description: 'Quarterly review',
                contexts: ['@work'],
                energy: 'medium',
                status: 'waiting',
                dueDate: null,
                isOverdue: () => false,
                isDueToday: () => false
            } as any,
            {
                id: '3',
                title: 'Exercise',
                description: 'Morning workout at home',
                contexts: ['@home'],
                energy: 'low',
                status: 'inbox',
                dueDate: '2025-01-20',
                isOverdue: () => false,
                isDueToday: () => false
            } as any,
            {
                id: '4',
                title: 'Call mom',
                description: 'Weekly check-in',
                contexts: [],
                energy: 'low',
                status: 'next',
                dueDate: null,
                isOverdue: () => false,
                isDueToday: () => false
            } as any
        ]

        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work'],
            searchQuery: '',
            advancedSearchFilters: {
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()

        manager = new SearchManager(mockState, mockApp)
    })

    test('should return all tasks when no filters active', () => {
        const result = manager.filterTasksBySearch(tasks)

        expect(result).toEqual(tasks)
    })

    test('should filter by title text search', () => {
        mockState.searchQuery = 'groceries'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('1')
    })

    test('should filter by description text search', () => {
        mockState.searchQuery = 'milk'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('1')
    })

    test('should filter by context text search', () => {
        mockState.searchQuery = '@work'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('2')
    })

    test('should be case insensitive', () => {
        mockState.searchQuery = 'GROCERIES'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('1')
    })

    test('should filter by advanced context filter', () => {
        mockState.advancedSearchFilters.context = '@home'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(2)
        expect(result.map((t: any) => t.id)).toEqual(['1', '3'])
    })

    test('should exclude tasks without context when context filter active', () => {
        mockState.advancedSearchFilters.context = '@home'

        const result = manager.filterTasksBySearch(tasks)

        // Task 4 has no contexts, should be excluded
        expect(result).not.toContainEqual(expect.objectContaining({ id: '4' }))
    })

    test('should filter by advanced energy filter', () => {
        mockState.advancedSearchFilters.energy = 'high'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('1')
    })

    test('should filter by advanced status filter', () => {
        mockState.advancedSearchFilters.status = 'next'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(2)
        expect(result.map((t: any) => t.id)).toEqual(['1', '4'])
    })

    test('should filter tasks without due date when nodate filter', () => {
        mockState.advancedSearchFilters.due = 'nodate'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(2)
        expect(result.map((t: any) => t.id)).toEqual(['2', '4'])
    })

    test('should handle multiple filters combined', () => {
        mockState.searchQuery = 'home'
        mockState.advancedSearchFilters.energy = 'low'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('3')
    })

    test('should return empty array when no matches', () => {
        mockState.searchQuery = 'nonexistent'

        const result = manager.filterTasksBySearch(tasks)

        expect(result).toHaveLength(0)
    })

    test('should handle tasks with null description', () => {
        const tasksWithNullDesc = [
            {
                id: '5',
                title: 'Task with null description',
                description: null,
                contexts: ['@test'],
                energy: 'medium',
                status: 'next',
                dueDate: null,
                isOverdue: () => false,
                isDueToday: () => false
            } as any
        ]

        mockState.searchQuery = 'test'
        const result = manager.filterTasksBySearch(tasksWithNullDesc)

        expect(result).toHaveLength(1)
    })

    test('should handle tasks with null contexts', () => {
        const tasksWithNullContexts = [
            {
                id: '6',
                title: 'Task with null contexts',
                description: 'Test',
                contexts: null,
                energy: 'medium',
                status: 'next',
                dueDate: null,
                isOverdue: () => false,
                isDueToday: () => false
            } as any
        ]

        mockState.searchQuery = 'test'
        const result = manager.filterTasksBySearch(tasksWithNullContexts)

        expect(result).toHaveLength(1)
    })
})

describe('SearchManager - Getters and Utilities', () => {
    let manager: SearchManager
    let mockState: any
    let mockApp: GTDApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work'],
            searchQuery: 'test query',
            advancedSearchFilters: {
                context: '@home',
                energy: 'high',
                status: 'next',
                due: '',
                sort: 'updated'
            },
            savedSearches: [
                {
                    id: '1',
                    name: 'Test',
                    query: 'test query',
                    filters: {
                        context: '@home',
                        energy: 'high',
                        status: 'next',
                        due: '',
                        sort: 'updated'
                    },
                    createdAt: '2025-01-01T00:00:00.000Z'
                }
            ]
        }

        mockApp = new GTDApp()

        manager = new SearchManager(mockState, mockApp)
    })

    test('getSearchQuery() should return current query', () => {
        expect(manager.getSearchQuery()).toBe('test query')
    })

    test('getAdvancedFilters() should return copy of filters', () => {
        const filters = manager.getAdvancedFilters()

        expect(filters).toEqual({
            context: '@home',
            energy: 'high',
            status: 'next',
            due: '',
            sort: 'updated'
        })

        // Verify it's a copy, not reference
        filters.context = '@work'
        expect(mockState.advancedSearchFilters.context).toBe('@home')
    })

    test('getSavedSearches() should return copy of saved searches', () => {
        const searches = manager.getSavedSearches()

        expect(searches).toEqual([
            {
                id: '1',
                name: 'Test',
                query: 'test query',
                filters: {
                    context: '@home',
                    energy: 'high',
                    status: 'next',
                    due: '',
                    sort: 'updated'
                },
                createdAt: '2025-01-01T00:00:00.000Z'
            }
        ])

        // Verify it's a shallow copy - array is copied but objects are references
        searches.push({
            id: '2',
            name: 'New',
            query: '',
            filters: { context: '', energy: '', status: '', due: '', sort: 'updated' },
            createdAt: new Date().toISOString()
        })
        expect(mockState.savedSearches).toHaveLength(1) // Original array unchanged

        // Objects inside are still references (shallow copy)
        searches[0].name = 'Modified'
        expect(mockState.savedSearches[0].name).toBe('Modified') // Object is referenced
    })
})

describe('SearchManager - isSearchActive()', () => {
    let manager: SearchManager
    let mockState: any
    let mockApp: GTDApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work'],
            searchQuery: '',
            advancedSearchFilters: {
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()

        manager = new SearchManager(mockState, mockApp)
    })

    test('should return false when no filters active', () => {
        expect(manager.isSearchActive()).toBe(false)
    })

    test('should return true when searchQuery is active', () => {
        mockState.searchQuery = 'test'

        expect(manager.isSearchActive()).toBe(true)
    })

    test('should return true when context filter is active', () => {
        mockState.advancedSearchFilters.context = '@home'

        expect(manager.isSearchActive()).toBe(true)
    })

    test('should return true when energy filter is active', () => {
        mockState.advancedSearchFilters.energy = 'high'

        expect(manager.isSearchActive()).toBe(true)
    })

    test('should return true when status filter is active', () => {
        mockState.advancedSearchFilters.status = 'next'

        expect(manager.isSearchActive()).toBe(true)
    })

    test('should return true when due filter is active', () => {
        mockState.advancedSearchFilters.due = 'today'

        expect(manager.isSearchActive()).toBe(true)
    })

    test('should return false when only sort is set', () => {
        mockState.advancedSearchFilters.sort = 'priority'

        expect(manager.isSearchActive()).toBe(false)
    })
})
