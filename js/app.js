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
        this.filters = {
            tag: '',
            energy: '',
            time: ''
        };
    }

    async init() {
        // Initialize storage
        await this.storage.init();

        // Load data
        await this.loadData();

        // Display user ID
        document.getElementById('user-id').textContent = this.storage.userId.substr(0, 12) + '...';

        // Setup event listeners
        this.setupEventListeners();

        // Render initial view
        this.renderView();

        // Update counts
        this.updateCounts();

        // Update tag filter
        this.updateTagFilter();

        console.log('GTD Web initialized successfully');
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
    }

    switchView(view) {
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

        // Filter by view
        if (this.currentView !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === this.currentView);
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

        // Sort by updated date
        filteredTasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        // Render tasks
        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-item';
        if (task.completed) {
            div.classList.add('completed');
        }

        div.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${task.tags.length > 0 ? task.tags.map(tag => `<span class="task-tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
                    ${task.energy ? `<span class="task-energy"><i class="fas fa-bolt"></i> ${task.energy}</span>` : ''}
                    ${task.time ? `<span class="task-time"><i class="fas fa-clock"></i> ${task.time}m</span>` : ''}
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

        filteredProjects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            container.appendChild(projectElement);
        });
    }

    createProjectElement(project) {
        const div = document.createElement('div');
        div.className = 'project-card';

        const taskCount = this.tasks.filter(t => t.projectId === project.id && !t.completed).length;

        div.innerHTML = `
            <div class="project-header">
                <div class="project-title">${this.escapeHtml(project.title)}</div>
                <span class="project-status ${project.status}">${project.status}</span>
            </div>
            ${project.description ? `<div class="project-description">${this.escapeHtml(project.description)}</div>` : ''}
            <div class="project-meta">
                <div class="project-tags">
                    ${project.tags.map(tag => `<span class="task-tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
                <div class="project-actions">
                    <span>${taskCount} tasks</span>
                    <button class="task-action-btn edit-project" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete-project" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

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

        div.addEventListener('dblclick', () => {
            this.switchView('all');
            this.filters.tag = '';
            document.getElementById('tag-filter').value = '';
            this.renderView();
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

    quickAddTask(title) {
        const task = new Task({
            title: title,
            status: this.currentView === 'all' ? 'inbox' : this.currentView,
            type: 'task'
        });

        this.tasks.push(task);
        this.saveTasks();
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
            this.renderView();
            this.updateCounts();
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
        this.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.title;
            projectSelect.appendChild(option);
        });

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
            document.getElementById('task-tags').value = task.tags.join(', ');
        } else {
            title.textContent = 'Add Task';
            document.getElementById('task-id').value = '';
            document.getElementById('task-status').value = this.currentView === 'all' ? 'inbox' : this.currentView;
        }

        modal.classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
    }

    async saveTaskFromForm() {
        const taskId = document.getElementById('task-id').value;
        const tagsValue = document.getElementById('task-tags').value;
        const tags = tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [];

        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            type: document.getElementById('task-type').value,
            status: document.getElementById('task-status').value,
            energy: document.getElementById('task-energy').value,
            time: parseInt(document.getElementById('task-time').value) || 0,
            projectId: document.getElementById('task-project').value || null,
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

    openProjectModal(project = null) {
        const modal = document.getElementById('project-modal');
        const form = document.getElementById('project-form');
        const title = document.getElementById('project-modal-title');

        form.reset();

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
        }

        await this.saveProjects();
        this.closeProjectModal();
        this.renderView();
        this.updateCounts();
        this.updateTagFilter();
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
            inbox: this.tasks.filter(t => t.status === 'inbox' && !t.completed).length,
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

    getProjectTitle(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        return project ? project.title : '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
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
