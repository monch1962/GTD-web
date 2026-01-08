/**
 * Task rendering module with virtual scrolling support
 * Handles task list rendering and individual task element creation
 */

import { escapeHtml } from '../../dom-utils.js';
import { VirtualScrollManager } from '../ui/virtual-scroll.js';
import { VirtualScrollConfig } from '../../constants.js';

export class TaskRenderer {
    constructor(state, app) {
        this.state = state;
        this.app = app; // Reference to main app for callbacks
        this.virtualScroll = null;
        this.currentContainer = null;
    }

    /**
     * Render filtered tasks to container
     * @param {HTMLElement} container - Container element
     * @param {Function} filterFn - Optional filter function
     */
    renderTasks(container, filterFn = null) {
        this.currentContainer = container;

        // Get filtered tasks
        let filteredTasks = this._getFilteredTasks(filterFn);

        // Clear container
        container.innerHTML = '';

        if (filteredTasks.length === 0) {
            container.innerHTML = this._renderEmptyState('No tasks found');
            return;
        }

        // Use virtual scrolling for 50+ tasks, regular rendering for smaller lists
        if (filteredTasks.length >= VirtualScrollConfig.ACTIVATION_THRESHOLD) {
            this._renderWithVirtualScroll(container, filteredTasks);
        } else {
            this._renderRegular(container, filteredTasks);
        }
    }

    /**
     * Render tasks using virtual scrolling (for large lists)
     * @private
     * @param {HTMLElement} container - Container element
     * @param {Array} tasks - Tasks to render
     */
    _renderWithVirtualScroll(container, tasks) {
        // Log activation for performance monitoring
        console.log(`🚀 Virtual scrolling ACTIVATED: ${tasks.length} tasks (threshold: ${VirtualScrollConfig.ACTIVATION_THRESHOLD})`);

        // Initialize or update virtual scroll
        if (!this.virtualScroll || this.virtualScroll.container !== container) {
            this._initializeVirtualScroll(container);
        }

        // Set items with render function
        this.virtualScroll.setItems(tasks, (task, index) => {
            const element = this.createTaskElement(task, index);
            this._attachTaskListeners(element, task);
            return element;
        });
    }

    /**
     * Render tasks using regular DOM rendering (for small lists)
     * @private
     * @param {HTMLElement} container - Container element
     * @param {Array} tasks - Tasks to render
     */
    _renderRegular(container, tasks) {
        // Clean up virtual scroll if exists
        if (this.virtualScroll) {
            console.log(`📋 Virtual scrolling DEACTIVATED: ${tasks.length} tasks (< ${VirtualScrollConfig.ACTIVATION_THRESHOLD} threshold)`);
            this.virtualScroll.destroy();
            this.virtualScroll = null;
        }

        // Render all tasks directly (faster for small lists)
        const fragment = document.createDocumentFragment();
        tasks.forEach((task, index) => {
            const element = this.createTaskElement(task, index);
            this._attachTaskListeners(element, task);
            fragment.appendChild(element);
        });
        container.appendChild(fragment);
    }

    /**
     * Get filtered tasks based on current state
     * @private
     * @param {Function} additionalFilter - Optional additional filter
     * @returns {Array} Filtered tasks
     */
    _getFilteredTasks(additionalFilter = null) {
        let filteredTasks = this.state.tasks.filter(task => !task.completed);

        // Filter by project if viewing a specific project
        if (this.state.currentProjectId) {
            filteredTasks = filteredTasks.filter(task => task.projectId === this.state.currentProjectId);
        } else {
            // Filter by view (only when not viewing a specific project)
            if (this.state.currentView !== 'all') {
                filteredTasks = filteredTasks.filter(task => task.status === this.state.currentView);
            }

            // For Inbox view, exclude tasks that are assigned to projects
            if (this.state.currentView === 'inbox') {
                filteredTasks = filteredTasks.filter(task => !task.projectId);
            }

            // For Next view, exclude tasks with unmet dependencies
            if (this.state.currentView === 'next') {
                filteredTasks = filteredTasks.filter(task => task.areDependenciesMet(this.state.tasks));
            }
        }

        // Apply additional filters
        if (this.state.filters.context) {
            filteredTasks = filteredTasks.filter(task =>
                task.contexts && task.contexts.includes(this.state.filters.context)
            );
        }

        // Apply sidebar context filters
        if (this.state.selectedContextFilters && this.state.selectedContextFilters.size > 0) {
            filteredTasks = filteredTasks.filter(task => {
                if (!task.contexts || task.contexts.length === 0) return false;
                return task.contexts.some(context => this.state.selectedContextFilters.has(context));
            });
        }

        if (this.state.filters.energy) {
            filteredTasks = filteredTasks.filter(task => task.energy === this.state.filters.energy);
        }

        if (this.state.filters.time) {
            const maxTime = parseInt(this.state.filters.time);
            filteredTasks = filteredTasks.filter(task => {
                if (!task.time) return false;
                return task.time <= maxTime;
            });
        }

        // Apply search and advanced filters (delegate to app)
        if (this.app.filterTasksBySearch) {
            filteredTasks = this.app.filterTasksBySearch(filteredTasks);
        }

        // Apply additional filter if provided
        if (additionalFilter) {
            filteredTasks = filteredTasks.filter(additionalFilter);
        }

        // Sort tasks
        return this._sortTasks(filteredTasks);
    }

    /**
     * Sort tasks based on current sort option
     * @private
     * @param {Array} tasks - Tasks to sort
     * @returns {Array} Sorted tasks
     */
    _sortTasks(tasks) {
        const sortOption = this.state.advancedSearchFilters.sort || 'updated';

        return tasks.sort((a, b) => {
            // First sort by starred status (starred tasks first)
            if (a.starred !== b.starred) {
                return a.starred ? -1 : 1;
            }

            // Then sort by position if set
            if (a.position !== b.position) {
                return a.position - b.position;
            }

            // Then apply selected sort
            switch (sortOption) {
                case 'due':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);

                case 'created':
                    return new Date(b.createdAt) - new Date(a.createdAt);

                case 'time':
                    if (!a.time && !b.time) return 0;
                    if (!a.time) return 1;
                    if (!b.time) return -1;
                    return b.time - a.time;

                case 'title':
                    return a.title.localeCompare(b.title);

                case 'updated':
                default:
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
        });
    }

    /**
     * Initialize virtual scroll manager
     * @private
     * @param {HTMLElement} container - Container element
     */
    _initializeVirtualScroll(container) {
        // Measure average task height
        const itemHeight = this._measureTaskHeight();

        this.virtualScroll = new VirtualScrollManager(container, {
            itemHeight: itemHeight,
            bufferItems: 5
        });
    }

    /**
     * Measure average task height
     * @private
     * @returns {number} Average height in pixels
     */
    _measureTaskHeight() {
        // Create a sample task to measure
        const sampleTask = {
            id: 'sample',
            title: 'Sample Task',
            description: 'Sample description',
            contexts: ['@work'],
            energy: 'high',
            time: 30,
            completed: false,
            starred: false,
            isRecurring: () => false,
            isAvailable: () => true,
            isOverdue: () => false
        };

        const tempContainer = document.createElement('div');
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.position = 'absolute';
        tempContainer.style.width = '100%';
        document.body.appendChild(tempContainer);

        const element = this.createTaskElement(sampleTask, 0);
        tempContainer.appendChild(element);

        const height = element.offsetHeight;
        document.body.removeChild(tempContainer);

        return height || 120; // Default if measurement fails
    }

    /**
     * Create a task element
     * @param {Task} task - Task object
     * @param {number} index - Task index
     * @returns {HTMLElement} Task element
     */
    createTaskElement(task, index) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;

        if (task.completed) {
            div.classList.add('completed');
        }

        if (task.isOverdone && task.isOverdue()) {
            div.classList.add('overdue');
        }

        if (!task.isAvailable()) {
            div.classList.add('deferred');
        }

        // Build task HTML
        div.innerHTML = this._buildTaskHTML(task);

        // Drag and drop will be attached by _attachTaskListeners
        return div;
    }

    /**
     * Build task HTML string
     * @private
     * @param {Task} task - Task object
     * @returns {string} HTML string
     */
    _buildTaskHTML(task) {
        const dragHandle = '<div class="task-drag-handle"><i class="fas fa-grip-vertical"></i></div>';

        const checkbox = this._buildCheckbox(task);
        const content = this._buildTaskContent(task);
        const actions = this._buildTaskActions(task);

        return `${dragHandle}${checkbox}${content}${actions}`;
    }

    /**
     * Build checkbox HTML
     * @private
     */
    _buildCheckbox(task) {
        const isBulkSelectMode = this.state.bulkSelectionMode;
        const isBulkSelected = this.state.selectedTaskIds.has(task.id);

        if (isBulkSelectMode) {
            return `<input type="checkbox" class="bulk-select-checkbox" ${isBulkSelected ? 'checked' : ''}>`;
        } else {
            return `<input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>`;
        }
    }

    /**
     * Build task content HTML
     * @private
     */
    _buildTaskContent(task) {
        let html = '<div class="task-content">';
        html += `<div class="task-title">${escapeHtml(task.title)}</div>`;

        if (task.description) {
            html += `<div class="task-description">${escapeHtml(task.description)}</div>`;
        }

        html += '<div class="task-meta">';
        html += this._buildTaskMeta(task);
        html += '</div>';

        if (task.subtasks && task.subtasks.length > 0) {
            html += this._buildSubtasksHTML(task);
        }

        html += '</div>';
        return html;
    }

    /**
     * Build task metadata HTML
     * @private
     */
    _buildTaskMeta(task) {
        let parts = [];

        // Contexts
        if (task.contexts) {
            parts.push(task.contexts.map(ctx =>
                `<span class="task-context">${escapeHtml(ctx)}</span>`
            ).join(''));
        }

        // Recurrence
        if (task.isRecurring() && this.app.getRecurrenceLabel) {
            const label = this.app.getRecurrenceLabel(task.recurrence);
            parts.push(`<span class="task-context" style="background-color: #e8f4f8; border-color: #4a90d9; color: #2c5f8d;">
                <i class="fas fa-redo"></i> ${label}
            </span>`);
        }

        // Energy
        if (task.energy) {
            parts.push(`<span class="task-energy"><i class="fas fa-bolt"></i> ${task.energy}</span>`);
        }

        // Time estimate
        if (task.time) {
            parts.push(`<span class="task-time"><i class="fas fa-clock"></i> ${task.time}m</span>`);
        }

        // Time spent
        if (task.timeSpent) {
            parts.push(`<span class="task-time-spent" title="Time spent"><i class="fas fa-stopwatch"></i> ${task.timeSpent}m</span>`);
        }

        // Due date
        parts.push(this._buildDueDateHTML(task));

        // Defer date
        if (task.deferDate && !task.isAvailable()) {
            parts.push(`<span class="task-defer-date">
                <i class="fas fa-hourglass-half"></i> Until ${new Date(task.deferDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>`);
        }

        // Waiting/dependencies
        parts.push(this._buildWaitingHTML(task));

        // Project
        if (task.projectId) {
            const projectTitle = this._getProjectTitle(task.projectId);
            parts.push(`<span class="task-project">${escapeHtml(projectTitle)}</span>`);
        }

        // Priority score
        if (!task.completed && this.app.calculatePriorityScore && this.app.getPriorityScoreColor) {
            const score = this.app.calculatePriorityScore(task);
            const color = this.app.getPriorityScoreColor(score);
            const label = this.app.getPriorityLabel ? this.app.getPriorityLabel(score) : score;
            parts.push(`<span class="priority-score" style="background: ${color};" title="Priority: ${label}">${score}</span>`);
        }

        return parts.join('');
    }

    /**
     * Build due date HTML
     * @private
     */
    _buildDueDateHTML(task) {
        if (!task.dueDate) return '';

        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const isOverdue = task.isOverdue();

        let dueLabel = '';
        if (task.isDueToday()) {
            dueLabel = 'Today';
        } else if (task.isDueWithin(7)) {
            dueLabel = dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } else {
            dueLabel = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        let countdownBadge = '';
        if (!task.completed && daysDiff >= 1 && daysDiff <= 14) {
            let badgeColor = 'var(--success-color)';
            if (daysDiff <= 2) {
                badgeColor = 'var(--danger-color)';
            } else if (daysDiff <= 5) {
                badgeColor = '#f39c12';
            } else if (daysDiff <= 7) {
                badgeColor = 'var(--warning-color)';
            }

            countdownBadge = `<span class="days-remaining-badge" style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 4px;">
                Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}
            </span>`;
        }

        return `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">
            <i class="fas fa-calendar${isOverdue ? '-times' : '-day'}"></i> ${dueLabel}${countdownBadge}
        </span>`;
    }

    /**
     * Build waiting/dependencies HTML
     * @private
     */
    _buildWaitingHTML(task) {
        const parts = [];

        if (task.status === 'waiting' && task.waitingForDescription) {
            parts.push(`<i class="fas fa-hourglass-half"></i> Waiting: ${escapeHtml(task.waitingForDescription)}`);
        }

        if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
            const pendingDeps = task.getPendingDependencies(this.state.tasks);
            if (pendingDeps.length > 0) {
                const depNames = pendingDeps.map(t => escapeHtml(t.title)).join(', ');
                parts.push(`<i class="fas fa-link"></i> Blocked by: ${depNames}`);
            } else {
                if (task.status === 'waiting') {
                    parts.push(`<i class="fas fa-check-circle"></i> Dependencies met!`);
                } else {
                    parts.push(`<i class="fas fa-check-circle"></i> Dependencies met`);
                }
            }
        }

        if (parts.length > 0) {
            return `<span class="task-waiting-for">${parts.join(' | ')}</span>`;
        }
        return '';
    }

    /**
     * Build subtasks HTML
     * @private
     */
    _buildSubtasksHTML(task) {
        const completedCount = task.subtasks.filter(s => s.completed).length;
        const incompleteSubtasks = task.subtasks.filter(s => !s.completed);

        let html = `<div class="task-subtasks" style="margin-top: var(--spacing-xs);">
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
                <i class="fas fa-tasks"></i> ${completedCount}/${task.subtasks.length} subtasks
            </div>`;

        incompleteSubtasks.slice(0, 3).forEach(subtask => {
            html += `<div style="font-size: 0.75rem; color: var(--text-secondary); padding-left: 12px;">
                <i class="fas fa-square" style="color: var(--border-color);"></i> ${escapeHtml(subtask.title)}
            </div>`;
        });

        if (incompleteSubtasks.length > 3) {
            html += `<div style="font-size: 0.75rem; color: var(--text-secondary); padding-left: 12px;">+${incompleteSubtasks.length - 3} more</div>`;
        }

        html += '</div>';
        return html;
    }

    /**
     * Build task actions HTML
     * @private
     */
    _buildTaskActions(task) {
        const hasTimer = this.state.activeTimers.has(task.id);

        let html = '<div class="task-actions">';

        // Timer button
        html += hasTimer
            ? `<button class="task-action-btn timer-active" title="Stop timer"><i class="fas fa-stop"></i></button>`
            : `<button class="task-action-btn timer" title="Start timer"><i class="fas fa-play"></i></button>`;

        // Star button
        html += `<button class="task-action-btn star" title="Star task" ${task.starred ? 'style="color: #ffd700;"' : ''}>
            <i class="fas fa-star"></i>
        </button>`;

        // Notes button
        html += `<button class="task-action-btn notes" title="Notes" ${task.notes ? 'style="color: var(--info-color);"' : ''}>
            <i class="fas fa-sticky-note"></i>
        </button>`;

        // Action buttons
        html += `<button class="task-action-btn duplicate" title="Duplicate"><i class="fas fa-copy"></i></button>`;
        html += `<button class="task-action-btn edit" title="Edit"><i class="fas fa-edit"></i></button>`;

        // Archive button (only for completed tasks)
        if (task.completed) {
            html += `<button class="task-action-btn archive" title="Archive"><i class="fas fa-archive"></i></button>`;
        }

        html += `<button class="task-action-btn delete" title="Delete"><i class="fas fa-trash"></i></button>`;

        html += '</div>';
        return html;
    }

    /**
     * Attach event listeners to task element
     * @private
     * @param {HTMLElement} element - Task element
     * @param {Task} task - Task object
     */
    _attachTaskListeners(element, task) {
        // Drag events
        this._attachDragListeners(element, task);

        // Checkbox
        const checkbox = element.querySelector('.task-checkbox, .bulk-select-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (this.state.bulkSelectionMode) {
                    this.app.toggleBulkTaskSelection?.(task.id);
                } else {
                    this.app.toggleTaskComplete?.(task.id);
                }
            });
        }

        // Timer button
        const timerBtn = element.querySelector('.task-action-btn.timer, .task-action-btn.timer-active');
        if (timerBtn) {
            timerBtn.addEventListener('click', () => {
                if (this.state.activeTimers.has(task.id)) {
                    this.app.stopTaskTimer?.(task.id);
                } else {
                    this.app.startTaskTimer?.(task.id);
                }
            });
        }

        // Notes button
        const notesBtn = element.querySelector('.task-action-btn.notes');
        if (notesBtn) {
            notesBtn.addEventListener('click', () => {
                const notes = task.notes || 'No notes';
                alert(`${task.title}\n\nNotes:\n${notes}`);
            });
        }

        // Star button
        const starBtn = element.querySelector('.task-action-btn.star');
        if (starBtn) {
            starBtn.addEventListener('click', async () => {
                this.app.saveState?.('Toggle task star');
                task.toggleStar();
                await this.app.saveTasks?.();
                this.app.renderView?.();
            });
        }

        // Edit button
        const editBtn = element.querySelector('.task-action-btn.edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.app.openTaskModal?.(task));
        }

        // Duplicate button
        const duplicateBtn = element.querySelector('.task-action-btn.duplicate');
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => this.app.duplicateTask?.(task.id));
        }

        // Delete button
        const deleteBtn = element.querySelector('.task-action-btn.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.app.deleteTask?.(task.id));
        }

        // Archive button (only for completed tasks)
        const archiveBtn = element.querySelector('.task-action-btn.archive');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', () => this.app.archiveTask?.(task.id));
        }

        // Inline edit on double-click
        const titleElement = element.querySelector('.task-title');
        if (titleElement) {
            titleElement.style.cursor = 'pointer';
            titleElement.title = 'Double-click to edit';
            titleElement.addEventListener('dblclick', () => {
                this.app.enableInlineEdit?.(task, titleElement);
            });
        }
    }

    /**
     * Attach drag-and-drop listeners
     * @private
     */
    _attachDragListeners(element, task) {
        element.addEventListener('dragstart', (e) => {
            element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', task.id);

            // Notify virtual scroll of drag start
            if (this.virtualScroll) {
                this.virtualScroll.setDragging(true);
            }

            // Auto-expand projects dropdown
            const projectsToggle = document.querySelector('.projects-dropdown-toggle');
            const projectsDropdown = document.getElementById('projects-dropdown');
            if (projectsToggle && projectsDropdown && !projectsDropdown.classList.contains('expanded')) {
                projectsToggle.classList.add('expanded');
                projectsDropdown.classList.add('expanded');
            }
        });

        element.addEventListener('dragend', async () => {
            element.classList.remove('dragging');

            // Notify virtual scroll of drag end
            if (this.virtualScroll) {
                this.virtualScroll.setDragging(false);
            }

            // Update task positions after drag
            await this.app.updateTaskPositions?.();
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            if (draggingItem && draggingItem !== element) {
                if (this.state.currentProjectId) {
                    // Dependency creation mode
                    e.dataTransfer.dropEffect = 'link';
                    element.classList.add('dependency-target');
                } else {
                    // Normal reordering
                    const container = element.parentNode;
                    const afterElement = this._getDragAfterElement(container, e.clientY);
                    if (afterElement == null) {
                        container.appendChild(draggingItem);
                    } else {
                        container.insertBefore(draggingItem, afterElement);
                    }
                }
            }
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('dependency-target');
        });

        element.addEventListener('drop', async (e) => {
            e.preventDefault();
            element.classList.remove('dependency-target');

            const draggedTaskId = e.dataTransfer.getData('text/plain');
            if (!draggedTaskId) return;

            if (this.state.currentProjectId) {
                await this._handleDependencyDrop(task.id, draggedTaskId);
            } else {
                await this.app.updateTaskPositions?.();
            }
        });
    }

    /**
     * Handle dependency drop in project view
     * @private
     */
    async _handleDependencyDrop(targetTaskId, draggedTaskId) {
        const targetTask = this.state.tasks.find(t => t.id === targetTaskId);
        const draggedTask = this.state.tasks.find(t => t.id === draggedTaskId);

        if (!targetTask || !draggedTask || targetTask.id === draggedTask.id) return;

        // Check if both tasks are in the same project
        if (targetTask.projectId !== draggedTask.projectId) {
            this.app.showNotification?.('Dependencies can only be created within the same project', 'error');
            return;
        }

        // Check for circular dependency
        if (this.app.wouldCreateCircularDependency?.(draggedTask.id, targetTask.id)) {
            this.app.showNotification?.('Cannot create circular dependency!', 'error');
            return;
        }

        // Check if dependency already exists
        if (!targetTask.waitingForTaskIds) {
            targetTask.waitingForTaskIds = [];
        }

        if (targetTask.waitingForTaskIds.includes(draggedTask.id)) {
            this.app.showNotification?.('Dependency already exists', 'info');
            return;
        }

        // Add dependency
        this.app.saveState?.('Create task dependency');
        targetTask.waitingForTaskIds.push(draggedTask.id);
        await this.app.saveTasks?.();

        // Check if target task should be moved to waiting status
        const pendingDeps = targetTask.getPendingDependencies(this.state.tasks);
        if (pendingDeps.length > 0 && targetTask.status !== 'waiting') {
            targetTask.status = 'waiting';
            await this.app.saveTasks?.();
        }

        this.app.showNotification?.(`Created dependency: "${targetTask.title}" now depends on "${draggedTask.title}"`);
        this.app.renderView?.();
    }

    /**
     * Get element after drag position
     * @private
     */
    _getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Get project title by ID
     * @private
     */
    _getProjectTitle(projectId) {
        const project = this.state.projects.find(p => p.id === projectId);
        return project ? project.title : 'Unknown Project';
    }

    /**
     * Render empty state
     * @private
     */
    _renderEmptyState(message) {
        return `<div class="empty-state">
            <i class="fas fa-inbox fa-3x"></i>
            <p>${message}</p>
        </div>`;
    }

    /**
     * Scroll to specific task
     * @param {string} taskId - Task ID
     */
    scrollToTask(taskId) {
        if (!this.virtualScroll) return;

        const tasks = this._getFilteredTasks();
        const index = tasks.findIndex(t => t.id === taskId);

        if (index !== -1) {
            this.virtualScroll.scrollToItem(index);
        }
    }

    /**
     * Refresh rendering
     */
    refresh() {
        if (this.currentContainer) {
            this.renderTasks(this.currentContainer);
        }
    }

    /**
     * Destroy virtual scroll manager
     */
    destroy() {
        if (this.virtualScroll) {
            this.virtualScroll.destroy();
            this.virtualScroll = null;
        }
        this.currentContainer = null;
    }
}
