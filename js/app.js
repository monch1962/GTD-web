/**
 * ============================================================================
 * GTD Web Application - Main Application Controller
 * ============================================================================
 *
 * A comprehensive Getting Things Done (GTD) task management application.
 *
 * TABLE OF CONTENTS:
 * ------------------
 * 1. INITIALIZATION (constructor, init)
 * 2. SETUP & EVENT LISTENERS (setupEventListeners, setupNavigation, etc.)
 * 3. VIEW MANAGEMENT (switchView, renderView, etc.)
 * 4. TASK OPERATIONS (quickAddTask, toggleTaskComplete, deleteTask, etc.)
 * 5. PROJECT OPERATIONS (createProject, editProject, deleteProject, etc.)
 * 6. TASK MODAL (openTaskModal, saveTaskFromForm, etc.)
 * 7. BULK OPERATIONS (bulk selection, bulk actions)
 * 8. KEYBOARD NAVIGATION (selectTask, deselectTask, keyboard shortcuts)
 * 9. SEARCH FUNCTIONALITY (setupSearch, filterTasks, saved searches)
 * 10. DASHBOARD FUNCTIONALITY (analytics, charts, insights)
 * 11. DAILY REVIEW (quick planning workflow)
 * 12. WEEKLY REVIEW (comprehensive cleanup)
 * 13. TIME TRACKING (task timers, time spent)
 * 14. DARK MODE (theme toggling)
 * 15. CALENDAR VIEW (monthly task calendar)
 * 16. TEMPLATES SYSTEM (reusable task templates)
 * 17. ARCHIVE SYSTEM (archived tasks management)
 * 18. CONTEXT MENU (quick actions right-click menu)
 * 19. DEPENDENCIES (task dependency visualization)
 * 20. PRODUCTIVITY HEATMAP (completion activity chart)
 * 21. GLOBAL QUICK CAPTURE (Alt+N instant task capture)
 * 22. PRIORITY SCORING (automatic task prioritization)
 * 23. DATE SUGGESTIONS (smart date parsing)
 * 24. UNDO/REDO SYSTEM (history management)
 * 25. MOBILE NAVIGATION (touch-friendly controls)
 * 26. FOCUS MODE (distraction-free work)
 * 27. POMODORO TIMER (25/5 minute intervals)
 * 28. SUBTASKS MANAGEMENT (task checklists)
 * 29. MODAL HELPERS (utilities for modal management)
 *
 * Last updated: 2025-01-08
 * ============================================================================
 */

import { Task, Project, Reference, Template } from './models.js';
import { Storage } from './storage.js';
import { ElementIds, StorageKeys, TaskStatus, Views, RecurrenceLabels, ViewLabels, Weekday, WeekdayNames, NthWeekdayLabels } from './constants.js';
import { getElement, setTextContent, escapeHtml, announce } from './dom-utils.js';
import { TaskParser } from './nlp-parser.js';
import { getDefaultContextIds, getAllContexts, getContextTaskCounts } from './config/defaultContexts.js';
import { DarkModeManager } from './modules/ui/dark-mode.js';
import { CalendarManager } from './modules/features/calendar.js';
import { ArchiveManager } from './modules/features/archive.js';
import { ContextMenuManager } from './modules/ui/context-menu.js';
import { WeeklyReviewManager } from './modules/features/weekly-review.js';
import { DependenciesManager } from './modules/features/dependencies.js';
import { TemplatesManager } from './modules/features/templates.js';
import { MobileNavigationManager } from './modules/ui/mobile-navigation.js';
import { DashboardManager } from './modules/features/dashboard.js';
import { FocusPomodoroManager } from './modules/features/focus-pomodoro.js';
import { DailyReviewManager } from './modules/features/daily-review.js';
import { SmartSuggestionsManager } from './modules/features/smart-suggestions.js';
import { PriorityScoringManager } from './modules/features/priority-scoring.js';
import { GlobalQuickCaptureManager } from './modules/features/global-quick-capture.js';

class GTDApp {
    // =========================================================================
    // INITIALIZATION
    // =========================================================================
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
        this.defaultContexts = getDefaultContextIds(); // Import from single source of truth
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
        this.calendarView = 'month'; // Calendar view: month, week
        this.calendarDate = new Date(); // Currently viewed month in calendar
        this.history = []; // Undo/Redo history
        this.historyIndex = -1; // Current position in history
        this.maxHistorySize = 50; // Maximum history entries
        this.showingArchivedProjects = false; // Track if viewing archived projects

        // Initialize feature modules
        this.darkMode = new DarkModeManager();
        this.calendar = new CalendarManager(this, this);
        this.archive = new ArchiveManager(this, this);
        this.contextMenu = new ContextMenuManager(this, this);
        this.weeklyReview = new WeeklyReviewManager(this, this);
        this.dependencies = new DependenciesManager(this, this);
        this.templatesManager = new TemplatesManager(this, this);
        this.mobileNavigation = new MobileNavigationManager(this, this);
        this.dashboard = new DashboardManager(this, this);
        this.focusPomodoro = new FocusPomodoroManager(this, this);
        this.dailyReview = new DailyReviewManager(this, this);
        this.smartSuggestions = new SmartSuggestionsManager(this, this);
        this.priorityScoring = new PriorityScoringManager(this, this);
        this.globalQuickCapture = new GlobalQuickCaptureManager(this, this);
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

            // Migrate blocked tasks to Waiting (one-time migration for existing data)
            await this.migrateBlockedTasksToWaiting();

            // Check if any waiting tasks now have their dependencies met
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

    // =========================================================================
    // SETUP & EVENT LISTENERS
    // =========================================================================
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
        this.setupMobileNavigation();
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
        const templatesList = document.getElementById('quick-capture-templates-list');

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
        this.renderProjectsDropdown(); // Update project task counts
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


    // ==================== DASHBOARD FUNCTIONALITY (Delegated to DashboardManager module) ====================

    setupDashboard() {
        this.dashboard.setupDashboard();
    }

    showDashboard() {
        this.dashboard.showDashboard();
    }

    closeDashboard() {
        this.dashboard.closeDashboard();
    }

    renderDashboard() {
        this.dashboard.renderDashboard();
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

    // ==================== TEMPLATES SYSTEM (Delegated to TemplatesManager module) ====================

    getCustomContexts() {
        return this.templatesManager.getCustomContexts();
    }

    setupTemplates() {
        this.templatesManager.setupTemplates();
    }

    openTemplatesModal() {
        this.templatesManager.openTemplatesModal();
    }

    closeTemplatesModal() {
        this.templatesManager.closeTemplatesModal();
    }

    openTemplateEditModal(templateId) {
        this.templatesManager.openTemplateEditModal(templateId);
    }

    closeTemplateEditModal() {
        this.templatesManager.closeTemplateEditModal();
    }

    async handleTemplateFormSubmit(e) {
        return this.templatesManager.handleTemplateFormSubmit(e);
    }

    async deleteTemplate(templateId) {
        return this.templatesManager.deleteTemplate(templateId);
    }

    saveTaskAsTemplate(taskId) {
        this.templatesManager.saveTaskAsTemplate(taskId);
    }

    openTemplateEditModalWithData(templateData) {
        this.templatesManager.openTemplateEditModalWithData(templateData);
    }

    async createTaskFromTemplate(templateId) {
        return this.templatesManager.createTaskFromTemplate(templateId);
    }

    renderTemplatesList() {
        this.templatesManager.renderTemplatesList();
    }

    editTemplate(templateId) {
        this.templatesManager.editTemplate(templateId);
    }

    renderTemplateContexts(selectedContexts) {
        this.templatesManager.renderTemplateContexts(selectedContexts);
    }

    getSelectedTemplateContexts() {
        return this.templatesManager.getSelectedTemplateContexts();
    }

    renderTemplateSubtasks(subtasks) {
        this.templatesManager.renderTemplateSubtasks(subtasks);
    }

    addTemplateSubtask() {
        this.templatesManager.addTemplateSubtask();
    }

    removeTemplateSubtask(index) {
        this.templatesManager.removeTemplateSubtask(index);
    }

    getTemplateSubtasks() {
        return this.templatesManager.getTemplateSubtasks();
    }

    // ==================== DARK MODE (Delegated to DarkModeManager module) ====================

    initializeDarkMode() {
        this.darkMode.initializeDarkMode();
    }

    setupDarkMode() {
        this.darkMode.setupDarkMode();
    }

    toggleDarkMode() {
        this.darkMode.toggleDarkMode();
    }

    updateDarkModeButton() {
        this.darkMode.updateDarkModeButton();
    }

    // ==================== WEEKLY REVIEW (Delegated to WeeklyReviewManager module) ====================

    setupWeeklyReview() {
        this.weeklyReview.setupWeeklyReview();
    }

    showWeeklyReview() {
        this.weeklyReview.showWeeklyReview();
    }

    closeWeeklyReview() {
        this.weeklyReview.closeWeeklyReview();
    }

    renderWeeklyReview() {
        this.weeklyReview.renderWeeklyReview();
    }

    // ==================================================================

    // ==================== DAILY REVIEW (Delegated to DailyReviewManager module) ====================

    setupDailyReview() {
        this.dailyReview.setupDailyReview();
    }

    showDailyReview() {
        this.dailyReview.showDailyReview();
    }

    closeDailyReview() {
        this.dailyReview.closeDailyReview();
    }

    renderDailyReview() {
        this.dailyReview.renderDailyReview();
    }

    renderDailyReviewTask(task, type) {
        return this.dailyReview.renderDailyReviewTask(task, type);
    }

    // ==================================================================

    // ==================== NAVIGATION & VIEWS ====================

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 17) return 'Afternoon';
        return 'Evening';
    }

    getGreetingMessage() {
        const greeting = this.getGreeting();
        const totalTasks = this.tasks.filter(t => !t.completed).length;
        const completedToday = this.tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= new Date(new Date().setHours(0, 0, 0, 0))).length;

        if (totalTasks === 0) {
            return `Good ${greeting}! All caught up!`;
        } else if (completedToday > 0) {
            return `Good ${greeting}! ${completedToday} task${completedToday > 1 ? 's' : ''} completed today.`;
        } else {
            return `Good ${greeting}! You have ${totalTasks} task${totalTasks > 1 ? 's' : ''} to do.`;
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
        return project ? project.title : 'Unknown Project';
    }

    // ==================================================================

    // ==================== TIME TRACKING ====================

    setupTimeTracking() {
        // Time tracking is handled per-task in the task element creation
        // This method is for global time tracking setup
        console.log('[Time Tracking] Time tracking initialized');
    }

    startTaskTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (this.timerInterval) {
            this.stopTaskTimer();
        }

        this.currentTimerTask = taskId;
        this.timerStartTime = Date.now();

        const timerBtn = document.querySelector(`[data-task-id="${taskId}"] .btn-timer`);
        if (timerBtn) {
            timerBtn.classList.add('active');
            timerBtn.innerHTML = '<i class="fas fa-stop"></i>';
        }

        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.timerStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;

            const timerDisplay = document.querySelector(`[data-task-id="${taskId}"] .timer-display`);
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);

        this.showToast('Timer started', 'info');
    }

    stopTaskTimer() {
        if (!this.timerInterval || !this.currentTimerTask) return;

        clearInterval(this.timerInterval);
        this.timerInterval = null;

        const elapsedMinutes = Math.floor((Date.now() - this.timerStartTime) / 1000 / 60);

        const task = this.tasks.find(t => t.id === this.currentTimerTask);
        if (task) {
            task.timeSpent = (task.timeSpent || 0) + elapsedMinutes;
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderView();
        }

        const timerBtn = document.querySelector(`[data-task-id="${this.currentTimerTask}"] .btn-timer`);
        if (timerBtn) {
            timerBtn.classList.remove('active');
            timerBtn.innerHTML = '<i class="fas fa-play"></i>';
        }

        this.currentTimerTask = null;
        this.timerStartTime = null;

        this.showToast(`Timer stopped. Added ${elapsedMinutes} minutes.`, 'success');
    }

    // ==================================================================

    // ==================== CALENDAR VIEW (Delegated to CalendarManager module) ====================

    setupCalendarView() {
        this.calendar.setupCalendarView();
    }

    showCalendar() {
        this.calendar.showCalendar();
    }

    closeCalendar() {
        this.calendar.closeCalendar();
    }

    renderCalendar() {
        this.calendar.renderCalendar();
    }

    navigateCalendar(direction) {
        this.calendar.navigateCalendar(direction);
    }

    getTasksForMonth(year, month) {
        return this.calendar.getTasksForMonth(year, month);
    }

    showTasksForDate(year, month, day) {
        this.calendar.showTasksForDate(year, month, day);
    }

    // ==================== ARCHIVE SYSTEM ====================

    setupArchive() {
        this.archive.setupArchive();
    }

    openArchiveModal() {
        this.archive.openArchiveModal();
    }

    closeArchiveModal() {
        this.archive.closeArchiveModal();
    }

    async autoArchiveOldTasks(daysOld = 30) {
        return this.archive.autoArchiveOldTasks(daysOld);
    }

    async archiveTasks(tasksToArchive) {
        return this.archive.archiveTasks(tasksToArchive);
    }

    async archiveTask(taskId) {
        return this.archive.archiveTask(taskId);
    }

    async restoreFromArchive(archiveId) {
        return this.archive.restoreFromArchive(archiveId);
    }

    async deleteFromArchive(archiveId) {
        return this.archive.deleteFromArchive(archiveId);
    }

    renderArchive(searchQuery = '') {
        this.archive.renderArchive(searchQuery);
    }

    populateArchiveProjectFilter() {
        this.archive.populateArchiveProjectFilter();
    }

    // ==================== QUICK ACTIONS CONTEXT MENU ====================

    setupContextMenu() {
        this.contextMenu.setupContextMenu();
    }

    showContextMenu(event, taskId) {
        this.contextMenu.showContextMenu(event, taskId);
    }

    hideContextMenu() {
        this.contextMenu.hideContextMenu();
    }

    populateContextMenuProjects() {
        this.contextMenu.populateContextMenuProjects();
    }

    async handleContextMenuAction(action, data, taskId) {
        return this.contextMenu.handleContextMenuAction(action, data, taskId);
    }

    // ==================== DEPENDENCIES VISUALIZATION (Delegated to DependenciesManager module) ====================

    setupDependenciesVisualization() {
        this.dependencies.setupDependenciesVisualization();
    }

    populateDepsProjectFilter() {
        this.dependencies.populateDepsProjectFilter();
    }

    openDependenciesModal() {
        this.dependencies.openDependenciesModal();
    }

    closeDependenciesModal() {
        this.dependencies.closeDependenciesModal();
    }

    updateDepsViewButtons() {
        this.dependencies.updateDepsViewButtons();
    }

    renderDependenciesView() {
        this.dependencies.renderDependenciesView();
    }

    getDependenciesTasks(projectId) {
        return this.dependencies.getDependenciesTasks(projectId);
    }

    updateDepsStats(tasks) {
        this.dependencies.updateDepsStats(tasks);
    }

    renderDependencyGraph(tasks, container) {
        this.dependencies.renderDependencyGraph(tasks, container);
    }

    calculateNodePositions(tasks) {
        return this.dependencies.calculateNodePositions(tasks);
    }

    calculateTaskLevel(task, allTasks) {
        return this.dependencies.calculateTaskLevel(task, allTasks);
    }

    renderDependencyLines(tasks, positions, container) {
        this.dependencies.renderDependencyLines(tasks, positions, container);
    }

    renderDependencyChains(tasks, container) {
        this.dependencies.renderDependencyChains(tasks, container);
    }

    buildDependencyChains(tasks) {
        return this.dependencies.buildDependencyChains(tasks);
    }

    renderChain(chain) {
        return this.dependencies.renderChain(chain);
    }

    renderCriticalPath(tasks, container) {
        this.dependencies.renderCriticalPath(tasks, container);
    }

    calculateCriticalPath(tasks) {
        return this.dependencies.calculateCriticalPath(tasks);
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
        this.globalQuickCapture.setupGlobalQuickCapture();
    }

    openGlobalQuickCapture() {
        this.globalQuickCapture.openGlobalQuickCapture();
    }

    closeGlobalQuickCapture() {
        this.globalQuickCapture.closeGlobalQuickCapture();
    }

    handleGlobalQuickCapture(input) {
        this.globalQuickCapture.handleGlobalQuickCapture(input);
    }

    parseQuickCaptureInput(input) {
        return this.globalQuickCapture.parseQuickCaptureInput(input);
    }

    toggleQuickCaptureTemplates() {
        this.globalQuickCapture.toggleQuickCaptureTemplates();
    }

    renderQuickCaptureTemplates(container) {
        this.globalQuickCapture.renderQuickCaptureTemplates(container);
    }

    selectTemplateForQuickCapture(templateId) {
        this.globalQuickCapture.selectTemplateForQuickCapture(templateId);
    }

    // ==================== TASK PRIORITY SCORING ====================

    /**
     * Calculate automatic priority score (0-100) for a task
     * Higher score = higher priority
     */
    calculatePriorityScore(task) {
        return this.priorityScoring.calculatePriorityScore(task);
    }

    /**
     * Get priority score color class
     */
    getPriorityScoreColor(score) {
        return this.priorityScoring.getPriorityScoreColor(score);
    }

    /**
     * Get priority label
     */
    getPriorityLabel(score) {
        return this.priorityScoring.getPriorityLabel(score);
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

    // ==================== MOBILE NAVIGATION ====================

    setupMobileNavigation() {
        this.mobileNavigation.setupMobileNavigation();
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

    // Alias for showNotification for consistency
    showToast(message) {
        this.showNotification(message);
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


    // ==================== FOCUS MODE (Delegated to FocusPomodoroManager module) ====================

    setupFocusMode() {
        this.focusPomodoro.setupFocusMode();
    }

    enterFocusMode(taskId) {
        return this.focusPomodoro.enterFocusMode(taskId);
    }

    exitFocusMode() {
        return this.focusPomodoro.exitFocusMode();
    }

    renderFocusTask(task) {
        this.focusPomodoro.renderFocusTask(task);
    }

    autoTrackTimeSpent() {
        return this.focusPomodoro.autoTrackTimeSpent();
    }

    toggleSubtaskFromFocus(taskId, subtaskIndex) {
        return this.focusPomodoro.toggleSubtaskFromFocus(taskId, subtaskIndex);
    }

    completeTaskAndExitFocus(taskId) {
        return this.focusPomodoro.completeTaskAndExitFocus(taskId);
    }

    editTaskFromFocus(taskId) {
        this.focusPomodoro.editTaskFromFocus(taskId);
    }

    // ==================== POMODORO TIMER (Delegated to FocusPomodoroManager module) ====================

    startPomodoro() {
        this.focusPomodoro.startPomodoro();
    }

    pausePomodoro() {
        this.focusPomodoro.pausePomodoro();
    }

    resetPomodoro() {
        this.focusPomodoro.resetPomodoro();
    }

    pomodoroComplete() {
        this.focusPomodoro.pomodoroComplete();
    }

    updatePomodoroDisplay() {
        this.focusPomodoro.updatePomodoroDisplay();
    }

    updatePomodoroButtons() {
        this.focusPomodoro.updatePomodoroButtons();
    }

    // ==================================================================

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

    // =========================================================================
    // VIEW MANAGEMENT
    // =========================================================================
    switchView(view) {
        // Clear project filter when switching views
        this.currentProjectId = null;

        // Reset archived projects view when switching away from projects
        if (view !== 'projects') {
            this.showingArchivedProjects = false;
        }

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });

        // Update bottom navigation active state
        document.querySelectorAll('.bottom-nav-item[data-view]').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });

        this.currentView = view;

        // Update view title
        const baseTitle = ViewLabels[view] || view;
        let title = baseTitle;

        // Add context filter indicator
        if (this.selectedContextFilters && this.selectedContextFilters.size > 0) {
            const contexts = Array.from(this.selectedContextFilters).join(', ');
            title = `${baseTitle} (${contexts})`;
        }

        document.getElementById('view-title').textContent = title;

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

        // Apply sidebar context filters (if any contexts are selected)
        if (this.selectedContextFilters && this.selectedContextFilters.size > 0) {
            filteredTasks = filteredTasks.filter(task => {
                if (!task.contexts || task.contexts.length === 0) return false;
                // Check if task has ANY of the selected contexts
                return task.contexts.some(context => this.selectedContextFilters.has(context));
            });
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

        // Waiting display
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
            const label = this.getRecurrenceLabel(task.recurrence);
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
                    ${task.projectId ? `<span class="task-project">${escapeHtml(this.getProjectTitle(task.projectId))}</span>` : ''}
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
                // If in project view, show dependency creation feedback
                if (this.currentProjectId) {
                    e.dataTransfer.dropEffect = 'link';
                    div.classList.add('dependency-target');
                } else {
                    // Normal reordering behavior
                    const container = div.parentNode;
                    const afterElement = getDragAfterElement(container, e.clientY);
                    if (afterElement == null) {
                        container.appendChild(draggingItem);
                    } else {
                        container.insertBefore(draggingItem, afterElement);
                    }
                }
            }
        });

        div.addEventListener('dragleave', () => {
            div.classList.remove('dependency-target');
        });

        div.addEventListener('drop', async (e) => {
            e.preventDefault();
            div.classList.remove('dependency-target');

            const draggedTaskId = e.dataTransfer.getData('text/plain');
            if (!draggedTaskId) return;

            // If in project view, create dependency
            if (this.currentProjectId) {
                const targetTask = this.tasks.find(t => t.id === task.id);
                const draggedTask = this.tasks.find(t => t.id === draggedTaskId);

                if (targetTask && draggedTask && targetTask.id !== draggedTask.id) {
                    // Check if both tasks are in the same project
                    if (targetTask.projectId !== draggedTask.projectId) {
                        this.showNotification('Dependencies can only be created within the same project', 'error');
                        return;
                    }

                    // Check if this would create a circular dependency
                    if (this.wouldCreateCircularDependency(draggedTask.id, targetTask.id)) {
                        this.showNotification('Cannot create circular dependency!', 'error');
                        return;
                    }

                    // Check if dependency already exists
                    if (!targetTask.waitingForTaskIds) {
                        targetTask.waitingForTaskIds = [];
                    }

                    if (targetTask.waitingForTaskIds.includes(draggedTask.id)) {
                        this.showNotification('Dependency already exists', 'info');
                        return;
                    }

                    // Add dependency
                    this.saveState('Create task dependency');
                    targetTask.waitingForTaskIds.push(draggedTask.id);
                    await this.saveTasks();

                    // Check if target task should be moved to waiting status
                    const pendingDeps = targetTask.getPendingDependencies(this.tasks);
                    if (pendingDeps.length > 0 && targetTask.status !== 'waiting') {
                        targetTask.status = 'waiting';
                        await this.saveTasks();
                    }

                    this.showNotification(`Created dependency: "${targetTask.title}" now depends on "${draggedTask.title}"`);
                    this.renderView();
                }
            } else {
                // Normal reordering behavior
                await this.updateTaskPositions();
            }
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

        // Check if we're showing archived projects
        const showingArchived = this.showingArchivedProjects || false;

        // Filter out archived projects from normal view (unless explicitly showing them)
        if (!showingArchived) {
            filteredProjects = filteredProjects.filter(project => project.status !== 'archived');
        } else {
            // When showing archived, only show archived
            filteredProjects = filteredProjects.filter(project => project.status === 'archived');
        }

        if (this.filters.context) {
            filteredProjects = filteredProjects.filter(project => project.contexts && project.contexts.includes(this.filters.context));
        }

        // Add header with toggle button
        const archivedCount = this.projects.filter(p => p.status === 'archived').length;

        if (archivedCount > 0 || showingArchived) {
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); padding: var(--spacing-sm); background: var(--bg-secondary); border-radius: var(--border-radius);';

            const toggleButton = document.createElement('button');
            toggleButton.className = 'btn btn-secondary';
            toggleButton.style.cssText = 'font-size: 0.85rem;';
            toggleButton.innerHTML = showingArchived
                ? `<i class="fas fa-arrow-left"></i> Back to Active Projects`
                : `<i class="fas fa-archive"></i> Show Archived (${archivedCount})`;

            toggleButton.addEventListener('click', () => {
                this.showingArchivedProjects = !showingArchived;
                this.renderProjects();
            });

            headerDiv.appendChild(toggleButton);
            container.appendChild(headerDiv);
        }

        // Clear and re-render projects
        const existingProjects = container.querySelectorAll('.project-card');
        existingProjects.forEach(p => p.remove());

        if (filteredProjects.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.innerHTML = showingArchived
                ? this.renderEmptyState('No archived projects')
                : this.renderEmptyState('No projects found');
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

            ${taskCount === 0 && project.status !== 'archived' ? `
                <div class="project-empty-actions" style="padding: var(--spacing-sm); background: rgba(240, 173, 78, 0.1); border-radius: var(--border-radius); margin-top: var(--spacing-sm);">
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
                        <i class="fas fa-info-circle" style="color: #f0ad4e;"></i>
                        <span style="font-size: 0.9rem; color: var(--text-secondary);">${totalTasks > 0 ? 'All tasks completed!' : 'This project has no tasks'}</span>
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
            ` : ''}

            ${project.status === 'archived' ? `
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
            ` : ''}

            <div class="project-meta">
                <div class="project-tags">
                    ${project.contexts ? project.contexts.map(context => `<span class="task-context">${escapeHtml(context)}</span>`).join('') : ''}
                </div>
                ${totalTasks > 0 ? `
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
                ` : `
                <div class="project-actions">
                    <button class="task-action-btn edit-project" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
                `}
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
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteProject(project.id);
            });
        }

        const deleteConfirmBtn = div.querySelector('.btn-delete-project-confirm');
        if (deleteConfirmBtn) {
            deleteConfirmBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteProject(project.id);
            });
        }

        const archiveBtn = div.querySelector('.btn-archive-project');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.archiveProject(project.id);
            });
        }

        const restoreBtn = div.querySelector('.btn-restore-project');
        if (restoreBtn) {
            restoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.restoreProject(project.id);
            });
        }

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

    // =========================================================================
    // TASK OPERATIONS
    // =========================================================================
    async quickAddTask(title) {
        // Save state for undo
        this.saveState('Add task');

        // Use natural language parser to extract task properties
        const parsed = this.parser.parse(title);

        // Determine status: if viewing a project, default to 'next', otherwise use current view
        const status = this.currentProjectId ? 'next' : (this.currentView === 'all' ? 'inbox' : this.currentView);

        const task = new Task({
            title: parsed.title || title,
            status: status,
            type: 'task',
            contexts: parsed.contexts,
            energy: parsed.energy,
            time: parsed.time,
            dueDate: parsed.dueDate,
            recurrence: parsed.recurrence,
            projectId: this.currentProjectId || null
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

    async migrateBlockedTasksToWaiting() {
        let movedCount = 0;

        // Check all tasks in Next or Someday that have unmet dependencies
        this.tasks.forEach(task => {
            if ((task.status === 'next' || task.status === 'someday') && !task.completed) {
                // Check if task has unmet dependencies
                if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                    if (!task.areDependenciesMet(this.tasks)) {
                        // Move to Waiting
                        task.status = 'waiting';
                        task.updatedAt = new Date().toISOString();
                        movedCount++;
                    }
                }
            }
        });

        if (movedCount > 0) {
            await this.saveTasks();
            console.log(`Migrated ${movedCount} blocked task(s) to Waiting`);
        }

        // Update project dropdown counts since tasks changed status
        this.renderProjectsDropdown();

        return movedCount;
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

    /**
     * Check if creating a dependency from prerequisiteTaskId to dependentTaskId
     * would create a circular dependency
     */
    wouldCreateCircularDependency(prerequisiteTaskId, dependentTaskId) {
        const visited = new Set();
        const queue = [prerequisiteTaskId];

        while (queue.length > 0) {
            const currentId = queue.shift();

            // If we've reached the dependent task, we have a circular dependency
            if (currentId === dependentTaskId) {
                return true;
            }

            if (visited.has(currentId)) {
                continue;
            }
            visited.add(currentId);

            // Find all tasks that depend on the current task
            const dependentTasks = this.tasks.filter(t =>
                t.waitingForTaskIds && t.waitingForTaskIds.includes(currentId)
            );

            // Add them to the queue to check
            dependentTasks.forEach(t => {
                if (!visited.has(t.id)) {
                    queue.push(t.id);
                }
            });
        }

        return false;
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
            this.populateRecurrenceInForm(task.recurrence);
            document.getElementById('task-recurrence-end-date').value = task.recurrenceEndDate || '';
            document.getElementById('task-notes').value = task.notes || '';
            this.renderSubtasksInModal(task.subtasks || []);
        } else {
            title.textContent = 'Add Task';
            document.getElementById('task-id').value = '';
            document.getElementById('task-status').value = this.currentView === 'all' ? 'inbox' : this.currentView;
            document.getElementById('task-waiting-for-description').value = '';
            this.populateRecurrenceInForm('');
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

        // Setup recurrence change listener to show/hide appropriate options
        const recurrenceTypeSelect = document.getElementById('task-recurrence-type');
        const recurrenceEndDateGroup = document.getElementById('recurrence-end-date-group');
        const weeklyOptions = document.getElementById('recurrence-weekly-options');
        const monthlyOptions = document.getElementById('recurrence-monthly-options');
        const yearlyOptions = document.getElementById('recurrence-yearly-options');

        const updateRecurrenceFields = () => {
            // Hide all options first
            weeklyOptions.style.display = 'none';
            monthlyOptions.style.display = 'none';
            yearlyOptions.style.display = 'none';
            recurrenceEndDateGroup.style.display = 'none';

            const recurrenceType = recurrenceTypeSelect.value;

            if (recurrenceType && recurrenceType !== '') {
                recurrenceEndDateGroup.style.display = 'block';

                // Show type-specific options
                if (recurrenceType === 'weekly') {
                    weeklyOptions.style.display = 'block';
                } else if (recurrenceType === 'monthly') {
                    monthlyOptions.style.display = 'block';
                } else if (recurrenceType === 'yearly') {
                    yearlyOptions.style.display = 'block';
                }
            }
        };

        recurrenceTypeSelect.addEventListener('change', updateRecurrenceFields);
        updateRecurrenceFields(); // Initial call

        modal.classList.add('active');
    }

    /**
     * Get display label for recurrence
     * Handles both string format (e.g., 'daily') and object format (e.g., { type: 'weekly', daysOfWeek: [1,3,5] })
     *
     * @param {string|object} recurrence - Recurrence value
     * @returns {string} Human-readable recurrence label
     */
    getRecurrenceLabel(recurrence) {
        if (!recurrence) {
            return '';
        }

        // Handle old string format (backward compatibility)
        if (typeof recurrence === 'string') {
            return RecurrenceLabels[recurrence] || recurrence;
        }

        // Handle new object format
        if (typeof recurrence === 'object' && recurrence.type) {
            const baseLabel = RecurrenceLabels[recurrence.type] || recurrence.type;

            // Add details for complex recurrences
            const details = [];
            if (recurrence.type === 'weekly' && recurrence.daysOfWeek) {
                const dayNames = recurrence.daysOfWeek.map(day => {
                    const weekday = Object.values(Weekday).find(w => Weekday[w] === day);
                    return WeekdayNames[day] || day;
                });
                details.push(`(${dayNames.join(', ')})`);
            } else if (recurrence.type === 'monthly' && recurrence.dayOfMonth) {
                details.push(`(day ${recurrence.dayOfMonth})`);
            } else if (recurrence.type === 'monthly' && recurrence.nthWeekday) {
                const nthLabel = NthWeekdayLabels[recurrence.nthWeekday.n];
                const weekdayLabel = WeekdayNames[recurrence.nthWeekday.weekday];
                details.push(`(${nthLabel} ${weekdayLabel})`);
            } else if (recurrence.type === 'yearly' && recurrence.dayOfYear) {
                const [month, day] = recurrence.dayOfYear.split('-');
                details.push(`(${month}/${day})`);
            }

            return details.length > 0 ? `${baseLabel} ${details.join(' ')}` : baseLabel;
        }

        // Fallback
        return String(recurrence);
    }

    /**
     * Build recurrence object from form fields
     */
    buildRecurrenceFromForm() {
        const recurrenceType = document.getElementById('task-recurrence-type').value;

        if (!recurrenceType || recurrenceType === '') {
            return '';
        }

        // For simple cases (daily), just return the string for backward compatibility
        if (recurrenceType === 'daily') {
            return 'daily';
        }

        const recurrence = { type: recurrenceType };

        // Weekly: specific days
        if (recurrenceType === 'weekly') {
            const checkboxes = document.querySelectorAll('.recurrence-day-checkbox:checked');
            const selectedDays = Array.from(checkboxes).map(cb => parseInt(cb.value));

            if (selectedDays.length > 0) {
                recurrence.daysOfWeek = selectedDays.sort();
            } else {
                // If no days selected, default to simple weekly
                return 'weekly';
            }
        }

        // Monthly: day of month OR nth weekday
        if (recurrenceType === 'monthly') {
            const monthlyType = document.querySelector('input[name="monthly-recurrence-type"]:checked').value;

            if (monthlyType === 'day-of-month') {
                const dayOfMonth = parseInt(document.getElementById('recurrence-day-of-month').value);
                if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
                    recurrence.dayOfMonth = dayOfMonth;
                } else {
                    return 'monthly'; // Default to simple monthly
                }
            } else if (monthlyType === 'nth-weekday') {
                const n = parseInt(document.getElementById('recurrence-nth').value);
                const weekday = parseInt(document.getElementById('recurrence-weekday').value);
                recurrence.nthWeekday = { n, weekday };
            }
        }

        // Yearly: specific day of year
        if (recurrenceType === 'yearly') {
            const month = parseInt(document.getElementById('recurrence-year-month').value);
            const day = parseInt(document.getElementById('recurrence-year-day').value);

            if (month && day) {
                recurrence.dayOfYear = `${month}-${day}`;
            } else {
                return 'yearly'; // Default to simple yearly
            }
        }

        return recurrence;
    }

    /**
     * Parse recurrence object and populate form fields
     */
    populateRecurrenceInForm(recurrence) {
        // Reset all fields
        document.getElementById('task-recurrence-type').value = '';
        document.querySelectorAll('.recurrence-day-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('recurrence-day-of-month').value = 1;
        document.getElementById('recurrence-nth').value = 1;
        document.getElementById('recurrence-weekday').value = 1;
        document.getElementById('recurrence-year-month').value = 1;
        document.getElementById('recurrence-year-day').value = 1;
        document.querySelector('input[name="monthly-recurrence-type"][value="day-of-month"]').checked = true;

        if (!recurrence || recurrence === '') {
            return;
        }

        // Handle old string format (backward compatibility)
        if (typeof recurrence === 'string') {
            document.getElementById('task-recurrence-type').value = recurrence;
            return;
        }

        // Handle new object format
        if (typeof recurrence === 'object' && recurrence.type) {
            document.getElementById('task-recurrence-type').value = recurrence.type;

            // Weekly: specific days
            if (recurrence.type === 'weekly' && recurrence.daysOfWeek) {
                recurrence.daysOfWeek.forEach(day => {
                    const checkbox = document.querySelector(`.recurrence-day-checkbox[value="${day}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }

            // Monthly: day of month OR nth weekday
            if (recurrence.type === 'monthly') {
                if (recurrence.dayOfMonth) {
                    document.querySelector('input[name="monthly-recurrence-type"][value="day-of-month"]').checked = true;
                    document.getElementById('recurrence-day-of-month').value = recurrence.dayOfMonth;
                } else if (recurrence.nthWeekday) {
                    document.querySelector('input[name="monthly-recurrence-type"][value="nth-weekday"]').checked = true;
                    document.getElementById('recurrence-nth').value = recurrence.nthWeekday.n;
                    document.getElementById('recurrence-weekday').value = recurrence.nthWeekday.weekday;
                }
            }

            // Yearly: specific day of year
            if (recurrence.type === 'yearly' && recurrence.dayOfYear) {
                const [month, day] = recurrence.dayOfYear.split('-').map(Number);
                document.getElementById('recurrence-year-month').value = month;
                document.getElementById('recurrence-year-day').value = day;
            }
        }
    }

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
    }

    renderWaitingForTasksList(currentTask) {
        const container = document.getElementById('waiting-for-tasks-list');
        const currentTaskId = currentTask ? currentTask.id : null;
        const currentProjectId = currentTask ? currentTask.projectId : null;

        // Get all incomplete tasks except the current one
        // Show all tasks regardless of project to allow cross-project dependencies
        let availableTasks = this.tasks.filter(t =>
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

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);

            // Add status badge
            const status = document.createElement('span');
            status.textContent = task.status;
            status.style.fontSize = '0.75rem';
            status.style.padding = '2px 6px';
            status.style.borderRadius = '4px';
            status.style.marginLeft = '8px';
            status.style.backgroundColor = 'var(--bg-secondary)';
            status.style.color = 'var(--text-secondary)';
            wrapper.appendChild(status);

            // Add project badge if task belongs to a project
            if (task.projectId) {
                const project = this.projects.find(p => p.id === task.projectId);
                if (project) {
                    const projectBadge = document.createElement('span');
                    projectBadge.textContent = project.title;
                    projectBadge.style.fontSize = '0.75rem';
                    projectBadge.style.padding = '2px 6px';
                    projectBadge.style.borderRadius = '4px';
                    projectBadge.style.marginLeft = '6px';
                    projectBadge.style.backgroundColor = 'var(--accent-color)';
                    projectBadge.style.color = 'white';
                    projectBadge.style.fontWeight = '500';
                    wrapper.appendChild(projectBadge);
                }
            }

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

        // GTD Rule: If task has dependencies and is in Next or Someday, automatically move to Waiting
        // This ensures blocked tasks are visible in the Waiting view
        if (waitingForTaskIds.length > 0 && (status === 'next' || status === 'someday')) {
            status = 'waiting';
        }

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
                            recurrence: this.buildRecurrenceFromForm(),
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
                    // Track if project assignment changed
                    const oldProjectId = existingTask.projectId;

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
                        recurrence: this.buildRecurrenceFromForm(),
                        recurrenceEndDate: document.getElementById('task-recurrence-end-date').value || null,
                        notes: document.getElementById('task-notes').value || '',
                        subtasks: this.getSubtasksFromModal()
                    };
                    Object.assign(existingTask, taskData);
                    existingTask.updatedAt = new Date().toISOString();
                    await this.saveTasks();

                    // Update project dropdown if task was assigned to a different project
                    if (oldProjectId !== projectId) {
                        this.renderProjectsDropdown();
                    }
                } else if (existingProject) {
                    const projectData = {
                        title: document.getElementById('task-title').value,
                        description: document.getElementById('task-description').value,
                        status: status === 'inbox' ? 'active' : status,
                        contexts: tags
                    };
                    Object.assign(existingProject, projectData);
                    existingProject.updatedAt = new Date().toISOString();
                    await this.saveProjects();
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

        // Update project dropdown if:
        // 1. Creating/editing a project, OR
        // 2. Creating a new task with a project assignment
        if (newType === 'project' || (newType === 'task' && projectId && !taskId)) {
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

    async archiveProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        if (!confirm(`Archive "${project.title}"? The project will be hidden but can be restored later.`)) return;

        // Save state for undo
        this.saveState('Archive project');

        // Mark project as archived
        project.status = 'archived';
        project.updatedAt = new Date().toISOString();

        await this.saveProjects();
        this.renderView();
        this.updateCounts();
        this.renderProjectsDropdown();

        this.showNotification(`Project "${project.title}" archived`);
    }

    async restoreProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        // Save state for undo
        this.saveState('Restore project');

        // Restore project to active status
        project.status = 'active';
        project.updatedAt = new Date().toISOString();

        await this.saveProjects();
        this.renderView();
        this.updateCounts();
        this.renderProjectsDropdown();

        this.showNotification(`Project "${project.title}" restored`);
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
        document.getElementById('templates-count').textContent = this.templates.length || '';
    }

    updateContextFilter() {
        const contextFilter = document.getElementById('context-filter');

        // Build set of all contexts from tasks and projects
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

        // Always update sidebar context filters (even if dropdown doesn't exist)
        this.updateSidebarContextFilters();
    }

    updateSidebarContextFilters() {
        const container = document.getElementById('context-filters');
        if (!container) return;

        // Get all contexts (default + custom) using standard function
        const allContexts = getAllContexts(this.tasks);

        // Initialize selected contexts filter if not exists
        if (!this.selectedContextFilters) {
            this.selectedContextFilters = new Set();
        }

        // Clear existing filters
        container.innerHTML = '';

        if (allContexts.size === 0) {
            container.innerHTML = '<div style="padding: var(--spacing-sm); font-size: 0.8rem; color: var(--text-light); opacity: 0.7;">No contexts yet</div>';
            return;
        }

        // Get task counts per context using standard function
        const contextTaskCounts = getContextTaskCounts(this.tasks);

        // Create checkbox for each context (sorted)
        Array.from(allContexts).sort().forEach(context => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; align-items: center; padding: 6px 12px; cursor: pointer; border-radius: 4px; transition: background 0.2s;';
            wrapper.style.marginBottom = '2px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `context-filter-${context.replace('@', '').replace(/\s/g, '-')}`;
            checkbox.value = context;
            checkbox.checked = this.selectedContextFilters.has(context);
            checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;

            // Show context name and task count
            const taskCount = contextTaskCounts[context] || 0;
            const isDefaultContext = this.defaultContexts.includes(context);

            label.innerHTML = `
                <span style="flex: 1; cursor: pointer; font-size: 0.85rem; color: var(--text-light);">
                    ${context}
                    ${taskCount > 0 ? `<span style="font-size: 0.75rem; opacity: 0.6; margin-left: 4px;">(${taskCount})</span>` : ''}
                    ${!isDefaultContext ? '<span style="font-size: 0.7rem; opacity: 0.5; margin-left: 4px;">custom</span>' : ''}
                </span>
            `;

            // Add click handler
            wrapper.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                this.toggleContextFilter(context, checkbox.checked);
            });

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });

        // Add click handler for clear button
        const clearBtn = document.getElementById('clear-context-filters');
        if (clearBtn) {
            clearBtn.removeEventListener('click', this.clearContextFiltersHandler);
            this.clearContextFiltersHandler = () => this.clearContextFilters();
            clearBtn.addEventListener('click', this.clearContextFiltersHandler);
        }
    }

    toggleContextFilter(context, isChecked) {
        if (isChecked) {
            this.selectedContextFilters.add(context);
        } else {
            this.selectedContextFilters.delete(context);
        }

        // Re-render view with updated filters
        this.renderView();

        // Show notification with count
        const count = this.selectedContextFilters.size;
        if (count > 0) {
            this.showNotification(`Filtering by ${count} context${count > 1 ? 's' : ''}`);
        }
    }

    clearContextFilters() {
        this.selectedContextFilters = new Set();
        this.renderView();
        this.updateSidebarContextFilters();
        this.showNotification('Context filters cleared');
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
        return project ? project.title : 'Unknown Project';
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
        return this.smartSuggestions.getSmartSuggestions(preferences);
    }

    /**
     * Show suggestion modal with smart recommendations
     */
    showSuggestions() {
        this.smartSuggestions.showSuggestions();
    }

    /**
     * Render task suggestions in the modal
     */
    renderSuggestions() {
        this.smartSuggestions.renderSuggestions();
    }

    /**
     * User clicked on a suggested task - highlight it and close modal
     */
    selectSuggestedTask(taskId) {
        this.smartSuggestions.selectSuggestedTask(taskId);
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

/**
 * Global Error Handler
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 50;
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        // Catch unhandled errors
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message), {
                source: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'unhandledrejection'
            });
        });
    }

    handleError(error, context = {}) {
        // Log error
        const errorInfo = {
            message: error.message || String(error),
            stack: error.stack,
            timestamp: new Date().toISOString(),
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errorLog.push(errorInfo);

        // Limit log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Console error with details
        console.error('Error caught by global handler:', errorInfo);

        // Show user-friendly notification
        this.showErrorNotification(error);
    }

    showErrorNotification(error) {
        // Create user-friendly error message
        let message = 'An error occurred. Please refresh the page.';

        // Specific error messages
        if (error.message) {
            if (error.message.includes('QuotaExceeded')) {
                message = 'Storage full! Please archive old tasks.';
            } else if (error.message.includes('NetworkError')) {
                message = 'Network error. Please check your connection.';
            } else if (error.message.includes('TypeError')) {
                message = 'Something went wrong. Please try again.';
            }
        }

        // Try to show notification
        if (typeof window !== 'undefined' && window.app && window.app.showNotification) {
            window.app.showNotification(message);
        }

        // Log to storage for debugging
        try {
            const errorLog = JSON.parse(localStorage.getItem('gtd_error_log') || '[]');
            errorLog.push({
                message: error.message || String(error),
                timestamp: new Date().toISOString()
            });
            // Keep only last 20 errors
            if (errorLog.length > 20) {
                errorLog.splice(0, errorLog.length - 20);
            }
            localStorage.setItem('gtd_error_log', JSON.stringify(errorLog));
        } catch (e) {
            // Ignore errors in error logging
        }
    }

    getErrorLog() {
        return this.errorLog;
    }

    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('gtd_error_log');
    }
}

// Export for testing
export { GTDApp, ErrorHandler };

// Initialize error handler
const errorHandler = new ErrorHandler();

// Initialize app
const app = new GTDApp();
window.app = app; // Expose to global scope for inline onclick handlers
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
