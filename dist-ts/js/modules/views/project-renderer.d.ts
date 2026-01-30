/**
 * Project rendering module
 * Handles project list rendering and project element creation
 */
import { Project } from '../../models';
interface AppDependencies {
    saveState?: (action: string) => void;
    showNotification?: (message: string, type: string) => void;
    openProjectModal?: (project: Project | null) => void;
    deleteProject?: (projectId: string) => Promise<void>;
    archiveProject?: (projectId: string) => Promise<void>;
    unarchiveProject?: (projectId: string) => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    saveProjects?: () => Promise<void>;
    [key: string]: any;
}
interface AppState {
    projects: Project[];
    filters: {
        context?: string;
    };
    showingArchivedProjects?: boolean;
    [key: string]: any;
}
export declare class ProjectRenderer {
    private state;
    private app;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Render projects to container
     * @param container - Container element
     */
    renderProjects(container: HTMLElement): void;
    /**
     * Create project card element
     * @param project - Project object
     * @returns Project card element
     */
    createProjectCard(project: Project): HTMLElement;
    /**
     * Attach event listeners to project card
     * @private
     * @param card - Project card element
     * @param project - Project object
     */
    private _attachProjectCardListeners;
    /**
     * View project tasks
     * @private
     * @param project - Project object
     */
    private _viewProjectTasks;
    /**
     * Render archive header with toggle button
     * @private
     * @param container - Container element
     * @param showingArchived - Whether archived projects are currently shown
     * @param archivedCount - Number of archived projects
     */
    private _renderArchiveHeader;
    /**
     * Toggle archived projects visibility
     * @private
     */
    private _toggleArchivedProjects;
    /**
     * Render empty state
     * @private
     * @param message - Empty state message
     * @returns HTML string
     */
    private _renderEmptyState;
    /**
     * Clean up
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=project-renderer.d.ts.map