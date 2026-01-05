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
        this.projectId = data.projectId || null;
        this.tags = data.tags || [];
        this.completed = data.completed || false;
        this.completedAt = data.completedAt || null;
        this.dueDate = data.dueDate || null; // YYYY-MM-DD format
        this.deferDate = data.deferDate || null; // YYYY-MM-DD format
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
            projectId: this.projectId,
            tags: this.tags,
            completed: this.completed,
            completedAt: this.completedAt,
            dueDate: this.dueDate,
            deferDate: this.deferDate,
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
}

export class Project {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.status = data.status || 'active'; // active, someday, completed
        this.tags = data.tags || [];
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
            tags: this.tags,
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
        this.tags = data.tags || [];
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
            tags: this.tags,
            url: this.url,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(json) {
        return new Reference(json);
    }
}
