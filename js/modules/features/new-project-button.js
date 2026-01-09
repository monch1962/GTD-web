/**
 * ============================================================================
 * New Project Button Manager
 * ============================================================================
 *
 * Manages the new project button functionality.
 *
 * This manager handles:
 * - New project button click handler
 * - Opens task modal with project type pre-selected
 */

export class NewProjectButtonManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Setup the new project button
     */
    setupNewProjectButton() {
        const newProjectBtn = document.getElementById('btn-new-project');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                // Open task modal with type pre-selected as 'project'
                this.app.openTaskModal?.(null, null, { type: 'project' });
            });
        }
    }
}
