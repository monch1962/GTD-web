/**
 * Storage operations for the GTD application
 * Handles loading and saving data to storage
 */
import { Task, Project, Template } from '../../models';
import type { Storage } from '../../storage';
interface AppState {
    tasks: Task[];
    projects: Project[];
    templates: Template[];
}
export declare class StorageOperations {
    private _storage;
    private state;
    constructor(storage: Storage, state: AppState);
    get storage(): Storage;
    set storage(value: Storage);
    /**
     * Initialize storage
     */
    initializeStorage(): Promise<void>;
    /**
     * Load all data from storage
     */
    loadData(): Promise<void>;
    /**
     * Save tasks to storage
     */
    saveTasks(): Promise<void>;
    /**
     * Save projects to storage
     */
    saveProjects(): Promise<void>;
    /**
     * Save templates to storage
     */
    saveTemplates(): Promise<void>;
    /**
     * Save all data to storage
     */
    saveAll(): Promise<void>;
}
export {};
//# sourceMappingURL=storage-ops.d.ts.map