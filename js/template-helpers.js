/**
 * HTML Template Helpers
 * Reusable HTML template generators to reduce code duplication
 */

import { PriorityThresholds, PriorityColors, PriorityLabels } from './constants.ts'
import { escapeHtml } from './dom-utils.js'

/**
 * Task HTML Templates
 */

export class TaskTemplates {
    /**
     * Creates a task item HTML string
     * @param {Object} task - Task object
     * @param {Object} options - Rendering options
     * @returns {string} HTML string
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
    static _createTaskMeta(task, showPriority, _showCountdown) {
        const parts = []

        // Contexts
        if (task.contexts && task.contexts.length > 0) {
            parts.push(
                task.contexts
                    .map((ctx) => `<span class="task-context">${escapeHtml(ctx)}</span>`)
                    .join('')
            )
        }

        // Energy
        if (task.energy) {
            parts.push(
                `<span class="task-energy"><i class="fas fa-bolt"></i> ${task.energy}</span>`
            )
        }

        // Time estimate
        if (task.time) {
            parts.push(`<span class="task-time"><i class="fas fa-clock"></i> ${task.time}m</span>`)
        }

        // Time spent
        if (task.timeSpent) {
            parts.push(
                `<span class="task-time-spent" title="Time spent"><i class="fas fa-stopwatch"></i> ${task.timeSpent}m</span>`
            )
        }

        // Priority score
        if (showPriority && !task.completed) {
            const score = task.priorityScore || 50
            const color = TaskTemplates._getPriorityColor(score)
            const label = TaskTemplates._getPriorityLabel(score)
            parts.push(
                `<span class="priority-score" style="background: ${color};" title="Priority: ${label}">${score}</span>`
            )
        }

        // Add other metadata (due dates, project, etc.)
        // ... (omitted for brevity)

        return parts.join('')
    }

    /**
     * Creates task action buttons HTML
     * @private
     */
    static _createTaskActions(task) {
        return `
            <button class="task-action-btn timer" title="Start timer">
                <i class="fas fa-play"></i>
            </button>
            <button class="task-action-btn star" title="Star task" ${task.starred ? 'style="color: #ffd700;"' : ''}>
                <i class="fas fa-star"></i>
            </button>
            <button class="task-action-btn notes" title="Notes" ${task.notes ? 'style="color: var(--info-color);"' : ''}>
                <i class="fas fa-sticky-note"></i>
            </button>
            <button class="task-action-btn duplicate" title="Duplicate">
                <i class="fas fa-copy"></i>
            </button>
            <button class="task-action-btn edit" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="task-action-btn delete" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `
    }

    /**
     * Gets priority color based on score
     * @private
     */
    static _getPriorityColor(score) {
        if (score >= PriorityThresholds.URGENT_MIN) return PriorityColors.URGENT
        if (score >= PriorityThresholds.HIGH_MIN) return PriorityColors.HIGH
        if (score >= PriorityThresholds.MEDIUM_MIN) return PriorityColors.MEDIUM
        if (score >= PriorityThresholds.LOW_MIN) return PriorityColors.LOW
        return PriorityColors.VERY_LOW
    }

    /**
     * Gets priority label based on score
     * @private
     */
    static _getPriorityLabel(score) {
        if (score >= PriorityThresholds.URGENT_MIN) return PriorityLabels.URGENT
        if (score >= PriorityThresholds.HIGH_MIN) return PriorityLabels.HIGH
        if (score >= PriorityThresholds.MEDIUM_MIN) return PriorityLabels.MEDIUM
        if (score >= PriorityThresholds.LOW_MIN) return PriorityLabels.LOW
        return PriorityLabels.VERY_LOW
    }
}

/**
 * Project HTML Templates
 */

export class ProjectTemplates {
    /**
     * Creates a project card HTML string
     * @param {Object} project - Project object
     * @param {Object} stats - Project statistics
     * @returns {string} HTML string
     */
    static createProjectCard(project, stats) {
        const { total, completed, percent, overdue, health } = stats

        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <h3>${escapeHtml(project.title)}</h3>
                    <div class="project-health">${health}</div>
                </div>
                ${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}
                <div class="project-stats">
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percent}%"></div>
                        </div>
                        <span class="progress-text">${completed}/${total} (${percent}%)</span>
                    </div>
                    ${overdue > 0 ? `<div class="project-overdue">${overdue} overdue</div>` : ''}
                </div>
                <div class="project-actions">
                    <button class="btn btn-secondary" onclick="app.viewProjectTasks('${project.id}')">
                        <i class="fas fa-list"></i> View Tasks
                    </button>
                    <button class="btn btn-secondary" onclick="app.editProject('${project.id}')">
                        <i class="fas fa-edit"></i> Edit
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
     * Creates a modal HTML structure
     * @param {string} id - Modal ID
     * @param {string} title - Modal title
     * @param {string} content - Modal content HTML
     * @param {string} size - Modal size class (optional)
     * @returns {string} HTML string
     */
    static createModal(id, title, content, size = '') {
        return `
            <div id="${id}" class="modal">
                <div class="modal-content ${size}">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="close-button" id="close-${id}">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `
    }

    /**
     * Creates a form field HTML
     * @param {Object} config - Field configuration
     * @returns {string} HTML string
     */
    static createFormField(config) {
        const {
            type = 'text',
            id,
            label,
            value = '',
            placeholder = '',
            required = false,
            options = []
        } = config

        if (type === 'select') {
            return `
                <div class="form-group">
                    <label for="${id}">${label}</label>
                    <select id="${id}" name="${id}" ${required ? 'required' : ''}>
                        ${options.map((opt) => `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
            `
        }

        if (type === 'textarea') {
            return `
                <div class="form-group">
                    <label for="${id}">${label}</label>
                    <textarea id="${id}" name="${id}" placeholder="${placeholder}" ${required ? 'required' : ''}>${value}</textarea>
                </div>
            `
        }

        return `
            <div class="form-group">
                <label for="${id}">${label}</label>
                <input type="${type}" id="${id}" name="${id}" value="${value}" placeholder="${placeholder}" ${required ? 'required' : ''}>
            </div>
        `
    }
}

/**
 * Statistics HTML Templates
 */

export class StatisticsTemplates {
    /**
     * Creates a stat card HTML
     * @param {Object} config - Stat configuration
     * @returns {string} HTML string
     */
    static createStatCard(config) {
        const { value, label, icon, color, trend = null } = config

        return `
            <div class="stat-card" style="border-left: 4px solid ${color}">
                <div class="stat-value" style="color: ${color}">
                    ${icon ? `<i class="${icon}"></i>` : ''}
                    ${value}
                </div>
                <div class="stat-label">${label}</div>
                ${trend ? `<div class="stat-trend">${trend}</div>` : ''}
            </div>
        `
    }

    /**
     * Creates a progress bar HTML
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} color - Bar color
     * @param {boolean} showLabel - Whether to show percentage label
     * @returns {string} HTML string
     */
    static createProgressBar(percent, color = 'var(--primary-color)', showLabel = true) {
        return `
            <div class="progress-bar-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%; background: ${color}"></div>
                </div>
                ${showLabel ? `<span class="progress-label">${percent}%</span>` : ''}
            </div>
        `
    }
}

/**
 * Button HTML Templates
 */

export class ButtonTemplates {
    /**
     * Creates a button with icon and text
     * @param {Object} config - Button configuration
     * @returns {string} HTML string
     */
    static createButton(config) {
        const {
            text = '',
            icon = null,
            className = 'btn btn-secondary',
            onClick = '',
            title = ''
        } = config

        return `
            <button class="${className}" ${onClick ? `onclick="${onClick}"` : ''} ${title ? `title="${title}"` : ''}>
                ${icon ? `<i class="${icon}"></i>` : ''}
                ${text}
            </button>
        `
    }

    /**
     * Creates an icon-only button
     * @param {string} icon - Font Awesome icon class
     * @param {string} title - Button title
     * @param {string} onClick - Click handler
     * @param {string} className - Additional CSS classes
     * @returns {string} HTML string
     */
    static createIconButton(icon, title, onClick, className = '') {
        return `
            <button class="btn-icon ${className}" ${onClick ? `onclick="${onClick}"` : ''} title="${title}">
                <i class="${icon}"></i>
            </button>
        `
    }
}
