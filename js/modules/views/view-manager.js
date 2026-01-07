/**
 * View manager - orchestrates view switching and rendering
 */

import { ViewLabels } from '../../constants.js';
import { escapeHtml } from '../../dom-utils.js';
import { TaskRenderer } from './task-renderer.js';
import { ProjectRenderer } from './project-renderer.js';

export class ViewManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.taskRenderer = new TaskRenderer(state, app);
        this.projectRenderer = new ProjectRenderer(state, app);
    }

    /**
     * Switch to a different view
     * @param {string} view - View name
     */
    switchView(view) {
        // Clear project filter when switching views
        this.state.currentProjectId = null;

        // Reset archived projects view when switching away from projects
        if (view !== 'projects') {
            this.state.showingArchivedProjects = false;
        }

        // Update active nav item
        this._updateNavigationActiveState(view);

        // Set current view
        this.state.currentView = view;

        // Update view title
        this._updateViewTitle(view);

        // Show/hide containers
        this._toggleContainers(view);

        // Render the view
        this.renderView();
    }

    /**
     * View tasks for a specific project
     * @param {string} projectId - Project ID
     */
    viewProjectTasks(projectId) {
        this.state.currentProjectId = projectId;

        // Clear active nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show tasks container
        this._showTasksContainer();

        // Update view title with project name and back button
        const project = this.state.projects.find(p => p.id === projectId);
        const viewTitle = document.getElementById('view-title');
        if (project) {
            viewTitle.innerHTML = `
                <button class="btn btn-secondary" id="back-to-projects" style="margin-right: 0.5rem;">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                ${escapeHtml(project.title)} - Tasks
                <button class="btn btn-primary" id="show-gantt-chart" style="margin-left: 1rem;">
                    <i class="fas fa-chart-bar"></i> Gantt Chart
                </button>
            `;

            // Add back button handler
            document.getElementById('back-to-projects').addEventListener('click', () => {
                this.state.currentProjectId = null;
                this.switchView('projects');
            });

            // Add Gantt chart button handler
            document.getElementById('show-gantt-chart').addEventListener('click', () => {
                this.app.openGanttChart?.(project);
            });
        }

        // Render tasks
        const tasksContainer = document.getElementById('tasks-container');
        this.taskRenderer.renderTasks(tasksContainer);
    }

    /**
     * Render the current view
     */
    renderView() {
        if (this.state.currentView === 'projects') {
            const container = document.getElementById('projects-container');
            this.projectRenderer.renderProjects(container);
        } else if (this.state.currentView === 'reference') {
            this.renderReference();
        } else {
            const container = document.getElementById('tasks-container');
            this.taskRenderer.renderTasks(container);
        }

        // Update bulk select button visibility after rendering
        this.app.updateBulkSelectButtonVisibility?.();
    }

    /**
     * Render reference items
     */
    renderReference() {
        const container = document.getElementById('reference-container');
        const references = this.state.tasks.filter(t => t.type === 'reference');

        container.innerHTML = '';

        if (references.length === 0) {
            container.innerHTML = this._renderEmptyState('No reference items found');
            return;
        }

        // Sort by updated date
        references.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        // Render references
        references.forEach(ref => {
            const element = this._createReferenceElement(ref);
            container.appendChild(element);
        });
    }

    /**
     * Update count badges in navigation
     */
    updateCounts() {
        const counts = {
            inbox: this.state.tasks.filter(t =>
                t.status === 'inbox' && !t.completed && !t.projectId
            ).length,
            next: this.state.tasks.filter(t =>
                t.status === 'next' && !t.completed && t.areDependenciesMet(this.state.tasks)
            ).length,
            waiting: this.state.tasks.filter(t =>
                t.status === 'waiting' && !t.completed
            ).length,
            someday: this.state.tasks.filter(t =>
                t.status === 'someday' && !t.completed
            ).length,
            projects: this.state.projects.filter(p => p.status === 'active').length
        };

        // Update DOM elements
        this._updateCount('inbox-count', counts.inbox);
        this._updateCount('next-count', counts.next);
        this._updateCount('waiting-count', counts.waiting);
        this._updateCount('someday-count', counts.someday);
        this._updateCount('projects-count', counts.projects);
        this._updateCount('reference-count', this.state.tasks.filter(t => t.type === 'reference').length);
        this._updateCount('templates-count', this.state.templates.length);
    }

    /**
     * Update context filter dropdown
     */
    updateContextFilter() {
        const contextFilter = document.getElementById('context-filter');

        // Build set of all contexts from tasks and projects
        const allContexts = new Set();
        this.state.tasks.forEach(task => {
            if (task.contexts) {
                task.contexts.forEach(context => allContexts.add(context));
            }
        });
        this.state.projects.forEach(project => {
            if (project.contexts) {
                project.contexts.forEach(context => allContexts.add(context));
            }
        });

        // Update dropdown filter if it exists
        if (contextFilter) {
            const currentValue = contextFilter.value;
            contextFilter.innerHTML = '<option value="">All Contexts</option>';

            Array.from(allContexts).sort().forEach(context => {
                const option = document.createElement('option');
                option.value = context;
                option.textContent = context;
                contextFilter.appendChild(option);
            });

            contextFilter.value = currentValue;
        }
    }

    /**
     * Update navigation active state
     * @private
     */
    _updateNavigationActiveState(view) {
        // Update main navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });

        // Update bottom navigation
        document.querySelectorAll('.bottom-nav-item[data-view]').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Update view title
     * @private
     */
    _updateViewTitle(view) {
        const baseTitle = ViewLabels[view] || view;
        let title = baseTitle;

        // Add context filter indicator
        if (this.state.selectedContextFilters && this.state.selectedContextFilters.size > 0) {
            const contexts = Array.from(this.state.selectedContextFilters).join(', ');
            title = `${baseTitle} (${contexts})`;
        }

        document.getElementById('view-title').textContent = title;
    }

    /**
     * Toggle container visibility
     * @private
     */
    _toggleContainers(view) {
        const tasksContainer = document.getElementById('tasks-container');
        const projectsContainer = document.getElementById('projects-container');
        const referenceContainer = document.getElementById('reference-container');

        tasksContainer.style.display = 'none';
        projectsContainer.style.display = 'none';
        referenceContainer.style.display = 'none';

        if (view === 'projects') {
            projectsContainer.style.display = 'block';
        } else if (view === 'reference') {
            referenceContainer.style.display = 'block';
        } else {
            tasksContainer.style.display = 'block';
        }
    }

    /**
     * Show tasks container
     * @private
     */
    _showTasksContainer() {
        const tasksContainer = document.getElementById('tasks-container');
        const projectsContainer = document.getElementById('projects-container');
        const referenceContainer = document.getElementById('reference-container');

        tasksContainer.style.display = 'block';
        projectsContainer.style.display = 'none';
        referenceContainer.style.display = 'none';
    }

    /**
     * Create reference element
     * @private
     */
    _createReferenceElement(ref) {
        const div = document.createElement('div');
        div.className = 'reference-item';
        div.dataset.referenceId = ref.id;

        div.innerHTML = `
            <div class="reference-content">
                <div class="reference-title">
                    <a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(ref.title)}
                    </a>
                </div>
                ${ref.description ? `<div class="reference-description">${escapeHtml(ref.description)}</div>` : ''}
                ${ref.contexts && ref.contexts.length > 0 ? `
                    <div class="reference-contexts">
                        ${ref.contexts.map(ctx => `<span class="task-context">${escapeHtml(ctx)}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="reference-meta">
                    <span class="reference-date">Added ${new Date(ref.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="reference-actions">
                <button class="reference-action-btn edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="reference-action-btn delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const editBtn = div.querySelector('.reference-action-btn.edit');
        editBtn.addEventListener('click', () => {
            this.app.openReferenceModal?.(ref);
        });

        const deleteBtn = div.querySelector('.reference-action-btn.delete');
        deleteBtn.addEventListener('click', () => {
            this.app.deleteReference?.(ref.id);
        });

        return div;
    }

    /**
     * Update count element
     * @private
     */
    _updateCount(elementId, count) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = count || '';
        }
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
     * Get task renderer instance
     */
    getTaskRenderer() {
        return this.taskRenderer;
    }

    /**
     * Get project renderer instance
     */
    getProjectRenderer() {
        return this.projectRenderer;
    }

    /**
     * Refresh current view
     */
    refresh() {
        this.renderView();
        this.updateCounts();
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.taskRenderer) {
            this.taskRenderer.destroy();
        }
        if (this.projectRenderer) {
            this.projectRenderer.destroy();
        }
    }
}
