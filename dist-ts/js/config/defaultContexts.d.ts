/**
 * Default Contexts Configuration
 * Single source of truth for all default context definitions
 */
export interface Context {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    category: string;
}
export declare const defaultContexts: Context[];
export declare function getContextIds(): string[];
export declare function getContextById(id: string): Context | undefined;
export declare function getContextsByCategory(category: string): Context[];
export declare function getDefaultContextIds(): string[];
export declare function isDefaultContext(contextId: string): boolean;
export declare function getCategories(): string[];
/**
 * Combine default contexts with any custom contexts found in tasks
 * This is the standard way to get the complete list of contexts for display
 *
 * @param tasks - Array of task objects that may have contexts
 * @returns Set containing all context IDs (default + custom)
 */
export declare function getAllContexts(tasks?: any[]): Set<string>;
/**
 * Get task counts for each context
 *
 * @param tasks - Array of task objects that may have contexts
 * @returns Map of context ID to task count
 */
export declare function getContextTaskCounts(tasks?: any[]): Record<string, number>;
//# sourceMappingURL=defaultContexts.d.ts.map