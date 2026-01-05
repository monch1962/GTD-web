/**
 * GTD Web Application
 * Main application logic
 */

import { Task, Project, Reference } from './models.js';
import { Storage } from './storage.js';
import { ElementIds, StorageKeys, TaskStatus, Views, RecurrenceLabels } from './constants.js';
import { getElement, setTextContent, escapeHtml } from './dom-utils.js';
import { TaskParser } from './nlp-parser.js';

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
        this.parser = new TaskParser();
        this.selectedTaskId = null; // Track currently selected task for keyboard shortcuts
        this.bulkSelectionMode = false; // Track if bulk selection mode is active
        this.selectedTaskIds = new Set(); // Track selected task IDs for bulk operations
        this.usageStats = this.loadUsageStats(); // Track usage patterns for smart defaults
        this.defaultContexts = ['@home', '@work', '@personal', '@computer', '@phone', '@errand']; // Single source of truth
        this.searchQuery = ''; // Current search query
        this.advancedSearchFilters = {
            context: '',
            energy: '',
            status: '',
            due: ''
        }; // Advanced search filters
        this.savedSearches = JSON.parse(localStorage.getItem('gtd_saved_searches') || '[]'); // Saved searches
        this.activeTimers = new Map(); // Track active timers for tasks
        this.pomodoroTimer = null; // Pomodoro timer reference
        this.pomodoroTimeLeft = 25 * 60; // 25 minutes in seconds
        this.pomodoroIsRunning = false; // Track if Pomodoro timer is running
        this.pomodoroIsBreak = false; // Track if in break mode
        this.focusTaskId = null; // Task currently in focus mode
        this.calendarView = 'month'; // Calendar view: month, week
        this.calendarDate = new Date(); // Currently viewed month in calendar
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
            this.initializeDarkMode();

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
            this.renderDefaultContextButtons();
            this.renderCustomContexts();
            this.renderSavedSearches();
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
        this.setupSuggestionsButton();
        this.setupKeyboardShortcuts();
        this.setupBulkSelection();
        this.setupSearch();
        this.setupDashboard();
        this.setupWeeklyReview();
        this.setupTimeTracking();
        this.setupDarkMode();
        this.setupCalendarView();
        this.setupFocusMode();
        this.setupNewProjectButton();
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

        // Set initial placeholder with smart defaults
        this.updateQuickAddPlaceholder();

        quickAddInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && quickAddInput.value.trim()) {
                this.quickAddTask(quickAddInput.value.trim());
                quickAddInput.value = '';

                // Update placeholder after adding task (stats may have changed)
                this.updateQuickAddPlaceholder();
            }
        });
    }

    updateQuickAddPlaceholder() {
        const quickAddInput = document.getElementById('quick-add-input');
        if (!quickAddInput) return;

        const defaults = this.getSmartDefaults();
        let placeholder = 'Quick add...';

        if (defaults.hasEnoughData) {
            const suggestions = [];
            if (defaults.context) {
                suggestions.push(defaults.context);
            }
            if (defaults.time) {
                const timeStr = defaults.time >= 60
                    ? `${Math.floor(defaults.time / 60)}h`
                    : `${defaults.time}min`;
                suggestions.push(timeStr);
            }

            if (suggestions.length > 0) {
                placeholder += ` (Common: ${suggestions.join(', ')})`;
            }
        }

        placeholder += " (Try: \"Call John @work tomorrow high energy\")";
        quickAddInput.placeholder = placeholder;
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

    setupDataExportImport() {
        const exportBtn = document.getElementById('btn-export');
        const importBtn = document.getElementById('btn-import');
        const fileInput = document.getElementById('import-file-input');

        if (!exportBtn || !importBtn || !fileInput) return;

        // Export functionality
        exportBtn.addEventListener('click', () => {
            this.exportData();
        });

        // Import functionality
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importData(file);
                // Reset file input so same file can be selected again if needed
                fileInput.value = '';
            }
        });
    }

    /**
     * Export all GTD data to a JSON file
     */
    exportData() {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                tasks: this.tasks.map(task => task.toJSON()),
                projects: this.projects.map(project => project.toJSON()),
                customContexts: JSON.parse(localStorage.getItem('gtd_custom_contexts') || '[]'),
                usageStats: this.usageStats
            };

            // Create a blob and download
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            const now = new Date();
            const timestamp = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0') + '-' +
                String(now.getHours()).padStart(2, '0') + '-' +
                String(now.getMinutes()).padStart(2, '0') + '-' +
                String(now.getSeconds()).padStart(2, '0');
            link.href = url;
            link.download = `gtd-backup-${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            alert('Data exported successfully! File downloaded.');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again.');
        }
    }

    /**
     * Import GTD data from a JSON file
     */
    async importData(file) {
        try {
            // Confirm import with user
            const confirmMsg = 'This will replace all your current GTD data with the imported data.\n\n' +
                              'Are you sure you want to continue?';
            if (!confirm(confirmMsg)) {
                return;
            }

            // Read file
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importData = JSON.parse(e.target.result);

                    // Validate import data
                    if (!importData.tasks || !Array.isArray(importData.tasks)) {
                        throw new Error('Invalid import file: missing or invalid tasks array');
                    }
                    if (!importData.projects || !Array.isArray(importData.projects)) {
                        throw new Error('Invalid import file: missing or invalid projects array');
                    }

                    // Clear existing data
                    this.tasks = [];
                    this.projects = [];

                    // Import tasks
                    importData.tasks.forEach(taskData => {
                        const task = new Task(taskData);
                        this.tasks.push(task);
                    });

                    // Import projects
                    importData.projects.forEach(projectData => {
                        const project = new Project(projectData);
                        this.projects.push(project);
                    });

                    // Import custom contexts if present
                    if (importData.customContexts && Array.isArray(importData.customContexts)) {
                        localStorage.setItem('gtd_custom_contexts', JSON.stringify(importData.customContexts));
                    }

                    // Import usage stats if present
                    if (importData.usageStats) {
                        this.usageStats = importData.usageStats;
                        this.saveUsageStats();
                    }

                    // Save to storage
                    await this.saveTasks();
                    await this.saveProjects();

                    // Refresh UI
                    this.renderView();
                    this.updateCounts();
                    this.renderProjectsDropdown();
                    this.renderCustomContexts();
                    this.updateQuickAddPlaceholder();

                    alert(`Import successful!\n\nImported ${this.tasks.length} tasks and ${this.projects.length} projects.`);
                } catch (parseError) {
                    console.error('Failed to parse import file:', parseError);
                    alert('Failed to parse import file. Please make sure it\'s a valid GTD backup file.');
                }
            };

            reader.onerror = () => {
                alert('Failed to read file. Please try again.');
            };

            reader.readAsText(file);
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import data. Please try again.');
        }
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

        // Setup export/import buttons
        this.setupDataExportImport();

        // Note: Quick context button event listeners are now attached dynamically in renderDefaultContextButtons()

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

    setupSuggestionsButton() {
        const suggestionsButton = document.getElementById('btn-suggestions');
        if (!suggestionsButton) return;

        suggestionsButton.addEventListener('click', () => {
            this.showSuggestions();
        });

        // Setup NLP examples toggle
        const toggleHelpBtn = document.getElementById('toggle-nlp-help');
        if (toggleHelpBtn) {
            toggleHelpBtn.addEventListener('click', () => {
                const examplesDiv = document.getElementById('nlp-examples');
                if (examplesDiv) {
                    const isVisible = examplesDiv.style.display !== 'none';
                    examplesDiv.style.display = isVisible ? 'none' : 'block';
                    toggleHelpBtn.innerHTML = isVisible
                        ? '<i class="fas fa-info-circle"></i> See examples'
                        : '<i class="fas fa-chevron-up"></i> Hide examples';
                }
            });
        }

        // Setup templates toggle
        this.setupTaskTemplates();
    }

    setupTaskTemplates() {
        const templates = [
            { name: 'Quick Email', template: 'Quick email response 15min low energy' },
            { name: 'Phone Call', template: 'Phone call @phone 10min medium energy' },
            { name: 'Meeting Notes', template: 'Review meeting notes @computer 20min medium energy' },
            { name: 'Research', template: 'Research topic @computer 45min high energy' },
            { name: 'Gym Workout', template: 'Gym workout @personal 1hr high energy daily' },
            { name: 'Reading', template: 'Read documentation @computer 30min medium energy' },
            { name: 'Code Review', template: 'Code review @computer 30min high energy' },
            { name: 'Planning', template: 'Plan sprint @work 45min high energy weekly' },
            { name: 'Email Check', template: 'Check and respond to emails @computer 15min low energy' },
            { name: 'Quick Task', template: 'Quick task 5min low energy' }
        ];

        const toggleTemplatesBtn = document.getElementById('toggle-templates');
        const templatesList = document.getElementById('templates-list');

        if (toggleTemplatesBtn && templatesList) {
            // Populate templates list
            templatesList.innerHTML = templates.map(t => `
                <button class="template-item" data-template="${t.template}" style="
                    text-align: left;
                    padding: var(--spacing-xs);
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    font-size: 0.75rem;
                    transition: all 0.2s;
                ">
                    <div style="font-weight: 600; margin-bottom: 2px;">${t.name}</div>
                    <div style="opacity: 0.7; font-size: 0.7rem;">${t.template}</div>
                </button>
            `).join('');

            // Toggle templates dropdown
            toggleTemplatesBtn.addEventListener('click', () => {
                const templatesDropdown = document.getElementById('templates-dropdown');
                if (templatesDropdown) {
                    const isVisible = templatesDropdown.style.display !== 'none';
                    templatesDropdown.style.display = isVisible ? 'none' : 'block';
                    toggleTemplatesBtn.innerHTML = isVisible
                        ? '<i class="fas fa-clone"></i> Quick Templates'
                        : '<i class="fas fa-chevron-up"></i> Hide Templates';
                }
            });

            // Handle template selection
            templatesList.addEventListener('click', (e) => {
                const templateBtn = e.target.closest('.template-item');
                if (templateBtn) {
                    const template = templateBtn.dataset.template;
                    const quickAddInput = document.getElementById('quick-add-input');
                    if (quickAddInput) {
                        quickAddInput.value = template;
                        quickAddInput.focus();
                    }
                }
            });

            // Add hover effects for template items
            templatesList.addEventListener('mouseover', (e) => {
                const templateBtn = e.target.closest('.template-item');
                if (templateBtn) {
                    templateBtn.style.background = 'var(--bg-hover)';
                    templateBtn.style.borderColor = 'var(--accent-color)';
                }
            });

            templatesList.addEventListener('mouseout', (e) => {
                const templateBtn = e.target.closest('.template-item');
                if (templateBtn) {
                    templateBtn.style.background = 'var(--bg-primary)';
                    templateBtn.style.borderColor = 'var(--border-color)';
                }
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if user is typing in an input or textarea
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                // Still allow Ctrl+K to focus quick-add even from other inputs
                if (e.ctrlKey && e.key === 'k' && target.id !== 'quick-add-input') {
                    e.preventDefault();
                    const quickAddInput = document.getElementById('quick-add-input');
                    if (quickAddInput) {
                        quickAddInput.focus();
                        quickAddInput.select();
                    }
                }
                return;
            }

            // Ctrl+N: Open suggestions modal
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                const suggestionsButton = document.getElementById('btn-suggestions');
                if (suggestionsButton) {
                    this.showSuggestions();
                }
            }

            // Ctrl+K: Focus quick-add input
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                const quickAddInput = document.getElementById('quick-add-input');
                if (quickAddInput) {
                    quickAddInput.focus();
                }
            }

            // Ctrl+D: Duplicate selected task (if a task is selected)
            if (e.ctrlKey && e.key === 'd' && this.selectedTaskId) {
                e.preventDefault();
                this.duplicateTask(this.selectedTaskId);
            }

            // Arrow keys: Navigate between tasks
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'j' || e.key === 'k') {
                const tasks = document.querySelectorAll('.task-item');
                if (tasks.length === 0) return;

                e.preventDefault();
                let currentIndex = -1;

                if (this.selectedTaskId) {
                    const currentTask = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`);
                    if (currentTask) {
                        currentIndex = Array.from(tasks).indexOf(currentTask);
                    }
                }

                let nextIndex;
                if (e.key === 'ArrowDown' || e.key === 'j') {
                    nextIndex = currentIndex < tasks.length - 1 ? currentIndex + 1 : 0;
                } else {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : tasks.length - 1;
                }

                this.selectTask(tasks[nextIndex].dataset.taskId);
            }

            // Enter: Edit selected task
            if (e.key === 'Enter' && this.selectedTaskId) {
                e.preventDefault();
                const task = this.tasks.find(t => t.id === this.selectedTaskId);
                if (task) {
                    this.openTaskModal(task);
                }
            }

            // Escape: Deselect task
            if (e.key === 'Escape') {
                this.deselectTask();
            }
        });
    }

    selectTask(taskId) {
        // Deselect previous task
        this.deselectTask();

        // Select new task
        this.selectedTaskId = taskId;
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('selected');
            taskElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    deselectTask() {
        if (this.selectedTaskId) {
            const taskElement = document.querySelector(`[data-task-id="${this.selectedTaskId}"]`);
            if (taskElement) {
                taskElement.classList.remove('selected');
            }
            this.selectedTaskId = null;
        }
    }

    setupBulkSelection() {
        const bulkSelectBtn = document.getElementById('btn-bulk-select');
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        const bulkCompleteBtn = document.getElementById('btn-bulk-complete');
        const bulkCancelBtn = document.getElementById('btn-bulk-cancel');
        const bulkSelectedCount = document.getElementById('bulk-selected-count');

        // Show bulk select button when there are tasks
        this.updateBulkSelectButtonVisibility();

        // Toggle bulk selection mode
        bulkSelectBtn.addEventListener('click', () => {
            this.toggleBulkSelectionMode();
        });

        // Complete selected tasks
        bulkCompleteBtn.addEventListener('click', async () => {
            await this.bulkCompleteTasks();
        });

        // Cancel bulk selection
        bulkCancelBtn.addEventListener('click', () => {
            this.exitBulkSelectionMode();
        });
    }

    updateBulkSelectButtonVisibility() {
        const bulkSelectBtn = document.getElementById('btn-bulk-select');
        const tasks = document.querySelectorAll('.task-item');
        if (bulkSelectBtn) {
            bulkSelectBtn.style.display = tasks.length > 0 ? 'block' : 'none';
        }
    }

    toggleBulkSelectionMode() {
        this.bulkSelectionMode = !this.bulkSelectionMode;
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        const bulkSelectBtn = document.getElementById('btn-bulk-select');

        if (this.bulkSelectionMode) {
            bulkActionsBar.style.display = 'flex';
            bulkSelectBtn.innerHTML = '<i class="fas fa-times"></i> Exit Selection';
            this.renderView(); // Re-render to show bulk checkboxes
        } else {
            this.exitBulkSelectionMode();
        }
    }

    exitBulkSelectionMode() {
        this.bulkSelectionMode = false;
        this.selectedTaskIds.clear();
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        const bulkSelectBtn = document.getElementById('btn-bulk-select');

        if (bulkActionsBar) {
            bulkActionsBar.style.display = 'none';
        }
        if (bulkSelectBtn) {
            bulkSelectBtn.innerHTML = '<i class="fas fa-check-square"></i> Select Multiple';
        }
        this.updateBulkSelectedCount();
        this.renderView(); // Re-render to hide bulk checkboxes
    }

    toggleBulkTaskSelection(taskId) {
        if (this.selectedTaskIds.has(taskId)) {
            this.selectedTaskIds.delete(taskId);
        } else {
            this.selectedTaskIds.add(taskId);
        }
        this.updateBulkSelectedCount();
    }

    updateBulkSelectedCount() {
        const bulkSelectedCount = document.getElementById('bulk-selected-count');
        const bulkCompleteBtn = document.getElementById('btn-bulk-complete');

        if (bulkSelectedCount) {
            bulkSelectedCount.textContent = this.selectedTaskIds.size;
        }

        if (bulkCompleteBtn) {
            bulkCompleteBtn.disabled = this.selectedTaskIds.size === 0;
            bulkCompleteBtn.style.opacity = this.selectedTaskIds.size === 0 ? '0.5' : '1';
        }
    }

    async bulkCompleteTasks() {
        if (this.selectedTaskIds.size === 0) return;

        for (const taskId of this.selectedTaskIds) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task && !task.completed) {
                task.completed = true;
                task.completedAt = new Date().toISOString();
            }
        }

        await this.saveTasks();
        this.exitBulkSelectionMode();
        this.renderView();
        this.updateCounts();
    }

    // ==================== SEARCH FUNCTIONALITY ====================

    setupSearch() {
        const searchInput = document.getElementById('global-search');
        const clearSearchBtn = document.getElementById('clear-search');
        const advancedSearchPanel = document.getElementById('advanced-search-panel');
        const searchContext = document.getElementById('search-context');
        const searchEnergy = document.getElementById('search-energy');
        const searchStatus = document.getElementById('search-status');
        const searchDue = document.getElementById('search-due');
        const saveSearchBtn = document.getElementById('save-search');
        const savedSearchesSelect = document.getElementById('saved-searches');
        const deleteSavedSearchBtn = document.getElementById('delete-saved-search');
        const clearAdvancedSearchBtn = document.getElementById('clear-advanced-search');

        if (!searchInput) return;

        // Populate context dropdown
        this.populateSearchContexts(searchContext);

        // Global search input
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';

            // Show advanced search panel when typing
            if (this.searchQuery && advancedSearchPanel) {
                advancedSearchPanel.style.display = 'block';
            }

            this.renderView();
        });

        // Clear search
        clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // Advanced filters
        [searchContext, searchEnergy, searchStatus, searchDue].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.advancedSearchFilters.context = searchContext.value;
                    this.advancedSearchFilters.energy = searchEnergy.value;
                    this.advancedSearchFilters.status = searchStatus.value;
                    this.advancedSearchFilters.due = searchDue.value;
                    this.renderView();
                });
            }
        });

        // Save search
        saveSearchBtn.addEventListener('click', () => {
            this.saveCurrentSearch();
        });

        // Load saved search
        savedSearchesSelect.addEventListener('change', (e) => {
            const searchId = e.target.value;
            if (searchId) {
                this.loadSavedSearch(searchId);
                deleteSavedSearchBtn.style.display = 'inline-block';
            } else {
                deleteSavedSearchBtn.style.display = 'none';
            }
        });

        // Delete saved search
        deleteSavedSearchBtn.addEventListener('click', () => {
            const searchId = savedSearchesSelect.value;
            if (searchId && confirm('Delete this saved search?')) {
                this.deleteSavedSearch(searchId);
            }
        });

        // Clear advanced filters
        clearAdvancedSearchBtn.addEventListener('click', () => {
            this.clearAdvancedSearch();
        });
    }

    populateSearchContexts(selectElement) {
        if (!selectElement) return;

        // Get all unique contexts
        const allContexts = new Set(this.defaultContexts);
        this.tasks.forEach(task => {
            if (task.contexts) {
                task.contexts.forEach(context => allContexts.add(context));
            }
        });

        // Clear existing options (except first)
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }

        // Add sorted context options
        Array.from(allContexts).sort().forEach(context => {
            const option = document.createElement('option');
            option.value = context;
            option.textContent = context;
            selectElement.appendChild(option);
        });
    }

    clearSearch() {
        this.searchQuery = '';
        this.advancedSearchFilters = { context: '', energy: '', status: '', due: '' };

        const searchInput = document.getElementById('global-search');
        const clearSearchBtn = document.getElementById('clear-search');
        const advancedSearchPanel = document.getElementById('advanced-search-panel');

        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        if (advancedSearchPanel) advancedSearchPanel.style.display = 'none';

        this.renderView();
    }

    clearAdvancedSearch() {
        this.advancedSearchFilters = { context: '', energy: '', status: '', due: '' };

        const searchContext = document.getElementById('search-context');
        const searchEnergy = document.getElementById('search-energy');
        const searchStatus = document.getElementById('search-status');
        const searchDue = document.getElementById('search-due');

        if (searchContext) searchContext.value = '';
        if (searchEnergy) searchEnergy.value = '';
        if (searchStatus) searchStatus.value = '';
        if (searchDue) searchDue.value = '';

        this.renderView();
    }

    saveCurrentSearch() {
        const name = prompt('Name this search:');
        if (!name) return;

        const search = {
            id: Date.now().toString(),
            name: name,
            query: this.searchQuery,
            filters: { ...this.advancedSearchFilters },
            createdAt: new Date().toISOString()
        };

        this.savedSearches.push(search);
        localStorage.setItem('gtd_saved_searches', JSON.stringify(this.savedSearches));
        this.renderSavedSearches();

        alert('Search saved!');
    }

    loadSavedSearch(searchId) {
        const search = this.savedSearches.find(s => s.id === searchId);
        if (!search) return;

        this.searchQuery = search.query || '';
        this.advancedSearchFilters = { ...search.filters };

        const searchInput = document.getElementById('global-search');
        const clearSearchBtn = document.getElementById('clear-search');
        const advancedSearchPanel = document.getElementById('advanced-search-panel');
        const searchContext = document.getElementById('search-context');
        const searchEnergy = document.getElementById('search-energy');
        const searchStatus = document.getElementById('search-status');
        const searchDue = document.getElementById('search-due');

        if (searchInput) {
            searchInput.value = this.searchQuery;
        }
        if (clearSearchBtn) {
            clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
        if (advancedSearchPanel) {
            advancedSearchPanel.style.display = 'block';
        }
        if (searchContext) searchContext.value = this.advancedSearchFilters.context;
        if (searchEnergy) searchEnergy.value = this.advancedSearchFilters.energy;
        if (searchStatus) searchStatus.value = this.advancedSearchFilters.status;
        if (searchDue) searchDue.value = this.advancedSearchFilters.due;

        this.renderView();
    }

    deleteSavedSearch(searchId) {
        this.savedSearches = this.savedSearches.filter(s => s.id !== searchId);
        localStorage.setItem('gtd_saved_searches', JSON.stringify(this.savedSearches));
        this.renderSavedSearches();

        const savedSearchesSelect = document.getElementById('saved-searches');
        const deleteSavedSearchBtn = document.getElementById('delete-saved-search');

        if (savedSearchesSelect) savedSearchesSelect.value = '';
        if (deleteSavedSearchBtn) deleteSavedSearchBtn.style.display = 'none';
    }

    renderSavedSearches() {
        const savedSearchesSelect = document.getElementById('saved-searches');
        if (!savedSearchesSelect) return;

        // Save current selection
        const currentValue = savedSearchesSelect.value;

        // Clear existing options (except first)
        while (savedSearchesSelect.options.length > 1) {
            savedSearchesSelect.remove(1);
        }

        // Add saved searches
        this.savedSearches.forEach(search => {
            const option = document.createElement('option');
            option.value = search.id;
            option.textContent = search.name;
            savedSearchesSelect.appendChild(option);
        });

        // Restore selection if it still exists
        if (currentValue && this.savedSearches.find(s => s.id === currentValue)) {
            savedSearchesSelect.value = currentValue;
        }
    }

    filterTasksBySearch(tasks) {
        if (!this.searchQuery && !this.advancedSearchFilters.context &&
            !this.advancedSearchFilters.energy && !this.advancedSearchFilters.status &&
            !this.advancedSearchFilters.due) {
            return tasks;
        }

        return tasks.filter(task => {
            // Text search
            if (this.searchQuery) {
                const searchLower = this.searchQuery.toLowerCase();
                const titleMatch = task.title && task.title.toLowerCase().includes(searchLower);
                const descriptionMatch = task.description && task.description.toLowerCase().includes(searchLower);
                const contextMatch = task.contexts && task.contexts.some(c =>
                    c.toLowerCase().includes(searchLower)
                );

                if (!titleMatch && !descriptionMatch && !contextMatch) {
                    return false;
                }
            }

            // Context filter
            if (this.advancedSearchFilters.context) {
                if (!task.contexts || !task.contexts.includes(this.advancedSearchFilters.context)) {
                    return false;
                }
            }

            // Energy filter
            if (this.advancedSearchFilters.energy) {
                if (task.energy !== this.advancedSearchFilters.energy) {
                    return false;
                }
            }

            // Status filter
            if (this.advancedSearchFilters.status) {
                if (task.status !== this.advancedSearchFilters.status) {
                    return false;
                }
            }

            // Due date filter
            if (this.advancedSearchFilters.due) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                switch (this.advancedSearchFilters.due) {
                    case 'overdue':
                        if (!task.isOverdue()) return false;
                        break;
                    case 'today':
                        if (!task.isDueToday()) return false;
                        break;
                    case 'week':
                        if (!task.dueDate) return false;
                        const dueDate = new Date(task.dueDate);
                        const weekFromNow = new Date(today);
                        weekFromNow.setDate(weekFromNow.getDate() + 7);
                        if (dueDate < today || dueDate > weekFromNow) return false;
                        break;
                    case 'month':
                        if (!task.dueDate) return false;
                        const monthFromNow = new Date(today);
                        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
                        const dueDateMonth = new Date(task.dueDate);
                        if (dueDateMonth < today || dueDateMonth > monthFromNow) return false;
                        break;
                    case 'nodate':
                        if (task.dueDate) return false;
                        break;
                }
            }

            return true;
        });
    }

    // ==================== DASHBOARD FUNCTIONALITY ====================

    setupDashboard() {
        const dashboardBtn = document.getElementById('btn-dashboard');
        const closeDashboardBtn = document.getElementById('close-dashboard-modal');

        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => {
                this.showDashboard();
            });
        }

        if (closeDashboardBtn) {
            closeDashboardBtn.addEventListener('click', () => {
                this.closeDashboard();
            });
        }
    }

    showDashboard() {
        const modal = document.getElementById('dashboard-modal');
        if (!modal) return;

        modal.style.display = 'block';
        this.renderDashboard();
    }

    closeDashboard() {
        const modal = document.getElementById('dashboard-modal');
        if (modal) modal.style.display = 'none';
    }

    renderDashboard() {
        const dashboardContent = document.getElementById('dashboard-content');
        if (!dashboardContent) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // Calculate metrics
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed);
        const activeTasks = this.tasks.filter(t => !t.completed);

        const completedThisWeek = completedTasks.filter(t =>
            t.completedAt && new Date(t.completedAt) >= weekAgo
        ).length;

        const completedThisMonth = completedTasks.filter(t =>
            t.completedAt && new Date(t.completedAt) >= monthAgo
        ).length;

        // Context analytics
        const contextUsage = {};
        const contextCompletion = {};
        this.tasks.forEach(task => {
            if (task.contexts) {
                task.contexts.forEach(context => {
                    if (!contextUsage[context]) contextUsage[context] = 0;
                    contextUsage[context]++;

                    if (!contextCompletion[context]) {
                        contextCompletion[context] = { total: 0, completed: 0 };
                    }
                    contextCompletion[context].total++;
                    if (task.completed) {
                        contextCompletion[context].completed++;
                    }
                });
            }
        });

        // Energy analytics
        const energyStats = { high: { total: 0, completed: 0 }, medium: { total: 0, completed: 0 }, low: { total: 0, completed: 0 } };
        this.tasks.forEach(task => {
            if (task.energy && energyStats[task.energy]) {
                energyStats[task.energy].total++;
                if (task.completed) energyStats[task.energy].completed++;
            }
        });

        // Time estimation accuracy
        const tasksWithTime = this.tasks.filter(t => t.completed && t.time && t.timeSpent);
        let avgAccuracy = 0;
        if (tasksWithTime.length > 0) {
            const accuracies = tasksWithTime.map(t => {
                const estimated = t.time;
                const actual = t.timeSpent || 1;
                return Math.min(estimated / actual, actual / estimated);
            });
            avgAccuracy = (accuracies.reduce((a, b) => a + b, 0) / accuracies.length * 100).toFixed(0);
        }

        // Project completion
        const activeProjects = this.projects.filter(p => p.status === 'active');
        const completedProjects = this.projects.filter(p => p.status === 'completed');

        // Stalled projects (no recent activity)
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const stalledProjects = activeProjects.filter(p => {
            const projectTasks = this.tasks.filter(t => t.projectId === p.id && !t.completed);
            const recentUpdates = projectTasks.filter(t => {
                const updatedAt = new Date(t.updatedAt);
                return updatedAt >= thirtyDaysAgo;
            });
            return projectTasks.length > 0 && recentUpdates.length === 0;
        });

        // Render dashboard
        dashboardContent.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                <!-- Overview Cards -->
                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem; color: var(--text-secondary);">Total Tasks</h3>
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-color);">${totalTasks}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${activeTasks.length} active, ${completedTasks.length} completed</div>
                </div>

                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem; color: var(--text-secondary);">Completed This Week</h3>
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--success-color);">${completedThisWeek}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${completedThisMonth} this month</div>
                </div>

                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem; color: var(--text-secondary);">Projects</h3>
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--accent-color);">${activeProjects.length}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${completedProjects.length} completed, ${stalledProjects.length} stalled</div>
                </div>

                ${tasksWithTime.length > 0 ? `
                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem; color: var(--text-secondary);">Estimation Accuracy</h3>
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--info-color);">${avgAccuracy}%</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Based on ${tasksWithTime.length} completed tasks</div>
                </div>
                ` : ''}
            </div>

            <!-- Context Analytics -->
            <div style="margin-bottom: var(--spacing-lg);">
                <h3 style="margin-bottom: var(--spacing-md);">Context Usage</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--spacing-sm);">
                    ${Object.entries(contextUsage)
                        .sort((a, b) => b[1] - a[1])
                        .map(([context, count]) => {
                            const completion = contextCompletion[context];
                            const completionRate = completion.total > 0
                                ? Math.round((completion.completed / completion.total) * 100)
                                : 0;
                            return `
                                <div style="background: var(--bg-primary); padding: var(--spacing-sm); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                        <strong>${escapeHtml(context)}</strong>
                                        <span style="color: var(--text-secondary);">${count} tasks</span>
                                    </div>
                                    <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
                                        <div style="height: 100%; background: var(--success-color); width: ${completionRate}%;"></div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${completionRate}% complete</div>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>

            <!-- Energy Analytics -->
            <div style="margin-bottom: var(--spacing-lg);">
                <h3 style="margin-bottom: var(--spacing-md);">Energy Level Performance</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md);">
                    ${['high', 'medium', 'low'].map(energy => {
                        const stats = energyStats[energy];
                        const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                        return `
                            <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color); margin-bottom: var(--spacing-xs);">${energy.charAt(0).toUpperCase() + energy.slice(1)}</div>
                                <div style="font-size: 0.9rem; margin-bottom: var(--spacing-xs);">${stats.completed}/${stats.total} completed</div>
                                <div style="font-size: 2rem; font-weight: bold; color: ${rate >= 70 ? 'var(--success-color)' : rate >= 40 ? 'var(--warning-color)' : 'var(--danger-color)'};">${rate}%</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            ${stalledProjects.length > 0 ? `
            <!-- Stalled Projects -->
            <div>
                <h3 style="margin-bottom: var(--spacing-md); color: var(--warning-color);">
                    <i class="fas fa-exclamation-triangle"></i> Stalled Projects (30+ days inactive)
                </h3>
                <div style="display: grid; gap: var(--spacing-sm);">
                    ${stalledProjects.map(project => {
                        const projectTasks = this.tasks.filter(t => t.projectId === project.id && !t.completed);
                        return `
                            <div style="background: var(--bg-primary); padding: var(--spacing-sm); border-radius: var(--radius-sm); border-left: 3px solid var(--warning-color);">
                                <strong>${escapeHtml(project.title)}</strong>
                                <div style="font-size: 0.85rem; color: var(--text-secondary);">${projectTasks.length} pending tasks</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}
        `;
    }

    // ==================== WEEKLY REVIEW FUNCTIONALITY ====================

    setupWeeklyReview() {
        const weeklyReviewBtn = document.getElementById('btn-weekly-review');
        const closeWeeklyReviewBtn = document.getElementById('close-weekly-review-modal');

        if (weeklyReviewBtn) {
            weeklyReviewBtn.addEventListener('click', () => {
                this.showWeeklyReview();
            });
        }

        if (closeWeeklyReviewBtn) {
            closeWeeklyReviewBtn.addEventListener('click', () => {
                this.closeWeeklyReview();
            });
        }
    }

    showWeeklyReview() {
        const modal = document.getElementById('weekly-review-modal');
        if (!modal) return;

        modal.style.display = 'block';
        this.renderWeeklyReview();
    }

    closeWeeklyReview() {
        const modal = document.getElementById('weekly-review-modal');
        if (modal) modal.style.display = 'none';
    }

    renderWeeklyReview() {
        const weeklyReviewContent = document.getElementById('weekly-review-content');
        if (!weeklyReviewContent) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Gather review data
        const completedThisWeek = this.tasks.filter(t =>
            t.completed && t.completedAt && new Date(t.completedAt) >= weekAgo
        );

        const incompleteTasks = this.tasks.filter(t => !t.completed && t.status !== 'someday' && t.status !== 'reference');

        const overdueTasks = incompleteTasks.filter(t => t.isOverdue());

        const dueThisWeek = incompleteTasks.filter(t => {
            if (!t.dueDate) return false;
            const dueDate = new Date(t.dueDate);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            return dueDate >= today && dueDate <= nextWeek;
        });

        const waitingTasks = this.tasks.filter(t => t.status === 'waiting' && !t.completed);

        const somedayTasks = this.tasks.filter(t => t.status === 'someday' && !t.completed);

        const staleProjects = this.projects.filter(p => {
            if (p.status !== 'active') return false;
            const projectTasks = this.tasks.filter(t => t.projectId === p.id && !t.completed);
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return projectTasks.length > 0 && projectTasks.every(t => new Date(t.updatedAt) < thirtyDaysAgo);
        });

        // Render weekly review
        weeklyReviewContent.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
                    <h3 style="margin-top: 0;">📅 Weekly Review Checklist</h3>
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">
                        Complete this review to get clear and current. Follow the GTD weekly review process.
                    </p>

                    <div style="display: grid; gap: var(--spacing-sm);">
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Get clear: Empty your head - put all uncaptured ideas, thoughts, and tasks in Inbox</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review <strong>${completedThisWeek.length} completed tasks</strong> from last week</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review your calendar for upcoming commitments</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review your projects and project lists</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review <strong>${waitingTasks.length} Waiting For</strong> items</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Review <strong>${somedayTasks.length} Someday/Maybe</strong> items - activate any that are now relevant</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;">
                            <input type="checkbox" class="weekly-review-checkbox">
                            <span>Be creative and courageous: Any new, fun, exciting projects?</span>
                        </label>
                    </div>
                </div>

                ${overdueTasks.length > 0 ? `
                <div style="background: #fef5e7; padding: var(--spacing-md); border-radius: var(--radius-md); border-left: 4px solid var(--warning-color); margin-bottom: var(--spacing-md);">
                    <h4 style="margin: 0 0 var(--spacing-sm) 0; color: var(--warning-color);">
                        <i class="fas fa-exclamation-triangle"></i> ${overdueTasks.length} Overdue Tasks
                    </h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${overdueTasks.slice(0, 10).map(task => `
                            <div style="padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.1);">
                                <strong>${escapeHtml(task.title)}</strong>
                                ${task.dueDate ? `<span style="color: var(--danger-color); font-size: 0.85rem;"> Due: ${task.dueDate}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${dueThisWeek.length > 0 ? `
                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: var(--spacing-md);">
                    <h4 style="margin: 0 0 var(--spacing-sm) 0;">
                        <i class="fas fa-calendar-day"></i> ${dueThisWeek.length} Tasks Due This Week
                    </h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${dueThisWeek.map(task => `
                            <div style="padding: 4px 0; border-bottom: 1px solid var(--border-color);">
                                <strong>${escapeHtml(task.title)}</strong>
                                ${task.dueDate ? `<span style="color: var(--text-secondary); font-size: 0.85rem;"> Due: ${task.dueDate}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${staleProjects.length > 0 ? `
                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: var(--spacing-md);">
                    <h4 style="margin: 0 0 var(--spacing-sm) 0; color: var(--text-secondary);">
                        <i class="fas fa-pause-circle"></i> ${staleProjects.length} Stalled Projects (consider activating or completing)
                    </h4>
                    ${staleProjects.map(project => `
                        <div style="padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-top: var(--spacing-xs);">
                            <strong>${escapeHtml(project.title)}</strong>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0;">${this.tasks.filter(t => t.projectId === project.id && !t.completed).length} tasks remaining</p>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h4 style="margin: 0 0 var(--spacing-sm) 0;">
                        <i class="fas fa-broom"></i> Cleanup Actions
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                        <button class="btn btn-secondary" onclick="app.cleanupEmptyProjects()">
                            <i class="fas fa-trash"></i> Delete empty projects
                        </button>
                        <button class="btn btn-secondary" onclick="app.cleanupOldCompletedTasks()">
                            <i class="fas fa-broom"></i> Archive tasks completed > 90 days ago
                        </button>
                        <button class="btn btn-secondary" onclick="app.markStaleProjectsSomeday()">
                            <i class="fas fa-pause"></i> Move stale projects to Someday
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async cleanupEmptyProjects() {
        const emptyProjects = this.projects.filter(p => {
            const projectTasks = this.tasks.filter(t => t.projectId === p.id);
            return projectTasks.length === 0;
        });

        if (emptyProjects.length === 0) {
            alert('No empty projects to clean up.');
            return;
        }

        if (!confirm(`Delete ${emptyProjects.length} empty projects?`)) return;

        this.projects = this.projects.filter(p => !emptyProjects.includes(p));
        await this.saveProjects();
        this.renderWeeklyReview();
        this.renderProjectsDropdown();
        alert(`Cleaned up ${emptyProjects.length} empty projects.`);
    }

    async cleanupOldCompletedTasks() {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const oldCompletedTasks = this.tasks.filter(t =>
            t.completed && t.completedAt && new Date(t.completedAt) < ninetyDaysAgo
        );

        if (oldCompletedTasks.length === 0) {
            alert('No old completed tasks to archive.');
            return;
        }

        if (!confirm(`Archive ${oldCompletedTasks.length} tasks completed more than 90 days ago?`)) return;

        // Create an export of these tasks before deleting
        const archiveData = {
            archivedAt: new Date().toISOString(),
            tasks: oldCompletedTasks.map(t => t.toJSON())
        };

        const dataStr = JSON.stringify(archiveData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `gtd-archive-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Remove from active tasks
        this.tasks = this.tasks.filter(t => !oldCompletedTasks.includes(t));
        await this.saveTasks();
        this.renderWeeklyReview();
        this.renderView();
        this.updateCounts();
        alert(`Archived ${oldCompletedTasks.length} old completed tasks.`);
    }

    async markStaleProjectsSomeday() {
        const staleProjects = this.projects.filter(p => {
            if (p.status !== 'active') return false;
            const projectTasks = this.tasks.filter(t => t.projectId === p.id && !t.completed);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return projectTasks.length > 0 && projectTasks.every(t => new Date(t.updatedAt) < thirtyDaysAgo);
        });

        if (staleProjects.length === 0) {
            alert('No stale projects to move.');
            return;
        }

        if (!confirm(`Move ${staleProjects.length} stale projects to Someday/Maybe?`)) return;

        staleProjects.forEach(p => p.status = 'someday');
        await this.saveProjects();
        this.renderWeeklyReview();
        this.renderProjectsDropdown();
        alert(`Moved ${staleProjects.length} projects to Someday/Maybe.`);
    }

    // ==================== TIME TRACKING FUNCTIONALITY ====================

    setupTimeTracking() {
        // Time tracking is handled per-task in the task element creation
        // This method is for global time tracking setup
    }

    startTaskTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Stop any existing timer
        if (this.activeTimers.has(taskId)) {
            this.stopTaskTimer(taskId);
        }

        // Start new timer
        this.activeTimers.set(taskId, {
            startTime: Date.now(),
            taskId: taskId
        });

        // Update UI
        this.renderView();
    }

    stopTaskTimer(taskId) {
        const timer = this.activeTimers.get(taskId);
        if (!timer) return;

        const elapsed = Math.round((Date.now() - timer.startTime) / 1000 / 60); // Convert to minutes
        this.activeTimers.delete(taskId);

        // Add to task's time spent
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.timeSpent = (task.timeSpent || 0) + elapsed;
            this.saveTasks();
        }

        this.renderView();
    }

    // ==================== DARK MODE ====================

    initializeDarkMode() {
        // Check for saved preference or system preference
        const savedMode = localStorage.getItem('gtd_dark_mode');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedMode === 'true' || (!savedMode && systemPrefersDark)) {
            document.body.classList.add('dark-mode');
        }

        // Update button icon
        this.updateDarkModeButton();
    }

    setupDarkMode() {
        const darkModeBtn = document.getElementById('btn-dark-mode');
        if (!darkModeBtn) return;

        darkModeBtn.addEventListener('click', () => {
            this.toggleDarkMode();
        });
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('gtd_dark_mode', isDarkMode);
        this.updateDarkModeButton();
    }

    updateDarkModeButton() {
        const darkModeBtn = document.getElementById('btn-dark-mode');
        if (!darkModeBtn) return;

        const isDarkMode = document.body.classList.contains('dark-mode');
        darkModeBtn.innerHTML = isDarkMode
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    }

    // ==================== CALENDAR VIEW ====================

    setupCalendarView() {
        const calendarBtn = document.getElementById('btn-calendar-view');
        const closeCalendarBtn = document.getElementById('close-calendar-modal');

        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => {
                this.showCalendar();
            });
        }

        if (closeCalendarBtn) {
            closeCalendarBtn.addEventListener('click', () => {
                this.closeCalendar();
            });
        }
    }

    showCalendar() {
        const modal = document.getElementById('calendar-modal');
        if (!modal) return;

        modal.style.display = 'block';
        this.renderCalendar();
    }

    closeCalendar() {
        const modal = document.getElementById('calendar-modal');
        if (modal) modal.style.display = 'none';
    }

    renderCalendar() {
        const calendarContent = document.getElementById('calendar-content');
        if (!calendarContent) return;

        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

        // Month navigation
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];

        // Get tasks by due date for this month
        const tasksByDate = {};
        this.tasks.filter(t => !t.completed && t.dueDate).forEach(task => {
            const dueDate = new Date(task.dueDate);
            if (dueDate.getFullYear() === year && dueDate.getMonth() === month) {
                const day = dueDate.getDate();
                if (!tasksByDate[day]) tasksByDate[day] = [];
                tasksByDate[day].push(task);
            }
        });

        // Build calendar grid
        let calendarHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                <button class="btn btn-secondary" onclick="app.navigateCalendar(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 style="margin: 0;">${monthNames[month]} ${year}</h3>
                <button class="btn btn-secondary" onclick="app.navigateCalendar(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: var(--spacing-md);">
                <div style="text-align: center; font-weight: bold; color: var(--danger-color);">Sun</div>
                <div style="text-align: center; font-weight: bold;">Mon</div>
                <div style="text-align: center; font-weight: bold;">Tue</div>
                <div style="text-align: center; font-weight: bold;">Wed</div>
                <div style="text-align: center; font-weight: bold;">Thu</div>
                <div style="text-align: center; font-weight: bold;">Fri</div>
                <div style="text-align: center; font-weight: bold; color: var(--primary-color);">Sat</div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
        `;

        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div style="min-height: 80px; padding: 4px; background: var(--bg-secondary); border-radius: var(--radius-sm);"></div>';
        }

        // Days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const dateTasks = tasksByDate[day] || [];
            const isWeekend = (day + startingDayOfWeek - 1) % 7 === 0 || (day + startingDayOfWeek - 1) % 7 === 6;

            calendarHTML += `
                <div style="min-height: 80px; padding: 4px; background: var(--bg-primary); border: 1px solid ${isToday ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-sm); cursor: pointer;" onclick="app.showTasksForDate(${year}, ${month}, ${day})">
                    <div style="font-weight: ${isToday ? 'bold' : 'normal'}; color: ${isWeekend ? 'var(--text-secondary)' : 'var(--text-primary)'}; margin-bottom: 4px;">${day}</div>
                    <div style="font-size: 0.75rem;">
                        ${dateTasks.slice(0, 3).map(task => `
                            <div style="background: var(--accent-color); color: white; padding: 2px 4px; margin-bottom: 2px; border-radius: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</div>
                        `).join('')}
                        ${dateTasks.length > 3 ? `<div style="color: var(--text-secondary); font-size: 0.7rem;">+${dateTasks.length - 3} more</div>` : ''}
                    </div>
                </div>
            `;
        }

        calendarHTML += `
            </div>

            <div style="margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
                <h4>Tasks Due This Month</h4>
                <div style="max-height: 300px; overflow-y: auto; margin-top: var(--spacing-sm);">
                    ${this.getTasksForMonth(year, month)}
                </div>
            </div>
        `;

        calendarContent.innerHTML = calendarHTML;
    }

    navigateCalendar(direction) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    getTasksForMonth(year, month) {
        const tasksDue = this.tasks.filter(t => {
            if (!t.dueDate || t.completed) return false;
            const dueDate = new Date(t.dueDate);
            return dueDate.getFullYear() === year && dueDate.getMonth() === month;
        });

        if (tasksDue.length === 0) {
            return '<p style="color: var(--text-secondary);">No tasks due this month.</p>';
        }

        return tasksDue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(task => `
            <div style="padding: 8px; background: var(--bg-primary); border-radius: var(--radius-sm); margin-bottom: var(--spacing-xs); border-left: 3px solid var(--accent-color);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${escapeHtml(task.title)}</strong>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${task.dueDate}</div>
                    </div>
                    <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="event.stopPropagation(); app.openTaskModal(app.tasks.find(t => t.id === '${task.id}'))">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    showTasksForDate(year, month, day) {
        const tasks = this.tasks.filter(t => {
            if (!t.dueDate) return false;
            const dueDate = new Date(t.dueDate);
            return dueDate.getFullYear() === year && dueDate.getMonth() === month && dueDate.getDate() === day;
        });

        const dateStr = `${month + 1}/${day}/${year}`;
        alert(`Tasks due on ${dateStr}:\n\n${tasks.map(t => `- ${t.title}`).join('\n') || 'No tasks'}`);
    }

    // ==================== NEW PROJECT BUTTON ====================

    setupNewProjectButton() {
        const newProjectBtn = document.getElementById('btn-new-project');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                // Open task modal with type pre-selected as 'project'
                this.openTaskModal(null, null, { type: 'project' });
            });
        }
    }

    // ==================== FOCUS MODE ====================

    setupFocusMode() {
        const focusBtn = document.getElementById('btn-focus-mode');
        const exitFocusBtn = document.getElementById('btn-exit-focus');
        const pomodoroStartBtn = document.getElementById('btn-pomodoro-start');
        const pomodoroPauseBtn = document.getElementById('btn-pomodoro-pause');
        const pomodoroResetBtn = document.getElementById('btn-pomodoro-reset');

        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                this.enterFocusMode();
            });
        }

        if (exitFocusBtn) {
            exitFocusBtn.addEventListener('click', () => {
                this.exitFocusMode();
            });
        }

        if (pomodoroStartBtn) {
            pomodoroStartBtn.addEventListener('click', () => {
                this.startPomodoro();
            });
        }

        if (pomodoroPauseBtn) {
            pomodoroPauseBtn.addEventListener('click', () => {
                this.pausePomodoro();
            });
        }

        if (pomodoroResetBtn) {
            pomodoroResetBtn.addEventListener('click', () => {
                this.resetPomodoro();
            });
        }
    }

    enterFocusMode(taskId = null) {
        // Get suggested tasks if no task specified
        if (!taskId) {
            const suggestions = this.getSmartSuggestions({ maxSuggestions: 10 });
            if (suggestions.length === 0) {
                alert('No tasks available for focus mode. Create some tasks first!');
                return;
            }

            // Show task selector
            const taskOptions = suggestions.map((s, i) =>
                `${i + 1}. ${s.task.title} (${s.reasons.join(', ')})`
            ).join('\n');

            const selection = prompt(`Select a task to focus on:\n\n${taskOptions}\n\nEnter task number:`);
            if (!selection) return;

            const taskIndex = parseInt(selection) - 1;
            if (taskIndex >= 0 && taskIndex < suggestions.length) {
                taskId = suggestions[taskIndex].task.id;
            } else {
                alert('Invalid selection');
                return;
            }
        }

        this.focusTaskId = taskId;
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Show focus overlay
        const focusOverlay = document.getElementById('focus-mode-overlay');
        if (focusOverlay) {
            focusOverlay.style.display = 'flex';
        }

        this.renderFocusTask(task);
    }

    renderFocusTask(task) {
        const container = document.getElementById('focus-task-container');
        if (!container) return;

        container.innerHTML = `
            <h1 style="font-size: 2.5rem; margin-bottom: var(--spacing-lg); text-align: center;">${escapeHtml(task.title)}</h1>
            <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); max-width: 600px; width: 100%; margin-bottom: var(--spacing-lg);">
                ${task.description ? `<p style="margin-bottom: var(--spacing-md);">${escapeHtml(task.description)}</p>` : ''}
                <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-bottom: var(--spacing-sm);">
                    ${task.contexts ? task.contexts.map(c => `<span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px;">${escapeHtml(c)}</span>`).join('') : ''}
                    ${task.energy ? `<span style="background: var(--warning-color); color: white; padding: 4px 8px; border-radius: 12px;"><i class="fas fa-bolt"></i> ${task.energy}</span>` : ''}
                    ${task.time ? `<span style="background: var(--info-color); color: white; padding: 4px 8px; border-radius: 12px;"><i class="fas fa-clock"></i> ${task.time}m</span>` : ''}
                </div>
                ${task.dueDate ? `<p style="color: var(--text-secondary);"><i class="fas fa-calendar-day"></i> Due: ${task.dueDate}</p>` : ''}
            </div>

            ${task.subtasks && task.subtasks.length > 0 ? `
                <div style="max-width: 600px; width: 100%; margin-bottom: var(--spacing-lg);">
                    <h3>Subtasks</h3>
                    <div style="background: var(--bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-md);">
                        ${task.subtasks.map((subtask, index) => `
                            <label style="display: flex; align-items: center; gap: var(--spacing-sm); padding: 8px 0; cursor: pointer;">
                                <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="app.toggleSubtaskFromFocus('${task.id}', ${index})">
                                <span style="${subtask.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(subtask.title)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${task.notes ? `
                <div style="max-width: 600px; width: 100%; margin-bottom: var(--spacing-lg);">
                    <h3>Notes</h3>
                    <div style="background: var(--bg-secondary); padding: var(--spacing-md); border-radius: var(--radius-md); white-space: pre-wrap;">${escapeHtml(task.notes)}</div>
                </div>
            ` : ''}

            <div style="display: flex; gap: var(--spacing-sm);">
                <button class="btn btn-success" onclick="app.completeTaskAndExitFocus('${task.id}')">
                    <i class="fas fa-check"></i> Complete Task
                </button>
                <button class="btn btn-primary" onclick="app.editTaskFromFocus('${task.id}')">
                    <i class="fas fa-edit"></i> Edit Task
                </button>
            </div>
        `;
    }

    exitFocusMode() {
        this.pausePomodoro();
        const focusOverlay = document.getElementById('focus-mode-overlay');
        if (focusOverlay) {
            focusOverlay.style.display = 'none';
        }
        this.focusTaskId = null;
        this.renderView();
    }

    toggleSubtaskFromFocus(taskId, subtaskIndex) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.subtasks && task.subtasks[subtaskIndex]) {
            task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
            this.saveTasks();
            this.renderFocusTask(task);
        }
    }

    async completeTaskAndExitFocus(taskId) {
        await this.toggleTaskComplete(taskId);
        this.exitFocusMode();
    }

    editTaskFromFocus(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.exitFocusMode();
            this.openTaskModal(task);
        }
    }

    // ==================== POMODORO TIMER ====================

    startPomodoro() {
        if (this.pomodoroIsRunning) return;

        this.pomodoroIsRunning = true;
        this.updatePomodoroButtons();

        this.pomodoroTimer = setInterval(() => {
            if (this.pomodoroTimeLeft > 0) {
                this.pomodoroTimeLeft--;
                this.updatePomodoroDisplay();
            } else {
                this.pomodoroComplete();
            }
        }, 1000);
    }

    pausePomodoro() {
        if (!this.pomodoroIsRunning) return;

        this.pomodoroIsRunning = false;
        if (this.pomodoroTimer) {
            clearInterval(this.pomodoroTimer);
            this.pomodoroTimer = null;
        }
        this.updatePomodoroButtons();
    }

    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroIsBreak = false;
        this.pomodoroTimeLeft = 25 * 60;
        this.updatePomodoroDisplay();
    }

    pomodoroComplete() {
        this.pausePomodoro();

        if (this.pomodoroIsBreak) {
            alert('Break complete! Ready to focus again?');
            this.pomodoroIsBreak = false;
            this.pomodoroTimeLeft = 25 * 60;
        } else {
            const shouldTakeBreak = confirm('Pomodoro complete! Take a 5-minute break?');
            if (shouldTakeBreak) {
                this.pomodoroIsBreak = true;
                this.pomodoroTimeLeft = 5 * 60;
                this.startPomodoro();
            } else {
                this.pomodoroTimeLeft = 25 * 60;
            }
        }

        this.updatePomodoroDisplay();
    }

    updatePomodoroDisplay() {
        const timerDisplay = document.getElementById('pomodoro-timer');
        if (!timerDisplay) return;

        const minutes = Math.floor(this.pomodoroTimeLeft / 60);
        const seconds = this.pomodoroTimeLeft % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Update document title
        document.title = `${timerDisplay.textContent} - ${this.pomodoroIsBreak ? 'Break' : 'Focus'}`;
    }

    updatePomodoroButtons() {
        const startBtn = document.getElementById('btn-pomodoro-start');
        const pauseBtn = document.getElementById('btn-pomodoro-pause');

        if (startBtn) startBtn.style.display = this.pomodoroIsRunning ? 'none' : 'inline-block';
        if (pauseBtn) pauseBtn.style.display = this.pomodoroIsRunning ? 'inline-block' : 'none';
    }

    // ==================== SUBTASKS MANAGEMENT ====================

    renderSubtasksInModal(subtasks) {
        const container = document.getElementById('subtasks-container');
        if (!container) return;

        if (!subtasks || subtasks.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: var(--spacing-sm);">No subtasks yet. Add subtasks to break down this task into smaller steps.</p>';
            return;
        }

        container.innerHTML = subtasks.map((subtask, index) => `
            <div data-subtask-index="${index}" style="display: flex; align-items: center; gap: var(--spacing-sm); padding: 6px 0; border-bottom: 1px solid var(--bg-secondary);">
                <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="app.toggleSubtaskCompletion(${index})" style="margin-right: 4px;">
                <span style="flex: 1; ${subtask.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(subtask.title)}</span>
                <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 2px 6px;" onclick="app.removeSubtask(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    addSubtask() {
        const input = document.getElementById('new-subtask-input');
        const title = input.value.trim();

        if (!title) return;

        const container = document.getElementById('subtasks-container');
        const currentSubtasks = this.getSubtasksFromModal();

        currentSubtasks.push({
            title: title,
            completed: false
        });

        this.renderSubtasksInModal(currentSubtasks);
        input.value = '';
    }

    removeSubtask(index) {
        const currentSubtasks = this.getSubtasksFromModal();
        currentSubtasks.splice(index, 1);
        this.renderSubtasksInModal(currentSubtasks);
    }

    toggleSubtaskCompletion(index) {
        const currentSubtasks = this.getSubtasksFromModal();
        if (currentSubtasks[index]) {
            currentSubtasks[index].completed = !currentSubtasks[index].completed;
            this.renderSubtasksInModal(currentSubtasks);
        }
    }

    getSubtasksFromModal() {
        const container = document.getElementById('subtasks-container');
        if (!container) return [];

        const subtaskElements = container.querySelectorAll('div[data-subtask-index]');
        const subtasks = [];

        subtaskElements.forEach(el => {
            const index = parseInt(el.dataset.subtaskIndex);
            const checkbox = el.querySelector('input[type="checkbox"]');
            const span = el.querySelector('span');
            if (span) {
                subtasks[index] = {
                    title: span.textContent,
                    completed: checkbox.checked
                };
            }
        });

        return subtasks;
    }

    // ==================== MODAL HELPERS ====================

    setupCustomTagHandler() {
        // Get or create custom tags from localStorage
        const getCustomContexts = () => {
            const tags = localStorage.getItem('gtd_custom_contexts');
            return tags ? JSON.parse(tags) : [];
        };

        const defaultContexts = this.defaultContexts;

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

    // Usage Stats for Smart Defaults
    loadUsageStats() {
        const stats = localStorage.getItem('gtd_usage_stats');
        return stats ? JSON.parse(stats) : { contexts: {}, times: {}, totalTasks: 0 };
    }

    saveUsageStats() {
        localStorage.setItem('gtd_usage_stats', JSON.stringify(this.usageStats));
    }

    trackTaskUsage(task) {
        // Track context usage
        if (task.contexts && task.contexts.length > 0) {
            task.contexts.forEach(context => {
                if (!this.usageStats.contexts[context]) {
                    this.usageStats.contexts[context] = 0;
                }
                this.usageStats.contexts[context]++;
            });
        }

        // Track time estimate usage (round to nearest 5 minutes)
        if (task.time && task.time > 0) {
            const roundedTime = Math.round(task.time / 5) * 5;
            if (!this.usageStats.times[roundedTime]) {
                this.usageStats.times[roundedTime] = 0;
            }
            this.usageStats.times[roundedTime]++;
        }

        this.usageStats.totalTasks++;
        this.saveUsageStats();
    }

    getMostFrequentContext() {
        let maxCount = 0;
        let mostFrequent = '';

        for (const [context, count] of Object.entries(this.usageStats.contexts)) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = context;
            }
        }

        return mostFrequent;
    }

    getMostFrequentTime() {
        let maxCount = 0;
        let mostFrequent = 0;

        for (const [time, count] of Object.entries(this.usageStats.times)) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = parseInt(time);
            }
        }

        return mostFrequent;
    }

    getSmartDefaults() {
        const context = this.getMostFrequentContext();
        const time = this.getMostFrequentTime();

        return {
            context: context && this.usageStats.contexts[context] >= 3 ? context : '',
            time: time && this.usageStats.times[time] >= 3 ? time : 0,
            hasEnoughData: this.usageStats.totalTasks >= 5
        };
    }

    /**
     * Render default context buttons dynamically
     * Keeps all context buttons in sync with the single source of truth
     */
    renderDefaultContextButtons() {
        // Render in quick-add section
        const quickContextsContainer = document.querySelector('.quick-contexts');
        if (quickContextsContainer) {
            // Get existing buttons to preserve them
            const existingButtons = quickContextsContainer.querySelectorAll('.quick-context');
            const createContextBtn = quickContextsContainer.querySelector('.btn-create-context');

            // Remove old default context buttons (but keep custom ones and create button)
            existingButtons.forEach(btn => {
                if (this.defaultContexts.includes(btn.dataset.context)) {
                    btn.remove();
                }
            });

            // Insert default context buttons before the create button
            this.defaultContexts.forEach(context => {
                const btn = document.createElement('button');
                btn.className = 'quick-context';
                btn.dataset.context = context;
                btn.textContent = context;
                btn.addEventListener('click', () => {
                    const quickAddInput = document.getElementById('quick-add-input');
                    if (quickAddInput.value) {
                        quickAddInput.value += ` ${context}`;
                    } else {
                        quickAddInput.value = context;
                    }
                    quickAddInput.focus();
                });
                quickContextsContainer.insertBefore(btn, createContextBtn);
            });
        }

        // Render in task modal
        const modalContextsContainer = document.querySelector('.quick-contexts-modal');
        if (modalContextsContainer) {
            modalContextsContainer.innerHTML = '';
            this.defaultContexts.forEach(context => {
                const btn = document.createElement('button');
                btn.className = 'quick-context-modal';
                btn.dataset.context = context;
                btn.textContent = context;
                btn.addEventListener('click', () => {
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
                modalContextsContainer.appendChild(btn);
            });
        }
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

        // Update bulk select button visibility after rendering
        this.updateBulkSelectButtonVisibility();
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

        // Apply search and advanced filters
        filteredTasks = this.filterTasksBySearch(filteredTasks);

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

        // Check if bulk selection mode is active
        const isBulkSelectMode = this.bulkSelectionMode;
        const isBulkSelected = this.selectedTaskIds.has(task.id);

        div.innerHTML = `
            ${dragHandle.outerHTML}
            ${isBulkSelectMode
                ? `<input type="checkbox" class="bulk-select-checkbox" ${isBulkSelected ? 'checked' : ''}>`
                : `<input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>`
            }
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${task.contexts && task.contexts.map(context => `<span class="task-context">${escapeHtml(context)}</span>`).join('')}
                    ${recurrenceDisplay}
                    ${task.energy ? `<span class="task-energy"><i class="fas fa-bolt"></i> ${task.energy}</span>` : ''}
                    ${task.time ? `<span class="task-time"><i class="fas fa-clock"></i> ${task.time}m</span>` : ''}
                    ${task.timeSpent ? `<span class="task-time-spent" title="Time spent"><i class="fas fa-stopwatch"></i> ${task.timeSpent}m</span>` : ''}
                    ${dueDateDisplay}
                    ${deferDateDisplay}
                    ${waitingForDisplay}
                    ${task.projectId ? `<span class="task-project">${this.getProjectTitle(task.projectId)}</span>` : ''}
                </div>
                ${task.subtasks && task.subtasks.length > 0 ? `
                    <div class="task-subtasks" style="margin-top: var(--spacing-xs);">
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
                            <i class="fas fa-tasks"></i> ${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} subtasks
                        </div>
                        ${task.subtasks.filter(s => !s.completed).slice(0, 3).map(subtask => `
                            <div style="font-size: 0.75rem; color: var(--text-secondary); padding-left: 12px;">
                                <i class="fas fa-square" style="color: var(--border-color);"></i> ${escapeHtml(subtask.title)}
                            </div>
                        `).join('')}
                        ${task.subtasks.filter(s => !s.completed).length > 3 ? `<div style="font-size: 0.75rem; color: var(--text-secondary); padding-left: 12px;">+${task.subtasks.filter(s => !s.completed).length - 3} more</div>` : ''}
                    </div>
                ` : ''}
            </div>
            <div class="task-actions">
                ${this.activeTimers.has(task.id)
                    ? `<button class="task-action-btn timer-active" title="Stop timer">
                        <i class="fas fa-stop"></i>
                       </button>`
                    : `<button class="task-action-btn timer" title="Start timer">
                        <i class="fas fa-play"></i>
                       </button>`
                }
                <button class="task-action-btn notes" title="Notes" ${task.notes ? 'style="color: var(--info-color);"' : ''}>
                    <i class="fas fa-sticky-note"></i>
                </button>
                <button class="task-action-btn duplicate" title="Duplicate">
                    <i class="fas fa-copy"></i>
                </button>
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
        const checkbox = div.querySelector('.task-checkbox, .bulk-select-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (this.bulkSelectionMode) {
                    this.toggleBulkTaskSelection(task.id);
                } else {
                    this.toggleTaskComplete(task.id);
                }
            });
        }

        // Timer buttons
        const timerBtn = div.querySelector('.task-action-btn.timer, .task-action-btn.timer-active');
        if (timerBtn) {
            timerBtn.addEventListener('click', () => {
                if (this.activeTimers.has(task.id)) {
                    this.stopTaskTimer(task.id);
                } else {
                    this.startTaskTimer(task.id);
                }
            });
        }

        const notesBtn = div.querySelector('.task-action-btn.notes');
        if (notesBtn) {
            notesBtn.addEventListener('click', () => {
                const notes = task.notes || 'No notes';
                alert(`${task.title}\n\nNotes:\n${notes}`);
            });
        }

        const editBtn = div.querySelector('.task-action-btn.edit');
        editBtn.addEventListener('click', () => this.openTaskModal(task));

        const duplicateBtn = div.querySelector('.task-action-btn.duplicate');
        duplicateBtn.addEventListener('click', () => this.duplicateTask(task.id));

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
        // Use natural language parser to extract task properties
        const parsed = this.parser.parse(title);

        const task = new Task({
            title: parsed.title || title,
            status: this.currentView === 'all' ? 'inbox' : this.currentView,
            type: 'task',
            contexts: parsed.contexts,
            energy: parsed.energy,
            time: parsed.time,
            dueDate: parsed.dueDate,
            recurrence: parsed.recurrence
        });

        this.tasks.push(task);
        await this.saveTasks();

        // Track usage for smart defaults
        this.trackTaskUsage(task);

        this.renderView();
        this.updateCounts();
        this.updateContextFilter();
    }

    /**
     * Duplicate a task with a new ID
     */
    async duplicateTask(taskId) {
        const originalTask = this.tasks.find(t => t.id === taskId);
        if (!originalTask) return;

        const duplicatedData = {
            ...originalTask.toJSON(),
            title: `${originalTask.title} (copy)`,
            completed: false,
            completedAt: null
        };

        const duplicateTask = new Task(duplicatedData);
        this.tasks.push(duplicateTask);
        await this.saveTasks();
        this.renderView();
        this.updateCounts();
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

    openTaskModal(task = null, defaultProjectId = null, defaultData = {}) {
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
            document.getElementById('task-notes').value = task.notes || '';
            this.renderSubtasksInModal(task.subtasks || []);
        } else {
            title.textContent = 'Add Task';
            document.getElementById('task-id').value = '';
            document.getElementById('task-status').value = this.currentView === 'all' ? 'inbox' : this.currentView;
            document.getElementById('task-waiting-for-description').value = '';
            document.getElementById('task-recurrence').value = '';
            document.getElementById('task-recurrence-end-date').value = '';
            document.getElementById('task-notes').value = '';
            this.renderSubtasksInModal([]);
            document.getElementById('task-contexts').value = '';

            // Set default data if provided
            if (defaultData.type) {
                document.getElementById('task-type').value = defaultData.type;
                // Update modal title based on type
                if (defaultData.type === 'project') {
                    title.textContent = 'Add Project';
                } else if (defaultData.type === 'reference') {
                    title.textContent = 'Add Reference';
                }
            }

            // Set default project if provided (when adding from project view)
            if (defaultProjectId) {
                document.getElementById('task-project').value = defaultProjectId;
            }
        }

        // Setup subtask add button
        const addSubtaskBtn = document.getElementById('btn-add-subtask');
        const newSubtaskInput = document.getElementById('new-subtask-input');
        if (addSubtaskBtn && newSubtaskInput) {
            addSubtaskBtn.onclick = () => this.addSubtask();
            newSubtaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addSubtask();
                }
            });
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

        const newType = document.getElementById('task-type').value;

        if (taskId) {
            // Update existing item - check both tasks and projects arrays
            const existingTask = this.tasks.find(t => t.id === taskId);
            const existingProject = this.projects.find(p => p.id === taskId);
            const existingItem = existingTask || existingProject;
            const oldType = existingTask ? 'task' : (existingProject ? 'project' : null);

            if (existingItem) {
                // Check if type is changing
                if (oldType !== newType) {
                    // Type conversion: task <-> project
                    if (newType === 'project' && oldType === 'task') {
                        // Convert task to project
                        const projectData = {
                            id: taskId,
                            title: document.getElementById('task-title').value,
                            description: document.getElementById('task-description').value,
                            status: status === 'inbox' ? 'active' : status,
                            contexts: tags,
                            position: existingItem.position || 0
                        };

                        // Remove from tasks array
                        this.tasks = this.tasks.filter(t => t.id !== taskId);

                        // Add to projects array
                        const project = new Project(projectData);
                        this.projects.push(project);

                        await this.saveTasks();
                        await this.saveProjects();
                        this.closeTaskModal();
                        this.renderView();
                        this.updateCounts();
                        this.updateContextFilter();
                        this.renderProjectsDropdown();
                        return;
                    } else if (newType === 'task' && oldType === 'project') {
                        // Convert project to task
                        const taskData = {
                            id: taskId,
                            title: document.getElementById('task-title').value,
                            description: document.getElementById('task-description').value,
                            type: 'task',
                            status: status === 'active' ? 'next' : status,
                            energy: document.getElementById('task-energy').value,
                            time: parseInt(document.getElementById('task-time').value) || 0,
                            projectId: projectId,
                            contexts: tags,
                            dueDate: document.getElementById('task-due-date').value || null,
                            deferDate: document.getElementById('task-defer-date').value || null,
                            waitingForDescription: waitingForDescription,
                            waitingForTaskIds: waitingForTaskIds,
                            recurrence: document.getElementById('task-recurrence').value || '',
                            recurrenceEndDate: document.getElementById('task-recurrence-end-date').value || null,
                            notes: document.getElementById('task-notes').value || '',
                            subtasks: this.getSubtasksFromModal()
                        };

                        // Remove from projects array
                        this.projects = this.projects.filter(p => p.id !== taskId);

                        // Add to tasks array
                        const task = new Task(taskData);
                        this.tasks.push(task);

                        await this.saveTasks();
                        await this.saveProjects();
                        this.closeTaskModal();
                        this.renderView();
                        this.updateCounts();
                        this.updateContextFilter();
                        this.renderProjectsDropdown();
                        return;
                    }
                }

                // No type change or unsupported conversion - just update
                if (existingTask) {
                    const taskData = {
                        title: document.getElementById('task-title').value,
                        description: document.getElementById('task-description').value,
                        type: newType,
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
                        recurrenceEndDate: document.getElementById('task-recurrence-end-date').value || null,
                        notes: document.getElementById('task-notes').value || '',
                        subtasks: this.getSubtasksFromModal()
                    };
                    Object.assign(existingTask, taskData);
                    existingTask.updatedAt = new Date().toISOString();
                } else if (existingProject) {
                    const projectData = {
                        title: document.getElementById('task-title').value,
                        description: document.getElementById('task-description').value,
                        status: status === 'inbox' ? 'active' : status,
                        contexts: tags
                    };
                    Object.assign(existingProject, projectData);
                    existingProject.updatedAt = new Date().toISOString();
                }
            }
        } else {
            // Create new item
            if (newType === 'project') {
                // Creating a new project directly
                const projectData = {
                    title: document.getElementById('task-title').value,
                    description: document.getElementById('task-description').value,
                    status: status === 'inbox' ? 'active' : status,
                    contexts: tags
                };
                const project = new Project(projectData);
                this.projects.push(project);
                await this.saveProjects();
            } else {
                // Creating a new task or reference
                const taskData = {
                    title: document.getElementById('task-title').value,
                    description: document.getElementById('task-description').value,
                    type: newType,
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
                    recurrenceEndDate: document.getElementById('task-recurrence-end-date').value || null,
                    notes: document.getElementById('task-notes').value || '',
                    subtasks: this.getSubtasksFromModal()
                };
                const task = new Task(taskData);
                this.tasks.push(task);
                await this.saveTasks();

                // Track usage for smart defaults
                this.trackTaskUsage(task);
            }
        }

        // If we created a new project or edited an existing one, save projects
        if (newType === 'project' && !taskId) {
            await this.saveProjects();
        }

        this.closeTaskModal();
        this.renderView();
        this.updateCounts();
        this.updateContextFilter();
        if (newType === 'project') {
            this.renderProjectsDropdown();
        }
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
        const defaultContexts = this.defaultContexts;
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

    /**
     * Get smart task suggestions based on current context and situation
     * @param {Object} preferences - User's current situation
     * @returns {Array} - Suggested tasks with reasons
     */
    getSmartSuggestions(preferences = {}) {
        const {
            context = '',
            availableMinutes = null,
            energyLevel = '',
            maxSuggestions = 5
        } = preferences;

        // Get all actionable tasks (not completed, not deferred)
        let candidateTasks = this.tasks.filter(task => {
            if (task.completed) return false;
            if (task.type === 'reference') return false;
            if (task.status === 'someday') return false;
            if (task.status === 'completed') return false;
            if (!task.isAvailable()) return false; // Deferred tasks

            // Skip tasks with unmet dependencies
            if (!task.areDependenciesMet(this.tasks)) return false;

            // Filter by current view context
            if (this.currentView !== 'all' && this.currentView !== 'inbox') {
                if (this.currentView === 'next' && task.status !== 'next') return false;
                if (this.currentView === 'waiting' && task.status !== 'waiting') return false;
            }

            return true;
        });

        // Score each task based on multiple factors
        const scoredTasks = candidateTasks.map(task => {
            let score = 0;
            const reasons = [];

            // Factor 1: Overdue tasks (highest priority)
            if (task.isOverdue()) {
                score += 100;
                reasons.push('Overdue');
            }

            // Factor 2: Due today or soon
            if (task.isDueToday()) {
                score += 75;
                reasons.push('Due today');
            } else if (task.isDueWithin(3)) {
                score += 50;
                reasons.push(`Due in ${this.getDaysUntilDue(task)} days`);
            }

            // Factor 3: Context match
            if (context && task.contexts && task.contexts.includes(context)) {
                score += 60;
                reasons.push(`Matches current context (${context})`);
            }

            // Factor 4: Energy level match
            if (energyLevel && task.energy === energyLevel) {
                score += 40;
                reasons.push(`Matches your energy level (${energyLevel})`);
            }

            // Factor 5: Time available match
            if (availableMinutes && task.time) {
                if (task.time <= availableMinutes) {
                    score += 35;
                    reasons.push(`Fits your available time (${task.time}m)`);
                } else if (task.time > availableMinutes * 1.5) {
                    score -= 30; // Penalty for tasks too long
                    reasons.push(`Too long for available time (${task.time}m)`);
                }
            } else if (!availableMinutes && task.time && task.time <= 15) {
                score += 20;
                reasons.push('Quick task');
            }

            // Factor 6: Next Actions get priority
            if (task.status === 'next') {
                score += 25;
                reasons.push('Next Action');
            }

            // Factor 7: Quick tasks get slight boost
            if (task.time && task.time <= 5) {
                score += 15;
            }

            // Factor 8: Project urgency (projects due soon get priority)
            if (task.projectId) {
                const project = this.projects.find(p => p.id === task.projectId);
                if (project && project.status === 'active') {
                    score += 10;
                    reasons.push('Active project');
                }
            }

            // Factor 9: Waiting tasks get lower priority unless dependencies met
            if (task.status === 'waiting') {
                score -= 20;
                if (!reasons.includes('Dependencies met')) {
                    reasons.push('Waiting for something');
                }
            }

            // Factor 10: Tasks with descriptions are more defined
            if (task.description && task.description.trim().length > 10) {
                score += 5;
            }

            return { task, score, reasons };
        });

        // Sort by score (highest first) and limit results
        scoredTasks.sort((a, b) => b.score - a.score);

        // Return top suggestions
        return scoredTasks.slice(0, maxSuggestions);
    }

    /**
     * Get days until due date
     */
    getDaysUntilDue(task) {
        if (!task.dueDate) return null;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Show suggestion modal with smart recommendations
     */
    showSuggestions() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'suggestions-modal';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3><i class="fas fa-lightbulb" style="color: var(--warning-color);"></i> What Should I Work On?</h3>
                    <button class="close-button" onclick="document.getElementById('suggestions-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="padding: var(--spacing-lg);">
                    <div id="suggestions-filters" style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem;">Your Current Situation:</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md);">
                            <div>
                                <label style="font-size: 0.875rem; font-weight: 500; display: block; margin-bottom: var(--spacing-xs);">Where are you?</label>
                                <select id="suggestion-context" class="filter-select" style="width: 100%;">
                                    <option value="">Anywhere</option>
                                    <option value="@home">@home</option>
                                    <option value="@work">@work</option>
                                    <option value="@computer">@computer</option>
                                    <option value="@phone">@phone</option>
                                    <option value="@personal">@personal</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 0.875rem; font-weight: 500; display: block; margin-bottom: var(--spacing-xs);">How much time?</label>
                                <select id="suggestion-time" class="filter-select" style="width: 100%;">
                                    <option value="">Any amount</option>
                                    <option value="5">5 minutes</option>
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="120">2+ hours</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 0.875rem; font-weight: 500; display: block; margin-bottom: var(--spacing-xs);">Energy level?</label>
                                <select id="suggestion-energy" class="filter-select" style="width: 100%;">
                                    <option value="">Any level</option>
                                    <option value="high">High energy</option>
                                    <option value="medium">Medium energy</option>
                                    <option value="low">Low energy</option>
                                </select>
                            </div>
                        </div>
                        <button id="refresh-suggestions" class="btn btn-primary" style="margin-top: var(--spacing-md); width: 100%;">
                            <i class="fas fa-sync"></i> Get Suggestions
                        </button>
                    </div>
                    <div id="suggestions-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        const refreshBtn = document.getElementById('refresh-suggestions');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.renderSuggestions());
        }

        // Initial render
        this.renderSuggestions();
    }

    /**
     * Render task suggestions in the modal
     */
    renderSuggestions() {
        const context = document.getElementById('suggestion-context').value;
        const time = document.getElementById('suggestion-time').value;
        const energy = document.getElementById('suggestion-energy').value;

        const suggestions = this.getSmartSuggestions({
            context,
            availableMinutes: time ? parseInt(time) : null,
            energyLevel: energy
        });

        const container = document.getElementById('suggestions-list');

        if (suggestions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: var(--spacing-md); color: var(--success-color); opacity: 0.5;"></i>
                    <h3>No Tasks Available</h3>
                    <p>No actionable tasks match your current situation. Try adjusting your filters!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = suggestions.map(({ task, score, reasons }) => {
            const contexts = task.contexts && task.contexts.length > 0
                ? task.contexts.map(c => `<span class="task-context">${escapeHtml(c)}</span>`).join(' ')
                : '';

            const reasonBadges = reasons.slice(0, 3).map(reason =>
                `<span style="background: var(--info-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-right: 4px;">${reason}</span>`
            ).join('');

            return `
                <div class="task-item" style="border-left: 4px solid var(--primary-color); cursor: pointer;" onclick="app.selectSuggestedTask('${task.id}')">
                    <div class="task-checkbox">
                        <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${score}</span>
                    </div>
                    <div class="task-content">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                        <div class="task-meta">
                            ${contexts}
                            ${task.energy ? `<span class="task-energy"><i class="fas fa-bolt"></i> ${task.energy}</span>` : ''}
                            ${task.time ? `<span class="task-time"><i class="fas fa-clock"></i> ${task.time}m</span>` : ''}
                            ${task.dueDate ? `<span class="task-due-date"><i class="fas fa-calendar-day"></i> ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                        </div>
                        <div style="margin-top: var(--spacing-sm);">
                            ${reasonBadges}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * User clicked on a suggested task - highlight it and close modal
     */
    selectSuggestedTask(taskId) {
        // Remove the modal
        const modal = document.getElementById('suggestions-modal');
        if (modal) {
            modal.remove();
        }

        // Scroll to and highlight the task
        setTimeout(() => {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                taskElement.style.animation = 'pulse 0.5s ease-in-out 3';
            }
        }, 100);
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
