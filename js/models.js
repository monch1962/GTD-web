/**
 * GTD Data Models
 */

export class Task {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.type = data.type || 'task'; // task, project, reference
        this.status = data.status || 'inbox'; // inbox, next, waiting, someday, completed
        this.energy = data.energy || ''; // high, medium, low
        this.time = data.time || 0; // minutes
        this.timeSpent = data.timeSpent || 0; // minutes actually spent
        this.projectId = data.projectId || null;
        this.contexts = data.contexts || data.tags || []; // Support migration from old 'tags'
        this.completed = data.completed || false;
        this.completedAt = data.completedAt || null;
        this.dueDate = data.dueDate || null; // YYYY-MM-DD format
        this.deferDate = data.deferDate || null; // YYYY-MM-DD format
        this.waitingForTaskIds = data.waitingForTaskIds || []; // Array of task IDs this task depends on
        this.waitingForDescription = data.waitingForDescription || ''; // Description of what/who being waited on
        this.recurrence = data.recurrence || ''; // '', 'daily', 'weekly', 'monthly', 'yearly'
        this.recurrenceEndDate = data.recurrenceEndDate || null; // Optional end date for recurrence
        this.recurrenceParentId = data.recurrenceParentId || null; // ID of parent recurring task
        this.position = data.position || 0; // Position for custom ordering
        this.starred = data.starred || false; // User-pinned important tasks
        this.notes = data.notes || ''; // Detailed notes
        this.subtasks = data.subtasks || []; // Array of {title, completed} objects
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            type: this.type,
            status: this.status,
            energy: this.energy,
            time: this.time,
            timeSpent: this.timeSpent,
            projectId: this.projectId,
            contexts: this.contexts,
            completed: this.completed,
            completedAt: this.completedAt,
            dueDate: this.dueDate,
            deferDate: this.deferDate,
            waitingForTaskIds: this.waitingForTaskIds,
            waitingForDescription: this.waitingForDescription,
            recurrence: this.recurrence,
            recurrenceEndDate: this.recurrenceEndDate,
            recurrenceParentId: this.recurrenceParentId,
            position: this.position,
            starred: this.starred,
            notes: this.notes,
            subtasks: this.subtasks,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(json) {
        return new Task(json);
    }

    markComplete() {
        this.completed = true;
        this.completedAt = new Date().toISOString();
        this.status = 'completed';
        this.updatedAt = new Date().toISOString();
    }

    markIncomplete() {
        this.completed = false;
        this.completedAt = null;
        if (this.status === 'completed') {
            this.status = 'inbox';
        }
        this.updatedAt = new Date().toISOString();
    }

    toggleStar() {
        this.starred = !this.starred;
        this.updatedAt = new Date().toISOString();
        return this.starred;
    }

    /**
     * Check if task is available (not deferred or defer date has passed)
     */
    isAvailable() {
        if (!this.deferDate) return true;
        const deferDate = new Date(this.deferDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deferDate <= today;
    }

    /**
     * Check if task is overdue (due date has passed and not completed)
     */
    isOverdue() {
        if (!this.dueDate || this.completed) return false;
        const dueDate = new Date(this.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
    }

    /**
     * Check if task is due today
     */
    isDueToday() {
        if (!this.dueDate || this.completed) return false;
        const dueDate = new Date(this.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return dueDate >= today && dueDate < tomorrow;
    }

    /**
     * Check if task is due within the next N days
     */
    isDueWithin(days) {
        if (!this.dueDate || this.completed) return false;
        const dueDate = new Date(this.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);
        return dueDate >= today && dueDate < futureDate;
    }

    /**
     * Check if task dependencies are met (for waiting tasks)
     * Requires all dependent tasks to be completed
     */
    areDependenciesMet(allTasks) {
        if (!this.waitingForTaskIds || this.waitingForTaskIds.length === 0) {
            return true; // No dependencies
        }

        // Check if all dependent tasks are completed
        return this.waitingForTaskIds.every(depTaskId => {
            const depTask = allTasks.find(t => t.id === depTaskId);
            return depTask && depTask.completed;
        });
    }

    /**
     * Get pending (not completed) dependencies
     */
    getPendingDependencies(allTasks) {
        if (!this.waitingForTaskIds || this.waitingForTaskIds.length === 0) {
            return [];
        }

        return this.waitingForTaskIds
            .map(depTaskId => allTasks.find(t => t.id === depTaskId))
            .filter(task => task && !task.completed);
    }

    /**
     * Check if task is recurring
     */
    isRecurring() {
        return this.recurrence && this.recurrence !== '';
    }

    /**
     * Check if recurrence should end (has passed end date)
     */
    shouldRecurrenceEnd() {
        if (!this.recurrenceEndDate) return false;
        const endDate = new Date(this.recurrenceEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return endDate < today;
    }

    /**
     * Calculate the next occurrence date based on recurrence interval
     * Uses the due date if available, otherwise uses today's date
     */
    getNextOccurrenceDate() {
        const baseDate = this.dueDate ? new Date(this.dueDate) : new Date();
        baseDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(baseDate);

        switch (this.recurrence) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                return null;
        }

        return nextDate.toISOString().split('T')[0]; // Return as YYYY-MM-DD
    }

    /**
     * Create a new instance of this recurring task
     * Returns a new Task object with updated dates and same properties
     */
    createNextInstance() {
        if (!this.isRecurring() || this.shouldRecurrenceEnd()) {
            return null;
        }

        const nextDueDate = this.getNextOccurrenceDate();

        const nextTaskData = {
            title: this.title,
            description: this.description,
            type: this.type,
            status: this.status === 'completed' ? 'inbox' : this.status,
            energy: this.energy,
            time: this.time,
            projectId: this.projectId,
            contexts: [...this.contexts],
            dueDate: nextDueDate,
            recurrence: this.recurrence,
            recurrenceEndDate: this.recurrenceEndDate,
            recurrenceParentId: this.recurrenceParentId || this.id // Keep track of original recurring task
        };

        return new Task(nextTaskData);
    }
}

export class Project {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.status = data.status || 'active'; // active, someday, completed
        this.contexts = data.contexts || data.tags || []; // Support migration from old 'tags'
        this.position = data.position || 0; // Position for custom ordering
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    generateId() {
        return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: this.status,
            contexts: this.contexts,
            position: this.position,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(json) {
        return new Project(json);
    }
}

export class Reference {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.contexts = data.contexts || data.tags || []; // Support migration from old 'tags'
        this.url = data.url || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    generateId() {
        return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            contexts: this.contexts,
            url: this.url,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(json) {
        return new Reference(json);
    }
}

export class Template {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.energy = data.energy || '';
        this.time = data.time || 0;
        this.contexts = data.contexts || [];
        this.notes = data.notes || '';
        this.subtasks = data.subtasks || [];
        this.category = data.category || 'general'; // general, work, personal, meeting, checklist
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    generateId() {
        return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            energy: this.energy,
            time: this.time,
            contexts: this.contexts,
            notes: this.notes,
            subtasks: this.subtasks,
            category: this.category,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(json) {
        return new Template(json);
    }

    /**
     * Create a new Task instance from this template
     * @returns {Task} A new task with the template's properties
     */
    createTask() {
        const taskData = {
            title: this.title,
            description: this.description,
            energy: this.energy,
            time: this.time,
            contexts: [...this.contexts],
            notes: this.notes,
            subtasks: this.subtasks.map(sub => ({...sub})), // Deep copy subtasks
            status: 'inbox'
        };

        return new Task(taskData);
    }
}
