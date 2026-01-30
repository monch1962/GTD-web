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
import { Task } from "../../models";
/**
 * App interface for type safety
 */
interface App {
    openTaskModal?: (task: Task | null, defaultProjectId?: string | null, defaultData?: Record<string, any>) => void;
}
/**
 * State interface (minimal for this module)
 */
interface State {
}
export declare class NewProjectButtonManager {
    private state;
    private app;
    constructor(state: State, app: App);
    /**
     * Setup the new project button
     */
    setupNewProjectButton(): void;
}
export {};
//# sourceMappingURL=new-project-button.d.ts.map