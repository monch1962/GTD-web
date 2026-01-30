/**
 * Keyboard Navigation module
 * Provides comprehensive keyboard shortcuts and task navigation
 *
 * Features:
 * - Vim-style navigation (j/k or arrow keys)
 * - Task selection and manipulation
 * - Quick view switching (Ctrl+1-5)
 * - Focus mode toggle
 * - Global shortcuts (Ctrl+K for quick-add, Ctrl+N for suggestions)
 *
 * @example
 * const keyboardNav = new KeyboardNavigation(state, app);
 * keyboardNav.setupKeyboardShortcuts();
 * keyboardNav.selectTask('task-123');
 */
import { Task } from '../../models';
interface AppDependencies {
    showSuggestions?: () => void;
    duplicateTask?: (taskId: string) => Promise<void>;
    openTaskModal?: (task: Task | null) => void;
    toggleTaskComplete?: (taskId: string) => Promise<void>;
    deleteTask?: (taskId: string) => Promise<void>;
    enterFocusMode?: (taskId: string) => void;
    switchView?: (view: string) => void;
    showInfo?: (message: string) => void;
    [key: string]: any;
}
interface AppState {
    tasks: Task[];
    [key: string]: any;
}
export declare class KeyboardNavigation {
    private state;
    private app;
    private selectedTaskId;
    /**
     * Create a new KeyboardNavigation instance
     * @param state - Application state object
     * @param state.tasks - Array of tasks for navigation
     * @param app - Application instance
     * @param app.showSuggestions - Show suggestions modal
     * @param app.duplicateTask - Duplicate selected task
     * @param app.openTaskModal - Open task modal for editing
     * @param app.toggleTaskComplete - Toggle task completion
     * @param app.deleteTask - Delete selected task
     * @param app.enterFocusMode - Enter focus mode for task
     * @param app.switchView - Switch to different view
     * @param app.showInfo - Show info toast notification
     */
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts(): void;
    /**
     * Handle key down events
     * @private
     */
    private _handleKeyDown;
    /**
     * Select a task by ID
     * @param taskId - Task ID to select
     */
    selectTask(taskId: string): void;
    /**
     * Get selected task
     * @returns Selected task or null
     */
    getSelectedTask(): Task | null;
    /**
     * Select next task in list
     * @private
     */
    private _selectNextTask;
    /**
     * Select previous task in list
     * @private
     */
    private _selectPreviousTask;
    /**
     * Edit selected task
     * @private
     */
    private _editSelectedTask;
    /**
     * Toggle selected task completion
     * @private
     */
    private _toggleSelectedTaskComplete;
    /**
     * Duplicate selected task
     * @private
     */
    private _duplicateSelectedTask;
    /**
     * Delete selected task
     * @private
     */
    private _deleteSelectedTask;
    /**
     * Deselect current task
     * @private
     */
    private _deselectTask;
    /**
     * Toggle focus mode for selected task
     * @private
     */
    private _toggleFocusMode;
    /**
     * Focus quick add input
     * @private
     */
    private _focusQuickAdd;
    /**
     * Switch to view based on number key
     * @private
     * @param key - Number key (1-5)
     */
    private _switchToView;
    /**
     * Show keyboard shortcuts help
     * @private
     */
    private _showHelp;
}
export {};
//# sourceMappingURL=keyboard-nav.d.ts.map