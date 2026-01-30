/**
 * Data Export/Import module
 * Handles exporting and importing GTD data to/from JSON files
 *
 * @example
 * const dataExportImport = new DataExportImportManager(state, app);
 * dataExportImport.setupDataExportImport();
 * await dataExportImport.exportData();
 */
import { Task } from '../../models';
import { Project } from '../../models';
interface State {
    tasks: Task[];
    projects: Project[];
    usageStats?: Record<string, any>;
}
interface App {
    tasks?: Task[];
    projects?: Project[];
    usageStats?: Record<string, any>;
    showSuccess?: (message: string) => void;
    showError?: (message: string) => void;
    saveTasks?: () => Promise<void> | void;
    saveProjects?: () => Promise<void> | void;
    saveUsageStats?: () => Promise<void> | void;
    renderView?: () => void;
    updateCounts?: () => void;
    renderProjectsDropdown?: () => void;
    renderCustomContexts?: () => void;
    updateQuickAddPlaceholder?: () => void;
}
export declare class DataExportImportManager {
    private state;
    private app;
    private logger;
    /**
     * Create a new DataExportImportManager instance
     * @param state - Application state object
     * @param app - Application instance with utility methods
     */
    constructor(state: State, app: App);
    /**
     * Setup event listeners for export and import buttons
     * Binds click handlers to the export and import UI buttons
     *
     * @example
     * manager.setupDataExportImport();
     */
    setupDataExportImport(): void;
    /**
     * Export all GTD data to a JSON file
     * Creates a timestamped backup file containing tasks, projects, contexts, and usage stats
     *
     * @example
     * manager.exportData();
     * // Downloads file: gtd-backup-2025-01-09-14-30-15.json
     */
    exportData(): void;
    /**
     * Import GTD data from a JSON file
     * Validates and imports tasks, projects, contexts, and usage stats from a backup file
     * Replaces all existing data with the imported data
     *
     * @param file - The JSON file to import (created by exportData())
     * @returns Promise that resolves when import is complete
     *
     * @example
     * const fileInput = document.getElementById('import-file-input');
     * const file = fileInput.files[0];
     * await manager.importData(file);
     */
    importData(file: File): Promise<void>;
}
export {};
//# sourceMappingURL=data-export-import.d.ts.map