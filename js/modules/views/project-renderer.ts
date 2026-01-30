/**
 * Project rendering module
 * Handles project list rendering and project element creation
 */

import { escapeHtml } from '../../dom-utils'
import { Project } from '../../models'

// Define types for the app interface
interface AppDependencies {
    saveState?: (action: string) => void
    showNotification?: (message: string, type: string) => void
    openProjectModal?: (project: Project | null) => void
    deleteProject?: (projectId: string) => Promise<void>
    archiveProject?: (projectId: string) => Promise<void>
    unarchiveProject?: (projectId: string) => Promise<void>
    renderView?: () => void
    updateCounts?: () => void
    saveProjects?: () => Promise<void>
    [key: string]: any // Allow for additional app methods
}

interface AppState {
    projects: Project[]
    filters: {
        context?: string
    }
    showingArchivedProjects?: boolean
    [key: string]: any // Allow for additional state properties
}

export class ProjectRenderer {
    private state: AppState
    private app: AppDependencies

    constructor (state: AppState, app: AppDependencies) {
        this.state = state
        this.app = app
    }

    /**
     * Render projects to container
     * @param container - Container element
     */
    renderProjects (container: HTMLElement): void {
        let filteredProjects = this.state.projects

        // Check if we're showing archived projects
        const showingArchived = this.state.showingArchivedProjects || false

        // Filter out archived projects from normal view
        if (!showingArchived) {
            filteredProjects = filteredProjects.filter((project) => project.status !== 'archived')
        } else {
            // When showing archived, only show archived
            filteredProjects = filteredProjects.filter((project) => project.status === 'archived')
        }

        if (this.state.filters.context) {
            filteredProjects = filteredProjects.filter(
                (project) =>
                    project.contexts && project.contexts.includes(this.state.filters.context!)
            )
        }

        // Add header with toggle button
        const archivedCount = this.state.projects.filter((p) => p.status === 'archived').length

        if (archivedCount > 0 || showingArchived) {
            this._renderArchiveHeader(container, showingArchived, archivedCount)
        }

        // Clear existing project cards
        const existingProjects = container.querySelectorAll('.project-card')
        existingProjects.forEach((p) => p.remove())

        if (filteredProjects.length === 0) {
            const emptyDiv = document.createElement('div')
            emptyDiv.innerHTML = showingArchived
                ? this._renderEmptyState('No archived projects')
                : this._renderEmptyState('No projects found')
            container.appendChild(emptyDiv)
            return
        }

        // Sort projects: active first, then someday, then completed
        filteredProjects.sort((a, b) => {
            const statusOrder: Record<string, number> = { active: 0, someday: 1, completed: 2 }
            return statusOrder[a.status] - statusOrder[b.status]
        })

        // Render project cards
        const fragment = document.createDocumentFragment()
        filteredProjects.forEach((project) => {
            const card = this.createProjectCard(project)
            fragment.appendChild(card)
        })
        container.appendChild(fragment)
    }

    /**
     * Create project card element
     * @param project - Project object
     * @returns Project card element
     */
    createProjectCard (project: Project): HTMLElement {
        const card = document.createElement('div')
        card.className = 'project-card'
        card.dataset.projectId = project.id

        // Add status class
        card.classList.add(`project-${project.status}`)

        // Count tasks for this project
        const taskCount = this.state.tasks
            ? this.state.tasks.filter((t: any) => t.projectId === project.id && !t.completed).length
            : 0

        // Build context tags
        const contextTags =
            project.contexts && project.contexts.length > 0
                ? project.contexts
                    .map((ctx) => `<span class="project-context">${escapeHtml(ctx)}</span>`)
                    .join('')
                : ''

        card.innerHTML = `
            <div class="project-card-header">
                <div class="project-title">${escapeHtml(project.title)}</div>
                <div class="project-status-badge">${project.status}</div>
            </div>
            <div class="project-card-body">
                ${project.description ? `<div class="project-description">${escapeHtml(project.description)}</div>` : ''}
                ${contextTags ? `<div class="project-contexts">${contextTags}</div>` : ''}
                <div class="project-stats">
                    <span class="project-task-count">
                        <i class="fas fa-tasks"></i> ${taskCount} task${taskCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            <div class="project-card-actions">
                <button class="project-action-btn view" title="View project tasks">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="project-action-btn edit" title="Edit project">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="project-action-btn ${
    project.status === 'archived' ? 'unarchive' : 'archive'
}" title="${project.status === 'archived' ? 'Unarchive' : 'Archive'} project">
                    <i class="fas fa-${project.status === 'archived' ? 'box-open' : 'archive'}"></i>
                </button>
                <button class="project-action-btn delete" title="Delete project">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `

        // Add event listeners
        this._attachProjectCardListeners(card, project)

        return card
    }

    /**
     * Attach event listeners to project card
     * @private
     * @param card - Project card element
     * @param project - Project object
     */
    private _attachProjectCardListeners (card: HTMLElement, project: Project): void {
        // View button - show project tasks
        const viewBtn = card.querySelector('.project-action-btn.view')
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                this._viewProjectTasks(project)
            })
        }

        // Edit button
        const editBtn = card.querySelector('.project-action-btn.edit')
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                this.app.openProjectModal?.(project)
            })
        }

        // Archive/Unarchive button
        const archiveBtn = card.querySelector(
            '.project-action-btn.archive, .project-action-btn.unarchive'
        )
        if (archiveBtn) {
            archiveBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                if (project.status === 'archived') {
                    this.app.unarchiveProject?.(project.id)
                } else {
                    this.app.archiveProject?.(project.id)
                }
            })
        }

        // Delete button
        const deleteBtn = card.querySelector('.project-action-btn.delete')
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                if (
                    confirm(
                        `Delete project "${project.title}"? This will NOT delete associated tasks.`
                    )
                ) {
                    this.app.deleteProject?.(project.id)
                }
            })
        }

        // Card click (for selection)
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons
            if ((e.target as HTMLElement).closest('.project-action-btn')) {
                return
            }
            this._viewProjectTasks(project)
        })
    }

    /**
     * View project tasks
     * @private
     * @param project - Project object
     */
    private _viewProjectTasks (project: Project): void {
        // Save state for undo
        this.app.saveState?.('View project tasks')

        // Update app state to filter by this project
        if (this.app.setProjectFilter) {
            this.app.setProjectFilter(project.id)
        }

        // Switch to tasks view
        if (this.app.switchView) {
            this.app.switchView('next') // Default to Next Actions view for project tasks
        }

        // Update UI
        this.app.renderView?.()
    }

    /**
     * Render archive header with toggle button
     * @private
     * @param container - Container element
     * @param showingArchived - Whether archived projects are currently shown
     * @param archivedCount - Number of archived projects
     */
    private _renderArchiveHeader (
        container: HTMLElement,
        showingArchived: boolean,
        archivedCount: number
    ): void {
        // Remove existing header if any
        const existingHeader = container.querySelector('.archive-header')
        if (existingHeader) {
            existingHeader.remove()
        }

        const header = document.createElement('div')
        header.className = 'archive-header'

        header.innerHTML = `
            <div class="archive-header-content">
                <span class="archive-count">
                    <i class="fas fa-archive"></i> ${archivedCount} archived project${archivedCount !== 1 ? 's' : ''}
                </span>
                <button class="btn btn-link archive-toggle">
                    ${showingArchived ? 'Hide archived' : 'Show archived'}
                </button>
            </div>
        `

        // Add event listener to toggle button
        const toggleBtn = header.querySelector('.archive-toggle')
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this._toggleArchivedProjects()
            })
        }

        // Insert at beginning of container
        container.insertBefore(header, container.firstChild)
    }

    /**
     * Toggle archived projects visibility
     * @private
     */
    private _toggleArchivedProjects (): void {
        // Save state for undo
        this.app.saveState?.('Toggle archived projects')

        // Toggle state
        this.state.showingArchivedProjects = !this.state.showingArchivedProjects

        // Save state
        if (this.app.saveStateToStorage) {
            this.app.saveStateToStorage()
        }

        // Re-render
        this.app.renderView?.()
    }

    /**
     * Render empty state
     * @private
     * @param message - Empty state message
     * @returns HTML string
     */
    private _renderEmptyState (message: string): string {
        return `<div class="empty-state">
            <i class="fas fa-inbox fa-3x"></i>
            <p>${message}</p>
        </div>`
    }

    /**
     * Clean up
     */
    destroy (): void {
        // Nothing to clean up currently
    }
}
