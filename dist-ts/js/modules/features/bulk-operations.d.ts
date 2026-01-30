/**
 * ============================================================================
 * Bulk Operations Manager
 * ============================================================================
 *
 * Manages the bulk selection and operations feature for multiple tasks.
 *
 * This manager handles:
 * - Bulk selection mode toggle
 * - Task selection tracking (Set of task IDs)
 * - Bulk actions: complete, delete, set status, energy, project, context, due date
 * - UI updates for selection state and button visibility
 * - Selection of all visible tasks
 */
import { Task } from '../../models';
interface AppState {
    tasks: Task[];
    projects: any[];
    bulkSelectionMode: boolean;
    selectedTaskIds: Set<string>;
}
interface AppDependencies {
    renderView?: () => void;
    renderProjectsDropdown?: () => void;
    updateCounts?: () => void;
    saveState?: (description: string) => void;
    saveTasks?: () => Promise<void>;
    showToast?: (message: string) => void;
    showNotification?: (message: string, type?: string) => void;
}
export declare class BulkOperationsManager {
    private state;
    private app;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup bulk selection feature
     */
    setupBulkSelection(): void;
    /**
     * Update bulk select button visibility based on task count
     */
    updateBulkSelectButtonVisibility(): void;
    /**
     * Toggle bulk selection mode
     */
    toggleBulkSelectionMode(): void;
    /**
     * Exit bulk selection mode
     */
    exitBulkSelectionMode(): void;
    /**
     * Toggle task selection in bulk mode
     * @param taskId - Task ID to toggle
     */
    toggleBulkTaskSelection(taskId: string): void;
    /**
     * Update selected count display and button states
     */
    updateBulkSelectedCount(): void;
    /**
     * Complete all selected tasks
     */
    bulkCompleteTasks(): Promise<void>;
    /**
     * Select all visible tasks
     */
    bulkSelectAllVisible(): void;
    /**
     * Set status for all selected tasks
     */
    bulkSetStatus(): Promise<void>;
    /**
     * Set energy level for all selected tasks
     */
    bulkSetEnergy(): Promise<void>;
    /**
     * Move all selected tasks to a project
     */
    bulkSetProject(): Promise<void>;
    /**
     * Add context to all selected tasks
     */
    bulkAddContext(): Promise<void>;
    /**
     * Set due date for all selected tasks
     */
    bulkSetDueDate(): Promise<void>;
    /**
     * Delete all selected tasks
     */
    bulkDeleteTasks(): Promise<void>;
}
export {};
//# sourceMappingURL=bulk-operations.d.ts.map