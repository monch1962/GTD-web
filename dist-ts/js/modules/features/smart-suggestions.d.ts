/**
 * ============================================================================
 * Smart Suggestions Manager
 * ============================================================================
 *
 * Manages the "What Should I Work On?" feature that provides intelligent
 * task recommendations based on context, time availability, and energy level.
 *
 * This manager handles:
 * - Smart task scoring algorithm based on multiple factors
 * - Modal display with filters (context, time, energy)
 * - Task suggestion rendering with reasoning
 * - User selection and task highlighting
 */
import { Task, Project } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
    currentView: string;
}
interface AppDependencies {
    showToast?: (message: string, type?: string) => void;
    showSuccess?: (message: string) => void;
    showError?: (message: string) => void;
    selectSuggestedTask?: (taskId: string) => void;
}
interface SuggestionPreferences {
    context?: string;
    availableMinutes?: number | null;
    energyLevel?: string;
    maxSuggestions?: number;
}
interface ScoredTask {
    task: Task;
    score: number;
    reasons: string[];
}
export declare class SmartSuggestionsManager {
    private state;
    private app;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup the smart suggestions feature (called from app setup)
     * Currently no setup needed - feature is triggered on demand
     */
    setupSmartSuggestions(): void;
    /**
     * Show the smart suggestions modal with filters
     */
    showSuggestions(): void;
    /**
     * Get smart task suggestions based on preferences
     * @param preferences - User preferences for filtering
     * @returns Array of scored task suggestions with reasons
     */
    getSmartSuggestions(preferences?: SuggestionPreferences): ScoredTask[];
    /**
     * Get days until due date
     * @param task - Task to check
     * @returns Days until due, or null if no due date
     */
    getDaysUntilDue(task: Task): number | null;
    /**
     * Render task suggestions in the modal
     */
    renderSuggestions(): void;
    /**
     * User clicked on a suggested task - highlight it and close modal
     * @param taskId - ID of the selected task
     */
    selectSuggestedTask(taskId: string): void;
}
export {};
//# sourceMappingURL=smart-suggestions.d.ts.map