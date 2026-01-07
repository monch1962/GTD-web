/**
 * GTD Web Application Constants
 * Centralized configuration and constants
 */

// Task statuses
export const TaskStatus = {
    INBOX: 'inbox',
    NEXT: 'next',
    WAITING: 'waiting',
    SOMEDAY: 'someday',
    COMPLETED: 'completed'
};

// Task types
export const TaskType = {
    TASK: 'task',
    REFERENCE: 'reference'
};

// Project statuses
export const ProjectStatus = {
    ACTIVE: 'active',
    SOMEDAY: 'someday',
    COMPLETED: 'completed'
};

// Energy levels
export const EnergyLevel = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

// Time estimates (in minutes)
export const TimeEstimate = {
    NONE: 0,
    FIVE: 5,
    FIFTEEN: 15,
    THIRTY: 30,
    SIXTY: 60,
    NINETY: 90
};

// Default contexts
export const DEFAULT_CONTEXTS = [
    '@home',
    '@work',
    '@personal',
    '@computer',
    '@phone'
];

// View names
export const Views = {
    INBOX: 'inbox',
    NEXT: 'next',
    WAITING: 'waiting',
    SOMEDAY: 'someday',
    PROJECTS: 'projects',
    REFERENCE: 'reference'
};

// Status colors for Gantt chart
export const StatusColors = {
    inbox: '#95a5a6',
    next: '#4a90d9',
    waiting: '#f39c12',
    someday: '#9b59b6',
    completed: '#5cb85c',
    overdue: '#e74c3c'
};

// Status display labels
export const StatusLabels = {
    inbox: 'Inbox',
    next: 'Next',
    waiting: 'Waiting',
    someday: 'Someday',
    completed: 'Completed'
};

// View display labels (for navigation and titles)
export const ViewLabels = {
    inbox: 'Inbox',
    next: 'Next Actions',
    waiting: 'Waiting',
    someday: 'Someday',
    projects: 'Projects',
    reference: 'Reference',
    all: 'All Items'
};

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
};

// Storage keys
export const StorageKeys = {
    TASKS: 'gtd_tasks',
    PROJECTS: 'gtd_projects',
    REFERENCE: 'gtd_reference',
    CUSTOM_CONTEXTS: 'gtd_custom_contexts',
    USER_ID: 'gtd_user_id'
};

// Gantt chart configuration
export const GanttConfig = {
    taskWidth: 200,
    taskHeight: 60,
    horizontalSpacing: 80,
    verticalSpacing: 100,
    marginLeft: 50,
    marginTop: 50,
    maxTitleLength: 25
};

// Recurrence intervals
export const RecurrenceInterval = {
    NONE: '',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
};

// Recurrence display labels
export const RecurrenceLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
};

// Pomodoro Configuration
export const PomodoroConfig = {
    WORK_DURATION: 25 * 60,      // 25 minutes in seconds
    BREAK_DURATION: 5 * 60,      // 5 minutes in seconds
    LONG_BREAK_DURATION: 15 * 60 // 15 minutes in seconds
};

// Time Thresholds (in days)
export const TimeThresholds = {
    ARCHIVE_TASKS_DAYS: 90,         // Archive tasks completed 90+ days ago
    STALLED_PROJECTS_DAYS: 30,      // Projects inactive for 30 days
    TASK_AGING_PENALTY_DAYS: 30,    // Task age for priority bonus
    TASK_AGING_HIGH_DAYS: 14,       // Secondary threshold
    TASK_AGING_MEDIUM_DAYS: 7,      // Tertiary threshold
    DUE_SOON_DAYS: 7,               // Tasks due within 7 days
    DUE_VERY_SOON_DAYS: 3,          // Tasks due within 3 days
    COUNTDOWN_MAX_DAYS: 14,         // Show countdown for tasks due within 14 days
    COUNTDOWN_URGENT_DAYS: 2,       // Urgent countdown threshold
    COUNTDOWN_WARNING_DAYS: 5,      // Warning countdown threshold
    COUNTDOWN_NORMAL_DAYS: 7        // Normal countdown threshold
};

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
};

// Priority Score Thresholds
export const PriorityThresholds = {
    URGENT_MIN: 80,
    HIGH_MIN: 60,
    MEDIUM_MIN: 40,
    LOW_MIN: 20
};

// Priority Labels
export const PriorityLabels = {
    URGENT: 'Urgent',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    VERY_LOW: 'Very Low'
};

// Priority Colors
export const PriorityColors = {
    URGENT: 'var(--danger-color)',
    HIGH: '#f39c12',
    MEDIUM: 'var(--warning-color)',
    LOW: 'var(--info-color)',
    VERY_LOW: 'var(--text-secondary)'
};

// UI Configuration
export const UI = {
    TOAST_DURATION: 300,
    TOAST_TIMEOUT: 2000,
    DEBOUNCE_DELAY: 100,
    LONG_PRESS_DURATION: 500,      // Mobile long-press duration in ms
    MAX_UNDO_STATES: 50,
    HEATMAP_DAYS: 365,             // Number of days to show in heatmap
    SUGGESTIONS_MAX: 10,            // Maximum number of smart suggestions
    DAILY_REVIEW_RECENT: 5          // Number of recent items to show
};

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
};

// Toast Message Templates
export const ToastMessages = {
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
};

// Context Menu Actions
export const ContextActions = {
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
};

// Heatmap Color Levels
export const HeatmapColors = {
    LEVEL_0: '#ebedf0',
    LEVEL_1: '#9be9a8',
    LEVEL_2: '#40c463',
    LEVEL_3: '#30a14e',
    LEVEL_4: '#216e39'
};
