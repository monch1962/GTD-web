/**
 * ============================================================================
 * Subtasks Manager - TypeScript Version
 * ============================================================================
 *
 * Manages the subtasks feature for breaking down tasks into smaller steps.
 *
 * This manager handles:
 * - Rendering subtasks in the task modal
 * - Adding new subtasks
 * - Removing subtasks
 * - Toggling subtask completion status
 * - Extracting subtasks from the modal UI
 */
/**
 * App interface for type safety
 */
interface App {
}
/**
 * State interface for subtasks
 */
interface State {
}
/**
 * Subtask interface
 */
interface Subtask {
    title: string;
    completed: boolean;
}
export declare class SubtasksManager {
    private state;
    private app;
    constructor(state: State, app: App);
    /**
     * Render subtasks in the task modal
     * @param {Array} subtasks - Array of subtask objects
     */
    renderSubtasksInModal(subtasks: Subtask[]): void;
    /**
     * Add a new subtask from the input field
     */
    addSubtask(): void;
    /**
     * Remove a subtask by index
     * @param {number} index - Index of subtask to remove
     */
    removeSubtask(index: number): void;
    /**
     * Toggle the completion status of a subtask
     * @param {number} index - Index of subtask to toggle
     */
    toggleSubtaskCompletion(index: number): void;
    /**
     * Extract subtasks from the modal UI
     * @returns {Array} Array of subtask objects
     */
    getSubtasksFromModal(): Subtask[];
}
export {};
//# sourceMappingURL=subtasks.d.ts.map