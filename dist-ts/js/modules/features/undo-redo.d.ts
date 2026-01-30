/**
 * ============================================================================
 * Undo/Redo Manager - TypeScript Version
 * ============================================================================
 *
 * Manages the undo/redo history system for the application.
 *
 * This manager handles:
 * - State history tracking (tasks and projects)
 * - Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
 * - Undo/redo button state management
 * - History size limiting (max 50 states)
 * - State restoration with UI updates
 */
import { Task, Project } from '../../models';
/**
 * App interface for type safety
 */
interface App {
    saveTasks?: () => Promise<void>;
    saveProjects?: () => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    renderProjectsDropdown?: () => void;
    showNotification?: (message: string) => void;
}
/**
 * State interface for undo/redo
 */
interface State {
    tasks: Task[];
    projects: Project[];
    history: HistoryState[];
    historyIndex: number;
    maxHistorySize: number;
}
/**
 * History state interface
 */
interface HistoryState {
    action: string;
    tasks: any[];
    projects: any[];
    timestamp: string;
}
export declare class UndoRedoManager {
    private state;
    private app;
    constructor(state: State, app: App);
    /**
     * Setup the undo/redo system
     */
    setupUndoRedo(): void;
    /**
     * Save current state to history
     * @param {string} action - Description of the action
     */
    saveState(action: string): void;
    /**
     * Undo to previous state
     */
    undo(): Promise<void>;
    /**
     * Redo to next state
     */
    redo(): Promise<void>;
    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons(): void;
}
export {};
//# sourceMappingURL=undo-redo.d.ts.map