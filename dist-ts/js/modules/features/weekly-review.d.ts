/**
 * Weekly Review Module
 * Handles GTD weekly review functionality
 *
 * Features:
 * - Weekly review modal with GTD checklist
 * - Review of completed tasks from past week
 * - Overdue tasks identification
 * - Tasks due this week overview
 * - Stalled projects detection
 * - Cleanup actions (empty projects, old tasks, stale projects)
 *
 * @example
 * const weeklyReview = new WeeklyReviewManager(state, app);
 * weeklyReview.setupWeeklyReview();
 * weeklyReview.showWeeklyReview();
 * await weeklyReview.cleanupEmptyProjects();
 */
import { Task, Project } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
}
interface AppDependencies {
    saveProjects?: () => Promise<void>;
    saveTasks?: () => Promise<void>;
    renderView?: () => void;
    renderProjectsDropdown?: () => void;
    updateCounts?: () => void;
    showWarning?: (message: string) => void;
    showSuccess?: (message: string) => void;
    showNotification?: (message: string, type?: string) => void;
    cleanupEmptyProjects?: () => Promise<void>;
    cleanupOldCompletedTasks?: () => Promise<void>;
    markStaleProjectsSomeday?: () => Promise<void>;
}
export declare class WeeklyReviewManager {
    private state;
    private app;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup weekly review functionality
     */
    setupWeeklyReview(): void;
    /**
     * Show weekly review modal
     */
    showWeeklyReview(): void;
    /**
     * Close weekly review modal
     */
    closeWeeklyReview(): void;
    /**
     * Render weekly review content
     */
    renderWeeklyReview(): void;
    /**
     * Cleanup empty projects
     */
    cleanupEmptyProjects(): Promise<void>;
    /**
     * Cleanup old completed tasks
     */
    cleanupOldCompletedTasks(): Promise<void>;
    /**
     * Mark stale projects as Someday
     */
    markStaleProjectsSomeday(): Promise<void>;
}
export {};
//# sourceMappingURL=weekly-review.d.ts.map