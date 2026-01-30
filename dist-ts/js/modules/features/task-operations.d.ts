/**
 * Task Operations module
 * Handles CRUD operations for tasks
 *
 * Features:
 * - Quick add with natural language parsing
 * - Duplicate tasks
 * - Toggle completion
 * - Bulk operations
 * - Task status management
 *
 * @example
 * const taskOps = new TaskOperations(state, app);
 * await taskOps.quickAddTask('Call mom tomorrow');
 * await taskOps.duplicateTask('task-123');
 * await taskOps.toggleTaskComplete('task-123');
 */
import { Task, TaskData } from '../../models';
interface AppState {
    tasks: Task[];
    currentView: string;
    currentProjectId: string | null;
    trackTaskUsage: (task: Task) => void;
}
interface ParserResult {
    title?: string;
    contexts?: string[];
    energy?: string;
    time?: number;
    dueDate?: string | null;
    recurrence?: string;
}
interface AppParser {
    parse: (title: string) => ParserResult;
}
interface AppDependencies {
    parser?: AppParser;
    saveState?: (description: string) => void;
    saveTasks?: () => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    updateContextFilter?: () => void;
    renderProjectsDropdown?: () => void;
    showSuccess?: (message: string) => void;
    showWarning?: (message: string) => void;
    showError?: (message: string) => void;
    showToast?: (message: string) => void;
    showNotification?: (message: string) => void;
}
export declare class TaskOperations {
    private state;
    private app;
    private logger;
    /**
     * Create a new TaskOperations instance
     * @param state - Application state object
     * @param app - Application instance
     */
    constructor(state: AppState, app: AppDependencies);
    /**
     * Quick add a task from title
     * @param title - Task title (may contain NLP)
     */
    quickAddTask(title: string): Promise<void>;
    /**
     * Duplicate a task
     * @param taskId - Task ID to duplicate
     */
    duplicateTask(taskId: string): Promise<void>;
    /**
     * Toggle task completion status
     * @param taskId - Task ID
     */
    toggleTaskComplete(taskId: string): Promise<void>;
    /**
     * Delete a task
     * @param taskId - Task ID to delete
     */
    deleteTask(taskId: string): Promise<void>;
    /**
     * Migrate blocked tasks to Waiting status
     * One-time migration for existing data
     * @returns Number of tasks migrated
     */
    migrateBlockedTasksToWaiting(): Promise<number>;
    /**
     * Check waiting tasks and move to Next if dependencies are met
     * @returns Number of tasks moved
     */
    checkWaitingTasksDependencies(): Promise<number>;
    /**
     * Update task positions after drag-and-drop reordering
     */
    updateTaskPositions(): Promise<void>;
    /**
     * Get task by ID
     * @param taskId - Task ID
     * @returns Task object or null
     */
    getTaskById(taskId: string): Task | null;
    /**
     * Update a task
     * @param taskId - Task ID
     * @param updates - Properties to update
     */
    updateTask(taskId: string, updates: Partial<TaskData>): Promise<void>;
    /**
     * Assign task to project
     * @param taskId - Task ID
     * @param projectId - Project ID (null to unassign)
     */
    assignTaskToProject(taskId: string, projectId: string | null): Promise<void>;
    /**
     * Add time spent to task
     * @param taskId - Task ID
     * @param minutes - Minutes to add
     */
    addTimeSpent(taskId: string, minutes: number): Promise<void>;
    /**
     * Get tasks for project
     * @param projectId - Project ID
     * @returns Array of tasks
     */
    getTasksForProject(projectId: string): Task[];
    /**
     * Get active tasks (not completed)
     * @returns Array of active tasks
     */
    getActiveTasks(): Task[];
    /**
     * Get completed tasks
     * @returns Array of completed tasks
     */
    getCompletedTasks(): Task[];
    /**
     * Search tasks by title
     * @param query - Search query
     * @returns Matching tasks
     */
    searchTasks(query: string): Task[];
}
export {};
//# sourceMappingURL=task-operations.d.ts.map