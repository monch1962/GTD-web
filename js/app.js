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

import { getDefaultContextIds, getAllContexts, getContextTaskCounts } from './config/defaultContexts.js';
import { ElementIds, StorageKeys, TaskStatus, Views, RecurrenceLabels, ViewLabels, Weekday, WeekdayNames, NthWeekdayLabels } from './constants.js';
import { getElement, setTextContent, escapeHtml, announce } from './dom-utils.js';
import { Task, Project, Reference, Template } from './models.js';
import { ArchiveManager } from './modules/features/archive.js';
import { FocusPomodoroManager } from './modules/features/focus-pomodoro.js';
import { DailyReviewManager } from './modules/features/daily-review.js';
import { SmartSuggestionsManager } from './modules/features/smart-suggestions.js';
import { PriorityScoringManager } from './modules/features/priority-scoring.js';
import { GlobalQuickCaptureManager } from './modules/features/global-quick-capture.js';
import { ProductivityHeatmapManager } from './modules/features/productivity-heatmap.js';
import { UndoRedoManager } from './modules/features/undo-redo.js';
import { BulkOperationsManager } from './modules/features/bulk-operations.js';
import { CalendarManager } from './modules/features/calendar.js';
import { TimeTrackingManager } from './modules/features/time-tracking.js';
import { QuickCaptureWidgetManager } from './modules/features/quick-capture-widget.js';
import { NewProjectButtonManager } from './modules/features/new-project-button.js';
import { NavigationManager } from './modules/features/navigation.js';
import { SmartDateSuggestionsManager } from './modules/features/smart-date-suggestions.js';
import { SearchManager } from './modules/features/search.js';
import { TaskOperations } from './modules/features/task-operations.js';
import { ContextFilterManager } from './modules/features/context-filter.js';
import { DashboardManager } from './modules/features/dashboard.js';
import { ProjectOperations } from './modules/features/project-operations.js';
import { ProjectModalManager } from './modules/features/project-modal.js';
import { DataExportImportManager } from './modules/features/data-export-import.js';
import { DependenciesManager } from './modules/features/dependencies.js';
import { SubtasksManager } from './modules/features/subtasks.js';
import { TaskModalManager } from './modules/features/task-modal.js';
import { TemplatesManager } from './modules/features/templates.js';
import { WeeklyReviewManager } from './modules/features/weekly-review.js';
import { ContextMenuManager } from './modules/ui/context-menu.js';
import { DarkModeManager } from './modules/ui/dark-mode.js';
import { MobileNavigationManager } from './modules/ui/mobile-navigation.js';
import { TaskParser } from './nlp-parser.js';
import { Storage } from './storage.js';

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
        this.usageStats = this.loadUsageStats(); // Track usage patterns for smart defaults
        this.defaultContexts = getDefaultContextIds(); // Import from single source of truth
        this.activeTimers = new Map(); // Track active timers for tasks
        this.calendarView = 'month'; // Calendar view: month, week
        this.calendarDate = new Date(); // Currently viewed month in calendar
        this.showingArchivedProjects = false; // Track if viewing archived projects
        this.selectedContextFilters = new Set(); // Track selected context filters from sidebar

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
        this.productivityHeatmap = new ProductivityHeatmapManager(this, this);
        this.undoRedo = new UndoRedoManager(this, this);
        this.bulkOperations = new BulkOperationsManager(this, this);
        this.timeTracking = new TimeTrackingManager(this, this);
        this.subtasks = new SubtasksManager(this, this);
        this.quickCaptureWidget = new QuickCaptureWidgetManager(this, this);
        this.newProjectButton = new NewProjectButtonManager(this, this);
        this.navigation = new NavigationManager(this, this);
        this.smartDateSuggestions = new SmartDateSuggestionsManager(this, this);
        this.search = new SearchManager(this, this);
        this.taskOperations = new TaskOperations(this, this);
        this.contextFilter = new ContextFilterManager(this, this);
        this.projectOperations = new ProjectOperations(this, this);
        this.taskModal = new TaskModalManager(this, this);
        this.projectModal = new ProjectModalManager(this, this);
        this.dataExportImport = new DataExportImportManager(this, this);
    }

    async init() {
        const initTimeout = setTimeout(() => {
            this.showDebugBanner('✗ INIT TIMEOUT - Taking too long', {
                step: this._initStep || 'unknown',
                hint: 'Check console for errors'
            }, 'error');
        }, 10000); // 10 second timeout

        // Update diagnostic indicator
        const indicator = document.getElementById('gtd-js-test');
        if (indicator) {
            indicator.innerHTML = '⚠️ App initializing...';
            indicator.style.background = 'purple';
        }

        try {
            console.log('GTD App: Initializing...');

            // Show initialization started
            this.showDebugBanner('GTD App Loading...', { step: 'Initializing' });
            this._initStep = 'Initializing';

            // Register service worker for PWA support
            this._initStep = 'Service Worker';
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js');
                    console.log('Service Worker registered:', registration);
                } catch (swError) {
                    console.log('Service Worker registration failed:', swError);
                }
            }

            // Initialize dark mode from preference
            this._initStep = 'Dark Mode';
            try {
                console.log('GTD App: Initializing dark mode...');
                this.initializeDarkMode();
                this.updateDebugBanner('Dark Mode ✓', {});
            } catch (e) {
                console.error('Dark mode failed:', e);
                this.updateDebugBanner('Dark Mode ✗ (continuing)', {});
            }

            // Initialize storage
            this._initStep = 'Storage';
            try {
                console.log('GTD App: Initializing storage...');
                await this.initializeStorage();
                console.log('GTD App: Storage userId =', this.storage.userId);
                this.updateDebugBanner('Storage loaded', { userId: this.storage.userId?.substring(0, 12) || 'ERROR' });
            } catch (e) {
                console.error('Storage init failed:', e);
                this.showDebugBanner('✗ Storage Failed', { error: e.message }, 'error');
                clearTimeout(initTimeout);
                return;
            }

            // Load data
            this._initStep = 'Load Data';
            try {
                console.log('GTD App: Loading data...');
                await this.loadData();
                this.updateDebugBanner('Data loaded', { tasks: this.tasks.length, projects: this.projects.length });
            } catch (e) {
                console.error('Load data failed:', e);
                this.showDebugBanner('✗ Load Data Failed', { error: e.message }, 'error');
                clearTimeout(initTimeout);
                return;
            }

            // Setup event listeners
            this._initStep = 'Event Listeners';
            try {
                console.log('GTD App: Setting up event listeners...');
                this.setupEventListeners();
                this.updateDebugBanner('Event listeners ✓', {});
            } catch (e) {
                console.error('Setup event listeners failed:', e);
                this.showDebugBanner('✗ Event Listeners Failed', { error: e.message }, 'error');
                clearTimeout(initTimeout);
                return;
            }

            // Display user ID
            this._initStep = 'User ID';
            try {
                console.log('GTD App: Displaying user ID...');
                this.displayUserId();
                this.updateDebugBanner('User ID displayed', { success: true });
            } catch (e) {
                console.error('Display user ID failed:', e);
                this.showDebugBanner('✗ User ID Failed', { error: e.message }, 'error');
                clearTimeout(initTimeout);
                return;
            }

            // Initialize custom contexts
            this._initStep = 'Custom Contexts';
            try {
                console.log('GTD App: Initializing custom contexts...');
                this.initializeCustomContexts();
            } catch (e) {
                console.error('Custom contexts failed:', e);
            }

            // Migrate blocked tasks
            this._initStep = 'Migration';
            try {
                await this.migrateBlockedTasksToWaiting();
                await this.checkWaitingTasksDependencies();
            } catch (e) {
                console.error('Migration failed:', e);
            }

            // Render view
            this._initStep = 'Render';
            try {
                console.log('GTD App: Rendering initial view...');
                this.renderView();
                this.updateCounts();
                this.renderProjectsDropdown();
                this.updateContextFilter();
            } catch (e) {
                console.error('Render failed:', e);
                this.showDebugBanner('✗ Render Failed', { error: e.message }, 'error');
                clearTimeout(initTimeout);
                return;
            }

            console.log('GTD App: Initialization complete!');
            this._initStep = 'Complete';
            clearTimeout(initTimeout);
            this.updateDebugBanner('✓ GTD Ready!', { tasks: this.tasks.length }, 'success');

            // Hide diagnostic indicator on success
            if (indicator) {
                indicator.innerHTML = '✓ GTD Ready!';
                indicator.style.background = '#00cc00';
                setTimeout(() => indicator.remove(), 2000);
            }

            // Auto-remove success banner after 2 seconds
            setTimeout(() => {
                const banner = document.getElementById('gtd-debug-banner');
                if (banner) banner.remove();
            }, 2000);
        } catch (error) {
            clearTimeout(initTimeout);
            console.error('GTD App: Initialization failed!', error);

            // Update indicator on error
            if (indicator) {
                indicator.innerHTML = `✗ ERROR: ${error.message}`;
                indicator.style.background = '#ff4444';
            }

            this.showDebugBanner('✗ CRITICAL ERROR', {
                step: this._initStep,
                error: error.message,
                stack: error.stack?.substring(0, 300)
            }, 'error');
            this.handleInitializationError(error);
        }
    }

    updateDebugBanner(title, details, type = 'info') {
        let banner = document.getElementById('gtd-debug-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'gtd-debug-banner';
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:15px;text-align:center;font-weight:bold;z-index:999999;font-size:16px;box-shadow:0 2px 10px rgba(0,0,0,0.3);transition:background 0.3s;';
            document.body.appendChild(banner);
        }

        const bgColor = type === 'success' ? '#00cc00' : type === 'error' ? '#ff4444' : '#2196F3';
        banner.style.background = bgColor;
        banner.style.color = 'white';

        const info = typeof details === 'object' ? JSON.stringify(details) : details;
        banner.innerHTML = `<div>${title}</div><div style="margin-top:5px;font-size:12px;font-weight:normal;">${info}</div>`;
    }

    async initializeStorage() {
        await this.storage.init();
    }

    displayUserId() {
        console.log('displayUserId: Called');
        console.log('displayUserId: ElementIds.userId =', ElementIds.userId);
        const userIdElement = document.getElementById(ElementIds.userId);
        console.log('displayUserId: userIdElement =', userIdElement);
        console.log('displayUserId: this.storage.userId =', this.storage.userId);

        if (userIdElement && this.storage.userId) {
            userIdElement.textContent = this.storage.userId.substr(0, 12) + '...';
            userIdElement.style.color = 'var(--text-primary)';
            console.log('displayUserId: Updated user ID in DOM');
        } else {
            console.warn('displayUserId: Failed - element:', userIdElement, 'userId:', this.storage.userId);
            // Show error directly in UI for mobile debugging
            if (userIdElement) {
                userIdElement.textContent = 'ERROR!';
                userIdElement.style.color = 'red';
                userIdElement.style.fontWeight = 'bold';
            }
            // Show visible error banner
            this.showDebugBanner('displayUserId failed', { userId: this.storage?.userId, element: !!userIdElement });
        }
    }

    showDebugBanner(title, details) {
        // Create a visible debug banner for mobile
        const banner = document.createElement('div');
        banner.id = 'gtd-debug-banner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ff4444;color:white;padding:15px;text-align:center;font-weight:bold;z-index:999999;font-size:16px;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
        banner.innerHTML = `<div>${title}</div>`;

        const info = document.createElement('div');
        info.style.cssText = 'margin-top:10px;font-size:12px;font-weight:normal;white-space:pre-wrap;text-align:left;';
        info.textContent = JSON.stringify(details, null, 2);

        banner.appendChild(info);
        document.body.appendChild(banner);

        // Auto-remove after 30 seconds
        setTimeout(() => banner.remove(), 30000);
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

        placeholder += ' (Try: "Call John @work tomorrow high energy")';
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
        this.bulkOperations.setupBulkSelection();
    }

    updateBulkSelectButtonVisibility() {
        this.bulkOperations.updateBulkSelectButtonVisibility();
    }

    toggleBulkSelectionMode() {
        this.bulkOperations.toggleBulkSelectionMode();
    }

    exitBulkSelectionMode() {
        this.bulkOperations.exitBulkSelectionMode();
    }

    toggleBulkTaskSelection(taskId) {
        this.bulkOperations.toggleBulkTaskSelection(taskId);
    }

    updateBulkSelectedCount() {
        this.bulkOperations.updateBulkSelectedCount();
    }

    async bulkCompleteTasks() {
        return this.bulkOperations.bulkCompleteTasks();
    }

    bulkSelectAllVisible() {
        this.bulkOperations.bulkSelectAllVisible();
    }

    async bulkSetStatus() {
        return this.bulkOperations.bulkSetStatus();
    }

    async bulkSetEnergy() {
        return this.bulkOperations.bulkSetEnergy();
    }

    async bulkSetProject() {
        return this.bulkOperations.bulkSetProject();
    }

    async bulkAddContext() {
        return this.bulkOperations.bulkAddContext();
    }

    async bulkSetDueDate() {
        return this.bulkOperations.bulkSetDueDate();
    }

    async bulkDeleteTasks() {
        return this.bulkOperations.bulkDeleteTasks();
    }

    // ==================== SEARCH FUNCTIONALITY (Delegated to SearchManager module) ====================

    setupSearch() {
        this.search.setupSearch();
    }

    populateSearchContexts(selectElement) {
        this.search.populateSearchContexts(selectElement);
    }

    clearSearch() {
        this.search.clearSearch();
    }

    clearAdvancedSearch() {
        this.search.clearAdvancedSearch();
    }

    saveCurrentSearch() {
        this.search.saveCurrentSearch();
    }

    loadSavedSearch(searchId) {
        this.search.loadSavedSearch(searchId);
    }

    deleteSavedSearch(searchId) {
        this.search.deleteSavedSearch(searchId);
    }

    renderSavedSearches() {
        this.search.renderSavedSearches();
    }

    filterTasksBySearch(tasks) {
        return this.search.filterTasksBySearch(tasks);
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

    // ==================== NEW PROJECT BUTTON (Delegated to NewProjectButtonManager module) ====================

    setupNewProjectButton() {
        this.newProjectButton.setupNewProjectButton();
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

    // ==================== NAVIGATION & VIEWS (Delegated to NavigationManager module) ====================

    getGreeting() {
        return this.navigation.getGreeting();
    }

    getGreetingMessage() {
        return this.navigation.getGreetingMessage();
    }

    navigateTo(view) {
        this.navigation.navigateTo(view);
    }

    getProjectTitle(projectId) {
        return this.navigation.getProjectTitle(projectId);
    }

    // ==================================================================

    // ==================== TIME TRACKING (Delegated to TimeTrackingManager module) ====================

    setupTimeTracking() {
        this.timeTracking.setupTimeTracking();
    }

    startTaskTimer(taskId) {
        this.timeTracking.startTaskTimer(taskId);
    }

    stopTaskTimer() {
        this.timeTracking.stopTaskTimer();
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
        this.productivityHeatmap.setupProductivityHeatmap();
    }

    openHeatmapModal() {
        this.productivityHeatmap.openHeatmapModal();
    }

    closeHeatmapModal() {
        this.productivityHeatmap.closeHeatmapModal();
    }

    renderProductivityHeatmap() {
        this.productivityHeatmap.renderProductivityHeatmap();
    }

    // ==================== GLOBAL QUICK CAPTURE (Delegated to GlobalQuickCaptureManager module) ====================

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

    // ==================== TASK PRIORITY SCORING (Delegated to PriorityScoringManager module) ====================

    calculatePriorityScore(task) {
        return this.priorityScoring.calculatePriorityScore(task);
    }

    getPriorityScoreColor(score) {
        return this.priorityScoring.getPriorityScoreColor(score);
    }

    getPriorityLabel(score) {
        return this.priorityScoring.getPriorityLabel(score);
    }

    // ==================== SMART DATE SUGGESTIONS (Delegated to SmartDateSuggestionsManager module) ====================

    setupSmartDateSuggestions() {
        this.smartDateSuggestions.setupSmartDateSuggestions();
    }

    setupDateInputSuggestions(input) {
        this.smartDateSuggestions.setupDateInputSuggestions(input);
    }

    parseNaturalDate(input) {
        return this.smartDateSuggestions.parseNaturalDate(input);
    }

    // ==================== UNDO/REDO SYSTEM ====================

    setupUndoRedo() {
        this.undoRedo.setupUndoRedo();
    }

    saveState(action) {
        this.undoRedo.saveState(action);
    }

    async undo() {
        return this.undoRedo.undo();
    }

    async redo() {
        return this.undoRedo.redo();
    }

    // ==================== MOBILE NAVIGATION ====================

    setupMobileNavigation() {
        this.mobileNavigation.setupMobileNavigation();
    }

    /**
     * Show a toast notification message
     * @param {string} message - The message to display
     * @param {string} type - Notification type: 'success', 'error', 'warning', 'info', or empty for default
     * @param {number} duration - How long to show the notification in ms (default: 2000)
     */
    showNotification(message, type = '', duration = 2000) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;

        // Set colors based on type
        const colors = {
            success: { bg: '#10b981', text: '#ffffff', icon: '✓' },
            error: { bg: '#ef4444', text: '#ffffff', icon: '✕' },
            warning: { bg: '#f59e0b', text: '#ffffff', icon: '⚠' },
            info: { bg: '#3b82f6', text: '#ffffff', icon: 'ℹ' },
            '': { bg: 'var(--text-primary)', text: 'var(--bg-primary)', icon: '' }
        };

        const color = colors[type] || colors[''];

        // Add icon if available
        const icon = color.icon ? `<span style="margin-right: 8px; font-weight: bold;">${color.icon}</span>` : '';

        toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: ${color.bg};
            color: ${color.text};
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideUp 0.3s ease;
            display: flex;
            align-items: center;
            max-width: 90vw;
            word-wrap: break-word;
        `;
        document.body.appendChild(toast);

        // Announce to screen readers
        announce(message, 'polite');

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Alias for showNotification for consistency
    showToast(message, type = '') {
        this.showNotification(message, type);
    }

    /**
     * Convenience method for success notifications
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Convenience method for error notifications
     */
    showError(message) {
        this.showNotification(message, 'error', 3000);
    }

    /**
     * Convenience method for warning notifications
     */
    showWarning(message) {
        this.showNotification(message, 'warning', 3000);
    }

    /**
     * Convenience method for info notifications
     */
    showInfo(message) {
        this.showNotification(message, 'info', 3000);
    }

    // ==================== QUICK CAPTURE WIDGET (Delegated to QuickCaptureWidgetManager module) ====================

    setupQuickCapture() {
        this.quickCaptureWidget.setupQuickCapture();
    }

    renderQuickCaptureContexts() {
        this.quickCaptureWidget.renderQuickCaptureContexts();
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

    // ==================== SUBTASKS MANAGEMENT (Delegated to SubtasksManager module) ====================

    renderSubtasksInModal(subtasks) {
        this.subtasks.renderSubtasksInModal(subtasks);
    }

    addSubtask() {
        this.subtasks.addSubtask();
    }

    removeSubtask(index) {
        this.subtasks.removeSubtask(index);
    }

    toggleSubtaskCompletion(index) {
        this.subtasks.toggleSubtaskCompletion(index);
    }

    getSubtasksFromModal() {
        return this.subtasks.getSubtasksFromModal();
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
            const allContexts = [...defaultContexts, ...tags];

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
                    parts.push('<i class="fas fa-check-circle"></i> Dependencies met!');
                } else {
                    // For non-waiting tasks, just show that dependencies exist
                    parts.push('<i class="fas fa-check-circle"></i> Dependencies met');
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
                ${task.subtasks && task.subtasks.length > 0
? `
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
                `
: ''}
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
                ? '<i class="fas fa-arrow-left"></i> Back to Active Projects'
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
            ${totalTasks > 0
? `
                <div class="project-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${completionPercent}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>${completedTasks.length}/${totalTasks} tasks (${completionPercent}%)</span>
                        ${overdueCount > 0 ? `<span class="overdue-badge"><i class="fas fa-exclamation-circle"></i> ${overdueCount} overdue</span>` : ''}
                    </div>
                </div>
            `
: ''}

            ${taskCount > 0
? `
                <div class="project-tasks">
                    ${tasksPreview}
                    ${taskCount > 3 ? `<div class="project-tasks-more">+${taskCount - 3} more tasks</div>` : ''}
                </div>
            `
: ''}

            ${taskCount === 0 && project.status !== 'archived'
? `
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
            `
: ''}

            ${project.status === 'archived'
? `
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
            `
: ''}

            <div class="project-meta">
                <div class="project-tags">
                    ${project.contexts ? project.contexts.map(context => `<span class="task-context">${escapeHtml(context)}</span>`).join('') : ''}
                </div>
                ${totalTasks > 0
? `
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
                `
: `
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
    // TASK OPERATIONS (Delegated to TaskOperations module)
    // =========================================================================

    async quickAddTask(title) {
        return this.taskOperations.quickAddTask(title);
    }

    async duplicateTask(taskId) {
        return this.taskOperations.duplicateTask(taskId);
    }

    async toggleTaskComplete(taskId) {
        return this.taskOperations.toggleTaskComplete(taskId);
    }

    async deleteTask(taskId) {
        return this.taskOperations.deleteTask(taskId);
    }

    async migrateBlockedTasksToWaiting() {
        return this.taskOperations.migrateBlockedTasksToWaiting();
    }

    async checkWaitingTasksDependencies() {
        return this.taskOperations.checkWaitingTasksDependencies();
    }

    wouldCreateCircularDependency(prerequisiteTaskId, dependentTaskId) {
        return this.taskOperations.wouldCreateCircularDependency(prerequisiteTaskId, dependentTaskId);
    }

    async updateTaskPositions() {
        return this.taskOperations.updateTaskPositions();
    }

    getTaskById(taskId) {
        return this.taskOperations.getTaskById(taskId);
    }

    async updateTask(taskId, updates) {
        return this.taskOperations.updateTask(taskId, updates);
    }

    async assignTaskToProject(taskId, projectId) {
        return this.taskOperations.assignTaskToProject(taskId, projectId);
    }

    async addTimeSpent(taskId, minutes) {
        return this.taskOperations.addTimeSpent(taskId, minutes);
    }

    getActiveTasks() {
        return this.taskOperations.getActiveTasks();
    }

    getCompletedTasks() {
        return this.taskOperations.getCompletedTasks();
    }

    searchTasks(query) {
        return this.taskOperations.searchTasks(query);
    }

    // =========================================================================
    // CONTEXT FILTER (Delegated to ContextFilter module)
    // =========================================================================

    updateContextFilter() {
        return this.contextFilter.updateContextFilter();
    }

    updateSidebarContextFilters() {
        return this.contextFilter.updateSidebarContextFilters();
    }

    toggleContextFilter(context, isChecked) {
        return this.contextFilter.toggleContextFilter(context, isChecked);
    }

    clearContextFilters() {
        return this.contextFilter.clearContextFilters();
    }

    getSelectedContexts() {
        return this.contextFilter.getSelectedContexts();
    }

    isContextSelected(context) {
        return this.contextFilter.isContextSelected(context);
    }

    // =========================================================================
    // PROJECT OPERATIONS (Delegated to ProjectOperations module)
    // =========================================================================

    createProject(projectData) {
        return this.projectOperations.createProject(projectData);
    }

    async deleteProject(projectId) {
        return this.projectOperations.deleteProject(projectId);
    }

    async archiveProject(projectId) {
        return this.projectOperations.archiveProject(projectId);
    }

    async restoreProject(projectId) {
        return this.projectOperations.restoreProject(projectId);
    }

    async updateProjectPositions() {
        return this.projectOperations.updateProjectPositions();
    }

    getProjectById(projectId) {
        return this.projectOperations.getProjectById(projectId);
    }

    getActiveProjects() {
        return this.projectOperations.getActiveProjects();
    }

    getArchivedProjects() {
        return this.projectOperations.getArchivedProjects();
    }

    getProjectsByStatus(status) {
        return this.projectOperations.getProjectsByStatus(status);
    }

    getTasksForProject(projectId) {
        return this.projectOperations.getTasksForProject(projectId);
    }

    getIncompleteTasksForProject(projectId) {
        return this.projectOperations.getIncompleteTasksForProject(projectId);
    }

    getCompletedTasksForProject(projectId) {
        return this.projectOperations.getCompletedTasksForProject(projectId);
    }

    getProjectCompletion(projectId) {
        return this.projectOperations.getProjectCompletion(projectId);
    }

    getProjectStats(projectId) {
        return this.projectOperations.getProjectStats(projectId);
    }

    async updateProject(projectId, updates) {
        return this.projectOperations.updateProject(projectId, updates);
    }

    searchProjects(query) {
        return this.projectOperations.searchProjects(query);
    }

    // =========================================================================
    // TASK MODAL (Delegated to TaskModal module)
    // =========================================================================

    openTaskModal(task = null, defaultProjectId = null, defaultData = {}) {
        return this.taskModal.openTaskModal(task, defaultProjectId, defaultData);
    }

    closeTaskModal() {
        return this.taskModal.closeTaskModal();
    }

    async saveTaskFromForm() {
        return this.taskModal.saveTaskFromForm();
    }

    openTaskModalWithData(formData, projectId = null) {
        return this.taskModal.openTaskModalWithData(formData, projectId);
    }

    renderWaitingForTasksList(currentTask) {
        return this.taskModal.renderWaitingForTasksList(currentTask);
    }

    getSelectedWaitingForTasks() {
        return this.taskModal.getSelectedWaitingForTasks();
    }

    escapeHtml(text) {
        return this.taskModal.escapeHtml(text);
    }

    // =========================================================================
    // PROJECT MODAL (Delegated to ProjectModal module)
    // =========================================================================

    openProjectModal(project = null, pendingTaskData = null) {
        return this.projectModal.openProjectModal(project, pendingTaskData);
    }

    closeProjectModal() {
        return this.projectModal.closeProjectModal();
    }

    async saveProjectFromForm() {
        return this.projectModal.saveProjectFromForm();
    }

    openGanttChart(project) {
        return this.projectModal.openGanttChart(project);
    }

    closeGanttModal() {
        return this.projectModal.closeGanttModal();
    }

    renderGanttChart(project) {
        return this.projectModal.renderGanttChart(project);
    }

    // =========================================================================
    // DATA EXPORT/IMPORT (Delegated to DataExportImport module)
    // =========================================================================

    setupDataExportImport() {
        return this.dataExportImport.setupDataExportImport();
    }

    exportData() {
        return this.dataExportImport.exportData();
    }

    async importData(file) {
        return this.dataExportImport.importData(file);
    }

    openTaskModal_DEPRECATED(task = null, defaultProjectId = null, defaultData = {}) {
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
        document.querySelectorAll('.recurrence-day-checkbox').forEach(cb => {
            cb.checked = false;
        });
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
            return { offset, element: child };
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
console.log('app.js: Creating GTDApp instance...');

// Update diagnostic indicator
const updateIndicator = (text, color = 'orange') => {
    const indicator = document.getElementById('gtd-js-test');
    if (indicator) {
        indicator.innerHTML = `⚠️ ${text}`;
        indicator.style.background = color;
    }
    console.log('DEBUG:', text);
};

updateIndicator('app.js loading...', 'orange');

const app = new GTDApp();
console.log('app.js: GTDApp instance created');
window.app = app; // Expose to global scope for inline onclick handlers

updateIndicator('app.js loaded, waiting for DOM...', 'blue');
console.log('app.js: Waiting for DOMContentLoaded...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('app.js: DOMContentLoaded fired, calling app.init()...');
    updateIndicator('app.js initializing...', 'purple');
    app.init();
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
