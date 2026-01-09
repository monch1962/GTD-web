/**
 * Keyboard navigation module
 * Handles keyboard shortcuts and task navigation
 */

export class KeyboardNavigation {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.selectedTaskId = null;
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
    }

    /**
     * Handle key down events
     * @private
     */
    _handleKeyDown(e) {
        // Ignore if user is typing in an input or textarea
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Still allow Ctrl+K to focus quick-add even from other inputs
            if (e.ctrlKey && e.key === 'k' && target.id !== 'quick-add-input') {
                e.preventDefault();
                const quickAddInput = document.getElementById('quick-add-input');
                if (quickAddInput) {
                    quickAddInput.focus();
                    quickAddInput.select();
                }
            }
            return;
        }

        // Ctrl+N: Open suggestions modal
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            const suggestionsButton = document.getElementById('btn-suggestions');
            if (suggestionsButton) {
                this.app.showSuggestions?.();
            }
            return;
        }

        // Ctrl+K: Focus quick-add input
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const quickAddInput = document.getElementById('quick-add-input');
            if (quickAddInput) {
                quickAddInput.focus();
            }
            return;
        }

        // Ctrl+D: Duplicate selected task
        if (e.ctrlKey && e.key === 'd' && this.selectedTaskId) {
            e.preventDefault();
            this.app.duplicateTask?.(this.selectedTaskId);
            return;
        }

        // Arrow keys or j/k: Navigate between tasks
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'j' || e.key === 'k') {
            this._handleTaskNavigation(e);
            return;
        }

        // Enter: Edit selected task
        if (e.key === 'Enter' && this.selectedTaskId) {
            e.preventDefault();
            const task = this.state.tasks.find(t => t.id === this.selectedTaskId);
            if (task) {
                this.app.openTaskModal?.(task);
            }
            return;
        }

        // Escape: Deselect task
        if (e.key === 'Escape') {
            this.deselectTask();
            return;
        }

        // Space: Toggle task completion (if task is selected)
        if (e.key === ' ' && this.selectedTaskId) {
            e.preventDefault();
            this.app.toggleTaskComplete?.(this.selectedTaskId);
            return;
        }

        // Delete key: Delete selected task
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedTaskId) {
            e.preventDefault();
            this.app.deleteTask?.(this.selectedTaskId);
            return;
        }

        // Ctrl+/: Toggle focus mode
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            if (this.selectedTaskId) {
                this.app.enterFocusMode?.(this.selectedTaskId);
            }
            return;
        }

        // Number keys 1-5: Quick view switching
        if (e.key >= '1' && e.key <= '5' && e.ctrlKey) {
            e.preventDefault();
            const views = ['inbox', 'next', 'waiting', 'someday', 'projects'];
            const viewIndex = parseInt(e.key) - 1;
            if (views[viewIndex]) {
                this.app.switchView?.(views[viewIndex]);
            }
            return;
        }
    }

    /**
     * Handle task navigation with arrow keys or j/k
     * @private
     */
    _handleTaskNavigation(e) {
        const tasks = document.querySelectorAll('.task-item');
        if (tasks.length === 0) return;

        e.preventDefault();
        let currentIndex = -1;

        if (this.selectedTaskId) {
            const currentTask = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`);
            if (currentTask) {
                currentIndex = Array.from(tasks).indexOf(currentTask);
            }
        }

        let nextIndex;
        const isDown = (e.key === 'ArrowDown' || e.key === 'j');

        if (currentIndex === -1) {
            // No task currently selected, select first or last
            nextIndex = isDown ? 0 : tasks.length - 1;
        } else {
            if (isDown) {
                nextIndex = currentIndex < tasks.length - 1 ? currentIndex + 1 : 0;
            } else {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : tasks.length - 1;
            }
        }

        this.selectTask(tasks[nextIndex].dataset.taskId);
    }

    /**
     * Select a task
     * @param {string} taskId - Task ID to select
     */
    selectTask(taskId) {
        // Deselect previous task
        this.deselectTask();

        // Select new task
        this.selectedTaskId = taskId;
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('selected');
            taskElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Deselect currently selected task
     */
    deselectTask() {
        if (this.selectedTaskId) {
            const taskElement = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`);
            if (taskElement) {
                taskElement.classList.remove('selected');
            }
            this.selectedTaskId = null;
        }
    }

    /**
     * Get currently selected task ID
     * @returns {string|null} Task ID or null
     */
    getSelectedTaskId() {
        return this.selectedTaskId;
    }

    /**
     * Check if a task is selected
     * @returns {boolean}
     */
    hasSelection() {
        return this.selectedTaskId !== null;
    }

    /**
     * Select first task in list
     */
    selectFirstTask() {
        const tasks = document.querySelectorAll('.task-item');
        if (tasks.length > 0) {
            this.selectTask(tasks[0].dataset.taskId);
        }
    }

    /**
     * Select last task in list
     */
    selectLastTask() {
        const tasks = document.querySelectorAll('.task-item');
        if (tasks.length > 0) {
            this.selectTask(tasks[tasks.length - 1].dataset.taskId);
        }
    }

    /**
     * Navigate to next task
     */
    selectNextTask() {
        if (!this.selectedTaskId) {
            this.selectFirstTask();
            return;
        }

        const tasks = document.querySelectorAll('.task-item');
        const currentTask = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`);
        if (!currentTask) return;

        const currentIndex = Array.from(tasks).indexOf(currentTask);
        const nextIndex = currentIndex < tasks.length - 1 ? currentIndex + 1 : 0;
        this.selectTask(tasks[nextIndex].dataset.taskId);
    }

    /**
     * Navigate to previous task
     */
    selectPreviousTask() {
        if (!this.selectedTaskId) {
            this.selectLastTask();
            return;
        }

        const tasks = document.querySelectorAll('.task-item');
        const currentTask = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`);
        if (!currentTask) return;

        const currentIndex = Array.from(tasks).indexOf(currentTask);
        const nextIndex = currentIndex > 0 ? currentIndex - 1 : tasks.length - 1;
        this.selectTask(tasks[nextIndex].dataset.taskId);
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.deselectTask();
    }

    /**
     * Show keyboard shortcuts help
     */
    showShortcutsHelp() {
        const shortcuts = `
Keyboard Shortcuts:
==================
Navigation:
  ↓ or j        Next task
  ↑ or k        Previous task
  Enter         Edit selected task
  Escape        Deselect task
  Space         Toggle complete

Actions:
  Ctrl+K        Focus quick add
  Ctrl+N        Show suggestions
  Ctrl+D        Duplicate selected task
  Delete        Delete selected task
  Ctrl+/        Toggle focus mode

Quick Views:
  Ctrl+1-5      Switch to view (1=Inbox, 2=Next, etc.)
        `;

        this.app.showInfo('Keyboard shortcuts: Press ? for help');
    }
}
