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
import { Task, Project } from "../../models";
/**
 * App interface for type safety
 */
interface App {
    renderView?: () => void;
    updateNavigation?: () => void;
}
/**
 * State interface for navigation
 */
interface State {
    tasks: Task[];
    projects: Project[];
    currentView: string;
    currentProjectId: string | null;
}
export declare class NavigationManager {
    private state;
    private app;
    constructor(state: State, app: App);
    /**
     * Get time-based greeting
     * @returns {string} - Morning, Afternoon, or Evening
     */
    getGreeting(): string;
    /**
     * Get personalized greeting message with task statistics
     * @returns {string} - Personalized greeting message
     */
    getGreetingMessage(): string;
    /**
     * Navigate to a specific view
     * @param {string} view - View to switch to
     */
    navigateTo(view: string): void;
    /**
     * Get project title by ID
     * @param {string} projectId - Project ID
     * @returns {string} - Project title or 'Unknown Project'
     */
    getProjectTitle(projectId: string): string;
}
export {};
//# sourceMappingURL=navigation.d.ts.map