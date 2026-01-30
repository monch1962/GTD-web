/**
 * Focus Mode and Pomodoro Timer module
 * Handles focus mode for single-task concentration and Pomodoro timer
 */
import { Task } from '../../models';
interface AppState {
    tasks: Task[];
}
interface AppDependencies {
    getSmartSuggestions?: (options: {
        maxSuggestions: number;
    }) => Array<{
        task: Task;
        reasons: string[];
    }>;
    showWarning?: (message: string) => void;
    showError?: (message: string) => void;
    showNotification?: (message: string, type?: string) => void;
    showToast?: (message: string) => void;
    saveTasks?: () => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    toggleSubtask?: (taskId: string, subtaskIndex: number) => Promise<void>;
}
export declare class FocusPomodoroManager {
    private state;
    private app;
    private pomodoroTimer;
    private pomodoroTimeLeft;
    private pomodoroIsRunning;
    private pomodoroIsBreak;
    private focusTaskId;
    private focusModeStartTime;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup focus mode and pomodoro timer
     */
    setupFocusMode(): void;
    /**
     * Enter focus mode for a task
     * @param taskId - Task ID to focus on (optional)
     */
    enterFocusMode(taskId?: string | null): void;
    /**
     * Render focused task in focus mode overlay
     * @param task - Task object
     */
    renderFocusTask(task: Task): void;
    /**
     * Exit focus mode
     */
    exitFocusMode(): void;
    /**
     * Start Pomodoro timer
     */
    startPomodoro(): void;
    /**
     * Pause Pomodoro timer
     */
    pausePomodoro(): void;
    /**
     * Reset Pomodoro timer
     */
    resetPomodoro(): void;
    /**
     * Handle Pomodoro timer completion
     */
    handlePomodoroComplete(): void;
    /**
     * Update Pomodoro timer display
     */
    updatePomodoroDisplay(): void;
    /**
     * Update Pomodoro control buttons
     */
    updatePomodoroButtons(): void;
    /**
     * Format time for display
     * @param seconds - Time in seconds
     * @returns Formatted time string
     */
    formatTime(seconds: number): string;
    /**
     * Get current focus task
     * @returns Current focus task or null
     */
    getFocusTask(): Task | null;
    /**
     * Check if focus mode is active
     * @returns Boolean indicating if focus mode is active
     */
    isFocusModeActive(): boolean;
    /**
     * Get focus session duration
     * @returns Duration in milliseconds or null if not active
     */
    getFocusDuration(): number | null;
    /**
     * Toggle subtask from focus mode (called from inline onclick)
     * This is a wrapper that can be called from the inline onclick handler
     */
    toggleSubtaskFromFocus(taskId: string, subtaskIndex: number): Promise<void>;
}
export {};
//# sourceMappingURL=focus-pomodoro.d.ts.map