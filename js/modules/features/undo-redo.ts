/**
 * ============================================================================
 * Undo/Redo Manager - TypeScript Version
 * ============================================================================
 *
 * Manages the undo/redo history system for the application.
 *
 * This manager handles:
 * - State history tracking (tasks and projects)
 * - Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
 * - Undo/redo button state management
 * - History size limiting (max 50 states)
 * - State restoration with UI updates
 */

import { Task, Project } from '../../models'

/**
 * App interface for type safety
 */
interface App {
    saveTasks?: () => Promise<void>
    saveProjects?: () => Promise<void>
    renderView?: () => void
    updateCounts?: () => void
    renderProjectsDropdown?: () => void
    showNotification?: (message: string) => void
}

/**
 * State interface for undo/redo
 */
interface State {
    tasks: Task[]
    projects: Project[]
    history: HistoryState[]
    historyIndex: number
    maxHistorySize: number
}

/**
 * History state interface
 */
interface HistoryState {
    action: string
    tasks: any[] // Task JSON data
    projects: any[] // Project JSON data
    timestamp: string
}

export class UndoRedoManager {
    private state: State
    private app: App

    constructor(state: State, app: App) {
        this.state = state
        this.app = app

        // Initialize history properties on state
        this.state.history = []
        this.state.historyIndex = -1
        this.state.maxHistorySize = 50
    }

    // =========================================================================
    // SETUP
    // =========================================================================

    /**
     * Setup the undo/redo system
     */
    setupUndoRedo(): void {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                this.undo()
            }
            // Ctrl+Y or Ctrl+Shift+Z for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                this.redo()
            }
        })

        // Button listeners
        const undoBtn = document.getElementById('btn-undo')
        const redoBtn = document.getElementById('btn-redo')

        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo())
        }
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo())
        }

        this.updateUndoRedoButtons()
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Save current state to history
     * @param {string} action - Description of the action
     */
    saveState(action: string): void {
        // Save current state to history
        const state: HistoryState = {
            action: action,
            tasks: JSON.parse(JSON.stringify(this.state.tasks.map((t) => t.toJSON()))),
            projects: JSON.parse(JSON.stringify(this.state.projects.map((p) => p.toJSON()))),
            timestamp: new Date().toISOString()
        }

        // Remove any states after current index (we're creating a new branch)
        this.state.history = this.state.history.slice(0, this.state.historyIndex + 1)

        // Add new state
        this.state.history.push(state)
        this.state.historyIndex++

        // Limit history size
        if (this.state.history.length > this.state.maxHistorySize) {
            this.state.history.shift()
            this.state.historyIndex--
        }

        this.updateUndoRedoButtons()
    }

    /**
     * Undo to previous state
     */
    async undo(): Promise<void> {
        if (this.state.historyIndex <= 0) return

        this.state.historyIndex--
        const state = this.state.history[this.state.historyIndex]

        // Restore state
        this.state.tasks = state.tasks.map((t) => Task.fromJSON(t))
        this.state.projects = state.projects.map((p) => Project.fromJSON(p))

        // Persist changes
        await this.app.saveTasks?.()
        await this.app.saveProjects?.()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.renderProjectsDropdown?.()
        this.updateUndoRedoButtons()

        this.app.showNotification?.(`Undid: ${state.action}`)
    }

    /**
     * Redo to next state
     */
    async redo(): Promise<void> {
        if (this.state.historyIndex >= this.state.history.length - 1) return

        this.state.historyIndex++
        const state = this.state.history[this.state.historyIndex]

        // Restore state
        this.state.tasks = state.tasks.map((t) => Task.fromJSON(t))
        this.state.projects = state.projects.map((p) => Project.fromJSON(p))

        // Persist changes
        await this.app.saveTasks?.()
        await this.app.saveProjects?.()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.renderProjectsDropdown?.()
        this.updateUndoRedoButtons()

        this.app.showNotification?.(`Redid: ${state.action}`)
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons(): void {
        const undoBtn = document.getElementById('btn-undo')
        const redoBtn = document.getElementById('btn-redo')

        if (undoBtn) {
            undoBtn.disabled = this.state.historyIndex <= 0
            undoBtn.style.opacity = this.state.historyIndex <= 0 ? '0.5' : '1'
        }
        if (redoBtn) {
            redoBtn.disabled = this.state.historyIndex >= this.state.history.length - 1
            redoBtn.style.opacity =
                this.state.historyIndex >= this.state.history.length - 1 ? '0.5' : '1'
        }
    }
}
