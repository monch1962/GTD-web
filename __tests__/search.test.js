/**
 * Comprehensive Tests for Search Feature
 */

import { GTDApp } from '../js/app.js'
import { SearchManager } from '../js/modules/features/search.js'

describe('SearchManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

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
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
    })

    test('should initialize search state', () => {
        expect(mockState.searchQuery).toBe('')
        expect(mockState.advancedSearchFilters.sort).toBe('updated')
    })

    test('should load saved searches from localStorage', () => {
        const savedSearches = [{ id: '1', name: 'Work tasks', query: 'work', filters: {} }]
        localStorage.setItem('gtd_saved_searches', JSON.stringify(savedSearches))

        const managerWithSaved = new SearchManager(mockState, mockApp)

        expect(managerWithSaved.state.savedSearches).toEqual(savedSearches)

        localStorage.removeItem('gtd_saved_searches')
    })
})

describe('SearchManager - Search Query', () => {
    let manager
    let mockState
    let mockApp

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

        const advancedPanel = document.createElement('div')
        advancedPanel.id = 'advanced-search-panel'
        advancedPanel.style.display = 'none'
        document.body.appendChild(advancedPanel)

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
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should update search query on input', () => {
        manager.setupSearch()

        const searchInput = document.getElementById('global-search')
        searchInput.value = 'test query'
        searchInput.dispatchEvent(new Event('input'))

        expect(mockState.searchQuery).toBe('test query')
    })

    test('should show clear button when query has value', () => {
        manager.setupSearch()

        const searchInput = document.getElementById('global-search')
        const clearBtn = document.getElementById('clear-search')

        searchInput.value = 'test'
        searchInput.dispatchEvent(new Event('input'))

        expect(clearBtn.style.display).toBe('block')
    })

    test('should show advanced search panel when typing', () => {
        manager.setupSearch()

        const searchInput = document.getElementById('global-search')
        const advancedPanel = document.getElementById('advanced-search-panel')

        searchInput.value = 'test'
        searchInput.dispatchEvent(new Event('input'))

        expect(advancedPanel.style.display).toBe('block')
    })

    test('should trigger render on search input', () => {
        manager.setupSearch()

        const searchInput = document.getElementById('global-search')
        searchInput.value = 'test'
        searchInput.dispatchEvent(new Event('input'))

        expect(mockApp.renderView).toHaveBeenCalled()
    })
})

describe('SearchManager - Clear Search', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const searchInput = document.createElement('input')
        searchInput.id = 'global-search'
        searchInput.value = 'test query'
        document.body.appendChild(searchInput)

        const clearBtn = document.createElement('button')
        clearBtn.id = 'clear-search'
        clearBtn.style.display = 'block'
        document.body.appendChild(clearBtn)

        const advancedPanel = document.createElement('div')
        advancedPanel.id = 'advanced-search-panel'
        advancedPanel.style.display = 'block'
        document.body.appendChild(advancedPanel)

        const searchContext = document.createElement('select')
        searchContext.id = 'search-context'
        searchContext.value = '@work'
        document.body.appendChild(searchContext)

        const searchEnergy = document.createElement('select')
        searchEnergy.id = 'search-energy'
        searchEnergy.value = 'high'
        document.body.appendChild(searchEnergy)

        const searchStatus = document.createElement('select')
        searchStatus.id = 'search-status'
        searchStatus.value = 'next'
        document.body.appendChild(searchStatus)

        const searchDue = document.createElement('select')
        searchDue.id = 'search-due'
        searchDue.value = 'today'
        document.body.appendChild(searchDue)

        const searchSort = document.createElement('select')
        searchSort.id = 'search-sort'
        searchSort.value = 'priority'
        document.body.appendChild(searchSort)

        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work', '@phone'],
            searchQuery: 'test query',
            advancedSearchFilters: {
                context: '@work',
                energy: 'high',
                status: 'next',
                due: 'today',
                sort: 'priority'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()
        mockApp.renderView = jest.fn()

        manager = new SearchManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should clear search query', () => {
        manager.clearSearch()

        expect(mockState.searchQuery).toBe('')
    })

    test('should reset all advanced filters', () => {
        manager.clearSearch()

        expect(mockState.advancedSearchFilters.context).toBe('')
        expect(mockState.advancedSearchFilters.energy).toBe('')
        expect(mockState.advancedSearchFilters.status).toBe('')
        expect(mockState.advancedSearchFilters.due).toBe('')
        expect(mockState.advancedSearchFilters.sort).toBe('updated')
    })

    test('should clear search input value', () => {
        manager.clearSearch()

        const searchInput = document.getElementById('global-search')
        expect(searchInput.value).toBe('')
    })

    test('should hide clear button', () => {
        manager.clearSearch()

        const clearBtn = document.getElementById('clear-search')
        expect(clearBtn.style.display).toBe('none')
    })

    test('should hide advanced search panel', () => {
        manager.clearSearch()

        const advancedPanel = document.getElementById('advanced-search-panel')
        expect(advancedPanel.style.display).toBe('none')
    })

    test('should reset filter input values', () => {
        manager.clearSearch()

        const searchContext = document.getElementById('search-context')
        const searchEnergy = document.getElementById('search-energy')
        const searchStatus = document.getElementById('search-status')
        const searchDue = document.getElementById('search-due')
        const searchSort = document.getElementById('search-sort')

        expect(searchContext.value).toBe('')
        expect(searchEnergy.value).toBe('')
        expect(searchStatus.value).toBe('')
        expect(searchDue.value).toBe('')
        expect(searchSort.value).toBe('updated')
    })

    test('should trigger render', () => {
        manager.clearSearch()

        expect(mockApp.renderView).toHaveBeenCalled()
    })
})

describe('SearchManager - Advanced Filters', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const searchContext = document.createElement('select')
        searchContext.id = 'search-context'
        document.body.appendChild(searchContext)

        const searchEnergy = document.createElement('select')
        searchEnergy.id = 'search-energy'
        document.body.appendChild(searchEnergy)

        const searchStatus = document.createElement('select')
        searchStatus.id = 'search-status'
        document.body.appendChild(searchStatus)

        const searchDue = document.createElement('select')
        searchDue.id = 'search-due'
        document.body.appendChild(searchDue)

        const searchSort = document.createElement('select')
        searchSort.id = 'search-sort'
        document.body.appendChild(searchSort)

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
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should update context filter', () => {
        manager.setupSearch()

        const searchContext = document.getElementById('search-context')
        searchContext.value = '@work'
        searchContext.dispatchEvent(new Event('change'))

        expect(mockState.advancedSearchFilters.context).toBe('@work')
    })

    test('should update energy filter', () => {
        manager.setupSearch()

        const searchEnergy = document.getElementById('search-energy')
        searchEnergy.value = 'high'
        searchEnergy.dispatchEvent(new Event('change'))

        expect(mockState.advancedSearchFilters.energy).toBe('high')
    })

    test('should update status filter', () => {
        manager.setupSearch()

        const searchStatus = document.getElementById('search-status')
        searchStatus.value = 'next'
        searchStatus.dispatchEvent(new Event('change'))

        expect(mockState.advancedSearchFilters.status).toBe('next')
    })

    test('should update sort option', () => {
        manager.setupSearch()

        const searchSort = document.getElementById('search-sort')
        searchSort.value = 'priority'
        searchSort.dispatchEvent(new Event('change'))

        expect(mockState.advancedSearchFilters.sort).toBe('priority')
    })

    test('should trigger render on filter change', () => {
        manager.setupSearch()

        const searchContext = document.getElementById('search-context')
        searchContext.dispatchEvent(new Event('change'))

        expect(mockApp.renderView).toHaveBeenCalled()
    })
})

describe('SearchManager - Populate Contexts', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        const searchContext = document.createElement('select')
        searchContext.id = 'search-context'
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
        manager.populateSearchContexts(document.getElementById('search-context'))

        const select = document.getElementById('search-context')
        const options = Array.from(select.options).map((opt) => opt.value)

        expect(options).toContain('@home')
        expect(options).toContain('@work')
        expect(options).toContain('@office')
        expect(options).toContain('@phone')
        expect(options).toContain('@mobile')
    })

    test('should sort contexts alphabetically', () => {
        manager.populateSearchContexts(document.getElementById('search-context'))

        const select = document.getElementById('search-context')
        const optionValues = Array.from(select.options)
            .slice(1)
            .map((opt) => opt.value)

        const sorted = [...optionValues].sort()
        expect(optionValues).toEqual(sorted)
    })

    test('should preserve first option (empty)', () => {
        manager.populateSearchContexts(document.getElementById('search-context'))

        const select = document.getElementById('search-context')
        expect(select.options[0].value).toBe('')
    })
})

describe('SearchManager - Saved Searches', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create saved searches dropdown
        const savedSearchesSelect = document.createElement('select')
        savedSearchesSelect.id = 'saved-searches'
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
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    describe('saveCurrentSearch()', () => {
        beforeEach(() => {
            global.prompt = jest.fn()
        })

        afterEach(() => {
            global.prompt.mockRestore()
        })

        test('should save current search with name', () => {
            mockState.searchQuery = 'work tasks'
            mockState.advancedSearchFilters.context = '@work'

            global.prompt.mockReturnValue('My Work Search')

            manager.saveCurrentSearch()

            expect(mockState.savedSearches).toHaveLength(1)
            expect(mockState.savedSearches[0].name).toBe('My Work Search')
            expect(mockState.savedSearches[0].query).toBe('work tasks')
            expect(mockState.savedSearches[0].filters.context).toBe('@work')
        })

        test('should generate unique ID for saved search', () => {
            mockState.searchQuery = 'test'
            global.prompt.mockReturnValue('Test Search')

            manager.saveCurrentSearch()

            const saved = mockState.savedSearches[0]
            expect(saved.id).toBeDefined()
            expect(typeof saved.id).toBe('string')
        })

        test('should add timestamp to saved search', () => {
            mockState.searchQuery = 'test'
            global.prompt.mockReturnValue('Test Search')

            manager.saveCurrentSearch()

            const saved = mockState.savedSearches[0]
            expect(saved.createdAt).toBeDefined()
        })

        test('should save to localStorage', () => {
            mockState.searchQuery = 'test'
            global.prompt.mockReturnValue('Test Search')

            manager.saveCurrentSearch()

            const stored = JSON.parse(localStorage.getItem('gtd_saved_searches'))
            expect(stored).toHaveLength(1)
            expect(stored[0].name).toBe('Test Search')
        })

        test('should not save when name is empty', () => {
            mockState.searchQuery = 'test'
            global.prompt.mockReturnValue(null)

            manager.saveCurrentSearch()

            expect(mockState.savedSearches).toHaveLength(0)
        })

        test('should show notification after saving', () => {
            mockState.searchQuery = 'test'
            global.prompt.mockReturnValue('Test Search')

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

            const searchInput = document.getElementById('global-search')
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

            const advancedPanel = document.getElementById('advanced-search-panel')
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

    describe('deleteSavedSearch()', () => {
        test('should remove search from list', () => {
            mockState.savedSearches = [
                { id: '1', name: 'Search 1', query: 'test1', filters: {} },
                { id: '2', name: 'Search 2', query: 'test2', filters: {} }
            ]

            manager.deleteSavedSearch('1')

            expect(mockState.savedSearches).toHaveLength(1)
            expect(mockState.savedSearches[0].id).toBe('2')
        })

        test('should update localStorage', () => {
            mockState.savedSearches = [{ id: '1', name: 'Search 1', query: 'test1', filters: {} }]

            manager.deleteSavedSearch('1')

            const stored = JSON.parse(localStorage.getItem('gtd_saved_searches'))
            expect(stored).toHaveLength(0)
        })
    })

    describe('renderSavedSearches()', () => {
        test('should populate dropdown with saved searches', () => {
            mockState.savedSearches = [
                { id: '1', name: 'Work Tasks', query: 'work', filters: {} },
                { id: '2', name: 'Home Tasks', query: 'home', filters: {} }
            ]

            manager.renderSavedSearches()

            const select = document.getElementById('saved-searches')
            const options = Array.from(select.options)

            expect(options.length).toBeGreaterThan(1)
            expect(options[1].textContent).toBe('Work Tasks')
            expect(options[2].textContent).toBe('Home Tasks')
        })

        test('should set option values correctly', () => {
            mockState.savedSearches = [{ id: 'search-1', name: 'Test', query: 'test', filters: {} }]

            manager.renderSavedSearches()

            const select = document.getElementById('saved-searches')
            expect(select.options[1].value).toBe('search-1')
        })
    })
})

describe('SearchManager - Clear Advanced Search', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        localStorage.clear()
        document.body.innerHTML = ''

        // Create filter elements
        const searchContext = document.createElement('select')
        searchContext.id = 'search-context'
        searchContext.value = '@work'
        document.body.appendChild(searchContext)

        const searchEnergy = document.createElement('select')
        searchEnergy.id = 'search-energy'
        searchEnergy.value = 'high'
        document.body.appendChild(searchEnergy)

        const searchStatus = document.createElement('select')
        searchStatus.id = 'search-status'
        searchStatus.value = 'next'
        document.body.appendChild(searchStatus)

        const searchDue = document.createElement('select')
        searchDue.id = 'search-due'
        searchDue.value = 'today'
        document.body.appendChild(searchDue)

        const searchSort = document.createElement('select')
        searchSort.id = 'search-sort'
        searchSort.value = 'priority'
        document.body.appendChild(searchSort)

        mockState = {
            tasks: [],
            projects: [],
            defaultContexts: ['@home', '@work'],
            searchQuery: 'test query',
            advancedSearchFilters: {
                context: '@work',
                energy: 'high',
                status: 'next',
                due: 'today',
                sort: 'priority'
            },
            savedSearches: []
        }

        mockApp = new GTDApp()
        mockApp.renderView = jest.fn()

        manager = new SearchManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should reset advanced filters to defaults', () => {
        manager.clearAdvancedSearch()

        expect(mockState.advancedSearchFilters.context).toBe('')
        expect(mockState.advancedSearchFilters.energy).toBe('')
        expect(mockState.advancedSearchFilters.status).toBe('')
        expect(mockState.advancedSearchFilters.due).toBe('')
        expect(mockState.advancedSearchFilters.sort).toBe('updated')
    })

    test('should not clear search query', () => {
        manager.clearAdvancedSearch()

        expect(mockState.searchQuery).toBe('test query')
    })

    test('should reset filter input values', () => {
        manager.clearAdvancedSearch()

        const searchContext = document.getElementById('search-context')
        const searchEnergy = document.getElementById('search-energy')
        const searchStatus = document.getElementById('search-status')
        const searchDue = document.getElementById('search-due')
        const searchSort = document.getElementById('search-sort')

        expect(searchContext.value).toBe('')
        expect(searchEnergy.value).toBe('')
        expect(searchStatus.value).toBe('')
        expect(searchDue.value).toBe('')
        expect(searchSort.value).toBe('updated')
    })

    test('should trigger render', () => {
        manager.clearAdvancedSearch()

        expect(mockApp.renderView).toHaveBeenCalled()
    })
})
