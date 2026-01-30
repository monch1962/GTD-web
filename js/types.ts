/**
 * TypeScript type definitions for GTD App
 * Consolidated interfaces for all module dependencies
 */

// Import models
import type { Task, Project, Template } from './models'

// Re-export models
export type { Task, Project, Template }

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
    [key: string]: any // Allow additional properties
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
    openTaskModal?: (task: Task | null, defaultProjectId?: string, defaultData?: any) => void
    openProjectModal?: (project: Project | null, pendingTaskData?: any) => void
    openReferenceModal?: (ref: Task) => void

    // Parser
    parser?: AppParser

    // Other methods
    updateBulkSelectButtonVisibility?: () => void
    deleteReference?: (id: string) => void
    openGanttChart?: (project: Project) => void

    // Allow additional properties
    [key: string]: any
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
