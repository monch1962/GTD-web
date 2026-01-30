/**
 * ============================================================================
 * Productivity Heatmap Manager
 * ============================================================================
 *
 * Manages the GitHub-style productivity heatmap visualization showing
 * task completion activity over the last 365 days.
 *
 * This manager handles:
 * - Heatmap modal display and control
 * - 365-day completion data aggregation
 * - Statistics calculation (total, best day, average, streak)
 * - GitHub-style heatmap grid rendering
 * - Interactive tooltips showing daily completion counts
 * - Month and day labels
 *
 * @example
 * const heatmap = new ProductivityHeatmapManager(state, app);
 * heatmap.setupProductivityHeatmap();
 * heatmap.openHeatmapModal();
 * heatmap.renderProductivityHeatmap();
 */
import { Task, Project } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
}
interface AppDependencies {
}
interface CompletionData {
    [dateKey: string]: number;
}
export declare class ProductivityHeatmapManager {
    private state;
    private app;
    /**
     * @param state - The application state object
     * @param app - The main app instance for delegation
     */
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup the productivity heatmap feature
     */
    setupProductivityHeatmap(): void;
    /**
     * Open the heatmap modal
     */
    openHeatmapModal(): void;
    /**
     * Close the heatmap modal
     */
    closeHeatmapModal(): void;
    /**
     * Render the productivity heatmap
     */
    renderProductivityHeatmap(): void;
    /**
     * Build completion data for date range
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Completion data with date keys
     */
    buildCompletionData(startDate: Date, endDate: Date): CompletionData;
    /**
     * Get date key in YYYY-MM-DD format
     * @param date - Date to format
     * @returns Formatted date key
     */
    getDateKey(date: Date): string;
    /**
     * Update heatmap statistics display
     * @param completionData - Completion data
     */
    updateHeatmapStats(completionData: CompletionData): void;
    /**
     * Calculate current completion streak
     * @param completionData - Completion data
     * @returns Current streak in days
     */
    calculateCurrentStreak(completionData: CompletionData): number;
    /**
     * Render the heatmap grid
     * @param completionData - Completion data
     * @param days - Number of days to display
     * @param container - Container element
     */
    renderHeatmapGrid(completionData: CompletionData, days: number, container: HTMLElement): void;
    /**
     * Get heatmap level (0-4) for color intensity
     * @param count - Task count for the day
     * @param maxCount - Maximum count in the dataset
     * @returns Level from 0-4
     */
    getHeatmapLevel(count: number, maxCount: number): number;
    /**
     * Create month labels for the heatmap
     * @param startDate - Start date
     * @param endDate - End date
     * @returns HTML string of month labels
     */
    createMonthLabels(startDate: Date, endDate: Date): string;
    /**
     * Setup interactive tooltips for heatmap cells
     */
    setupHeatmapTooltips(): void;
}
export {};
//# sourceMappingURL=productivity-heatmap.d.ts.map