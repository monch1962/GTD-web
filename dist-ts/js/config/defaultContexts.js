'use strict'
/**
 * Default Contexts Configuration
 * Single source of truth for all default context definitions
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.defaultContexts = void 0
exports.getContextIds = getContextIds
exports.getContextById = getContextById
exports.getContextsByCategory = getContextsByCategory
exports.getDefaultContextIds = getDefaultContextIds
exports.isDefaultContext = isDefaultContext
exports.getCategories = getCategories
exports.getAllContexts = getAllContexts
exports.getContextTaskCounts = getContextTaskCounts
exports.defaultContexts = [
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
function getContextIds() {
    return exports.defaultContexts.map((ctx) => ctx.id)
}
// Helper function to get context by ID
function getContextById(id) {
    return exports.defaultContexts.find((ctx) => ctx.id === id)
}
// Helper function to get contexts by category
function getContextsByCategory(category) {
    return exports.defaultContexts.filter((ctx) => ctx.category === category)
}
// Helper function to get simple array of context IDs (for backward compatibility)
function getDefaultContextIds() {
    return getContextIds()
}
// Helper function to check if a context is a default context
function isDefaultContext(contextId) {
    return getContextIds().includes(contextId)
}
// Get all categories
function getCategories() {
    const categories = new Set(exports.defaultContexts.map((ctx) => ctx.category))
    return Array.from(categories)
}
/**
 * Combine default contexts with any custom contexts found in tasks
 * This is the standard way to get the complete list of contexts for display
 *
 * @param tasks - Array of task objects that may have contexts
 * @returns Set containing all context IDs (default + custom)
 */
function getAllContexts(tasks = []) {
    const defaultContextIds = getContextIds()
    const customContexts = new Set()
    // Handle null or undefined tasks
    if (!tasks || !Array.isArray(tasks)) {
        return new Set(defaultContextIds)
    }
    // Collect custom contexts from tasks
    tasks.forEach((task) => {
        if (task.contexts && Array.isArray(task.contexts)) {
            task.contexts.forEach((context) => {
                if (!defaultContextIds.includes(context)) {
                    customContexts.add(context)
                }
            })
        }
    })
    // Combine default and custom contexts
    return new Set([...defaultContextIds, ...customContexts])
}
/**
 * Get task counts for each context
 *
 * @param tasks - Array of task objects that may have contexts
 * @returns Map of context ID to task count
 */
function getContextTaskCounts(tasks = []) {
    const counts = {}
    // Handle null or undefined tasks
    if (!tasks || !Array.isArray(tasks)) {
        return counts
    }
    tasks.forEach((task) => {
        if (task.contexts && Array.isArray(task.contexts)) {
            task.contexts.forEach((context) => {
                counts[context] = (counts[context] || 0) + 1
            })
        }
    })
    return counts
}
//# sourceMappingURL=defaultContexts.js.map
