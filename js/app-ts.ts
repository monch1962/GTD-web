/**
 * TypeScript wrapper for GTD App
 * This provides TypeScript types while delegating to the original JavaScript app
 */

// Import the original JavaScript app
import './app.js'

// Re-export the GTDApp class with TypeScript types
declare global {
    interface Window {
        app: any
    }
}

// Type definitions for the app
export interface Task {
    id: string
    title: string
    description?: string
    completed: boolean
    priority: number
    contexts: string[]
    projectId?: string
    dueDate?: string
    createdAt: string
    updatedAt: string
    status: 'inbox' | 'next' | 'waiting' | 'scheduled' | 'someday'
    energy?: 'low' | 'medium' | 'high'
    time?: 'short' | 'medium' | 'long'
    tags?: string[]
    parentId?: string
    dependencies?: string[]
    archived?: boolean
    archivedAt?: string
    recurrence?: any
    timeSpent?: number
    estimatedTime?: number
    notes?: string
    order?: number
}

export interface Project {
    id: string
    name: string
    description?: string
    color?: string
    icon?: string
    archived: boolean
    archivedAt?: string
    createdAt: string
    updatedAt: string
    defaultContext?: string
    defaultEnergy?: 'low' | 'medium' | 'high'
    defaultTime?: 'short' | 'medium' | 'long'
    order?: number
}

export interface Template {
    id: string
    name: string
    description?: string
    tasks: Partial<Task>[]
    contexts?: string[]
    projectId?: string
    tags?: string[]
    createdAt: string
    updatedAt: string
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

    // Methods that modules expect
    saveTasks(): Promise<void>
    saveProjects(): Promise<void>
    saveTemplates(): Promise<void>
    renderView(): void
    updateCounts(): void
    showNotification?(title: string, type: 'success' | 'error' | 'warning' | 'info'): void
    saveState?(action: string): void
}

// Export a function to get the app instance
export function getApp(): GTDAppInterface {
    return window.app
}

// Initialize the app
export async function initApp(): Promise<void> {
    // The original app.js already initializes itself
    // This is just a TypeScript wrapper
    console.log('TypeScript app wrapper initialized')
}
