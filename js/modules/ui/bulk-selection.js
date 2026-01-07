/**
 * Bulk selection module
 * Handles bulk operations on multiple tasks
 */

export class BulkSelection {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.selectedTaskIds = new Set();
    }

    /**
     * Setup bulk selection event listeners
     */
    setupBulkSelection() {
        const bulkSelectBtn = document.getElementById('btn-bulk-select');
        const bulkCompleteBtn = document.getElementById('btn-bulk-complete');
        const bulkSelectAllBtn = document.getElementById('btn-bulk-select-all');
        const bulkStatusBtn = document.getElementById('btn-bulk-status');
        const bulkEnergyBtn = document.getElementById('btn-bulk-energy');
        const bulkProjectBtn = document.getElementById('btn-bulk-project');
        const bulkContextBtn = document.getElementById('btn-bulk-context');
        const bulkDueDateBtn = document.getElementById('btn-bulk-due-date');
        const bulkDeleteBtn = document.getElementById('btn-bulk-delete');
        const bulkCancelBtn = document.getElementById('btn-bulk-cancel');

        // Show bulk select button when there are tasks
        this.updateBulkSelectButtonVisibility();

        // Toggle bulk selection mode
        if (bulkSelectBtn) {
            bulkSelectBtn.addEventListener('click', () => {
                this.toggleBulkSelectionMode();
            });
        }

        // Complete selected tasks
        if (bulkCompleteBtn) {
            bulkCompleteBtn.addEventListener('click', async () => {
                await this.bulkCompleteTasks();
            });
        }

        // Select all visible tasks
        if (bulkSelectAllBtn) {
            bulkSelectAllBtn.addEventListener('click', () => {
                this.bulkSelectAllVisible();
            });
        }

        // Set status for selected tasks
        if (bulkStatusBtn) {
            bulkStatusBtn.addEventListener('click', () => {
                this.bulkSetStatus();
            });
        }

        // Set energy for selected tasks
        if (bulkEnergyBtn) {
            bulkEnergyBtn.addEventListener('click', () => {
                this.bulkSetEnergy();
            });
        }

        // Move selected tasks to project
        if (bulkProjectBtn) {
            bulkProjectBtn.addEventListener('click', () => {
                this.bulkSetProject();
            });
        }

        // Add context to selected tasks
        if (bulkContextBtn) {
            bulkContextBtn.addEventListener('click', () => {
                this.bulkAddContext();
            });
        }

        // Set due date for selected tasks
        if (bulkDueDateBtn) {
            bulkDueDateBtn.addEventListener('click', () => {
                this.bulkSetDueDate();
            });
        }

        // Delete selected tasks
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.bulkDeleteTasks();
            });
        }

        // Cancel bulk selection
        if (bulkCancelBtn) {
            bulkCancelBtn.addEventListener('click', () => {
                this.exitBulkSelectionMode();
            });
        }
    }

    /**
     * Update bulk select button visibility
     */
    updateBulkSelectButtonVisibility() {
        const bulkSelectBtn = document.getElementById('btn-bulk-select');
        const tasks = document.querySelectorAll('.task-item');
        if (bulkSelectBtn) {
            bulkSelectBtn.style.display = tasks.length > 0 ? 'block' : 'none';
        }
    }

    /**
     * Toggle bulk selection mode
     */
    toggleBulkSelectionMode() {
        this.state.bulkSelectionMode = !this.state.bulkSelectionMode;
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        const bulkSelectBtn = document.getElementById('btn-bulk-select');

        if (this.state.bulkSelectionMode) {
            if (bulkActionsBar) bulkActionsBar.style.display = 'flex';
            if (bulkSelectBtn) bulkSelectBtn.innerHTML = '<i class="fas fa-times"></i> Exit Selection';
            this.app.renderView?.(); // Re-render to show bulk checkboxes
        } else {
            this.exitBulkSelectionMode();
        }
    }

    /**
     * Exit bulk selection mode
     */
    exitBulkSelectionMode() {
        this.state.bulkSelectionMode = false;
        this.selectedTaskIds.clear();
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        const bulkSelectBtn = document.getElementById('btn-bulk-select');

        if (bulkActionsBar) {
            bulkActionsBar.style.display = 'none';
        }
        if (bulkSelectBtn) {
            bulkSelectBtn.innerHTML = '<i class="fas fa-check-square"></i> Select Multiple';
        }
        this.updateBulkSelectedCount();
        this.app.renderView?.(); // Re-render to hide bulk checkboxes
    }

    /**
     * Toggle task selection
     * @param {string} taskId - Task ID
     */
    toggleBulkTaskSelection(taskId) {
        if (this.selectedTaskIds.has(taskId)) {
            this.selectedTaskIds.delete(taskId);
        } else {
            this.selectedTaskIds.add(taskId);
        }
        this.updateBulkSelectedCount();
    }

    /**
     * Update selected count display
     */
    updateBulkSelectedCount() {
        const bulkSelectedCount = document.getElementById('bulk-selected-count');
        const bulkCompleteBtn = document.getElementById('btn-bulk-complete');

        if (bulkSelectedCount) {
            bulkSelectedCount.textContent = this.selectedTaskIds.size;
        }

        if (bulkCompleteBtn) {
            bulkCompleteBtn.disabled = this.selectedTaskIds.size === 0;
            bulkCompleteBtn.style.opacity = this.selectedTaskIds.size === 0 ? '0.5' : '1';
        }
    }

    /**
     * Complete selected tasks
     */
    async bulkCompleteTasks() {
        if (this.selectedTaskIds.size === 0) return;

        this.app.saveState?.('Bulk complete tasks');

        for (const taskId of this.selectedTaskIds) {
            const task = this.state.tasks.find(t => t.id === taskId);
            if (task && !task.completed) {
                task.completed = true;
                task.completedAt = new Date().toISOString();
            }
        }

        await this.app.saveTasks?.();
        this.exitBulkSelectionMode();
        this.app.renderView?.();
        this.app.updateCounts?.();
        this.app.renderProjectsDropdown?.();
        this.app.showToast?.(`${this.selectedTaskIds.size} task(s) completed`);
    }

    /**
     * Select all visible tasks
     */
    bulkSelectAllVisible() {
        const visibleTasks = document.querySelectorAll('.task-item');
        visibleTasks.forEach(taskElement => {
            const taskId = taskElement.dataset.taskId;
            const checkbox = taskElement.querySelector('.bulk-select-checkbox');
            if (checkbox && taskId) {
                this.selectedTaskIds.add(taskId);
                checkbox.checked = true;
            }
        });
        this.updateBulkSelectedCount();
        this.app.showToast?.(`${this.selectedTaskIds.size} tasks selected`);
    }

    /**
     * Set status for selected tasks
     */
    async bulkSetStatus() {
        if (this.selectedTaskIds.size === 0) return;

        const status = prompt('Enter status (inbox, next, waiting, someday):');
        if (!status || !['inbox', 'next', 'waiting', 'someday'].includes(status)) {
            this.app.showToast?.('Invalid status');
            return;
        }

        this.app.saveState?.('Bulk set status');

        for (const taskId of this.selectedTaskIds) {
            const task = this.state.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = status;
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.app.saveTasks?.();
        this.exitBulkSelectionMode();
        this.app.renderView?.();
        this.app.updateCounts?.();
        this.app.showToast?.(`Status set to ${status}`);
    }

    /**
     * Set energy for selected tasks
     */
    async bulkSetEnergy() {
        if (this.selectedTaskIds.size === 0) return;

        const energy = prompt('Enter energy level (high, medium, low, or leave empty for none):');
        if (energy === null || (energy && !['high', 'medium', 'low'].includes(energy))) {
            this.app.showToast?.('Invalid energy level');
            return;
        }

        this.app.saveState?.('Bulk set energy');

        for (const taskId of this.selectedTaskIds) {
            const task = this.state.tasks.find(t => t.id === taskId);
            if (task) {
                task.energy = energy || '';
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.app.saveTasks?.();
        this.exitBulkSelectionMode();
        this.app.renderView?.();
        this.app.showToast?.(`Energy set to ${energy || 'none'}`);
    }

    /**
     * Set project for selected tasks
     */
    async bulkSetProject() {
        if (this.selectedTaskIds.size === 0) return;

        const projectTitles = this.state.projects.map((p, i) => `${i + 1}. ${p.title}`).join('\n');
        const choice = prompt(`Enter project number to move tasks to:\n0. No Project\n${projectTitles}`);

        if (choice === null) return;

        const index = parseInt(choice) - 1;
        const projectId = index === -1 ? null : (this.state.projects[index] ? this.state.projects[index].id : null);

        this.app.saveState?.('Bulk set project');

        for (const taskId of this.selectedTaskIds) {
            const task = this.state.tasks.find(t => t.id === taskId);
            if (task) {
                task.projectId = projectId;
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.app.saveTasks?.();
        this.exitBulkSelectionMode();
        this.app.renderView?.();
        this.app.showToast?.(`Moved ${this.selectedTaskIds.size} task(s) to project`);
    }

    /**
     * Add context to selected tasks
     */
    async bulkAddContext() {
        if (this.selectedTaskIds.size === 0) return;

        const context = prompt('Enter context name (will be prefixed with @):');
        if (!context) return;

        const formattedContext = context.startsWith('@') ? context : `@${context}`;

        this.app.saveState?.('Bulk add context');

        for (const taskId of this.selectedTaskIds) {
            const task = this.state.tasks.find(t => t.id === taskId);
            if (task) {
                task.contexts = task.contexts || [];
                if (!task.contexts.includes(formattedContext)) {
                    task.contexts.push(formattedContext);
                }
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.app.saveTasks?.();
        this.exitBulkSelectionMode();
        this.app.renderView?.();
        this.app.showToast?.(`Added ${formattedContext} to ${this.selectedTaskIds.size} task(s)`);
    }

    /**
     * Set due date for selected tasks
     */
    async bulkSetDueDate() {
        if (this.selectedTaskIds.size === 0) return;

        const date = prompt('Enter due date (YYYY-MM-DD) or relative (today, tomorrow, in 3 days):');
        if (!date) return;

        const dueDate = this._parseDueDate(date);

        this.app.saveState?.('Bulk set due date');

        for (const taskId of this.selectedTaskIds) {
            const task = this.state.tasks.find(t => t.id === taskId);
            if (task) {
                task.dueDate = dueDate;
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.app.saveTasks?.();
        this.exitBulkSelectionMode();
        this.app.renderView?.();
        this.app.showToast?.(`Due date set to ${dueDate}`);
    }

    /**
     * Parse due date input
     * @private
     */
    _parseDueDate(date) {
        // Today
        if (date.toLowerCase() === 'today') {
            return new Date().toISOString().split('T')[0];
        }
        // Tomorrow
        else if (date.toLowerCase() === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }
        // Relative dates (in X days/weeks)
        else if (date.toLowerCase().startsWith('in ')) {
            const match = date.match(/in\s+(\d+)\s+(day|days|week|weeks)/);
            if (match) {
                const amount = parseInt(match[1]);
                const unit = match[2];
                const targetDate = new Date();
                if (unit.startsWith('day')) {
                    targetDate.setDate(targetDate.getDate() + amount);
                } else if (unit.startsWith('week')) {
                    targetDate.setDate(targetDate.getDate() + (amount * 7));
                }
                return targetDate.toISOString().split('T')[0];
            }
        }

        // Return as-is for YYYY-MM-DD format
        return date;
    }

    /**
     * Delete selected tasks
     */
    async bulkDeleteTasks() {
        if (this.selectedTaskIds.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${this.selectedTaskIds.size} task(s)?`)) {
            return;
        }

        this.app.saveState?.('Bulk delete tasks');

        this.state.tasks = this.state.tasks.filter(task => !this.selectedTaskIds.has(task.id));
        await this.app.saveTasks?.();

        this.exitBulkSelectionMode();
        this.app.renderView?.();
        this.app.updateCounts?.();
        this.app.showToast?.(`${this.selectedTaskIds.size} task(s) deleted`);
    }

    /**
     * Check if bulk selection mode is active
     * @returns {boolean}
     */
    isActive() {
        return this.state.bulkSelectionMode || false;
    }

    /**
     * Check if a task is selected
     * @param {string} taskId - Task ID
     * @returns {boolean}
     */
    isTaskSelected(taskId) {
        return this.selectedTaskIds.has(taskId);
    }

    /**
     * Get selected task IDs
     * @returns {Array} Array of task IDs
     */
    getSelectedTaskIds() {
        return Array.from(this.selectedTaskIds);
    }

    /**
     * Get count of selected tasks
     * @returns {number}
     */
    getSelectedCount() {
        return this.selectedTaskIds.size;
    }
}
