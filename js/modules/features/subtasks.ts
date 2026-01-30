/**
 * ============================================================================
 * Subtasks Manager - TypeScript Version
 * ============================================================================
 *
 * Manages the subtasks feature for breaking down tasks into smaller steps.
 *
 * This manager handles:
 * - Rendering subtasks in the task modal
 * - Adding new subtasks
 * - Removing subtasks
 * - Toggling subtask completion status
 * - Extracting subtasks from the modal UI
 */

import { escapeHtml } from '../../dom-utils'

/**
 * App interface for type safety
 */
interface App {
    // App methods will be called via inline event handlers
}

/**
 * State interface for subtasks
 */
interface State {
    // State properties will be defined as needed
}

/**
 * Subtask interface
 */
interface Subtask {
    title: string
    completed: boolean
}

export class SubtasksManager {
    private state: State
    private app: App

    constructor(state: State, app: App) {
        this.state = state
        this.app = app
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Render subtasks in the task modal
     * @param {Array} subtasks - Array of subtask objects
     */
    renderSubtasksInModal(subtasks: Subtask[]): void {
        const container = document.getElementById('subtasks-container')
        if (!container) return

        if (!subtasks || subtasks.length === 0) {
            container.innerHTML =
                '<p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: var(--spacing-sm);">No subtasks yet. Add subtasks to break down this task into smaller steps.</p>'
            return
        }

        container.innerHTML = subtasks
            .map(
                (subtask, index) => `
            <div data-subtask-index="${index}" style="display: flex; align-items: center; gap: var(--spacing-sm); padding: 6px 0; border-bottom: 1px solid var(--bg-secondary);">
                <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="app.toggleSubtaskCompletion(${index})" style="margin-right: 4px;">
                <span style="flex: 1; ${subtask.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(subtask.title)}</span>
                <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 2px 6px;" onclick="app.removeSubtask(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `
            )
            .join('')
    }

    /**
     * Add a new subtask from the input field
     */
    addSubtask(): void {
        const input = document.getElementById('new-subtask-input') as HTMLInputElement
        const title = input.value.trim()

        if (!title) return

        const currentSubtasks = this.getSubtasksFromModal()

        currentSubtasks.push({
            title: title,
            completed: false
        })

        this.renderSubtasksInModal(currentSubtasks)
        input.value = ''
    }

    /**
     * Remove a subtask by index
     * @param {number} index - Index of subtask to remove
     */
    removeSubtask(index: number): void {
        const currentSubtasks = this.getSubtasksFromModal()
        currentSubtasks.splice(index, 1)
        this.renderSubtasksInModal(currentSubtasks)
    }

    /**
     * Toggle the completion status of a subtask
     * @param {number} index - Index of subtask to toggle
     */
    toggleSubtaskCompletion(index: number): void {
        const currentSubtasks = this.getSubtasksFromModal()
        if (currentSubtasks[index]) {
            currentSubtasks[index].completed = !currentSubtasks[index].completed
            this.renderSubtasksInModal(currentSubtasks)
        }
    }

    /**
     * Extract subtasks from the modal UI
     * @returns {Array} Array of subtask objects
     */
    getSubtasksFromModal(): Subtask[] {
        const container = document.getElementById('subtasks-container')
        if (!container) return []

        const subtaskElements =
            container.querySelectorAll<HTMLDivElement>('div[data-subtask-index]')
        const subtasks: Subtask[] = []

        subtaskElements.forEach((el) => {
            const index = parseInt(el.dataset.subtaskIndex || '0', 10)
            const checkbox = el.querySelector<HTMLInputElement>('input[type="checkbox"]')
            const span = el.querySelector<HTMLSpanElement>('span')
            if (span && checkbox) {
                subtasks[index] = {
                    title: span.textContent || '',
                    completed: checkbox.checked
                }
            }
        })

        return subtasks
    }
}
