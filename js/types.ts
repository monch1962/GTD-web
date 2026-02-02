/**
 * TypeScript type definitions for GTD App
 * Consolidated interfaces for all module dependencies
 */

// Import models
import type { Task, Project, Template } from './models'

// Re-export models
export type { Task, Project, Template }

// Partial task data for modal defaults
export interface PartialTaskData {
    type?: 'task' | 'project' | 'reference'
    title?: string
    description?: string
    [key: string]: unknown // Allow other properties
}

// Pending task data for project modal
export interface PendingTaskData {
    title?: string
    description?: string
}

// Parser interfaces
export interface ParserResult {
    title?: string
    contexts?: string[]
    energy?: string
    time?: number
    dueDate?: string | null
    recurrence?: string
}

export interface AppParser {
    parse: (title: string) => ParserResult
}

// App State interface (what modules expect as first parameter)
export interface AppState {
    tasks: Task[]
    projects: Project[]
    templates: Template[]
    currentView: string
    currentProjectId: string | null
    trackTaskUsage?: (task: Task) => void
    [key: string]: unknown // Allow additional properties
}

// Consolidated App Dependencies interface (what modules expect as second parameter)
export interface AppDependencies {
    // Core methods
    saveTasks?: () => Promise<void>
    saveProjects?: () => Promise<void>
    saveTemplates?: () => Promise<void>
    renderView?: () => void
    updateCounts?: () => void
    saveState?: (description: string) => void

    // UI methods
    showNotification?: (title: string, type?: 'success' | 'error' | 'warning' | 'info') => void
    showSuccess?: (message: string) => void
    showWarning?: (message: string) => void
    showError?: (message: string) => void
    showToast?: (message: string) => void

    // Navigation methods
    switchView?: (view: string, projectId?: string | null) => void
    updateContextFilter?: () => void
    renderProjectsDropdown?: () => void

    // Modal methods
    openTaskModal?: (
        task: Task | null,
        defaultProjectId?: string,
        defaultData?: PartialTaskData
    ) => void
    openProjectModal?: (project: Project | null, pendingTaskData?: PendingTaskData) => void
    openReferenceModal?: (ref: Task) => void

    // Parser
    parser?: AppParser

    // Other methods
    updateBulkSelectButtonVisibility?: () => void
    deleteReference?: (id: string) => void
    openGanttChart?: (project: Project) => void
    renderCustomContexts?: () => void
    updateQuickAddPlaceholder?: () => void
    saveUsageStats?: () => void
    showInfo?: (message: string) => void
    showCalendar?: () => void
    showContextMenu?: (task: Task, x: number, y: number) => void
    showDailyReview?: () => void
    showDashboard?: () => void
    showDependencies?: (task: Task) => void
    showSearch?: () => void
    showSuggestions?: () => void
    showWeeklyReview?: () => void
    startTimer?: (task: Task) => void
    stopTimer?: () => void
    enterFocusMode?: () => void
    getSmartSuggestions?: () => Task[]
    openHeatmapModal?: () => void
    openTemplatesModal?: () => void
    quickAddTask?: (title: string) => Promise<void>
    redo?: () => void
    undo?: () => void
    archiveProject?: (projectId: string) => void
    archiveTask?: (taskId: string) => void
    deleteProject?: (projectId: string) => void
    deleteTask?: (taskId: string) => void
    duplicateTask?: (taskId: string) => void
    normalizeContextName?: (context: string) => string
    saveTaskAsTemplate?: (task: Task) => void
    saveStateToStorage?: () => void
    setProjectFilter?: (projectId: string | null) => void
    toggleSubtask?: (taskId: string, subtaskIndex: number) => void
    toggleTaskComplete?: (taskId: string) => void
    toggleTaskStar?: (taskId: string) => void
    updateTaskEnergy?: (taskId: string, energy: string) => void
    updateTaskProject?: (taskId: string, projectId: string | null) => void
    updateTaskStatus?: (taskId: string, status: string) => void
    updateNavigation?: () => void
    unarchiveProject?: (projectId: string) => void

    // Data properties (for direct access)
    tasks?: Task[]
    projects?: Project[]
    templates?: Template[]
    models?: unknown
    storage?: unknown
    usageStats?: unknown
    activeTimers?: unknown
    calendarDate?: unknown

    // Allow additional properties for future extensibility
    [key: string]: unknown
}

// Main app interface
export interface GTDAppInterface {
    // Core data
    tasks: Task[]
    projects: Project[]
    templates: Template[]

    // State
    currentView: string
    currentProjectId: string | null

    // Methods
    saveTasks(): Promise<void>
    saveProjects(): Promise<void>
    saveTemplates(): Promise<void>
    renderView(): void
    updateCounts(): void
    showNotification?(title: string, type: 'success' | 'error' | 'warning' | 'info'): void
    saveState?(action: string): void
}
