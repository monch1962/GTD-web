/**
 * Centralized state management for the GTD application
 * Provides a single source of truth for all application state
 */
import { createLogger } from '../utils/logger';
import { Task } from '../../models';
import { Project } from '../../models';
import { Template } from '../../models';
export declare class AppState {
    tasks: Task[];
    projects: Project[];
    templates: Template[];
    currentView: string;
    currentProjectId: string | null;
    filters: {
        context: string;
        energy: string;
        time: string;
    };
    selectedContextFilters: Set<string>;
    searchQuery: string;
    advancedSearchFilters: {
        context: string;
        energy: string;
        status: string;
        due: string;
        sort: string;
    };
    savedSearches: any[];
    selectedTaskId: string | null;
    bulkSelectionMode: boolean;
    selectedTaskIds: Set<string>;
    showingArchivedProjects: boolean;
    activeTimers: Map<string, any>;
    pomodoroTimer: any;
    pomodoroTimeLeft: number;
    pomodoroIsRunning: boolean;
    pomodoroIsBreak: boolean;
    focusModeTaskId: string | null;
    focusTaskId: string | null;
    calendarView: string;
    calendarDate: Date;
    history: any[];
    historyIndex: number;
    maxHistorySize: number;
    usageStats: any;
    defaultContexts: string[];
    errorLog: any[];
    maxLogSize: number;
    logger: ReturnType<typeof createLogger>;
    constructor();
    /**
     * Get current state as a plain object
     * @returns {Object} Current application state
     */
    getState(): {
        tasks: Task[];
        projects: Project[];
        templates: Template[];
        currentView: string;
        currentProjectId: string | null;
        filters: {
            context: string;
            energy: string;
            time: string;
        };
        selectedContextFilters: Set<string>;
        searchQuery: string;
        advancedSearchFilters: {
            context: string;
            energy: string;
            status: string;
            due: string;
            sort: string;
        };
        savedSearches: any[];
        selectedTaskId: string | null;
        bulkSelectionMode: boolean;
        selectedTaskIds: Set<string>;
        showingArchivedProjects: boolean;
        activeTimers: Map<string, any>;
        pomodoroTimeLeft: number;
        pomodoroIsRunning: boolean;
        pomodoroIsBreak: boolean;
        focusTaskId: string | null;
        calendarView: string;
        calendarDate: Date;
        historyIndex: number;
        usageStats: any;
    };
    /**
     * Update multiple state properties at once
     * @param updates - Object containing properties to update
     */
    setState(updates: Partial<AppState>): void;
    /**
     * Load usage statistics from localStorage
     * @returns {Object} Usage statistics
     */
    loadUsageStats(): any;
    /**
     * Save usage statistics to localStorage
     */
    saveUsageStats(): void;
    /**
     * Track task usage for smart defaults
     * @param {Task} task - The task to track
     */
    trackTaskUsage(task: any): void;
    /**
     * Reset state to defaults
     */
    reset(): void;
    /**
     * Get smart suggestions for tasks to work on
     * @param {Array} tasks - All tasks
     * @param {Object} options - Filter options
     * @returns {Array} Array of suggested tasks with scores
     */
    getSmartSuggestions(tasks?: Task[], options?: {}): Task[];
}
//# sourceMappingURL=app-state.d.ts.map