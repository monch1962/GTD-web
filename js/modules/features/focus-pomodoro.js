/**
 * Focus Mode and Pomodoro Timer module
 * Handles focus mode for single-task concentration and Pomodoro timer
 */

import { escapeHtml } from '../../dom-utils.js';

export class FocusPomodoroManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;

        // Pomodoro timer state
        this.pomodoroTimer = null;
        this.pomodoroTimeLeft = 25 * 60; // 25 minutes in seconds
        this.pomodoroIsRunning = false;
        this.pomodoroIsBreak = false;

        // Focus mode state
        this.focusTaskId = null;
        this.focusModeStartTime = null;
    }

    /**
     * Setup focus mode and pomodoro timer
     */
    setupFocusMode() {
        const focusBtn = document.getElementById('btn-focus-mode');
        const exitFocusBtn = document.getElementById('btn-exit-focus');
        const pomodoroStartBtn = document.getElementById('btn-pomodoro-start');
        const pomodoroPauseBtn = document.getElementById('btn-pomodoro-pause');
        const pomodoroResetBtn = document.getElementById('btn-pomodoro-reset');

        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                this.enterFocusMode();
            });
        }

        if (exitFocusBtn) {
            exitFocusBtn.addEventListener('click', () => {
                this.exitFocusMode();
            });
        }

        if (pomodoroStartBtn) {
            pomodoroStartBtn.addEventListener('click', () => {
                this.startPomodoro();
            });
        }

        if (pomodoroPauseBtn) {
            pomodoroPauseBtn.addEventListener('click', () => {
                this.pausePomodoro();
            });
        }

        if (pomodoroResetBtn) {
            pomodoroResetBtn.addEventListener('click', () => {
                this.resetPomodoro();
            });
        }
    }

    /**
     * Enter focus mode for a task
     * @param {string} taskId - Task ID to focus on (optional)
     */
    enterFocusMode(taskId = null) {
        // Get suggested tasks if no task specified
        if (!taskId) {
            const suggestions = this.app.getSmartSuggestions?.({ maxSuggestions: 10 });
            if (!suggestions || suggestions.length === 0) {
                this.app.showWarning('No tasks available for focus mode. Create some tasks first!');
                return;
            }

            // Show task selector
            const taskOptions = suggestions.map((s, i) =>
                `${i + 1}. ${s.task.title} (${s.reasons.join(', ')})`
            ).join('\n');

            const selection = prompt(`Select a task to focus on:\n\n${taskOptions}\n\nEnter task number:`);
            if (!selection) return;

            const taskIndex = parseInt(selection) - 1;
            if (taskIndex >= 0 && taskIndex < suggestions.length) {
                taskId = suggestions[taskIndex].task.id;
            } else {
                this.app.showError('Invalid selection');
                return;
            }
        }

        this.focusTaskId = taskId;
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Auto-start timer when entering focus mode
        this.resetPomodoro();
        this.focusModeStartTime = new Date(); // Track when we started focusing

        // Show focus overlay
        const focusOverlay = document.getElementById('focus-mode-overlay');
        if (focusOverlay) {
            focusOverlay.style.display = 'flex';
        }

        this.renderFocusTask(task);

        // Auto-start the Pomodoro timer
        this.startPomodoro();
        this.app.showNotification?.('Focus mode activated! Timer started automatically.');
    }

    /**
     * Render focused task in focus mode overlay
     * @param {Object} task - Task object
     */
    renderFocusTask(task) {
        const container = document.getElementById('focus-task-container');
        if (!container) return;

        container.innerHTML = `
            <h1 style="font-size: 2.5rem; margin-bottom: var(--spacing-lg); text-align: center;">${escapeHtml(task.title)}</h1>
            <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); max-width: 600px; width: 100%; margin-bottom: var(--spacing-lg);">
                ${task.description ? `<p style="margin-bottom: var(--spacing-md);">${escapeHtml(task.description)}</p>` : ''}
                <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-bottom: var(--spacing-sm);">
                    ${task.contexts ? task.contexts.map(c => `<span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px;">${escapeHtml(c)}</span>`).join('') : ''}
                    ${task.energy ? `<span style="background: var(--warning-color); color: white; padding: 4px 8px; border-radius: 12px;"><i class="fas fa-bolt"></i> ${task.energy}</span>` : ''}
                    ${task.time ? `<span style="background: var(--info-color); color: white; padding: 4px 8px; border-radius: 12px;"><i class="fas fa-clock"></i> ${task.time}m</span>` : ''}
                </div>
                ${task.dueDate ? `<p style="color: var(--text-secondary);"><i class="fas fa-calendar-day"></i> Due: ${task.dueDate}</p>` : ''}
            </div>

            ${task.subtasks && task.subtasks.length > 0 ? `
                <div style="max-width: 600px; width: 100%; margin-bottom: var(--spacing-lg);">
                    <h3>Subtasks</h3>
                    <div style="background: var(--bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-md);">
                        ${task.subtasks.map((subtask, index) => `
                            <label style="display: flex; align-items: center; gap: var(--spacing-sm); padding: 8px 0; cursor: pointer;">
                                <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="app.toggleSubtaskFromFocus('${task.id}', ${index})">
                                <span style="${subtask.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(subtask.title)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${task.notes ? `
                <div style="max-width: 600px; width: 100%; margin-bottom: var(--spacing-lg);">
                    <h3>Notes</h3>
                    <div style="background: var(--bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-md); white-space: pre-wrap;">${escapeHtml(task.notes)}</div>
                </div>
            ` : ''}

            <div style="display: flex; gap: var(--spacing-sm);">
                <button class="btn btn-success" onclick="app.completeTaskAndExitFocus('${task.id}')">
                    <i class="fas fa-check"></i> Complete Task
                </button>
                <button class="btn btn-primary" onclick="app.editTaskFromFocus('${task.id}')">
                    <i class="fas fa-edit"></i> Edit Task
                </button>
            </div>
        `;
    }

    /**
     * Exit focus mode
     */
    async exitFocusMode() {
        // Auto-track time spent
        await this.autoTrackTimeSpent();

        this.pausePomodoro();
        const focusOverlay = document.getElementById('focus-mode-overlay');
        if (focusOverlay) {
            focusOverlay.style.display = 'none';
        }
        this.focusTaskId = null;
        this.focusModeStartTime = null;
        this.app.renderView?.();
    }

    /**
     * Auto-track time spent on focused task
     */
    async autoTrackTimeSpent() {
        if (!this.focusTaskId || !this.focusModeStartTime) return;

        const task = this.state.tasks.find(t => t.id === this.focusTaskId);
        if (!task) return;

        // Calculate time spent (in minutes)
        const endTime = new Date();
        const timeSpentMinutes = Math.round((endTime - this.focusModeStartTime) / (1000 * 60));

        if (timeSpentMinutes > 0) {
            task.timeSpent = (task.timeSpent || 0) + timeSpentMinutes;
            task.updatedAt = new Date().toISOString();
            await this.app.saveTasks?.();
            this.app.showNotification?.(`Tracked ${timeSpentMinutes} minutes on "${task.title}"`);
        }
    }

    /**
     * Toggle subtask from focus mode
     * @param {string} taskId - Task ID
     * @param {number} subtaskIndex - Subtask index
     */
    async toggleSubtaskFromFocus(taskId, subtaskIndex) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task && task.subtasks && task.subtasks[subtaskIndex]) {
            task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
            await this.app.saveTasks?.();
            this.renderFocusTask(task);
        }
    }

    /**
     * Complete task and exit focus mode
     * @param {string} taskId - Task ID
     */
    async completeTaskAndExitFocus(taskId) {
        // Auto-track time before completing
        await this.autoTrackTimeSpent();

        // Auto-stop timer
        this.pausePomodoro();

        await this.app.toggleTaskComplete?.(taskId);
        this.exitFocusMode();
        this.app.showNotification?.('Task completed! Timer stopped automatically.');
    }

    /**
     * Edit task from focus mode
     * @param {string} taskId - Task ID
     */
    editTaskFromFocus(taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task) {
            this.exitFocusMode();
            this.app.openTaskModal?.(task);
        }
    }

    // ==================== POMODORO TIMER ====================

    /**
     * Start Pomodoro timer
     */
    startPomodoro() {
        if (this.pomodoroIsRunning) return;

        this.pomodoroIsRunning = true;
        this.updatePomodoroButtons();

        this.pomodoroTimer = setInterval(() => {
            if (this.pomodoroTimeLeft > 0) {
                this.pomodoroTimeLeft--;
                this.updatePomodoroDisplay();
            } else {
                this.pomodoroComplete();
            }
        }, 1000);
    }

    /**
     * Pause Pomodoro timer
     */
    pausePomodoro() {
        if (!this.pomodoroIsRunning) return;

        this.pomodoroIsRunning = false;
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
            this.pomodoroTimer = null;
        }
        this.updatePomodoroButtons();
    }

    /**
     * Reset Pomodoro timer
     */
    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroIsBreak = false;
        this.pomodoroTimeLeft = 25 * 60;
        this.updatePomodoroDisplay();
    }

    /**
     * Handle Pomodoro timer completion
     */
    pomodoroComplete() {
        this.pausePomodoro();

        if (this.pomodoroIsBreak) {
            this.app.showSuccess('Break complete! Ready to focus again?');
            this.pomodoroIsBreak = false;
            this.pomodoroTimeLeft = 25 * 60;
        } else {
            const shouldTakeBreak = confirm('Pomodoro complete! Take a 5-minute break?');
            if (shouldTakeBreak) {
                this.pomodoroIsBreak = true;
                this.pomodoroTimeLeft = 5 * 60;
                this.startPomodoro();
            } else {
                this.pomodoroTimeLeft = 25 * 60;
            }
        }

        this.updatePomodoroDisplay();
    }

    /**
     * Update Pomodoro timer display
     */
    updatePomodoroDisplay() {
        const timerDisplay = document.getElementById('pomodoro-timer');
        if (!timerDisplay) return;

        const minutes = Math.floor(this.pomodoroTimeLeft / 60);
        const seconds = this.pomodoroTimeLeft % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Update document title
        document.title = `${timerDisplay.textContent} - ${this.pomodoroIsBreak ? 'Break' : 'Focus'}`;
    }

    /**
     * Update Pomodoro button states
     */
    updatePomodoroButtons() {
        const startBtn = document.getElementById('btn-pomodoro-start');
        const pauseBtn = document.getElementById('btn-pomodoro-pause');

        if (startBtn) startBtn.style.display = this.pomodoroIsRunning ? 'none' : 'inline-block';
        if (pauseBtn) pauseBtn.style.display = this.pomodoroIsRunning ? 'inline-block' : 'none';
    }

    /**
     * Get current focus task ID
     * @returns {string|null}
     */
    getFocusTaskId() {
        return this.focusTaskId;
    }

    /**
     * Check if focus mode is active
     * @returns {boolean}
     */
    isFocusModeActive() {
        return !!this.focusTaskId;
    }

    /**
     * Check if Pomodoro timer is running
     * @returns {boolean}
     */
    isPomodoroRunning() {
        return this.pomodoroIsRunning;
    }

    /**
     * Get remaining Pomodoro time
     * @returns {number} Time left in seconds
     */
    getPomodoroTimeLeft() {
        return this.pomodoroTimeLeft;
    }

    /**
     * Check if currently on break
     * @returns {boolean}
     */
    isOnBreak() {
        return this.pomodoroIsBreak;
    }

    /**
     * Cleanup timer on destroy
     */
    destroy() {
        this.pausePomodoro();
    }
}
