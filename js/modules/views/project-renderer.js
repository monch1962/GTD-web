/**
 * Project rendering module
 * Handles project list rendering and project element creation
 */

import { escapeHtml } from '../../dom-utils.js';

export class ProjectRenderer {
    constructor(state, app) {
        this.state = state;
        this.app = app;
    }

    /**
     * Render projects to container
     * @param {HTMLElement} container - Container element
     */
    renderProjects(container) {
        let filteredProjects = this.state.projects;

        // Check if we're showing archived projects
        const showingArchived = this.state.showingArchivedProjects || false;

        // Filter out archived projects from normal view
        if (!showingArchived) {
            filteredProjects = filteredProjects.filter(project => project.status !== 'archived');
        } else {
            // When showing archived, only show archived
            filteredProjects = filteredProjects.filter(project => project.status === 'archived');
        }

        if (this.state.filters.context) {
            filteredProjects = filteredProjects.filter(project =>
                project.contexts && project.contexts.includes(this.state.filters.context)
            );
        }

        // Add header with toggle button
        const archivedCount = this.state.projects.filter(p => p.status === 'archived').length;

        if (archivedCount > 0 || showingArchived) {
            this._renderArchiveHeader(container, showingArchived, archivedCount);
        }

        // Clear existing project cards
        const existingProjects = container.querySelectorAll('.project-card');
        existingProjects.forEach(p => p.remove());

        if (filteredProjects.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.innerHTML = showingArchived
                ? this._renderEmptyState('No archived projects')
                : this._renderEmptyState('No projects found');
            container.appendChild(emptyDiv);
            return;
        }

        // Sort by position, then by updated date
        filteredProjects.sort((a, b) => {
            if (a.position !== b.position) {
                return a.position - b.position;
            }
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        // Render projects
        filteredProjects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            container.appendChild(projectElement);
        });
    }

    /**
     * Create a project element
     * @param {Project} project - Project object
     * @returns {HTMLElement} Project element
     */
    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'project-card';
        div.draggable = true;
        div.dataset.projectId = project.id;

        // Get project task statistics
        const allProjectTasks = this.state.tasks.filter(t => t.projectId === project.id);
        const completedTasks = allProjectTasks.filter(t => t.completed);
        const incompleteTasks = allProjectTasks.filter(t => !t.completed);
        const taskCount = incompleteTasks.length;

        // Calculate progress
        const totalTasks = allProjectTasks.length;
        const completionPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

        // Calculate overdue tasks
        const overdueTasks = incompleteTasks.filter(t => t.isOverdue());
        const overdueCount = overdueTasks.length;

        // Determine project health
        const health = this._calculateProjectHealth(overdueCount, taskCount, totalTasks);

        // Build project HTML
        div.innerHTML = this._buildProjectHTML(project, incompleteTasks, totalTasks, completedTasks, completionPercent, overdueCount, health, taskCount);

        // Attach event listeners
        this._attachProjectListeners(div, project);

        return div;
    }

    /**
     * Calculate project health status
     * @private
     */
    _calculateProjectHealth(overdueCount, taskCount, totalTasks) {
        let healthStatus = 'good';
        let healthIcon = 'fa-check-circle';
        let healthColor = '#5cb85c';

        if (overdueCount > 2) {
            healthStatus = 'critical';
            healthIcon = 'fa-exclamation-circle';
            healthColor = '#d9534f';
        } else if (overdueCount > 0 || taskCount > 10) {
            healthStatus = 'warning';
            healthIcon = 'fa-exclamation-triangle';
            healthColor = '#f0ad4e';
        } else if (totalTasks === 0) {
            healthStatus = 'empty';
            healthIcon = 'fa-minus-circle';
            healthColor = '#777';
        }

        return { status: healthStatus, icon: healthIcon, color: healthColor };
    }

    /**
     * Build project HTML string
     * @private
     */
    _buildProjectHTML(project, incompleteTasks, totalTasks, completedTasks, completionPercent, overdueCount, health, taskCount) {
        const tasksPreview = incompleteTasks.slice(0, 3).map(task =>
            `<div class="project-task-preview">
                <i class="far fa-circle"></i>
                <span>${escapeHtml(task.title)}</span>
            </div>`
        ).join('');

        let html = `
            <div class="project-header">
                <div class="project-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="project-title">${escapeHtml(project.title)}</div>
                <div class="project-health" title="Project Health: ${health.status}" style="color: ${health.color};">
                    <i class="fas ${health.icon}"></i>
                </div>
                <span class="project-status ${project.status}">${project.status}</span>
            </div>
            ${project.description ? `<div class="project-description">${escapeHtml(project.description)}</div>` : ''}
        `;

        // Progress bar
        if (totalTasks > 0) {
            html += `
                <div class="project-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${completionPercent}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>${completedTasks.length}/${totalTasks} tasks (${completionPercent}%)</span>
                        ${overdueCount > 0 ? `<span class="overdue-badge"><i class="fas fa-exclamation-circle"></i> ${overdueCount} overdue</span>` : ''}
                    </div>
                </div>
            `;
        }

        // Tasks preview
        if (taskCount > 0) {
            html += `
                <div class="project-tasks">
                    ${tasksPreview}
                    ${taskCount > 3 ? `<div class="project-tasks-more">+${taskCount - 3} more tasks</div>` : ''}
                </div>
            `;
        }

        // Empty project actions
        if (taskCount === 0 && project.status !== 'archived') {
            const message = totalTasks > 0 ? 'All tasks completed!' : 'This project has no tasks';
            html += `
                <div class="project-empty-actions" style="padding: var(--spacing-sm); background: rgba(240, 173, 78, 0.1); border-radius: var(--border-radius); margin-top: var(--spacing-sm);">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
                        <i class="fas fa-info-circle" style="color: #f0ad4e;"></i>
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">${message}</span>
                    </div>
                    <div style="display: flex; gap: var(--spacing-xs);">
                        <button class="btn-archive-project" style="flex: 1; padding: 6px 12px; font-size: 0.85rem; background: var(--info-color); color: white; border: none; border-radius: var(--border-radius); cursor: pointer;">
                            <i class="fas fa-archive"></i> Archive
                        </button>
                        <button class="btn-delete-project-confirm" style="flex: 1; padding: 6px 12px; font-size: 0.85rem; background: var(--danger-color); color: white; border: none; border-radius: var(--border-radius); cursor: pointer;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }

        // Archived badge
        if (project.status === 'archived') {
            html += `
                <div class="project-archived-badge" style="padding: var(--spacing-sm); background: rgba(127, 130, 140, 0.1); border-radius: var(--border-radius); margin-top: var(--spacing-sm);">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                            <i class="fas fa-archive" style="color: #7f828c;"></i>
                            <span style="font-size: 0.9rem; color: var(--text-secondary);">Archived</span>
                        </div>
                        <button class="btn-restore-project" style="padding: 6px 12px; font-size: 0.85rem; background: var(--success-color); color: white; border: none; border-radius: var(--border-radius); cursor: pointer;">
                            <i class="fas fa-undo"></i> Restore
                        </button>
                    </div>
                </div>
            `;
        }

        // Project meta
        html += `
            <div class="project-meta">
                <div class="project-tags">
                    ${project.contexts ? project.contexts.map(context => `<span class="task-context">${escapeHtml(context)}</span>`).join('') : ''}
                </div>
        `;

        // Project actions
        if (totalTasks > 0) {
            html += `
                <div class="project-actions">
                    <button class="btn-view-tasks" title="View tasks">
                        <i class="fas fa-list"></i>
                        ${taskCount} task${taskCount !== 1 ? 's' : ''}
                    </button>
                    <button class="task-action-btn edit-project" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete-project" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        } else {
            html += `
                <div class="project-actions">
                    <button class="task-action-btn edit-project" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;
        }

        html += '</div>';

        return html;
    }

    /**
     * Attach event listeners to project element
     * @private
     */
    _attachProjectListeners(element, project) {
        // Drag events
        element.addEventListener('dragstart', (e) => {
            element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', project.id);
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.project-card.dragging');
            if (draggingItem && draggingItem !== element) {
                const container = element.parentNode;
                const afterElement = this._getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggingItem);
                } else {
                    container.insertBefore(draggingItem, afterElement);
                }
            }
        });

        element.addEventListener('drop', async (e) => {
            e.preventDefault();
            await this.app.updateProjectPositions?.();
        });

        // Edit button
        const editBtn = element.querySelector('.edit-project');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.openProjectModal?.(project);
            });
        }

        // Delete button
        const deleteBtn = element.querySelector('.delete-project');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.deleteProject?.(project.id);
            });
        }

        // Delete confirm button
        const deleteConfirmBtn = element.querySelector('.btn-delete-project-confirm');
        if (deleteConfirmBtn) {
            deleteConfirmBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.deleteProject?.(project.id);
            });
        }

        // Archive button
        const archiveBtn = element.querySelector('.btn-archive-project');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.archiveProject?.(project.id);
            });
        }

        // Restore button
        const restoreBtn = element.querySelector('.btn-restore-project');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.restoreProject?.(project.id);
            });
        }

        // View tasks button
        const viewTasksBtn = element.querySelector('.btn-view-tasks');
        if (viewTasksBtn) {
            viewTasksBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.viewProjectTasks?.(project.id);
            });
        }

        // Double-click to view tasks
        element.addEventListener('dblclick', () => {
            this.app.viewProjectTasks?.(project.id);
        });
    }

    /**
     * Render archive header with toggle button
     * @private
     */
    _renderArchiveHeader(container, showingArchived, archivedCount) {
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); padding: var(--spacing-sm); background: var(--bg-secondary); border-radius: var(--border-radius);';

        const toggleButton = document.createElement('button');
        toggleButton.className = 'btn btn-secondary';
        toggleButton.style.cssText = 'font-size: 0.85rem;';
        toggleButton.innerHTML = showingArchived
            ? `<i class="fas fa-arrow-left"></i> Back to Active Projects`
            : `<i class="fas fa-archive"></i> Show Archived (${archivedCount})`;

        toggleButton.addEventListener('click', () => {
            this.state.showingArchivedProjects = !showingArchived;
            // Re-render projects
            const container = document.getElementById('projects-container');
            this.renderProjects(container);
        });

        headerDiv.appendChild(toggleButton);
        container.appendChild(headerDiv);
    }

    /**
     * Get element after drag position
     * @private
     */
    _getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.project-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Render empty state
     * @private
     */
    _renderEmptyState(message) {
        return `<div class="empty-state">
            <i class="fas fa-inbox fa-3x"></i>
            <p>${message}</p>
        </div>`;
    }

    /**
     * Clean up
     */
    destroy() {
        // Nothing to clean up currently
    }
}
