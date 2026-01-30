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

import { Task, Project } from '../../models'

/**
 * App interface for type safety
 */
interface App {
    // App methods will be defined as needed
}

/**
 * State interface for priority scoring
 */
interface State {
    tasks: Task[]
    projects: Project[]
}

export class PriorityScoringManager {
    private state: State
    private app: App

    constructor (state: State, app: App) {
        this.state = state
        this.app = app
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Calculate priority score for a task (0-100 scale)
     * @param {Task} task - Task to score
     * @returns {number} Priority score from 0-100
     */
    calculatePriorityScore (task: Task): number {
        if (!task || task.completed) return 0

        let score = 50 // Base score
        const reasons: string[] = []

        // Factor 1: Due date urgency (0-25 points)
        if (task.dueDate) {
            const daysUntilDue = this.getDaysUntilDue(task)
            if (daysUntilDue !== null) {
                if (daysUntilDue < 0) {
                    score += 25
                    reasons.push('Overdue')
                } else if (daysUntilDue === 0) {
                    score += 20
                    reasons.push('Due today')
                } else if (daysUntilDue === 1) {
                    score += 15
                    reasons.push('Due tomorrow')
                } else if (daysUntilDue <= 3) {
                    score += 10
                    reasons.push('Due soon')
                } else if (daysUntilDue <= 7) {
                    score += 5
                }
            }
        }

        // Factor 2: Starred tasks (0-15 points)
        if (task.starred) {
            score += 15
            reasons.push('Starred')
        }

        // Factor 3: Task status priority (0-10 points)
        if (task.status === 'next') {
            score += 10
            reasons.push('Next Action')
        } else if (task.status === 'inbox') {
            score += 5
        }

        // Factor 4: Dependencies (0-10 points)
        if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
            if (task.areDependenciesMet(this.state.tasks)) {
                score += 10
                reasons.push('Ready to start')
            } else {
                score -= 10
                reasons.push('Blocked')
            }
        }

        // Factor 5: Energy vs available time (0-8 points)
        if (task.energy && task.time) {
            // Quick high-energy tasks get boost
            if (task.energy === 'high' && task.time <= 15) {
                score += 8
                reasons.push('Quick & high energy')
            } else if (task.energy === 'low' && task.time > 60) {
                // Long low-energy tasks get lower priority
                score -= 5
            }
        }

        // Factor 6: Time estimate (0-5 points)
        if (task.time) {
            if (task.time <= 5) {
                score += 5
                reasons.push('Quick task')
            } else if (task.time <= 15) {
                score += 3
            }
        }

        // Factor 7: Project priority (0-5 points)
        if (task.projectId) {
            const project = this.state.projects.find((p) => p.id === task.projectId)
            if (project && project.status === 'active') {
                score += 5
                reasons.push('Active project')
            }
        }

        // Factor 8: Defer date (0-20 points penalty)
        if (task.deferDate && !task.isAvailable()) {
            score -= 20
            reasons.push('Deferred')
        }

        // Factor 9: Age of task (0-7 points)
        const daysSinceCreated = Math.floor(
            (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceCreated > 30) {
            score += 7
            reasons.push('Old task')
        } else if (daysSinceCreated > 14) {
            score += 5
        } else if (daysSinceCreated > 7) {
            score += 3
        }

        // Ensure score is within 0-100 range
        score = Math.max(0, Math.min(100, score))

        return score
    }

    /**
     * Get priority score color for visual display
     * @param {number} score - Priority score (0-100)
     * @returns {string} CSS color value
     */
    getPriorityScoreColor (score: number): string {
        if (score >= 80) return 'var(--danger-color)' // High priority - red
        if (score >= 60) return '#f39c12' // Medium-high - orange
        if (score >= 40) return 'var(--warning-color)' // Medium - yellow
        if (score >= 20) return 'var(--info-color)' // Low - blue
        return 'var(--text-secondary)' // Very low - gray
    }

    /**
     * Get priority label for user feedback
     * @param {number} score - Priority score (0-100)
     * @returns {string} Priority label
     */
    getPriorityLabel (score: number): string {
        if (score >= 80) return 'Urgent'
        if (score >= 60) return 'High'
        if (score >= 40) return 'Medium'
        if (score >= 20) return 'Low'
        return 'Very Low'
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    /**
     * Get days until due date
     * @param {Task} task - Task to check
     * @returns {number|null} Days until due, or null if no due date
     */
    private getDaysUntilDue (task: Task): number | null {
        if (!task.dueDate) return null

        // Parse date string as local time (not UTC) to avoid timezone issues
        const [year, month, day] = task.dueDate.split('-').map(Number)
        const dueDate = new Date(year, month - 1, day)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }
}
