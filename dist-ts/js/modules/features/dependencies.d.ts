/**
 * Dependencies module
 * Handles task dependency visualization and analysis
 *
 * Features:
 * - Dependency graph visualization
 * - Dependency chains analysis
 * - Critical path calculation
 * - Project filtering
 * - Statistics and metrics
 *
 * @example
 * const deps = new DependenciesManager(state, app);
 * deps.setupDependenciesVisualization();
 * deps.openDependenciesModal();
 * const stats = deps.getDependencyStats('project-123');
 */
import { Task, Project } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
}
interface AppDependencies {
    saveTasks?: () => Promise<void>;
    renderView?: () => void;
    showNotification?: (message: string, type: string) => void;
    openTaskModal?: (task: Task) => void;
}
interface NodePosition {
    x: number;
    y: number;
}
interface DependencyStats {
    totalTasks: number;
    withDeps: number;
    blocked: number;
    ready: number;
}
export declare class DependenciesManager {
    private state;
    private app;
    depsCurrentView: 'graph' | 'chains' | 'critical';
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup dependencies visualization
     */
    setupDependenciesVisualization(): void;
    /**
     * Populate dependencies project filter
     */
    populateDepsProjectFilter(): void;
    /**
     * Open dependencies modal
     */
    openDependenciesModal(): void;
    /**
     * Close dependencies modal
     */
    closeDependenciesModal(): void;
    /**
     * Update dependencies view buttons
     */
    updateDepsViewButtons(): void;
    /**
     * Render dependencies view
     */
    renderDependenciesView(): void;
    /**
     * Get tasks with dependencies
     */
    getDependenciesTasks(projectId: string): Task[];
    /**
     * Update dependencies statistics
     */
    updateDepsStats(tasks: Task[]): void;
    /**
     * Render dependency graph view
     */
    renderDependencyGraph(tasks: Task[], container: HTMLElement): void;
    /**
     * Calculate node positions for dependency graph
     */
    calculateNodePositions(tasks: Task[]): Record<string, NodePosition>;
    /**
     * Calculate task level in dependency hierarchy
     */
    calculateTaskLevel(task: Task, allTasks: Task[]): number;
    /**
     * Render dependency connection lines
     */
    renderDependencyLines(tasks: Task[], positions: Record<string, NodePosition>, container: HTMLElement | null): void;
    /**
     * Render dependency chains view
     */
    renderDependencyChains(tasks: Task[], container: HTMLElement): void;
    /**
     * Build dependency chains
     */
    buildDependencyChains(tasks: Task[]): Task[][];
    /**
     * Render a single dependency chain
     */
    renderChain(chain: Task[]): string;
    /**
     * Render critical path view
     */
    renderCriticalPath(tasks: Task[], container: HTMLElement): void;
    /**
     * Calculate critical path using longest path algorithm
     */
    calculateCriticalPath(tasks: Task[]): Task[];
    /**
     * Get current dependencies view
     * @returns Current view mode
     */
    getCurrentView(): 'graph' | 'chains' | 'critical';
    /**
     * Set dependencies view
     * @param view - View to set
     */
    setCurrentView(view: 'graph' | 'chains' | 'critical'): void;
    /**
     * Get statistics about dependencies
     * @param projectId - Optional project filter
     * @returns Dependencies statistics
     */
    getDependencyStats(projectId?: string | null): DependencyStats;
}
export {};
//# sourceMappingURL=dependencies.d.ts.map