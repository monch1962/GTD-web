/**
 * Dashboard module
 * Handles analytics and productivity dashboard
 */
import { Task, Project } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
}
interface AppDependencies {
    showToast?: (message: string, type?: string) => void;
}
interface VelocityTrend {
    value: string;
    label: string;
    icon: string;
    color: string;
}
export declare class DashboardManager {
    private state;
    private app;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup dashboard functionality
     */
    setupDashboard(): void;
    /**
     * Show dashboard modal
     */
    showDashboard(): void;
    /**
     * Close dashboard modal
     */
    closeDashboard(): void;
    /**
     * Render dashboard with all analytics
     */
    renderDashboard(): void;
    /**
     * Format total time tracked
     */
    formatTotalTime(): string;
    /**
     * Get average time per task
     */
    getAverageTimePerTask(): number;
    /**
     * Render time tracking by context
     */
    renderTimeByContext(): string;
    /**
     * Render time tracking by project
     */
    renderTimeByProject(): string;
    /**
     * Render last 7 days chart
     */
    renderLast7DaysChart(): string;
    /**
     * Get last 7 days average
     */
    getLast7DaysAverage(): string;
    /**
     * Get average task lifecycle in days
     */
    getAverageTaskLifecycle(): number;
    /**
     * Get insight about task lifecycle
     */
    getLifecycleInsight(): string;
    /**
     * Get velocity trend
     */
    getVelocityTrend(): VelocityTrend;
    /**
     * Get velocity insight
     */
    getVelocityInsight(): string;
}
export {};
//# sourceMappingURL=dashboard.d.ts.map