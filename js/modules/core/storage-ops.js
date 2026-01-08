/**
 * Storage operations for the GTD application
 * Handles loading and saving data to storage
 */

import { Task, Project, Template } from '../../models.js';

export class StorageOperations {
    constructor(storage, state) {
        this._storage = storage;
        this.state = state;
    }

    get storage() { return this._storage; }
    set storage(value) { this._storage = value; }

    /**
     * Initialize storage
     */
    async initializeStorage() {
        await this._storage.init();
    }

    /**
     * Load all data from storage
     */
    async loadData() {
        // Load tasks
        const tasksData = this.storage.getTasks();
        this.state.tasks = tasksData.map(data => Task.fromJSON(data));

        // Load projects
        const projectsData = this.storage.getProjects();
        this.state.projects = projectsData.map(data => Project.fromJSON(data));

        // Load templates
        const templatesData = this.storage.getTemplates();
        this.state.templates = templatesData.map(data => Template.fromJSON(data));
    }

    /**
     * Save tasks to storage
     */
    async saveTasks() {
        const tasksData = this.state.tasks.map(t => t.toJSON());
        await this.storage.saveTasks(tasksData);
    }

    /**
     * Save projects to storage
     */
    async saveProjects() {
        const projectsData = this.state.projects.map(p => p.toJSON());
        await this.storage.saveProjects(projectsData);
    }

    /**
     * Save templates to storage
     */
    async saveTemplates() {
        const templatesData = this.state.templates.map(t => t.toJSON());
        await this.storage.saveTemplates(templatesData);
    }

    /**
     * Save all data to storage
     */
    async saveAll() {
        await Promise.all([
            this.saveTasks(),
            this.saveProjects(),
            this.saveTemplates()
        ]);
    }
}
