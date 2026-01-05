/**
 * GTD Web Application
 * Main application logic
 */

import { Task, Project, Reference } from './models.js';
import { Storage } from './storage.js';

class GTDApp {
    constructor() {
        this.storage = new Storage();
        this.tasks = [];
        this.projects = [];
        this.currentView = 'inbox';
        this.currentProjectId = null;
        this.filters = {
            tag: '',
            energy: '',
            time: ''
        };
        this.pendingTaskData = null;
    }

    async init() {
        try {
            console.log('Step 1: Initializing storage...');
            // Initialize storage
            await this.storage.init();
            console.log('Storage initialized');

            console.log('Step 2: Loading data...');
            // Load data
            await this.loadData();
            console.log('Data loaded:', this.tasks.length, 'tasks,', this.projects.length, 'projects');

            console.log('Step 3: Setting up event listeners...');
            // Setup event listeners
            this.setupEventListeners();

            console.log('Step 4: Updating user ID display...');
            // Display user ID
            const userIdElement = document.getElementById('user-id');
            if (userIdElement && this.storage.userId) {
                userIdElement.textContent = this.storage.userId.substr(0, 12) + '...';
            }

            console.log('Step 5: Rendering custom tags...');
            // Render custom tags
            try {
                this.renderCustomTags();
            } catch (tagError) {
                console.warn('Custom tags rendering failed:', tagError);
            }

            console.log('Step 6: Checking waiting tasks dependencies...');
            // Check if any waiting tasks should be unblocked
            try {
                await this.checkWaitingTasksDependencies();
            } catch (depError) {
                console.warn('Dependency check failed:', depError);
            }

            console.log('Step 7: Rendering initial view...');
            // Render initial view
            this.renderView();

            console.log('Step 8: Updating counts...');
            // Update counts
            this.updateCounts();

            console.log('Step 9: Rendering projects dropdown...');
            // Render projects dropdown
            this.renderProjectsDropdown();

            console.log('Step 9: Updating tag filter...');
            // Update tag filter
            this.updateTagFilter();

            console.log('GTD Web initialized successfully');
        } catch (error) {
            console.error('Error initializing GTD Web:', error);
            console.error('Error stack:', error.stack);
            // Still try to render something even if init failed
            try {
                this.renderView();
            } catch (renderError) {
                console.error('Error rendering view:', renderError);
            }
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
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Projects dropdown toggle
        const projectsToggle = document.querySelector('.projects-dropdown-toggle');
        if (projectsToggle) {
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

        // Quick add
        const quickAddInput = document.getElementById('quick-add-input');
        quickAddInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && quickAddInput.value.trim()) {
                this.quickAddTask(quickAddInput.value.trim());
                quickAddInput.value = '';
            }
        });

        // Task form
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTaskFromForm();
        });

        // Project form
        document.getElementById('project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProjectFromForm();
        });

        // Modal close buttons
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('cancel-modal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('close-project-modal').addEventListener('click', () => {
            this.closeProjectModal();
        });

        document.getElementById('cancel-project-modal').addEventListener('click', () => {
            this.closeProjectModal();
        });

        document.getElementById('close-gantt-modal').addEventListener('click', () => {
            this.closeGanttModal();
        });

        // Close modal on background click
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.closeTaskModal();
            }
        });

        document.getElementById('project-modal').addEventListener('click', (e) => {
            if (e.target.id === 'project-modal') {
                this.closeProjectModal();
            }
        });

        document.getElementById('gantt-modal').addEventListener('click', (e) => {
            if (e.target.id === 'gantt-modal') {
                this.closeGanttModal();
            }
        });

        // Filters
        document.getElementById('tag-filter').addEventListener('change', (e) => {
            this.filters.tag = e.target.value;
            this.renderView();
        });

        document.getElementById('energy-filter').addEventListener('change', (e) => {
            this.filters.energy = e.target.value;
            this.renderView();
        });

        document.getElementById('time-filter').addEventListener('change', (e) => {
            this.filters.time = e.target.value;
            this.renderView();
        });

        // Sync button
        document.getElementById('sync-status').addEventListener('click', async () => {
            await this.storage.sync();
            await this.loadData();
            this.renderView();
            this.updateCounts();
        });

        // Quick tags in quick-add
        document.querySelectorAll('.quick-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                const quickAddInput = document.getElementById('quick-add-input');
                if (quickAddInput.value) {
                    quickAddInput.value += ` ${tag}`;
                } else {
                    quickAddInput.value = tag;
                }
                quickAddInput.focus();
            });
        });

        // Quick tags in modal
        document.querySelectorAll('.quick-tag-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                const tagsInput = document.getElementById('task-tags');
                const currentValue = tagsInput.value.trim();

                // Check if tag already exists
                const tags = currentValue ? currentValue.split(',').map(t => t.trim()) : [];
                if (!tags.includes(tag)) {
                    if (currentValue) {
                        tagsInput.value = `${currentValue}, ${tag}`;
                    } else {
                        tagsInput.value = tag;
                    }
                }
            });
        });

        // Add custom tag button handler
        this.setupCustomTagHandler();

        // Tag modal
        document.getElementById('btn-create-tag').addEventListener('click', () => {
            this.openTagModal();
        });

        document.getElementById('tag-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTagFromForm();
        });

        document.getElementById('close-tag-modal').addEventListener('click', () => {
            this.closeTagModal();
        });

        document.getElementById('cancel-tag-modal').addEventListener('click', () => {
            this.closeTagModal();
        });

        document.getElementById('tag-modal').addEventListener('click', (e) => {
            if (e.target.id === 'tag-modal') {
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
        const getCustomTags = () => {
            const tags = localStorage.getItem('gtd_custom_tags');
            return tags ? JSON.parse(tags) : [];
        };

        const defaultTags = ['@home', '@work', '@personal', '@computer', '@phone'];

        const saveCustomTag = (tag) => {
            const tags = getCustomTags();
            const allTags = [...defaultTags, ...tags];

            // Check for duplicates (case-insensitive)
            const isDuplicate = allTags.some(existingTag =>
                existingTag.toLowerCase() === tag.toLowerCase()
            );

            if (!isDuplicate && !tags.includes(tag)) {
                tags.push(tag);
                localStorage.setItem('gtd_custom_tags', JSON.stringify(tags));
                this.renderCustomTags();
            }
        };

        // Monitor tag input for new tags
        const tagsInput = document.getElementById('task-tags');
        let lastValue = '';

        tagsInput.addEventListener('input', () => {
            const currentValue = tagsInput.value;
            if (currentValue !== lastValue) {
                // Extract tags from input
                const tags = currentValue.split(',').map(t => t.trim()).filter(t => t);

                // Save any new custom tags (excluding default @ tags)
                tags.forEach(tag => {
                    if (tag && !tag.startsWith('@') && !getCustomTags().includes(tag)) {
                        saveCustomTag(tag);
                    }
                });

                lastValue = currentValue;
            }
        });
    }

    renderCustomTags() {
        const customTags = JSON.parse(localStorage.getItem('gtd_custom_tags') || '[]');

        // Quick-add section custom tags
        const quickTagsContainer = document.querySelector('.quick-tags');
        if (quickTagsContainer) {
            // Remove existing custom tags
            quickTagsContainer.querySelectorAll('.custom-tag').forEach(el => el.remove());

            // Add custom tags with delete button
            customTags.forEach(tag => {
                const wrapper = document.createElement('div');
                wrapper.className = 'custom-tag-wrapper';
                wrapper.style.display = 'inline-flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '4px';

                const btn = document.createElement('button');
                btn.className = 'quick-tag custom-tag';
                btn.dataset.tag = tag;
                btn.addEventListener('click', (e) => {
                    // Don't trigger if clicking the delete button
                    if (e.target.classList.contains('custom-tag-delete')) return;

                    const quickAddInput = document.getElementById('quick-add-input');
                    if (quickAddInput.value) {
                        quickAddInput.value += ` ${tag}`;
                    } else {
                        quickAddInput.value = tag;
                    }
                    quickAddInput.focus();
                });

                const label = document.createElement('span');
                label.textContent = tag;
                btn.appendChild(label);

                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'custom-tag-delete';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = `Delete tag "${tag}"`;
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.deleteTag(tag);
                });

                btn.appendChild(deleteBtn);
                wrapper.appendChild(btn);
                quickTagsContainer.appendChild(wrapper);
            });
        }

        // Modal custom tags
        const modalTagsContainer = document.querySelector('.quick-tags-modal');
        if (modalTagsContainer) {
            // Remove existing custom tags
            modalTagsContainer.querySelectorAll('.custom-tag-modal').forEach(el => el.remove());

            // Add custom tags with delete button
            customTags.forEach(tag => {
                const wrapper = document.createElement('div');
                wrapper.className = 'custom-tag-wrapper';
                wrapper.style.display = 'inline-flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '4px';

                const btn = document.createElement('button');
                btn.className = 'quick-tag-modal custom-tag-modal';
                btn.dataset.tag = tag;
                btn.addEventListener('click', (e) => {
                    // Don't trigger if clicking the delete button
                    if (e.target.classList.contains('custom-tag-delete')) return;

                    const tagsInput = document.getElementById('task-tags');
                    const currentValue = tagsInput.value.trim();
                    const tags = currentValue ? currentValue.split(',').map(t => t.trim()) : [];
                    if (!tags.includes(tag)) {
                        if (currentValue) {
                            tagsInput.value = `${currentValue}, ${tag}`;
                        } else {
                            tagsInput.value = tag;
                        }
                    }
                });

                const label = document.createElement('span');
                label.textContent = tag;
                btn.appendChild(label);

                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'custom-tag-delete';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.title = `Delete tag "${tag}"`;
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.deleteTag(tag);
                });

                btn.appendChild(deleteBtn);
                wrapper.appendChild(btn);
                modalTagsContainer.appendChild(wrapper);
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
                ${this.escapeHtml(project.title)} - Tasks
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
        }

        // Apply additional filters
        if (this.filters.tag) {
            filteredTasks = filteredTasks.filter(task => task.tags.includes(this.filters.tag));
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
        if (task.status === 'waiting') {
            const parts = [];

            if (task.waitingForDescription) {
                parts.push(`<i class="fas fa-hourglass-half"></i> Waiting: ${this.escapeHtml(task.waitingForDescription)}`);
            }

            if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                const pendingDeps = task.getPendingDependencies(this.tasks);
                if (pendingDeps.length > 0) {
                    const depNames = pendingDeps.map(t => this.escapeHtml(t.title)).join(', ');
                    parts.push(`<i class="fas fa-link"></i> Blocked by: ${depNames}`);
                } else {
                    // Dependencies met but still in waiting status
                    parts.push(`<i class="fas fa-check-circle"></i> Dependencies met!`);
                }
            }

            if (parts.length > 0) {
                waitingForDisplay = `<span class="task-waiting-for">${parts.join(' | ')}</span>`;
            }
        }

        div.innerHTML = `
            ${dragHandle.outerHTML}
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${task.tags.length > 0 ? task.tags.map(tag => `<span class="task-tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
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

        if (this.filters.tag) {
            filteredProjects = filteredProjects.filter(project => project.tags.includes(this.filters.tag));
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
                <span>${this.escapeHtml(task.title)}</span>
            </div>`
        ).join('');

        div.innerHTML = `
            <div class="project-header">
                <div class="project-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="project-title">${this.escapeHtml(project.title)}</div>
                <span class="project-status ${project.status}">${project.status}</span>
            </div>
            ${project.description ? `<div class="project-description">${this.escapeHtml(project.description)}</div>` : ''}
            ${taskCount > 0 ? `
                <div class="project-tasks">
                    ${tasksPreview}
                    ${taskCount > 3 ? `<div class="project-tasks-more">+${taskCount - 3} more tasks</div>` : ''}
                </div>
            ` : ''}
            <div class="project-meta">
                <div class="project-tags">
                    ${project.tags.map(tag => `<span class="task-tag">${this.escapeHtml(tag)}</span>`).join('')}
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
        this.updateTagFilter();
    }

    async toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            if (task.completed) {
                task.markIncomplete();
            } else {
                task.markComplete();
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
                    console.log(`Task "${task.title}" moved from Waiting For to Next Actions - ${reason}!`);
                }
            }
        });

        if (movedCount > 0) {
            await this.saveTasks();
            // Optional: Show notification to user
            console.log(`${movedCount} task(s) moved from Waiting For to Next Actions`);
        }
    }

    openTaskModal(task = null) {
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
                    tags: document.getElementById('task-tags').value,
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
            document.getElementById('task-tags').value = task.tags.join(', ');
        } else {
            title.textContent = 'Add Task';
            document.getElementById('task-id').value = '';
            document.getElementById('task-status').value = this.currentView === 'all' ? 'inbox' : this.currentView;
            document.getElementById('task-waiting-for-description').value = '';
        }

        // Setup status change listener to show/hide waiting for fields
        const statusSelect = document.getElementById('task-status');
        const waitingForSection = document.getElementById('waiting-for-section');
        const waitingForDepsSection = document.getElementById('waiting-for-deps-section');

        const updateWaitingForFields = () => {
            if (statusSelect.value === 'waiting') {
                waitingForSection.style.display = 'block';
                waitingForDepsSection.style.display = 'block';
                this.renderWaitingForTasksList(task);
            } else {
                waitingForSection.style.display = 'none';
                waitingForDepsSection.style.display = 'none';
            }
        };

        statusSelect.addEventListener('change', updateWaitingForFields);
        updateWaitingForFields(); // Initial call

        modal.classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
    }

    renderWaitingForTasksList(currentTask) {
        const container = document.getElementById('waiting-for-tasks-list');
        const currentTaskId = currentTask ? currentTask.id : null;

        // Get all incomplete tasks except the current one
        const availableTasks = this.tasks.filter(t =>
            !t.completed && t.id !== currentTaskId && t.status !== 'completed'
        );

        if (availableTasks.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem;">No other tasks available</p>';
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
            checkbox.style.marginRight = '8px';

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
        const tagsValue = document.getElementById('task-tags').value;
        const tags = tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [];

        let status = document.getElementById('task-status').value;
        const projectId = document.getElementById('task-project').value || null;

        // GTD Rule: If task is being assigned to a project and is in Inbox,
        // automatically move it to Next Actions
        if (projectId && status === 'inbox') {
            status = 'next';
        }

        // Get waiting for data
        const waitingForDescription = document.getElementById('task-waiting-for-description').value || '';
        let waitingForTaskIds = [];

        if (status === 'waiting') {
            waitingForTaskIds = this.getSelectedWaitingForTasks();
        }

        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            type: document.getElementById('task-type').value,
            status: status,
            energy: document.getElementById('task-energy').value,
            time: parseInt(document.getElementById('task-time').value) || 0,
            projectId: projectId,
            dueDate: document.getElementById('task-due-date').value || null,
            deferDate: document.getElementById('task-defer-date').value || null,
            waitingForDescription: waitingForDescription,
            waitingForTaskIds: waitingForTaskIds,
            tags: tags
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
        this.updateTagFilter();
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
            document.getElementById('project-tags').value = project.tags.join(', ');
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
                    <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Tasks in This Project</h3>
                    <p>Add tasks to this project to see them in the Gantt chart.</p>
                </div>
            `;
            return;
        }

        // Calculate date range
        let minDate = null;
        let maxDate = null;

        projectTasks.forEach(task => {
            const dates = [];
            if (task.deferDate) dates.push(new Date(task.deferDate));
            if (task.dueDate) dates.push(new Date(task.dueDate));

            dates.forEach(date => {
                if (!minDate || date < minDate) minDate = date;
                if (!maxDate || date > maxDate) maxDate = date;
            });
        });

        // Add buffer days
        if (minDate) {
            minDate = new Date(minDate);
            minDate.setDate(minDate.getDate() - 2);
        }
        if (maxDate) {
            maxDate = new Date(maxDate);
            maxDate.setDate(maxDate.getDate() + 7);
        }

        // If no dates found, use today ± 14 days
        if (!minDate || !maxDate) {
            const today = new Date();
            minDate = new Date(today);
            minDate.setDate(minDate.getDate() - 7);
            maxDate = new Date(today);
            maxDate.setDate(maxDate.getDate() + 21);
        }

        const dayWidth = 40; // pixels per day
        const headerHeight = 60;
        const taskRowHeight = 50;
        const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

        const chartWidth = Math.max(totalDays * dayWidth + 200, 800);
        const chartHeight = headerHeight + (projectTasks.length * taskRowHeight) + 100;

        // Build the Gantt chart HTML
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

        // Draw date header and grid lines
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i <= totalDays; i++) {
            const currentDate = new Date(minDate);
            currentDate.setDate(currentDate.getDate() + i);
            const x = 200 + (i * dayWidth);

            // Grid line
            html += `<line x1="${x}" y1="${headerHeight}" x2="${x}" y2="${chartHeight}" stroke="#e0e0e0" stroke-width="1"/>`;

            // Highlight today
            const isToday = currentDate.toDateString() === today.toDateString();
            if (isToday) {
                html += `<rect x="${x}" y="${headerHeight}" width="${dayWidth}" height="${chartHeight - headerHeight}" fill="rgba(74, 144, 217, 0.1)"/>`;
            }

            // Date label (show label every 3 days or for today)
            if (i % 3 === 0 || isToday) {
                const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                html += `
                    <text x="${x + dayWidth/2}" y="${headerHeight - 10}" text-anchor="middle" font-size="11" fill="#666">
                        ${dateStr}
                    </text>
                `;
            }
        }

        // Draw tasks and dependencies
        const taskPositions = {}; // Store task positions for drawing dependency lines

        projectTasks.forEach((task, index) => {
            const y = headerHeight + (index * taskRowHeight) + 15;
            const taskName = this.escapeHtml(task.title).substring(0, 40) + (task.title.length > 40 ? '...' : '');

            // Task label with completion indicator
            const completionIcon = task.completed ? '✓ ' : '';
            html += `
                <text x="10" y="${y + 15}" font-size="12" font-weight="500" fill="#2c3e50">
                    ${completionIcon}${taskName}
                </text>
            `;

            // Calculate task bar position and width
            let startDate = null;
            let endDate = null;

            if (task.deferDate) {
                startDate = new Date(task.deferDate);
            }

            if (task.dueDate) {
                endDate = new Date(task.dueDate);
            }

            // If only defer date, set end date to defer date + 3 days
            if (startDate && !endDate) {
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 3);
            }

            // If only due date, set start date to due date - 3 days
            if (endDate && !startDate) {
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 3);
            }

            // If neither date, position in middle with default width
            let barWidth, barX;
            if (!startDate && !endDate) {
                // Center in the visible timeline
                const midDays = totalDays / 2;
                barX = 200 + (midDays * dayWidth) - (dayWidth * 2);
                barWidth = dayWidth * 4;
            } else {
                // Calculate position
                const startOffset = Math.max(0, (startDate - minDate) / (1000 * 60 * 60 * 24));
                const endOffset = Math.max(0, (endDate - minDate) / (1000 * 60 * 60 * 24));
                barX = 200 + (startOffset * dayWidth);
                barWidth = Math.max(dayWidth, (endOffset - startOffset) * dayWidth);
            }

            // Store position for dependency lines
            taskPositions[task.id] = {
                x: barX,
                y: y + 10,
                width: barWidth
            };

            // Task bar color based on status
            let barColor = '#5cb85c'; // completed
            if (!task.completed) {
                if (task.status === 'inbox') barColor = '#95a5a6';
                else if (task.status === 'next') barColor = '#4a90d9';
                else if (task.status === 'waiting') barColor = '#f39c12';
                else if (task.status === 'someday') barColor = '#9b59b6';
            }

            // Overdue indication
            const isOverdue = task.isOverdue && task.isOverdue();
            if (isOverdue && !task.completed) {
                barColor = '#e74c3c';
            }

            // Dim tasks without dates
            if (!task.dueDate && !task.deferDate) {
                html += `
                    <rect x="${barX}" y="${y}" width="${barWidth}" height="30" rx="4" fill="${barColor}" opacity="0.4" stroke-dasharray="4"/>
                `;
            } else {
                // Draw task bar
                html += `
                    <rect x="${barX}" y="${y}" width="${barWidth}" height="30" rx="4" fill="${barColor}" opacity="0.8"/>
                `;
            }

            // Task title on bar
            html += `
                <text x="${barX + barWidth/2}" y="${y + 19}" text-anchor="middle" font-size="11" fill="white" font-weight="500">
                    ${task.title.length > 20 ? this.escapeHtml(task.title).substring(0, 20) + '...' : this.escapeHtml(task.title)}
                </text>
            `;

            // Add due date label if exists
            if (task.dueDate) {
                const dueLabel = new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                html += `
                    <text x="${barX + barWidth + 5}" y="${y + 19}" font-size="10" fill="#e74c3c">
                        Due: ${dueLabel}
                    </text>
                `;
            }

            // Add defer date label if exists
            if (task.deferDate) {
                const deferLabel = new Date(task.deferDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                html += `
                    <text x="${barX - 5}" y="${y + 19}" font-size="10" fill="#856404" text-anchor="end">
                        From: ${deferLabel}
                    </text>
                `;
            }
        });

        // Draw dependency lines
        projectTasks.forEach((task, index) => {
            if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                const toTask = taskPositions[task.id];
                if (!toTask) return;

                task.waitingForTaskIds.forEach(depTaskId => {
                    const fromTask = taskPositions[depTaskId];
                    if (!fromTask) return;

                    // Draw line from end of parent task to start of dependent task
                    const fromX = fromTask.x + fromTask.width;
                    const fromY = fromTask.y;
                    const toX = toTask.x;
                    const toY = toTask.y;

                    // Create a curved path
                    const midX = (fromX + toX) / 2;
                    html += `
                        <path d="M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}"
                              fill="none" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" opacity="0.6"/>
                    `;
                });
            }
        });

        // Legend
        const legendY = chartHeight - 50;
        html += `
            <text x="10" y="${legendY}" font-size="11" font-weight="600" fill="#666">Legend:</text>
            <rect x="70" y="${legendY - 10}" width="15" height="15" rx="3" fill="#95a5a6" opacity="0.8"/>
            <text x="90" y="${legendY + 2}" font-size="11" fill="#666">Inbox</text>
            <rect x="140" y="${legendY - 10}" width="15" height="15" rx="3" fill="#4a90d9" opacity="0.8"/>
            <text x="160" y="${legendY + 2}" font-size="11" fill="#666">Next</text>
            <rect x="210" y="${legendY - 10}" width="15" height="15" rx="3" fill="#f39c12" opacity="0.8"/>
            <text x="230" y="${legendY + 2}" font-size="11" fill="#666">Waiting</text>
            <rect x="290" y="${legendY - 10}" width="15" height="15" rx="3" fill="#5cb85c" opacity="0.8"/>
            <text x="310" y="${legendY + 2}" font-size="11" fill="#666">Completed</text>
            <rect x="385" y="${legendY - 10}" width="15" height="15" rx="3" fill="#e74c3c" opacity="0.8"/>
            <text x="405" y="${legendY + 2}" font-size="11" fill="#666">Overdue</text>
            <rect x="465" y="${legendY - 10}" width="15" height="15" rx="3" fill="#4a90d9" opacity="0.4" stroke-dasharray="2"/>
            <text x="485" y="${legendY + 2}" font-size="11" fill="#666">No Dates</text>
            <line x1="550" y1="${legendY - 2}" x2="580" y2="${legendY - 2}" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" opacity="0.6"/>
            <text x="590" y="${legendY + 2}" font-size="11" fill="#666">Dependency</text>
        `;

        html += `
                </svg>
            </div>
        `;

        container.innerHTML = html;
    }

    async saveProjectFromForm() {
        const projectId = document.getElementById('project-id').value;
        const tagsValue = document.getElementById('project-tags').value;
        const tags = tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [];

        const projectData = {
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description').value,
            status: document.getElementById('project-status').value,
            tags: tags
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
        this.updateTagFilter();

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
        document.getElementById('task-tags').value = formData.tags || '';
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
                    tags: document.getElementById('task-tags').value,
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
            next: this.tasks.filter(t => t.status === 'next' && !t.completed).length,
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

    updateTagFilter() {
        const allTags = new Set();
        this.tasks.forEach(task => {
            task.tags.forEach(tag => allTags.add(tag));
        });
        this.projects.forEach(project => {
            project.tags.forEach(tag => allTags.add(tag));
        });

        const tagFilter = document.getElementById('tag-filter');
        const currentValue = tagFilter.value;
        tagFilter.innerHTML = '<option value="">All Tags</option>';

        Array.from(allTags).sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });

        tagFilter.value = currentValue;
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
                <span>${this.escapeHtml(project.title)}</span>
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

        console.log(`Task "${task.title}" assigned to project ${this.getProjectTitle(projectId)}`);
    }

    getProjectTitle(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        return project ? project.title : '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Tag Modal Methods
    openTagModal() {
        const modal = document.getElementById('tag-modal');
        const form = document.getElementById('tag-form');
        const errorDiv = document.getElementById('tag-error');

        form.reset();
        errorDiv.style.display = 'none';
        modal.classList.add('active');

        // Focus on the input
        setTimeout(() => {
            document.getElementById('tag-name').focus();
        }, 100);
    }

    closeTagModal() {
        document.getElementById('tag-modal').classList.remove('active');
        document.getElementById('tag-error').style.display = 'none';
    }

    saveTagFromForm() {
        const tagName = document.getElementById('tag-name').value.trim();
        const errorDiv = document.getElementById('tag-error');

        if (!tagName) {
            errorDiv.textContent = 'Tag name is required';
            errorDiv.style.display = 'block';
            return;
        }

        // Get existing tags
        const defaultTags = ['@home', '@work', '@personal', '@computer', '@phone'];
        const customTags = JSON.parse(localStorage.getItem('gtd_custom_tags') || '[]');
        const allTags = [...defaultTags, ...customTags];

        // Check for duplicates (case-insensitive)
        const isDuplicate = allTags.some(existingTag =>
            existingTag.toLowerCase() === tagName.toLowerCase()
        );

        if (isDuplicate) {
            errorDiv.textContent = `A tag with the name "${tagName}" already exists`;
            errorDiv.style.display = 'block';
            return;
        }

        // Save the new tag
        customTags.push(tagName);
        localStorage.setItem('gtd_custom_tags', JSON.stringify(customTags));

        // Re-render custom tags
        this.renderCustomTags();

        // Close modal and show success
        this.closeTagModal();
        console.log('Tag created successfully:', tagName);
    }

    async deleteTag(tagName) {
        // Confirm deletion
        const confirmed = confirm(`Are you sure you want to delete the tag "${tagName}"?\n\nThis will remove the tag from all tasks and projects that use it.`);
        if (!confirmed) return;

        // Count affected items
        const affectedTasks = this.tasks.filter(task => task.tags.includes(tagName));
        const affectedProjects = this.projects.filter(project => project.tags.includes(tagName));

        console.log(`Deleting tag "${tagName}" from ${affectedTasks.length} tasks and ${affectedProjects.length} projects`);

        // Remove tag from all tasks
        this.tasks.forEach(task => {
            if (task.tags.includes(tagName)) {
                task.tags = task.tags.filter(t => t !== tagName);
                task.updatedAt = new Date().toISOString();
            }
        });

        // Remove tag from all projects
        this.projects.forEach(project => {
            if (project.tags.includes(tagName)) {
                project.tags = project.tags.filter(t => t !== tagName);
                project.updatedAt = new Date().toISOString();
            }
        });

        // Remove from custom tags list
        const customTags = JSON.parse(localStorage.getItem('gtd_custom_tags') || '[]');
        const updatedTags = customTags.filter(t => t !== tagName);
        localStorage.setItem('gtd_custom_tags', JSON.stringify(updatedTags));

        // Save changes
        await this.saveTasks();
        await this.saveProjects();

        // Re-render
        this.renderCustomTags();
        this.renderView();

        console.log(`Tag "${tagName}" deleted successfully`);
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
        console.log('Task positions updated');
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
        console.log('Project positions updated');
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

// Add button to open task modal
document.addEventListener('DOMContentLoaded', () => {
    const quickAdd = document.querySelector('.quick-add');
    const addButton = document.createElement('button');
    addButton.className = 'btn btn-primary';
    addButton.style.marginTop = '0.5rem';
    addButton.innerHTML = '<i class="fas fa-plus"></i> Add Task';
    addButton.addEventListener('click', () => app.openTaskModal());
    quickAdd.appendChild(addButton);
});

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
