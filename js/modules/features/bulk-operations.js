/**
 * ============================================================================
 * Bulk Operations Manager
 * ============================================================================
 *
 * Manages the bulk selection and operations feature for multiple tasks.
 *
 * This manager handles:
 * - Bulk selection mode toggle
 * - Task selection tracking (Set of task IDs)
 * - Bulk actions: complete, delete, set status, energy, project, context, due date
 * - UI updates for selection state and button visibility
 * - Selection of all visible tasks
 */

export class BulkOperationsManager {
    constructor(state, app) {
        this.state = state
        this.app = app

        // Initialize bulk selection properties on state
        this.state.bulkSelectionMode = false
        this.state.selectedTaskIds = new Set()
    }

    // =========================================================================
    // SETUP
    // =========================================================================

    /**
     * Setup bulk selection feature
     */
    setupBulkSelection() {
        const bulkSelectBtn = document.getElementById('btn-bulk-select')
        const bulkActionsBar = document.getElementById('bulk-actions-bar')
        const bulkCompleteBtn = document.getElementById('btn-bulk-complete')
        const bulkCancelBtn = document.getElementById('btn-bulk-cancel')
        const bulkSelectedCount = document.getElementById('bulk-selected-count')
        const bulkSelectAllBtn = document.getElementById('btn-bulk-select-all')
        const bulkStatusBtn = document.getElementById('btn-bulk-status')
        const bulkEnergyBtn = document.getElementById('btn-bulk-energy')
        const bulkProjectBtn = document.getElementById('btn-bulk-project')
        const bulkContextBtn = document.getElementById('btn-bulk-context')
        const bulkDueDateBtn = document.getElementById('btn-bulk-due-date')
        const bulkDeleteBtn = document.getElementById('btn-bulk-delete')

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

        // Set status for selected tasks
        if (bulkStatusBtn) {
            bulkStatusBtn.addEventListener('click', () => {
                this.bulkSetStatus()
            })
        }

        // Set energy for selected tasks
        if (bulkEnergyBtn) {
            bulkEnergyBtn.addEventListener('click', () => {
                this.bulkSetEnergy()
            })
        }

        // Move selected tasks to project
        if (bulkProjectBtn) {
            bulkProjectBtn.addEventListener('click', () => {
                this.bulkSetProject()
            })
        }

        // Add context to selected tasks
        if (bulkContextBtn) {
            bulkContextBtn.addEventListener('click', () => {
                this.bulkAddContext()
            })
        }

        // Set due date for selected tasks
        if (bulkDueDateBtn) {
            bulkDueDateBtn.addEventListener('click', () => {
                this.bulkSetDueDate()
            })
        }

        // Delete selected tasks
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.bulkDeleteTasks()
            })
        }

        // Cancel bulk selection
        if (bulkCancelBtn) {
            bulkCancelBtn.addEventListener('click', () => {
                this.exitBulkSelectionMode()
            })
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Update bulk select button visibility based on task count
     */
    updateBulkSelectButtonVisibility() {
        const bulkSelectBtn = document.getElementById('btn-bulk-select')
        const tasks = document.querySelectorAll('.task-item')
        if (bulkSelectBtn) {
            bulkSelectBtn.style.display = tasks.length > 0 ? 'block' : 'none'
        }
    }

    /**
     * Toggle bulk selection mode
     */
    toggleBulkSelectionMode() {
        this.state.bulkSelectionMode = !this.state.bulkSelectionMode
        const bulkActionsBar = document.getElementById('bulk-actions-bar')
        const bulkSelectBtn = document.getElementById('btn-bulk-select')

        if (this.state.bulkSelectionMode) {
            bulkActionsBar.style.display = 'flex'
            bulkSelectBtn.innerHTML = '<i class="fas fa-times"></i> Exit Selection'
            this.app.renderView?.() // Re-render to show bulk checkboxes
        } else {
            this.exitBulkSelectionMode()
        }
    }

    /**
     * Exit bulk selection mode
     */
    exitBulkSelectionMode() {
        this.state.bulkSelectionMode = false
        this.state.selectedTaskIds.clear()
        const bulkActionsBar = document.getElementById('bulk-actions-bar')
        const bulkSelectBtn = document.getElementById('btn-bulk-select')

        if (bulkActionsBar) {
            bulkActionsBar.style.display = 'none'
        }
        if (bulkSelectBtn) {
            bulkSelectBtn.innerHTML = '<i class="fas fa-check-square"></i> Select Multiple'
        }
        this.updateBulkSelectedCount()
        this.app.renderView?.() // Re-render to hide bulk checkboxes
    }

    /**
     * Toggle task selection in bulk mode
     * @param {string} taskId - Task ID to toggle
     */
    toggleBulkTaskSelection(taskId) {
        if (this.state.selectedTaskIds.has(taskId)) {
            this.state.selectedTaskIds.delete(taskId)
        } else {
            this.state.selectedTaskIds.add(taskId)
        }
        this.updateBulkSelectedCount()
    }

    /**
     * Update selected count display and button states
     */
    updateBulkSelectedCount() {
        const bulkSelectedCount = document.getElementById('bulk-selected-count')
        const bulkCompleteBtn = document.getElementById('btn-bulk-complete')

        if (bulkSelectedCount) {
            bulkSelectedCount.textContent = this.state.selectedTaskIds.size
        }

        if (bulkCompleteBtn) {
            bulkCompleteBtn.disabled = this.state.selectedTaskIds.size === 0
            bulkCompleteBtn.style.opacity = this.state.selectedTaskIds.size === 0 ? '0.5' : '1'
        }
    }

    /**
     * Complete all selected tasks
     */
    async bulkCompleteTasks() {
        if (this.state.selectedTaskIds.size === 0) return

        const completedCount = this.state.selectedTaskIds.size

        for (const taskId of this.state.selectedTaskIds) {
            const task = this.state.tasks.find((t) => t.id === taskId)
            if (task && !task.completed) {
                task.completed = true
                task.completedAt = new Date().toISOString()
            }
        }

        await this.app.saveTasks?.()
        this.exitBulkSelectionMode()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.renderProjectsDropdown?.()
        this.app.showToast?.(`${completedCount} task(s) completed`)
    }

    /**
     * Select all visible tasks
     */
    bulkSelectAllVisible() {
        const visibleTasks = document.querySelectorAll('.task-item')
        visibleTasks.forEach((taskElement) => {
            const taskId = taskElement.dataset.taskId
            const checkbox = taskElement.querySelector('.bulk-select-checkbox')
            if (checkbox && taskId) {
                this.state.selectedTaskIds.add(taskId)
                checkbox.checked = true
            }
        })
        this.updateBulkSelectedCount()
        this.app.showToast?.(`${this.state.selectedTaskIds.size} tasks selected`)
    }

    /**
     * Set status for all selected tasks
     */
    async bulkSetStatus() {
        if (this.state.selectedTaskIds.size === 0) return

        const status = prompt('Enter status (inbox, next, waiting, someday):')
        if (!status || !['inbox', 'next', 'waiting', 'someday'].includes(status)) {
            this.app.showToast?.('Invalid status')
            return
        }

        this.app.saveState?.('Bulk set status')
        for (const taskId of this.state.selectedTaskIds) {
            const task = this.state.tasks.find((t) => t.id === taskId)
            if (task) {
                task.status = status
                task.updatedAt = new Date().toISOString()
            }
        }

        await this.app.saveTasks?.()
        this.exitBulkSelectionMode()
        this.app.renderView?.()
        this.app.updateCounts?.()
        // Note: Status changed, not showing count
        this.app.showToast?.(`Status set to ${status}`)
    }

    /**
     * Set energy level for all selected tasks
     */
    async bulkSetEnergy() {
        if (this.state.selectedTaskIds.size === 0) return

        const energy = prompt('Enter energy level (high, medium, low, or leave empty for none):')
        if (energy === null || (energy && !['high', 'medium', 'low'].includes(energy))) {
            this.app.showToast?.('Invalid energy level')
            return
        }

        this.app.saveState?.('Bulk set energy')
        for (const taskId of this.state.selectedTaskIds) {
            const task = this.state.tasks.find((t) => t.id === taskId)
            if (task) {
                task.energy = energy || ''
                task.updatedAt = new Date().toISOString()
            }
        }

        await this.app.saveTasks?.()
        this.exitBulkSelectionMode()
        this.app.renderView?.()
        // Note: Energy changed, not showing count
        this.app.showToast?.(`Energy set to ${energy || 'none'}`)
    }

    /**
     * Move all selected tasks to a project
     */
    async bulkSetProject() {
        if (this.state.selectedTaskIds.size === 0) return

        // Simple prompt - could be enhanced with a custom modal
        const projectTitles = this.state.projects.map((p, i) => `${i + 1}. ${p.title}`).join('\n')
        const choice = prompt(
            `Enter project number to move tasks to:\n0. No Project\n${projectTitles}`
        )

        if (choice === null) return

        const index = parseInt(choice) - 1
        const projectId =
            index === -1 ? null : this.state.projects[index] ? this.state.projects[index].id : null

        this.app.saveState?.('Bulk set project')
        for (const taskId of this.state.selectedTaskIds) {
            const task = this.state.tasks.find((t) => t.id === taskId)
            if (task) {
                task.projectId = projectId
                task.updatedAt = new Date().toISOString()
            }
        }

        await this.app.saveTasks?.()
        this.exitBulkSelectionMode()
        this.app.renderView?.()
        this.app.showToast?.(`Moved ${this.state.selectedTaskIds.size} task(s) to project`)
    }

    /**
     * Add context to all selected tasks
     */
    async bulkAddContext() {
        if (this.state.selectedTaskIds.size === 0) return

        const context = prompt('Enter context name (will be prefixed with @):')
        if (!context) return

        const formattedContext = context.startsWith('@') ? context : `@${context}`

        this.app.saveState?.('Bulk add context')
        for (const taskId of this.state.selectedTaskIds) {
            const task = this.state.tasks.find((t) => t.id === taskId)
            if (task) {
                task.contexts = task.contexts || []
                if (!task.contexts.includes(formattedContext)) {
                    task.contexts.push(formattedContext)
                }
                task.updatedAt = new Date().toISOString()
            }
        }

        await this.app.saveTasks?.()
        this.exitBulkSelectionMode()
        this.app.renderView?.()
        this.app.showToast?.(
            `Added ${formattedContext} to ${this.state.selectedTaskIds.size} task(s)`
        )
    }

    /**
     * Set due date for all selected tasks
     */
    async bulkSetDueDate() {
        if (this.state.selectedTaskIds.size === 0) return

        const date = prompt('Enter due date (YYYY-MM-DD) or relative (today, tomorrow, in 3 days):')
        if (!date) return

        // Parse relative dates
        let dueDate = date
        if (date.toLowerCase() === 'today') {
            dueDate = new Date().toISOString().split('T')[0]
        } else if (date.toLowerCase() === 'tomorrow') {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            dueDate = tomorrow.toISOString().split('T')[0]
        } else if (date.toLowerCase().startsWith('in ')) {
            const match = date.match(/in\s+(\d+)\s+(day|days|week|weeks)/)
            if (match) {
                const amount = parseInt(match[1])
                const unit = match[2]
                const targetDate = new Date()
                if (unit.startsWith('day')) {
                    targetDate.setDate(targetDate.getDate() + amount)
                } else if (unit.startsWith('week')) {
                    targetDate.setDate(targetDate.getDate() + amount * 7)
                }
                dueDate = targetDate.toISOString().split('T')[0]
            }
        }

        this.app.saveState?.('Bulk set due date')
        for (const taskId of this.state.selectedTaskIds) {
            const task = this.state.tasks.find((t) => t.id === taskId)
            if (task) {
                task.dueDate = dueDate
                task.updatedAt = new Date().toISOString()
            }
        }

        await this.app.saveTasks?.()
        this.exitBulkSelectionMode()
        this.app.renderView?.()
        this.app.showToast?.(`Due date set to ${dueDate}`)
    }

    /**
     * Delete all selected tasks
     */
    async bulkDeleteTasks() {
        if (this.state.selectedTaskIds.size === 0) return

        const deletedCount = this.state.selectedTaskIds.size

        if (!confirm(`Are you sure you want to delete ${deletedCount} task(s)?`)) {
            return
        }

        this.app.saveState?.('Bulk delete tasks')
        this.state.tasks = this.state.tasks.filter(
            (task) => !this.state.selectedTaskIds.has(task.id)
        )
        await this.app.saveTasks?.()
        this.exitBulkSelectionMode()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.showToast?.(`${deletedCount} task(s) deleted`)
    }
}
