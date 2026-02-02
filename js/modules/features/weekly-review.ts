/**
 * Weekly Review Module
 * Handles GTD weekly review functionality
 *
 * Features:
 * - Weekly review modal with GTD checklist
 * - Review of completed tasks from past week
 * - Overdue tasks identification
 * - Tasks due this week overview
 * - Stalled projects detection
 * - Cleanup actions (empty projects, old tasks, stale projects)
 *
 * @example
 * const weeklyReview = new WeeklyReviewManager(state, app);
 * weeklyReview.setupWeeklyReview();
 * weeklyReview.showWeeklyReview();
 * await weeklyReview.cleanupEmptyProjects();
 */

import { escapeHtml } from '../../dom-utils'
import type { AppState, AppDependencies } from '../../types'

export class WeeklyReviewManager {
    private state: AppState
    private app: AppDependencies

    constructor (state: AppState, app: AppDependencies) {
        this.state = state
        this.app = app
    }

    /**
     * Setup weekly review functionality
     */
    setupWeeklyReview (): void {
        const weeklyReviewBtn = document.getElementById('btn-weekly-review')
        const closeWeeklyReviewBtn = document.getElementById('close-weekly-review-modal')

        if (weeklyReviewBtn) {
            weeklyReviewBtn.addEventListener('click', () => {
                this.showWeeklyReview()
            })
        }

        if (closeWeeklyReviewBtn) {
            closeWeeklyReviewBtn.addEventListener('click', () => {
                this.closeWeeklyReview()
            })
        }
    }

    /**
     * Show weekly review modal
     */
    showWeeklyReview (): void {
        const modal = document.getElementById('weekly-review-modal')
        if (!modal) return

        modal.style.display = 'block'
        this.renderWeeklyReview()
    }

    /**
     * Close weekly review modal
     */
    closeWeeklyReview (): void {
        const modal = document.getElementById('weekly-review-modal')
        if (modal) modal.style.display = 'none'
    }

    /**
     * Render weekly review content
     */
    renderWeeklyReview (): void {
        const weeklyReviewContent = document.getElementById('weekly-review-content')
        if (!weeklyReviewContent) return

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)

        // Gather review data
        const completedThisWeek = this.state.tasks.filter(
            (t) => t.completed && t.completedAt && new Date(t.completedAt) >= weekAgo
        )

        const incompleteTasks = this.state.tasks.filter(
            (t) => !t.completed && t.status !== 'someday' && t.type !== 'reference'
        )

        const overdueTasks = incompleteTasks.filter((t) => t.isOverdue())

        const dueThisWeek = incompleteTasks.filter((t) => {
            if (!t.dueDate) return false
            const dueDate = new Date(t.dueDate)
            const nextWeek = new Date(today)
            nextWeek.setDate(nextWeek.getDate() + 7)
            return dueDate >= today && dueDate <= nextWeek
        })

        const waitingTasks = this.state.tasks.filter((t) => t.status === 'waiting' && !t.completed)

        const somedayTasks = this.state.tasks.filter((t) => t.status === 'someday' && !t.completed)

        const staleProjects = this.state.projects.filter((p) => {
            if (p.status !== 'active') return false
            const projectTasks = this.state.tasks.filter(
                (t) => t.projectId === p.id && !t.completed
            )
            const thirtyDaysAgo = new Date(today)
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            return (
                projectTasks.length > 0 &&
                projectTasks.every((t) => new Date(t.updatedAt) < thirtyDaysAgo)
            )
        })

        // Render weekly review
        weeklyReviewContent.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
                    <h3 style="margin-top: 0;">📅 Weekly Review Checklist</h3>
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">
                        Complete this review to get clear and current. Follow the GTD weekly review process.
                    </p>

                    <div style="display: grid; gap: var(--spacing-sm);">
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Get clear: Empty your head - put all uncaptured ideas, thoughts, and tasks in Inbox</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review <strong>${completedThisWeek.length} completed tasks</strong> from last week</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review your calendar for upcoming commitments</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review your projects and project lists</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review <strong>${waitingTasks.length} Waiting</strong> items</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review <strong>${somedayTasks.length} Someday</strong> items - activate any that are now relevant</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Be creative and courageous: Any new, fun, exciting projects?</span>
                        </label>
                    </div>
                </div>

                ${
    overdueTasks.length > 0
        ? `
                <div style="background: #fef5e7; padding: var(--spacing-md); border-radius: var(--radius-md); border-left: 4px solid var(--warning-color); margin-bottom: var(--spacing-md);">
                    <h4 style="margin: 0 0 var(--spacing-sm) 0; color: var(--warning-color);">
                        <i class="fas fa-exclamation-triangle"></i> ${overdueTasks.length} Overdue Tasks
                    </h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${overdueTasks
        .slice(0, 10)
        .map(
            (task) => `
                            <div style="padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
                                <strong>${escapeHtml(task.title)}</strong>
                                ${task.dueDate ? `<span style="color: var(--danger-color); font-size: 0.85rem;"> Due: ${task.dueDate}</span>` : ''}
                            </div>
                        `
        )
        .join('')}
                    </div>
                </div>
                `
        : ''
}

                ${
    dueThisWeek.length > 0
        ? `
                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: var(--spacing-md);">
                    <h4 style="margin: 0 0 var(--spacing-sm) 0;">
                        <i class="fas fa-calendar-day"></i> ${dueThisWeek.length} Tasks Due This Week
                    </h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${dueThisWeek
        .map(
            (task) => `
                            <div style="padding: 4px 0; border-bottom: 1px solid var(--border-color);">
                                <strong>${escapeHtml(task.title)}</strong>
                                ${task.dueDate ? `<span style="color: var(--text-secondary); font-size: 0.85rem;"> Due: ${task.dueDate}</span>` : ''}
                            </div>
                        `
        )
        .join('')}
                    </div>
                </div>
                `
        : ''
}

                ${
    staleProjects.length > 0
        ? `
                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: var(--spacing-md);">
                    <h4 style="margin: 0 0 var(--spacing-sm) 0; color: var(--text-secondary);">
                        <i class="fas fa-pause-circle"></i> ${staleProjects.length} Stalled Projects (consider activating or completing)
                    </h4>
                    ${staleProjects
        .map(
            (project) => `
                        <div style="padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-top: var(--spacing-xs);">
                            <strong>${escapeHtml(project.title)}</strong>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0;">${this.state.tasks.filter((t) => t.projectId === project.id && !t.completed).length} tasks remaining</p>
                        </div>
                    `
        )
        .join('')}
                </div>
                `
        : ''
}

                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h4 style="margin: 0 0 var(--spacing-sm) 0;">
                        <i class="fas fa-broom"></i> Cleanup Actions
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                        <button class="btn btn-secondary" onclick="app.cleanupEmptyProjects()">
                            <i class="fas fa-trash"></i> Delete empty projects
                        </button>
                        <button class="btn btn-secondary" onclick="app.cleanupOldCompletedTasks()">
                            <i class="fas fa-broom"></i> Archive tasks completed > 90 days ago
                        </button>
                        <button class="btn btn-secondary" onclick="app.markStaleProjectsSomeday()">
                            <i class="fas fa-pause"></i> Move stale projects to Someday
                        </button>
                    </div>
                </div>
            </div>
        `
    }

    /**
     * Cleanup empty projects
     */
    async cleanupEmptyProjects (): Promise<void> {
        const emptyProjects = this.state.projects.filter((p) => {
            const projectTasks = this.state.tasks.filter((t) => t.projectId === p.id)
            return projectTasks.length === 0
        })

        if (emptyProjects.length === 0) {
            this.app.showWarning?.('No empty projects to clean up.')
            return
        }

        if (!confirm(`Delete ${emptyProjects.length} empty projects?`)) return

        this.state.projects = this.state.projects.filter((p) => !emptyProjects.includes(p))
        await this.app.saveProjects?.()
        this.renderWeeklyReview()
        this.app.renderProjectsDropdown?.()
        this.app.showSuccess?.(`Cleaned up ${emptyProjects.length} empty projects.`)
    }

    /**
     * Cleanup old completed tasks
     */
    async cleanupOldCompletedTasks (): Promise<void> {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const oldCompletedTasks = this.state.tasks.filter(
            (t) => t.completed && t.completedAt && new Date(t.completedAt) < ninetyDaysAgo
        )

        if (oldCompletedTasks.length === 0) {
            this.app.showWarning?.('No old completed tasks to archive.')
            return
        }

        if (
            !confirm(`Archive ${oldCompletedTasks.length} tasks completed more than 90 days ago?`)
        ) {
            return
        }

        // Create an export of these tasks before deleting
        const archiveData = {
            archivedAt: new Date().toISOString(),
            tasks: oldCompletedTasks.map((t) => t.toJSON())
        }

        const dataStr = JSON.stringify(archiveData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `gtd-archive-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // Remove from active tasks
        this.state.tasks = this.state.tasks.filter((t) => !oldCompletedTasks.includes(t))
        await this.app.saveTasks?.()
        this.renderWeeklyReview()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.showSuccess?.(`Archived ${oldCompletedTasks.length} old completed tasks.`)
    }

    /**
     * Mark stale projects as Someday
     */
    async markStaleProjectsSomeday (): Promise<void> {
        const staleProjects = this.state.projects.filter((p) => {
            if (p.status !== 'active') return false
            const projectTasks = this.state.tasks.filter(
                (t) => t.projectId === p.id && !t.completed
            )
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            return (
                projectTasks.length > 0 &&
                projectTasks.every((t) => new Date(t.updatedAt) < thirtyDaysAgo)
            )
        })

        if (staleProjects.length === 0) {
            this.app.showWarning?.('No stale projects to move.')
            return
        }

        if (!confirm(`Move ${staleProjects.length} stale projects to Someday?`)) return

        staleProjects.forEach((p) => (p.status = 'someday'))
        await this.app.saveProjects?.()
        this.renderWeeklyReview()
        this.app.renderProjectsDropdown?.()
        this.app.showSuccess?.(`Moved ${staleProjects.length} projects to Someday.`)
    }
}
