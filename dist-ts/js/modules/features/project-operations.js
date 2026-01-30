'use strict'
/**
 * Project Operations module
 * Handles CRUD operations for projects
 *
 * Features:
 * - Create new projects
 * - Delete projects (unlinks tasks but doesn't delete them)
 * - Archive/restore projects
 * - Update project health indicators
 *
 * @example
 * const projectOps = new ProjectOperations(state, app);
 * const project = projectOps.createProject({ title: 'My Project' });
 * await projectOps.deleteProject('project-123');
 * await projectOps.archiveProject('project-123');
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.ProjectOperations = void 0
const models_1 = require('../../models')
class ProjectOperations {
    /**
     * Create a new ProjectOperations instance
     * @param state - Application state object
     * @param app - Application instance
     */
    constructor(state, app) {
        this.state = state
        this.app = app
    }
    /**
     * Create a new project
     * @param projectData - Project data
     * @returns Created project
     */
    createProject(projectData) {
        const project = new models_1.Project(projectData)
        this.state.projects.push(project)
        return project
    }
    /**
     * Delete a project
     * @param projectId - Project ID to delete
     */
    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? Tasks will not be deleted.')) {
            return
        }
        // Save state for undo
        this.app.saveState?.('Delete project')
        // Remove project
        this.state.projects = this.state.projects.filter((p) => p.id !== projectId)
        // Remove project reference from tasks
        this.state.tasks.forEach((task) => {
            if (task.projectId === projectId) {
                task.projectId = null
            }
        })
        await this.app.saveProjects?.()
        await this.app.saveTasks?.()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.renderProjectsDropdown?.()
    }
    /**
     * Archive a project
     * @param projectId - Project ID to archive
     */
    async archiveProject(projectId) {
        const project = this.state.projects.find((p) => p.id === projectId)
        if (!project) return
        if (
            !confirm(
                `Archive "${project.title}"? The project will be hidden but can be restored later.`
            )
        ) {
            return
        }
        // Save state for undo
        this.app.saveState?.('Archive project')
        // Mark project as archived
        project.status = 'archived'
        project.updatedAt = new Date().toISOString()
        await this.app.saveProjects?.()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.renderProjectsDropdown?.()
        this.app.showNotification?.(`Project "${project.title}" archived`)
    }
    /**
     * Restore an archived project
     * @param projectId - Project ID to restore
     */
    async restoreProject(projectId) {
        const project = this.state.projects.find((p) => p.id === projectId)
        if (!project) return
        // Save state for undo
        this.app.saveState?.('Restore project')
        // Restore project to active status
        project.status = 'active'
        project.updatedAt = new Date().toISOString()
        await this.app.saveProjects?.()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.renderProjectsDropdown?.()
        this.app.showNotification?.(`Project "${project.title}" restored`)
    }
    /**
     * Update project positions after drag-and-drop reordering
     */
    async updateProjectPositions() {
        const container = document.querySelector('.projects-container')
        if (!container) return
        const projectElements = container.querySelectorAll('.project-card')
        // Update position for each project based on its DOM order
        projectElements.forEach((element, index) => {
            const projectId = element.dataset.projectId
            const project = this.state.projects.find((p) => p.id === projectId)
            if (project) {
                project.position = index
                project.updatedAt = new Date().toISOString()
            }
        })
        // Save the updated positions
        await this.app.saveProjects?.()
        // Update dropdown to reflect new order
        this.app.renderProjectsDropdown?.()
    }
    /**
     * Get project by ID
     * @param projectId - Project ID
     * @returns Project object or null
     */
    getProjectById(projectId) {
        return this.state.projects.find((p) => p.id === projectId) || null
    }
    /**
     * Get active projects
     * @returns Array of active projects
     */
    getActiveProjects() {
        return this.state.projects.filter((p) => p.status === 'active')
    }
    /**
     * Get archived projects
     * @returns Array of archived projects
     */
    getArchivedProjects() {
        return this.state.projects.filter((p) => p.status === 'archived')
    }
    /**
     * Get projects for a specific status
     * @param status - Project status
     * @returns Array of projects
     */
    getProjectsByStatus(status) {
        return this.state.projects.filter((p) => p.status === status)
    }
    /**
     * Get tasks for a project
     * @param projectId - Project ID
     * @returns Array of tasks
     */
    getTasksForProject(projectId) {
        return this.state.tasks.filter((t) => t.projectId === projectId)
    }
    /**
     * Get incomplete tasks for a project
     * @param projectId - Project ID
     * @returns Array of incomplete tasks
     */
    getIncompleteTasksForProject(projectId) {
        return this.state.tasks.filter((t) => t.projectId === projectId && !t.completed)
    }
    /**
     * Get completed tasks for a project
     * @param projectId - Project ID
     * @returns Array of completed tasks
     */
    getCompletedTasksForProject(projectId) {
        return this.state.tasks.filter((t) => t.projectId === projectId && t.completed)
    }
    /**
     * Calculate project completion percentage
     * @param projectId - Project ID
     * @returns Completion percentage (0-100)
     */
    getProjectCompletion(projectId) {
        const tasks = this.getTasksForProject(projectId)
        if (tasks.length === 0) return 0
        const completed = tasks.filter((t) => t.completed).length
        return Math.round((completed / tasks.length) * 100)
    }
    /**
     * Get project statistics
     * @param projectId - Project ID
     * @returns Project statistics
     */
    getProjectStats(projectId) {
        const tasks = this.getTasksForProject(projectId)
        const completed = tasks.filter((t) => t.completed)
        const incomplete = tasks.filter((t) => !t.completed)
        const overdue = incomplete.filter((t) => t.isOverdue())
        return {
            total: tasks.length,
            completed: completed.length,
            incomplete: incomplete.length,
            overdue: overdue.length,
            completionPercent:
                tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0
        }
    }
    /**
     * Update project
     * @param projectId - Project ID
     * @param updates - Properties to update
     */
    async updateProject(projectId, updates) {
        const project = this.getProjectById(projectId)
        if (!project) return
        // Save state for undo
        this.app.saveState?.('Update project')
        // Apply updates
        Object.keys(updates).forEach((key) => {
            project[key] = updates[key]
        })
        project.updatedAt = new Date().toISOString()
        await this.app.saveProjects?.()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.renderProjectsDropdown?.()
    }
    /**
     * Search projects by title
     * @param query - Search query
     * @returns Matching projects
     */
    searchProjects(query) {
        const lowerQuery = query.toLowerCase()
        return this.state.projects.filter(
            (p) =>
                p.title.toLowerCase().includes(lowerQuery) ||
                (p.description && p.description.toLowerCase().includes(lowerQuery))
        )
    }
}
exports.ProjectOperations = ProjectOperations
//# sourceMappingURL=project-operations.js.map
