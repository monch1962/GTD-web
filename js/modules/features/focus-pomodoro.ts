/**
 * Focus Mode and Pomodoro Timer module
 * Handles focus mode for single-task concentration and Pomodoro timer
 */

import { Task } from '../../models'
import { escapeHtml } from '../../dom-utils.ts'

// Define interfaces for state and app dependencies
interface AppState {
    tasks: Task[]
}

interface AppDependencies {
    getSmartSuggestions?: (options: {
        maxSuggestions: number
    }) => Array<{ task: Task; reasons: string[] }>
    showWarning?: (message: string) => void
    showError?: (message: string) => void
    showNotification?: (message: string, type?: string) => void
    showToast?: (message: string) => void
    saveTasks?: () => Promise<void>
    renderView?: () => void
    updateCounts?: () => void
    toggleSubtask?: (taskId: string, subtaskIndex: number) => Promise<void>
}

export class FocusPomodoroManager {
    private state: AppState
    private app: AppDependencies

    // Pomodoro timer state
    private pomodoroTimer: NodeJS.Timeout | null = null
    private pomodoroTimeLeft: number = 25 * 60 // 25 minutes in seconds
    private pomodoroIsRunning: boolean = false
    private pomodoroIsBreak: boolean = false

    // Focus mode state
    private focusTaskId: string | null = null
    private focusModeStartTime: Date | null = null

    constructor(state: AppState, app: AppDependencies) {
        this.state = state
        this.app = app
    }

    /**
     * Setup focus mode and pomodoro timer
     */
    setupFocusMode(): void {
        const focusBtn = document.getElementById('btn-focus-mode') as HTMLButtonElement | null
        const exitFocusBtn = document.getElementById('btn-exit-focus') as HTMLButtonElement | null
        const pomodoroStartBtn = document.getElementById(
            'btn-pomodoro-start'
        ) as HTMLButtonElement | null
        const pomodoroPauseBtn = document.getElementById(
            'btn-pomodoro-pause'
        ) as HTMLButtonElement | null
        const pomodoroResetBtn = document.getElementById(
            'btn-pomodoro-reset'
        ) as HTMLButtonElement | null

        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                this.enterFocusMode()
            })
        }

        if (exitFocusBtn) {
            exitFocusBtn.addEventListener('click', () => {
                this.exitFocusMode()
            })
        }

        if (pomodoroStartBtn) {
            pomodoroStartBtn.addEventListener('click', () => {
                this.startPomodoro()
            })
        }

        if (pomodoroPauseBtn) {
            pomodoroPauseBtn.addEventListener('click', () => {
                this.pausePomodoro()
            })
        }

        if (pomodoroResetBtn) {
            pomodoroResetBtn.addEventListener('click', () => {
                this.resetPomodoro()
            })
        }
    }

    /**
     * Enter focus mode for a task
     * @param taskId - Task ID to focus on (optional)
     */
    enterFocusMode(taskId: string | null = null): void {
        // Get suggested tasks if no task specified
        if (!taskId) {
            const suggestions = this.app.getSmartSuggestions?.({ maxSuggestions: 10 })
            if (!suggestions || suggestions.length === 0) {
                this.app.showWarning?.(
                    'No tasks available for focus mode. Create some tasks first!'
                )
                return
            }

            // Show task selector
            const taskOptions = suggestions
                .map((s, i) => `${i + 1}. ${s.task.title} (${s.reasons.join(', ')})`)
                .join('\n')

            const selection = prompt(
                `Select a task to focus on:\n\n${taskOptions}\n\nEnter task number:`
            )
            if (!selection) return

            const taskIndex = parseInt(selection) - 1
            if (taskIndex >= 0 && taskIndex < suggestions.length) {
                taskId = suggestions[taskIndex].task.id
            } else {
                this.app.showError?.('Invalid selection')
                return
            }
        }

        this.focusTaskId = taskId
        const task = this.state.tasks.find((t) => t.id === taskId)
        if (!task) return

        // Auto-start timer when entering focus mode
        this.resetPomodoro()
        this.focusModeStartTime = new Date() // Track when we started focusing

        // Show focus overlay
        const focusOverlay = document.getElementById('focus-mode-overlay') as HTMLElement | null
        if (focusOverlay) {
            focusOverlay.style.display = 'flex'
        }

        this.renderFocusTask(task)

        // Auto-start the Pomodoro timer
        this.startPomodoro()
        this.app.showNotification?.('Focus mode activated! Timer started automatically.')
    }

    /**
     * Render focused task in focus mode overlay
     * @param task - Task object
     */
    renderFocusTask(task: Task): void {
        const container = document.getElementById('focus-task-container') as HTMLElement | null
        if (!container) return

        container.innerHTML = `
            <h1 style="font-size: 2.5rem; margin-bottom: var(--spacing-lg); text-align: center;">${escapeHtml(task.title)}</h1>
            <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); max-width: 600px; width: 100%; margin-bottom: var(--spacing-lg);">
                ${task.description ? `<p style="margin-bottom: var(--spacing-md);">${escapeHtml(task.description)}</p>` : ''}
                <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-bottom: var(--spacing-sm);">
                    ${task.contexts ? task.contexts.map((c) => `<span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px;">${escapeHtml(c)}</span>`).join('') : ''}
                    ${task.energy ? `<span style="background: var(--warning-color); color: white; padding: 4px 8px; border-radius: 12px;"><i class="fas fa-bolt"></i> ${task.energy}</span>` : ''}
                    ${task.time ? `<span style="background: var(--info-color); color: white; padding: 4px 8px; border-radius: 12px;"><i class="fas fa-clock"></i> ${task.time}m</span>` : ''}
                </div>
                ${task.dueDate ? `<p style="color: var(--text-secondary);"><i class="fas fa-calendar-day"></i> Due: ${task.dueDate}</p>` : ''}
            </div>

            ${
                task.subtasks && task.subtasks.length > 0
                    ? `
                <div style="max-width: 600px; width: 100%; margin-bottom: var(--spacing-lg);">
                    <h3>Subtasks</h3>
                    <div style="background: var(--bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-md);">
                        ${task.subtasks
                            .map(
                                (subtask, index) => `
                            <label style="display: flex; align-items: center; gap: var(--spacing-sm); padding: 8px 0; cursor: pointer;">
                                <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="app.toggleSubtaskFromFocus('${task.id}', ${index})">
                                <span style="${subtask.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(subtask.title)}</span>
                            </label>
                        `
                            )
                            .join('')}
                    </div>
                </div>
            `
                    : ''
            }

            ${
                task.notes
                    ? `
                <div style="max-width: 600px; width: 100%;">
                    <h3>Notes</h3>
                    <div style="background: var(--bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-md); white-space: pre-wrap;">
                        ${escapeHtml(task.notes)}
                    </div>
                </div>
            `
                    : ''
            }
        `
    }

    /**
     * Exit focus mode
     */
    exitFocusMode(): void {
        this.focusTaskId = null
        this.focusModeStartTime = null

        // Hide focus overlay
        const focusOverlay = document.getElementById('focus-mode-overlay') as HTMLElement | null
        if (focusOverlay) {
            focusOverlay.style.display = 'none'
        }

        // Stop Pomodoro timer
        this.pausePomodoro()

        this.app.showNotification?.('Focus mode ended')
    }

    /**
     * Start Pomodoro timer
     */
    startPomodoro(): void {
        if (this.pomodoroIsRunning) return

        this.pomodoroIsRunning = true
        this.updatePomodoroDisplay()

        this.pomodoroTimer = setInterval(() => {
            this.pomodoroTimeLeft--

            if (this.pomodoroTimeLeft <= 0) {
                this.handlePomodoroComplete()
                return
            }

            this.updatePomodoroDisplay()
        }, 1000)
    }

    /**
     * Pause Pomodoro timer
     */
    pausePomodoro(): void {
        if (!this.pomodoroIsRunning) return

        this.pomodoroIsRunning = false
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer)
            this.pomodoroTimer = null
        }

        this.updatePomodoroButtons()
    }

    /**
     * Reset Pomodoro timer
     */
    resetPomodoro(): void {
        this.pausePomodoro()
        this.pomodoroTimeLeft = this.pomodoroIsBreak ? 5 * 60 : 25 * 60 // 5 min break or 25 min work
        this.updatePomodoroDisplay()
        this.updatePomodoroButtons()
    }

    /**
     * Handle Pomodoro timer completion
     */
    handlePomodoroComplete(): void {
        this.pausePomodoro()

        if (this.pomodoroIsBreak) {
            // Break finished, start work session
            this.pomodoroIsBreak = false
            this.pomodoroTimeLeft = 25 * 60
            this.app.showToast?.('Break finished! Time to get back to work.')
        } else {
            // Work session finished, start break
            this.pomodoroIsBreak = true
            this.pomodoroTimeLeft = 5 * 60
            this.app.showToast?.('Pomodoro completed! Take a 5-minute break.')
        }

        this.updatePomodoroDisplay()
        this.updatePomodoroButtons()

        // Auto-start next session after 1 second
        setTimeout(() => {
            this.startPomodoro()
        }, 1000)
    }

    /**
     * Update Pomodoro timer display
     */
    updatePomodoroDisplay(): void {
        const minutes = Math.floor(this.pomodoroTimeLeft / 60)
        const seconds = this.pomodoroTimeLeft % 60
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

        const timerDisplay = document.getElementById('pomodoro-timer') as HTMLElement | null
        if (timerDisplay) {
            timerDisplay.textContent = timeStr
        }

        const statusDisplay = document.getElementById('pomodoro-status') as HTMLElement | null
        if (statusDisplay) {
            statusDisplay.textContent = this.pomodoroIsBreak ? 'Break Time' : 'Focus Time'
        }
    }

    /**
     * Update Pomodoro control buttons
     */
    updatePomodoroButtons(): void {
        const startBtn = document.getElementById('btn-pomodoro-start') as HTMLButtonElement | null
        const pauseBtn = document.getElementById('btn-pomodoro-pause') as HTMLButtonElement | null

        if (startBtn) {
            startBtn.disabled = this.pomodoroIsRunning
        }
        if (pauseBtn) {
            pauseBtn.disabled = !this.pomodoroIsRunning
        }
    }

    /**
     * Format time for display
     * @param seconds - Time in seconds
     * @returns Formatted time string
     */
    formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    /**
     * Get current focus task
     * @returns Current focus task or null
     */
    getFocusTask(): Task | null {
        if (!this.focusTaskId) return null
        return this.state.tasks.find((t) => t.id === this.focusTaskId) || null
    }

    /**
     * Check if focus mode is active
     * @returns Boolean indicating if focus mode is active
     */
    isFocusModeActive(): boolean {
        return this.focusTaskId !== null
    }

    /**
     * Get focus session duration
     * @returns Duration in milliseconds or null if not active
     */
    getFocusDuration(): number | null {
        if (!this.focusModeStartTime) return null
        return Date.now() - this.focusModeStartTime.getTime()
    }

    /**
     * Toggle subtask from focus mode (called from inline onclick)
     * This is a wrapper that can be called from the inline onclick handler
     */
    async toggleSubtaskFromFocus(taskId: string, subtaskIndex: number): Promise<void> {
        await this.app.toggleSubtask?.(taskId, subtaskIndex)
        const task = this.state.tasks.find((t) => t.id === taskId)
        if (task) {
            this.renderFocusTask(task)
        }
    }
}
