/**
 * Archive module
 * Handles task archiving and restoration
 */

import { Task } from '../../models'
import { escapeHtml } from '../../dom-utils.js'

export class ArchiveManager {
    constructor(state, app) {
        this.state = state
        this.app = app
    }

    /**
     * Setup archive functionality
     */
    setupArchive() {
        // Archive button in sidebar
        const archiveBtn = document.getElementById('archive-button')
        if (archiveBtn) {
            archiveBtn.addEventListener('click', (e) => {
                e.preventDefault()
                this.openArchiveModal()
            })
        }

        // Close archive modal
        const closeArchiveBtn = document.getElementById('close-archive-modal')
        if (closeArchiveBtn) {
            closeArchiveBtn.addEventListener('click', () => this.closeArchiveModal())
        }

        // Auto-archive button
        const autoArchiveBtn = document.getElementById('btn-auto-archive')
        if (autoArchiveBtn) {
            autoArchiveBtn.addEventListener('click', () => this.autoArchiveOldTasks())
        }

        // Archive search
        const archiveSearch = document.getElementById('archive-search')
        if (archiveSearch) {
            archiveSearch.addEventListener('input', (e) => {
                this.renderArchive(e.target.value)
            })
        }

        // Archive project filter
        const archiveProjectFilter = document.getElementById('archive-filter-project')
        if (archiveProjectFilter) {
            archiveProjectFilter.addEventListener('change', () => {
                this.renderArchive()
            })
        }
    }

    /**
     * Open archive modal
     */
    openArchiveModal() {
        const modal = document.getElementById('archive-modal')
        if (modal) {
            modal.classList.add('active')
            this.renderArchive()
            this.populateArchiveProjectFilter()
        }
    }

    /**
     * Close archive modal
     */
    closeArchiveModal() {
        const modal = document.getElementById('archive-modal')
        if (modal) modal.classList.remove('active')
    }

    /**
     * Auto-archive old completed tasks
     */
    async autoArchiveOldTasks(daysOld = 30) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysOld)

        // Find completed tasks older than cutoff
        const tasksToArchive = this.state.tasks.filter((task) => {
            if (!task.completed || !task.completedAt) return false
            const completedDate = new Date(task.completedAt)
            return completedDate < cutoffDate
        })

        if (tasksToArchive.length === 0) {
            this.app.showToast?.(`No tasks to archive (none older than ${daysOld} days)`)
            return
        }

        if (
            !confirm(
                `Archive ${tasksToArchive.length} completed task(s) older than ${daysOld} days?`
            )
        ) {
            return
        }

        this.app.saveState?.('Auto-archive tasks')
        await this.archiveTasks(tasksToArchive)

        // Remove archived tasks from active list
        this.state.tasks = this.state.tasks.filter((task) => !tasksToArchive.includes(task))
        await this.app.saveTasks?.()

        this.renderArchive()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.showToast?.(`Archived ${tasksToArchive.length} tasks`)
    }

    /**
     * Archive multiple tasks
     */
    async archiveTasks(tasksToArchive) {
        await this.app.storage.addToArchive(tasksToArchive)
    }

    /**
     * Archive a single task
     */
    async archiveTask(taskId) {
        const task = this.state.tasks.find((t) => t.id === taskId)
        if (!task) return

        if (
            !confirm(
                `Archive "${task.title}"? The task will be moved to the archive and can be restored later.`
            )
        )
            return

        this.app.saveState?.('Archive task')

        // Add to archive - storage.addToArchive expects Task objects and creates the entry structure
        await this.app.storage.addToArchive([task])

        // Remove from active tasks
        this.state.tasks = this.state.tasks.filter((t) => t.id !== taskId)
        await this.app.saveTasks?.()

        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.showToast?.(`Task "${task.title}" archived`)
    }

    /**
     * Restore task from archive
     */
    async restoreFromArchive(archiveId) {
        const archive = this.app.storage.getArchivedTasks()
        const entry = archive.find((a) => a.task.id === archiveId)

        if (!entry) return

        this.app.saveState?.('Restore from archive')

        // Create task from archive entry
        const task = Task.fromJSON(entry.task)
        this.state.tasks.push(task)
        await this.app.saveTasks?.()

        // Remove from archive
        const updatedArchive = archive.filter((a) => a.task.id !== archiveId)
        await this.app.storage.saveArchivedTasks(updatedArchive)

        this.renderArchive()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.showToast?.('Task restored')
    }

    /**
     * Delete task from archive
     */
    async deleteFromArchive(archiveId) {
        if (!confirm('Permanently delete this archived task?')) return

        const archive = this.app.storage.getArchivedTasks()
        const updatedArchive = archive.filter((a) => a.task.id !== archiveId)
        await this.app.storage.saveArchivedTasks(updatedArchive)

        this.renderArchive()
        this.app.showToast?.('Archived task deleted')
    }

    /**
     * Render archive list
     */
    renderArchive(searchQuery = '') {
        const container = document.getElementById('archive-list')
        const countSpan = document.getElementById('archive-count')
        const projectFilter = document.getElementById('archive-filter-project')

        if (!container) return

        let archive = this.app.storage.getArchivedTasks()

        // Update stats
        if (countSpan) countSpan.textContent = archive.length

        if (archive.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                    <i class="fas fa-archive" style="font-size: 3rem; margin-bottom: var(--spacing-md); opacity: 0.3;"></i>
                    <p>No archived tasks</p>
                    <p style="font-size: 0.9rem;">Completed tasks can be archived here</p>
                </div>
            `
            return
        }

        // Apply filters
        const projectFilterValue = projectFilter ? projectFilter.value : ''

        let filteredArchive = archive.filter((entry) => {
            const task = entry.task

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesTitle = task.title.toLowerCase().includes(query)
                const matchesDesc =
                    task.description && task.description.toLowerCase().includes(query)
                const matchesContexts =
                    task.contexts && task.contexts.some((c) => c.toLowerCase().includes(query))
                if (!matchesTitle && !matchesDesc && !matchesContexts) return false
            }

            // Project filter
            if (projectFilterValue && entry.originalProjectId !== projectFilterValue) {
                return false
            }

            return true
        })

        // Sort by archived date (newest first)
        filteredArchive.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt))

        // Render archived tasks
        container.innerHTML = filteredArchive
            .map((entry) => {
                const task = entry.task
                const archivedDate = new Date(entry.archivedAt)
                const completedDate = task.completedAt ? new Date(task.completedAt) : null

                return `
                <div class="archived-task-card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--spacing-md); margin-bottom: var(--spacing-sm);" data-task-id="${task.id}">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 var(--spacing-xs) 0;">
                                <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                                ${escapeHtml(task.title)}
                            </h4>
                            ${task.description ? `<p style="color: var(--text-secondary); margin: var(--spacing-xs) 0; font-size: 0.9rem;">${escapeHtml(task.description)}</p>` : ''}
                            <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-xs); margin-top: var(--spacing-xs); font-size: 0.85rem; color: var(--text-secondary);">
                                ${entry.originalProjectId ? `<span><i class="fas fa-folder"></i> ${escapeHtml(this.getProjectTitle(entry.originalProjectId))}</span>` : ''}
                                ${task.contexts && task.contexts.map((ctx) => `<span class="badge" style="background: var(--context-color);">${escapeHtml(ctx)}</span>`).join('')}
                                <span><i class="fas fa-calendar-check"></i> Completed: ${completedDate ? completedDate.toLocaleDateString() : 'Unknown'}</span>
                                <span><i class="fas fa-archive"></i> Archived: ${archivedDate.toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: var(--spacing-xs); margin-left: var(--spacing-md);">
                            <button class="btn btn-sm btn-primary archive-restore-btn" title="Restore task">
                                <i class="fas fa-undo"></i> Restore
                            </button>
                            <button class="btn btn-sm btn-secondary archive-delete-btn" title="Delete permanently">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `
            })
            .join('')

        // Attach event listeners to restore and delete buttons
        filteredArchive.forEach((entry) => {
            const task = entry.task
            const taskCard = container.querySelector(`[data-task-id="${task.id}"]`)
            if (taskCard) {
                const restoreBtn = taskCard.querySelector('.archive-restore-btn')
                const deleteBtn = taskCard.querySelector('.archive-delete-btn')

                if (restoreBtn) {
                    restoreBtn.addEventListener('click', () => this.restoreFromArchive(task.id))
                }
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => this.deleteFromArchive(task.id))
                }
            }
        })

        if (filteredArchive.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                    <p>No archived tasks match your filters</p>
                </div>
            `
        }
    }

    /**
     * Populate archive project filter dropdown
     */
    populateArchiveProjectFilter() {
        const select = document.getElementById('archive-filter-project')
        if (!select) return

        // Get unique projects from archive
        const archive = this.app.storage.getArchivedTasks()
        const projectIds = [
            ...new Set(archive.map((entry) => entry.originalProjectId).filter(Boolean))
        ]

        // Clear existing options (except first)
        while (select.options.length > 1) {
            select.remove(1)
        }

        // Add project options
        projectIds.forEach((projectId) => {
            const project = this.state.projects.find((p) => p.id === projectId)
            if (project) {
                const option = document.createElement('option')
                option.value = projectId
                option.textContent = project.title
                select.appendChild(option)
            }
        })
    }

    /**
     * Get project title by ID
     * @param {string} projectId - Project ID
     * @returns {string} Project title or empty string
     */
    getProjectTitle(projectId) {
        const project = this.state.projects.find((p) => p.id === projectId)
        return project ? project.title : ''
    }

    /**
     * Get archived tasks
     * @returns {Array} Array of archived task entries
     */
    getArchivedTasks() {
        return this.app.storage.getArchivedTasks()
    }

    /**
     * Get archive count
     * @returns {number} Number of archived tasks
     */
    getArchiveCount() {
        return this.app.storage.getArchivedTasks().length
    }

    /**
     * Search archived tasks
     * @param {string} query - Search query
     * @returns {Array} Filtered archive entries
     */
    searchArchive(query) {
        const archive = this.app.storage.getArchivedTasks()
        const lowerQuery = query.toLowerCase()

        return archive.filter((entry) => {
            const task = entry.task
            const matchesTitle = task.title.toLowerCase().includes(lowerQuery)
            const matchesDesc =
                task.description && task.description.toLowerCase().includes(lowerQuery)
            const matchesContexts =
                task.contexts && task.contexts.some((c) => c.toLowerCase().includes(lowerQuery))
            return matchesTitle || matchesDesc || matchesContexts
        })
    }
}
