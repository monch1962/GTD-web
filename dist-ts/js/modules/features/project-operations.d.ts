/**
 * Project Operations module
 * Handles CRUD operations for projects
 *
 * Features:
 * - Create new projects
 * - Delete projects (unlinks tasks but doesn't delete them)
 * - Archive/restore projects
 * - Update project health indicators
 *
 * @example
 * const projectOps = new ProjectOperations(state, app);
 * const project = projectOps.createProject({ title: 'My Project' });
 * await projectOps.deleteProject('project-123');
 * await projectOps.archiveProject('project-123');
 */
import { Project } from '../../models';
import type { Task } from '../../models';
interface State {
    projects: Project[];
    tasks: Task[];
}
interface App {
    saveState?: (description: string) => void;
    saveProjects?: () => Promise<void> | void;
    saveTasks?: () => Promise<void> | void;
    renderView?: () => void;
    updateCounts?: () => void;
    renderProjectsDropdown?: () => void;
    showNotification?: (message: string) => void;
}
export declare class ProjectOperations {
    private state;
    private app;
    /**
     * Create a new ProjectOperations instance
     * @param state - Application state object
     * @param app - Application instance
     */
    constructor(state: State, app: App);
    /**
     * Create a new project
     * @param projectData - Project data
     * @returns Created project
     */
    createProject(projectData: Record<string, any>): Project;
    /**
     * Delete a project
     * @param projectId - Project ID to delete
     */
    deleteProject(projectId: string): Promise<void>;
    /**
     * Archive a project
     * @param projectId - Project ID to archive
     */
    archiveProject(projectId: string): Promise<void>;
    /**
     * Restore an archived project
     * @param projectId - Project ID to restore
     */
    restoreProject(projectId: string): Promise<void>;
    /**
     * Update project positions after drag-and-drop reordering
     */
    updateProjectPositions(): Promise<void>;
    /**
     * Get project by ID
     * @param projectId - Project ID
     * @returns Project object or null
     */
    getProjectById(projectId: string): Project | null;
    /**
     * Get active projects
     * @returns Array of active projects
     */
    getActiveProjects(): Project[];
    /**
     * Get archived projects
     * @returns Array of archived projects
     */
    getArchivedProjects(): Project[];
    /**
     * Get projects for a specific status
     * @param status - Project status
     * @returns Array of projects
     */
    getProjectsByStatus(status: string): Project[];
    /**
     * Get tasks for a project
     * @param projectId - Project ID
     * @returns Array of tasks
     */
    getTasksForProject(projectId: string): Task[];
    /**
     * Get incomplete tasks for a project
     * @param projectId - Project ID
     * @returns Array of incomplete tasks
     */
    getIncompleteTasksForProject(projectId: string): Task[];
    /**
     * Get completed tasks for a project
     * @param projectId - Project ID
     * @returns Array of completed tasks
     */
    getCompletedTasksForProject(projectId: string): Task[];
    /**
     * Calculate project completion percentage
     * @param projectId - Project ID
     * @returns Completion percentage (0-100)
     */
    getProjectCompletion(projectId: string): number;
    /**
     * Get project statistics
     * @param projectId - Project ID
     * @returns Project statistics
     */
    getProjectStats(projectId: string): {
        total: number;
        completed: number;
        incomplete: number;
        overdue: number;
        completionPercent: number;
    };
    /**
     * Update project
     * @param projectId - Project ID
     * @param updates - Properties to update
     */
    updateProject(projectId: string, updates: Record<string, any>): Promise<void>;
    /**
     * Search projects by title
     * @param query - Search query
     * @returns Matching projects
     */
    searchProjects(query: string): Project[];
}
export {};
//# sourceMappingURL=project-operations.d.ts.map