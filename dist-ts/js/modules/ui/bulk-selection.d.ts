/**
 * Bulk selection module
 * Handles bulk operations on multiple tasks
 */
import { Task } from '../../models';
interface AppDependencies {
    saveState?: (action: string) => void;
    showNotification?: (message: string, type: string) => void;
    toggleTaskComplete?: (taskId: string) => Promise<void>;
    deleteTask?: (taskId: string) => Promise<void>;
    updateTaskStatus?: (taskId: string, status: string) => Promise<void>;
    updateTaskEnergy?: (taskId: string, energy: string) => Promise<void>;
    updateTaskProject?: (taskId: string, projectId: string | null) => Promise<void>;
    updateTaskContexts?: (taskId: string, contexts: string[]) => Promise<void>;
    updateTaskDueDate?: (taskId: string, dueDate: string | null) => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    saveTasks?: () => Promise<void>;
    [key: string]: any;
}
interface AppState {
    tasks: Task[];
    selectedTaskIds: Set<string>;
    bulkSelectionMode: boolean;
    [key: string]: any;
}
export declare class BulkSelection {
    private state;
    private app;
    private selectedTaskIds;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup bulk selection event listeners
     */
    setupBulkSelection(): void;
    /**
     * Update bulk select button visibility
     */
    updateBulkSelectButtonVisibility(): void;
    /**
     * Toggle bulk selection mode
     */
    toggleBulkSelectionMode(): void;
    /**
     * Enter bulk selection mode
     * @private
     */
    private enterBulkSelectionMode;
    /**
     * Exit bulk selection mode
     * @private
     */
    private exitBulkSelectionMode;
    /**
     * Update task selection UI
     * @private
     */
    private _updateTaskSelectionUI;
    /**
     * Toggle task selection
     * @param taskId - Task ID to toggle
     */
    toggleTaskSelection(taskId: string): void;
    /**
     * Update bulk action buttons state
     * @private
     */
    private _updateBulkActionButtons;
    /**
     * Bulk select all visible tasks
     */
    bulkSelectAllVisible(): void;
    /**
     * Bulk complete selected tasks
     */
    bulkCompleteTasks(): Promise<void>;
    /**
     * Bulk delete selected tasks
     */
    bulkDeleteTasks(): Promise<void>;
    /**
     * Show bulk status menu
     */
    showBulkStatusMenu(): void;
    /**
     * Bulk update task status
     * @param status - New status
     */
    bulkUpdateStatus(status: string): Promise<void>;
    /**
     * Show bulk energy menu
     */
    showBulkEnergyMenu(): void;
    /**
     * Show bulk project menu
     */
    showBulkProjectMenu(): void;
    /**
     * Show bulk context menu
     */
    showBulkContextMenu(): void;
    /**
     * Show bulk due date menu
     */
    showBulkDueDateMenu(): void;
    /**
     * Cancel bulk selection
     */
    cancelBulkSelection(): void;
    /**
     * Get selected task IDs
     * @returns Array of selected task IDs
     */
    getSelectedTaskIds(): string[];
    /**
     * Get count of selected tasks
     * @returns Number of selected tasks
     */
    getSelectedCount(): number;
}
export {};
//# sourceMappingURL=bulk-selection.d.ts.map