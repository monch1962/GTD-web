/**
 * Keyboard Navigation module
 * Provides comprehensive keyboard shortcuts and task navigation
 *
 * Features:
 * - Vim-style navigation (j/k or arrow keys)
 * - Task selection and manipulation
 * - Quick view switching (Ctrl+1-5)
 * - Focus mode toggle
 * - Global shortcuts (Ctrl+K for quick-add, Ctrl+N for suggestions)
 *
 * @example
 * const keyboardNav = new KeyboardNavigation(state, app);
 * keyboardNav.setupKeyboardShortcuts();
 * keyboardNav.selectTask('task-123');
 */

import { Task } from '../../models'

// Define types for the app interface
interface AppDependencies {
    showSuggestions?: () => void
    duplicateTask?: (taskId: string) => Promise<void>
    openTaskModal?: (task: Task | null) => void
    toggleTaskComplete?: (taskId: string) => Promise<void>
    deleteTask?: (taskId: string) => Promise<void>
    enterFocusMode?: (taskId: string) => void
    switchView?: (view: string) => void
    showInfo?: (message: string) => void
    [key: string]: any // Allow for additional app methods
}

interface AppState {
    tasks: Task[]
    [key: string]: any // Allow for additional state properties
}

export class KeyboardNavigation {
    private state: AppState
    private app: AppDependencies
    private selectedTaskId: string | null

    /**
     * Create a new KeyboardNavigation instance
     * @param state - Application state object
     * @param state.tasks - Array of tasks for navigation
     * @param app - Application instance
     * @param app.showSuggestions - Show suggestions modal
     * @param app.duplicateTask - Duplicate selected task
     * @param app.openTaskModal - Open task modal for editing
     * @param app.toggleTaskComplete - Toggle task completion
     * @param app.deleteTask - Delete selected task
     * @param app.enterFocusMode - Enter focus mode for task
     * @param app.switchView - Switch to different view
     * @param app.showInfo - Show info toast notification
     */
    constructor (state: AppState, app: AppDependencies) {
        this.state = state
        this.app = app
        this.selectedTaskId = null
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts (): void {
        document.addEventListener('keydown', (e) => this._handleKeyDown(e))
    }

    /**
     * Handle key down events
     * @private
     */
    private _handleKeyDown (e: KeyboardEvent): void {
        // Ignore if user is typing in an input or textarea
        const target = e.target as HTMLElement
        const tagName = target.tagName?.toUpperCase()
        const isContentEditable =
            target.isContentEditable || target.getAttribute?.('contenteditable') === 'true'

        if (
            tagName === 'INPUT' ||
            tagName === 'TEXTAREA' ||
            tagName === 'SELECT' ||
            isContentEditable
        ) {
            // Allow Ctrl+K from any input (for quick-add focus)
            if (!(e.key === 'k' && (e.ctrlKey || e.metaKey))) {
                return
            }
        }

        // Check for modifier keys
        const hasCtrl = e.ctrlKey || e.metaKey
        const hasShift = e.shiftKey
        const hasAlt = e.altKey

        // Handle shortcuts
        switch (e.key) {
        case '?':
            if (!hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._showHelp()
            }
            break

        case 'k':
        case 'K':
            if (hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._focusQuickAdd()
            } else if (!hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._selectPreviousTask()
            }
            break

        case 'j':
        case 'J':
            if (!hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._selectNextTask()
            }
            break

        case 'n':
        case 'N':
            if (hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this.app.showSuggestions?.()
            }
            break

        case 'd':
        case 'D':
            if (hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._duplicateSelectedTask()
            }
            break

        case 'Delete':
        case 'Backspace':
            if (!hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._deleteSelectedTask()
            }
            break

        case ' ':
            if (!hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._toggleSelectedTaskComplete()
            }
            break

        case 'Enter':
            if (!hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._editSelectedTask()
            }
            break

        case 'Escape':
            if (!hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._deselectTask()
            }
            break

        case '/':
            if (hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._toggleFocusMode()
            }
            break

        case 'ArrowUp':
            if (!hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._selectPreviousTask()
            }
            break

        case 'ArrowDown':
            if (!hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._selectNextTask()
            }
            break

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
            if (hasCtrl && !hasShift && !hasAlt) {
                e.preventDefault()
                this._switchToView(e.key)
            }
            break
        }
    }

    /**
     * Select a task by ID
     * @param taskId - Task ID to select
     */
    selectTask (taskId: string): void {
        // Deselect previous task
        if (this.selectedTaskId) {
            const prevElement = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`)
            if (prevElement) {
                prevElement.classList.remove('selected')
            }
        }

        // Select new task
        this.selectedTaskId = taskId
        const element = document.querySelector(`[data-task-id="${taskId}"]`)
        if (element) {
            element.classList.add('selected')
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }

    /**
     * Get selected task
     * @returns Selected task or null
     */
    getSelectedTask (): Task | null {
        if (!this.selectedTaskId) return null
        return this.state.tasks.find((t) => t.id === this.selectedTaskId) || null
    }

    /**
     * Select next task in list
     * @private
     */
    private _selectNextTask (): void {
        if (!this.selectedTaskId) {
            // Select first task
            const firstTask = this.state.tasks.find((t) => !t.completed)
            if (firstTask) {
                this.selectTask(firstTask.id)
            }
            return
        }

        // Check if current task element exists
        const currentElement = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`)
        if (!currentElement) return

        // Find current index
        const currentIndex = this.state.tasks.findIndex((t) => t.id === this.selectedTaskId)
        if (currentIndex === -1) return

        // Find next incomplete task
        for (let i = currentIndex + 1; i < this.state.tasks.length; i++) {
            if (!this.state.tasks[i].completed) {
                this.selectTask(this.state.tasks[i].id)
                return
            }
        }

        // Wrap around to beginning
        for (let i = 0; i < currentIndex; i++) {
            if (!this.state.tasks[i].completed) {
                this.selectTask(this.state.tasks[i].id)
                return
            }
        }
    }

    /**
     * Select previous task in list
     * @private
     */
    private _selectPreviousTask (): void {
        if (!this.selectedTaskId) {
            // Select last task
            for (let i = this.state.tasks.length - 1; i >= 0; i--) {
                if (!this.state.tasks[i].completed) {
                    this.selectTask(this.state.tasks[i].id)
                    return
                }
            }
            return
        }

        // Check if current task element exists
        const currentElement = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`)
        if (!currentElement) return

        // Find current index
        const currentIndex = this.state.tasks.findIndex((t) => t.id === this.selectedTaskId)
        if (currentIndex === -1) return

        // Find previous incomplete task
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (!this.state.tasks[i].completed) {
                this.selectTask(this.state.tasks[i].id)
                return
            }
        }

        // Wrap around to end
        for (let i = this.state.tasks.length - 1; i > currentIndex; i--) {
            if (!this.state.tasks[i].completed) {
                this.selectTask(this.state.tasks[i].id)
                return
            }
        }
    }

    /**
     * Edit selected task
     * @private
     */
    private _editSelectedTask (): void {
        if (!this.selectedTaskId) return

        const task = this.getSelectedTask()
        if (task) {
            this.app.openTaskModal?.(task)
        }
    }

    /**
     * Toggle selected task completion
     * @private
     */
    private _toggleSelectedTaskComplete (): void {
        if (!this.selectedTaskId) return

        this.app.toggleTaskComplete?.(this.selectedTaskId)
    }

    /**
     * Duplicate selected task
     * @private
     */
    private _duplicateSelectedTask (): void {
        if (!this.selectedTaskId) return

        this.app.duplicateTask?.(this.selectedTaskId)
    }

    /**
     * Delete selected task
     * @private
     */
    private _deleteSelectedTask (): void {
        if (!this.selectedTaskId) return

        if (confirm('Delete selected task?')) {
            this.app.deleteTask?.(this.selectedTaskId)
            this.selectedTaskId = null
        }
    }

    /**
     * Deselect current task
     * @private
     */
    private _deselectTask (): void {
        if (!this.selectedTaskId) return

        const element = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`)
        if (element) {
            element.classList.remove('selected')
        }
        this.selectedTaskId = null
    }

    /**
     * Toggle focus mode for selected task
     * @private
     */
    private _toggleFocusMode (): void {
        if (!this.selectedTaskId) return

        this.app.enterFocusMode?.(this.selectedTaskId)
    }

    /**
     * Focus quick add input
     * @private
     */
    private _focusQuickAdd (): void {
        const quickAddInput = document.getElementById('quick-add-input')
        if (quickAddInput) {
            quickAddInput.focus()
        }
    }

    /**
     * Switch to view based on number key
     * @private
     * @param key - Number key (1-5)
     */
    private _switchToView (key: string): void {
        const viewMap: Record<string, string> = {
            1: 'inbox',
            2: 'next',
            3: 'waiting',
            4: 'someday',
            5: 'projects'
        }

        const view = viewMap[key]
        if (view) {
            this.app.switchView?.(view)
        }
    }

    /**
     * Show keyboard shortcuts help
     * @private
     */
    private _showHelp (): void {
        this.app.showInfo?.('Keyboard shortcuts: Press ? for help')
    }

    // Public methods for testing compatibility
    deselectTask (): void {
        this._deselectTask()
    }

    getSelectedTaskId (): string | null {
        return this.selectedTaskId
    }

    hasSelection (): boolean {
        return !!this.selectedTaskId
    }

    selectFirstTask (): void {
        const taskElements = document.querySelectorAll('[data-task-id]')
        if (taskElements.length > 0) {
            const firstElement = taskElements[0] as HTMLElement
            const firstTaskId =
                firstElement.dataset?.taskId || firstElement.getAttribute?.('data-task-id')
            if (firstTaskId) {
                this.selectTask(firstTaskId)
            }
        }
    }

    selectLastTask (): void {
        const taskElements = document.querySelectorAll('[data-task-id]')
        if (taskElements.length > 0) {
            const lastElement = taskElements[taskElements.length - 1] as HTMLElement
            const lastTaskId =
                lastElement.dataset?.taskId || lastElement.getAttribute?.('data-task-id')
            if (lastTaskId) {
                this.selectTask(lastTaskId)
            }
        }
    }

    selectNextTask (): void {
        this._selectNextTask()
    }

    selectPreviousTask (): void {
        this._selectPreviousTask()
    }

    clearSelection (): void {
        this._deselectTask()
    }

    showShortcutsHelp (): void {
        this._showHelp()
    }
}
