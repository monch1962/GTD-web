/**
 * ============================================================================
 * Navigation Manager
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

export class NavigationManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Get time-based greeting
     * @returns {string} - Morning, Afternoon, or Evening
     */
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 17) return 'Afternoon';
        return 'Evening';
    }

    /**
     * Get personalized greeting message with task statistics
     * @returns {string} - Personalized greeting message
     */
    getGreetingMessage() {
        const greeting = this.getGreeting();
        const totalTasks = this.state.tasks.filter(t => !t.completed).length;
        const completedToday = this.state.tasks.filter(t =>
            t.completed && t.completedAt && new Date(t.completedAt) >= new Date(new Date().setHours(0, 0, 0, 0))
        ).length;

        if (totalTasks === 0) {
            return `Good ${greeting}! All caught up!`;
        } else if (completedToday > 0) {
            return `Good ${greeting}! ${completedToday} task${completedToday > 1 ? 's' : ''} completed today.`;
        } else {
            return `Good ${greeting}! You have ${totalTasks} task${totalTasks > 1 ? 's' : ''} to do.`;
        }
    }

    /**
     * Navigate to a specific view
     * @param {string} view - View to switch to
     */
    navigateTo(view) {
        this.state.currentView = view;
        this.state.currentProjectId = null;
        this.app.renderView?.();
        this.app.updateNavigation?.();
    }

    /**
     * Get project title by ID
     * @param {string} projectId - Project ID
     * @returns {string} - Project title or 'Unknown Project'
     */
    getProjectTitle(projectId) {
        const project = this.state.projects.find(p => p.id === projectId);
        return project ? project.title : 'Unknown Project';
    }
}
