/**
 * Default Contexts Configuration
 * Single source of truth for all default context definitions
 */

export interface Context {
    id: string
    name: string
    description: string
    icon: string
    color: string
    category: string
}

export const defaultContexts: Context[] = [
    {
        id: '@home',
        name: 'Home',
        description: 'Tasks to do at home',
        icon: 'fa-home',
        color: '#3498db',
        category: 'location'
    },
    {
        id: '@work',
        name: 'Work',
        description: 'Work-related tasks',
        icon: 'fa-briefcase',
        color: '#e74c3c',
        category: 'location'
    },
    {
        id: '@personal',
        name: 'Personal',
        description: 'Personal tasks and activities',
        icon: 'fa-user',
        color: '#9b59b6',
        category: 'general'
    },
    {
        id: '@computer',
        name: 'Computer',
        description: 'Tasks requiring a computer',
        icon: 'fa-desktop',
        color: '#34495e',
        category: 'equipment'
    },
    {
        id: '@phone',
        name: 'Phone',
        description: 'Phone calls and communication',
        icon: 'fa-phone',
        color: '#16a085',
        category: 'equipment'
    },
    {
        id: '@errand',
        name: 'Errand',
        description: 'Tasks requiring going out',
        icon: 'fa-car',
        color: '#f39c12',
        category: 'activity'
    }
]

// Helper function to get all context IDs
export function getContextIds(): string[] {
    return defaultContexts.map((ctx) => ctx.id)
}

// Helper function to get context by ID
export function getContextById(id: string): Context | undefined {
    return defaultContexts.find((ctx) => ctx.id === id)
}

// Helper function to get contexts by category
export function getContextsByCategory(category: string): Context[] {
    return defaultContexts.filter((ctx) => ctx.category === category)
}

// Helper function to get simple array of context IDs (for backward compatibility)
export function getDefaultContextIds(): string[] {
    return getContextIds()
}

// Helper function to check if a context is a default context
export function isDefaultContext(contextId: string): boolean {
    return getContextIds().includes(contextId)
}

// Get all categories
export function getCategories(): string[] {
    const categories = new Set(defaultContexts.map((ctx) => ctx.category))
    return Array.from(categories)
}

/**
 * Combine default contexts with any custom contexts found in tasks
 * This is the standard way to get the complete list of contexts for display
 *
 * @param tasks - Array of task objects that may have contexts
 * @returns Set containing all context IDs (default + custom)
 */
export function getAllContexts(tasks: any[] = []): Set<string> {
    const defaultContextIds = getContextIds()
    const customContexts = new Set<string>()

    // Handle null or undefined tasks
    if (!tasks || !Array.isArray(tasks)) {
        return new Set(defaultContextIds)
    }

    // Collect custom contexts from tasks
    tasks.forEach((task) => {
        if (task.contexts && Array.isArray(task.contexts)) {
            task.contexts.forEach((context: string) => {
                if (!defaultContextIds.includes(context)) {
                    customContexts.add(context)
                }
            })
        }
    })

    // Combine default and custom contexts
    return new Set([...defaultContextIds, ...Array.from(customContexts)])
}

/**
 * Get task counts for each context
 *
 * @param tasks - Array of task objects that may have contexts
 * @returns Map of context ID to task count
 */
export function getContextTaskCounts(tasks: any[] = []): Record<string, number> {
    const counts: Record<string, number> = {}

    // Handle null or undefined tasks
    if (!tasks || !Array.isArray(tasks)) {
        return counts
    }

    tasks.forEach((task) => {
        if (task.contexts && Array.isArray(task.contexts)) {
            task.contexts.forEach((context: string) => {
                counts[context] = (counts[context] || 0) + 1
            })
        }
    })

    return counts
}
