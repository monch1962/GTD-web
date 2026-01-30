/**
 * Centralized state management for the GTD application
 * Provides a single source of truth for all application state
 */

import { createLogger } from '../utils/logger'
import { Task, Project, Template } from '../../models'

export class AppState {
    // Core data
    tasks: Task[]
    projects: Project[]
    templates: Template[]

    // View state
    currentView: string
    currentProjectId: string | null

    // Filters
    filters: {
        context: string
        energy: string
        time: string
    }

    selectedContextFilters: Set<string>

    // Search state
    searchQuery: string
    advancedSearchFilters: {
        context: string
        energy: string
        status: string
        due: string
        sort: string
    }

    savedSearches: any[]

    // UI state
    selectedTaskId: string | null
    bulkSelectionMode: boolean
    selectedTaskIds: Set<string>
    showingArchivedProjects: boolean

    // Timer state
    activeTimers: Map<string, any>

    // Pomodoro state
    pomodoroTimer: any
    pomodoroTimeLeft: number
    pomodoroIsRunning: boolean
    pomodoroIsBreak: boolean

    // Focus mode
    focusModeTaskId: string | null
    focusTaskId: string | null

    // Calendar state
    calendarView: string
    calendarDate: Date

    // Undo/Redo state
    history: any[]
    historyIndex: number
    maxHistorySize: number

    // Usage tracking
    usageStats: any
    defaultContexts: string[]

    // Error logging
    errorLog: any[]
    maxLogSize: number

    // Logger
    logger: ReturnType<typeof createLogger>

    constructor () {
        this.logger = createLogger('AppState')

        // Core data
        this.tasks = []
        this.projects = []
        this.templates = []

        // View state
        this.currentView = 'inbox'
        this.currentProjectId = null

        // Filters
        this.filters = {
            context: '',
            energy: '',
            time: ''
        }
        this.selectedContextFilters = new Set()

        // Search state
        this.searchQuery = ''
        this.advancedSearchFilters = {
            context: '',
            energy: '',
            status: '',
            due: '',
            sort: 'updated'
        }
        this.savedSearches = JSON.parse(localStorage.getItem('gtd_saved_searches') || '[]')

        // UI state
        this.selectedTaskId = null
        this.bulkSelectionMode = false
        this.selectedTaskIds = new Set()
        this.showingArchivedProjects = false

        // Timer state
        this.activeTimers = new Map()

        // Pomodoro state
        this.pomodoroTimer = null
        this.pomodoroTimeLeft = 25 * 60 // 25 minutes in seconds
        this.pomodoroIsRunning = false
        this.pomodoroIsBreak = false

        // Focus mode state
        this.focusTaskId = null

        // Calendar state
        this.calendarView = 'month'
        this.calendarDate = new Date()

        // Undo/Redo state
        this.history = []
        this.historyIndex = -1
        this.maxHistorySize = 50

        // Usage tracking for smart defaults
        this.usageStats = this.loadUsageStats()

        // Default contexts - initialize with standard defaults
        this.defaultContexts = ['@home', '@work', '@personal', '@computer', '@phone', '@errand']

        // Focus mode
        this.focusModeTaskId = null

        // Error logging
        this.errorLog = []
        this.maxLogSize = 100
    }

    /**
     * Get current state as a plain object
     * @returns {Object} Current application state
     */
    getState () {
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
        }
    }

    /**
     * Update multiple state properties at once
     * @param updates - Object containing properties to update
     */
    setState (updates: Partial<AppState>) {
        for (const key in updates) {
            if (Object.prototype.hasOwnProperty.call(updates, key)) {
                // Check if property exists on AppState type
                if (key in this) {
                    ;(this as any)[key] = updates[key as keyof AppState]
                } else {
                    this.logger.warn(`Attempted to set unknown state property: ${key}`)
                }
            }
        }
    }

    /**
     * Load usage statistics from localStorage
     * @returns {Object} Usage statistics
     */
    loadUsageStats () {
        try {
            const stats = localStorage.getItem('gtd_usage_stats')
            return stats
                ? JSON.parse(stats)
                : {
                    contexts: {},
                    times: {},
                    lastUpdated: null
                }
        } catch (error) {
            this.logger.warn('Failed to load usage stats:', error)
            return {
                contexts: {},
                times: {},
                lastUpdated: null
            }
        }
    }

    /**
     * Save usage statistics to localStorage
     */
    saveUsageStats () {
        try {
            localStorage.setItem('gtd_usage_stats', JSON.stringify(this.usageStats))
            this.usageStats.lastUpdated = new Date().toISOString()
        } catch (error) {
            this.logger.warn('Failed to save usage stats:', error)
        }
    }

    /**
     * Track task usage for smart defaults
     * @param {Task} task - The task to track
     */
    trackTaskUsage (task) {
        // Track contexts
        if (task.contexts && task.contexts.length > 0) {
            task.contexts.forEach((context) => {
                if (!this.usageStats.contexts[context]) {
                    this.usageStats.contexts[context] = 0
                }
                this.usageStats.contexts[context]++
            })
        }

        // Track time estimates
        if (task.time) {
            const timeKey = task.time.toString()
            if (!this.usageStats.times[timeKey]) {
                this.usageStats.times[timeKey] = 0
            }
            this.usageStats.times[timeKey]++
        }

        this.saveUsageStats()
    }

    /**
     * Reset state to defaults
     */
    reset () {
        this.currentView = 'inbox'
        this.currentProjectId = null
        this.filters = { context: '', energy: '', time: '' }
        this.selectedContextFilters.clear()
        this.searchQuery = ''
        this.selectedTaskId = null
        this.bulkSelectionMode = false
        this.selectedTaskIds.clear()
        this.showingArchivedProjects = false
        this.focusTaskId = null
    }

    /**
     * Get smart suggestions for tasks to work on
     * @param {Array} tasks - All tasks
     * @param {Object} options - Filter options
     * @returns {Array} Array of suggested tasks with scores
     */
    getSmartSuggestions (tasks = this.tasks, options = {}) {
        const { maxSuggestions = 10, context = null, time = null, energy = null } = options

        // Get active next action tasks
        let suggestions = tasks.filter(
            (t) => !t.completed && t.status === 'next' && (!t.deferDate || t.isAvailable())
        )

        // Apply filters
        if (context) {
            suggestions = suggestions.filter((t) => t.contexts && t.contexts.includes(context))
        }
        if (time) {
            suggestions = suggestions.filter((t) => t.time <= parseInt(time))
        }
        if (energy) {
            suggestions = suggestions.filter((t) => t.energy === energy)
        }

        // Score tasks based on multiple factors
        suggestions = suggestions.map((task) => {
            let score = 0
            const reasons = []

            // Starred tasks get priority
            if (task.starred) {
                score += 50
                reasons.push('⭐ Starred')
            }

            // Due date urgency
            if (task.dueDate) {
                const daysUntilDue = Math.ceil(
                    (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
                )
                if (daysUntilDue <= 0) {
                    score += 40 // Overdue
                    reasons.push('🔴 Overdue')
                } else if (daysUntilDue <= 2) {
                    score += 30 // Due soon
                    reasons.push(`🟡 Due in ${daysUntilDue} days`)
                } else if (daysUntilDue <= 7) {
                    score += 20 // Due this week
                    reasons.push(`🟢 Due in ${daysUntilDue} days`)
                }
            }

            // Time estimate (shorter tasks get slight priority)
            if (task.time) {
                score += Math.max(0, 20 - task.time)
                reasons.push(`⏱️ ${task.time} min`)
            }

            // Contexts
            if (task.contexts && task.contexts.length > 0) {
                reasons.push(task.contexts.join(', '))
            }

            // Usage-based suggestions (frequently used contexts)
            if (task.contexts && this.usageStats.contexts) {
                task.contexts.forEach((ctx) => {
                    score += (this.usageStats.contexts[ctx] || 0) * 2
                })
            }

            // Add default reason if no specific reasons
            if (reasons.length === 0) {
                reasons.push('Ready to start')
            }

            return { task, score, reasons }
        })

        // Sort by score (highest first) and limit results
        return suggestions.sort((a, b) => b.score - a.score).slice(0, maxSuggestions)
    }
}
