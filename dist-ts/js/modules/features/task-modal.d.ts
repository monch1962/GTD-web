/**
 * Task Modal module
 * Handles task creation and editing with comprehensive form support
 *
 * Features:
 * - GTD status management (inbox, next, waiting, someday)
 * - Recurrence patterns (daily, weekly, monthly, yearly)
 * - Task dependencies and subtasks
 * - Natural language parsing integration
 * - Energy and time estimates
 * - Context tags
 * - Project assignment
 *
 * @example
 * const taskModal = new TaskModalManager(state, app);
 * taskModal.openTaskModal(); // Open for new task
 * taskModal.openTaskModal(existingTask); // Open for editing
 * taskModal.openTaskModal(null, 'project-123'); // Open with default project
 */
import { Task, Project, RecurrencePattern } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
    currentView?: string;
    selectedContextFilters?: Set<string>;
}
interface AppInterface {
    saveTasks?: () => Promise<void>;
    saveProjects?: () => Promise<void>;
    saveState?: (action: string) => void;
    renderView?: () => void;
    updateCounts?: () => void;
    updateContextFilter?: () => void;
    renderProjectsDropdown?: () => void;
    showNotification?: (message: string, type: string) => void;
    showToast?: (message: string, type: string) => void;
    openProjectModal?: (project: Project | null, formData?: any) => void;
    normalizeContextName?: (context: string) => string;
    trackTaskUsage?: (task: Task) => void;
}
export declare class TaskModalManager {
    state: AppState;
    app: AppInterface;
    pendingTaskData: any | null;
    /**
     * Create a new TaskModalManager instance
     * @param {Object} state - Application state object
     * @param {Array} state.tasks - Array of tasks
     * @param {Array} state.projects - Array of projects
     * @param {Object} app - Application instance
     * @param {Array} app.tasks - Tasks array (for dependencies)
     * @param {Function} app.openProjectModal - Open project modal
     * @param {Function} app.showNotification - Show toast notification
     * @param {Function} app.saveState - Save state for undo/redo
     * @param {Function} app.saveTasks - Save tasks to storage
     * @param {Function} app.renderView - Re-render current view
     * @param {Function} app.updateCounts - Update task counts
     * @param {Function} app.updateContextFilter - Update context filter UI
     */
    constructor(state: AppState, app: AppInterface);
    /**
     * Open task modal for creating/editing tasks
     * @param {Task} task - Task to edit (null for new task)
     * @param {string} defaultProjectId - Default project ID
     * @param {Object} defaultData - Default data for form fields
     */
    openTaskModal(task?: Task | null, defaultProjectId?: string | null, defaultData?: any): void;
    /**
     * Close task modal
     */
    closeTaskModal(): void;
    /**
     * Populate recurrence form fields
     * @param {string|object} recurrence - Recurrence configuration
     */
    populateRecurrenceInForm(recurrence: string | RecurrencePattern | any): void;
    /**
     * Build recurrence object from form fields
     * @returns {string|object} Recurrence configuration
     */
    buildRecurrenceFromForm(): string | RecurrencePattern;
    /**
     * Get display label for recurrence
     * @param {string|object} recurrence - Recurrence value
     * @returns {string} Human-readable recurrence label
     */
    getRecurrenceLabel(recurrence: string | RecurrencePattern | any): string;
    /**
     * Render subtasks in modal
     * @param {Array} subtasks - Array of subtasks
     */
    renderSubtasksInModal(subtasks: Array<{
        title: string;
        completed: boolean;
    }>): void;
    /**
     * Add a subtask
     */
    addSubtask(): void;
    /**
     * Remove a subtask
     * @param {number} index - Subtask index
     */
    removeSubtask(index: number): void;
    /**
     * Toggle subtask completion
     * @param {number} index - Subtask index
     */
    toggleSubtaskCompletion(index: number): void;
    /**
     * Get subtasks from modal
     * @returns {Array} Array of subtasks
     */
    getSubtasksFromModal(): Array<{
        title: string;
        completed: boolean;
    }>;
    /**
     * Render waiting for tasks list (dependencies)
     * @param {Task} currentTask - Current task being edited
     */
    renderWaitingForTasksList(currentTask: Task | null): void;
    /**
     * Get selected waiting for tasks (dependencies)
     * @returns {Array} Array of task IDs
     */
    getSelectedWaitingForTasks(): string[];
    /**
     * Save task from form data
     */
    saveTaskFromForm(): Promise<void>;
    /**
     * Utility: Escape HTML
     */
    escapeHtml(text: string): string;
}
export {};
//# sourceMappingURL=task-modal.d.ts.map