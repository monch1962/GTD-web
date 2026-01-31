/**
 * HTML Template Helpers
 * Reusable HTML template generators to reduce code duplication
 */

import { escapeHtml } from './dom-utils'
import { PriorityColors, PriorityLabels } from './constants'
import { Task } from './models'

interface TaskTemplateOptions {
    isBulkSelectMode?: boolean
    isBulkSelected?: boolean
    showPriority?: boolean
    showCountdown?: boolean
}

interface ProjectTemplateOptions {
    showTaskCount?: boolean
    showStatus?: boolean
}

/**
 * Task HTML Templates
 */
export class TaskTemplates {
    /**
     * Creates a task item HTML string
     * @param task - Task object
     * @param options - Rendering options
     * @returns HTML string
     */
    static createTaskItem(task: Task, options: TaskTemplateOptions = {}): string {
        const {
            isBulkSelectMode = false,
            isBulkSelected = false,
            showPriority = true,
            showCountdown = true
        } = options

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-drag-handle"><i class="fas fa-grip-vertical"></i></div>
                ${
                    isBulkSelectMode
                        ? `<input type="checkbox" class="bulk-select-checkbox" ${isBulkSelected ? 'checked' : ''}>`
                        : `<input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>`
                }
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        ${TaskTemplates._createTaskMeta(task, showPriority, showCountdown)}
                    </div>
                </div>
                <div class="task-actions">
                    ${TaskTemplates._createTaskActions(task)}
                </div>
            </div>
        `
    }

    /**
     * Creates task metadata HTML
     * @private
     */
    private static _createTaskMeta(
        task: Task,
        showPriority: boolean,
        showCountdown: boolean
    ): string {
        const metaItems: string[] = []

        // Priority indicator
        if (showPriority && (task as any).priority) {
            const priority = (task as any).priority
            const color =
                PriorityColors[priority as keyof typeof PriorityColors] || PriorityColors.Medium
            const label = PriorityLabels[priority as keyof typeof PriorityLabels] || priority
            metaItems.push(`<span class="task-priority" style="color: ${color}">${label}</span>`)
        }

        // Context tags
        if (task.contexts && task.contexts.length > 0) {
            const contextTags = task.contexts
                .map((ctx) => `<span class="task-context">${escapeHtml(ctx)}</span>`)
                .join('')
            metaItems.push(`<span class="task-contexts">${contextTags}</span>`)
        }

        // Due date
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let dueClass = 'due-future'
            let dueText = 'Due'

            if (dueDate < today && !task.completed) {
                dueClass = 'overdue'
                dueText = 'Overdue'
            } else if (dueDate.getTime() === today.getTime()) {
                dueClass = 'due-today'
                dueText = 'Today'
            }

            metaItems.push(`<span class="task-due ${dueClass}">${dueText}: ${task.dueDate}</span>`)
        }

        // Countdown timer (if applicable)
        if (showCountdown && task.timeSpent && task.time) {
            const timeLeft = task.time - task.timeSpent
            if (timeLeft > 0) {
                metaItems.push(`<span class="task-countdown">${timeLeft}m left</span>`)
            }
        }

        return metaItems.join('')
    }

    /**
     * Creates task action buttons HTML
     * @private
     */
    private static _createTaskActions(task: Task): string {
        return `
            <button class="task-action edit" title="Edit task">
                <i class="fas fa-edit"></i>
            </button>
            <button class="task-action star ${task.starred ? 'starred' : ''}" title="${task.starred ? 'Unstar' : 'Star'} task">
                <i class="fas ${task.starred ? 'fa-star' : 'fa-star'}"></i>
            </button>
            <button class="task-action delete" title="Delete task">
                <i class="fas fa-trash"></i>
            </button>
        `
    }

    /**
     * Creates an empty state HTML string
     * @param message - Message to display
     * @param icon - Icon class (default: fa-inbox)
     * @returns HTML string
     */
    static createEmptyState(message: string, icon: string = 'fa-inbox'): string {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas ${icon} fa-3x"></i>
                </div>
                <div class="empty-state-message">${escapeHtml(message)}</div>
            </div>
        `
    }

    /**
     * Creates a loading spinner HTML string
     * @param message - Loading message
     * @returns HTML string
     */
    static createLoadingSpinner(message: string = 'Loading...'): string {
        return `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-message">${escapeHtml(message)}</div>
            </div>
        `
    }
}

/**
 * Project HTML Templates
 */
export class ProjectTemplates {
    /**
     * Creates a project card HTML string
     * @param project - Project object
     * @param taskCount - Number of tasks in project
     * @param options - Rendering options
     * @returns HTML string
     */
    static createProjectCard(
        project: any,
        taskCount: number,
        options: ProjectTemplateOptions = {}
    ): string {
        const { showTaskCount = true, showStatus = true } = options

        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <h3 class="project-title">${escapeHtml(project.title)}</h3>
                    ${showStatus ? `<span class="project-status">${project.status}</span>` : ''}
                </div>
                <div class="project-body">
                    ${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}
                    <div class="project-meta">
                        ${showTaskCount ? `<span class="project-task-count"><i class="fas fa-tasks"></i> ${taskCount} tasks</span>` : ''}
                        ${
                            project.contexts && project.contexts.length > 0
                                ? `<span class="project-contexts">${project.contexts
                                      .map(
                                          (ctx: string) =>
                                              `<span class="context-tag">${escapeHtml(ctx)}</span>`
                                      )
                                      .join('')}</span>`
                                : ''
                        }
                    </div>
                </div>
                <div class="project-actions">
                    <button class="project-action view" title="View project">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="project-action edit" title="Edit project">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="project-action delete" title="Delete project">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `
    }
}

/**
 * Modal HTML Templates
 */
export class ModalTemplates {
    /**
     * Creates a confirmation modal HTML string
     * @param title - Modal title
     * @param message - Confirmation message
     * @param confirmText - Confirm button text
     * @param cancelText - Cancel button text
     * @returns HTML string
     */
    static createConfirmationModal(
        title: string,
        message: string,
        confirmText: string = 'Confirm',
        cancelText: string = 'Cancel'
    ): string {
        return `
            <div class="modal-overlay">
                <div class="modal confirmation-modal">
                    <div class="modal-header">
                        <h2>${escapeHtml(title)}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${escapeHtml(message)}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary cancel-btn">${escapeHtml(cancelText)}</button>
                        <button class="btn btn-primary confirm-btn">${escapeHtml(confirmText)}</button>
                    </div>
                </div>
            </div>
        `
    }

    /**
     * Creates an alert modal HTML string
     * @param title - Modal title
     * @param message - Alert message
     * @param type - Alert type (success, error, warning, info)
     * @returns HTML string
     */
    static createAlertModal(title: string, message: string, type: string = 'info'): string {
        const iconMap: Record<string, string> = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        }

        const icon = iconMap[type] || 'fa-info-circle'

        return `
            <div class="modal-overlay">
                <div class="modal alert-modal alert-${type}">
                    <div class="modal-header">
                        <h2><i class="fas ${icon}"></i> ${escapeHtml(title)}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${escapeHtml(message)}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary close-btn">OK</button>
                    </div>
                </div>
            </div>
        `
    }
}
