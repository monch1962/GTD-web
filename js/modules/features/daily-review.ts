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

import { Task } from '../../models'
import { escapeHtml } from '../../dom-utils'
import type { AppState } from '../../types'

// Extended Task interface to include optional priority property for tests
interface TaskWithPriority extends Task {
    priority?: number
}

export class DailyReviewManager {
    private state: AppState

    /**
     * @param state - The application state object
     */
    constructor (state: AppState) {
        this.state = state
    }

    /**
     * Setup daily review modal event listeners
     */
    setupDailyReview (): void {
        const dailyReviewBtn = document.getElementById('btn-daily-review')
        const closeDailyReviewBtn = document.getElementById('close-daily-review-modal')

        if (dailyReviewBtn) {
            dailyReviewBtn.addEventListener('click', () => {
                this.showDailyReview()
            })
        }

        if (closeDailyReviewBtn) {
            closeDailyReviewBtn.addEventListener('click', () => {
                this.closeDailyReview()
            })
        }
    }

    /**
     * Show daily review modal
     */
    showDailyReview (): void {
        const modal = document.getElementById('daily-review-modal')
        if (!modal) return

        modal.style.display = 'block'
        this.renderDailyReview()
    }

    /**
     * Close daily review modal
     */
    closeDailyReview (): void {
        const modal = document.getElementById('daily-review-modal')
        if (modal) modal.style.display = 'none'
    }

    /**
     * Render daily review content
     */
    renderDailyReview (): void {
        const dailyReviewContent = document.getElementById('daily-review-content')
        if (!dailyReviewContent) return

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Get tasks due today
        const dueToday = this.state.tasks.filter(
            (t) => !t.completed && t.dueDate && new Date(t.dueDate) <= today
        )

        // Get tasks due tomorrow

        // Get overdue tasks
        const overdue = this.state.tasks.filter(
            (t) => !t.completed && t.dueDate && new Date(t.dueDate) < today
        )

        // Get high priority tasks (using type assertion for priority property)
        const highPriority = this.state.tasks.filter((t) => {
            const taskWithPriority = t as TaskWithPriority
            return !t.completed && taskWithPriority.priority && taskWithPriority.priority >= 80
        })

        // Get tasks due this week
        const weekEnd = new Date(today)
        weekEnd.setDate(weekEnd.getDate() + 7)
        const dueThisWeek = this.state.tasks.filter(
            (t) =>
                !t.completed &&
                t.dueDate &&
                new Date(t.dueDate) >= today &&
                new Date(t.dueDate) < weekEnd
        )

        // Render daily review
        dailyReviewContent.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: var(--spacing-lg);">
                    <h2 style="margin: 0; font-size: 1.8rem;">${this.getGreetingMessage()}</h2>
                    <div style="color: var(--text-secondary); margin-top: var(--spacing-sm);">${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>

                <!-- Quick Stats -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${dueToday.length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Due Today</div>
                    </div>
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--warning-color);">${overdue.length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Overdue</div>
                    </div>
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--info-color);">${dueThisWeek.length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">This Week</div>
                    </div>
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--accent-color);">${highPriority.length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">High Priority</div>
                    </div>
                </div>

                <!-- Due Today -->
                ${
    dueToday.length > 0
        ? `
                    <div style="margin-bottom: var(--spacing-lg);">
                        <h3 style="margin-bottom: var(--spacing-md); color: var(--primary-color);">
                            <i class="fas fa-calendar-day"></i> Due Today
                        </h3>
                        <div class="task-list">
                            ${dueToday.map((task) => this.renderDailyReviewTask(task, 'today')).join('')}
                        </div>
                    </div>
                `
        : ''
}

                <!-- Overdue -->
                ${
    overdue.length > 0
        ? `
                    <div style="margin-bottom: var(--spacing-lg);">
                        <h3 style="margin-bottom: var(--spacing-md); color: var(--warning-color);">
                            <i class="fas fa-exclamation-circle"></i> Overdue
                        </h3>
                        <div class="task-list">
                            ${overdue
        .slice(0, 10)
        .map((task) => this.renderDailyReviewTask(task, 'overdue'))
        .join('')}
                        </div>
                    </div>
                `
        : ''
}

                <!-- Due This Week -->
                ${
    dueThisWeek.length > 0
        ? `
                    <div style="margin-bottom: var(--spacing-lg);">
                        <h3 style="margin-bottom: var(--spacing-md); color: var(--info-color);">
                            <i class="fas fa-calendar-week"></i> Due This Week
                        </h3>
                        <div class="task-list">
                            ${dueThisWeek
        .slice(0, 10)
        .map((task) => this.renderDailyReviewTask(task, 'week'))
        .join('')}
                        </div>
                    </div>
                `
        : ''
}

                <!-- High Priority -->
                ${
    highPriority.length > 0
        ? `
                    <div style="margin-bottom: var(--spacing-lg);">
                        <h3 style="margin-bottom: var(--spacing-md); color: var(--accent-color);">
                            <i class="fas fa-star"></i> High Priority
                        </h3>
                        <div class="task-list">
                            ${highPriority
        .slice(0, 10)
        .map((task) => this.renderDailyReviewTask(task, 'priority'))
        .join('')}
                        </div>
                    </div>
                `
        : ''
}

                ${
    dueToday.length === 0 &&
                    overdue.length === 0 &&
                    dueThisWeek.length === 0 &&
                    highPriority.length === 0
        ? `
                    <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                        <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: var(--spacing-md);"></i>
                        <div>All caught up! No urgent tasks.</div>
                    </div>
                `
        : ''
}
            </div>
        `
    }

    /**
     * Render a single task in the daily review list
     * @param task - Task object
     * @param type - Type of task list (today, overdue, week, priority)
     */
    renderDailyReviewTask (task: Task, _type: string): string {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null
        const isOverdue = dueDate && dueDate < new Date() && !task.completed
        const isDueToday = dueDate && dueDate.toDateString() === new Date().toDateString()
        const isDueTomorrow =
            dueDate &&
            dueDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()

        let dateClass = ''
        let dateLabel = ''
        let dateIcon = ''

        if (isOverdue) {
            dateClass = 'overdue'
            dateLabel = 'Overdue'
            dateIcon = 'fa-exclamation-circle'
        } else if (isDueToday) {
            dateClass = 'due-today'
            dateLabel = 'Today'
            dateIcon = 'fa-calendar-day'
        } else if (isDueTomorrow) {
            dateClass = 'due-tomorrow'
            dateLabel = 'Tomorrow'
            dateIcon = 'fa-calendar-day'
        } else if (dueDate) {
            dateLabel = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            dateIcon = 'fa-calendar'
        }

        // Use type assertion for priority property
        const taskWithPriority = task as TaskWithPriority
        const hasHighPriority = taskWithPriority.priority && taskWithPriority.priority >= 80

        return `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} data-action="complete">
                </div>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        ${
    task.contexts && task.contexts.length > 0
        ? `
                            <span class="task-contexts">
                                ${task.contexts.map((c) => `<span class="context-tag">${escapeHtml(c)}</span>`).join('')}
                            </span>
                        `
        : ''
}
                        ${
    task.projectId
        ? `
                            <span class="task-project">
                                <i class="fas fa-folder"></i>
                                ${escapeHtml(this.getProjectTitle(task.projectId))}
                            </span>
                        `
        : ''
}
                        ${
    dueDate
        ? `
                            <span class="task-due-date ${dateClass}">
                                <i class="fas ${dateIcon}"></i>
                                ${dateLabel}
                            </span>
                        `
        : ''
}
                        ${
    hasHighPriority
        ? `
                            <span class="task-priority high">
                                <i class="fas fa-star"></i>
                                ${taskWithPriority.priority}
                            </span>
                        `
        : ''
}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-icon" data-action="focus" title="Focus on this task">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
        `
    }

    /**
     * Get greeting based on time of day
     * @returns Greeting (Morning, Afternoon, or Evening)
     */
    getGreeting (): string {
        const hour = new Date().getHours()
        if (hour < 12) return 'Morning'
        if (hour < 17) return 'Afternoon'
        return 'Evening'
    }

    /**
     * Get personalized greeting message
     * @returns Personalized greeting with task count
     */
    getGreetingMessage (): string {
        const greeting = this.getGreeting()
        const totalTasks = this.state.tasks.filter((t) => !t.completed).length
        const completedToday = this.state.tasks.filter(
            (t) =>
                t.completed &&
                t.completedAt &&
                new Date(t.completedAt) >= new Date(new Date().setHours(0, 0, 0, 0))
        ).length

        if (totalTasks === 0) {
            return `Good ${greeting}! All caught up!`
        } else if (completedToday > 0) {
            return `Good ${greeting}! ${completedToday} task${completedToday > 1 ? 's' : ''} completed today.`
        } else {
            return `Good ${greeting}! You have ${totalTasks} task${totalTasks > 1 ? 's' : ''} to do.`
        }
    }

    /**
     * Get project title by ID
     * @param projectId - Project ID
     * @returns Project title or 'Unknown Project'
     */
    getProjectTitle (projectId: string): string {
        const project = this.state.projects.find((p) => p.id === projectId)
        return project ? project.title : 'Unknown Project'
    }
}
