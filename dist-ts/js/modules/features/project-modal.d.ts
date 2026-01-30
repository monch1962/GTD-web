/**
 * Project Modal module
 * Handles project creation, editing, and Gantt chart visualization
 *
 * @example
 * const projectModal = new ProjectModalManager(state, app);
 * projectModal.openProjectModal(); // Open for new project
 * projectModal.openProjectModal(existingProject); // Open for editing
 * projectModal.openGanttChart(existingProject); // Show Gantt chart
 */
import { Project, Task } from '../../models';
interface AppState {
    projects: Project[];
}
interface AppDependencies {
    projects?: Project[];
    tasks?: Task[];
    showNotification?: (message: string, type?: string) => void;
    saveState?: (action: string) => void;
    saveProjects?: () => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    renderProjectsDropdown?: () => void;
    updateContextFilter?: () => void;
    openTaskModal?: (task: Task | null, projectId?: string, pendingData?: any) => void;
}
interface PendingTaskData {
    title?: string;
    description?: string;
}
export declare class ProjectModalManager {
    private state;
    private app;
    private pendingTaskData;
    /**
     * Create a new ProjectModalManager instance
     * @param state - Application state object
     * @param app - Application instance
     */
    constructor(state: AppState, app: AppDependencies);
    /**
     * Open project modal for creating/editing projects
     *
     * @param project - Project to edit (null for new project)
     * @param pendingTaskData - Pending task data when creating project from task modal
     * @returns void
     *
     * @example
     * // Open modal for new project
     * manager.openProjectModal();
     *
     * // Open modal for editing existing project
     * manager.openProjectModal(existingProject);
     *
     * // Open modal with pending task data
     * manager.openProjectModal(null, { title: 'My Task' });
     */
    openProjectModal(project?: Project | null, pendingTaskData?: PendingTaskData | null): void;
    /**
     * Close project modal
     */
    closeProjectModal(): void;
    /**
     * Save project from form
     */
    saveProjectFromForm(): Promise<void>;
    /**
     * Open Gantt chart modal for a project
     * @param project - Project to show Gantt chart for
     */
    openGanttChart(project: Project): void;
    /**
     * Close Gantt chart modal
     */
    closeGanttModal(): void;
    /**
     * Render Gantt chart for a project
     * @param project - Project to render Gantt chart for
     */
    renderGanttChart(project: Project): void;
    /**
     * Escape HTML to prevent XSS
     * @param text - Text to escape
     * @returns Escaped text
     */
    escapeHtml(text: string): string;
}
export {};
//# sourceMappingURL=project-modal.d.ts.map