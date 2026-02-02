/**
 * Storage operations for the GTD application
 * Handles loading and saving data to storage
 */

import { Task, Project, Template } from '../../models'
import type { Storage } from '../../storage'
import type { AppState } from '../../types'

export class StorageOperations {
    private _storage: Storage
    private state: AppState

    constructor (storage: Storage, state: AppState) {
        this._storage = storage
        this.state = state
    }

    get storage (): Storage {
        return this._storage
    }

    set storage (value: Storage) {
        this._storage = value
    }

    /**
     * Initialize storage
     */
    async initializeStorage (): Promise<void> {
        await this._storage.init()
    }

    /**
     * Load all data from storage
     */
    async loadData (): Promise<void> {
        // Load tasks
        const tasksData = this.storage.getTasks()
        this.state.tasks = tasksData.map((data) => Task.fromJSON(data))

        // Load projects
        const projectsData = this.storage.getProjects()
        this.state.projects = projectsData.map((data) => Project.fromJSON(data))

        // Load templates
        const templatesData = this.storage.getTemplates()
        this.state.templates = templatesData.map((data) => Template.fromJSON(data))
    }

    /**
     * Save tasks to storage
     */
    async saveTasks (): Promise<void> {
        const tasksData = this.state.tasks.map((t) => t.toJSON())
        await this.storage.saveTasks(tasksData)
    }

    /**
     * Save projects to storage
     */
    async saveProjects (): Promise<void> {
        const projectsData = this.state.projects.map((p) => p.toJSON())
        await this.storage.saveProjects(projectsData)
    }

    /**
     * Save templates to storage
     */
    async saveTemplates (): Promise<void> {
        const templatesData = this.state.templates.map((t) => t.toJSON())
        await this.storage.saveTemplates(templatesData)
    }

    /**
     * Save all data to storage
     */
    async saveAll (): Promise<void> {
        await Promise.all([this.saveTasks(), this.saveProjects(), this.saveTemplates()])
    }
}
