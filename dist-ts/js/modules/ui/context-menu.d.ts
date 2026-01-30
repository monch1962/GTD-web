/**
 * Context menu module
 * Handles right-click context menu for tasks
 */
import { Task, Project } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
}
interface AppDependencies {
    openTaskModal?: (task: Task) => void;
    duplicateTask?: (taskId: string) => Promise<void>;
    saveTaskAsTemplate?: (taskId: string) => void;
    saveState?: (description: string) => void;
    saveTasks?: () => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    showToast?: (message: string) => void;
    showNotification?: (message: string, type?: string) => void;
    showWarning?: (message: string) => void;
    showError?: (message: string) => void;
}
interface SyntheticEvent {
    clientX: number;
    clientY: number;
    pageX?: number;
    pageY?: number;
    preventDefault: () => void;
}
export declare class ContextMenuManager {
    private state;
    private app;
    private contextMenuTaskId;
    private longPressTimer;
    private touchStartPos;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup context menu functionality
     */
    setupContextMenu(): void;
    /**
     * Show context menu at position
     */
    showContextMenu(event: MouseEvent | SyntheticEvent, taskId: string): void;
    /**
     * Hide context menu
     */
    hideContextMenu(): void;
    /**
     * Populate projects submenu in context menu
     */
    populateContextMenuProjects(): void;
    /**
     * Handle context menu action
     */
    handleContextMenuAction(action: string, data: DOMStringMap, taskId: string): Promise<void>;
    /**
     * Populate add context submenu
     */
    populateAddContextMenu(taskId: string): void;
    /**
     * Populate remove context submenu
     */
    populateRemoveContextMenu(taskId: string): void;
    /**
     * Get custom contexts from localStorage
     */
    getCustomContexts(): string[];
    /**
     * Get current context menu task ID
     */
    getContextMenuTaskId(): string | null;
    /**
     * Check if context menu is visible
     */
    isContextMenuVisible(): boolean;
}
export {};
//# sourceMappingURL=context-menu.d.ts.map