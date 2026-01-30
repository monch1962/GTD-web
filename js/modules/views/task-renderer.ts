/**
 * Task rendering module with virtual scrolling support
 * Handles task list rendering and individual task element creation
 */

import { VirtualScrollConfig } from '../../constants.ts'
import { escapeHtml } from '../../dom-utils.ts'
import { VirtualScrollManager } from '../ui/virtual-scroll.ts'
import { createLogger } from '../utils/logger.ts'
import { Task } from '../../models.ts'

// Define types for the app interface
interface AppDependencies {
    saveState?: (action: string) => void
    showNotification?: (message: string, type: string) => void
    openTaskModal?: (task: Task | null, defaultProjectId?: string | null, defaultData?: any) => void
    deleteTask?: (taskId: string) => Promise<void>
    toggleTaskStar?: (taskId: string) => Promise<void>
    toggleTaskComplete?: (taskId: string) => Promise<void>
    startTimer?: (taskId: string) => Promise<void>
    stopTimer?: (taskId: string) => Promise<void>
    updateBulkSelectButtonVisibility?: () => void
    renderView?: () => void
    updateCounts?: () => void
    saveTasks?: () => Promise<void>
    [key: string]: any // Allow for additional app methods
}

interface AppState {
    tasks: Task[]
    projects: any[]
    selectedTaskIds: Set<string>
    [key: string]: any // Allow for additional state properties
}

export class TaskRenderer {
    private state: AppState
    private app: AppDependencies
    private virtualScroll: VirtualScrollManager | null
    private currentContainer: HTMLElement | null
    private logger: ReturnType<typeof createLogger>

    constructor(state: AppState, app: AppDependencies) {
        this.state = state
        this.app = app // Reference to main app for callbacks
        this.virtualScroll = null
        this.currentContainer = null
        this.logger = createLogger('TaskRenderer')
    }

    /**
     * Render filtered tasks to container
     * @param container - Container element
     * @param filterFn - Optional filter function
     */
    renderTasks(container: HTMLElement, filterFn: ((task: Task) => boolean) | null = null): void {
        this.currentContainer = container

        // Get filtered tasks
        let filteredTasks = this._getFilteredTasks(filterFn)

        // Clear container
        container.innerHTML = ''

        if (filteredTasks.length === 0) {
            container.innerHTML = this._renderEmptyState('No tasks found')
            return
        }

        // Use virtual scrolling for 50+ tasks, regular rendering for smaller lists
        if (filteredTasks.length >= VirtualScrollConfig.ACTIVATION_THRESHOLD) {
            this._renderWithVirtualScroll(container, filteredTasks)
        } else {
            this._renderRegular(container, filteredTasks)
        }
    }

    /**
     * Render tasks using virtual scrolling (for large lists)
     * @private
     * @param container - Container element
     * @param tasks - Tasks to render
     */
    private _renderWithVirtualScroll(container: HTMLElement, tasks: Task[]): void {
        // Log activation for performance monitoring
        this.logger.debug(
            `Virtual scrolling ACTIVATED: ${tasks.length} tasks (threshold: ${VirtualScrollConfig.ACTIVATION_THRESHOLD})`
        )

        // Initialize or update virtual scroll
        if (!this.virtualScroll || this.virtualScroll.container !== container) {
            this._initializeVirtualScroll(container)
        }

        // Set items with render function
        this.virtualScroll!.setItems(tasks, (task: Task, index: number) => {
            const element = this.createTaskElement(task, index)
            this._attachTaskListeners(element, task)
            return element
        })
    }

    /**
     * Render tasks using regular DOM rendering (for small lists)
     * @private
     * @param container - Container element
     * @param tasks - Tasks to render
     */
    private _renderRegular(container: HTMLElement, tasks: Task[]): void {
        // Clean up virtual scroll if exists
        if (this.virtualScroll) {
            this.logger.debug(
                `Virtual scrolling DEACTIVATED: ${tasks.length} tasks (< ${VirtualScrollConfig.ACTIVATION_THRESHOLD} threshold)`
            )
            this.virtualScroll.destroy()
            this.virtualScroll = null
        }

        // Render all tasks directly (faster for small lists)
        const fragment = document.createDocumentFragment()
        tasks.forEach((task, index) => {
            const element = this.createTaskElement(task, index)
            this._attachTaskListeners(element, task)
            fragment.appendChild(element)
        })
        container.appendChild(fragment)
    }

    /**
     * Get filtered tasks based on current state
     * @private
     * @param additionalFilter - Optional additional filter
     * @returns Filtered tasks
     */
    private _getFilteredTasks(additionalFilter: ((task: Task) => boolean) | null = null): Task[] {
        let filteredTasks = this.state.tasks.filter((task) => !task.completed)

        // Apply additional filter if provided
        if (additionalFilter) {
            filteredTasks = filteredTasks.filter(additionalFilter)
        }

        return filteredTasks
    }

    /**
     * Initialize virtual scroll manager
     * @private
     * @param container - Container element
     */
    private _initializeVirtualScroll(container: HTMLElement): void {
        if (this.virtualScroll) {
            this.virtualScroll.destroy()
        }

        this.virtualScroll = new VirtualScrollManager(container, {
            itemHeight: VirtualScrollConfig.ITEM_HEIGHT,
            bufferSize: VirtualScrollConfig.BUFFER_ITEMS,
            scrollDebounce: VirtualScrollConfig.DEBOUNCE_DELAY
        })
    }

    /**
     * Create task element
     * @param task - Task object
     * @param index - Task index in list
     * @returns Task element
     */
    createTaskElement(task: Task, index: number): HTMLElement {
        const li = document.createElement('li')
        li.className = 'task-item'
        li.dataset.taskId = task.id
        li.dataset.index = index.toString()

        // Add bulk selection class if selected
        if (this.state.selectedTaskIds && this.state.selectedTaskIds.has(task.id)) {
            li.classList.add('selected')
        }

        // Build task HTML
        li.innerHTML = this._buildTaskHTML(task)

        return li
    }

    /**
     * Build task HTML content
     * @private
     * @param task - Task object
     * @returns HTML string
     */
    private _buildTaskHTML(task: Task): string {
        const isOverdue = task.isOverdue()
        const isDueToday = task.isDueToday()
        const isStarred = task.starred
        const hasTimer = this.app.activeTimers && this.app.activeTimers.has(task.id)

        // Build context tags
        const contextTags =
            task.contexts && task.contexts.length > 0
                ? task.contexts
                      .map((ctx) => `<span class="task-context">${escapeHtml(ctx)}</span>`)
                      .join('')
                : ''

        // Build due date indicator
        let dueDateIndicator = ''
        if (task.dueDate) {
            const dueDateClass = isOverdue ? 'overdue' : isDueToday ? 'due-today' : 'due-future'
            const dueDateText = isOverdue ? 'Overdue' : isDueToday ? 'Due today' : 'Due'
            dueDateIndicator = `<span class="task-due-date ${dueDateClass}">${dueDateText}: ${task.dueDate}</span>`
        }

        // Build energy indicator
        const energyIndicator = task.energy
            ? `<span class="task-energy energy-${task.energy}">${task.energy}</span>`
            : ''

        // Build time estimate
        const timeEstimate = task.time > 0 ? `<span class="task-time">${task.time}m</span>` : ''

        // Build timer indicator
        const timerIndicator = hasTimer
            ? `<span class="task-timer active"><i class="fas fa-clock"></i></span>`
            : ''

        // Build project indicator
        let projectIndicator = ''
        if (task.projectId) {
            const project = this.state.projects.find((p) => p.id === task.projectId)
            if (project) {
                projectIndicator = `<span class="task-project">${escapeHtml(project.title)}</span>`
            }
        }

        // Build waiting indicator
        const waitingIndicator =
            task.status === 'waiting' && task.waitingForTaskIds.length > 0
                ? `<span class="task-waiting"><i class="fas fa-clock"></i> Waiting</span>`
                : ''

        // Build recurrence indicator
        const recurrenceIndicator = task.isRecurring()
            ? `<span class="task-recurrence"><i class="fas fa-redo"></i></span>`
            : ''

        return `
            <div class="task-checkbox">
                <input type="checkbox" class="task-complete-checkbox" ${task.completed ? 'checked' : ''}>
            </div>
            <div class="task-content">
                <div class="task-title-row">
                    <div class="task-title">
                        ${escapeHtml(task.title)}
                        ${isStarred ? '<span class="task-star starred"><i class="fas fa-star"></i></span>' : ''}
                    </div>
                    <div class="task-actions">
                        ${timerIndicator}
                        ${recurrenceIndicator}
                        ${waitingIndicator}
                        ${energyIndicator}
                        ${timeEstimate}
                        ${dueDateIndicator}
                        ${projectIndicator}
                        <button class="task-action-btn more" title="More actions">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                ${contextTags ? `<div class="task-contexts">${contextTags}</div>` : ''}
                ${
                    task.subtasks && task.subtasks.length > 0
                        ? `<div class="task-subtasks">
                        ${task.subtasks
                            .map(
                                (sub) => `
                            <div class="task-subtask ${sub.completed ? 'completed' : ''}">
                                <input type="checkbox" ${sub.completed ? 'checked' : ''}>
                                <span>${escapeHtml(sub.title)}</span>
                            </div>
                        `
                            )
                            .join('')}
                       </div>`
                        : ''
                }
            </div>
        `
    }

    /**
     * Attach event listeners to task element
     * @private
     * @param element - Task element
     * @param task - Task object
     */
    private _attachTaskListeners(element: HTMLElement, task: Task): void {
        // Complete checkbox
        const checkbox = element.querySelector('.task-complete-checkbox')
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation()
                this.app.toggleTaskComplete?.(task.id)
            })
        }

        // Star button
        const starBtn = element.querySelector('.task-star')
        if (starBtn) {
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                this.app.toggleTaskStar?.(task.id)
            })
        }

        // More actions button
        const moreBtn = element.querySelector('.task-action-btn.more')
        if (moreBtn) {
            moreBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                this._showTaskContextMenu(e as MouseEvent, task, element)
            })
        }

        // Timer button
        const timerBtn = element.querySelector('.task-timer')
        if (timerBtn) {
            timerBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                if (this.app.activeTimers && this.app.activeTimers.has(task.id)) {
                    this.app.stopTimer?.(task.id)
                } else {
                    this.app.startTimer?.(task.id)
                }
            })
        }

        // Task click (for selection and editing)
        element.addEventListener('click', (e) => {
            // Don't trigger if clicking on interactive elements
            if (
                (e.target as HTMLElement).closest('.task-complete-checkbox') ||
                (e.target as HTMLElement).closest('.task-star') ||
                (e.target as HTMLElement).closest('.task-action-btn') ||
                (e.target as HTMLElement).closest('.task-timer')
            ) {
                return
            }

            // Handle bulk selection mode
            if (this.state.bulkSelectionMode) {
                this._toggleTaskSelection(task.id)
            } else {
                // Regular click - open task for editing
                this.app.openTaskModal?.(task)
            }
        })

        // Subtask checkboxes
        const subtaskCheckboxes = element.querySelectorAll('.task-subtask input[type="checkbox"]')
        subtaskCheckboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation()
                this._toggleSubtask(task, index)
            })
        })
    }

    /**
     * Show task context menu
     * @private
     * @param event - Mouse event
     * @param task - Task object
     * @param element - Task element
     */
    private _showTaskContextMenu(event: MouseEvent, task: Task, element: HTMLElement): void {
        // Save state for undo
        this.app.saveState?.('Task context menu')

        // Delegate to app's context menu manager if available
        if (this.app.showContextMenu) {
            this.app.showContextMenu(event, task, element)
        } else {
            // Fallback: open task modal
            this.app.openTaskModal?.(task)
        }
    }

    /**
     * Toggle task selection for bulk operations
     * @private
     * @param taskId - Task ID
     */
    private _toggleTaskSelection(taskId: string): void {
        if (!this.state.selectedTaskIds) {
            this.state.selectedTaskIds = new Set()
        }

        if (this.state.selectedTaskIds.has(taskId)) {
            this.state.selectedTaskIds.delete(taskId)
        } else {
            this.state.selectedTaskIds.add(taskId)
        }

        // Update UI
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`)
        if (taskElement) {
            if (this.state.selectedTaskIds.has(taskId)) {
                taskElement.classList.add('selected')
            } else {
                taskElement.classList.remove('selected')
            }
        }

        // Update bulk select button visibility
        this.app.updateBulkSelectButtonVisibility?.()
    }

    /**
     * Toggle subtask completion
     * @private
     * @param task - Parent task
     * @param subtaskIndex - Subtask index
     */
    private _toggleSubtask(task: Task, subtaskIndex: number): void {
        if (!task.subtasks || subtaskIndex >= task.subtasks.length) {
            return
        }

        // Save state for undo
        this.app.saveState?.('Toggle subtask')

        // Toggle subtask completion
        task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed
        task.updatedAt = new Date().toISOString()

        // Save changes
        this.app.saveTasks?.()
        this.app.renderView?.()
    }

    /**
     * Render empty state
     * @private
     * @param message - Empty state message
     * @returns HTML string
     */
    private _renderEmptyState(message: string): string {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="empty-state-message">${escapeHtml(message)}</div>
                <div class="empty-state-hint">Try adding a new task or adjusting your filters</div>
            </div>
        `
    }

    /**
     * Scroll to specific task
     * @param taskId - Task ID to scroll to
     */
    scrollToTask(taskId: string): void {
        if (!this.currentContainer) return

        const tasks = this._getFilteredTasks()
        const index = tasks.findIndex((t) => t.id === taskId)

        if (index === -1) return

        if (this.virtualScroll) {
            this.virtualScroll.scrollToItem(index)
        } else {
            // Manual scrolling for regular rendering
            const taskElement = this.currentContainer.querySelector(`[data-task-id="${taskId}"]`)
            if (taskElement) {
                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
    }

    /**
     * Refresh rendering
     */
    refresh(): void {
        if (this.currentContainer) {
            this.renderTasks(this.currentContainer)
        }
    }

    /**
     * Destroy virtual scroll manager
     */
    destroy(): void {
        if (this.virtualScroll) {
            this.virtualScroll.destroy()
            this.virtualScroll = null
        }
        this.currentContainer = null
    }
}
