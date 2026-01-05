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
