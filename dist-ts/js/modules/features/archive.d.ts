/**
 * Archive module
 * Handles task archiving and restoration
 */
import { Task, Project } from '../../models';
import { ArchiveEntry } from '../../storage';
interface AppState {
    tasks: Task[];
    projects: Project[];
}
interface AppDependencies {
    storage?: {
        getArchivedTasks: () => ArchiveEntry[];
        addToArchive: (tasks: any[]) => Promise<void>;
        removeFromArchive: (taskId: string) => Promise<void>;
    };
    saveState?: (description: string) => void;
    saveTasks?: () => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    showToast?: (message: string) => void;
    showNotification?: (message: string, type?: string) => void;
}
export declare class ArchiveManager {
    private state;
    private app;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup archive functionality
     */
    setupArchive(): void;
    /**
     * Open archive modal
     */
    openArchiveModal(): void;
    /**
     * Close archive modal
     */
    closeArchiveModal(): void;
    /**
     * Auto-archive old completed tasks
     */
    autoArchiveOldTasks(daysOld?: number): Promise<void>;
    /**
     * Archive multiple tasks
     */
    archiveTasks(tasksToArchive: Task[]): Promise<void>;
    /**
     * Archive a single task
     */
    archiveTask(taskId: string): Promise<void>;
    /**
     * Restore task from archive
     */
    restoreFromArchive(taskId: string): Promise<void>;
    /**
     * Delete task from archive permanently
     */
    deleteFromArchive(taskId: string): Promise<void>;
    /**
     * Render archive with optional search filter
     */
    renderArchive(searchQuery?: string): void;
    /**
     * Populate archive project filter dropdown
     */
    populateArchiveProjectFilter(): void;
    /**
     * Get project title by ID
     * @param projectId - Project ID
     * @returns Project title or empty string
     */
    getProjectTitle(projectId: string): string;
    /**
     * Get archived tasks
     * @returns Array of archived task entries
     */
    getArchivedTasks(): ArchiveEntry[];
    /**
     * Get archive count
     * @returns Number of archived tasks
     */
    getArchiveCount(): number;
    /**
     * Search archived tasks
     * @param query - Search query
     * @returns Filtered archive entries
     */
    searchArchive(query: string): ArchiveEntry[];
}
export {};
//# sourceMappingURL=archive.d.ts.map