/**
 * View manager - orchestrates view switching and rendering
 */
import { TaskRenderer } from './task-renderer';
import { ProjectRenderer } from './project-renderer';
import type { Task, Project, Template } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
    templates: Template[];
    currentView: string;
    currentProjectId: string | null;
    showingArchivedProjects: boolean;
    selectedContextFilters: Set<string>;
}
interface AppDependencies {
    openGanttChart?: (project: Project) => void;
    updateBulkSelectButtonVisibility?: () => void;
    openReferenceModal?: (ref: Task) => void;
    deleteReference?: (id: string) => void;
}
export declare class ViewManager {
    private state;
    private app;
    private taskRenderer;
    private projectRenderer;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Switch to a different view
     * @param view - View name
     */
    switchView(view: string): void;
    /**
     * View tasks for a specific project
     * @param projectId - Project ID
     */
    viewProjectTasks(projectId: string): void;
    /**
     * Render the current view
     */
    renderView(): void;
    /**
     * Render reference items
     */
    renderReference(): void;
    /**
     * Update count badges in navigation
     */
    updateCounts(): void;
    /**
     * Update context filter dropdown
     */
    updateContextFilter(): void;
    /**
     * Update navigation active state
     * @private
     */
    private _updateNavigationActiveState;
    /**
     * Update view title
     * @private
     */
    private _updateViewTitle;
    /**
     * Toggle container visibility
     * @private
     */
    private _toggleContainers;
    /**
     * Show tasks container
     * @private
     */
    private _showTasksContainer;
    /**
     * Create reference element
     * @private
     */
    private _createReferenceElement;
    /**
     * Update count element
     * @private
     */
    private _updateCount;
    /**
     * Render empty state
     * @private
     */
    private _renderEmptyState;
    /**
     * Get task renderer instance
     */
    getTaskRenderer(): TaskRenderer;
    /**
     * Get project renderer instance
     */
    getProjectRenderer(): ProjectRenderer;
    /**
     * Refresh current view
     */
    refresh(): void;
    /**
     * Clean up
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=view-manager.d.ts.map