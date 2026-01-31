/**
 * Bulk selection module
 * Handles bulk operations on multiple tasks
 */

import { Task } from '../../models'

// Define types for the app interface
interface AppDependencies {
    saveState?: (action: string) => void
    showNotification?: (message: string, type: string) => void
    toggleTaskComplete?: (taskId: string) => Promise<void>
    deleteTask?: (taskId: string) => Promise<void>
    updateTaskStatus?: (taskId: string, status: string) => Promise<void>
    updateTaskEnergy?: (taskId: string, energy: string) => Promise<void>
    updateTaskProject?: (taskId: string, projectId: string | null) => Promise<void>
    updateTaskContexts?: (taskId: string, contexts: string[]) => Promise<void>
    updateTaskDueDate?: (taskId: string, dueDate: string | null) => Promise<void>
    renderView?: () => void
    updateCounts?: () => void
    saveTasks?: () => Promise<void>
    [key: string]: any // Allow for additional app methods
}

interface AppState {
    tasks: Task[]
    selectedTaskIds: Set<string>
    bulkSelectionMode: boolean
    [key: string]: any // Allow for additional state properties
}

export class BulkSelection {
    private state: AppState
    private app: AppDependencies
    private selectedTaskIds: Set<string>

    constructor (state: AppState, app: AppDependencies) {
        this.state = state
        this.app = app
        this.selectedTaskIds = new Set()
    }

    /**
     * Setup bulk selection event listeners
     */
    setupBulkSelection (): void {
        const bulkSelectBtn = document.getElementById('btn-bulk-select')
        const bulkCompleteBtn = document.getElementById('btn-bulk-complete')
        const bulkSelectAllBtn = document.getElementById('btn-bulk-select-all')
        const bulkStatusBtn = document.getElementById('btn-bulk-status')
        const bulkEnergyBtn = document.getElementById('btn-bulk-energy')
        const bulkProjectBtn = document.getElementById('btn-bulk-project')
        const bulkContextBtn = document.getElementById('btn-bulk-context')
        const bulkDueDateBtn = document.getElementById('btn-bulk-due-date')
        const bulkDeleteBtn = document.getElementById('btn-bulk-delete')
        const bulkCancelBtn = document.getElementById('btn-bulk-cancel')

        // Show bulk select button when there are tasks
        this.updateBulkSelectButtonVisibility()

        // Toggle bulk selection mode
        if (bulkSelectBtn) {
            bulkSelectBtn.addEventListener('click', () => {
                this.toggleBulkSelectionMode()
            })
        }

        // Complete selected tasks
        if (bulkCompleteBtn) {
            bulkCompleteBtn.addEventListener('click', async () => {
                await this.bulkCompleteTasks()
            })
        }

        // Select all visible tasks
        if (bulkSelectAllBtn) {
            bulkSelectAllBtn.addEventListener('click', () => {
                this.bulkSelectAllVisible()
            })
        }

        // Update status for selected tasks
        if (bulkStatusBtn) {
            bulkStatusBtn.addEventListener('click', () => {
                this.showBulkStatusMenu()
            })
        }

        // Update energy for selected tasks
        if (bulkEnergyBtn) {
            bulkEnergyBtn.addEventListener('click', () => {
                this.showBulkEnergyMenu()
            })
        }

        // Update project for selected tasks
        if (bulkProjectBtn) {
            bulkProjectBtn.addEventListener('click', () => {
                this.showBulkProjectMenu()
            })
        }

        // Update contexts for selected tasks
        if (bulkContextBtn) {
            bulkContextBtn.addEventListener('click', () => {
                this.showBulkContextMenu()
            })
        }

        // Update due date for selected tasks
        if (bulkDueDateBtn) {
            bulkDueDateBtn.addEventListener('click', () => {
                this.showBulkDueDateMenu()
            })
        }

        // Delete selected tasks
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', async () => {
                await this.bulkDeleteTasks()
            })
        }

        // Cancel bulk selection
        if (bulkCancelBtn) {
            bulkCancelBtn.addEventListener('click', () => {
                this.cancelBulkSelection()
            })
        }
    }

    /**
     * Update bulk select button visibility
     */
    updateBulkSelectButtonVisibility (): void {
        const bulkSelectBtn = document.getElementById('btn-bulk-select')
        if (!bulkSelectBtn) return

        const hasTasks = this.state.tasks && this.state.tasks.length > 0
        bulkSelectBtn.style.display = hasTasks ? 'block' : 'none'
    }

    /**
     * Toggle bulk selection mode
     */
    toggleBulkSelectionMode (): void {
        this.state.bulkSelectionMode = !this.state.bulkSelectionMode

        if (this.state.bulkSelectionMode) {
            this.enterBulkSelectionMode()
        } else {
            this.exitBulkSelectionMode()
        }

        // Update UI
        this.app.renderView?.()
    }

    /**
     * Enter bulk selection mode
     * @private
     */
    private enterBulkSelectionMode (): void {
        // Clear any existing selection
        this.selectedTaskIds.clear()
        this.state.selectedTaskIds = this.selectedTaskIds

        // Show bulk selection toolbar
        const bulkToolbar = document.getElementById('bulk-actions-bar')
        if (bulkToolbar) {
            bulkToolbar.style.display = 'flex'
        }

        // Update button text
        const bulkSelectBtn = document.getElementById('btn-bulk-select')
        if (bulkSelectBtn) {
            bulkSelectBtn.textContent = 'Cancel Selection'
            bulkSelectBtn.classList.add('active')
        }

        // Add selection class to task items
        this._updateTaskSelectionUI()
    }

    /**
     * Exit bulk selection mode
     * @private
     */
    private exitBulkSelectionMode (): void {
        // Clear selection
        this.selectedTaskIds.clear()
        this.state.selectedTaskIds = this.selectedTaskIds

        // Exit bulk selection mode
        this.state.bulkSelectionMode = false

        // Hide bulk selection toolbar
        const bulkToolbar = document.getElementById('bulk-actions-bar')
        if (bulkToolbar) {
            bulkToolbar.style.display = 'none'
        }

        // Update button text
        const bulkSelectBtn = document.getElementById('btn-bulk-select')
        if (bulkSelectBtn) {
            bulkSelectBtn.textContent = 'Select Multiple'
            bulkSelectBtn.classList.remove('active')
        }

        // Update selected count
        this.updateBulkSelectedCount()

        // Remove selection class from task items
        this._updateTaskSelectionUI()
    }

    /**
     * Update task selection UI
     * @private
     */
    private _updateTaskSelectionUI (): void {
        const taskItems = document.querySelectorAll('.task-item')
        taskItems.forEach((item) => {
            const taskId = item.getAttribute('data-task-id')
            if (taskId && this.selectedTaskIds.has(taskId)) {
                item.classList.add('selected')
            } else {
                item.classList.remove('selected')
            }
        })
    }

    /**
     * Toggle task selection
     * @param taskId - Task ID to toggle
     */
    toggleTaskSelection (taskId: string): void {
        if (this.selectedTaskIds.has(taskId)) {
            this.selectedTaskIds.delete(taskId)
        } else {
            this.selectedTaskIds.add(taskId)
        }

        // Update state
        this.state.selectedTaskIds = this.selectedTaskIds

        // Update UI
        this._updateTaskSelectionUI()

        // Update bulk action buttons state
        this._updateBulkActionButtons()
    }

    /**
     * Update bulk action buttons state
     * @private
     */
    private _updateBulkActionButtons (): void {
        const hasSelection = this.selectedTaskIds.size > 0
        const buttons = document.querySelectorAll(
            '#bulk-selection-toolbar button:not(#btn-bulk-cancel)'
        )

        buttons.forEach((btn) => {
            if (hasSelection) {
                btn.removeAttribute('disabled')
            } else {
                btn.setAttribute('disabled', 'disabled')
            }
        })
    }

    /**
     * Bulk select all visible tasks
     */
    bulkSelectAllVisible (): void {
        const taskItems = document.querySelectorAll('.task-item')
        taskItems.forEach((item) => {
            const taskId = (item as HTMLElement).dataset.taskId
            if (taskId) {
                // Check if task has a checkbox
                const checkbox = item.querySelector('.task-checkbox') as HTMLInputElement | null
                if (checkbox) {
                    this.selectedTaskIds.add(taskId)
                    checkbox.checked = true
                }
            }
        })

        // Update state
        this.state.selectedTaskIds = this.selectedTaskIds

        // Update UI
        this._updateTaskSelectionUI()
        this._updateBulkActionButtons()
        this.updateBulkSelectedCount()

        // Show toast
        this.app.showToast?.(`${this.selectedTaskIds.size} tasks selected`)
    }

    /**
     * Bulk complete selected tasks
     */
    async bulkCompleteTasks (): Promise<void> {
        if (this.selectedTaskIds.size === 0) return

        // Save state for undo
        this.app.saveState?.('Bulk complete tasks')

        // Complete each selected task
        for (const taskId of this.selectedTaskIds) {
            await this.app.toggleTaskComplete?.(taskId)
        }

        // Save tasks
        await this.app.saveTasks?.()

        // Show toast before clearing selection
        const count = this.selectedTaskIds.size
        this.app.showToast?.(`${count} task(s) completed`)

        // Clear selection and exit mode
        this.exitBulkSelectionMode()

        // Update UI
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.renderProjectsDropdown?.()
    }

    /**
     * Bulk delete selected tasks
     */
    async bulkDeleteTasks (): Promise<void> {
        if (this.selectedTaskIds.size === 0) return

        if (!confirm(`Delete ${this.selectedTaskIds.size} selected task(s)?`)) {
            return
        }

        // Save state for undo
        this.app.saveState?.('Bulk delete tasks')

        // Delete each selected task
        for (const taskId of this.selectedTaskIds) {
            await this.app.deleteTask?.(taskId)
        }

        // Clear selection and exit mode
        this.exitBulkSelectionMode()

        // Update UI
        this.app.renderView?.()
        this.app.updateCounts?.()
    }

    /**
     * Show bulk status menu
     */
    showBulkStatusMenu (): void {
        if (this.selectedTaskIds.size === 0) return

        // Create status menu
        const menu = document.createElement('div')
        menu.className = 'bulk-action-menu'
        menu.innerHTML = `
            <div class="bulk-action-menu-header">
                <h4>Set Status</h4>
                <button class="close-menu">&times;</button>
            </div>
            <div class="bulk-action-menu-content">
                <button class="bulk-action-option" data-status="inbox">Inbox</button>
                <button class="bulk-action-option" data-status="next">Next Actions</button>
                <button class="bulk-action-option" data-status="waiting">Waiting</button>
                <button class="bulk-action-option" data-status="someday">Someday/Maybe</button>
            </div>
        `

        // Add event listeners
        const closeBtn = menu.querySelector('.close-menu')
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                menu.remove()
            })
        }

        const options = menu.querySelectorAll('.bulk-action-option')
        options.forEach((option) => {
            option.addEventListener('click', async (e) => {
                const status = (e.target as HTMLElement).getAttribute('data-status')
                if (status) {
                    await this.bulkUpdateStatus(status)
                    menu.remove()
                }
            })
        })

        // Add to document
        document.body.appendChild(menu)

        // Position menu
        const bulkStatusBtn = document.getElementById('btn-bulk-status')
        if (bulkStatusBtn) {
            const rect = bulkStatusBtn.getBoundingClientRect()
            menu.style.position = 'fixed'
            menu.style.top = `${rect.bottom + 5}px`
            menu.style.left = `${rect.left}px`
        }
    }

    /**
     * Bulk update task status
     * @param status - New status
     */
    async bulkUpdateStatus (status: string): Promise<void> {
        if (this.selectedTaskIds.size === 0) return

        // Save state for undo
        this.app.saveState?.(`Bulk update status to ${status}`)

        // Update each selected task
        for (const taskId of this.selectedTaskIds) {
            await this.app.updateTaskStatus?.(taskId, status)
        }

        // Save tasks
        await this.app.saveTasks?.()

        // Clear selection and exit mode
        this.exitBulkSelectionMode()

        // Update UI
        this.app.renderView?.()
        this.app.updateCounts?.()
    }

    /**
     * Show bulk energy menu
     */
    showBulkEnergyMenu (): void {
        const menu = document.createElement('div')
        menu.className = 'bulk-menu'
        menu.innerHTML = `
            <div class="bulk-menu-item" data-energy="high">High Energy</div>
            <div class="bulk-menu-item" data-energy="medium">Medium Energy</div>
            <div class="bulk-menu-item" data-energy="low">Low Energy</div>
            <div class="bulk-menu-item" data-energy="">No Energy</div>
        `

        document.body.appendChild(menu)

        menu.querySelectorAll('.bulk-menu-item').forEach((option) => {
            option.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement
                const energy = target.getAttribute('data-energy') || ''
                await this.bulkUpdateEnergy(energy)
                document.body.removeChild(menu)
            })
        })

        // Position menu near button
        const energyBtn = document.getElementById('btn-bulk-energy')
        if (energyBtn) {
            const rect = energyBtn.getBoundingClientRect()
            menu.style.position = 'absolute'
            menu.style.top = `${rect.bottom + 5}px`
            menu.style.left = `${rect.left}px`
        }
    }

    /**
     * Bulk update energy for selected tasks
     * @param energy - New energy level
     */
    async bulkUpdateEnergy (energy: string): Promise<void> {
        if (this.selectedTaskIds.size === 0) return

        // Save state for undo
        this.app.saveState?.(`Bulk update energy to ${energy || 'none'}`)

        // Update each selected task
        for (const taskId of this.selectedTaskIds) {
            await this.app.updateTaskEnergy?.(taskId, energy)
        }

        // Clear selection and exit mode
        this.exitBulkSelectionMode()

        // Update UI
        this.app.renderView?.()
        this.app.updateCounts?.()
    }

    /**
     * Show bulk project menu
     */
    showBulkProjectMenu (): void {
        // Create project selection menu
        const menu = document.createElement('div')
        menu.className = 'bulk-menu'

        // Add "No Project" option
        menu.innerHTML = '<div class="bulk-menu-item" data-project-id="">No Project</div>'

        // Add project options
        if (this.app.renderProjectsDropdown) {
            // This would need to be implemented to render project options
            console.log('Project menu would show project options')
        }

        document.body.appendChild(menu)

        menu.querySelectorAll('.bulk-menu-item').forEach((option) => {
            option.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement
                const projectId = target.getAttribute('data-project-id')
                await this.bulkUpdateProject(projectId === '' ? null : projectId)
                document.body.removeChild(menu)
            })
        })

        // Position menu near button
        const projectBtn = document.getElementById('btn-bulk-project')
        if (projectBtn) {
            const rect = projectBtn.getBoundingClientRect()
            menu.style.position = 'absolute'
            menu.style.top = `${rect.bottom + 5}px`
            menu.style.left = `${rect.left}px`
        }
    }

    /**
     * Bulk update project for selected tasks
     * @param projectId - New project ID or null for no project
     */
    async bulkUpdateProject (projectId: string | null): Promise<void> {
        if (this.selectedTaskIds.size === 0) return

        // Save state for undo
        this.app.saveState?.('Bulk update project')

        // Update each selected task
        for (const taskId of this.selectedTaskIds) {
            await this.app.updateTaskProject?.(taskId, projectId)
        }

        // Clear selection and exit mode
        this.exitBulkSelectionMode()

        // Update UI
        this.app.renderView?.()
        this.app.updateCounts?.()
    }

    /**
     * Show bulk context menu
     */
    showBulkContextMenu (): void {
        const context = prompt('Enter context to add (with or without @):')
        if (context === null) return // User cancelled

        const trimmedContext = context.trim()
        if (!trimmedContext) return // Empty input

        // Ensure context starts with @
        const formattedContext = trimmedContext.startsWith('@')
            ? trimmedContext
            : `@${trimmedContext}`

        this.bulkAddContext(formattedContext)
    }

    /**
     * Bulk add context to selected tasks
     * @param context - Context to add (should start with @)
     */
    async bulkAddContext (context: string): Promise<void> {
        if (this.selectedTaskIds.size === 0) return

        // Save state for undo
        this.app.saveState?.(`Bulk add context ${context}`)

        // Update each selected task
        for (const taskId of this.selectedTaskIds) {
            // Get current task
            const task = this.state.tasks.find((t) => t.id === taskId)
            if (task) {
                // Add context if not already present
                const currentContexts = task.contexts || []
                if (!currentContexts.includes(context)) {
                    const newContexts = [...currentContexts, context]
                    await this.app.updateTaskContexts?.(taskId, newContexts)
                }
            }
        }

        // Clear selection and exit mode
        this.exitBulkSelectionMode()

        // Update UI
        this.app.renderView?.()
        this.app.updateCounts?.()
    }

    /**
     * Show bulk due date menu
     */
    showBulkDueDateMenu (): void {
        const input = prompt('Enter due date (today, tomorrow, in X days, YYYY-MM-DD):')
        if (input === null) return // User cancelled

        const trimmedInput = input.trim()
        if (!trimmedInput) return // Empty input

        const dueDate = this._parseDueDate(trimmedInput)
        if (dueDate) {
            this.bulkUpdateDueDate(dueDate)
        } else {
            this.app.showNotification?.('Invalid date format', 'error')
        }
    }

    /**
     * Bulk update due date for selected tasks
     * @param dueDate - New due date in YYYY-MM-DD format
     */
    async bulkUpdateDueDate (dueDate: string): Promise<void> {
        if (this.selectedTaskIds.size === 0) return

        // Save state for undo
        this.app.saveState?.(`Bulk update due date to ${dueDate}`)

        // Update each selected task
        for (const taskId of this.selectedTaskIds) {
            await this.app.updateTaskDueDate?.(taskId, dueDate)
        }

        // Clear selection and exit mode
        this.exitBulkSelectionMode()

        // Update UI
        this.app.renderView?.()
        this.app.updateCounts?.()
    }

    /**
     * Parse due date input
     * @private
     */
    private _parseDueDate (input: string): string | null {
        const lowerInput = input.toLowerCase().trim()

        if (lowerInput === 'today') {
            return new Date().toISOString().split('T')[0]
        }

        if (lowerInput === 'tomorrow') {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            return tomorrow.toISOString().split('T')[0]
        }

        // Parse "in X days"
        const daysMatch = lowerInput.match(/^in\s+(\d+)\s+days?$/)
        if (daysMatch) {
            const days = parseInt(daysMatch[1], 10)
            const date = new Date()
            date.setDate(date.getDate() + days)
            return date.toISOString().split('T')[0]
        }

        // Parse "in X weeks"
        const weeksMatch = lowerInput.match(/^in\s+(\d+)\s+weeks?$/)
        if (weeksMatch) {
            const weeks = parseInt(weeksMatch[1], 10)
            const date = new Date()
            date.setDate(date.getDate() + weeks * 7)
            return date.toISOString().split('T')[0]
        }

        // Check if it's already in YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (dateRegex.test(input)) {
            return input
        }

        return null
    }

    /**
     * Cancel bulk selection
     */
    cancelBulkSelection (): void {
        this.exitBulkSelectionMode()
        this.app.renderView?.()
    }

    /**
     * Get selected task IDs
     * @returns Array of selected task IDs
     */
    getSelectedTaskIds (): string[] {
        return Array.from(this.selectedTaskIds)
    }

    /**
     * Get count of selected tasks
     * @returns Number of selected tasks
     */
    getSelectedCount (): number {
        return this.selectedTaskIds.size
    }

    /**
     * Check if bulk selection is active
     * @returns True if bulk selection mode is active
     */
    isActive (): boolean {
        return !!this.state.bulkSelectionMode
    }

    /**
     * Check if a task is selected
     * @param taskId - Task ID to check
     * @returns True if task is selected
     */
    isTaskSelected (taskId: string): boolean {
        return this.selectedTaskIds.has(taskId)
    }

    /**
     * Toggle selection of a task
     * @param taskId - Task ID to toggle
     */
    toggleBulkTaskSelection (taskId: string): void {
        if (this.selectedTaskIds.has(taskId)) {
            this.selectedTaskIds.delete(taskId)
        } else {
            this.selectedTaskIds.add(taskId)
        }

        // Update UI
        this._updateBulkActionButtons()
        this.updateBulkSelectedCount()
    }

    /**
     * Update the selected count display
     */
    updateBulkSelectedCount (): void {
        const countElement = document.getElementById('bulk-selected-count')
        if (countElement) {
            countElement.textContent = this.selectedTaskIds.size.toString()
        }

        // Update bulk complete button state
        const completeBtn = document.getElementById('btn-bulk-complete') as HTMLButtonElement | null
        if (completeBtn) {
            completeBtn.disabled = this.selectedTaskIds.size === 0
            completeBtn.style.opacity = this.selectedTaskIds.size === 0 ? '0.5' : '1'
        }
    }

    /**
     * Bulk set project for selected tasks
     */
    async bulkSetProject (): Promise<void> {
        this.showBulkProjectMenu()
    }

    /**
     * Bulk set due date for selected tasks
     */
    async bulkSetDueDate (): Promise<void> {
        this.showBulkDueDateMenu()
    }
}
