/**
 * Daily Review Manager
 * Handles daily review modal with urgent tasks overview
 *
 * Features:
 * - Daily review modal with urgent tasks overview
 * - Task filtering by due date (today, overdue, this week)
 * - High priority task identification
 * - Personalized greeting messages
 * - Quick statistics display
 *
 * @example
 * const dailyReview = new DailyReviewManager(state, app);
 * dailyReview.setupDailyReview();
 * dailyReview.showDailyReview();
 * const greeting = dailyReview.getGreetingMessage();
 */
import { Task, Project } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
}
interface AppDependencies {
    showToast?: (message: string) => void;
    showNotification?: (message: string, type: string) => void;
}
export declare class DailyReviewManager {
    private state;
    private app;
    /**
     * @param state - The application state object
     * @param app - The main app instance for delegation
     */
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup daily review modal event listeners
     */
    setupDailyReview(): void;
    /**
     * Show daily review modal
     */
    showDailyReview(): void;
    /**
     * Close daily review modal
     */
    closeDailyReview(): void;
    /**
     * Render daily review content
     */
    renderDailyReview(): void;
    /**
     * Render a single task in the daily review list
     * @param task - Task object
     * @param type - Type of task list (today, overdue, week, priority)
     */
    renderDailyReviewTask(task: Task, _type: string): string;
    /**
     * Get greeting based on time of day
     * @returns Greeting (Morning, Afternoon, or Evening)
     */
    getGreeting(): string;
    /**
     * Get personalized greeting message
     * @returns Personalized greeting with task count
     */
    getGreetingMessage(): string;
    /**
     * Get project title by ID
     * @param projectId - Project ID
     * @returns Project title or 'Unknown Project'
     */
    getProjectTitle(projectId: string): string;
}
export {};
//# sourceMappingURL=daily-review.d.ts.map