'use strict'
/**
 * HTML Template Helpers
 * Reusable HTML template generators to reduce code duplication
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.ModalTemplates = exports.ProjectTemplates = exports.TaskTemplates = void 0
const dom_utils_1 = require('./dom-utils')
const constants_1 = require('./constants')
/**
 * Task HTML Templates
 */
class TaskTemplates {
    /**
     * Creates a task item HTML string
     * @param task - Task object
     * @param options - Rendering options
     * @returns HTML string
     */
    static createTaskItem(task, options = {}) {
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
                    <div class="task-title">${(0, dom_utils_1.escapeHtml)(task.title)}</div>
                    ${task.description ? `<div class="task-description">${(0, dom_utils_1.escapeHtml)(task.description)}</div>` : ''}
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
    static _createTaskMeta(task, showPriority, showCountdown) {
        const metaItems = []
        // Priority indicator
        if (showPriority && task.priority) {
            const priority = task.priority
            const color = constants_1.PriorityColors[priority] || constants_1.PriorityColors.Medium
            const label = constants_1.PriorityLabels[priority] || priority
            metaItems.push(`<span class="task-priority" style="color: ${color}">${label}</span>`)
        }
        // Context tags
        if (task.contexts && task.contexts.length > 0) {
            const contextTags = task.contexts
                .map(
                    (ctx) => `<span class="task-context">${(0, dom_utils_1.escapeHtml)(ctx)}</span>`
                )
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
    static _createTaskActions(task) {
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
    static createEmptyState(message, icon = 'fa-inbox') {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas ${icon} fa-3x"></i>
                </div>
                <div class="empty-state-message">${(0, dom_utils_1.escapeHtml)(message)}</div>
            </div>
        `
    }
    /**
     * Creates a loading spinner HTML string
     * @param message - Loading message
     * @returns HTML string
     */
    static createLoadingSpinner(message = 'Loading...') {
        return `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-message">${(0, dom_utils_1.escapeHtml)(message)}</div>
            </div>
        `
    }
}
exports.TaskTemplates = TaskTemplates
/**
 * Project HTML Templates
 */
class ProjectTemplates {
    /**
     * Creates a project card HTML string
     * @param project - Project object
     * @param taskCount - Number of tasks in project
     * @param options - Rendering options
     * @returns HTML string
     */
    static createProjectCard(project, taskCount, options = {}) {
        const { showTaskCount = true, showStatus = true } = options
        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <h3 class="project-title">${(0, dom_utils_1.escapeHtml)(project.title)}</h3>
                    ${showStatus ? `<span class="project-status">${project.status}</span>` : ''}
                </div>
                <div class="project-body">
                    ${project.description ? `<p class="project-description">${(0, dom_utils_1.escapeHtml)(project.description)}</p>` : ''}
                    <div class="project-meta">
                        ${showTaskCount ? `<span class="project-task-count"><i class="fas fa-tasks"></i> ${taskCount} tasks</span>` : ''}
                        ${
                            project.contexts && project.contexts.length > 0
                                ? `<span class="project-contexts">${project.contexts
                                      .map(
                                          (ctx) =>
                                              `<span class="context-tag">${(0, dom_utils_1.escapeHtml)(ctx)}</span>`
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
exports.ProjectTemplates = ProjectTemplates
/**
 * Modal HTML Templates
 */
class ModalTemplates {
    /**
     * Creates a confirmation modal HTML string
     * @param title - Modal title
     * @param message - Confirmation message
     * @param confirmText - Confirm button text
     * @param cancelText - Cancel button text
     * @returns HTML string
     */
    static createConfirmationModal(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return `
            <div class="modal-overlay">
                <div class="modal confirmation-modal">
                    <div class="modal-header">
                        <h2>${(0, dom_utils_1.escapeHtml)(title)}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${(0, dom_utils_1.escapeHtml)(message)}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary cancel-btn">${(0, dom_utils_1.escapeHtml)(cancelText)}</button>
                        <button class="btn btn-primary confirm-btn">${(0, dom_utils_1.escapeHtml)(confirmText)}</button>
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
    static createAlertModal(title, message, type = 'info') {
        const iconMap = {
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
                        <h2><i class="fas ${icon}"></i> ${(0, dom_utils_1.escapeHtml)(title)}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${(0, dom_utils_1.escapeHtml)(message)}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary close-btn">OK</button>
                    </div>
                </div>
            </div>
        `
    }
}
exports.ModalTemplates = ModalTemplates
//# sourceMappingURL=template-helpers.js.map
