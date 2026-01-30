/**
 * ============================================================================
 * Smart Date Suggestions Manager
 * ============================================================================
 *
 * Manages natural language date parsing for quick date entry.
 *
 * This manager handles:
 * - Setup of date input suggestions for due date and defer date fields
 * - Natural language parsing (today, tomorrow, in X days, next week, etc.)
 * - UI dropdown suggestions with clickable options
 * - Multiple date patterns: relative dates, weekdays, month boundaries
 */
import { Task, Project } from '../../models';
interface AppState {
    tasks: Task[];
    projects: Project[];
}
interface AppDependencies {
}
interface DateSuggestion {
    text: string;
    date: string;
    displayDate: string;
}
export declare class SmartDateSuggestionsManager {
    private _unusedState;
    private _unusedApp;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup smart date suggestions for date inputs
     */
    setupSmartDateSuggestions(): void;
    /**
     * Setup date input suggestions for a specific input element
     * @param input - Date input element
     */
    setupDateInputSuggestions(input: HTMLInputElement): void;
    /**
     * Parse natural language date input
     * @param input - User input string
     * @returns - Array of date suggestion objects
     */
    parseNaturalDate(input: string): DateSuggestion[];
}
export {};
//# sourceMappingURL=smart-date-suggestions.d.ts.map