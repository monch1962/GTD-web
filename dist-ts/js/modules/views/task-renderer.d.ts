/**
 * Task rendering module with virtual scrolling support
 * Handles task list rendering and individual task element creation
 */
import { Task } from '../../models';
interface AppDependencies {
    saveState?: (action: string) => void;
    showNotification?: (message: string, type: string) => void;
    openTaskModal?: (task: Task | null, defaultProjectId?: string | null, defaultData?: any) => void;
    deleteTask?: (taskId: string) => Promise<void>;
    toggleTaskStar?: (taskId: string) => Promise<void>;
    toggleTaskComplete?: (taskId: string) => Promise<void>;
    startTimer?: (taskId: string) => Promise<void>;
    stopTimer?: (taskId: string) => Promise<void>;
    updateBulkSelectButtonVisibility?: () => void;
    renderView?: () => void;
    updateCounts?: () => void;
    saveTasks?: () => Promise<void>;
    [key: string]: any;
}
interface AppState {
    tasks: Task[];
    projects: any[];
    selectedTaskIds: Set<string>;
    [key: string]: any;
}
export declare class TaskRenderer {
    private state;
    private app;
    private virtualScroll;
    private currentContainer;
    private logger;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Render filtered tasks to container
     * @param container - Container element
     * @param filterFn - Optional filter function
     */
    renderTasks(container: HTMLElement, filterFn?: ((task: Task) => boolean) | null): void;
    /**
     * Render tasks using virtual scrolling (for large lists)
     * @private
     * @param container - Container element
     * @param tasks - Tasks to render
     */
    private _renderWithVirtualScroll;
    /**
     * Render tasks using regular DOM rendering (for small lists)
     * @private
     * @param container - Container element
     * @param tasks - Tasks to render
     */
    private _renderRegular;
    /**
     * Get filtered tasks based on current state
     * @private
     * @param additionalFilter - Optional additional filter
     * @returns Filtered tasks
     */
    private _getFilteredTasks;
    /**
     * Initialize virtual scroll manager
     * @private
     * @param container - Container element
     */
    private _initializeVirtualScroll;
    /**
     * Create task element
     * @param task - Task object
     * @param index - Task index in list
     * @returns Task element
     */
    createTaskElement(task: Task, index: number): HTMLElement;
    /**
     * Build task HTML content
     * @private
     * @param task - Task object
     * @returns HTML string
     */
    private _buildTaskHTML;
    /**
     * Attach event listeners to task element
     * @private
     * @param element - Task element
     * @param task - Task object
     */
    private _attachTaskListeners;
    /**
     * Show task context menu
     * @private
     * @param event - Mouse event
     * @param task - Task object
     * @param element - Task element
     */
    private _showTaskContextMenu;
    /**
     * Toggle task selection for bulk operations
     * @private
     * @param taskId - Task ID
     */
    private _toggleTaskSelection;
    /**
     * Toggle subtask completion
     * @private
     * @param task - Parent task
     * @param subtaskIndex - Subtask index
     */
    private _toggleSubtask;
    /**
     * Render empty state
     * @private
     * @param message - Empty state message
     * @returns HTML string
     */
    private _renderEmptyState;
    /**
     * Scroll to specific task
     * @param taskId - Task ID to scroll to
     */
    scrollToTask(taskId: string): void;
    /**
     * Refresh rendering
     */
    refresh(): void;
    /**
     * Destroy virtual scroll manager
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=task-renderer.d.ts.map