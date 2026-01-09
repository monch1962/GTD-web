/**
 * ============================================================================
 * Time Tracking Manager
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

export class TimeTrackingManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;

        // Initialize timer state properties
        this.state.timerInterval = null;
        this.state.currentTimerTask = null;
        this.state.timerStartTime = null;
    }

    // =========================================================================
    // SETUP
    // =========================================================================

    /**
     * Setup time tracking feature
     */
    setupTimeTracking() {
        // Time tracking is handled per-task in the task element creation
        // This method is for global time tracking setup
        console.log('[Time Tracking] Time tracking initialized');
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Start timer for a specific task
     * @param {string} taskId - Task ID to start timer for
     */
    startTaskTimer(taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Stop any existing timer
        if (this.state.timerInterval) {
            this.stopTaskTimer();
        }

        // Start new timer
        this.state.currentTimerTask = taskId;
        this.state.timerStartTime = Date.now();

        const timerBtn = document.querySelector(`[data-task-id="${taskId}"] .btn-timer`);
        if (timerBtn) {
            timerBtn.classList.add('active');
            timerBtn.innerHTML = '<i class="fas fa-stop"></i>';
        }

        // Update timer display every second
        this.state.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.state.timerStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;

            const timerDisplay = document.querySelector(`[data-task-id="${taskId}"] .timer-display`);
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);

        this.app.showToast?.('Timer started', 'info');
    }

    /**
     * Stop the currently running timer
     */
    async stopTaskTimer() {
        if (!this.state.timerInterval || !this.state.currentTimerTask) return;

        clearInterval(this.state.timerInterval);
        this.state.timerInterval = null;

        const elapsedMinutes = Math.floor((Date.now() - this.state.timerStartTime) / 1000 / 60);

        const task = this.state.tasks.find(t => t.id === this.state.currentTimerTask);
        if (task) {
            task.timeSpent = (task.timeSpent || 0) + elapsedMinutes;
            task.updatedAt = new Date().toISOString();
            await this.app.saveTasks?.();
            this.app.renderView?.();
        }

        const timerBtn = document.querySelector(`[data-task-id="${this.state.currentTimerTask}"] .btn-timer`);
        if (timerBtn) {
            timerBtn.classList.remove('active');
            timerBtn.innerHTML = '<i class="fas fa-play"></i>';
        }

        this.state.currentTimerTask = null;
        this.state.timerStartTime = null;

        this.app.showToast?.(`Timer stopped. Added ${elapsedMinutes} minutes.`, 'success');
    }
}
