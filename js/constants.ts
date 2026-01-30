/**
 * GTD Web Application Constants - TypeScript Version
 * Centralized configuration and constants with type safety
 */

// Import default contexts from config
import { getDefaultContextIds } from './config/defaultContexts.js'

// ============================================================================
// Type Definitions
// ============================================================================

export type TaskStatusType = 'inbox' | 'next' | 'waiting' | 'someday' | 'completed'
export type TaskTypeType = 'task' | 'reference'
export type ProjectStatusType = 'active' | 'someday' | 'completed' | 'archived'
export type EnergyLevelType = 'high' | 'medium' | 'low'
export type RecurrenceIntervalType = '' | 'daily' | 'weekly' | 'monthly' | 'yearly'
export type WeekdayType = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type PriorityLevelType = 'Urgent' | 'High' | 'Medium' | 'Low' | 'Very Low'
export type ViewType = 'inbox' | 'next' | 'waiting' | 'someday' | 'projects' | 'reference' | 'all'
export type ContextActionType =
    | 'edit'
    | 'duplicate'
    | 'toggle-star'
    | 'set-status'
    | 'set-energy'
    | 'set-project'
    | 'add-context'
    | 'remove-context'
    | 'set-due-date'
    | 'complete'
    | 'delete'

export interface ToastMessageTemplates {
    Task: {
        created: (count?: number) => string
        completed: (count?: number) => string
        deleted: (count?: number) => string
        updated: () => string
        duplicated: () => string
        archived: (count?: number) => string
        restored: () => string
    }
    Status: {
        changed: (status: string) => string
        updated: (status: string) => string
    }
    Time: {
        tracked: (minutes: number, title: string) => string
        started: () => string
        stopped: () => string
    }
    Project: {
        created: () => string
        deleted: () => string
        updated: () => string
    }
    Undo: {
        saved: (action: string) => string
        restored: (action: string) => string
    }
    Focus: {
        entered: () => string
        exited: () => string
        completed: () => string
    }
    Capture: {
        success: () => string
        fromTemplate: (title: string) => string
    }
}

export interface StorageInfo {
    used: number
    total: number
    percentage: number
    available: number
    nearQuota: boolean
}

// ============================================================================
// Constants
// ============================================================================

// Task statuses
export const TaskStatus = {
    INBOX: 'inbox' as TaskStatusType,
    NEXT: 'next' as TaskStatusType,
    WAITING: 'waiting' as TaskStatusType,
    SOMEDAY: 'someday' as TaskStatusType,
    COMPLETED: 'completed' as TaskStatusType
}

// Task types
export const TaskType = {
    TASK: 'task' as TaskTypeType,
    REFERENCE: 'reference' as TaskTypeType
}

// Project statuses
export const ProjectStatus = {
    ACTIVE: 'active' as ProjectStatusType,
    SOMEDAY: 'someday' as ProjectStatusType,
    COMPLETED: 'completed' as ProjectStatusType,
    ARCHIVED: 'archived' as ProjectStatusType
}

// Energy levels
export const EnergyLevel = {
    HIGH: 'high' as EnergyLevelType,
    MEDIUM: 'medium' as EnergyLevelType,
    LOW: 'low' as EnergyLevelType
}

// Time estimates (in minutes)
export const TimeEstimate = {
    NONE: 0,
    FIVE: 5,
    FIFTEEN: 15,
    THIRTY: 30,
    SIXTY: 60,
    NINETY: 90
}

// Default contexts (imported from config for single source of truth)
export const DEFAULT_CONTEXTS: string[] = getDefaultContextIds()

// View names
export const Views = {
    INBOX: 'inbox' as ViewType,
    NEXT: 'next' as ViewType,
    WAITING: 'waiting' as ViewType,
    SOMEDAY: 'someday' as ViewType,
    PROJECTS: 'projects' as ViewType,
    REFERENCE: 'reference' as ViewType
}

// Status colors for Gantt chart
export const StatusColors: Record<TaskStatusType | 'overdue', string> = {
    inbox: '#95a5a6',
    next: '#4a90d9',
    waiting: '#f39c12',
    someday: '#9b59b6',
    completed: '#5cb85c',
    overdue: '#e74c3c'
}

// Status display labels
export const StatusLabels: Record<TaskStatusType, string> = {
    inbox: 'Inbox',
    next: 'Next',
    waiting: 'Waiting',
    someday: 'Someday',
    completed: 'Completed'
}

// View display labels (for navigation and titles)
export const ViewLabels: Record<ViewType, string> = {
    inbox: 'Inbox',
    next: 'Next Actions',
    waiting: 'Waiting',
    someday: 'Someday',
    projects: 'Projects',
    reference: 'Reference',
    all: 'All Items'
}

// Element IDs
export const ElementIds = {
    quickAddInput: 'quick-add-input',
    taskModal: 'task-modal',
    taskForm: 'task-form',
    projectModal: 'project-modal',
    projectForm: 'project-form',
    ganttModal: 'gantt-modal',
    ganttChart: 'gantt-chart',
    tasksContainer: 'tasks-container',
    projectsContainer: 'projects-container',
    referenceContainer: 'reference-container',
    tagModal: 'tag-modal',
    tagForm: 'tag-form',
    waitingForTasksList: 'waiting-for-tasks-list',
    projectsDropdown: 'projects-dropdown',
    userId: 'user-id'
}

// Storage keys
export const StorageKeys = {
    TASKS: 'gtd_tasks',
    PROJECTS: 'gtd_projects',
    REFERENCE: 'gtd_reference',
    CUSTOM_CONTEXTS: 'gtd_custom_contexts',
    USER_ID: 'gtd_user_id'
}

// Gantt chart configuration
export const GanttConfig = {
    taskWidth: 200,
    taskHeight: 60,
    horizontalSpacing: 80,
    verticalSpacing: 100,
    marginLeft: 50,
    marginTop: 50,
    maxTitleLength: 25
}

// Recurrence intervals
export const RecurrenceInterval = {
    NONE: '' as RecurrenceIntervalType,
    DAILY: 'daily' as RecurrenceIntervalType,
    WEEKLY: 'weekly' as RecurrenceIntervalType,
    MONTHLY: 'monthly' as RecurrenceIntervalType,
    YEARLY: 'yearly' as RecurrenceIntervalType
}

// Weekday constants (ISO 8601: 1=Monday, 7=Sunday)
export const Weekday: Record<string, WeekdayType> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7
}

// Weekday names
export const WeekdayNames: Record<WeekdayType, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday'
}

// Nth weekday labels
export const NthWeekdayLabels: Record<number, string> = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: '4th',
    5: '5th'
}

// Recurrence display labels
export const RecurrenceLabels: Record<RecurrenceIntervalType, string> = {
    '': 'None',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
}

// Pomodoro Configuration
export const PomodoroConfig = {
    WORK_DURATION: 25 * 60, // 25 minutes in seconds
    BREAK_DURATION: 5 * 60, // 5 minutes in seconds
    LONG_BREAK_DURATION: 15 * 60 // 15 minutes in seconds
}

// Time Thresholds (in days)
export const TimeThresholds = {
    ARCHIVE_TASKS_DAYS: 90, // Archive tasks completed 90+ days ago
    STALLED_PROJECTS_DAYS: 30, // Projects inactive for 30 days
    TASK_AGING_PENALTY_DAYS: 30, // Task age for priority bonus
    TASK_AGING_HIGH_DAYS: 14, // Secondary threshold
    TASK_AGING_MEDIUM_DAYS: 7, // Tertiary threshold
    DUE_SOON_DAYS: 7, // Tasks due within 7 days
    DUE_VERY_SOON_DAYS: 3, // Tasks due within 3 days
    COUNTDOWN_MAX_DAYS: 14, // Show countdown for tasks due within 14 days
    COUNTDOWN_URGENT_DAYS: 2, // Urgent countdown threshold
    COUNTDOWN_WARNING_DAYS: 5, // Warning countdown threshold
    COUNTDOWN_NORMAL_DAYS: 7 // Normal countdown threshold
}

// Priority Score Weights
export const PriorityWeights = {
    BASE_SCORE: 50,
    OVERDUE_BONUS: 25,
    DUE_TODAY_BONUS: 20,
    DUE_TOMORROW_BONUS: 15,
    DUE_SOON_BONUS: 10,
    DUE_WEEK_BONUS: 5,
    STARRED_BONUS: 15,
    NEXT_ACTION_BONUS: 10,
    INBOX_BONUS: 5,
    DEPENDENCY_READY_BONUS: 10,
    DEPENDENCY_BLOCKED_PENALTY: -10,
    QUICK_HIGH_ENERGY_BONUS: 8,
    LONG_LOW_ENERGY_PENALTY: -5,
    QUICK_TASK_BONUS: 5,
    MEDIUM_TASK_BONUS: 3,
    ACTIVE_PROJECT_BONUS: 5,
    DEFER_PENALTY: -20,
    OLD_TASK_BONUS: 7,
    OLD_TASK_BONUS_MEDIUM: 5,
    OLD_TASK_BONUS_LOW: 3
}

// Priority Score Thresholds
export const PriorityThresholds = {
    URGENT_MIN: 80,
    HIGH_MIN: 60,
    MEDIUM_MIN: 40,
    LOW_MIN: 20
}

// Priority Labels
export const PriorityLabels: Record<PriorityLevelType, string> = {
    Urgent: 'Urgent',
    High: 'High',
    Medium: 'Medium',
    Low: 'Low',
    'Very Low': 'Very Low'
}

// Priority Colors
export const PriorityColors: Record<PriorityLevelType, string> = {
    Urgent: 'var(--danger-color)',
    High: '#f39c12',
    Medium: 'var(--warning-color)',
    Low: 'var(--info-color)',
    'Very Low': 'var(--text-secondary)'
}

// UI Configuration
export const UI = {
    TOAST_DURATION: 300,
    TOAST_TIMEOUT: 2000,
    DEBOUNCE_DELAY: 100,
    LONG_PRESS_DURATION: 500, // Mobile long-press duration in ms
    MAX_UNDO_STATES: 50,
    HEATMAP_DAYS: 365, // Number of days to show in heatmap
    SUGGESTIONS_MAX: 10, // Maximum number of smart suggestions
    DAILY_REVIEW_RECENT: 5 // Number of recent items to show
}

// Element IDs for new features
export const ModalIds = {
    TASK: 'task-modal',
    PROJECT: 'project-modal',
    CONTEXT: 'tag-modal',
    GANTT: 'gantt-modal',
    DASHBOARD: 'dashboard-modal',
    HELP: 'help-modal',
    TEMPLATES: 'templates-modal',
    DAILY_REVIEW: 'daily-review-modal',
    WEEKLY_REVIEW: 'weekly-review-modal',
    ARCHIVE: 'archive-modal',
    DEPENDENCIES: 'dependencies-modal',
    HEATMAP: 'heatmap-modal',
    FOCUS_MODE: 'focus-mode-overlay',
    GLOBAL_QUICK_CAPTURE: 'global-quick-capture-overlay'
}

// Toast Message Templates
export const ToastMessages: ToastMessageTemplates = {
    Task: {
        created: (count = 1) => `${count} task${count > 1 ? 's' : ''} created`,
        completed: (count = 1) => `${count} task${count > 1 ? 's' : ''} completed`,
        deleted: (count = 1) => `${count} task${count > 1 ? 's' : ''} deleted`,
        updated: () => 'Task updated',
        duplicated: () => 'Task duplicated',
        archived: (count = 1) => `${count} task${count > 1 ? 's' : ''} archived`,
        restored: () => 'Task restored'
    },
    Status: {
        changed: (status) => `Status set to ${status}`,
        updated: (status) => `Status changed to ${status}`
    },
    Time: {
        tracked: (minutes, title) => `Tracked ${minutes} minutes on "${title}"`,
        started: () => 'Timer started',
        stopped: () => 'Timer stopped'
    },
    Project: {
        created: () => 'Project created',
        deleted: () => 'Project deleted',
        updated: () => 'Project updated'
    },
    Undo: {
        saved: (action) => `${action} (undo available)`,
        restored: (action) => `${action} restored`
    },
    Focus: {
        entered: () => 'Focus mode activated! Timer started automatically',
        exited: () => 'Focus mode exited',
        completed: () => 'Task completed! Timer stopped automatically'
    },
    Capture: {
        success: () => 'Task captured!',
        fromTemplate: (title) => `Created task from template: ${title}`
    }
}

// Context Menu Actions
export const ContextActions: Record<string, ContextActionType> = {
    EDIT: 'edit',
    DUPLICATE: 'duplicate',
    TOGGLE_STAR: 'toggle-star',
    SET_STATUS: 'set-status',
    SET_ENERGY: 'set-energy',
    SET_PROJECT: 'set-project',
    ADD_CONTEXT: 'add-context',
    REMOVE_CONTEXT: 'remove-context',
    SET_DUE_DATE: 'set-due-date',
    COMPLETE: 'complete',
    DELETE: 'delete'
}

// Heatmap Color Levels
export const HeatmapColors = {
    LEVEL_0: '#ebedf0',
    LEVEL_1: '#9be9a8',
    LEVEL_2: '#40c463',
    LEVEL_3: '#30a14e',
    LEVEL_4: '#216e39'
}

// Virtual Scrolling Configuration
export const VirtualScrollConfig = {
    ITEM_HEIGHT: 120, // Default item height in pixels
    BUFFER_ITEMS: 5, // Number of items to render above/below viewport
    THROTTLE_DELAY: 16, // Scroll throttle delay (60fps = ~16ms)
    DEBOUNCE_DELAY: 100, // Resize debounce delay in ms
    ACTIVATION_THRESHOLD: 50 // Minimum items to activate virtual scrolling
}

// Performance Monitoring Thresholds
export const PerformanceThresholds = {
    SLOW_OPERATION_MS: 100, // Operation duration considered slow (ms)
    HIGH_MEMORY_PERCENT: 80, // Memory usage considered high (%)
    FPS_EXCELLENT: 55, // FPS threshold for excellent performance
    FPS_GOOD: 30, // FPS threshold for good performance
    FIRST_PAINT_MS: 2000, // First paint warning threshold (ms)
    FIRST_CONTENTFUL_PAINT_MS: 3000 // First contentful paint warning threshold (ms)
}

// Storage Configuration
export const StorageConfig = {
    QUOTA_WARNING_THRESHOLD: 0.9, // Warn at 90% capacity
    ESTIMATED_TOTAL_SIZE: 5 * 1024 * 1024, // Conservative 5MB estimate
    ARCHIVE_MAX_AGE_DAYS: 180, // Remove archive entries older than 180 days
    ARCHIVE_MAX_AGE_MS: 180 * 24 * 60 * 60 * 1000 // 180 days in milliseconds
}
