/**
 * GTD Web Application
 * Main application logic
 */

import { Task, Project, Reference, Template } from './models.js';
import { Storage } from './storage.js';
import { ElementIds, StorageKeys, TaskStatus, Views, RecurrenceLabels } from './constants.js';
import { getElement, setTextContent, escapeHtml, announce } from './dom-utils.js';
import { TaskParser } from './nlp-parser.js';

class GTDApp {
    constructor() {
        this.storage = new Storage();
        this.tasks = [];
        this.projects = [];
        this.templates = [];
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
            due: '',
            sort: 'updated'
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
        this.history = []; // Undo/Redo history
        this.historyIndex = -1; // Current position in history
        this.maxHistorySize = 50; // Maximum history entries
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

        // Load templates
        const templatesData = this.storage.getTemplates();
        this.templates = templatesData.map(data => Template.fromJSON(data));
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
        this.setupTemplates();
        this.setupDailyReview();
        this.setupArchive();
        this.setupContextMenu();
        this.setupSmartDateSuggestions();
        this.setupUndoRedo();
        this.setupQuickCapture();
        this.setupDependenciesVisualization();
        this.setupProductivityHeatmap();
        this.setupGlobalQuickCapture();
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
        const bulkSelectAllBtn = document.getElementById('btn-bulk-select-all');
        const bulkStatusBtn = document.getElementById('btn-bulk-status');
        const bulkEnergyBtn = document.getElementById('btn-bulk-energy');
        const bulkProjectBtn = document.getElementById('btn-bulk-project');
        const bulkContextBtn = document.getElementById('btn-bulk-context');
        const bulkDueDateBtn = document.getElementById('btn-bulk-due-date');
        const bulkDeleteBtn = document.getElementById('btn-bulk-delete');

        // Show bulk select button when there are tasks
        this.updateBulkSelectButtonVisibility();

        // Toggle bulk selection mode
        if (bulkSelectBtn) {
            bulkSelectBtn.addEventListener('click', () => {
                this.toggleBulkSelectionMode();
            });
        }

        // Complete selected tasks
        if (bulkCompleteBtn) {
            bulkCompleteBtn.addEventListener('click', async () => {
                await this.bulkCompleteTasks();
            });
        }

        // Select all visible tasks
        if (bulkSelectAllBtn) {
            bulkSelectAllBtn.addEventListener('click', () => {
                this.bulkSelectAllVisible();
            });
        }

        // Set status for selected tasks
        if (bulkStatusBtn) {
            bulkStatusBtn.addEventListener('click', () => {
                this.bulkSetStatus();
            });
        }

        // Set energy for selected tasks
        if (bulkEnergyBtn) {
            bulkEnergyBtn.addEventListener('click', () => {
                this.bulkSetEnergy();
            });
        }

        // Move selected tasks to project
        if (bulkProjectBtn) {
            bulkProjectBtn.addEventListener('click', () => {
                this.bulkSetProject();
            });
        }

        // Add context to selected tasks
        if (bulkContextBtn) {
            bulkContextBtn.addEventListener('click', () => {
                this.bulkAddContext();
            });
        }

        // Set due date for selected tasks
        if (bulkDueDateBtn) {
            bulkDueDateBtn.addEventListener('click', () => {
                this.bulkSetDueDate();
            });
        }

        // Delete selected tasks
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.bulkDeleteTasks();
            });
        }

        // Cancel bulk selection
        if (bulkCancelBtn) {
            bulkCancelBtn.addEventListener('click', () => {
                this.exitBulkSelectionMode();
            });
        }
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
        this.showToast(`${this.selectedTaskIds.size} task(s) completed`);
    }

    bulkSelectAllVisible() {
        const visibleTasks = document.querySelectorAll('.task-item');
        visibleTasks.forEach(taskElement => {
            const taskId = taskElement.dataset.taskId;
            const checkbox = taskElement.querySelector('.bulk-select-checkbox');
            if (checkbox && taskId) {
                this.selectedTaskIds.add(taskId);
                checkbox.checked = true;
            }
        });
        this.updateBulkSelectedCount();
        this.showToast(`${this.selectedTaskIds.size} tasks selected`);
    }

    async bulkSetStatus() {
        if (this.selectedTaskIds.size === 0) return;

        const status = prompt('Enter status (inbox, next, waiting, someday):');
        if (!status || !['inbox', 'next', 'waiting', 'someday'].includes(status)) {
            this.showToast('Invalid status');
            return;
        }

        this.saveState('Bulk set status');
        for (const taskId of this.selectedTaskIds) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = status;
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.saveTasks();
        this.exitBulkSelectionMode();
        this.renderView();
        this.updateCounts();
        this.showToast(`Status set to ${status}`);
    }

    async bulkSetEnergy() {
        if (this.selectedTaskIds.size === 0) return;

        const energy = prompt('Enter energy level (high, medium, low, or leave empty for none):');
        if (energy === null || (energy && !['high', 'medium', 'low'].includes(energy))) {
            this.showToast('Invalid energy level');
            return;
        }

        this.saveState('Bulk set energy');
        for (const taskId of this.selectedTaskIds) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.energy = energy || '';
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.saveTasks();
        this.exitBulkSelectionMode();
        this.renderView();
        this.showToast(`Energy set to ${energy || 'none'}`);
    }

    async bulkSetProject() {
        if (this.selectedTaskIds.size === 0) return;

        // Simple prompt - could be enhanced with a custom modal
        const projectTitles = this.projects.map((p, i) => `${i + 1}. ${p.title}`).join('\n');
        const choice = prompt(`Enter project number to move tasks to:\n0. No Project\n${projectTitles}`);

        if (choice === null) return;

        const index = parseInt(choice) - 1;
        const projectId = index === -1 ? null : (this.projects[index] ? this.projects[index].id : null);

        this.saveState('Bulk set project');
        for (const taskId of this.selectedTaskIds) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.projectId = projectId;
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.saveTasks();
        this.exitBulkSelectionMode();
        this.renderView();
        this.showToast(`Moved ${this.selectedTaskIds.size} task(s) to project`);
    }

    async bulkAddContext() {
        if (this.selectedTaskIds.size === 0) return;

        const context = prompt('Enter context name (will be prefixed with @):');
        if (!context) return;

        const formattedContext = context.startsWith('@') ? context : `@${context}`;

        this.saveState('Bulk add context');
        for (const taskId of this.selectedTaskIds) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.contexts = task.contexts || [];
                if (!task.contexts.includes(formattedContext)) {
                    task.contexts.push(formattedContext);
                }
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.saveTasks();
        this.exitBulkSelectionMode();
        this.renderView();
        this.showToast(`Added ${formattedContext} to ${this.selectedTaskIds.size} task(s)`);
    }

    async bulkSetDueDate() {
        if (this.selectedTaskIds.size === 0) return;

        const date = prompt('Enter due date (YYYY-MM-DD) or relative (today, tomorrow, in 3 days):');
        if (!date) return;

        // Parse relative dates
        let dueDate = date;
        if (date.toLowerCase() === 'today') {
            dueDate = new Date().toISOString().split('T')[0];
        } else if (date.toLowerCase() === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dueDate = tomorrow.toISOString().split('T')[0];
        } else if (date.toLowerCase().startsWith('in ')) {
            const match = date.match(/in\s+(\d+)\s+(day|days|week|weeks)/);
            if (match) {
                const amount = parseInt(match[1]);
                const unit = match[2];
                const targetDate = new Date();
                if (unit.startsWith('day')) {
                    targetDate.setDate(targetDate.getDate() + amount);
                } else if (unit.startsWith('week')) {
                    targetDate.setDate(targetDate.getDate() + (amount * 7));
                }
                dueDate = targetDate.toISOString().split('T')[0];
            }
        }

        this.saveState('Bulk set due date');
        for (const taskId of this.selectedTaskIds) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.dueDate = dueDate;
                task.updatedAt = new Date().toISOString();
            }
        }

        await this.saveTasks();
        this.exitBulkSelectionMode();
        this.renderView();
        this.showToast(`Due date set to ${dueDate}`);
    }

    async bulkDeleteTasks() {
        if (this.selectedTaskIds.size === 0) return;

        if (!confirm(`Are you sure you want to delete ${this.selectedTaskIds.size} task(s)?`)) {
            return;
        }

        this.saveState('Bulk delete tasks');
        this.tasks = this.tasks.filter(task => !this.selectedTaskIds.has(task.id));
        await this.saveTasks();
        this.exitBulkSelectionMode();
        this.renderView();
        this.updateCounts();
        this.showToast(`${this.selectedTaskIds.size} task(s) deleted`);
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
        const searchSort = document.getElementById('search-sort');
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

        // Sort dropdown
        if (searchSort) {
            searchSort.addEventListener('change', () => {
                this.advancedSearchFilters.sort = searchSort.value;
                this.renderView();
            });
        }

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
        this.advancedSearchFilters = { context: '', energy: '', status: '', due: '', sort: 'updated' };

        const searchContext = document.getElementById('search-context');
        const searchEnergy = document.getElementById('search-energy');
        const searchStatus = document.getElementById('search-status');
        const searchDue = document.getElementById('search-due');
        const searchSort = document.getElementById('search-sort');

        if (searchContext) searchContext.value = '';
        if (searchEnergy) searchEnergy.value = '';
        if (searchStatus) searchStatus.value = '';
        if (searchDue) searchDue.value = '';
        if (searchSort) searchSort.value = 'updated';

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
        const searchSort = document.getElementById('search-sort');

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
        if (searchSort) searchSort.value = this.advancedSearchFilters.sort || 'updated';

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

            <!-- Productivity Trends -->
            <div style="margin-bottom: var(--spacing-lg);">
                <h3 style="margin-bottom: var(--spacing-md);">📈 Productivity Trends</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-md);">
                    <!-- Last 7 Days Completion -->
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Tasks Completed (Last 7 Days)</h4>
                        <div style="display: flex; align-items: flex-end; gap: 4px; height: 120px; margin-top: var(--spacing-md);">
                            ${this.renderLast7DaysChart()}
                        </div>
                        <div style="margin-top: var(--spacing-sm); font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
                            ${this.getLast7DaysAverage()} avg tasks/day
                        </div>
                    </div>

                    <!-- Average Task Lifecycle -->
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Average Task Lifecycle</h4>
                        <div style="text-align: center; padding: var(--spacing-md) 0;">
                            <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-color);">${this.getAverageTaskLifecycle()}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Days from creation to completion</div>
                        </div>
                        ${this.getLifecycleInsight()}
                    </div>

                    <!-- Completion Velocity -->
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Completion Velocity</h4>
                        <div style="text-align: center; padding: var(--spacing-md) 0;">
                            <div style="font-size: 2.5rem; font-weight: bold; color: ${this.getVelocityTrend().color};">${this.getVelocityTrend().icon} ${this.getVelocityTrend().value}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">${this.getVelocityTrend().label}</div>
                        </div>
                        <div style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-secondary);">
                            ${this.getVelocityInsight()}
                        </div>
                    </div>
                </div>
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

            <!-- Time Tracking Analytics -->
            <div style="margin-bottom: var(--spacing-lg);">
                <h3 style="margin-bottom: var(--spacing-md);">Time Tracking</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Total Time Tracked</h4>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${this.formatTotalTime()}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Across all tasks</div>
                    </div>

                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Tasks with Time</h4>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--info-color);">${this.tasks.filter(t => t.timeSpent && t.timeSpent > 0).length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Tasks tracked</div>
                    </div>

                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Avg Time/Task</h4>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--success-color);">${this.getAverageTimePerTask()}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Minutes per task</div>
                    </div>
                </div>

                ${this.renderTimeByContext()}
                ${this.renderTimeByProject()}
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

    formatTotalTime() {
        const totalMinutes = this.tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);

        if (totalMinutes === 0) return '0m';

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    getAverageTimePerTask() {
        const tasksWithTime = this.tasks.filter(t => t.timeSpent && t.timeSpent > 0);
        if (tasksWithTime.length === 0) return '0';

        const totalMinutes = tasksWithTime.reduce((sum, task) => sum + task.timeSpent, 0);
        return Math.round(totalMinutes / tasksWithTime.length);
    }

    renderTimeByContext() {
        const timeByContext = {};

        this.tasks.forEach(task => {
            if (task.timeSpent && task.timeSpent > 0 && task.contexts) {
                task.contexts.forEach(context => {
                    if (!timeByContext[context]) timeByContext[context] = 0;
                    timeByContext[context] += task.timeSpent;
                });
            }
        });

        const entries = Object.entries(timeByContext).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) return '';

        const maxTime = Math.max(...entries.map(e => e[1]));

        return `
            <div style="margin-top: var(--spacing-md);">
                <h4 style="margin-bottom: var(--spacing-sm); font-size: 1rem;">Time by Context</h4>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-xs);">
                    ${entries.map(([context, minutes]) => {
                        const percentage = (minutes / maxTime) * 100;
                        return `
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                <div style="width: 100px; font-size: 0.85rem;">${escapeHtml(context)}</div>
                                <div style="flex: 1; height: 20px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; position: relative;">
                                    <div style="height: 100%; background: var(--primary-color); width: ${percentage}%; transition: width 0.3s;"></div>
                                    <div style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--text-primary);">${Math.round(minutes)} min</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderTimeByProject() {
        const timeByProject = {};

        this.tasks.forEach(task => {
            if (task.timeSpent && task.timeSpent > 0 && task.projectId) {
                const project = this.projects.find(p => p.id === task.projectId);
                const projectName = project ? project.title : 'Unknown Project';
                if (!timeByProject[projectName]) timeByProject[projectName] = 0;
                timeByProject[projectName] += task.timeSpent;
            }
        });

        const entries = Object.entries(timeByProject).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) return '';

        const maxTime = Math.max(...entries.map(e => e[1]));

        return `
            <div style="margin-top: var(--spacing-md);">
                <h4 style="margin-bottom: var(--spacing-sm); font-size: 1rem;">Time by Project</h4>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-xs);">
                    ${entries.map(([project, minutes]) => {
                        const percentage = (minutes / maxTime) * 100;
                        return `
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                <div style="width: 150px; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(project)}</div>
                                <div style="flex: 1; height: 20px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; position: relative;">
                                    <div style="height: 100%; background: var(--success-color); width: ${percentage}%; transition: width 0.3s;"></div>
                                    <div style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--text-primary);">${Math.round(minutes)} min</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Productivity Trends Helper Methods
    renderLast7DaysChart() {
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push(date);
        }

        // Get completed tasks per day
        const completedByDay = days.map(date => {
            const dayStart = new Date(date);
            const dayEnd = new Date(date);
            dayEnd.setDate(dayEnd.getDate() + 1);

            return this.tasks.filter(t => {
                if (!t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                return completedDate >= dayStart && completedDate < dayEnd;
            }).length;
        });

        const maxCount = Math.max(...completedByDay, 1);

        return completedByDay.map((count, index) => {
            const height = (count / maxCount) * 100;
            const date = days[index];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const isToday = index === 6;

            return `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${count}</div>
                    <div style="width: 100%; height: 80px; background: var(--bg-secondary); border-radius: 4px 4px 0 0; position: relative; overflow: hidden;">
                        <div style="position: absolute; bottom: 0; width: 100%; height: ${height}%; background: ${isToday ? 'var(--primary-color)' : 'var(--success-color)'}; transition: height 0.3s;"></div>
                    </div>
                    <div style="font-size: 0.7rem; color: ${isToday ? 'var(--primary-color)' : 'var(--text-secondary)'}; font-weight: ${isToday ? 'bold' : 'normal'};">${dayName}</div>
                </div>
            `;
        }).join('');
    }

    getLast7DaysAverage() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalCompleted = 0;
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            const dayEnd = new Date(date);
            dayEnd.setDate(dayEnd.getDate() + 1);

            totalCompleted += this.tasks.filter(t => {
                if (!t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                return completedDate >= dayStart && completedDate < dayEnd;
            }).length;
        }

        return (totalCompleted / 7).toFixed(1);
    }

    getAverageTaskLifecycle() {
        const completedTasks = this.tasks.filter(t => t.completed && t.createdAt && t.completedAt);

        if (completedTasks.length === 0) return '0';

        const totalDays = completedTasks.reduce((sum, task) => {
            const created = new Date(task.createdAt);
            const completed = new Date(task.completedAt);
            const days = (completed - created) / (1000 * 60 * 60 * 24);
            return sum + days;
        }, 0);

        return Math.round(totalDays / completedTasks.length);
    }

    getLifecycleInsight() {
        const avg = this.getAverageTaskLifecycle();

        if (avg === 0) return '';

        let insight = '';
        let color = 'var(--text-secondary)';

        if (avg <= 1) {
            insight = '⚡ Super fast! You complete tasks quickly.';
            color = 'var(--success-color)';
        } else if (avg <= 3) {
            insight = '👍 Great velocity! Tasks get done in ~3 days.';
            color = 'var(--info-color)';
        } else if (avg <= 7) {
            insight = '📊 Good pace. Tasks are completed within a week.';
            color = 'var(--primary-color)';
        } else if (avg <= 14) {
            insight = '🐢 Consider breaking down large tasks.';
            color = 'var(--warning-color)';
        } else {
            insight = '⚠️ Tasks are taking a while. Try smaller subtasks.';
            color = 'var(--danger-color)';
        }

        return `<div style="margin-top: var(--spacing-sm); font-size: 0.85rem; color: ${color};">${insight}</div>`;
    }

    getVelocityTrend() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Last 7 days
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            const dayEnd = new Date(date);
            dayEnd.setDate(dayEnd.getDate() + 1);

            last7Days.push(this.tasks.filter(t => {
                if (!t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                return completedDate >= dayStart && completedDate < dayEnd;
            }).length);
        }

        // Previous 7 days
        const prev7Days = [];
        for (let i = 7; i < 14; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            const dayEnd = new Date(date);
            dayEnd.setDate(dayEnd.getDate() + 1);

            prev7Days.push(this.tasks.filter(t => {
                if (!t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                return completedDate >= dayStart && completedDate < dayEnd;
            }).length);
        }

        const last7Total = last7Days.reduce((a, b) => a + b, 0);
        const prev7Total = prev7Days.reduce((a, b) => a + b, 0);

        const last7Avg = last7Total / 7;
        const prev7Avg = prev7Total / 7;

        const percentChange = prev7Avg === 0 ? 100 : ((last7Avg - prev7Avg) / prev7Avg * 100);
        const roundedChange = Math.round(percentChange);

        if (roundedChange > 20) {
            return {
                value: `+${roundedChange}%`,
                label: 'vs previous week',
                icon: '📈',
                color: 'var(--success-color)'
            };
        } else if (roundedChange > 0) {
            return {
                value: `+${roundedChange}%`,
                label: 'vs previous week',
                icon: '➕',
                color: 'var(--info-color)'
            };
        } else if (roundedChange > -20) {
            return {
                value: `${roundedChange}%`,
                label: 'vs previous week',
                icon: '➡️',
                color: 'var(--warning-color)'
            };
        } else {
            return {
                value: `${roundedChange}%`,
                label: 'vs previous week',
                icon: '📉',
                color: 'var(--danger-color)'
            };
        }
    }

    getVelocityInsight() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // This week
        let thisWeekCompleted = 0;
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date);
            const dayEnd = new Date(date);
            dayEnd.setDate(dayEnd.getDate() + 1);

            thisWeekCompleted += this.tasks.filter(t => {
                if (!t.completedAt) return false;
                const completedDate = new Date(t.completedAt);
                return completedDate >= dayStart && completedDate < dayEnd;
            }).length;
        }

        if (thisWeekCompleted >= 20) {
            return '🔥 Outstanding productivity! You\'re on fire!';
        } else if (thisWeekCompleted >= 10) {
            return '💪 Strong week! Keep up the great work.';
        } else if (thisWeekCompleted >= 5) {
            return '👍 Good progress. Stay focused!';
        } else if (thisWeekCompleted > 0) {
            return '📝 Making progress. Every task counts!';
        } else {
            return '💭 Start small. Complete one task today!';
        }
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

    setupDailyReview() {
        const dailyReviewBtn = document.getElementById('btn-daily-review');
        const closeDailyReviewBtn = document.getElementById('close-daily-review-modal');

        if (dailyReviewBtn) {
            dailyReviewBtn.addEventListener('click', () => {
                this.showDailyReview();
            });
        }

        if (closeDailyReviewBtn) {
            closeDailyReviewBtn.addEventListener('click', () => {
                this.closeDailyReview();
            });
        }
    }

    showDailyReview() {
        const modal = document.getElementById('daily-review-modal');
        if (!modal) return;

        modal.style.display = 'block';
        this.renderDailyReview();
    }

    closeDailyReview() {
        const modal = document.getElementById('daily-review-modal');
        if (modal) modal.style.display = 'none';
    }

    renderDailyReview() {
        const dailyReviewContent = document.getElementById('daily-review-content');
        if (!dailyReviewContent) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Gather daily review data
        const tasksDueToday = this.tasks.filter(t => !t.completed && t.isDueToday());
        const overdueTasks = this.tasks.filter(t => !t.completed && t.isOverdue());
        const starredTasks = this.tasks.filter(t => !t.completed && t.starred);
        const inboxTasks = this.tasks.filter(t => !t.completed && t.status === 'inbox' && !t.projectId);
        const nextActions = this.tasks.filter(t =>
            !t.completed &&
            t.status === 'next' &&
            t.areDependenciesMet(this.tasks) &&
            t.isAvailable()
        );

        // Count total actionable today
        const actionableToday = [...tasksDueToday, ...overdueTasks].filter((task, index, self) =>
            index === self.findIndex(t => t.id === task.id)
        );

        // Render daily review
        dailyReviewContent.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <!-- Welcome Section -->
                <div style="background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); color: white; padding: var(--spacing-xl); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
                    <h2 style="margin-top: 0; display: flex; align-items: center; gap: var(--spacing-sm);">
                        <i class="fas fa-sun"></i> Good ${this.getGreeting()}!
                    </h2>
                    <p style="margin: var(--spacing-sm) 0; opacity: 0.95;">
                        ${this.getGreetingMessage()}
                    </p>
                    <div style="display: flex; gap: var(--spacing-lg); margin-top: var(--spacing-md);">
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold;">${actionableToday.length}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">Tasks Due Today</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold;">${starredTasks.length}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">Starred Tasks</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: bold;">${inboxTasks.length}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">Inbox Items</div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
                    <h3 style="margin-top: 0;"><i class="fas fa-bolt"></i> Quick Actions</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md);">
                        <button class="btn btn-primary" onclick="app.closeDailyReview(); document.getElementById('quick-add-input').focus();">
                            <i class="fas fa-plus"></i> Quick Capture
                        </button>
                        <button class="btn btn-secondary" onclick="app.closeDailyReview(); app.navigateTo('inbox');">
                            <i class="fas fa-inbox"></i> Process Inbox (${inboxTasks.length})
                        </button>
                        <button class="btn btn-secondary" onclick="app.closeDailyReview(); app.navigateTo('next');">
                            <i class="fas fa-bolt"></i> Review Next Actions (${nextActions.length})
                        </button>
                        <button class="btn btn-secondary" onclick="app.openTemplatesModal();">
                            <i class="fas fa-copy"></i> Use Template
                        </button>
                    </div>
                </div>

                <!-- Tasks Due Today & Overdue -->
                ${(overdueTasks.length > 0 || tasksDueToday.length > 0) ? `
                <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg); ${overdueTasks.length > 0 ? 'border: 2px solid var(--danger-color);' : ''}">
                    <h3 style="margin-top: 0;">
                        <i class="fas fa-calendar-day" style="color: ${overdueTasks.length > 0 ? 'var(--danger-color)' : 'var(--primary-color)'};"></i>
                        ${overdueTasks.length > 0 ? '⚠️ Overdue & Due Today' : 'Tasks Due Today'}
                        <span style="font-size: 0.9em; font-weight: normal; color: var(--text-secondary);">(${overdueTasks.length + tasksDueToday.length} tasks)</span>
                    </h3>
                    ${overdueTasks.length > 0 ? '<p style="color: var(--danger-color); margin-bottom: var(--spacing-md);"><strong>You have ' + overdueTasks.length + ' overdue task(s)!</strong></p>' : ''}
                    <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                        ${overdueTasks.map(task => this.renderDailyReviewTask(task, 'overdue')).join('')}
                        ${tasksDueToday.map(task => this.renderDailyReviewTask(task, 'due')).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Starred Tasks -->
                ${starredTasks.length > 0 ? `
                <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
                    <h3 style="margin-top: 0;">
                        <i class="fas fa-star" style="color: gold;"></i> Starred Tasks
                        <span style="font-size: 0.9em; font-weight: normal; color: var(--text-secondary);">(${starredTasks.length} tasks)</span>
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                        ${starredTasks.slice(0, 5).map(task => this.renderDailyReviewTask(task, 'starred')).join('')}
                        ${starredTasks.length > 5 ? `<p style="text-align: center; color: var(--text-secondary); margin: var(--spacing-sm) 0;">... and ${starredTasks.length - 5} more starred tasks</p>` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Inbox Items -->
                ${inboxTasks.length > 0 ? `
                <div style="background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg);">
                    <h3 style="margin-top: 0;">
                        <i class="fas fa-inbox"></i> Inbox to Process
                        <span style="font-size: 0.9em; font-weight: normal; color: var(--text-secondary);">(${inboxTasks.length} items)</span>
                    </h3>
                    <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">
                        Process these items: Is it actionable? Delete it? Delegate it? Defer it?
                    </p>
                    <div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">
                        ${inboxTasks.slice(0, 5).map(task => this.renderDailyReviewTask(task, 'inbox')).join('')}
                        ${inboxTasks.length > 5 ? `<button class="btn btn-secondary" onclick="app.closeDailyReview(); app.navigateTo('inbox');" style="margin-top: var(--spacing-sm);">View all ${inboxTasks.length} inbox items</button>` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Empty State -->
                ${overdueTasks.length === 0 && tasksDueToday.length === 0 && starredTasks.length === 0 && inboxTasks.length === 0 ? `
                <div style="background: var(--bg-secondary); padding: var(--spacing-xl); border-radius: var(--radius-md); text-align: center;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success-color); margin-bottom: var(--spacing-md);"></i>
                    <h3>All Clear!</h3>
                    <p style="color: var(--text-secondary);">You're in great shape. No urgent tasks, starred items, or inbox items to review.</p>
                    <button class="btn btn-primary" onclick="app.closeDailyReview(); document.getElementById('quick-add-input').focus();" style="margin-top: var(--spacing-md);">
                        <i class="fas fa-plus"></i> Capture New Tasks
                    </button>
                </div>
                ` : ''}

                <!-- Completion Message -->
                <div style="text-align: center; margin-top: var(--spacing-lg); padding: var(--spacing-lg);">
                    <p style="color: var(--text-secondary); margin: 0;">
                        <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                        Daily review complete! Have a productive day.
                    </p>
                </div>
            </div>
        `;
    }

    renderDailyReviewTask(task, type) {
        const priorityColors = {
            high: 'var(--energy-high)',
            medium: 'var(--energy-medium)',
            low: 'var(--energy-low)'
        };

        const typeColors = {
            overdue: 'var(--danger-color)',
            due: 'var(--primary-color)',
            starred: 'gold',
            inbox: 'var(--text-secondary)'
        };

        const typeLabels = {
            overdue: 'OVERDUE',
            due: 'Due Today',
            starred: 'Starred',
            inbox: 'Inbox'
        };

        return `
            <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-left: 4px solid ${typeColors[type]}; border-radius: var(--radius-sm); padding: var(--spacing-md); display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer;" onclick="app.closeDailyReview(); app.editTask('${task.id}');">
                <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); app.quickCompleteTask('${task.id}');" title="Complete">
                    <i class="fas fa-check"></i>
                </button>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: var(--spacing-xs); flex-wrap: wrap;">
                        <span style="font-weight: 500;">${escapeHtml(task.title)}</span>
                        ${task.energy ? `<span class="badge" style="background: ${priorityColors[task.energy]}; font-size: 0.75rem;">${task.energy}</span>` : ''}
                        ${task.time ? `<span class="badge" style="background: var(--info-color); font-size: 0.75rem;"><i class="fas fa-clock"></i> ${task.time}m</span>` : ''}
                        ${type === 'overdue' || type === 'due' ? `<span class="badge" style="background: ${typeColors[type]}; font-size: 0.75rem;">${typeLabels[type]}</span>` : ''}
                    </div>
                    ${task.projectId ? `<span style="font-size: 0.85rem; color: var(--text-secondary);"><i class="fas fa-folder"></i> ${this.getProjectTitle(task.projectId)}</span>` : ''}
                </div>
                <i class="fas fa-chevron-right" style="color: var(--text-secondary);"></i>
            </div>
        `;
    }

    async quickCompleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.saveState('Complete task');
        task.markComplete();

        // Handle recurring tasks
        if (task.isRecurring() && !task.shouldRecurrenceEnd()) {
            const nextTask = task.createNextInstance();
            if (nextTask) {
                this.tasks.push(nextTask);
            }
        }

        await this.saveTasks();
        this.renderDailyReview();
        this.renderView();
        this.updateCounts();
        this.showToast('Task completed');
    }

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 17) return 'Afternoon';
        return 'Evening';
    }

    getGreetingMessage() {
        const hour = new Date().getHours();
        if (hour < 12) {
            return "Start your day right. Review what's due and plan your priorities.";
        } else if (hour < 17) {
            return "Midday check-in. How's your progress going? Stay focused!";
        } else {
            return "End of day review. Wrap up and prepare for tomorrow.";
        }
    }

    navigateTo(view) {
        this.currentView = view;
        this.currentProjectId = null;
        this.renderView();
        this.updateNavigation();
    }

    getProjectTitle(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        return project ? project.title : '';
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

    // ==================== TEMPLATES SYSTEM ====================

    getCustomContexts() {
        const tags = localStorage.getItem('gtd_custom_contexts');
        return tags ? JSON.parse(tags) : [];
    }

    setupTemplates() {
        // Templates button in sidebar
        const templatesBtn = document.getElementById('templates-button');
        if (templatesBtn) {
            templatesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openTemplatesModal();
            });
        }

        // Close templates modal
        const closeTemplatesBtn = document.getElementById('close-templates-modal');
        if (closeTemplatesBtn) {
            closeTemplatesBtn.addEventListener('click', () => this.closeTemplatesModal());
        }

        // Create template button
        const createTemplateBtn = document.getElementById('btn-create-template');
        if (createTemplateBtn) {
            createTemplateBtn.addEventListener('click', () => this.openTemplateEditModal());
        }

        // Close template edit modal
        const closeTemplateEditBtn = document.getElementById('close-template-edit-modal');
        if (closeTemplateEditBtn) {
            closeTemplateEditBtn.addEventListener('click', () => this.closeTemplateEditModal());
        }

        const cancelTemplateBtn = document.getElementById('cancel-template-modal');
        if (cancelTemplateBtn) {
            cancelTemplateBtn.addEventListener('click', () => this.closeTemplateEditModal());
        }

        // Template form submission
        const templateForm = document.getElementById('template-form');
        if (templateForm) {
            templateForm.addEventListener('submit', (e) => this.handleTemplateFormSubmit(e));
        }

        // Add subtask button
        const addSubtaskBtn = document.getElementById('btn-add-template-subtask');
        if (addSubtaskBtn) {
            addSubtaskBtn.addEventListener('click', () => this.addTemplateSubtask());
        }
    }

    openTemplatesModal() {
        const modal = document.getElementById('templates-modal');
        if (modal) {
            modal.style.display = 'block';
            this.renderTemplatesList();
        }
    }

    closeTemplatesModal() {
        const modal = document.getElementById('templates-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    openTemplateEditModal(templateId = null) {
        const modal = document.getElementById('template-edit-modal');
        const title = document.getElementById('template-modal-title');

        if (modal) {
            modal.style.display = 'block';

            if (templateId) {
                // Edit existing template
                const template = this.templates.find(t => t.id === templateId);
                if (template) {
                    title.textContent = 'Edit Template';
                    document.getElementById('template-id').value = template.id;
                    document.getElementById('template-title').value = template.title;
                    document.getElementById('template-description').value = template.description;
                    document.getElementById('template-energy').value = template.energy;
                    document.getElementById('template-time').value = template.time;
                    document.getElementById('template-category').value = template.category;
                    document.getElementById('template-notes').value = template.notes;

                    // Render contexts and subtasks
                    this.renderTemplateContexts(template.contexts);
                    this.renderTemplateSubtasks(template.subtasks);
                }
            } else {
                // Create new template
                title.textContent = 'Create Template';
                document.getElementById('template-form').reset();
                document.getElementById('template-id').value = '';
                this.renderTemplateContexts([]);
                this.renderTemplateSubtasks([]);
            }
        }
    }

    closeTemplateEditModal() {
        const modal = document.getElementById('template-edit-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleTemplateFormSubmit(e) {
        e.preventDefault();

        const templateId = document.getElementById('template-id').value;
        const templateData = {
            title: document.getElementById('template-title').value,
            description: document.getElementById('template-description').value,
            energy: document.getElementById('template-energy').value,
            time: parseInt(document.getElementById('template-time').value) || 0,
            category: document.getElementById('template-category').value,
            contexts: this.getSelectedTemplateContexts(),
            notes: document.getElementById('template-notes').value,
            subtasks: this.getTemplateSubtasks()
        };

        this.saveState(templateId ? 'Edit template' : 'Create template');

        if (templateId) {
            // Update existing template
            const template = this.templates.find(t => t.id === templateId);
            if (template) {
                Object.assign(template, templateData);
                template.updatedAt = new Date().toISOString();
            }
        } else {
            // Create new template
            const newTemplate = new Template(templateData);
            this.templates.push(newTemplate);
        }

        await this.saveTemplates();
        this.closeTemplateEditModal();
        this.renderTemplatesList();
        this.showToast(templateId ? 'Template updated' : 'Template created');
    }

    async deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template?')) return;

        this.saveState('Delete template');
        this.templates = this.templates.filter(t => t.id !== templateId);
        await this.saveTemplates();
        this.renderTemplatesList();
        this.showToast('Template deleted');
    }

    async createTaskFromTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        const task = template.createTask();
        this.tasks.push(task);
        await this.saveTasks();
        this.closeTemplatesModal();
        this.renderView();
        this.updateCounts();
        this.showToast('Task created from template');
    }

    renderTemplatesList() {
        const container = document.getElementById('templates-list');
        if (!container) return;

        if (this.templates.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                    <i class="fas fa-copy" style="font-size: 3rem; margin-bottom: var(--spacing-md); opacity: 0.3;"></i>
                    <p>No templates yet</p>
                    <p style="font-size: 0.9rem;">Create templates for repetitive tasks</p>
                </div>
            `;
            return;
        }

        // Group templates by category
        const categories = {
            general: { label: 'General', icon: 'fa-folder', templates: [] },
            work: { label: 'Work', icon: 'fa-briefcase', templates: [] },
            personal: { label: 'Personal', icon: 'fa-user', templates: [] },
            meeting: { label: 'Meeting', icon: 'fa-users', templates: [] },
            checklist: { label: 'Checklist', icon: 'fa-tasks', templates: [] }
        };

        this.templates.forEach(template => {
            if (categories[template.category]) {
                categories[template.category].templates.push(template);
            }
        });

        let html = '';
        for (const [key, category] of Object.entries(categories)) {
            if (category.templates.length === 0) continue;

            html += `
                <div class="template-category" style="margin-bottom: var(--spacing-lg);">
                    <h3 style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); color: var(--primary-color);">
                        <i class="fas ${category.icon}"></i>
                        ${category.label}
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--spacing-md);">
            `;

            category.templates.forEach(template => {
                html += `
                    <div class="template-card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--spacing-md);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-sm);">
                            <h4 style="margin: 0; flex: 1;">${escapeHtml(template.title)}</h4>
                            <div class="template-actions" style="display: flex; gap: var(--spacing-xs);">
                                <button class="btn btn-sm btn-secondary" onclick="app.editTemplate('${template.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="app.deleteTemplate('${template.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        ${template.description ? `<p style="color: var(--text-secondary); margin: var(--spacing-xs) 0; font-size: 0.9rem;">${escapeHtml(template.description)}</p>` : ''}
                        <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-xs); margin-bottom: var(--spacing-sm);">
                            ${template.energy ? `<span class="badge" style="background: var(--energy-high);">${template.energy}</span>` : ''}
                            ${template.time ? `<span class="badge" style="background: var(--info-color);"><i class="fas fa-clock"></i> ${template.time}m</span>` : ''}
                            ${template.contexts.map(ctx => `<span class="badge" style="background: var(--context-color);">${escapeHtml(ctx)}</span>`).join('')}
                        </div>
                        ${template.subtasks.length > 0 ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--spacing-sm);"><i class="fas fa-check-square"></i> ${template.subtasks.length} subtasks</div>` : ''}
                        <button class="btn btn-primary" style="width: 100%;" onclick="app.createTaskFromTemplate('${template.id}')">
                            <i class="fas fa-plus"></i> Create Task
                        </button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    editTemplate(templateId) {
        this.openTemplateEditModal(templateId);
    }

    renderTemplateContexts(selectedContexts = []) {
        const container = document.getElementById('template-contexts-container');
        if (!container) return;

        const allContexts = [...this.defaultContexts, ...this.getCustomContexts()];

        container.innerHTML = allContexts.map(context => {
            const isSelected = selectedContexts.includes(context);
            return `
                <button type="button" class="context-btn ${isSelected ? 'active' : ''}" data-context="${escapeHtml(context)}">
                    ${escapeHtml(context)}
                </button>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.context-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        });
    }

    getSelectedTemplateContexts() {
        const container = document.getElementById('template-contexts-container');
        if (!container) return [];

        const activeBtns = container.querySelectorAll('.context-btn.active');
        return Array.from(activeBtns).map(btn => btn.dataset.context);
    }

    renderTemplateSubtasks(subtasks = []) {
        const container = document.getElementById('template-subtasks-container');
        if (!container) return;

        container.innerHTML = subtasks.map((subtask, index) => `
            <div class="subtask-item" style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs); align-items: center;">
                <input type="text" class="form-control" value="${escapeHtml(subtask.title)}" data-index="${index}" placeholder="Subtask title">
                <button type="button" class="btn btn-secondary btn-sm" onclick="app.removeTemplateSubtask(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    addTemplateSubtask() {
        const container = document.getElementById('template-subtasks-container');
        if (!container) return;

        const index = container.children.length;
        const div = document.createElement('div');
        div.className = 'subtask-item';
        div.style.cssText = 'display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs); align-items: center;';
        div.innerHTML = `
            <input type="text" class="form-control" data-index="${index}" placeholder="Subtask title">
            <button type="button" class="btn btn-secondary btn-sm" onclick="app.removeTemplateSubtask(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
        div.querySelector('input').focus();
    }

    removeTemplateSubtask(index) {
        const container = document.getElementById('template-subtasks-container');
        if (!container) return;

        const items = container.querySelectorAll('.subtask-item');
        if (items[index]) {
            items[index].remove();
            // Reindex remaining items
            container.querySelectorAll('.subtask-item input').forEach((input, i) => {
                input.dataset.index = i;
                input.nextElementSibling.setAttribute('onclick', `app.removeTemplateSubtask(${i})`);
            });
        }
    }

    getTemplateSubtasks() {
        const container = document.getElementById('template-subtasks-container');
        if (!container) return [];

        const items = container.querySelectorAll('.subtask-item input');
        return Array.from(items)
            .map(input => input.value.trim())
            .filter(title => title)
            .map(title => ({ title, completed: false }));
    }

    // ==================== ARCHIVE SYSTEM ====================

    setupArchive() {
        // Archive button in sidebar
        const archiveBtn = document.getElementById('archive-button');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openArchiveModal();
            });
        }

        // Close archive modal
        const closeArchiveBtn = document.getElementById('close-archive-modal');
        if (closeArchiveBtn) {
            closeArchiveBtn.addEventListener('click', () => this.closeArchiveModal());
        }

        // Auto-archive button
        const autoArchiveBtn = document.getElementById('btn-auto-archive');
        if (autoArchiveBtn) {
            autoArchiveBtn.addEventListener('click', () => this.autoArchiveOldTasks());
        }

        // Archive search
        const archiveSearch = document.getElementById('archive-search');
        if (archiveSearch) {
            archiveSearch.addEventListener('input', (e) => {
                this.renderArchive(e.target.value);
            });
        }

        // Archive project filter
        const archiveProjectFilter = document.getElementById('archive-filter-project');
        if (archiveProjectFilter) {
            archiveProjectFilter.addEventListener('change', () => {
                this.renderArchive();
            });
        }
    }

    openArchiveModal() {
        const modal = document.getElementById('archive-modal');
        if (modal) {
            modal.style.display = 'block';
            this.renderArchive();
            this.populateArchiveProjectFilter();
        }
    }

    closeArchiveModal() {
        const modal = document.getElementById('archive-modal');
        if (modal) modal.style.display = 'none';
    }

    async autoArchiveOldTasks(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        // Find completed tasks older than cutoff
        const tasksToArchive = this.tasks.filter(task => {
            if (!task.completed || !task.completedAt) return false;
            const completedDate = new Date(task.completedAt);
            return completedDate < cutoffDate;
        });

        if (tasksToArchive.length === 0) {
            this.showToast(`No tasks to archive (none older than ${daysOld} days)`);
            return;
        }

        if (!confirm(`Archive ${tasksToArchive.length} completed task(s) older than ${daysOld} days?`)) {
            return;
        }

        this.saveState('Auto-archive tasks');
        await this.archiveTasks(tasksToArchive);

        // Remove archived tasks from active list
        this.tasks = this.tasks.filter(task => !tasksToArchive.includes(task));
        await this.saveTasks();

        this.renderArchive();
        this.renderView();
        this.updateCounts();
        this.showToast(`Archived ${tasksToArchive.length} tasks`);
    }

    async archiveTasks(tasksToArchive) {
        await this.storage.addToArchive(tasksToArchive);
    }

    async restoreFromArchive(archiveId) {
        const archive = this.storage.getArchivedTasks();
        const entry = archive.find(a => a.task.id === archiveId);

        if (!entry) return;

        this.saveState('Restore from archive');

        // Create task from archive entry
        const task = Task.fromJSON(entry.task);
        this.tasks.push(task);
        await this.saveTasks();

        // Remove from archive
        const updatedArchive = archive.filter(a => a.task.id !== archiveId);
        await this.storage.saveArchivedTasks(updatedArchive);

        this.renderArchive();
        this.renderView();
        this.updateCounts();
        this.showToast('Task restored');
    }

    async deleteFromArchive(archiveId) {
        if (!confirm('Permanently delete this archived task?')) return;

        const archive = this.storage.getArchivedTasks();
        const updatedArchive = archive.filter(a => a.task.id !== archiveId);
        await this.storage.saveArchivedTasks(updatedArchive);

        this.renderArchive();
        this.showToast('Archived task deleted');
    }

    renderArchive(searchQuery = '') {
        const container = document.getElementById('archive-list');
        const countSpan = document.getElementById('archive-count');
        const projectFilter = document.getElementById('archive-filter-project');

        if (!container) return;

        let archive = this.storage.getArchivedTasks();

        // Update stats
        countSpan.textContent = archive.length;

        if (archive.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                    <i class="fas fa-archive" style="font-size: 3rem; margin-bottom: var(--spacing-md); opacity: 0.3;"></i>
                    <p>No archived tasks</p>
                    <p style="font-size: 0.9rem;">Completed tasks can be archived here</p>
                </div>
            `;
            return;
        }

        // Apply filters
        const projectFilterValue = projectFilter ? projectFilter.value : '';

        let filteredArchive = archive.filter(entry => {
            const task = entry.task;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = task.title.toLowerCase().includes(query);
                const matchesDesc = task.description && task.description.toLowerCase().includes(query);
                const matchesContexts = task.contexts && task.contexts.some(c => c.toLowerCase().includes(query));
                if (!matchesTitle && !matchesDesc && !matchesContexts) return false;
            }

            // Project filter
            if (projectFilterValue && entry.originalProjectId !== projectFilterValue) {
                return false;
            }

            return true;
        });

        // Sort by archived date (newest first)
        filteredArchive.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

        // Render archived tasks
        container.innerHTML = filteredArchive.map(entry => {
            const task = entry.task;
            const archivedDate = new Date(entry.archivedAt);
            const completedDate = task.completedAt ? new Date(task.completedAt) : null;

            return `
                <div class="archived-task-card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--spacing-md); margin-bottom: var(--spacing-sm);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 var(--spacing-xs) 0;">
                                <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                                ${escapeHtml(task.title)}
                            </h4>
                            ${task.description ? `<p style="color: var(--text-secondary); margin: var(--spacing-xs) 0; font-size: 0.9rem;">${escapeHtml(task.description)}</p>` : ''}
                            <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-xs); margin-top: var(--spacing-xs); font-size: 0.85rem; color: var(--text-secondary);">
                                ${entry.originalProjectId ? `<span><i class="fas fa-folder"></i> ${this.getProjectTitle(entry.originalProjectId)}</span>` : ''}
                                ${task.contexts && task.contexts.map(ctx => `<span class="badge" style="background: var(--context-color);">${escapeHtml(ctx)}</span>`).join('')}
                                <span><i class="fas fa-calendar-check"></i> Completed: ${completedDate ? completedDate.toLocaleDateString() : 'Unknown'}</span>
                                <span><i class="fas fa-archive"></i> Archived: ${archivedDate.toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: var(--spacing-xs); margin-left: var(--spacing-md);">
                            <button class="btn btn-sm btn-primary" onclick="app.restoreFromArchive('${task.id}')" title="Restore task">
                                <i class="fas fa-undo"></i> Restore
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="app.deleteFromArchive('${task.id}')" title="Delete permanently">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (filteredArchive.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                    <p>No archived tasks match your filters</p>
                </div>
            `;
        }
    }

    populateArchiveProjectFilter() {
        const select = document.getElementById('archive-filter-project');
        if (!select) return;

        // Get unique projects from archive
        const archive = this.storage.getArchivedTasks();
        const projectIds = [...new Set(archive.map(entry => entry.originalProjectId).filter(Boolean))];

        // Clear existing options (except first)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Add project options
        projectIds.forEach(projectId => {
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                const option = document.createElement('option');
                option.value = projectId;
                option.textContent = project.title;
                select.appendChild(option);
            }
        });
    }

    // ==================== QUICK ACTIONS CONTEXT MENU ====================

    setupContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        if (!contextMenu) return;

        this.contextMenuTaskId = null;

        // Close context menu on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });

        // Context menu item clicks
        contextMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.context-menu-item');
            if (!menuItem) return;

            const action = menuItem.dataset.action;
            const taskId = this.contextMenuTaskId;

            if (!taskId) return;

            e.preventDefault();
            e.stopPropagation();

            this.handleContextMenuAction(action, menuItem.dataset, taskId);
            this.hideContextMenu();
        });

        // Add right-click handler to task container
        document.addEventListener('contextmenu', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                e.preventDefault();
                const taskId = taskItem.dataset.taskId;
                this.showContextMenu(e, taskId);
            }
        });

        // Long-press for mobile
        let longPressTimer;
        document.addEventListener('touchstart', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                longPressTimer = setTimeout(() => {
                    const taskId = taskItem.dataset.taskId;
                    this.showContextMenu(e.touches[0], taskId);
                }, 500);
            }
        });

        document.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });

        document.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });
    }

    showContextMenu(event, taskId) {
        const contextMenu = document.getElementById('context-menu');
        if (!contextMenu) return;

        this.contextMenuTaskId = taskId;

        // Populate projects submenu
        this.populateContextMenuProjects();

        // Position menu
        const x = event.clientX || event.pageX;
        const y = event.clientY || event.pageY;

        contextMenu.style.display = 'block';

        // Ensure menu stays within viewport
        const rect = contextMenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let posX = x;
        let posY = y;

        if (posX + rect.width > viewportWidth) {
            posX = viewportWidth - rect.width - 10;
        }

        if (posY + rect.height > viewportHeight) {
            posY = viewportHeight - rect.height - 10;
        }

        contextMenu.style.left = posX + 'px';
        contextMenu.style.top = posY + 'px';

        // Update star button text
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const starItem = contextMenu.querySelector('[data-action="toggle-star"]');
            if (starItem) {
                starItem.innerHTML = task.starred
                    ? '<i class="fas fa-star" style="color: gold;"></i> Unstar'
                    : '<i class="far fa-star"></i> Star';
            }
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
        this.contextMenuTaskId = null;
    }

    populateContextMenuProjects() {
        const submenu = document.getElementById('context-menu-projects');
        if (!submenu) return;

        // Clear existing items
        submenu.innerHTML = '<div class="context-menu-item" data-action="set-project" data-project=""><i class="fas fa-times-circle"></i> No Project</div>';

        // Add projects
        this.projects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.dataset.action = 'set-project';
            item.dataset.project = project.id;
            item.innerHTML = `<i class="fas fa-folder"></i> ${escapeHtml(project.title)}`;
            submenu.appendChild(item);
        });
    }

    async handleContextMenuAction(action, data, taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        switch (action) {
            case 'edit':
                this.openTaskModal(task);
                break;

            case 'duplicate':
                this.duplicateTask(taskId);
                break;

            case 'toggle-star':
                this.saveState('Toggle task star');
                task.toggleStar();
                await this.saveTasks();
                this.renderView();
                this.showToast(task.starred ? 'Task starred' : 'Task unstarred');
                break;

            case 'set-status':
                this.saveState('Change task status');
                task.status = data.status;
                task.updatedAt = new Date().toISOString();
                await this.saveTasks();
                this.renderView();
                this.updateCounts();
                this.showToast(`Status changed to ${data.status}`);
                break;

            case 'set-energy':
                this.saveState('Change task energy');
                task.energy = data.energy;
                task.updatedAt = new Date().toISOString();
                await this.saveTasks();
                this.renderView();
                this.showToast(`Energy changed to ${data.energy || 'none'}`);
                break;

            case 'set-project':
                const projectId = data.project || null;
                this.saveState('Change task project');
                task.projectId = projectId;
                task.updatedAt = new Date().toISOString();
                await this.saveTasks();
                this.renderView();
                this.showToast(projectId ? 'Moved to project' : 'Removed from project');
                break;

            case 'add-context':
                this.addContextFromMenu(task);
                break;

            case 'remove-context':
                this.removeContextFromMenu(task);
                break;

            case 'complete':
                this.toggleTaskComplete(taskId);
                break;

            case 'delete':
                this.deleteTask(taskId);
                break;
        }
    }

    addContextFromMenu(task) {
        const allContexts = [...this.defaultContexts, ...this.getCustomContexts()];
        const usedContexts = task.contexts || [];
        const availableContexts = allContexts.filter(c => !usedContexts.includes(c));

        if (availableContexts.length === 0) {
            this.showToast('No more contexts to add');
            return;
        }

        // Simple prompt for now (could be improved with a custom modal)
        const context = prompt(`Enter context name or choose from:\n${availableContexts.join(', ')}`);

        if (!context) return;

        this.saveState('Add context to task');
        const formattedContext = context.startsWith('@') ? context : `@${context}`;
        task.contexts = task.contexts || [];
        task.contexts.push(formattedContext);
        task.updatedAt = new Date().toISOString();

        this.saveTasks();
        this.renderView();
        this.showToast(`Added ${formattedContext}`);
    }

    removeContextFromMenu(task) {
        const contexts = task.contexts || [];
        if (contexts.length === 0) {
            this.showToast('No contexts to remove');
            return;
        }

        // Simple prompt for now
        const contextList = contexts.map((c, i) => `${i + 1}. ${c}`).join('\n');
        const choice = prompt(`Enter number of context to remove:\n${contextList}`);

        if (!choice) return;

        const index = parseInt(choice) - 1;
        if (index >= 0 && index < contexts.length) {
            this.saveState('Remove context from task');
            const removed = task.contexts.splice(index, 1)[0];
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderView();
            this.showToast(`Removed ${removed}`);
        } else {
            this.showToast('Invalid choice');
        }
    }

    // ==================== DEPENDENCIES VISUALIZATION ====================

    setupDependenciesVisualization() {
        // Button to open dependencies modal
        const depsBtn = document.getElementById('btn-dependencies');
        if (depsBtn) {
            depsBtn.addEventListener('click', () => this.openDependenciesModal());
        }

        // Close modal
        const closeBtn = document.getElementById('close-dependencies-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDependenciesModal());
        }

        // View toggle buttons
        const graphViewBtn = document.getElementById('deps-view-graph');
        const chainsViewBtn = document.getElementById('deps-view-chains');
        const criticalViewBtn = document.getElementById('deps-view-critical');

        if (graphViewBtn) {
            graphViewBtn.addEventListener('click', () => {
                this.depsCurrentView = 'graph';
                this.updateDepsViewButtons();
                this.renderDependenciesView();
            });
        }

        if (chainsViewBtn) {
            chainsViewBtn.addEventListener('click', () => {
                this.depsCurrentView = 'chains';
                this.updateDepsViewButtons();
                this.renderDependenciesView();
            });
        }

        if (criticalViewBtn) {
            criticalViewBtn.addEventListener('click', () => {
                this.depsCurrentView = 'critical';
                this.updateDepsViewButtons();
                this.renderDependenciesView();
            });
        }

        // Project filter
        const projectFilter = document.getElementById('deps-filter-project');
        if (projectFilter) {
            projectFilter.addEventListener('change', () => this.renderDependenciesView());
        }

        // Initialize state
        this.depsCurrentView = 'graph';
    }

    populateDepsProjectFilter() {
        const projectFilter = document.getElementById('deps-filter-project');
        if (!projectFilter) return;

        // Keep "All Projects" option
        projectFilter.innerHTML = '<option value="">All Projects</option>';

        // Add active projects
        this.projects
            .filter(p => p.status === 'active')
            .forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.title;
                projectFilter.appendChild(option);
            });
    }

    openDependenciesModal() {
        const modal = document.getElementById('dependencies-modal');
        if (modal) {
            this.populateDepsProjectFilter();
            modal.classList.add('active');
            this.renderDependenciesView();
        }
    }

    closeDependenciesModal() {
        const modal = document.getElementById('dependencies-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    updateDepsViewButtons() {
        const buttons = {
            'graph': document.getElementById('deps-view-graph'),
            'chains': document.getElementById('deps-view-chains'),
            'critical': document.getElementById('deps-view-critical')
        };

        Object.keys(buttons).forEach(view => {
            const btn = buttons[view];
            if (btn) {
                if (view === this.depsCurrentView) {
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-primary');
                } else {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-secondary');
                }
            }
        });
    }

    renderDependenciesView() {
        const projectId = document.getElementById('deps-filter-project').value;
        const tasks = this.getDependenciesTasks(projectId);

        // Update stats
        this.updateDepsStats(tasks);

        // Render based on current view
        const container = document.getElementById('deps-content');
        if (!container) return;

        switch (this.depsCurrentView) {
            case 'graph':
                this.renderDependencyGraph(tasks, container);
                break;
            case 'chains':
                this.renderDependencyChains(tasks, container);
                break;
            case 'critical':
                this.renderCriticalPath(tasks, container);
                break;
        }
    }

    getDependenciesTasks(projectId) {
        let tasks = this.tasks.filter(t => !t.completed);

        if (projectId) {
            tasks = tasks.filter(t => t.projectId === projectId);
        }

        return tasks;
    }

    updateDepsStats(tasks) {
        const totalTasks = tasks.length;
        const withDeps = tasks.filter(t => t.waitingForTaskIds && t.waitingForTaskIds.length > 0).length;
        const blocked = tasks.filter(t => !t.areDependenciesMet(this.tasks)).length;
        const ready = tasks.filter(t => t.areDependenciesMet(this.tasks) && t.status !== 'completed').length;

        document.getElementById('deps-total-tasks').textContent = totalTasks;
        document.getElementById('deps-with-deps').textContent = withDeps;
        document.getElementById('deps-blocked').textContent = blocked;
        document.getElementById('deps-ready').textContent = ready;
    }

    renderDependencyGraph(tasks, container) {
        const tasksWithDeps = tasks.filter(t => t.waitingForTaskIds && t.waitingForTaskIds.length > 0);

        if (tasksWithDeps.length === 0) {
            container.innerHTML = `
                <div class="deps-empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h3>No Dependencies Found</h3>
                    <p>Tasks with dependencies will appear here. You can set task dependencies in the task edit modal.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="dependency-graph" id="dependency-graph">
                <svg class="dependency-lines" id="dependency-lines"></svg>
                <div id="dependency-nodes"></div>
            </div>
        `;

        const nodesContainer = document.getElementById('dependency-nodes');
        const linesContainer = document.getElementById('dependency-lines');

        // Calculate node positions using a simple layered layout
        const nodePositions = this.calculateNodePositions(tasksWithDeps);

        // Render nodes
        tasksWithDeps.forEach(task => {
            const pos = nodePositions[task.id];
            if (!pos) return;

            const isBlocked = !task.areDependenciesMet(this.tasks);
            const nodeClass = `dependency-node ${isBlocked ? 'blocked' : 'ready'}`;

            const node = document.createElement('div');
            node.className = nodeClass;
            node.style.left = `${pos.x}px`;
            node.style.top = `${pos.y}px`;
            node.innerHTML = `
                <div class="dependency-node-title">${escapeHtml(task.title)}</div>
                <div class="dependency-node-meta">
                    ${task.waitingForTaskIds.length} dependenc${task.waitingForTaskIds.length > 1 ? 'ies' : 'y'}
                </div>
            `;
            node.addEventListener('click', () => this.openTaskModal(task));
            nodesContainer.appendChild(node);
        });

        // Render connection lines
        setTimeout(() => {
            this.renderDependencyLines(tasksWithDeps, nodePositions, linesContainer);
        }, 100);
    }

    calculateNodePositions(tasks) {
        const positions = {};
        const levels = {};
        const levelGroups = {};

        // Calculate levels for each task (topological sort)
        tasks.forEach(task => {
            levels[task.id] = this.calculateTaskLevel(task, tasks);
        });

        // Group by levels
        tasks.forEach(task => {
            const level = levels[task.id];
            if (!levelGroups[level]) {
                levelGroups[level] = [];
            }
            levelGroups[level].push(task);
        });

        // Calculate positions
        const nodeWidth = 180;
        const nodeHeight = 80;
        const horizontalGap = 40;
        const verticalGap = 120;
        let maxWidth = 0;

        Object.keys(levelGroups).sort((a, b) => a - b).forEach(level => {
            const tasksInLevel = levelGroups[level];
            const levelWidth = tasksInLevel.length * (nodeWidth + horizontalGap);
            maxWidth = Math.max(maxWidth, levelWidth);

            tasksInLevel.forEach((task, index) => {
                const x = index * (nodeWidth + horizontalGap) + (maxWidth - levelWidth) / 2;
                const y = level * (nodeHeight + verticalGap) + 50;
                positions[task.id] = { x, y };
            });
        });

        return positions;
    }

    calculateTaskLevel(task, allTasks) {
        if (!task.waitingForTaskIds || task.waitingForTaskIds.length === 0) {
            return 0;
        }

        const dependencies = task.waitingForTaskIds
            .map(id => allTasks.find(t => t.id === id))
            .filter(t => t && !t.completed);

        if (dependencies.length === 0) {
            return 0;
        }

        const depLevels = dependencies.map(dep => this.calculateTaskLevel(dep, allTasks));
        return Math.max(...depLevels) + 1;
    }

    renderDependencyLines(tasks, positions, container) {
        const graphContainer = document.getElementById('dependency-graph');
        if (!graphContainer) return;

        const rect = graphContainer.getBoundingClientRect();
        container.setAttribute('width', rect.width);
        container.setAttribute('height', Math.max(rect.height, 600));

        let linesHTML = '';
        tasks.forEach(task => {
            const targetPos = positions[task.id];
            if (!targetPos) return;

            if (task.waitingForTaskIds) {
                task.waitingForTaskIds.forEach(depId => {
                    const depTask = this.tasks.find(t => t.id === depId);
                    if (!depTask) return;

                    const sourcePos = positions[depId];
                    if (!sourcePos) return;

                    // Calculate line coordinates (center of nodes)
                    const x1 = sourcePos.x + 90; // Half of node width
                    const y1 = sourcePos.y + 40; // Half of node height
                    const x2 = targetPos.x + 90;
                    const y2 = targetPos.y + 40;

                    // Create curved path
                    const midY = (y1 + y2) / 2;
                    const pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

                    const isBlocked = !depTask.completed;
                    const lineClass = `dependency-line ${isBlocked ? 'blocked' : 'completed'}`;

                    linesHTML += `<path class="${lineClass}" d="${pathData}"/>`;
                });
            }
        });

        container.innerHTML = linesHTML;
    }

    renderDependencyChains(tasks, container) {
        const chains = this.buildDependencyChains(tasks);

        if (chains.length === 0) {
            container.innerHTML = `
                <div class="deps-empty-state">
                    <i class="fas fa-stream"></i>
                    <h3>No Dependency Chains Found</h3>
                    <p>Tasks with sequential dependencies will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="dependency-chains">
                ${chains.map(chain => this.renderChain(chain)).join('')}
            </div>
        `;
    }

    buildDependencyChains(tasks) {
        const visited = new Set();
        const chains = [];

        const buildChain = (task, currentChain = []) => {
            if (visited.has(task.id)) {
                if (currentChain.length > 1) {
                    chains.push([...currentChain]);
                }
                return;
            }

            visited.add(task.id);
            currentChain.push(task);

            // Find tasks that depend on this task
            const dependents = tasks.filter(t =>
                t.waitingForTaskIds && t.waitingForTaskIds.includes(task.id)
            );

            if (dependents.length === 0) {
                if (currentChain.length > 1) {
                    chains.push([...currentChain]);
                }
            } else {
                dependents.forEach(dep => buildChain(dep, currentChain));
            }

            currentChain.pop();
        };

        // Start from tasks with no dependencies (root nodes)
        tasks.filter(t => !t.waitingForTaskIds || t.waitingForTaskIds.length === 0).forEach(task => {
            if (!visited.has(task.id)) {
                buildChain(task);
            }
        });

        return chains.sort((a, b) => b.length - a.length);
    }

    renderChain(chain) {
        const firstUncompleted = chain.findIndex(t => !t.completed);

        return `
            <div class="dependency-chain">
                <div class="dependency-chain-header">
                    <span class="dependency-chain-title">
                        ${escapeHtml(chain[0].title)} → ${escapeHtml(chain[chain.length - 1].title)}
                    </span>
                    <span class="dependency-chain-length">${chain.length} tasks</span>
                </div>
                <div class="dependency-chain-items">
                    ${chain.map((task, index) => {
                        let itemClass = 'dependency-chain-item';
                        if (task.completed) itemClass += ' completed';
                        else if (index === firstUncompleted) itemClass += ' current';

                        return `
                            <div class="${itemClass}" onclick="app.openTaskModal(app.tasks.find(t => t.id === '${task.id}'))">
                                <div style="font-weight: 600; margin-bottom: 4px;">
                                    ${index + 1}. ${escapeHtml(task.title)}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                                    ${task.completed ? '✓ Completed' : task.areDependenciesMet(this.tasks) ? 'Ready to start' : 'Blocked'}
                                </div>
                            </div>
                            ${index < chain.length - 1 ? '<div class="dependency-chain-arrow">→</div>' : ''}
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderCriticalPath(tasks, container) {
        const criticalPath = this.calculateCriticalPath(tasks);

        if (criticalPath.length === 0) {
            container.innerHTML = `
                <div class="deps-empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No Critical Path Found</h3>
                    <p>The critical path shows the longest chain of dependent tasks that determines project duration.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="critical-path">
                <div class="critical-path-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span class="critical-path-title">Critical Path</span>
                </div>
                <div class="critical-path-timeline">
                    ${criticalPath.map((task, index) => `
                        <div class="critical-path-item ${task.completed ? 'completed' : ''}" style="position: relative;">
                            ${index < criticalPath.length - 1 ? '<div class="critical-path-connector"></div>' : ''}
                            <div class="critical-path-item-title">${escapeHtml(task.title)}</div>
                            <div class="critical-path-item-meta">
                                ${task.completed ? '✓ Completed' : `⏱️ ${task.time || 0} min • Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}`}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calculateCriticalPath(tasks) {
        // Build dependency graph
        const graph = {};
        const inDegree = {};

        tasks.forEach(task => {
            graph[task.id] = [];
            inDegree[task.id] = 0;
        });

        tasks.forEach(task => {
            if (task.waitingForTaskIds) {
                task.waitingForTaskIds.forEach(depId => {
                    if (graph[depId]) {
                        graph[depId].push(task);
                        inDegree[task.id]++;
                    }
                });
            }
        });

        // Find all paths and return the longest one
        const allPaths = [];
        const visited = new Set();

        const dfs = (taskId, path) => {
            visited.add(taskId);
            const task = tasks.find(t => t.id === taskId);
            if (task) path.push(task);

            const dependents = graph[taskId] || [];
            if (dependents.length === 0) {
                if (path.length > 1) {
                    allPaths.push([...path]);
                }
            } else {
                dependents.forEach(dep => {
                    if (!visited.has(dep.id)) {
                        dfs(dep.id, path);
                    }
                });
            }

            path.pop();
            visited.delete(taskId);
        };

        // Start from root nodes (no incoming edges)
        tasks.filter(t => inDegree[t.id] === 0).forEach(task => {
            dfs(task.id, []);
        });

        // Return the longest path
        if (allPaths.length === 0) return [];
        return allPaths.sort((a, b) => b.length - a.length)[0];
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

        // Initialize all days with 0
        while (currentDate <= endDate) {
            const dateKey = this.getDateKey(currentDate);
            data[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Count completed tasks per day
        this.tasks.forEach(task => {
            if (task.completed && task.completedAt) {
                const completedDate = new Date(task.completedAt);
                const dateKey = this.getDateKey(completedDate);
                if (data.hasOwnProperty(dateKey)) {
                    data[dateKey]++;
                }
            }
        });

        return data;
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    updateHeatmapStats(completionData) {
        const values = Object.values(completionData);
        const totalCompleted = values.reduce((sum, count) => sum + count, 0);
        const bestDay = Math.max(...values);
        const daysWithData = values.filter(v => v > 0).length;
        const avgPerDay = daysWithData > 0 ? Math.round(totalCompleted / daysWithData * 10) / 10 : 0;

        // Calculate current streak
        const streak = this.calculateCurrentStreak(completionData);

        document.getElementById('heatmap-total-completed').textContent = totalCompleted;
        document.getElementById('heatmap-best-day').textContent = bestDay;
        document.getElementById('heatmap-avg-day').textContent = avgPerDay;
        document.getElementById('heatmap-streak').textContent = streak;
    }

    calculateCurrentStreak(completionData) {
        let streak = 0;
        const today = new Date();
        const checkDate = new Date(today);

        while (true) {
            const dateKey = this.getDateKey(checkDate);
            if (completionData[dateKey] > 0) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (dateKey === this.getDateKey(today)) {
                // Today has no completions yet, check yesterday
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    renderHeatmapGrid(completionData, days, container) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Find the max value for normalization
        const maxCount = Math.max(...Object.values(completionData), 1);

        // Create day labels
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayLabelsHTML = dayLabels.map((day, index) => {
            if (index % 2 === 1) { // Show every other day
                return `<div class="heatmap-day-label">${day}</div>`;
            }
            return '<div class="heatmap-day-label"></div>';
        }).join('');

        // Create cells
        let cellsHTML = '';
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = this.getDateKey(currentDate);
            const count = completionData[dateKey] || 0;
            const level = this.getHeatmapLevel(count, maxCount);
            const formattedDate = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            cellsHTML += `<div class="heatmap-cell level-${level}" data-date="${formattedDate}" data-count="${count}"></div>`;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Create month labels
        const monthLabelsHTML = this.createMonthLabels(startDate, endDate);

        container.innerHTML = `
            <div class="heatmap-wrapper">
                <div class="heatmap-day-labels">${dayLabelsHTML}</div>
                <div>
                    <div class="heatmap-grid">${cellsHTML}</div>
                    <div class="heatmap-month-labels">${monthLabelsHTML}</div>
                </div>
            </div>
        `;

        // Add tooltip functionality
        this.setupHeatmapTooltips();
    }

    getHeatmapLevel(count, maxCount) {
        if (count === 0) return 0;
        if (maxCount <= 4) {
            return Math.min(count, 4);
        }
        const percentage = count / maxCount;
        if (percentage < 0.25) return 1;
        if (percentage < 0.5) return 2;
        if (percentage < 0.75) return 3;
        return 4;
    }

    createMonthLabels(startDate, endDate) {
        const labels = [];
        const currentMonth = new Date(startDate);
        currentMonth.setDate(1); // Set to first of month

        let weekIndex = 0;
        let weeksInMonth = 0;

        while (currentMonth <= endDate) {
            const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
            weeksInMonth = Math.ceil(daysInMonth / 7);

            const monthName = currentMonth.toLocaleDateString('en-US', { month: 'short' });
            const leftPos = weekIndex * 15 + 8; // 15px per week, 8px offset

            labels.push(`<span class="heatmap-month-label" style="left: ${leftPos}px;">${monthName}</span>`);

            weekIndex += weeksInMonth;
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }

        return labels.join('');
    }

    setupHeatmapTooltips() {
        const cells = document.querySelectorAll('.heatmap-cell');
        let tooltip = null;

        cells.forEach(cell => {
            cell.addEventListener('mouseenter', (e) => {
                const date = e.target.dataset.date;
                const count = e.target.dataset.count;

                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.className = 'heatmap-tooltip';
                    document.body.appendChild(tooltip);
                }

                tooltip.innerHTML = `<strong>${count}</strong> tasks completed on ${date}`;
                tooltip.style.display = 'block';

                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = `${rect.left + rect.width / 2}px`;
                tooltip.style.top = `${rect.top - 40}px`;
                tooltip.style.transform = 'translateX(-50%)';
            });

            cell.addEventListener('mouseleave', () => {
                if (tooltip) {
                    tooltip.style.display = 'none';
                }
            });
        });
    }

    // ==================== GLOBAL QUICK CAPTURE ====================

    setupGlobalQuickCapture() {
        // Global hotkey listener (Alt+N)
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                this.openGlobalQuickCapture();
            }
        });

        // Close overlay
        const closeBtn = document.getElementById('close-global-quick-capture');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeGlobalQuickCapture());
        }

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('global-quick-capture-overlay');
                if (overlay && overlay.style.display !== 'none') {
                    this.closeGlobalQuickCapture();
                }
            }
        });

        // Handle input
        const input = document.getElementById('global-quick-capture-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    this.handleGlobalQuickCapture(input.value.trim());
                }
            });

            input.addEventListener('keydown', (e) => {
                // Press T to show templates
                if (e.key === 't' || e.key === 'T') {
                    e.preventDefault();
                    this.toggleQuickCaptureTemplates();
                }
            });
        }

        // Close on overlay click
        const overlay = document.getElementById('global-quick-capture-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeGlobalQuickCapture();
                }
            });
        }
    }

    openGlobalQuickCapture() {
        const overlay = document.getElementById('global-quick-capture-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            const input = document.getElementById('global-quick-capture-input');
            if (input) {
                input.value = '';
                input.focus();
            }
            // Hide templates initially
            const templates = document.getElementById('global-quick-capture-templates');
            if (templates) {
                templates.style.display = 'none';
            }
        }
    }

    closeGlobalQuickCapture() {
        const overlay = document.getElementById('global-quick-capture-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    handleGlobalQuickCapture(input) {
        // Parse the input with enhanced NLP
        const taskData = this.parseQuickCaptureInput(input);

        // Create the task
        const task = new Task(taskData);
        this.tasks.unshift(task);
        this.saveTasks();
        this.renderView();
        this.updateCounts();

        this.closeGlobalQuickCapture();
        this.showToast('Task captured!');

        // Save state for undo
        this.saveState('Quick capture task');
    }

    parseQuickCaptureInput(input) {
        const taskData = {
            title: input,
            status: 'inbox'
        };

        // Extract contexts (@work, @home, etc.)
        const contextMatches = input.match(/@(\w+)/g);
        if (contextMatches) {
            taskData.contexts = contextMatches.map(c => c.startsWith('@') ? c : '@' + c);
            taskData.title = input.replace(/@\w+/g, '').trim();
        }

        // Extract energy (!high, !medium, !low)
        const energyMatch = input.match(/!(high|medium|low)/i);
        if (energyMatch) {
            taskData.energy = energyMatch[1].toLowerCase();
            taskData.title = taskData.title.replace(/!high|!medium|!low/gi, '').trim();
        }

        // Extract project (#projectname)
        const projectMatch = input.match(/#(\w+)/);
        if (projectMatch) {
            const projectName = projectMatch[1];
            const project = this.projects.find(p => p.title.toLowerCase() === projectName.toLowerCase());
            if (project) {
                taskData.projectId = project.id;
            }
            taskData.title = taskData.title.replace(/#\w+/g, '').trim();
        }

        // Extract dates (today, tomorrow, in X days)
        const lowerTitle = taskData.title.toLowerCase();

        if (lowerTitle.includes('today') || lowerTitle.includes('due today')) {
            taskData.dueDate = new Date().toISOString().split('T')[0];
            taskData.title = taskData.title.replace(/today|due today/gi, '').trim();
        } else if (lowerTitle.includes('tomorrow') || lowerTitle.includes('due tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            taskData.dueDate = tomorrow.toISOString().split('T')[0];
            taskData.title = taskData.title.replace(/tomorrow|due tomorrow/gi, '').trim();
        }

        // Extract "in X days"
        const inDaysMatch = lowerTitle.match(/in\s+(\d+)\s+days?/);
        if (inDaysMatch) {
            const days = parseInt(inDaysMatch[1]);
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + days);
            taskData.dueDate = targetDate.toISOString().split('T')[0];
            taskData.title = taskData.title.replace(/in\s+\d+\s+days?/gi, '').trim();
        }

        return taskData;
    }

    toggleQuickCaptureTemplates() {
        const templatesDiv = document.getElementById('global-quick-capture-templates');
        const listDiv = document.getElementById('global-quick-capture-templates-list');

        if (!templatesDiv || !listDiv) return;

        if (templatesDiv.style.display === 'none') {
            // Render templates
            this.renderQuickCaptureTemplates(listDiv);
            templatesDiv.style.display = 'block';
        } else {
            templatesDiv.style.display = 'none';
        }
    }

    renderQuickCaptureTemplates(container) {
        if (this.templates.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No templates available. Create some in the Templates modal!</p>';
            return;
        }

        container.innerHTML = this.templates.map(template => `
            <button onclick="app.selectTemplateForQuickCapture('${template.id}')">
                <h4>${escapeHtml(template.title)}</h4>
                ${template.description ? `<p>${escapeHtml(template.description)}</p>` : ''}
                <div style="margin-top: var(--spacing-xs); font-size: 0.75rem; color: var(--text-secondary);">
                    ${template.category ? `<span style="background: var(--primary-color); color: white; padding: 2px 6px; border-radius: 4px;">${template.category}</span>` : ''}
                </div>
            </button>
        `).join('');
    }

    selectTemplateForQuickCapture(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        // Create task from template
        const task = template.createTask();
        this.tasks.unshift(task);
        this.saveTasks();
        this.renderView();
        this.updateCounts();

        this.closeGlobalQuickCapture();
        this.showToast(`Created task from template: ${template.title}`);
    }

    // ==================== TASK PRIORITY SCORING ====================

    /**
     * Calculate automatic priority score (0-100) for a task
     * Higher score = higher priority
     */
    calculatePriorityScore(task) {
        if (!task || task.completed) return 0;

        let score = 50; // Base score
        const reasons = [];

        // Factor 1: Due date urgency (0-25 points)
        if (task.dueDate) {
            const daysUntilDue = this.getDaysUntilDue(task);
            if (daysUntilDue < 0) {
                score += 25;
                reasons.push('Overdue');
            } else if (daysUntilDue === 0) {
                score += 20;
                reasons.push('Due today');
            } else if (daysUntilDue === 1) {
                score += 15;
                reasons.push('Due tomorrow');
            } else if (daysUntilDue <= 3) {
                score += 10;
                reasons.push('Due soon');
            } else if (daysUntilDue <= 7) {
                score += 5;
            }
        }

        // Factor 2: Starred tasks (0-15 points)
        if (task.starred) {
            score += 15;
            reasons.push('Starred');
        }

        // Factor 3: Task status priority (0-10 points)
        if (task.status === 'next') {
            score += 10;
            reasons.push('Next Action');
        } else if (task.status === 'inbox') {
            score += 5;
        }

        // Factor 4: Dependencies (0-10 points)
        if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
            if (task.areDependenciesMet(this.tasks)) {
                score += 10;
                reasons.push('Ready to start');
            } else {
                score -= 10;
                reasons.push('Blocked');
            }
        }

        // Factor 5: Energy vs available time (0-8 points)
        if (task.energy && task.time) {
            // Quick high-energy tasks get boost
            if (task.energy === 'high' && task.time <= 15) {
                score += 8;
                reasons.push('Quick & high energy');
            } else if (task.energy === 'low' && task.time > 60) {
                // Long low-energy tasks get lower priority
                score -= 5;
            }
        }

        // Factor 6: Time estimate (0-5 points)
        if (task.time) {
            if (task.time <= 5) {
                score += 5;
                reasons.push('Quick task');
            } else if (task.time <= 15) {
                score += 3;
            }
        }

        // Factor 7: Project priority (0-5 points)
        if (task.projectId) {
            const project = this.projects.find(p => p.id === task.projectId);
            if (project && project.status === 'active') {
                score += 5;
                reasons.push('Active project');
            }
        }

        // Factor 8: Defer date (0-20 points penalty)
        if (task.deferDate && !task.isAvailable()) {
            score -= 20;
            reasons.push('Deferred');
        }

        // Factor 9: Age of task (0-7 points)
        const daysSinceCreated = Math.floor((new Date() - new Date(task.createdAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceCreated > 30) {
            score += 7;
            reasons.push('Old task');
        } else if (daysSinceCreated > 14) {
            score += 5;
        } else if (daysSinceCreated > 7) {
            score += 3;
        }

        // Ensure score is within 0-100 range
        score = Math.max(0, Math.min(100, score));

        return score;
    }

    /**
     * Get priority score color class
     */
    getPriorityScoreColor(score) {
        if (score >= 80) return 'var(--danger-color)'; // High priority - red
        if (score >= 60) return '#f39c12'; // Medium-high - orange
        if (score >= 40) return 'var(--warning-color)'; // Medium - yellow
        if (score >= 20) return 'var(--info-color)'; // Low - blue
        return 'var(--text-secondary)'; // Very low - gray
    }

    /**
     * Get priority label
     */
    getPriorityLabel(score) {
        if (score >= 80) return 'Urgent';
        if (score >= 60) return 'High';
        if (score >= 40) return 'Medium';
        if (score >= 20) return 'Low';
        return 'Very Low';
    }

    // ==================== SMART DATE SUGGESTIONS ====================

    setupSmartDateSuggestions() {
        const dueDateInput = document.getElementById('task-due-date');
        const deferDateInput = document.getElementById('task-defer-date');

        if (dueDateInput) {
            this.setupDateInputSuggestions(dueDateInput);
        }

        if (deferDateInput) {
            this.setupDateInputSuggestions(deferDateInput);
        }
    }

    setupDateInputSuggestions(input) {
        // Create suggestion dropdown
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'date-suggestions';
        suggestionsDiv.style.cssText = `
            display: none;
            position: absolute;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            margin-top: 4px;
        `;

        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(suggestionsDiv);

        // Show suggestions on input
        input.addEventListener('input', () => {
            const value = input.value.trim();
            if (!value) {
                suggestionsDiv.style.display = 'none';
                return;
            }

            const suggestions = this.parseNaturalDate(value);
            if (suggestions.length > 0) {
                suggestionsDiv.innerHTML = suggestions.map(s => `
                    <div class="date-suggestion" data-date="${s.date}" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color);">
                        <div style="font-weight: 500;">${s.text}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${s.displayDate}</div>
                    </div>
                `).join('');
                suggestionsDiv.style.display = 'block';

                // Add click handlers
                suggestionsDiv.querySelectorAll('.date-suggestion').forEach(suggestion => {
                    suggestion.addEventListener('click', () => {
                        input.value = suggestion.dataset.date;
                        suggestionsDiv.style.display = 'none';
                    });
                });
            } else {
                suggestionsDiv.style.display = 'none';
            }
        });

        // Hide suggestions on blur
        input.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionsDiv.style.display = 'none';
            }, 200);
        });

        // Hide on escape
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                suggestionsDiv.style.display = 'none';
            }
        });
    }

    parseNaturalDate(input) {
        const suggestions = [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Parse input patterns
        const lowerInput = input.toLowerCase();

        // "in X days"
        const inDaysMatch = lowerInput.match(/^in\s+(\d+)\s+days?$/);
        if (inDaysMatch) {
            const days = parseInt(inDaysMatch[1]);
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + days);
            suggestions.push({
                text: `In ${days} day${days > 1 ? 's' : ''}`,
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
            });
        }

        // "in X weeks"
        const inWeeksMatch = lowerInput.match(/^in\s+(\d+)\s+weeks?$/);
        if (inWeeksMatch) {
            const weeks = parseInt(inWeeksMatch[1]);
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + (weeks * 7));
            suggestions.push({
                text: `In ${weeks} week${weeks > 1 ? 's' : ''}`,
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
            });
        }

        // "in X months"
        const inMonthsMatch = lowerInput.match(/^in\s+(\d+)\s+months?$/);
        if (inMonthsMatch) {
            const months = parseInt(inMonthsMatch[1]);
            const targetDate = new Date(today);
            targetDate.setMonth(targetDate.getMonth() + months);
            suggestions.push({
                text: `In ${months} month${months > 1 ? 's' : ''}`,
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
            });
        }

        // "tomorrow"
        if (lowerInput === 'tomorrow') {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + 1);
            suggestions.push({
                text: 'Tomorrow',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
            });
        }

        // "next week" / "next monday"
        const nextWeekMatch = lowerInput.match(/^next\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
        if (nextWeekMatch) {
            const target = nextWeekMatch[1];
            const targetDate = new Date(today);

            if (target === 'week') {
                // Next Monday
                const daysUntilMonday = (8 - targetDate.getDay()) % 7 || 7;
                targetDate.setDate(targetDate.getDate() + daysUntilMonday);
                suggestions.push({
                    text: 'Next week (Monday)',
                    date: targetDate.toISOString().split('T')[0],
                    displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                });
            } else {
                // Specific day
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const targetDay = days.indexOf(target);
                const daysUntil = (targetDay - targetDate.getDay() + 7) % 7 || 7;
                targetDate.setDate(targetDate.getDate() + daysUntil);
                suggestions.push({
                    text: `Next ${target.charAt(0).toUpperCase() + target.slice(1)}`,
                    date: targetDate.toISOString().split('T')[0],
                    displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                });
            }
        }

        // "this week" / "this monday"
        const thisWeekMatch = lowerInput.match(/^this\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
        if (thisWeekMatch) {
            const target = thisWeekMatch[1];
            const targetDate = new Date(today);

            if (target === 'week') {
                suggestions.push({
                    text: 'This week',
                    date: targetDate.toISOString().split('T')[0],
                    displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                });
            } else {
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const targetDay = days.indexOf(target);
                const daysUntil = (targetDay - targetDate.getDay() + 7) % 7;
                targetDate.setDate(targetDate.getDate() + daysUntil);
                suggestions.push({
                    text: `This ${target.charAt(0).toUpperCase() + target.slice(1)}`,
                    date: targetDate.toISOString().split('T')[0],
                    displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                });
            }
        }

        // "end of month"
        if (lowerInput === 'end of month' || lowerInput === 'eom') {
            const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            suggestions.push({
                text: 'End of month',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            });
        }

        // "end of week"
        if (lowerInput === 'end of week' || lowerInput === 'eow') {
            const targetDate = new Date(today);
            const daysUntilSunday = (7 - targetDate.getDay()) % 7;
            targetDate.setDate(targetDate.getDate() + daysUntilSunday);
            suggestions.push({
                text: 'End of week (Sunday)',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
            });
        }

        // "start of month"
        if (lowerInput === 'start of month' || lowerInput === 'som') {
            const targetDate = new Date(today.getFullYear(), today.getMonth(), 1);
            // If today is start of month, use next month
            if (targetDate.getTime() === today.getTime()) {
                targetDate.setMonth(targetDate.getMonth() + 1);
            }
            suggestions.push({
                text: 'Start of month',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            });
        }

        // "start of week"
        if (lowerInput === 'start of week' || lowerInput === 'sow') {
            const targetDate = new Date(today);
            const daysUntilMonday = (1 - targetDate.getDay() + 7) % 7;
            if (daysUntilMonday === 0) daysUntilMonday = 7; // Next Monday if today is Monday
            targetDate.setDate(targetDate.getDate() + daysUntilMonday);
            suggestions.push({
                text: 'Start of week (Monday)',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
            });
        }

        return suggestions;
    }

    // ==================== UNDO/REDO SYSTEM ====================

    setupUndoRedo() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Y or Ctrl+Shift+Z for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
        });

        // Button listeners
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');

        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }

        this.updateUndoRedoButtons();
    }

    saveState(action) {
        // Save current state to history
        const state = {
            action: action,
            tasks: JSON.parse(JSON.stringify(this.tasks.map(t => t.toJSON()))),
            projects: JSON.parse(JSON.stringify(this.projects.map(p => p.toJSON()))),
            timestamp: new Date().toISOString()
        };

        // Remove any states after current index (we're creating a new branch)
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add new state
        this.history.push(state);
        this.historyIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateUndoRedoButtons();
    }

    async undo() {
        if (this.historyIndex <= 0) return;

        this.historyIndex--;
        const state = this.history[this.historyIndex];

        // Restore state
        this.tasks = state.tasks.map(t => Task.fromJSON(t));
        this.projects = state.projects.map(p => Project.fromJSON(p));

        await this.saveTasks();
        await this.saveProjects();
        this.renderView();
        this.updateCounts();
        this.renderProjectsDropdown();
        this.updateUndoRedoButtons();

        this.showNotification(`Undid: ${state.action}`);
    }

    async redo() {
        if (this.historyIndex >= this.history.length - 1) return;

        this.historyIndex++;
        const state = this.history[this.historyIndex];

        // Restore state
        this.tasks = state.tasks.map(t => Task.fromJSON(t));
        this.projects = state.projects.map(p => Project.fromJSON(p));

        await this.saveTasks();
        await this.saveProjects();
        this.renderView();
        this.updateCounts();
        this.renderProjectsDropdown();
        this.updateUndoRedoButtons();

        this.showNotification(`Redid: ${state.action}`);
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');

        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
            undoBtn.style.opacity = this.historyIndex <= 0 ? '0.5' : '1';
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
            redoBtn.style.opacity = this.historyIndex >= this.history.length - 1 ? '0.5' : '1';
        }
    }

    showNotification(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--text-primary);
            color: var(--bg-primary);
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;
        document.body.appendChild(toast);

        // Announce to screen readers
        announce(message, 'polite');

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // ==================== QUICK CAPTURE WIDGET ====================

    setupQuickCapture() {
        const toggleBtn = document.getElementById('quick-capture-toggle');
        const panel = document.getElementById('quick-capture-panel');
        const input = document.getElementById('quick-capture-input');
        const contextsContainer = document.getElementById('quick-capture-contexts');

        if (!toggleBtn || !panel || !input) return;

        // Toggle panel visibility
        toggleBtn.addEventListener('click', () => {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
            toggleBtn.classList.toggle('active', !isVisible);

            if (!isVisible) {
                input.focus();
                this.renderQuickCaptureContexts();
            }
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quick-capture-widget')) {
                panel.style.display = 'none';
                toggleBtn.classList.remove('active');
            }
        });

        // Handle input
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const title = input.value.trim();
                if (title) {
                    await this.quickAddTask(title);
                    input.value = '';
                    this.showNotification('Task captured!');
                }
            }
        });

        // Handle escape key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                panel.style.display = 'none';
                toggleBtn.classList.remove('active');
            }
        });
    }

    renderQuickCaptureContexts() {
        const container = document.getElementById('quick-capture-contexts');
        const input = document.getElementById('quick-capture-input');

        if (!container || !input) return;

        container.innerHTML = '';

        // Get all contexts (default + custom)
        const allContexts = [...this.defaultContexts];
        const customContexts = JSON.parse(localStorage.getItem('gtd_custom_contexts') || '[]');
        customContexts.forEach(ctx => {
            if (!allContexts.includes(ctx)) allContexts.push(ctx);
        });

        // Render context buttons
        allContexts.forEach(context => {
            const btn = document.createElement('button');
            btn.className = 'quick-capture-context';
            btn.textContent = context;
            btn.addEventListener('click', () => {
                const currentValue = input.value;
                input.value = currentValue + (currentValue ? ' ' : '') + context;
                input.focus();
            });
            container.appendChild(btn);
        });
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

        // Auto-start timer when entering focus mode
        this.resetPomodoro();
        this.focusModeStartTime = new Date(); // Track when we started focusing

        // Show focus overlay
        const focusOverlay = document.getElementById('focus-mode-overlay');
        if (focusOverlay) {
            focusOverlay.style.display = 'flex';
        }

        this.renderFocusTask(task);

        // Auto-start the Pomodoro timer
        this.startPomodoro();
        this.showToast('Focus mode activated! Timer started automatically.');
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
        // Auto-track time spent
        this.autoTrackTimeSpent();

        this.pausePomodoro();
        const focusOverlay = document.getElementById('focus-mode-overlay');
        if (focusOverlay) {
            focusOverlay.style.display = 'none';
        }
        this.focusTaskId = null;
        this.focusModeStartTime = null;
        this.renderView();
    }

    async autoTrackTimeSpent() {
        if (!this.focusTaskId || !this.focusModeStartTime) return;

        const task = this.tasks.find(t => t.id === this.focusTaskId);
        if (!task) return;

        // Calculate time spent (in minutes)
        const endTime = new Date();
        const timeSpentMinutes = Math.round((endTime - this.focusModeStartTime) / (1000 * 60));

        if (timeSpentMinutes > 0) {
            task.timeSpent = (task.timeSpent || 0) + timeSpentMinutes;
            task.updatedAt = new Date().toISOString();
            await this.saveTasks();
            this.showToast(`Tracked ${timeSpentMinutes} minutes on "${task.title}"`);
        }
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
        // Auto-track time before completing
        await this.autoTrackTimeSpent();

        // Auto-stop timer
        this.pausePomodoro();

        await this.toggleTaskComplete(taskId);
        this.exitFocusMode();
        this.showToast('Task completed! Timer stopped automatically.');
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

        // Sort based on selected sort option
        const sortOption = this.advancedSearchFilters.sort || 'updated';
        filteredTasks.sort((a, b) => {
            // First sort by starred status (starred tasks first)
            if (a.starred !== b.starred) {
                return a.starred ? -1 : 1;
            }

            // Then sort by position if set
            if (a.position !== b.position) {
                return a.position - b.position;
            }

            // Then apply selected sort
            switch (sortOption) {
                case 'due':
                    // Sort by due date (tasks without due dates last)
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);

                case 'created':
                    // Sort by creation date
                    return new Date(b.createdAt) - new Date(a.createdAt);

                case 'time':
                    // Sort by time estimate (longer tasks first)
                    if (!a.time && !b.time) return 0;
                    if (!a.time) return 1;
                    if (!b.time) return -1;
                    return b.time - a.time;

                case 'title':
                    // Sort alphabetically by title
                    return a.title.localeCompare(b.title);

                case 'updated':
                default:
                    // Sort by last updated date (default)
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
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

        // Format due date for display with countdown
        let dueDateDisplay = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            let dueLabel = '';
            let daysRemaining = 0;
            let countdownBadge = '';

            // Calculate days remaining
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            daysRemaining = daysDiff;

            if (task.isDueToday()) {
                dueLabel = 'Today';
            } else if (task.isDueWithin(7)) {
                dueLabel = dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            } else {
                dueLabel = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            // Add countdown badge for future tasks
            if (!task.completed && daysRemaining >= 1 && daysRemaining <= 14) {
                let badgeColor = 'var(--success-color)';
                if (daysRemaining <= 2) {
                    badgeColor = 'var(--danger-color)';
                } else if (daysRemaining <= 5) {
                    badgeColor = '#f39c12';
                } else if (daysRemaining <= 7) {
                    badgeColor = 'var(--warning-color)';
                }

                countdownBadge = `<span class="days-remaining-badge" style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 4px;">
                    Due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}
                </span>`;
            }

            const isOverdue = task.isOverdue();
            dueDateDisplay = `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                <i class="fas fa-calendar${isOverdue ? '-times' : '-day'}"></i> ${dueLabel}${countdownBadge}
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
                    ${!task.completed ? `<span class="priority-score" style="background: ${this.getPriorityScoreColor(this.calculatePriorityScore(task))};" title="Priority: ${this.getPriorityLabel(this.calculatePriorityScore(task))}">${this.calculatePriorityScore(task)}</span>` : ''}
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
                <button class="task-action-btn star" title="Star task" ${task.starred ? 'style="color: #ffd700;"' : ''}>
                    <i class="fas fa-star"></i>
                </button>
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

        const starBtn = div.querySelector('.task-action-btn.star');
        if (starBtn) {
            starBtn.addEventListener('click', async () => {
                this.saveState('Toggle task star');
                task.toggleStar();
                await this.saveTasks();
                this.renderView();
            });
        }

        const editBtn = div.querySelector('.task-action-btn.edit');
        editBtn.addEventListener('click', () => this.openTaskModal(task));

        const duplicateBtn = div.querySelector('.task-action-btn.duplicate');
        duplicateBtn.addEventListener('click', () => this.duplicateTask(task.id));

        const deleteBtn = div.querySelector('.task-action-btn.delete');
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        // Inline edit functionality - double-click on title
        const titleElement = div.querySelector('.task-title');
        if (titleElement) {
            titleElement.style.cursor = 'pointer';
            titleElement.title = 'Double-click to edit';

            titleElement.addEventListener('dblclick', () => {
                this.enableInlineEdit(task, titleElement);
            });
        }

        return div;
    }

    enableInlineEdit(task, titleElement) {
        const currentTitle = task.title;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'inline-edit-input';
        input.style.cssText = `
            width: 100%;
            padding: 4px 8px;
            border: 2px solid var(--primary-color);
            border-radius: var(--radius-sm);
            font-size: inherit;
            font-family: inherit;
            background: var(--bg-primary);
            color: var(--text-primary);
            outline: none;
        `;

        // Replace title with input
        titleElement.innerHTML = '';
        titleElement.appendChild(input);
        input.focus();
        input.select();

        // Save on blur or Enter
        const save = async () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== currentTitle) {
                this.saveState('Edit task title');
                task.title = newTitle;
                task.updatedAt = new Date().toISOString();
                await this.saveTasks();
                this.renderView();
                this.showToast('Task updated');
            } else {
                // Revert if no change
                titleElement.textContent = currentTitle;
                titleElement.style.cursor = 'pointer';
                titleElement.title = 'Double-click to edit';
            }
        };

        // Cancel on Escape
        const cancel = () => {
            titleElement.textContent = currentTitle;
            titleElement.style.cursor = 'pointer';
            titleElement.title = 'Double-click to edit';
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                input.removeEventListener('blur', save);
                cancel();
            }
        });
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

        // Get all project tasks (both completed and incomplete)
        const allProjectTasks = this.tasks.filter(t => t.projectId === project.id);
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

        // Get next few incomplete tasks
        const upcomingTasks = incompleteTasks.slice(0, 3);
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
                <div class="project-health" title="Project Health: ${healthStatus}" style="color: ${healthColor};">
                    <i class="fas ${healthIcon}"></i>
                </div>
                <span class="project-status ${project.status}">${project.status}</span>
            </div>
            ${project.description ? `<div class="project-description">${escapeHtml(project.description)}</div>` : ''}

            <!-- Progress Bar -->
            ${totalTasks > 0 ? `
                <div class="project-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${completionPercent}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>${completedTasks.length}/${totalTasks} tasks (${completionPercent}%)</span>
                        ${overdueCount > 0 ? `<span class="overdue-badge"><i class="fas fa-exclamation-circle"></i> ${overdueCount} overdue</span>` : ''}
                    </div>
                </div>
            ` : ''}

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
        // Save state for undo
        this.saveState('Add task');

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
        // Save state for undo
        this.saveState('Duplicate task');

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
        // Save state for undo
        this.saveState('Toggle task completion');

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

        // Save state for undo
        if (taskId) {
            this.saveState('Edit task');
        } else {
            this.saveState('Create task');
        }

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

        // Save state for undo
        if (projectId) {
            this.saveState('Edit project');
        } else {
            this.saveState('Create project');
        }

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

        // Save state for undo
        this.saveState('Delete task');

        this.tasks = this.tasks.filter(t => t.id !== taskId);
        await this.saveTasks();
        this.renderView();
        this.updateCounts();
    }

    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? Tasks will not be deleted.')) return;

        // Save state for undo
        this.saveState('Delete project');

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

    async saveTemplates() {
        const templatesData = this.templates.map(t => t.toJSON());
        await this.storage.saveTemplates(templatesData);
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
