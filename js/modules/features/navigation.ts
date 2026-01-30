/**
 * ============================================================================
 * Navigation Manager - TypeScript Version
 * ============================================================================
 *
 * Manages view navigation and related utility functions.
 *
 * This manager handles:
 * - View switching (inbox, next, waiting, someday, projects)
 * - Time-based greetings (Morning/Afternoon/Evening)
 * - Personalized greeting messages with task statistics
 * - Project title lookup
 */

import { Task, Project } from '../../models'

/**
 * App interface for type safety
 */
interface App {
    renderView?: () => void
    updateNavigation?: () => void
}

/**
 * State interface for navigation
 */
interface State {
    tasks: Task[]
    projects: Project[]
    currentView: string
    currentProjectId: string | null
}

export class NavigationManager {
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
     * Get time-based greeting
     * @returns {string} - Morning, Afternoon, or Evening
     */
    getGreeting (): string {
        const hour = new Date().getHours()
        if (hour < 12) return 'Morning'
        if (hour < 17) return 'Afternoon'
        return 'Evening'
    }

    /**
     * Get personalized greeting message with task statistics
     * @returns {string} - Personalized greeting message
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
     * Navigate to a specific view
     * @param {string} view - View to switch to
     */
    navigateTo (view: string): void {
        this.state.currentView = view
        this.state.currentProjectId = null
        this.app.renderView?.()
        this.app.updateNavigation?.()
    }

    /**
     * Get project title by ID
     * @param {string} projectId - Project ID
     * @returns {string} - Project title or 'Unknown Project'
     */
    getProjectTitle (projectId: string): string {
        const project = this.state.projects.find((p) => p.id === projectId)
        return project ? project.title : 'Unknown Project'
    }
}
