/**
 * ============================================================================
 * New Project Button Manager - TypeScript Version
 * ============================================================================
 *
 * Manages the new project button functionality.
 *
 * This manager handles:
 * - New project button click handler
 * - Opens task modal with project type pre-selected
 */
import { Task } from '../../models'
/**
 * App interface for type safety
 */
interface App {
    openTaskModal?: (
        task: Task | null,
        defaultProjectId?: string | null,
        defaultData?: Record<string, any>
    ) => void
}
/**
 * State interface (minimal for this module)
 */
interface State {
    // State properties will be defined as needed
}
export class NewProjectButtonManager {
    private state: State
    private app: App
    constructor(state: State, app: App) {
        this.state = state
        this.app = app
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================
    /**
     * Setup the new project button
     */
    setupNewProjectButton(): void {
        const newProjectBtn = document.getElementById('btn-new-project')
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                // Open task modal with type pre-selected as 'project'
                this.app.openTaskModal?.(null, null, { type: 'project' })
            })
        }
    }
}
