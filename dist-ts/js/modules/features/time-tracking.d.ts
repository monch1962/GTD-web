/**
 * ============================================================================
 * Time Tracking Manager - TypeScript Version
 * ============================================================================
 *
 * Manages per-task time tracking with a stopwatch feature.
 *
 * This manager handles:
 * - Task timer start/stop functionality
 * - Real-time MM:SS display updates
 * - Time accumulation to task.timeSpent
 * - Visual feedback for active timer state
 */
import { Task } from "../../models";
/**
 * App interface for type safety
 */
interface App {
    saveTasks?: () => Promise<void>;
    renderView?: () => void;
    showToast?: (message: string, type?: string) => void;
}
/**
 * State interface for time tracking
 */
interface State {
    tasks: Task[];
    timerInterval: NodeJS.Timeout | null;
    currentTimerTask: string | null;
    timerStartTime: number | null;
}
export declare class TimeTrackingManager {
    private state;
    private app;
    private logger;
    constructor(state: State, app: App);
    /**
     * Setup time tracking feature
     */
    setupTimeTracking(): void;
    /**
     * Start timer for a specific task
     * @param {string} taskId - Task ID to start timer for
     */
    startTaskTimer(taskId: string): void;
    /**
     * Stop the currently running timer
     */
    stopTaskTimer(): Promise<void>;
}
export {};
//# sourceMappingURL=time-tracking.d.ts.map