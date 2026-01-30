/**
 * ============================================================================
 * Priority Scoring Manager - TypeScript Version
 * ============================================================================
 *
 * Calculates task priority scores based on multiple factors.
 *
 * This manager handles:
 * - Priority score calculation (0-100 scale)
 * - Score-to-color mapping for visual display
 * - Score-to-label mapping for user feedback
 *
 * Scoring factors:
 * - Due date urgency (0-25 points)
 * - Starred tasks (0-15 points)
 * - Task status priority (0-10 points)
 * - Dependencies (0-10 points or -10 penalty)
 * - Energy vs available time (0-8 points or -5 penalty)
 * - Time estimate (0-5 points)
 * - Project priority (0-5 points)
 * - Defer date (0-20 points penalty)
 * - Age of task (0-7 points)
 */
import { Task, Project } from "../../models";
/**
 * App interface for type safety
 */
interface App {
}
/**
 * State interface for priority scoring
 */
interface State {
    tasks: Task[];
    projects: Project[];
}
export declare class PriorityScoringManager {
    private state;
    private app;
    constructor(state: State, app: App);
    /**
     * Calculate priority score for a task (0-100 scale)
     * @param {Task} task - Task to score
     * @returns {number} Priority score from 0-100
     */
    calculatePriorityScore(task: Task): number;
    /**
     * Get priority score color for visual display
     * @param {number} score - Priority score (0-100)
     * @returns {string} CSS color value
     */
    getPriorityScoreColor(score: number): string;
    /**
     * Get priority label for user feedback
     * @param {number} score - Priority score (0-100)
     * @returns {string} Priority label
     */
    getPriorityLabel(score: number): string;
    /**
     * Get days until due date
     * @param {Task} task - Task to check
     * @returns {number|null} Days until due, or null if no due date
     */
    private getDaysUntilDue;
}
export {};
//# sourceMappingURL=priority-scoring.d.ts.map