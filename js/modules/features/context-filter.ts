/**
 * Context filter module - TypeScript Version
 * Handles context-based filtering of tasks and projects
 */

import { getAllContexts, getContextTaskCounts } from '../../config/defaultContexts.ts'
import { Task, Project } from '../../models'

/**
 * App interface for type safety
 */
interface App {
    renderView?: () => void
    showNotification?: (message: string) => void
}

/**
 * State interface for context filter
 */
interface State {
    tasks: Task[]
    projects: Project[]
    defaultContexts: string[]
    selectedContextFilters: Set<string>
}

export class ContextFilterManager {
    private state: State
    private app: App
    private clearContextFiltersHandler: (() => void) | null

    constructor(state: State, app: App) {
        this.state = state
        this.app = app
        this.clearContextFiltersHandler = null
    }

    /**
     * Update context filter dropdown
     */
    updateContextFilter(): void {
        const contextFilter = document.getElementById('context-filter')

        // Build set of all contexts from tasks and projects
        const allContexts = new Set<string>()
        this.state.tasks.forEach((task) => {
            if (task.contexts) {
                task.contexts.forEach((context) => allContexts.add(context))
            }
        })
        this.state.projects.forEach((project) => {
            if (project.contexts) {
                project.contexts.forEach((context) => allContexts.add(context))
            }
        })

        // Update dropdown filter if it exists
        if (contextFilter) {
            const currentValue = (contextFilter as HTMLSelectElement).value || ''
            contextFilter.innerHTML = '<option value="">All Contexts</option>'

            Array.from(allContexts)
                .sort()
                .forEach((context) => {
                    const option = document.createElement('option')
                    option.value = context
                    option.textContent = context
                    contextFilter.appendChild(option)
                })
            ;(contextFilter as HTMLSelectElement).value = currentValue
        }

        // Always update sidebar context filters
        this.updateSidebarContextFilters()
    }

    /**
     * Update sidebar context filters
     */
    updateSidebarContextFilters(): void {
        const container = document.getElementById('context-filters')
        if (!container) return

        // Get all contexts (default + custom)
        const allContexts = getAllContexts(this.state.tasks)

        // Initialize selected contexts filter if not exists
        if (!this.state.selectedContextFilters) {
            this.state.selectedContextFilters = new Set<string>()
        }

        // Clear existing filters
        container.innerHTML = ''

        if (allContexts.size === 0) {
            container.innerHTML =
                '<div style="padding: var(--spacing-sm); font-size: 0.8rem; color: var(--text-light); opacity: 0.7;">No contexts yet</div>'
            return
        }

        // Get task counts per context
        const contextTaskCounts = getContextTaskCounts(this.state.tasks) as Record<string, number>

        // Create checkbox for each context (sorted)
        Array.from(allContexts)
            .sort()
            .forEach((context) => {
                const wrapper = this._createContextFilterElement(context, contextTaskCounts)
                container.appendChild(wrapper)
            })

        // Add click handler for clear button
        const clearBtn = document.getElementById('clear-context-filters')
        if (clearBtn) {
            // Remove old listener to avoid duplicates
            if (this.clearContextFiltersHandler) {
                clearBtn.removeEventListener('click', this.clearContextFiltersHandler)
            }
            this.clearContextFiltersHandler = () => this.clearContextFilters()
            clearBtn.addEventListener('click', this.clearContextFiltersHandler)
        }
    }

    /**
     * Create a context filter checkbox element
     * @private
     */
    private _createContextFilterElement(
        context: string,
        contextTaskCounts: Record<string, number>
    ): HTMLElement {
        const wrapper = document.createElement('div')
        wrapper.style.cssText =
            'display: flex; align-items: center; padding: 6px 12px; cursor: pointer; border-radius: 4px; transition: background 0.2s;'
        wrapper.style.marginBottom = '2px'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = `context-filter-${context.replace('@', '').replace(/\s/g, '-')}`
        checkbox.value = context
        checkbox.checked = this.state.selectedContextFilters.has(context)
        checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;'

        const label = document.createElement('label')
        label.htmlFor = checkbox.id

        // Show context name and task count
        const taskCount = contextTaskCounts[context] || 0
        const isDefaultContext =
            Array.isArray(this.state.defaultContexts) &&
            this.state.defaultContexts.includes(context)

        label.innerHTML = `
            <span style="flex: 1; cursor: pointer; font-size: 0.85rem; color: var(--text-light);">
                ${context}
                ${taskCount > 0 ? `<span style="font-size: 0.75rem; opacity: 0.6; margin-left: 4px;">(${taskCount})</span>` : ''}
                ${!isDefaultContext ? '<span style="font-size: 0.7rem; opacity: 0.5; margin-left: 4px;">custom</span>' : ''}
            </span>
        `

        // Add click handler
        wrapper.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked
            }
            this.toggleContextFilter(context, checkbox.checked)
        })

        wrapper.appendChild(checkbox)
        wrapper.appendChild(label)

        return wrapper
    }

    /**
     * Toggle context filter on/off
     * @param {string} context - Context to toggle
     * @param {boolean} isChecked - Whether context should be filtered
     */
    toggleContextFilter(context: string, isChecked: boolean): void {
        if (isChecked) {
            this.state.selectedContextFilters.add(context)
        } else {
            this.state.selectedContextFilters.delete(context)
        }

        // Re-render view with updated filters
        this.app.renderView?.()

        // Show notification with count
        const count = this.state.selectedContextFilters.size
        if (count > 0) {
            this.app.showNotification?.(`Filtering by ${count} context${count > 1 ? 's' : ''}`)
        }
    }

    /**
     * Clear all context filters
     */
    clearContextFilters(): void {
        this.state.selectedContextFilters = new Set<string>()
        this.app.renderView?.()
        this.updateSidebarContextFilters()
        this.app.showNotification?.('Context filters cleared')
    }

    /**
     * Get currently selected contexts
     * @returns {Array} Array of selected contexts
     */
    getSelectedContexts(): string[] {
        return Array.from(this.state.selectedContextFilters)
    }

    /**
     * Check if a context is selected
     * @param {string} context - Context to check
     * @returns {boolean}
     */
    isContextSelected(context: string): boolean {
        return this.state.selectedContextFilters.has(context)
    }

    /**
     * Get all unique contexts from tasks and projects
     * @returns {Set} Set of unique contexts
     */
    getAllContexts(): Set<string> {
        const contexts = new Set<string>()

        this.state.tasks.forEach((task) => {
            if (task.contexts) {
                task.contexts.forEach((context) => contexts.add(context))
            }
        })

        this.state.projects.forEach((project) => {
            if (project.contexts) {
                project.contexts.forEach((context) => contexts.add(context))
            }
        })

        return contexts
    }

    /**
     * Normalize context name (ensure it starts with @)
     * @param {string} context - Context name
     * @returns {string} Normalized context name
     */
    normalizeContextName(context: string): string {
        return context.startsWith('@') ? context : `@${context}`
    }

    /**
     * Setup context filter event listeners
     */
    setup(): void {
        // Context filter is initialized during updateContextFilter
        // No additional setup needed
    }
}
