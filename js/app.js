/**
 * GTD Web Application
 * Main application logic
 */

import { Task, Project, Reference } from './models.js';
import { Storage } from './storage.js';
import { ElementIds, StorageKeys, TaskStatus, Views, RecurrenceLabels } from './constants.js';
import { getElement, setTextContent, escapeHtml } from './dom-utils.js';

class GTDApp {
    constructor() {
        this.storage = new Storage();
        this.tasks = [];
        this.projects = [];
        this.currentView = 'inbox';
        this.currentProjectId = null;
        this.filters = {
            context: '',
            energy: '',
            time: ''
        };
        this.pendingTaskData = null;
    }

    async init() {
        try {
            await this.initializeStorage();
            await this.loadData();
            this.setupEventListeners();
            this.displayUserId();
            this.initializeCustomContexts();
            await this.checkWaitingTasksDependencies();
            this.renderView();
            this.updateCounts();
            this.renderProjectsDropdown();
            this.updateContextFilter();
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    async initializeStorage() {
        await this.storage.init();
    }

    displayUserId() {
        const userIdElement = document.getElementById(ElementIds.userId);
        if (userIdElement && this.storage.userId) {
            userIdElement.textContent = this.storage.userId.substr(0, 12) + '...';
        }
    }

    initializeCustomContexts() {
        try {
            this.renderCustomContexts();
        } catch (error) {
            console.warn('Failed to render custom contexts:', error);
        }
    }

    handleInitializationError(error) {
        console.error('Error initializing GTD Web:', error);
        try {
            this.renderView();
        } catch (renderError) {
            console.error('Error rendering view after initialization failure:', renderError);
        }
    }

    async loadData() {
        // Load tasks
        const tasksData = this.storage.getTasks();
        this.tasks = tasksData.map(data => Task.fromJSON(data));

        // Load projects
        const projectsData = this.storage.getProjects();
        this.projects = projectsData.map(data => Project.fromJSON(data));
    }

    setupEventListeners() {
        this.setupNavigationListeners();
        this.setupProjectsDropdown();
        this.setupQuickAdd();
        this.setupFormListeners();
        this.setupModalListeners();
        this.setupFilterListeners();
        this.setupSyncButton();
    }

    setupNavigationListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });
    }

    setupProjectsDropdown() {
        const projectsToggle = document.querySelector('.projects-dropdown-toggle');
        if (!projectsToggle) return;

        projectsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = document.getElementById('projects-dropdown');
            const isExpanded = projectsToggle.classList.contains('expanded');

            if (isExpanded) {
                projectsToggle.classList.remove('expanded');
                dropdown.classList.remove('expanded');
            } else {
                projectsToggle.classList.add('expanded');
                dropdown.classList.add('expanded');
            }
        });
    }

    setupQuickAdd() {
        const quickAddInput = document.getElementById('quick-add-input');
        if (!quickAddInput) return;

        quickAddInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && quickAddInput.value.trim()) {
                this.quickAddTask(quickAddInput.value.trim());
                quickAddInput.value = '';
            }
        });
    }

    setupFormListeners() {
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTaskFromForm();
            });
        }

        const projectForm = document.getElementById('project-form');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProjectFromForm();
            });
        }
    }

    setupModalListeners() {
        // Task modal close buttons
        this.setupModalCloseButtons('task-modal', ['close-modal', 'cancel-modal'], () => this.closeTaskModal());
        // Project modal close buttons
        this.setupModalCloseButtons('project-modal', ['close-project-modal', 'cancel-project-modal'], () => this.closeProjectModal());
        // Gantt modal close button
        this.setupModalCloseButtons('gantt-modal', ['close-gantt-modal'], () => this.closeGanttModal());
    }

    setupModalCloseButtons(modalId, buttonIds, closeHandler) {
        // Setup button click handlers
        buttonIds.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', closeHandler);
            }
        });

        // Setup background click handler
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === modalId) {
                    closeHandler();
                }
            });
        }
    }

    setupFilterListeners() {
        this.setupFilter('context-filter', 'context');
        this.setupFilter('energy-filter', 'energy');
        this.setupFilter('time-filter', 'time');
    }

    setupFilter(elementId, filterKey) {
        const filter = document.getElementById(elementId);
        if (!filter) return;

        filter.addEventListener('change', (e) => {
            this.filters[filterKey] = e.target.value;
            this.renderView();
        });
    }

    setupSyncButton() {
        const syncButton = document.getElementById('sync-status');
        if (!syncButton) return;

        syncButton.addEventListener('click', async () => {
            await this.storage.sync();
            await this.loadData();
            this.renderView();
            this.updateCounts();
        });

        // Quick tags in quick-add
        document.querySelectorAll('.quick-context').forEach(btn => {
            btn.addEventListener('click', () => {
                const context = btn.dataset.context;
                const quickAddInput = document.getElementById('quick-add-input');
                if (quickAddInput.value) {
                    quickAddInput.value += ` ${context}`;
                } else {
                    quickAddInput.value = context;
                }
                quickAddInput.focus();
            });
        });

        // Quick tags in modal
        document.querySelectorAll('.quick-context-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const context = btn.dataset.context;
                const tagsInput = document.getElementById('task-contexts');
                const currentValue = tagsInput.value.trim();

                // Check if context already exists
                const tags = currentValue ? currentValue.split(',').map(t => t.trim()) : [];
                if (!tags.includes(context)) {
                    if (currentValue) {
                        tagsInput.value = `${currentValue}, ${context}`;
                    } else {
                        tagsInput.value = context;
                    }
                }
            });
        });

        // Add custom context button handler
        this.setupCustomTagHandler();

        // Context modal
        document.getElementById('btn-create-context').addEventListener('click', () => {
            this.openTagModal();
        });

        document.getElementById('context-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTagFromForm();
        });

        document.getElementById('close-context-modal').addEventListener('click', () => {
            this.closeTagModal();
        });

        document.getElementById('cancel-context-modal').addEventListener('click', () => {
            this.closeTagModal();
        });

        document.getElementById('context-modal').addEventListener('click', (e) => {
            if (e.target.id === 'context-modal') {
                this.closeTagModal();
            }
        });

        // Help modal
        document.getElementById('help-button').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('help-modal').classList.add('active');
        });

        document.getElementById('close-help-modal').addEventListener('click', () => {
            document.getElementById('help-modal').classList.remove('active');
        });

        document.getElementById('help-modal').addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') {
                document.getElementById('help-modal').classList.remove('active');
            }
        });
    }

    setupCustomTagHandler() {
        // Get or create custom tags from localStorage
        const getCustomContexts = () => {
            const tags = localStorage.getItem('gtd_custom_contexts');
            return tags ? JSON.parse(tags) : [];
        };

        const defaultContexts = ['@home', '@work', '@personal', '@computer', '@phone'];

        const saveCustomTag = (context) => {
            const tags = getCustomContexts();
            const allContexts = [...defaultContexts, ...contexts];

            // Check for duplicates (case-insensitive)
            const isDuplicate = allContexts.some(existingTag =>
                existingTag.toLowerCase() === context.toLowerCase()
            );

            if (!isDuplicate && !tags.includes(context)) {
                tags.push(context);
                localStorage.setItem('gtd_custom_contexts', JSON.stringify(tags));
                this.renderCustomContexts();
            }
        };

        // Monitor context input for new tags
        const tagsInput = document.getElementById('task-contexts');
        let lastValue = '';

        tagsInput.addEventListener('input', () => {
            const currentValue = tagsInput.value;
            if (currentValue !== lastValue) {
                // Extract tags from input
                const tags = currentValue.split(',').map(t => t.trim()).filter(t => t);

                // Save any new custom tags (excluding default @ tags)
                tags.forEach(context => {
                    if (context && !context.startsWith('@') && !getCustomContexts().includes(context)) {
                        saveCustomTag(context);
                    }
                });

                lastValue = currentValue;
            }
        });
    }

    renderCustomContexts() {
        const customContexts = JSON.parse(localStorage.getItem('gtd_custom_contexts') || '[]');

        // Quick-add section custom tags
        const quickContextsContainer = document.querySelector('.quick-contexts');
        if (quickContextsContainer) {
            // Remove existing custom tags
            quickContextsContainer.querySelectorAll('.custom-context').forEach(el => el.remove());

            // Add custom tags with delete button
            customContexts.forEach(context => {
                const wrapper = document.createElement('div');
                wrapper.className = 'custom-context-wrapper';
                wrapper.style.display = 'inline-flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '4px';

                const btn = document.createElement('button');
                btn.className = 'quick-context custom-context';
                btn.dataset.context = context;
                btn.addEventListener('click', (e) => {
                    // Don't trigger if clicking the delete button
                    if (e.target.classList.contains('custom-context-delete')) return;

                    const quickAddInput = document.getElementById('quick-add-input');
                    if (quickAddInput.value) {
                        quickAddInput.value += ` ${context}`;
                    } else {
                        quickAddInput.value = context;
                    }
                    quickAddInput.focus();
                });

                const label = document.createElement('span');
                label.textContent = context;
                btn.appendChild(label);

                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'custom-context-delete';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = `Delete context "${context}"`;
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.deleteTag(context);
                });

                btn.appendChild(deleteBtn);
                wrapper.appendChild(btn);
                quickContextsContainer.appendChild(wrapper);
            });
        }

        // Modal custom tags
        const modalContextsContainer = document.querySelector('.quick-contexts-modal');
        if (modalContextsContainer) {
            // Remove existing custom tags
            modalContextsContainer.querySelectorAll('.custom-context-modal').forEach(el => el.remove());

            // Add custom tags with delete button
            customContexts.forEach(context => {
                const wrapper = document.createElement('div');
                wrapper.className = 'custom-context-wrapper';
                wrapper.style.display = 'inline-flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '4px';

                const btn = document.createElement('button');
                btn.className = 'quick-context-modal custom-context-modal';
                btn.dataset.context = context;
                btn.addEventListener('click', (e) => {
                    // Don't trigger if clicking the delete button
                    if (e.target.classList.contains('custom-context-delete')) return;

                    const tagsInput = document.getElementById('task-contexts');
                    const currentValue = tagsInput.value.trim();
                    const tags = currentValue ? currentValue.split(',').map(t => t.trim()) : [];
                    if (!tags.includes(context)) {
                        if (currentValue) {
                            tagsInput.value = `${currentValue}, ${context}`;
                        } else {
                            tagsInput.value = context;
                        }
                    }
                });

                const label = document.createElement('span');
                label.textContent = context;
                btn.appendChild(label);

                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'custom-context-delete';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = `Delete context "${context}"`;
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.deleteTag(context);
                });

                btn.appendChild(deleteBtn);
                wrapper.appendChild(btn);
                modalContextsContainer.appendChild(wrapper);
            });
        }
    }

    switchView(view) {
        // Clear project filter when switching views
        this.currentProjectId = null;

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });

        this.currentView = view;

        // Update view title
        const titles = {
            'inbox': 'Inbox',
            'next': 'Next Actions',
            'waiting': 'Waiting For',
            'someday': 'Someday/Maybe',
            'projects': 'Projects',
            'reference': 'Reference',
            'all': 'All Items'
        };
        document.getElementById('view-title').textContent = titles[view] || view;

        // Show/hide containers
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

        this.renderView();
    }

    viewProjectTasks(projectId) {
        this.currentProjectId = projectId;

        // Update active state (no nav item should be active for project view)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show tasks container
        const tasksContainer = document.getElementById('tasks-container');
        const projectsContainer = document.getElementById('projects-container');
        const referenceContainer = document.getElementById('reference-container');

        tasksContainer.style.display = 'block';
        projectsContainer.style.display = 'none';
        referenceContainer.style.display = 'none';

        // Update view title with project name and back button
        const project = this.projects.find(p => p.id === projectId);
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
                this.currentProjectId = null;
                this.switchView('projects');
            });

            // Add Gantt chart button handler
            document.getElementById('show-gantt-chart').addEventListener('click', () => {
                this.openGanttChart(project);
            });
        }

        this.renderTasks();
    }

    renderView() {
        if (this.currentView === 'projects') {
            this.renderProjects();
        } else if (this.currentView === 'reference') {
            this.renderReference();
        } else {
            this.renderTasks();
        }
    }

    renderTasks() {
        const container = document.getElementById('tasks-container');
        let filteredTasks = this.tasks.filter(task => !task.completed);

        // Filter by project if viewing a specific project
        if (this.currentProjectId) {
            filteredTasks = filteredTasks.filter(task => task.projectId === this.currentProjectId);
        } else {
            // Filter by view (only when not viewing a specific project)
            if (this.currentView !== 'all') {
                filteredTasks = filteredTasks.filter(task => task.status === this.currentView);
            }

            // For Inbox view, exclude tasks that are assigned to projects
            if (this.currentView === 'inbox') {
                filteredTasks = filteredTasks.filter(task => !task.projectId);
            }

            // For Next view, exclude tasks with unmet dependencies
            if (this.currentView === 'next') {
                filteredTasks = filteredTasks.filter(task => task.areDependenciesMet(this.tasks));
            }
        }

        // Apply additional filters
        if (this.filters.context) {
            filteredTasks = filteredTasks.filter(task => task.contexts && task.contexts.includes(this.filters.context));
        }

        if (this.filters.energy) {
            filteredTasks = filteredTasks.filter(task => task.energy === this.filters.energy);
        }

        if (this.filters.time) {
            const maxTime = parseInt(this.filters.time);
            filteredTasks = filteredTasks.filter(task => {
                if (!task.time) return false;
                return task.time <= maxTime;
            });
        }

        // Clear container
        container.innerHTML = '';

        if (filteredTasks.length === 0) {
            container.innerHTML = this.renderEmptyState('No tasks found');
            return;
        }

        // Sort by position, then by updated date
        filteredTasks.sort((a, b) => {
            if (a.position !== b.position) {
                return a.position - b.position;
            }
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        // Render tasks
        filteredTasks.forEach((task, index) => {
            const taskElement = this.createTaskElement(task, index);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task, index) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.draggable = true;
        div.dataset.taskId = task.id;

        if (task.completed) {
            div.classList.add('completed');
        }

        // Add overdue class
        if (task.isOverdue && task.isOverdue()) {
            div.classList.add('overdue');
        }

        // Add deferred class
        if (!task.isAvailable()) {
            div.classList.add('deferred');
        }

        // Add drag handle icon
        const dragHandle = document.createElement('div');
        dragHandle.className = 'task-drag-handle';
        dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';

        // Format due date for display
        let dueDateDisplay = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            let dueLabel = '';
            if (task.isDueToday()) {
                dueLabel = 'Today';
            } else if (task.isDueWithin(7)) {
                dueLabel = dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            } else {
                dueLabel = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            const isOverdue = task.isOverdue();
            dueDateDisplay = `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                <i class="fas fa-calendar${isOverdue ? '-times' : '-day'}"></i> ${dueLabel}
            </span>`;
        }

        // Defer date display
        let deferDateDisplay = '';
        if (task.deferDate && !task.isAvailable()) {
            deferDateDisplay = `<span class="task-defer-date">
                <i class="fas fa-hourglass-half"></i> Until ${new Date(task.deferDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>`;
        }

        // Waiting For display
        let waitingForDisplay = '';
        const parts = [];

        // Show waiting description if present (only for waiting status)
        if (task.status === 'waiting' && task.waitingForDescription) {
            parts.push(`<i class="fas fa-hourglass-half"></i> Waiting: ${escapeHtml(task.waitingForDescription)}`);
        }

        // Show dependencies for any task that has them
        if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
            const pendingDeps = task.getPendingDependencies(this.tasks);
            if (pendingDeps.length > 0) {
                const depNames = pendingDeps.map(t => escapeHtml(t.title)).join(', ');
                parts.push(`<i class="fas fa-link"></i> Blocked by: ${depNames}`);
            } else {
                // Dependencies met - show indicator
                if (task.status === 'waiting') {
                    parts.push(`<i class="fas fa-check-circle"></i> Dependencies met!`);
                } else {
                    // For non-waiting tasks, just show that dependencies exist
                    parts.push(`<i class="fas fa-check-circle"></i> Dependencies met`);
                }
            }
        }

        if (parts.length > 0) {
            waitingForDisplay = `<span class="task-waiting-for">${parts.join(' | ')}</span>`;
        }

        // Recurrence display
        let recurrenceDisplay = '';
        if (task.isRecurring()) {
            const label = RecurrenceLabels[task.recurrence] || task.recurrence;
            recurrenceDisplay = `<span class="task-context" style="background-color: #e8f4f8; border-color: #4a90d9; color: #2c5f8d;">
                <i class="fas fa-redo"></i> ${label}
            </span>`;
        }

        div.innerHTML = `
            ${dragHandle.outerHTML}
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${task.contexts && task.contexts.length > 0 ? task.contexts.map(context => `<span class="task-context">${escapeHtml(context)}</span>`).join('') : ''}
                    ${recurrenceDisplay}
                    ${task.energy ? `<span class="task-energy"><i class="fas fa-bolt"></i> ${task.energy}</span>` : ''}
                    ${task.time ? `<span class="task-time"><i class="fas fa-clock"></i> ${task.time}m</span>` : ''}
                    ${dueDateDisplay}
                    ${deferDateDisplay}
                    ${waitingForDisplay}
                    ${task.projectId ? `<span class="task-project">${this.getProjectTitle(task.projectId)}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Drag and drop event listeners
        div.addEventListener('dragstart', (e) => {
            div.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', task.id);

            // Auto-expand projects dropdown when dragging starts
            const projectsToggle = document.querySelector('.projects-dropdown-toggle');
            const projectsDropdown = document.getElementById('projects-dropdown');
            if (projectsToggle && projectsDropdown && !projectsDropdown.classList.contains('expanded')) {
                projectsToggle.classList.add('expanded');
                projectsDropdown.classList.add('expanded');
            }
        });

        div.addEventListener('dragend', async () => {
            div.classList.remove('dragging');

            // Collapse projects dropdown if no item is being hovered
            setTimeout(() => {
                const dragOver = document.querySelector('.project-dropdown-item.drag-over');
                if (!dragOver) {
                    const projectsToggle = document.querySelector('.projects-dropdown-toggle');
                    const projectsDropdown = document.getElementById('projects-dropdown');
                    if (projectsToggle && projectsDropdown) {
                        projectsToggle.classList.remove('expanded');
                        projectsDropdown.classList.remove('expanded');
                    }
                }
            }, 100);
        });

        div.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            if (draggingItem && draggingItem !== div) {
                const container = div.parentNode;
                const afterElement = getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggingItem);
                } else {
                    container.insertBefore(draggingItem, afterElement);
                }
            }
        });

        div.addEventListener('drop', async (e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            await this.updateTaskPositions();
        });

        // Event listeners
        const checkbox = div.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => this.toggleTaskComplete(task.id));

        const editBtn = div.querySelector('.task-action-btn.edit');
        editBtn.addEventListener('click', () => this.openTaskModal(task));

        const deleteBtn = div.querySelector('.task-action-btn.delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        return div;
    }

    renderProjects() {
        const container = document.getElementById('projects-container');
        let filteredProjects = this.projects;

        if (this.filters.context) {
            filteredProjects = filteredProjects.filter(project => project.contexts && project.contexts.includes(this.filters.context));
        }

        container.innerHTML = '';

        if (filteredProjects.length === 0) {
            container.innerHTML = this.renderEmptyState('No projects found');
            return;
        }

        // Sort by position, then by updated date
        filteredProjects.sort((a, b) => {
            if (a.position !== b.position) {
                return a.position - b.position;
            }
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        filteredProjects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            container.appendChild(projectElement);
        });
    }

    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'project-card';
        div.draggable = true;
        div.dataset.projectId = project.id;

        const projectTasks = this.tasks.filter(t => t.projectId === project.id && !t.completed);
        const taskCount = projectTasks.length;

        // Get next few incomplete tasks
        const upcomingTasks = projectTasks.slice(0, 3);
        const tasksPreview = upcomingTasks.map(task =>
            `<div class="project-task-preview">
                <i class="far fa-circle"></i>
                <span>${escapeHtml(task.title)}</span>
            </div>`
        ).join('');

        div.innerHTML = `
            <div class="project-header">
                <div class="project-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="project-title">${escapeHtml(project.title)}</div>
                <span class="project-status ${project.status}">${project.status}</span>
            </div>
            ${project.description ? `<div class="project-description">${escapeHtml(project.description)}</div>` : ''}
            ${taskCount > 0 ? `
                <div class="project-tasks">
                    ${tasksPreview}
                    ${taskCount > 3 ? `<div class="project-tasks-more">+${taskCount - 3} more tasks</div>` : ''}
                </div>
            ` : ''}
            <div class="project-meta">
                <div class="project-tags">
                    ${project.contexts ? project.contexts.map(context => `<span class="task-context">${escapeHtml(context)}</span>`).join('') : ''}
                </div>
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
            </div>
        `;

        // Drag and drop event listeners
        div.addEventListener('dragstart', (e) => {
            div.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', project.id);
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
        });

        div.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingItem = document.querySelector('.project-card.dragging');
            if (draggingItem && draggingItem !== div) {
                const container = div.parentNode;
                const afterElement = getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggingItem);
                } else {
                    container.insertBefore(draggingItem, afterElement);
                }
            }
        });

        div.addEventListener('drop', async (e) => {
            e.preventDefault();
            await this.updateProjectPositions();
        });

        const editBtn = div.querySelector('.edit-project');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openProjectModal(project);
        });

        const deleteBtn = div.querySelector('.delete-project');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteProject(project.id);
        });

        const viewTasksBtn = div.querySelector('.btn-view-tasks');
        if (viewTasksBtn) {
            viewTasksBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // View only this project's tasks
                this.viewProjectTasks(project.id);
            });
        }

        div.addEventListener('dblclick', () => {
            this.viewProjectTasks(project.id);
        });

        return div;
    }

    renderReference() {
        const container = document.getElementById('reference-container');
        const references = this.tasks.filter(task => task.type === 'reference');

        container.innerHTML = '';

        if (references.length === 0) {
            container.innerHTML = this.renderEmptyState('No reference items found');
            return;
        }

        references.forEach(ref => {
            const refElement = this.createTaskElement(ref);
            container.appendChild(refElement);
        });
    }

    renderEmptyState(message) {
        return `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>${message}</h3>
                <p>Add items using the quick add input above</p>
            </div>
        `;
    }

    async quickAddTask(title) {
        const task = new Task({
            title: title,
            status: this.currentView === 'all' ? 'inbox' : this.currentView,
            type: 'task'
        });

        this.tasks.push(task);
        await this.saveTasks();
        this.renderView();
        this.updateCounts();
        this.updateContextFilter();
    }

    async toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            if (task.completed) {
                task.markIncomplete();
            } else {
                task.markComplete();

                // Check if task is recurring and create next instance
                if (task.isRecurring() && !task.shouldRecurrenceEnd()) {
                    const nextInstance = task.createNextInstance();
                    if (nextInstance) {
                        this.tasks.push(nextInstance);
                        await this.saveTasks();
                    }
                }
            }
            await this.saveTasks();

            // Check if any waiting tasks now have their dependencies met
            await this.checkWaitingTasksDependencies();

            this.renderView();
            this.updateCounts();
        }
    }

    async checkWaitingTasksDependencies() {
        let movedCount = 0;

        // Check all waiting tasks
        this.tasks.forEach(task => {
            if (task.status === 'waiting') {
                let shouldMove = false;
                let reason = '';

                // Check if task dependencies are met
                if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                    if (task.areDependenciesMet(this.tasks)) {
                        shouldMove = true;
                        reason = 'dependencies met';
                    }
                }
                // If no task dependencies, check if defer date has arrived
                else if (!task.waitingForTaskIds || task.waitingForTaskIds.length === 0) {
                    if (task.deferDate && task.isAvailable()) {
                        shouldMove = true;
                        reason = 'defer date arrived';
                    }
                    // If no defer date and no description, it's just waiting - move it
                    else if (!task.deferDate && !task.waitingForDescription) {
                        shouldMove = true;
                        reason = 'no longer blocked';
                    }
                }

                if (shouldMove) {
                    // Move to Next Actions
                    task.status = 'next';
                    task.waitingForTaskIds = []; // Clear dependencies
                    task.waitingForDescription = ''; // Clear description
                    task.updatedAt = new Date().toISOString();
                    movedCount++;
                }
            }
        });

        if (movedCount > 0) {
            await this.saveTasks();
        }
    }

    openTaskModal(task = null, defaultProjectId = null) {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        const title = document.getElementById('modal-title');

        // Reset form
        form.reset();

        // Update project options
        const projectSelect = document.getElementById('task-project');
        projectSelect.innerHTML = '<option value="">No Project</option>';

        // Add option to create new project
        const createOption = document.createElement('option');
        createOption.value = '__create_new__';
        createOption.textContent = '+ Create new project...';
        createOption.style.fontWeight = 'bold';
        createOption.style.color = 'var(--primary-color)';
        projectSelect.appendChild(createOption);

        // Add existing projects
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.title;
            projectSelect.appendChild(option);
        });

        // Handle create new project selection
        projectSelect.addEventListener('change', (e) => {
            if (e.target.value === '__create_new__') {
                // Remember the current form data
                const formData = {
                    title: document.getElementById('task-title').value,
                    description: document.getElementById('task-description').value,
                    status: document.getElementById('task-status').value,
                    energy: document.getElementById('task-energy').value,
                    time: document.getElementById('task-time').value,
                    contexts: document.getElementById('task-contexts').value,
                    dueDate: document.getElementById('task-due-date').value,
                    deferDate: document.getElementById('task-defer-date').value
                };

                // Close task modal and open project modal
                this.closeTaskModal();
                this.openProjectModal(null, formData);
            }
        }, { once: true });

        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-type').value = task.type || 'task';
            document.getElementById('task-status').value = task.status || 'inbox';
            document.getElementById('task-energy').value = task.energy || '';
            document.getElementById('task-time').value = task.time || '';
            document.getElementById('task-project').value = task.projectId || '';
            document.getElementById('task-due-date').value = task.dueDate || '';
            document.getElementById('task-defer-date').value = task.deferDate || '';
            document.getElementById('task-waiting-for-description').value = task.waitingForDescription || '';
            document.getElementById('task-contexts').value = task.contexts ? task.contexts.join(', ') : '';
            document.getElementById('task-recurrence').value = task.recurrence || '';
            document.getElementById('task-recurrence-end-date').value = task.recurrenceEndDate || '';
        } else {
            title.textContent = 'Add Task';
            document.getElementById('task-id').value = '';
            document.getElementById('task-status').value = this.currentView === 'all' ? 'inbox' : this.currentView;
            document.getElementById('task-waiting-for-description').value = '';
            document.getElementById('task-recurrence').value = '';
            document.getElementById('task-recurrence-end-date').value = '';

            // Set default project if provided (when adding from project view)
            if (defaultProjectId) {
                document.getElementById('task-project').value = defaultProjectId;
            }
        }

        // Setup status change listener to show/hide waiting for fields
        const statusSelect = document.getElementById('task-status');
        const waitingForSection = document.getElementById('waiting-for-section');
        const waitingForDepsSection = document.getElementById('waiting-for-deps-section');

        const updateWaitingForFields = () => {
            // Always show dependency section (it's useful for any task)
            waitingForDepsSection.style.display = 'block';
            this.renderWaitingForTasksList(task);

            // Only show waiting-for-description for "waiting" status
            if (statusSelect.value === 'waiting') {
                waitingForSection.style.display = 'block';
            } else {
                waitingForSection.style.display = 'none';
            }
        };

        statusSelect.addEventListener('change', updateWaitingForFields);
        updateWaitingForFields(); // Initial call

        // Setup recurrence change listener to show/hide end date field
        const recurrenceSelect = document.getElementById('task-recurrence');
        const recurrenceEndDateGroup = document.getElementById('recurrence-end-date-group');

        const updateRecurrenceFields = () => {
            if (recurrenceSelect.value && recurrenceSelect.value !== '') {
                recurrenceEndDateGroup.style.display = 'block';
            } else {
                recurrenceEndDateGroup.style.display = 'none';
            }
        };

        recurrenceSelect.addEventListener('change', updateRecurrenceFields);
        updateRecurrenceFields(); // Initial call

        modal.classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
    }

    renderWaitingForTasksList(currentTask) {
        const container = document.getElementById('waiting-for-tasks-list');
        const currentTaskId = currentTask ? currentTask.id : null;
        const currentProjectId = currentTask ? currentTask.projectId : null;

        // Get all incomplete tasks except the current one
        let availableTasks = this.tasks.filter(t =>
            !t.completed && t.id !== currentTaskId && t.status !== 'completed'
        );

        // If current task belongs to a project, only show tasks from the same project
        if (currentProjectId) {
            availableTasks = availableTasks.filter(t => t.projectId === currentProjectId);
        }

        if (availableTasks.length === 0) {
            if (currentProjectId) {
                container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">No other tasks available in this project</p>';
            } else {
                container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">No other tasks available</p>';
            }
            return;
        }

        container.innerHTML = '';

        availableTasks.forEach(task => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.padding = '4px 0';
            wrapper.style.borderBottom = '1px solid var(--bg-secondary)';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `dep-task-${task.id}`;
            checkbox.value = task.id;
            checkbox.style.width = '16px';
            checkbox.style.height = '16px';
            checkbox.style.marginRight = '8px';
            checkbox.style.flexShrink = '0';

            // Check if this task is already a dependency
            if (currentTask && currentTask.waitingForTaskIds && currentTask.waitingForTaskIds.includes(task.id)) {
                checkbox.checked = true;
            }

            const label = document.createElement('label');
            label.htmlFor = `dep-task-${task.id}`;
            label.textContent = task.title;
            label.style.flex = '1';
            label.style.fontSize = '0.875rem';
            label.style.cursor = 'pointer';

            const status = document.createElement('span');
            status.textContent = `[${task.status}]`;
            status.style.fontSize = '0.75rem';
            status.style.color = 'var(--text-secondary)';
            status.style.marginLeft = '8px';

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            wrapper.appendChild(status);
            container.appendChild(wrapper);
        });
    }

    getSelectedWaitingForTasks() {
        const selectedIds = [];
        const checkboxes = document.querySelectorAll('#waiting-for-tasks-list input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            selectedIds.push(cb.value);
        });
        return selectedIds;
    }

    async saveTaskFromForm() {
        const taskId = document.getElementById('task-id').value;
        const tagsValue = document.getElementById('task-contexts').value;
        let tags = tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [];

        // Ensure all contexts start with @
        tags = tags.map(context => this.normalizeContextName(context));

        let status = document.getElementById('task-status').value;
        const projectId = document.getElementById('task-project').value || null;

        // GTD Rule: If task is being assigned to a project and is in Inbox,
        // automatically move it to Next Actions
        if (projectId && status === 'inbox') {
            status = 'next';
        }

        // Get waiting for data
        const waitingForDescription = document.getElementById('task-waiting-for-description').value || '';
        let waitingForTaskIds = this.getSelectedWaitingForTasks();

        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            type: document.getElementById('task-type').value,
            status: status,
            energy: document.getElementById('task-energy').value,
            time: parseInt(document.getElementById('task-time').value) || 0,
            projectId: projectId,
            contexts: tags,
            dueDate: document.getElementById('task-due-date').value || null,
            deferDate: document.getElementById('task-defer-date').value || null,
            waitingForDescription: waitingForDescription,
            waitingForTaskIds: waitingForTaskIds,
            recurrence: document.getElementById('task-recurrence').value || '',
            recurrenceEndDate: document.getElementById('task-recurrence-end-date').value || null
        };

        if (taskId) {
            // Update existing task
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, taskData);
                task.updatedAt = new Date().toISOString();
            }
        } else {
            // Create new task
            const task = new Task(taskData);
            this.tasks.push(task);
        }

        await this.saveTasks();
        this.closeTaskModal();
        this.renderView();
        this.updateCounts();
        this.updateContextFilter();
    }

    openProjectModal(project = null, pendingTaskData = null) {
        const modal = document.getElementById('project-modal');
        const form = document.getElementById('project-form');
        const title = document.getElementById('project-modal-title');

        form.reset();

        // Store pending task data if coming from task modal
        this.pendingTaskData = pendingTaskData;

        if (project) {
            title.textContent = 'Edit Project';
            document.getElementById('project-id').value = project.id;
            document.getElementById('project-title').value = project.title;
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('project-status').value = project.status || 'active';
            document.getElementById('project-contexts').value = project.contexts ? project.contexts.join(', ') : '';
        } else {
            title.textContent = 'Add Project';
            document.getElementById('project-id').value = '';
        }

        modal.classList.add('active');
    }

    closeProjectModal() {
        document.getElementById('project-modal').classList.remove('active');
        this.pendingTaskData = null;
    }

    openGanttChart(project) {
        const modal = document.getElementById('gantt-modal');
        const title = document.getElementById('gantt-modal-title');
        title.textContent = `${project.title} - Gantt Chart`;

        modal.classList.add('active');
        this.renderGanttChart(project);
    }

    closeGanttModal() {
        document.getElementById('gantt-modal').classList.remove('active');
    }

    renderGanttChart(project) {
        const container = document.getElementById('gantt-chart');
        if (!container) return;

        // Get all tasks for this project (including completed ones)
        const projectTasks = this.tasks.filter(t => t.projectId === project.id);

        if (projectTasks.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-project-diagram" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Tasks in This Project</h3>
                    <p>Add tasks to this project to see their dependencies.</p>
                </div>
            `;
            return;
        }

        // Calculate dependency levels for tasks
        const taskLevels = {}; // task.id -> level (0 = no dependencies)
        const maxIterations = projectTasks.length + 1;

        // Initialize all tasks at level 0
        projectTasks.forEach(task => {
            taskLevels[task.id] = 0;
        });

        // Calculate levels based on dependencies
        for (let iter = 0; iter < maxIterations; iter++) {
            projectTasks.forEach(task => {
                if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                    const maxDepLevel = Math.max(0, ...task.waitingForTaskIds.map(depId => taskLevels[depId] || 0));
                    if (taskLevels[task.id] < maxDepLevel + 1) {
                        taskLevels[task.id] = maxDepLevel + 1;
                    }
                }
            });
        }

        // Group tasks by level
        const levelGroups = {};
        projectTasks.forEach(task => {
            const level = taskLevels[task.id];
            if (!levelGroups[level]) {
                levelGroups[level] = [];
            }
            levelGroups[level].push(task);
        });

        // Layout parameters
        const taskWidth = 200;
        const taskHeight = 60;
        const horizontalSpacing = 80;
        const verticalSpacing = 100;
        const marginLeft = 50;
        const marginTop = 50;

        // Calculate positions
        const taskPositions = {};
        Object.keys(levelGroups).forEach(level => {
            const tasksInLevel = levelGroups[level];
            const levelWidth = tasksInLevel.length * taskWidth + (tasksInLevel.length - 1) * horizontalSpacing;
            let startX = marginLeft;

            tasksInLevel.forEach(task => {
                taskPositions[task.id] = {
                    x: startX,
                    y: marginTop + (level * verticalSpacing)
                };
                startX += taskWidth + horizontalSpacing;
            });
        });

        // Calculate chart dimensions
        const maxLevel = Math.max(...Object.keys(levelGroups).map(Number));
        const chartWidth = Math.max(800, Object.values(levelGroups).reduce((max, tasks) => Math.max(max, tasks.length * (taskWidth + horizontalSpacing)), 0) + marginLeft * 2);
        const chartHeight = marginTop + (maxLevel + 1) * verticalSpacing + 150;

        // Build the dependency diagram HTML
        let html = `
            <div style="overflow-x: auto; overflow-y: auto; max-height: 600px;">
                <svg width="${chartWidth}" height="${chartHeight}" style="display: block;">
                    <!-- Background -->
                    <rect width="100%" height="100%" fill="#ffffff"/>

                    <!-- Define markers for dependency arrows -->
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                            <polygon points="0 0, 10 3, 0 6" fill="#666"/>
                        </marker>
                    </defs>
        `;

        // Draw dependency lines first (so they appear behind task boxes)
        projectTasks.forEach(task => {
            if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                const toTask = taskPositions[task.id];
                if (!toTask) return;

                task.waitingForTaskIds.forEach(depTaskId => {
                    const fromTask = taskPositions[depTaskId];
                    if (!fromTask) return;

                    // Draw line from bottom of parent task to top of dependent task
                    const fromX = fromTask.x + taskWidth / 2;
                    const fromY = fromTask.y + taskHeight;
                    const toX = toTask.x + taskWidth / 2;
                    const toY = toTask.y;

                    // Create a curved path (s-curve)
                    const midY = (fromY + toY) / 2;
                    html += `
                        <path d="M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}"
                              fill="none" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" opacity="0.6"/>
                    `;
                });
            }
        });

        // Draw task boxes
        projectTasks.forEach(task => {
            const pos = taskPositions[task.id];
            if (!pos) return;

            // Determine effective status (tasks with unmet dependencies show as waiting)
            const hasUnmetDependencies = !task.completed && task.waitingForTaskIds && task.waitingForTaskIds.length > 0 && !task.areDependenciesMet(this.tasks);
            const effectiveStatus = hasUnmetDependencies ? 'waiting' : task.status;

            // Task bar color based on effective status
            let barColor = '#5cb85c'; // completed
            if (!task.completed) {
                if (effectiveStatus === 'inbox') barColor = '#95a5a6';
                else if (effectiveStatus === 'next') barColor = '#4a90d9';
                else if (effectiveStatus === 'waiting') barColor = '#f39c12';
                else if (effectiveStatus === 'someday') barColor = '#9b59b6';
            }

            // Overdue indication
            const isOverdue = task.isOverdue && task.isOverdue();
            if (isOverdue && !task.completed) {
                barColor = '#e74c3c';
            }

            // Draw task box
            html += `
                <rect x="${pos.x}" y="${pos.y}" width="${taskWidth}" height="${taskHeight}" rx="6"
                      fill="${barColor}" opacity="0.9" stroke="${barColor}" stroke-width="2"/>
            `;

            // Task title (truncate if needed)
            const title = escapeHtml(task.title);
            const truncatedTitle = title.length > 25 ? title.substring(0, 25) + '...' : title;

            // Completion indicator
            const completionIcon = task.completed ? '✓ ' : '';

            // Draw task title
            html += `
                <text x="${pos.x + 10}" y="${pos.y + 25}" font-size="13" font-weight="600" fill="white">
                    ${completionIcon}${truncatedTitle}
                </text>
            `;

            // Status text
            const statusText = task.completed ? 'Completed' :
                              effectiveStatus === 'inbox' ? 'Inbox' :
                              effectiveStatus === 'next' ? 'Next' :
                              effectiveStatus === 'waiting' ? 'Waiting' :
                              effectiveStatus === 'someday' ? 'Someday' : effectiveStatus;
            html += `
                <text x="${pos.x + 10}" y="${pos.y + 45}" font-size="11" fill="white" opacity="0.9">
                    ${statusText}
                </text>
            `;
        });

        // Legend
        const legendY = chartHeight - 50;
        html += `
            <text x="10" y="${legendY}" font-size="11" font-weight="600" fill="#666">Status:</text>
            <rect x="60" y="${legendY - 10}" width="15" height="15" rx="3" fill="#95a5a6" opacity="0.9"/>
            <text x="80" y="${legendY + 2}" font-size="11" fill="#666">Inbox</text>
            <rect x="130" y="${legendY - 10}" width="15" height="15" rx="3" fill="#4a90d9" opacity="0.9"/>
            <text x="150" y="${legendY + 2}" font-size="11" fill="#666">Next</text>
            <rect x="200" y="${legendY - 10}" width="15" height="15" rx="3" fill="#f39c12" opacity="0.9"/>
            <text x="220" y="${legendY + 2}" font-size="11" fill="#666">Waiting</text>
            <rect x="280" y="${legendY - 10}" width="15" height="15" rx="3" fill="#5cb85c" opacity="0.9"/>
            <text x="300" y="${legendY + 2}" font-size="11" fill="#666">Completed</text>
            <rect x="375" y="${legendY - 10}" width="15" height="15" rx="3" fill="#e74c3c" opacity="0.9"/>
            <text x="395" y="${legendY + 2}" font-size="11" fill="#666">Overdue</text>
            <line x1="460" y1="${legendY - 2}" x2="490" y2="${legendY - 2}" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" opacity="0.6"/>
            <text x="500" y="${legendY + 2}" font-size="11" fill="#666">Dependency</text>
        `;

        html += `
                </svg>
            </div>
        `;

        container.innerHTML = html;
    }

    async saveProjectFromForm() {
        const projectId = document.getElementById('project-id').value;
        const tagsValue = document.getElementById('project-contexts').value;
        let tags = tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [];

        // Ensure all contexts start with @
        tags = tags.map(context => this.normalizeContextName(context));

        const projectData = {
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description').value,
            status: document.getElementById('project-status').value,
            contexts: tags
        };

        let newProjectId = null;

        if (projectId) {
            // Update existing project
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                Object.assign(project, projectData);
                project.updatedAt = new Date().toISOString();
            }
        } else {
            // Create new project
            const project = new Project(projectData);
            this.projects.push(project);
            newProjectId = project.id;
        }

        await this.saveProjects();
        this.closeProjectModal();
        this.renderView();
        this.updateCounts();
        this.renderProjectsDropdown();
        this.updateContextFilter();

        // If we came from task modal, reopen it with the new project selected
        if (this.pendingTaskData) {
            this.openTaskModalWithData(this.pendingTaskData, newProjectId);
            this.pendingTaskData = null;
        }
    }

    openTaskModalWithData(formData, projectId = null) {
        const modal = document.getElementById('task-modal');
        const title = document.getElementById('modal-title');

        title.textContent = 'Add Task';
        document.getElementById('task-id').value = '';
        document.getElementById('task-title').value = formData.title || '';
        document.getElementById('task-description').value = formData.description || '';
        document.getElementById('task-status').value = formData.status || 'inbox';
        document.getElementById('task-energy').value = formData.energy || '';
        document.getElementById('task-time').value = formData.time || '';
        document.getElementById('task-contexts').value = formData.contexts || '';
        document.getElementById('task-due-date').value = formData.dueDate || '';
        document.getElementById('task-defer-date').value = formData.deferDate || '';

        // Update project options
        const projectSelect = document.getElementById('task-project');
        projectSelect.innerHTML = '<option value="">No Project</option>';

        // Add option to create new project
        const createOption = document.createElement('option');
        createOption.value = '__create_new__';
        createOption.textContent = '+ Create new project...';
        createOption.style.fontWeight = 'bold';
        createOption.style.color = 'var(--primary-color)';
        projectSelect.appendChild(createOption);

        // Add existing projects
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.title;
            projectSelect.appendChild(option);
        });

        // Select the newly created project
        if (projectId) {
            projectSelect.value = projectId;
        }

        // Handle create new project selection
        projectSelect.addEventListener('change', (e) => {
            if (e.target.value === '__create_new__') {
                const formData = {
                    title: document.getElementById('task-title').value,
                    description: document.getElementById('task-description').value,
                    status: document.getElementById('task-status').value,
                    energy: document.getElementById('task-energy').value,
                    time: document.getElementById('task-time').value,
                    contexts: document.getElementById('task-contexts').value,
                    dueDate: document.getElementById('task-due-date').value,
                    deferDate: document.getElementById('task-defer-date').value
                };

                this.closeTaskModal();
                this.openProjectModal(null, formData);
            }
        }, { once: true });

        modal.classList.add('active');
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        this.tasks = this.tasks.filter(t => t.id !== taskId);
        await this.saveTasks();
        this.renderView();
        this.updateCounts();
    }

    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? Tasks will not be deleted.')) return;

        this.projects = this.projects.filter(p => p.id !== projectId);

        // Remove project reference from tasks
        this.tasks.forEach(task => {
            if (task.projectId === projectId) {
                task.projectId = null;
            }
        });

        await this.saveProjects();
        await this.saveTasks();
        this.renderView();
        this.updateCounts();
        this.renderProjectsDropdown();
    }

    async saveTasks() {
        const tasksData = this.tasks.map(t => t.toJSON());
        await this.storage.saveTasks(tasksData);
    }

    async saveProjects() {
        const projectsData = this.projects.map(p => p.toJSON());
        await this.storage.saveProjects(projectsData);
    }

    updateCounts() {
        const counts = {
            inbox: this.tasks.filter(t => t.status === 'inbox' && !t.completed && !t.projectId).length,
            next: this.tasks.filter(t => t.status === 'next' && !t.completed && t.areDependenciesMet(this.tasks)).length,
            waiting: this.tasks.filter(t => t.status === 'waiting' && !t.completed).length,
            someday: this.tasks.filter(t => t.status === 'someday' && !t.completed).length,
            projects: this.projects.filter(p => p.status === 'active').length
        };

        document.getElementById('inbox-count').textContent = counts.inbox || '';
        document.getElementById('next-count').textContent = counts.next || '';
        document.getElementById('waiting-count').textContent = counts.waiting || '';
        document.getElementById('someday-count').textContent = counts.someday || '';
        document.getElementById('projects-count').textContent = counts.projects || '';
        document.getElementById('reference-count').textContent = this.tasks.filter(t => t.type === 'reference').length || '';
    }

    updateContextFilter() {
        const contextFilter = document.getElementById('context-filter');
        if (!contextFilter) return; // Skip if filter element doesn't exist

        const allContexts = new Set();
        this.tasks.forEach(task => {
            if (task.contexts) {
                task.contexts.forEach(context => allContexts.add(context));
            }
        });
        this.projects.forEach(project => {
            if (project.contexts) {
                project.contexts.forEach(context => allContexts.add(context));
            }
        });

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

    renderProjectsDropdown() {
        const dropdown = document.getElementById('projects-dropdown');
        if (!dropdown) return;

        // Sort projects by position
        const sortedProjects = [...this.projects].sort((a, b) => {
            if (a.position !== b.position) {
                return a.position - b.position;
            }
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        dropdown.innerHTML = '';

        if (sortedProjects.length === 0) {
            dropdown.innerHTML = '<div class="project-dropdown-item" style="opacity: 0.5; cursor: default;">No projects</div>';
            return;
        }

        sortedProjects.forEach(project => {
            const taskCount = this.tasks.filter(t => t.projectId === project.id && !t.completed).length;

            const item = document.createElement('div');
            item.className = 'project-dropdown-item';
            item.dataset.projectId = project.id;
            item.innerHTML = `
                <i class="fas fa-folder"></i>
                <span>${escapeHtml(project.title)}</span>
                <span class="task-count">${taskCount}</span>
            `;

            // Click handler to view project tasks
            item.addEventListener('click', (e) => {
                // Don't trigger if we just finished a drop operation
                if (e.target.closest('.project-dropdown-item').dataset.preventClick === 'true') {
                    e.target.closest('.project-dropdown-item').dataset.preventClick = 'false';
                    return;
                }
                this.viewProjectTasks(project.id);
                // Close dropdown after selection
                const toggle = document.querySelector('.projects-dropdown-toggle');
                toggle.classList.remove('expanded');
                dropdown.classList.remove('expanded');
            });

            // Drag and drop handlers for assigning tasks to projects
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('drag-over');
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                item.classList.remove('drag-over');

                // Prevent click event from firing after drop
                item.dataset.preventClick = 'true';
                setTimeout(() => { item.dataset.preventClick = 'false'; }, 100);

                const taskId = e.dataTransfer.getData('text/plain');
                if (!taskId) return;

                await this.assignTaskToProject(taskId, project.id);

                // Close dropdown after assignment
                const toggle = document.querySelector('.projects-dropdown-toggle');
                toggle.classList.remove('expanded');
                dropdown.classList.remove('expanded');
            });

            dropdown.appendChild(item);
        });
    }

    async assignTaskToProject(taskId, projectId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Update task
        task.projectId = projectId;

        // If task was in Inbox, move it to Next Actions
        if (task.status === 'inbox') {
            task.status = 'next';
        }

        task.updatedAt = new Date().toISOString();

        // Save changes
        await this.saveTasks();

        // Refresh UI
        this.renderView();
        this.updateCounts();
        this.renderProjectsDropdown();

    }

    getProjectTitle(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        return project ? project.title : '';
    }

    /**
     * Normalize context name to ensure it starts with @
     * @param {string} context - Context name to normalize
     * @returns {string} - Normalized context name starting with @
     */
    normalizeContextName(context) {
        if (!context || typeof context !== 'string') return context;
        const trimmed = context.trim();
        // If it already starts with @, return as is
        if (trimmed.startsWith('@')) return trimmed;
        // Otherwise, prepend @
        return `@${trimmed}`;
    }

    // Context Modal Methods
    openTagModal() {
        const modal = document.getElementById('context-modal');
        const form = document.getElementById('context-form');
        const errorDiv = document.getElementById('context-error');

        form.reset();
        errorDiv.style.display = 'none';
        modal.classList.add('active');

        // Focus on the input
        setTimeout(() => {
            document.getElementById('context-name').focus();
        }, 100);
    }

    closeTagModal() {
        document.getElementById('context-modal').classList.remove('active');
        document.getElementById('context-error').style.display = 'none';
    }

    saveTagFromForm() {
        const tagName = document.getElementById('context-name').value.trim();
        const errorDiv = document.getElementById('context-error');

        if (!tagName) {
            errorDiv.textContent = 'Context name is required';
            errorDiv.style.display = 'block';
            return;
        }

        // Normalize context name (ensure it starts with @)
        const normalizedName = this.normalizeContextName(tagName);

        // Get existing tags
        const defaultContexts = ['@home', '@work', '@personal', '@computer', '@phone'];
        const customContexts = JSON.parse(localStorage.getItem('gtd_custom_contexts') || '[]');
        const allContexts = [...defaultContexts, ...customContexts];

        // Check for duplicates (case-insensitive)
        const isDuplicate = allContexts.some(existingTag =>
            existingTag.toLowerCase() === normalizedName.toLowerCase()
        );

        if (isDuplicate) {
            errorDiv.textContent = `A context with the name "${normalizedName}" already exists`;
            errorDiv.style.display = 'block';
            return;
        }

        // Save the new context with normalized name
        customContexts.push(normalizedName);
        localStorage.setItem('gtd_custom_contexts', JSON.stringify(customContexts));

        // Re-render custom tags
        this.renderCustomContexts();

        // Close modal and show success
        this.closeTagModal();
    }

    async deleteTag(tagName) {
        // Confirm deletion
        const confirmed = confirm(`Are you sure you want to delete the context "${tagName}"?\n\nThis will remove the context from all tasks and projects that use it.`);
        if (!confirmed) return;

        // Count affected items
        const affectedTasks = this.tasks.filter(task => task.contexts && task.contexts.includes(tagName));
        const affectedProjects = this.projects.filter(project => project.contexts && project.contexts.includes(tagName));

        // Remove context from all tasks
        this.tasks.forEach(task => {
            if (task.contexts && task.contexts.includes(tagName)) {
                task.contexts = task.contexts.filter(t => t !== tagName);
                task.updatedAt = new Date().toISOString();
            }
        });

        // Remove context from all projects
        this.projects.forEach(project => {
            if (project.contexts && project.contexts.includes(tagName)) {
                project.contexts = project.contexts.filter(t => t !== tagName);
                project.updatedAt = new Date().toISOString();
            }
        });

        // Remove from custom tags list
        const customContexts = JSON.parse(localStorage.getItem('gtd_custom_contexts') || '[]');
        const updatedContexts = customContexts.filter(t => t !== tagName);
        localStorage.setItem('gtd_custom_contexts', JSON.stringify(updatedContexts));

        // Save changes
        await this.saveTasks();
        await this.saveProjects();

        // Re-render
        this.renderCustomContexts();
        this.renderView();
    }

    async updateTaskPositions() {
        const container = document.querySelector('.tasks-container');
        if (!container) return;

        const taskElements = container.querySelectorAll('.task-item');

        // Update position for each task based on its DOM order
        taskElements.forEach((element, index) => {
            const taskId = element.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.position = index;
                task.updatedAt = new Date().toISOString();
            }
        });

        // Save the updated positions
        await this.saveTasks();
    }

    async updateProjectPositions() {
        const container = document.querySelector('.projects-container');
        if (!container) return;

        const projectElements = container.querySelectorAll('.project-card');

        // Update position for each project based on its DOM order
        projectElements.forEach((element, index) => {
            const projectId = element.dataset.projectId;
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                project.position = index;
                project.updatedAt = new Date().toISOString();
            }
        });

        // Save the updated positions
        await this.saveProjects();
        // Update dropdown to reflect new order
        this.renderProjectsDropdown();
    }
}

// Helper function for drag-and-drop
function getDragAfterElement(container, y) {
    // Select either task items or project cards based on what's in the container
    const taskItems = [...container.querySelectorAll('.task-item:not(.dragging)')];
    const projectCards = [...container.querySelectorAll('.project-card:not(.dragging)')];
    const draggableElements = taskItems.length > 0 ? taskItems : projectCards;

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

// Initialize app
const app = new GTDApp();
document.addEventListener('DOMContentLoaded', () => app.init());

// Add button to open project modal in projects view
document.addEventListener('DOMContentLoaded', () => {
    const setupProjectButton = () => {
        const projectsContainer = document.getElementById('projects-container');
        if (!projectsContainer) return;

        // Remove existing button if any
        const existingButton = projectsContainer.querySelector('.add-project-btn');
        if (existingButton) existingButton.remove();

        // Create add project button
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary add-project-btn';
        addButton.style.cssText = 'margin-bottom: 1rem;';
        addButton.innerHTML = '<i class="fas fa-plus"></i> Add Project';
        addButton.addEventListener('click', () => app.openProjectModal());

        projectsContainer.insertBefore(addButton, projectsContainer.firstChild);
    };

    // Setup initially and when switching to projects view
    setupProjectButton();

    // Hook into switchView to add button when viewing projects
    const originalSwitchView = app.switchView.bind(app);
    app.switchView = function(view) {
        originalSwitchView(view);
        if (view === 'projects') {
            setTimeout(setupProjectButton, 0);
        }
    };
});
