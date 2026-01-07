/**
 * GTD Web Application - Refactored
 * Main application orchestrator - delegates to specialized modules
 */

import { Task, Project, Reference, Template } from './models.js';
import { Storage } from './storage.js';
import { ElementIds, StorageKeys, TaskStatus, Views, RecurrenceLabels, ViewLabels, Weekday, WeekdayNames, NthWeekdayLabels } from './constants.js';
import { getElement, setTextContent, escapeHtml, announce } from './dom-utils.js';
import { TaskParser } from './nlp-parser.js';
import { getDefaultContextIds } from './config/defaultContexts.js';

// Core modules
import { AppState } from './modules/core/app-state.js';
import { StorageOperations } from './modules/core/storage-ops.js';

// View modules
import { ViewManager } from './modules/views/view-manager.js';
import { TaskRenderer } from './modules/views/task-renderer.js';
import { ProjectRenderer } from './modules/views/project-renderer.js';

// Feature modules
import { TaskOperations } from './modules/features/task-operations.js';
import { ProjectOperations } from './modules/features/project-operations.js';
import { TaskModalManager } from './modules/features/task-modal.js';
import { ContextFilterManager } from './modules/features/context-filter.js';
import { SearchManager } from './modules/features/search.js';
import { TemplatesManager } from './modules/features/templates.js';
import { ArchiveManager } from './modules/features/archive.js';
import { CalendarManager } from './modules/features/calendar.js';
import { DashboardManager } from './modules/features/dashboard.js';
import { FocusPomodoroManager } from './modules/features/focus-pomodoro.js';
import { DependenciesManager } from './modules/features/dependencies.js';

// UI modules
import { VirtualScrollManager } from './modules/ui/virtual-scroll.js';
import { BulkSelectionManager } from './modules/ui/bulk-selection.js';
import { KeyboardNavigationManager } from './modules/ui/keyboard-nav.js';
import { ContextMenuManager } from './modules/ui/context-menu.js';
import { DarkModeManager } from './modules/ui/dark-mode.js';
import { NotificationManager } from './modules/ui/notifications.js';
import { UndoRedoManager } from './modules/ui/undo-redo.js';

class GTDApp {
    constructor() {
        // Initialize state
        this.state = new AppState();

        // Core services
        this.storage = new Storage();
        this.storageOps = new StorageOperations(this.storage, this.state);
        this.parser = new TaskParser();

        // View managers
        this.taskRenderer = new TaskRenderer(this.state, this);
        this.projectRenderer = new ProjectRenderer(this.state, this);
        this.viewManager = new ViewManager(this.state, this);

        // Feature managers
        this.taskOperations = new TaskOperations(this.state, this);
        this.projectOperations = new ProjectOperations(this.state, this);
        this.taskModal = new TaskModalManager(this.state, this);
        this.contextFilter = new ContextFilterManager(this.state, this);
        this.searchManager = new SearchManager(this.state, this);
        this.templatesManager = new TemplatesManager(this.state, this);
        this.archiveManager = new ArchiveManager(this.state, this);
        this.calendarManager = new CalendarManager(this.state, this);
        this.dashboardManager = new DashboardManager(this.state, this);
        this.focusPomodoro = new FocusPomodoroManager(this.state, this);
        this.dependenciesManager = new DependenciesManager(this.state, this);

        // UI managers
        this.bulkSelection = new BulkSelectionManager(this.state, this);
        this.keyboardNav = new KeyboardNavigationManager(this.state, this);
        this.contextMenu = new ContextMenuManager(this.state, this);
        this.darkMode = new DarkModeManager();
        this.notifications = new NotificationManager();
        this.undoRedo = new UndoRedoManager(this.state, this);

        // Legacy properties for backward compatibility
        this.tasks = this.state.tasks;
        this.projects = this.state.projects;
        this.templates = this.state.templates;
        this.currentView = this.state.currentView;
        this.currentProjectId = this.state.currentProjectId;
        this.filters = this.state.filters;
        this.searchQuery = this.state.searchQuery;
        this.advancedSearchFilters = this.state.advancedSearchFilters;
        this.savedSearches = this.state.savedSearches;
        this.selectedContextFilters = this.state.selectedContextFilters;
        this.selectedTaskId = this.keyboardNav.selectedTaskId;
        this.bulkSelectionMode = this.bulkSelection.bulkSelectionMode;
        this.selectedTaskIds = this.bulkSelection.selectedTaskIds;
        this.usageStats = this.state.usageStats;
        this.defaultContexts = this.state.defaultContexts;
        this.focusTaskId = this.focusPomodoro.focusTaskId;
        this.calendarDate = this.calendarManager.calendarDate;
        this.history = this.undoRedo.history;
        this.historyIndex = this.undoRedo.historyIndex;
    }

    async init() {
        try {
            // Register service worker for PWA support
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js');
                    console.log('Service Worker registered:', registration);
                } catch (swError) {
                    console.log('Service Worker registration failed:', swError);
                }
            }

            // Initialize dark mode from preference
            this.darkMode.initializeDarkMode();

            await this.storageOps.initializeStorage();
            await this.storageOps.loadData();
            this.setupEventListeners();
            this.displayUserId();
            this.initializeCustomContexts();

            // Migrate blocked tasks to Waiting (one-time migration for existing data)
            await this.migrateBlockedTasksToWaiting();

            // Check if any waiting tasks now have their dependencies met
            await this.checkWaitingTasksDependencies();

            this.renderView();
            this.updateCounts();
            this.renderProjectsDropdown();
            this.contextFilter.updateContextFilter();
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    async initializeStorage() {
        return this.storageOps.initializeStorage();
    }

    displayUserId() {
        const userIdElement = document.getElementById(ElementIds.userId);
        if (userIdElement && this.storage.userId) {
            userIdElement.textContent = this.storage.userId.substr(0, 12) + '...';
        }
    }

    initializeCustomContexts() {
        const customContexts = localStorage.getItem('gtd_custom_contexts');
        if (customContexts) {
            try {
                const contexts = JSON.parse(customContexts);
                // Ensure defaultContexts includes custom contexts
                this.state.defaultContexts = [...new Set([...this.state.defaultContexts, ...contexts])];
            } catch (e) {
                console.error('Failed to load custom contexts:', e);
            }
        }
    }

    handleInitializationError(error) {
        console.error('Failed to initialize application:', error);
        const container = document.getElementById('app-container');
        if (container) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <h2>Failed to initialize application</h2>
                    <p>Error: ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Reload</button>
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Setup all module event listeners
        this.taskOperations.setup();
        this.projectOperations.setup();
        this.contextFilter.setup();
        this.searchManager.setupSearch();
        this.templatesManager.setupTemplates();
        this.archiveManager.setupArchive();
        this.calendarManager.setupCalendarView();
        this.dashboardManager.setupDashboard();
        this.focusPomodoro.setupFocusMode();
        this.dependenciesManager.setupDependenciesVisualization();
        this.bulkSelection.setupBulkSelection();
        this.keyboardNav.setupKeyboardShortcuts();
        this.contextMenu.setupContextMenu();
        this.darkMode.setupDarkMode();
        this.undoRedo.setupUndoRedo();

        // Setup modal close buttons
        this.setupModalCloseButtons('task-modal', ['close-modal', 'cancel-modal'], () => this.closeTaskModal());
        this.setupModalCloseButtons('project-modal', ['close-project-modal'], () => this.closeProjectModal());

        // Setup task form submission
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.taskModal.saveTaskFromForm();
            });
        }

        // Setup project form submission
        const projectForm = document.getElementById('project-form');
        if (projectForm) {
            projectForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveProjectFromForm();
            });
        }

        // Setup quick add
        const quickAddInput = document.getElementById('quick-add-input');
        const quickAddBtn = document.getElementById('btn-quick-add');

        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => {
                this.handleQuickAdd();
            });
        }

        if (quickAddInput) {
            quickAddInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleQuickAdd();
                }
            });
        }
    }

    setupModalCloseButtons(modalId, buttonIds, closeHandler) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        buttonIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', closeHandler);
            }
        });
    }

    // ==================== VIEW MANAGEMENT ====================

    switchView(view) {
        this.viewManager.switchView(view);
        // Update legacy property
        this.currentView = this.state.currentView;
    }

    renderView() {
        this.viewManager.renderView();
    }

    // ==================== TASK OPERATIONS ====================

    async quickAddTask(title) {
        return this.taskOperations.quickAddTask(title);
    }

    async handleQuickAdd() {
        const input = document.getElementById('quick-add-input');
        if (!input) return;

        const title = input.value.trim();
        if (!title) return;

        await this.quickAddTask(title);
        input.value = '';
    }

    async toggleTaskComplete(taskId) {
        return this.taskOperations.toggleTaskComplete(taskId);
    }

    async deleteTask(taskId) {
        return this.taskOperations.deleteTask(taskId);
    }

    async archiveTask(taskId) {
        return this.taskOperations.archiveTask(taskId);
    }

    async duplicateTask(taskId) {
        return this.taskOperations.duplicateTask(taskId);
    }

    // ==================== PROJECT OPERATIONS ====================

    async deleteProject(projectId) {
        return this.projectOperations.deleteProject(projectId);
    }

    async archiveProject(projectId) {
        return this.projectOperations.archiveProject(projectId);
    }

    async restoreProject(projectId) {
        return this.projectOperations.restoreProject(projectId);
    }

    // ==================== MODAL MANAGEMENT ====================

    openTaskModal(task, defaultProjectId, defaultData) {
        this.taskModal.openTaskModal(task, defaultProjectId, defaultData);
    }

    closeTaskModal() {
        this.taskModal.closeTaskModal();
    }

    openProjectModal(project, pendingTaskData) {
        this.taskModal.pendingTaskData = pendingTaskData;
        // TODO: Implement project modal
        console.log('Open project modal:', project);
    }

    closeProjectModal() {
        this.taskModal.closeProjectModal();
        const modal = document.getElementById('project-modal');
        if (modal) modal.classList.remove('active');
    }

    async saveProjectFromForm() {
        const projectId = document.getElementById('project-id').value;
        const title = document.getElementById('project-title').value;
        const description = document.getElementById('project-description').value;
        const status = document.getElementById('project-status').value;
        const contextsValue = document.getElementById('project-contexts').value;

        let contexts = [];
        if (contextsValue) {
            contexts = contextsValue.split(',').map(c => c.trim()).filter(c => c);
            contexts = contexts.map(context => this.normalizeContextName(context));
        }

        this.saveState(projectId ? 'Edit project' : 'Create project');

        if (projectId) {
            // Update existing project
            const project = this.state.projects.find(p => p.id === projectId);
            if (project) {
                project.title = title;
                project.description = description;
                project.status = status;
                project.contexts = contexts;
                project.updatedAt = new Date().toISOString();

                await this.storageOps.saveProjects();
                this.renderView();
                this.updateCounts();
                this.renderProjectsDropdown();
            }
        } else {
            // Create new project
            const projectData = {
                title: title,
                description: description,
                status: status,
                contexts: contexts
            };

            const project = new Project(projectData);
            this.state.projects.push(project);

            await this.storageOps.saveProjects();
            this.closeProjectModal();
            this.renderView();
            this.updateCounts();
            this.renderProjectsDropdown();

            // If we were creating a project from task modal, return to it
            if (this.taskModal.pendingTaskData) {
                this.openTaskModal(null, project.id, this.taskModal.pendingTaskData);
            }
        }
    }

    // ==================== SEARCH & FILTERING ====================

    filterTasksBySearch(tasks) {
        return this.searchManager.filterTasksBySearch(tasks);
    }

    // ==================== SUBTASKS ====================

    renderSubtasksInModal(subtasks) {
        this.taskModal.renderSubtasksInModal(subtasks);
    }

    addSubtask() {
        this.taskModal.addSubtask();
    }

    removeSubtask(index) {
        this.taskModal.removeSubtask(index);
    }

    toggleSubtaskCompletion(index) {
        this.taskModal.toggleSubtaskCompletion(index);
    }

    getSubtasksFromModal() {
        return this.taskModal.getSubtasksFromModal();
    }

    toggleSubtaskFromFocus(taskId, subtaskIndex) {
        return this.focusPomodoro.toggleSubtaskFromFocus(taskId, subtaskIndex);
    }

    // ==================== CONTEXT FILTER ====================

    updateContextFilter() {
        this.contextFilter.updateContextFilter();
    }

    clearContextFilters() {
        this.contextFilter.clearContextFilters();
    }

    // ==================== UNDO/REDO ====================

    saveState(action) {
        this.undoRedo.saveState(action);
        // Update legacy properties
        this.history = this.undoRedo.history;
        this.historyIndex = this.undoRedo.historyIndex;
    }

    undo() {
        return this.undoRedo.undo();
    }

    redo() {
        return this.undoRedo.redo();
    }

    // ==================== NOTIFICATIONS ====================

    showNotification(message, type, duration) {
        this.notifications.showNotification(message, type, duration);
    }

    showToast(message) {
        this.notifications.showToast(message);
    }

    // ==================== FOCUS MODE ====================

    enterFocusMode(taskId) {
        this.focusPomodoro.enterFocusMode(taskId);
        // Update legacy property
        this.focusTaskId = this.focusPomodoro.focusTaskId;
    }

    exitFocusMode() {
        return this.focusPomodoro.exitFocusMode();
    }

    completeTaskAndExitFocus(taskId) {
        return this.focusPomodoro.completeTaskAndExitFocus(taskId);
    }

    editTaskFromFocus(taskId) {
        return this.focusPomodoro.editTaskFromFocus(taskId);
    }

    // ==================== TASK & PROJECT HELPERS ====================

    normalizeContextName(context) {
        return context.startsWith('@') ? context : `@${context}`;
    }

    getProjectTitle(projectId) {
        const project = this.state.projects.find(p => p.id === projectId);
        return project ? project.title : '';
    }

    // ==================== COUNTS & DROPDOWNS ====================

    updateCounts() {
        const counts = {
            inbox: this.state.tasks.filter(t => t.status === 'inbox').length,
            next: this.state.tasks.filter(t => t.status === 'next').length,
            waiting: this.state.tasks.filter(t => t.status === 'waiting').length,
            scheduled: this.state.tasks.filter(t => t.status === 'scheduled').length,
            someday: this.state.tasks.filter(t => t.status === 'someday').length,
            projects: this.state.projects.filter(p => p.status === 'active').length,
            completed: this.state.tasks.filter(t => t.completed).length,
            all: this.state.tasks.length - this.state.tasks.filter(t => t.completed).length
        };

        // Update count displays
        for (const [key, count] of Object.entries(counts)) {
            const element = document.getElementById(`${key}-count`);
            if (element) {
                element.textContent = count;
            }
        }
    }

    renderProjectsDropdown() {
        const dropdowns = document.querySelectorAll('.project-dropdown');
        const currentValue = {};

        // Save current values
        dropdowns.forEach(dropdown => {
            currentValue[dropdown.id] = dropdown.value;
        });

        // Update each dropdown
        dropdowns.forEach(dropdown => {
            dropdown.innerHTML = '<option value="">No Project</option>';
            this.state.projects.forEach(project => {
                if (project.status === 'active') {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.title;
                    dropdown.appendChild(option);
                }
            });

            // Restore value if it still exists
            if (currentValue[dropdown.id] && this.state.projects.find(p => p.id === currentValue[dropdown.id])) {
                dropdown.value = currentValue[dropdown.id];
            }
        });
    }

    // ==================== MIGRATION & MAINTENANCE ====================

    async migrateBlockedTasksToWaiting() {
        const hasMigrated = localStorage.getItem('gtd_migrated_blocked_to_waiting');
        if (hasMigrated === 'true') return;

        const blockedTasks = this.state.tasks.filter(t => t.status === 'blocked');
        for (const task of blockedTasks) {
            task.status = 'waiting';
            task.waitingForDescription = task.waitingForDescription || 'Previously blocked';
        }

        if (blockedTasks.length > 0) {
            await this.storageOps.saveTasks();
        }

        localStorage.setItem('gtd_migrated_blocked_to_waiting', 'true');
    }

    async checkWaitingTasksDependencies() {
        const waitingTasks = this.state.tasks.filter(t => t.status === 'waiting' && t.waitingForTaskIds && t.waitingForTaskIds.length > 0);

        for (const task of waitingTasks) {
            if (task.areDependenciesMet(this.state.tasks)) {
                // Dependencies are met, move to next
                task.status = 'next';
                task.waitingForTaskIds = [];
                task.updatedAt = new Date().toISOString();
            }
        }

        if (waitingTasks.length > 0) {
            await this.storageOps.saveTasks();
        }
    }

    // ==================== DATA PERSISTENCE ====================

    async saveTasks() {
        return this.storageOps.saveTasks();
    }

    async saveProjects() {
        return this.storageOps.saveProjects();
    }

    async saveTemplates() {
        return this.storageOps.saveTemplates();
    }

    // ==================== USAGE TRACKING ====================

    loadUsageStats() {
        return this.state.loadUsageStats();
    }

    saveUsageStats() {
        this.state.saveUsageStats();
    }

    trackTaskUsage(task) {
        this.state.trackTaskUsage(task);
    }

    getSmartSuggestions(options) {
        return this.state.getSmartSuggestions(this.state.tasks, options);
    }

    // ==================== NAVIGATION ====================

    updateNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const currentView = this.state.currentView;

        navItems.forEach(item => {
            const view = item.dataset.view;
            if (view === currentView) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // ==================== RECURRING TASKS ====================

    getRecurrenceLabel(recurrence) {
        return this.taskModal.getRecurrenceLabel(recurrence);
    }

    // ==================== WAITING FOR TASKS ====================

    renderWaitingForTasksList(currentTask) {
        this.taskModal.renderWaitingForTasksList(currentTask);
    }

    getSelectedWaitingForTasks() {
        return this.taskModal.getSelectedWaitingForTasks();
    }

    // ==================== TEMPLATES ====================

    saveTaskAsTemplate(taskId) {
        this.templatesManager.saveTaskAsTemplate(taskId);
    }

    createTaskFromTemplate(templateId) {
        this.templatesManager.createTaskFromTemplate(templateId);
    }

    editTemplate(templateId) {
        this.templatesManager.editTemplate(templateId);
    }

    deleteTemplate(templateId) {
        this.templatesManager.deleteTemplate(templateId);
    }

    // ==================== CALENDAR ====================

    showCalendar() {
        this.calendarManager.showCalendar();
    }

    closeCalendar() {
        this.calendarManager.closeCalendar();
    }

    navigateCalendar(direction) {
        this.calendarManager.navigateCalendar(direction);
    }

    showTasksForDate(year, month, day) {
        this.calendarManager.showTasksForDate(year, month, day);
    }

    // ==================== DASHBOARD ====================

    showDashboard() {
        this.dashboardManager.showDashboard();
    }

    closeDashboard() {
        this.dashboardManager.closeDashboard();
    }

    // ==================== ARCHIVE ====================

    openArchiveModal() {
        this.archiveManager.openArchiveModal();
    }

    closeArchiveModal() {
        this.archiveManager.closeArchiveModal();
    }

    restoreFromArchive(archiveId) {
        return this.archiveManager.restoreFromArchive(archiveId);
    }

    deleteFromArchive(archiveId) {
        return this.archiveManager.deleteFromArchive(archiveId);
    }

    // ==================== DEPENDENCIES ====================

    openDependenciesModal() {
        this.dependenciesManager.openDependenciesModal();
    }

    closeDependenciesModal() {
        this.dependenciesManager.closeDependenciesModal();
    }

    // ==================== BULK OPERATIONS ====================

    toggleBulkSelectionMode() {
        this.bulkSelection.toggleBulkSelectionMode();
        // Update legacy properties
        this.bulkSelectionMode = this.bulkSelection.bulkSelectionMode;
        this.selectedTaskIds = this.bulkSelection.selectedTaskIds;
    }

    async bulkCompleteTasks() {
        await this.bulkSelection.bulkCompleteTasks();
    }

    async bulkDeleteTasks() {
        await this.bulkSelection.bulkDeleteTasks();
    }

    async bulkSetDueDate(date) {
        await this.bulkSelection.bulkSetDueDate(date);
    }

    async bulkSetProject(projectId) {
        await this.bulkSelection.bulkSetProject(projectId);
    }

    exitBulkSelectionMode() {
        this.bulkSelection.exitBulkSelectionMode();
        // Update legacy properties
        this.bulkSelectionMode = this.bulkSelection.bulkSelectionMode;
        this.selectedTaskIds = this.bulkSelection.selectedTaskIds;
    }

    // ==================== KEYBOARD NAVIGATION ====================

    selectTask(taskId) {
        this.keyboardNav.selectTask(taskId);
        // Update legacy property
        this.selectedTaskId = this.keyboardNav.selectedTaskId;
    }

    // ==================== PRODUCTIVITY HEATMAP ====================

    setupProductivityHeatmap() {
        const heatmapBtn = document.getElementById('btn-heatmap');
        if (heatmapBtn) {
            heatmapBtn.addEventListener('click', () => this.openHeatmapModal());
        }

        const closeBtn = document.getElementById('close-heatmap-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeHeatmapModal());
        }
    }

    openHeatmapModal() {
        const modal = document.getElementById('heatmap-modal');
        if (modal) {
            modal.classList.add('active');
            this.renderProductivityHeatmap();
        }
    }

    closeHeatmapModal() {
        const modal = document.getElementById('heatmap-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    renderProductivityHeatmap() {
        const container = document.getElementById('heatmap-container');
        if (!container) return;

        // Get completion data for the last 365 days
        const days = 365;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Build completion count per day
        const completionData = this.buildCompletionData(startDate, endDate);

        // Update statistics
        this.updateHeatmapStats(completionData);

        // Render the heatmap grid
        this.renderHeatmapGrid(completionData, days, container);
    }

    buildCompletionData(startDate, endDate) {
        const data = {};
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            data[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Count completed tasks per day
        this.state.tasks.forEach(task => {
            if (task.completed && task.completedAt) {
                const completedDate = task.completedAt.split('T')[0];
                if (data[completedDate] !== undefined) {
                    data[completedDate]++;
                }
            }
        });

        return data;
    }

    updateHeatmapStats(completionData) {
        const totalDays = Object.keys(completionData).length;
        const activeDays = Object.values(completionData).filter(count => count > 0).length;
        const totalTasks = Object.values(completionData).reduce((sum, count) => sum + count, 0);
        const avgTasksPerDay = activeDays > 0 ? (totalTasks / activeDays).toFixed(1) : 0;

        const totalDaysEl = document.getElementById('heatmap-total-days');
        const activeDaysEl = document.getElementById('heatmap-active-days');
        const totalTasksEl = document.getElementById('heatmap-total-completed');
        const avgTasksEl = document.getElementById('heatmap-avg-tasks');

        if (totalDaysEl) totalDaysEl.textContent = totalDays;
        if (activeDaysEl) activeDaysEl.textContent = activeDays;
        if (totalTasksEl) totalTasksEl.textContent = totalTasks;
        if (avgTasksEl) avgTasksEl.textContent = avgTasksPerDay;
    }

    renderHeatmapGrid(completionData, days, container) {
        const weeks = Math.ceil(days / 7);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let html = '<div class="heatmap-grid">';

        // Add month labels
        let currentMonth = -1;
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - days); // Go back days days

        for (let week = 0; week < weeks; week++) {
            for (let day = 0; day < 7; day++) {
                const date = new Date();
                date.setDate(date.getDate() - ((weeks - week - 1) * 7 + (6 - day)));

                const dateKey = date.toISOString().split('T')[0];
                const count = completionData[dateKey] || 0;
                const isToday = date.toDateString() === today.toDateString();

                if (date.getMonth() !== currentMonth) {
                    currentMonth = date.getMonth();
                    // Add month label
                }

                let level = 0;
                if (count > 0) level = 1;
                if (count > 1) level = 2;
                if (count > 3) level = 3;
                if (count > 5) level = 4;

                html += `<div class="heatmap-day level-${level} ${isToday ? 'today' : ''}"
                          title="${date.toLocaleDateString()}: ${count} tasks"
                          style="grid-column: ${week + 2}; grid-row: ${day + 2}"></div>`;
            }
        }

        html += '</div>';

        // Add day labels
        html += '<div class="heatmap-labels heatmap-day-labels">';
        dayNames.forEach(day => {
            html += `<div style="grid-row: auto">${day}</div>`;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // ==================== GANTT CHART ====================

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
        const projectTasks = this.state.tasks.filter(t => t.projectId === project.id);

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

        // Calculate timeline
        const tasksWithDates = projectTasks.filter(t => t.dueDate);
        if (tasksWithDates.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-calendar-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Tasks with Due Dates</h3>
                    <p>Set due dates for tasks to see the Gantt chart.</p>
                </div>
            `;
            return;
        }

        // Simple Gantt chart rendering
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Sort tasks by due date
        const sortedTasks = tasksWithDates.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // Find min and max dates
        const minDate = new Date(Math.min(...sortedTasks.map(t => new Date(t.dueDate))));
        const maxDate = new Date(Math.max(...sortedTasks.map(t => new Date(t.dueDate))));

        // Render Gantt chart
        let html = '<div class="gantt-chart">';

        sortedTasks.forEach(task => {
            const dueDate = new Date(task.dueDate);
            const createdDate = task.createdAt ? new Date(task.createdAt) : today;
            const completed = task.completed;

            // Calculate position
            const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
            const startOffset = Math.ceil((createdDate - minDate) / (1000 * 60 * 60 * 24));
            const duration = Math.ceil((dueDate - createdDate) / (1000 * 60 * 60 * 24)) || 1;

            const leftPercent = (startOffset / totalDays) * 100;
            const widthPercent = (duration / totalDays) * 100;

            html += `
                <div class="gantt-task ${completed ? 'completed' : ''}"
                     style="margin-left: ${leftPercent}%; width: ${widthPercent}%;"
                     title="${task.title}
Due: ${task.dueDate}
Created: ${task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}">
                    <div class="gantt-task-title">${escapeHtml(task.title)}</div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }
}

// Initialize app
const app = new GTDApp();
document.addEventListener('DOMContentLoaded', () => app.init());

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GTDApp };
}
