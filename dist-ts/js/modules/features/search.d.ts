/**
 * Search module
 * Handles search functionality, advanced filters, and saved searches
 */
import { Task, Project } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
    defaultContexts: string[];
    searchQuery?: string;
    advancedSearchFilters?: AdvancedSearchFilters;
    savedSearches?: SavedSearch[];
}
interface AppDependencies {
    renderView?: () => void;
    showNotification?: (message: string, type?: string) => void;
}
interface AdvancedSearchFilters {
    context: string;
    energy: string;
    status: string;
    due: string;
    sort: string;
}
interface SavedSearch {
    id: string;
    name: string;
    query: string;
    filters: AdvancedSearchFilters;
    createdAt: string;
}
export declare class SearchManager {
    private state;
    private app;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup search functionality
     */
    setupSearch(): void;
    /**
     * Populate search contexts dropdown
     */
    populateSearchContexts(selectElement: HTMLSelectElement | null): void;
    /**
     * Clear all search filters
     */
    clearSearch(): void;
    /**
     * Clear advanced search filters only
     */
    clearAdvancedSearch(): void;
    /**
     * Save current search as a saved search
     */
    saveCurrentSearch(): void;
    /**
     * Load a saved search
     */
    loadSavedSearch(searchId: string): void;
    /**
     * Delete a saved search
     */
    deleteSavedSearch(searchId: string): void;
    /**
     * Update saved searches dropdown
     */
    renderSavedSearches(): void;
    /**
     * Filter tasks by search criteria
     * @param tasks - Tasks to filter
     * @returns Filtered tasks
     */
    filterTasksBySearch(tasks: Task[]): Task[];
    /**
     * Get current search query
     * @returns Search query string
     */
    getSearchQuery(): string;
    /**
     * Get advanced search filters
     * @returns Advanced search filters object
     */
    getAdvancedFilters(): AdvancedSearchFilters;
    /**
     * Get all saved searches
     * @returns Array of saved searches
     */
    getSavedSearches(): SavedSearch[];
    /**
     * Check if search is active
     * @returns True if search is active
     */
    isSearchActive(): boolean;
}
export {};
//# sourceMappingURL=search.d.ts.map