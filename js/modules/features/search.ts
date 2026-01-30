/**
 * Search module
 * Handles search functionality, advanced filters, and saved searches
 */

import { Task, Project } from '../../models'

// Define interfaces for state and app dependencies
interface AppState {
    tasks: Task[]
    projects: Project[]
    defaultContexts: string[]
    searchQuery?: string
    advancedSearchFilters?: AdvancedSearchFilters
    savedSearches?: SavedSearch[]
}

interface AppDependencies {
    renderView?: () => void
    showNotification?: (message: string, type?: string) => void
}

interface AdvancedSearchFilters {
    context: string
    energy: string
    status: string
    due: string
    sort: string
}

interface SavedSearch {
    id: string
    name: string
    query: string
    filters: AdvancedSearchFilters
    createdAt: string
}

export class SearchManager {
    private state: AppState
    private app: AppDependencies

    constructor(state: AppState, app: AppDependencies) {
        this.state = state
        this.app = app

        // Initialize search state (only if not already set)
        if (typeof this.state.searchQuery === 'undefined') {
            this.state.searchQuery = ''
        }
        if (typeof this.state.advancedSearchFilters === 'undefined') {
            this.state.advancedSearchFilters = {
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            }
        }
        if (typeof this.state.savedSearches === 'undefined') {
            this.state.savedSearches = JSON.parse(
                localStorage.getItem('gtd_saved_searches') || '[]'
            )
        }
    }

    /**
     * Setup search functionality
     */
    setupSearch(): void {
        const searchInput = document.getElementById('global-search') as HTMLInputElement | null
        const clearSearchBtn = document.getElementById('clear-search') as HTMLButtonElement | null
        const advancedSearchPanel = document.getElementById(
            'advanced-search-panel'
        ) as HTMLElement | null
        const searchContext = document.getElementById('search-context') as HTMLSelectElement | null
        const searchEnergy = document.getElementById('search-energy') as HTMLSelectElement | null
        const searchStatus = document.getElementById('search-status') as HTMLSelectElement | null
        const searchDue = document.getElementById('search-due') as HTMLSelectElement | null
        const searchSort = document.getElementById('search-sort') as HTMLSelectElement | null
        const saveSearchBtn = document.getElementById('save-search') as HTMLButtonElement | null
        const savedSearchesSelect = document.getElementById(
            'saved-searches'
        ) as HTMLSelectElement | null
        const deleteSavedSearchBtn = document.getElementById(
            'delete-saved-search'
        ) as HTMLButtonElement | null
        const clearAdvancedSearchBtn = document.getElementById(
            'clear-advanced-search'
        ) as HTMLButtonElement | null

        if (!searchInput) return

        // Populate context dropdown
        this.populateSearchContexts(searchContext)

        // Global search input
        searchInput.addEventListener('input', (e) => {
            this.state.searchQuery = (e.target as HTMLInputElement).value
            if (clearSearchBtn) {
                clearSearchBtn.style.display = this.state.searchQuery ? 'block' : 'none'
            }

            // Show advanced search panel when typing
            if (this.state.searchQuery && advancedSearchPanel) {
                advancedSearchPanel.style.display = 'block'
            }

            this.app.renderView?.()
        })

        // Clear search
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch()
            })
        }

        // Advanced filters
        ;[searchContext, searchEnergy, searchStatus, searchDue].forEach((filter) => {
            if (filter) {
                filter.addEventListener('change', () => {
                    if (searchContext)
                        this.state.advancedSearchFilters!.context = searchContext.value
                    if (searchEnergy) this.state.advancedSearchFilters!.energy = searchEnergy.value
                    if (searchStatus) this.state.advancedSearchFilters!.status = searchStatus.value
                    if (searchDue) this.state.advancedSearchFilters!.due = searchDue.value
                    this.app.renderView?.()
                })
            }
        })

        // Sort dropdown
        if (searchSort) {
            searchSort.addEventListener('change', () => {
                this.state.advancedSearchFilters!.sort = searchSort.value
                this.app.renderView?.()
            })
        }

        // Save search
        if (saveSearchBtn) {
            saveSearchBtn.addEventListener('click', () => {
                this.saveCurrentSearch()
            })
        }

        // Load saved search
        if (savedSearchesSelect) {
            savedSearchesSelect.addEventListener('change', (e) => {
                const searchId = (e.target as HTMLSelectElement).value
                if (searchId) {
                    this.loadSavedSearch(searchId)
                    if (deleteSavedSearchBtn) deleteSavedSearchBtn.style.display = 'inline-block'
                } else {
                    if (deleteSavedSearchBtn) deleteSavedSearchBtn.style.display = 'none'
                }
            })
        }

        // Delete saved search
        if (deleteSavedSearchBtn) {
            deleteSavedSearchBtn.addEventListener('click', () => {
                const searchId = savedSearchesSelect?.value
                if (searchId && confirm('Delete this saved search?')) {
                    this.deleteSavedSearch(searchId)
                }
            })
        }

        // Clear advanced filters
        if (clearAdvancedSearchBtn) {
            clearAdvancedSearchBtn.addEventListener('click', () => {
                this.clearAdvancedSearch()
            })
        }

        // Initialize saved searches dropdown
        this.renderSavedSearches()
    }

    /**
     * Populate search contexts dropdown
     */
    populateSearchContexts(selectElement: HTMLSelectElement | null): void {
        if (!selectElement) return

        // Get all unique contexts
        const allContexts = new Set(this.state.defaultContexts)
        this.state.tasks.forEach((task) => {
            if (task.contexts) {
                task.contexts.forEach((context) => allContexts.add(context))
            }
        })

        // Clear existing options (except first)
        while (selectElement.options.length > 1) {
            selectElement.remove(1)
        }

        // Add sorted context options
        Array.from(allContexts)
            .sort()
            .forEach((context) => {
                const option = document.createElement('option')
                option.value = context
                option.textContent = context
                selectElement.appendChild(option)
            })
    }

    /**
     * Clear all search filters
     */
    clearSearch(): void {
        this.state.searchQuery = ''
        this.state.advancedSearchFilters = {
            context: '',
            energy: '',
            status: '',
            due: '',
            sort: 'updated'
        }

        const searchInput = document.getElementById('global-search') as HTMLInputElement | null
        const clearSearchBtn = document.getElementById('clear-search') as HTMLButtonElement | null
        const advancedSearchPanel = document.getElementById(
            'advanced-search-panel'
        ) as HTMLElement | null
        const searchContext = document.getElementById('search-context') as HTMLSelectElement | null
        const searchEnergy = document.getElementById('search-energy') as HTMLSelectElement | null
        const searchStatus = document.getElementById('search-status') as HTMLSelectElement | null
        const searchDue = document.getElementById('search-due') as HTMLSelectElement | null
        const searchSort = document.getElementById('search-sort') as HTMLSelectElement | null

        if (searchInput) searchInput.value = ''
        if (clearSearchBtn) clearSearchBtn.style.display = 'none'
        if (advancedSearchPanel) advancedSearchPanel.style.display = 'none'
        if (searchContext) searchContext.value = ''
        if (searchEnergy) searchEnergy.value = ''
        if (searchStatus) searchStatus.value = ''
        if (searchDue) searchDue.value = ''
        if (searchSort) searchSort.value = 'updated'

        this.app.renderView?.()
    }

    /**
     * Clear advanced search filters only
     */
    clearAdvancedSearch(): void {
        this.state.advancedSearchFilters = {
            context: '',
            energy: '',
            status: '',
            due: '',
            sort: 'updated'
        }

        const searchContext = document.getElementById('search-context') as HTMLSelectElement | null
        const searchEnergy = document.getElementById('search-energy') as HTMLSelectElement | null
        const searchStatus = document.getElementById('search-status') as HTMLSelectElement | null
        const searchDue = document.getElementById('search-due') as HTMLSelectElement | null
        const searchSort = document.getElementById('search-sort') as HTMLSelectElement | null

        if (searchContext) searchContext.value = ''
        if (searchEnergy) searchEnergy.value = ''
        if (searchStatus) searchStatus.value = ''
        if (searchDue) searchDue.value = ''
        if (searchSort) searchSort.value = 'updated'

        this.app.renderView?.()
    }

    /**
     * Save current search as a saved search
     */
    saveCurrentSearch(): void {
        const name = prompt('Name this search:')
        if (!name) return

        const search: SavedSearch = {
            id: Date.now().toString(),
            name,
            query: this.state.searchQuery || '',
            filters: { ...this.state.advancedSearchFilters! },
            createdAt: new Date().toISOString()
        }

        this.state.savedSearches!.push(search)
        localStorage.setItem('gtd_saved_searches', JSON.stringify(this.state.savedSearches))
        this.renderSavedSearches()

        this.app.showNotification?.('Search saved!')
    }

    /**
     * Load a saved search
     */
    loadSavedSearch(searchId: string): void {
        const search = this.state.savedSearches!.find((s) => s.id === searchId)
        if (!search) return

        this.state.searchQuery = search.query || ''
        this.state.advancedSearchFilters = { ...search.filters }

        const searchInput = document.getElementById('global-search') as HTMLInputElement | null
        const clearSearchBtn = document.getElementById('clear-search') as HTMLButtonElement | null
        const advancedSearchPanel = document.getElementById(
            'advanced-search-panel'
        ) as HTMLElement | null
        const searchContext = document.getElementById('search-context') as HTMLSelectElement | null
        const searchEnergy = document.getElementById('search-energy') as HTMLSelectElement | null
        const searchStatus = document.getElementById('search-status') as HTMLSelectElement | null
        const searchDue = document.getElementById('search-due') as HTMLSelectElement | null
        const searchSort = document.getElementById('search-sort') as HTMLSelectElement | null

        if (searchInput) {
            searchInput.value = this.state.searchQuery || ''
        }
        if (clearSearchBtn) {
            clearSearchBtn.style.display = this.state.searchQuery ? 'block' : 'none'
        }
        if (advancedSearchPanel) {
            advancedSearchPanel.style.display = 'block'
        }
        if (searchContext) searchContext.value = this.state.advancedSearchFilters!.context
        if (searchEnergy) searchEnergy.value = this.state.advancedSearchFilters!.energy
        if (searchStatus) searchStatus.value = this.state.advancedSearchFilters!.status
        if (searchDue) searchDue.value = this.state.advancedSearchFilters!.due
        if (searchSort) searchSort.value = this.state.advancedSearchFilters!.sort || 'updated'

        this.app.renderView?.()
    }

    /**
     * Delete a saved search
     */
    deleteSavedSearch(searchId: string): void {
        this.state.savedSearches = this.state.savedSearches!.filter((s) => s.id !== searchId)
        localStorage.setItem('gtd_saved_searches', JSON.stringify(this.state.savedSearches))
        this.renderSavedSearches()

        const savedSearchesSelect = document.getElementById(
            'saved-searches'
        ) as HTMLSelectElement | null
        const deleteSavedSearchBtn = document.getElementById(
            'delete-saved-search'
        ) as HTMLButtonElement | null

        if (savedSearchesSelect) savedSearchesSelect.value = ''
        if (deleteSavedSearchBtn) deleteSavedSearchBtn.style.display = 'none'
    }

    /**
     * Update saved searches dropdown
     */
    renderSavedSearches(): void {
        const savedSearchesSelect = document.getElementById(
            'saved-searches'
        ) as HTMLSelectElement | null
        if (!savedSearchesSelect) return

        // Save current selection
        const currentValue = savedSearchesSelect.value

        // Clear existing options (except first)
        while (savedSearchesSelect.options.length > 1) {
            savedSearchesSelect.remove(1)
        }

        // Add saved searches
        this.state.savedSearches!.forEach((search) => {
            const option = document.createElement('option')
            option.value = search.id
            option.textContent = search.name
            savedSearchesSelect.appendChild(option)
        })

        // Restore selection if it still exists
        if (currentValue && this.state.savedSearches!.find((s) => s.id === currentValue)) {
            savedSearchesSelect.value = currentValue
        }
    }

    /**
     * Filter tasks by search criteria
     * @param tasks - Tasks to filter
     * @returns Filtered tasks
     */
    filterTasksBySearch(tasks: Task[]): Task[] {
        if (
            !this.state.searchQuery &&
            !this.state.advancedSearchFilters!.context &&
            !this.state.advancedSearchFilters!.energy &&
            !this.state.advancedSearchFilters!.status &&
            !this.state.advancedSearchFilters!.due
        ) {
            return tasks
        }

        return tasks.filter((task) => {
            // Text search
            if (this.state.searchQuery) {
                const searchLower = this.state.searchQuery.toLowerCase()
                const titleMatch = task.title && task.title.toLowerCase().includes(searchLower)
                const descriptionMatch =
                    task.description && task.description.toLowerCase().includes(searchLower)
                const contextMatch =
                    task.contexts &&
                    task.contexts.some((c) => c.toLowerCase().includes(searchLower))

                if (!titleMatch && !descriptionMatch && !contextMatch) {
                    return false
                }
            }

            // Context filter
            if (this.state.advancedSearchFilters!.context) {
                if (
                    !task.contexts ||
                    !task.contexts.includes(this.state.advancedSearchFilters!.context)
                ) {
                    return false
                }
            }

            // Energy filter
            if (this.state.advancedSearchFilters!.energy) {
                if (task.energy !== this.state.advancedSearchFilters!.energy) {
                    return false
                }
            }

            // Status filter
            if (this.state.advancedSearchFilters!.status) {
                if (task.status !== this.state.advancedSearchFilters!.status) {
                    return false
                }
            }

            // Due date filter
            if (this.state.advancedSearchFilters!.due) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                switch (this.state.advancedSearchFilters!.due) {
                    case 'overdue': {
                        if (!task.isOverdue()) return false
                        break
                    }
                    case 'today': {
                        if (!task.isDueToday()) return false
                        break
                    }
                    case 'week': {
                        if (!task.dueDate) return false
                        const dueDate = new Date(task.dueDate)
                        const weekFromNow = new Date(today)
                        weekFromNow.setDate(weekFromNow.getDate() + 7)
                        if (dueDate < today || dueDate > weekFromNow) return false
                        break
                    }
                    case 'month': {
                        if (!task.dueDate) return false
                        const monthFromNow = new Date(today)
                        monthFromNow.setMonth(monthFromNow.getMonth() + 1)
                        const dueDateMonth = new Date(task.dueDate)
                        if (dueDateMonth < today || dueDateMonth > monthFromNow) return false
                        break
                    }
                    case 'nodate': {
                        if (task.dueDate) return false
                        break
                    }
                }
            }

            return true
        })
    }

    /**
     * Get current search query
     * @returns Search query string
     */
    getSearchQuery(): string {
        return this.state.searchQuery || ''
    }

    /**
     * Get advanced search filters
     * @returns Advanced search filters object
     */
    getAdvancedFilters(): AdvancedSearchFilters {
        return { ...this.state.advancedSearchFilters! }
    }

    /**
     * Get all saved searches
     * @returns Array of saved searches
     */
    getSavedSearches(): SavedSearch[] {
        return [...(this.state.savedSearches || [])]
    }

    /**
     * Check if search is active
     * @returns True if search is active
     */
    isSearchActive(): boolean {
        return (
            !!this.state.searchQuery ||
            !!this.state.advancedSearchFilters!.context ||
            !!this.state.advancedSearchFilters!.energy ||
            !!this.state.advancedSearchFilters!.status ||
            !!this.state.advancedSearchFilters!.due
        )
    }
}
