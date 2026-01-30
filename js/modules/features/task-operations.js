/**
 * Task Operations module
 * Handles CRUD operations for tasks
 *
 * Features:
 * - Quick add with natural language parsing
 * - Duplicate tasks
 * - Toggle completion
 * - Bulk operations
 * - Task status management
 *
 * @example
 * const taskOps = new TaskOperations(state, app);
 * await taskOps.quickAddTask('Call mom tomorrow');
 * await taskOps.duplicateTask('task-123');
 * await taskOps.toggleTaskComplete('task-123');
 */

import { Task } from "../../models";
import { createLogger } from '../utils/logger.js';

export class TaskOperations {
    /**
     * Create a new TaskOperations instance
     * @param {Object} state - Application state object
     * @param {Array} state.tasks - Array of tasks
     * @param {string} state.currentView - Current view name
     * @param {string|null} state.currentProjectId - Current project filter
     * @param {Function} state.trackTaskUsage - Track task usage for smart defaults
     * @param {Object} app - Application instance
     * @param {Function} app.parser - Natural language parser
     * @param {Function} app.saveState - Save state for undo/redo
     * @param {Function} app.saveTasks - Save tasks to storage
     * @param {Function} app.renderView - Re-render current view
     * @param {Function} app.updateCounts - Update task counts
     * @param {Function} app.updateContextFilter - Update context filter UI
     */
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.logger = createLogger('TaskOperations');
    }

    /**
     * Quick add a task from title
     * @param {string} title - Task title (may contain NLP)
     */
    async quickAddTask(title) {
        // Save state for undo
        this.app.saveState?.('Add task');

        // Use natural language parser to extract task properties
        const parsed = this.app.parser?.parse(title) || { title };

        // Determine status based on current context
        const status = this.state.currentProjectId
            ? 'next'
            : (this.state.currentView === 'all' ? 'inbox' : this.state.currentView);

        const task = new Task({
            title: parsed.title || title,
            status: status,
            type: 'task',
            contexts: parsed.contexts,
            energy: parsed.energy,
            time: parsed.time,
            dueDate: parsed.dueDate,
            recurrence: parsed.recurrence,
            projectId: this.state.currentProjectId || null
        });

        this.state.tasks.push(task);
        await this.app.saveTasks?.();

        // Track usage for smart defaults
        this.state.trackTaskUsage(task);

        this.app.renderView?.();
        this.app.updateCounts?.();
        this.app.updateContextFilter?.();
    }

    /**
     * Duplicate a task
     * @param {string} taskId - Task ID to duplicate
     */
    async duplicateTask(taskId) {
        // Save state for undo
        this.app.saveState?.('Duplicate task');

        const originalTask = this.state.tasks.find(t => t.id === taskId);
        if (!originalTask) return;

        const duplicatedData = {
            ...originalTask.toJSON(),
            title: `${originalTask.title} (copy)`,
            completed: false,
            completedAt: null
        };

        const duplicateTask = new Task(duplicatedData);
        this.state.tasks.push(duplicateTask);
        await this.app.saveTasks?.();

        this.app.renderView?.();
        this.app.updateCounts?.();
    }

    /**
     * Toggle task completion status
     * @param {string} taskId - Task ID
     */
    async toggleTaskComplete(taskId) {
        // Save state for undo
        this.app.saveState?.('Toggle task completion');

        const task = this.state.tasks.find(t => t.id === taskId);
        if (task) {
            if (task.completed) {
                task.markIncomplete();
            } else {
                task.markComplete();

                // Check if task is recurring and create next instance
                if (task.isRecurring() && !task.shouldRecurrenceEnd()) {
                    const nextInstance = task.createNextInstance();
                    if (nextInstance) {
                        this.state.tasks.push(nextInstance);
                        await this.app.saveTasks?.();
                    }
                }
            }
            await this.app.saveTasks?.();

            // Check if any waiting tasks now have their dependencies met
            await this.checkWaitingTasksDependencies();

            this.app.renderView?.();
            this.app.updateCounts?.();
        }
    }

    /**
     * Delete a task
     * @param {string} taskId - Task ID to delete
     */
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        // Save state for undo
        this.app.saveState?.('Delete task');

        this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
        await this.app.saveTasks?.();

        this.app.renderView?.();
        this.app.updateCounts?.();
    }

    /**
     * Migrate blocked tasks to Waiting status
     * One-time migration for existing data
     * @returns {number} Number of tasks migrated
     */
    async migrateBlockedTasksToWaiting() {
        let movedCount = 0;

        // Check all tasks in Next or Someday that have unmet dependencies
        this.state.tasks.forEach(task => {
            if ((task.status === 'next' || task.status === 'someday') && !task.completed) {
                // Check if task has unmet dependencies
                if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                    if (!task.areDependenciesMet(this.state.tasks)) {
                        // Move to Waiting
                        task.status = 'waiting';
                        task.updatedAt = new Date().toISOString();
                        movedCount++;
                    }
                }
            }
        });

        if (movedCount > 0) {
            await this.app.saveTasks?.();
            this.logger.info(`Migrated ${movedCount} blocked task(s) to Waiting`);
        }

        // Update project dropdown counts since tasks changed status
        this.app.renderProjectsDropdown?.();

        return movedCount;
    }

    /**
     * Check waiting tasks and move to Next if dependencies are met
     * @returns {number} Number of tasks moved
     */
    async checkWaitingTasksDependencies() {
        let movedCount = 0;

        // Check all waiting tasks
        this.state.tasks.forEach(task => {
            if (task.status === 'waiting') {
                let shouldMove = false;
                let reason = '';

                // Check if task dependencies are met
                if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                    if (task.areDependenciesMet(this.state.tasks)) {
                        shouldMove = true;
                        reason = 'dependencies met';
                    }
                }
                // If no task dependencies, check if defer date has arrived
                else if (!task.waitingForTaskIds || task.waitingForTaskIds.length === 0) {
                    if (task.deferDate && task.isAvailable()) {
                        shouldMove = true;
                        reason = 'defer date arrived';
                    }
                    // If no defer date and no description, it's just waiting - move it
                    else if (!task.deferDate && !task.waitingForDescription) {
                        shouldMove = true;
                        reason = 'no longer blocked';
                    }
                }

                if (shouldMove) {
                    // Move to Next Actions
                    task.status = 'next';
                    task.waitingForTaskIds = []; // Clear dependencies
                    task.waitingForDescription = ''; // Clear description
                    task.updatedAt = new Date().toISOString();
                    movedCount++;
                }
            }
        });

        if (movedCount > 0) {
            await this.app.saveTasks?.();
        }

        return movedCount;
    }

    /**
     * Update task positions after drag-and-drop reordering
     */
    async updateTaskPositions() {
        const container = document.getElementById('tasks-container');
        if (!container) return;

        const taskElements = [...container.querySelectorAll('.task-item')];
        const filteredTasks = this.state.tasks.filter(t => !t.completed);

        taskElements.forEach((element, index) => {
            const taskId = element.dataset.taskId;
            const task = filteredTasks.find(t => t.id === taskId);
            if (task && task.position !== index) {
                task.position = index;
                task.updatedAt = new Date().toISOString();
            }
        });

        await this.app.saveTasks?.();
    }

    /**
     * Get task by ID
     * @param {string} taskId - Task ID
     * @returns {Task|null} Task object or null
     */
    getTaskById(taskId) {
        return this.state.tasks.find(t => t.id === taskId) || null;
    }

    /**
     * Update a task
     * @param {string} taskId - Task ID
     * @param {Object} updates - Properties to update
     */
    async updateTask(taskId, updates) {
        const task = this.getTaskById(taskId);
        if (!task) return;

        // Save state for undo
        this.app.saveState?.('Update task');

        // Apply updates
        Object.keys(updates).forEach(key => {
            task[key] = updates[key];
        });

        task.updatedAt = new Date().toISOString();
        await this.app.saveTasks?.();

        this.app.renderView?.();
        this.app.updateCounts?.();
    }

    /**
     * Assign task to project
     * @param {string} taskId - Task ID
     * @param {string|null} projectId - Project ID (null to unassign)
     */
    async assignTaskToProject(taskId, projectId) {
        const task = this.getTaskById(taskId);
        if (!task) return;

        // Save state for undo
        this.app.saveState?.('Assign task to project');

        task.projectId = projectId;
        task.updatedAt = new Date().toISOString();
        await this.app.saveTasks?.();

        this.app.renderView?.();
        this.app.updateCounts?.();
    }

    /**
     * Add time spent to task
     * @param {string} taskId - Task ID
     * @param {number} minutes - Minutes to add
     */
    async addTimeSpent(taskId, minutes) {
        const task = this.getTaskById(taskId);
        if (!task) return;

        task.timeSpent = (task.timeSpent || 0) + minutes;
        task.updatedAt = new Date().toISOString();
        await this.app.saveTasks?.();
    }

    /**
     * Get tasks for project
     * @param {string} projectId - Project ID
     * @returns {Array} Array of tasks
     */
    getTasksForProject(projectId) {
        return this.state.tasks.filter(t => t.projectId === projectId);
    }

    /**
     * Get active tasks (not completed)
     * @returns {Array} Array of active tasks
     */
    getActiveTasks() {
        return this.state.tasks.filter(t => !t.completed);
    }

    /**
     * Get completed tasks
     * @returns {Array} Array of completed tasks
     */
    getCompletedTasks() {
        return this.state.tasks.filter(t => t.completed);
    }

    /**
     * Search tasks by title
     * @param {string} query - Search query
     * @returns {Array} Matching tasks
     */
    searchTasks(query) {
        const lowerQuery = query.toLowerCase();
        return this.state.tasks.filter(t =>
            t.title.toLowerCase().includes(lowerQuery) ||
            (t.description && t.description.toLowerCase().includes(lowerQuery))
        );
    }
}
