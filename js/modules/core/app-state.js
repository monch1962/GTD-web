/**
 * Centralized state management for the GTD application
 * Provides a single source of truth for all application state
 */

export class AppState {
    constructor() {
        // Core data
        this.tasks = [];
        this.projects = [];
        this.templates = [];

        // View state
        this.currentView = 'inbox';
        this.currentProjectId = null;

        // Filters
        this.filters = {
            context: '',
            energy: '',
            time: ''
        };
        this.selectedContextFilters = new Set();

        // Search state
        this.searchQuery = '';
        this.advancedSearchFilters = {
            context: '',
            energy: '',
            status: '',
            due: '',
            sort: 'updated'
        };
        this.savedSearches = JSON.parse(localStorage.getItem('gtd_saved_searches') || '[]');

        // UI state
        this.selectedTaskId = null;
        this.bulkSelectionMode = false;
        this.selectedTaskIds = new Set();
        this.showingArchivedProjects = false;

        // Timer state
        this.activeTimers = new Map();

        // Pomodoro state
        this.pomodoroTimer = null;
        this.pomodoroTimeLeft = 25 * 60; // 25 minutes in seconds
        this.pomodoroIsRunning = false;
        this.pomodoroIsBreak = false;

        // Focus mode state
        this.focusTaskId = null;

        // Calendar state
        this.calendarView = 'month';
        this.calendarDate = new Date();

        // Undo/Redo state
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;

        // Usage tracking for smart defaults
        this.usageStats = this.loadUsageStats();

        // Default contexts
        this.defaultContexts = null; // Will be loaded from config
    }

    /**
     * Get current state as a plain object
     * @returns {Object} Current application state
     */
    getState() {
        return {
            tasks: this.tasks,
            projects: this.projects,
            templates: this.templates,
            currentView: this.currentView,
            currentProjectId: this.currentProjectId,
            filters: { ...this.filters },
            selectedContextFilters: new Set(this.selectedContextFilters),
            searchQuery: this.searchQuery,
            advancedSearchFilters: { ...this.advancedSearchFilters },
            savedSearches: [...this.savedSearches],
            selectedTaskId: this.selectedTaskId,
            bulkSelectionMode: this.bulkSelectionMode,
            selectedTaskIds: new Set(this.selectedTaskIds),
            showingArchivedProjects: this.showingArchivedProjects,
            activeTimers: new Map(this.activeTimers),
            pomodoroTimeLeft: this.pomodoroTimeLeft,
            pomodoroIsRunning: this.pomodoroIsRunning,
            pomodoroIsBreak: this.pomodoroIsBreak,
            focusTaskId: this.focusTaskId,
            calendarView: this.calendarView,
            calendarDate: new Date(this.calendarDate),
            historyIndex: this.historyIndex,
            usageStats: { ...this.usageStats }
        };
    }

    /**
     * Update multiple state properties at once
     * @param {Object} updates - Object containing properties to update
     */
    setState(updates) {
        Object.keys(updates).forEach(key => {
            if (key in this) {
                this[key] = updates[key];
            } else {
                console.warn(`Attempted to set unknown state property: ${key}`);
            }
        });
    }

    /**
     * Load usage statistics from localStorage
     * @returns {Object} Usage statistics
     */
    loadUsageStats() {
        try {
            const stats = localStorage.getItem('gtd_usage_stats');
            return stats ? JSON.parse(stats) : {
                contexts: {},
                times: {},
                lastUpdated: null
            };
        } catch (error) {
            console.warn('Failed to load usage stats:', error);
            return {
                contexts: {},
                times: {},
                lastUpdated: null
            };
        }
    }

    /**
     * Save usage statistics to localStorage
     */
    saveUsageStats() {
        try {
            localStorage.setItem('gtd_usage_stats', JSON.stringify(this.usageStats));
            this.usageStats.lastUpdated = new Date().toISOString();
        } catch (error) {
            console.warn('Failed to save usage stats:', error);
        }
    }

    /**
     * Track task usage for smart defaults
     * @param {Task} task - The task to track
     */
    trackTaskUsage(task) {
        // Track contexts
        if (task.contexts && task.contexts.length > 0) {
            task.contexts.forEach(context => {
                if (!this.usageStats.contexts[context]) {
                    this.usageStats.contexts[context] = 0;
                }
                this.usageStats.contexts[context]++;
            });
        }

        // Track time estimates
        if (task.time) {
            const timeKey = task.time.toString();
            if (!this.usageStats.times[timeKey]) {
                this.usageStats.times[timeKey] = 0;
            }
            this.usageStats.times[timeKey]++;
        }

        this.saveUsageStats();
    }

    /**
     * Reset state to defaults
     */
    reset() {
        this.currentView = 'inbox';
        this.currentProjectId = null;
        this.filters = { context: '', energy: '', time: '' };
        this.selectedContextFilters.clear();
        this.searchQuery = '';
        this.selectedTaskId = null;
        this.bulkSelectionMode = false;
        this.selectedTaskIds.clear();
        this.showingArchivedProjects = false;
        this.focusTaskId = null;
    }
}
