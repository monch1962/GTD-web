/**
 * Undo/Redo system module
 * Manages history and provides undo/redo functionality
 */
import { Task } from '../../models';
import { Project } from '../../models';
interface HistoryEntry {
    action: string;
    timestamp: string;
    stateSnapshot: {
        tasks: Task[];
        projects: Project[];
        [key: string]: any;
    };
}
interface AppDependencies {
    showNotification?: (message: string, type: string) => void;
    renderView?: () => void;
    updateCounts?: () => void;
    saveTasks?: () => Promise<void>;
    saveProjects?: () => Promise<void>;
    [key: string]: any;
}
interface AppState {
    tasks: Task[];
    projects: Project[];
    [key: string]: any;
}
export declare class UndoRedoManager {
    private state;
    private app;
    private history;
    private historyIndex;
    private maxHistorySize;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup undo/redo event listeners
     */
    setupUndoRedo(): void;
    /**
     * Save current state to history
     * @param action - Description of the action being saved
     */
    saveState(action: string): void;
    /**
     * Undo last action
     */
    undo(): void;
    /**
     * Redo last undone action
     */
    redo(): void;
    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons(): void;
    /**
     * Deep copy an object
     * @private
     * @param obj - Object to copy
     * @returns Deep copy of the object
     */
    private _deepCopy;
    /**
     * Clear all history
     */
    clearHistory(): void;
    /**
     * Get history entry at index
     * @param index - History index
     * @returns History entry or null
     */
    getHistoryEntry(index: number): HistoryEntry | null;
}
export {};
//# sourceMappingURL=undo-redo.d.ts.map