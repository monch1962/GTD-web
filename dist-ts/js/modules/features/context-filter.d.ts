/**
 * Context filter module - TypeScript Version
 * Handles context-based filtering of tasks and projects
 */
import { Task, Project } from '../../models';
/**
 * App interface for type safety
 */
interface App {
    renderView?: () => void;
    showNotification?: (message: string) => void;
}
/**
 * State interface for context filter
 */
interface State {
    tasks: Task[];
    projects: Project[];
    defaultContexts: string[];
    selectedContextFilters: Set<string>;
}
export declare class ContextFilterManager {
    private state;
    private app;
    private clearContextFiltersHandler;
    constructor(state: State, app: App);
    /**
     * Update context filter dropdown
     */
    updateContextFilter(): void;
    /**
     * Update sidebar context filters
     */
    updateSidebarContextFilters(): void;
    /**
     * Create a context filter checkbox element
     * @private
     */
    private _createContextFilterElement;
    /**
     * Toggle context filter on/off
     * @param {string} context - Context to toggle
     * @param {boolean} isChecked - Whether context should be filtered
     */
    toggleContextFilter(context: string, isChecked: boolean): void;
    /**
     * Clear all context filters
     */
    clearContextFilters(): void;
    /**
     * Get currently selected contexts
     * @returns {Array} Array of selected contexts
     */
    getSelectedContexts(): string[];
    /**
     * Check if a context is selected
     * @param {string} context - Context to check
     * @returns {boolean}
     */
    isContextSelected(context: string): boolean;
    /**
     * Get all unique contexts from tasks and projects
     * @returns {Set} Set of unique contexts
     */
    getAllContexts(): Set<string>;
    /**
     * Normalize context name (ensure it starts with @)
     * @param {string} context - Context name
     * @returns {string} Normalized context name
     */
    normalizeContextName(context: string): string;
    /**
     * Setup context filter event listeners
     */
    setup(): void;
}
export {};
//# sourceMappingURL=context-filter.d.ts.map