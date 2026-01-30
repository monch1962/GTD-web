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

import { getDefaultContextIds } from './config/defaultContexts.ts'
import {
    ElementIds,
    RecurrenceLabels,
    ViewLabels,
    Weekday,
    WeekdayNames,
    NthWeekdayLabels
} from './constants.ts'
import { escapeHtml, announce } from './dom-utils.ts'
import { Task, Project, Template } from './models'
import { ArchiveManager } from './modules/features/archive.ts'
import { BulkOperationsManager } from './modules/features/bulk-operations.ts'
import { CalendarManager } from './modules/features/calendar.ts'
import { ContextFilterManager } from './modules/features/context-filter.ts'
import { DailyReviewManager } from './modules/features/daily-review.ts'
import { DashboardManager } from './modules/features/dashboard.ts'
import { DataExportImportManager } from './modules/features/data-export-import.ts'
import { DependenciesManager } from './modules/features/dependencies.ts'
import { FocusPomodoroManager } from './modules/features/focus-pomodoro.ts'
import { GlobalQuickCaptureManager } from './modules/features/global-quick-capture.ts'
import { NavigationManager } from './modules/features/navigation.ts'
import { NewProjectButtonManager } from './modules/features/new-project-button.ts'
import { PriorityScoringManager } from './modules/features/priority-scoring.ts'
import { ProductivityHeatmapManager } from './modules/features/productivity-heatmap.ts'
import { ProjectModalManager } from './modules/features/project-modal.ts'
import { ProjectOperations } from './modules/features/project-operations.ts'
import { QuickCaptureWidgetManager } from './modules/features/quick-capture-widget.ts'
import { SearchManager } from './modules/features/search.ts'
import { SmartDateSuggestionsManager } from './modules/features/smart-date-suggestions.ts'
import { SmartSuggestionsManager } from './modules/features/smart-suggestions.ts'
import { SubtasksManager } from './modules/features/subtasks.ts'
import { TaskModalManager } from './modules/features/task-modal.ts'
import { TaskOperations } from './modules/features/task-operations.ts'
import { TemplatesManager } from './modules/features/templates.ts'
import { TimeTrackingManager } from './modules/features/time-tracking.ts'
import { UndoRedoManager } from './modules/features/undo-redo.ts'
import { WeeklyReviewManager } from './modules/features/weekly-review.ts'
import { ContextMenuManager } from './modules/ui/context-menu.ts'
import { DarkModeManager } from './modules/ui/dark-mode.ts'
import { MobileNavigationManager } from './modules/ui/mobile-navigation.ts'
import { TaskParser } from './nlp-parser.ts'
import { Storage } from './storage.ts'

// Define types for better TypeScript support
interface TaskFilter {
    context: string
    energy: string
    time: string
}

interface UsageStats {
    [key: string]: any
}

interface HistoryState {
    tasks: Task[]
    projects: Project[]
    templates: Template[]
    action: string
    timestamp: string
}

class GTDApp {
    // =========================================================================
    // PROPERTIES
    // =========================================================================
    
    // Core data
    storage: Storage
    tasks: Task[]
    projects: Project[]
    templates: Template[]
    
    // State
    currentView: string
    currentProjectId: string | null
    filters: TaskFilter
    searchQuery: string
    advancedSearchFilters: any
    savedSearches: any[]
    selectedContextFilters: Set<string>
    selectedTaskId: string | null
    bulkSelectionMode: boolean
    selectedTaskIds: Set<string>
    usageStats: UsageStats
    defaultContexts: string[]
    focusTaskId: string | null
    calendarDate: Date
    history: HistoryState[]
    historyIndex: number
    
    // Managers
    archive: ArchiveManager
    bulkOperations: BulkOperationsManager
    calendar: CalendarManager
    contextFilter: ContextFilterManager
    dailyReview: DailyReviewManager
    dashboard: DashboardManager
    dataExportImport: DataExportImportManager
    dependencies: DependenciesManager
    focusPomodoro: FocusPomodoroManager
    globalQuickCapture: GlobalQuickCaptureManager
    navigation: NavigationManager
    newProjectButton: NewProjectButtonManager
    priorityScoring: PriorityScoringManager
    productivityHeatmap: ProductivityHeatmapManager
    projectModal: ProjectModalManager
    projectOperations: ProjectOperations
    quickCaptureWidget: QuickCaptureWidgetManager
    search: SearchManager
    smartDateSuggestions: SmartDateSuggestionsManager
    smartSuggestions: SmartSuggestionsManager
    subtasks: SubtasksManager
    taskModal: TaskModalManager
    taskOperations: TaskOperations
    templatesManager: TemplatesManager
    timeTracking: TimeTrackingManager
    undoRedo: UndoRedoManager
    weeklyReview: WeeklyReviewManager
    contextMenu: ContextMenuManager
    darkMode: DarkModeManager
    mobileNavigation: MobileNavigationManager
    parser: TaskParser
    
    // UI state
    showingArchivedProjects: boolean
    pendingTaskData: any
    touchData: any
    touchStartTime: number
    touchStartX: number
    touchStartY: number
    touchTimeout: any
    contextMenuTaskId: string | null
    
    // Debug
    debugMode: boolean
    debugBanner: HTMLElement | null
    debugBannerTimeout: any

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    constructor() {
        this.storage = new Storage()
        this.tasks = []
        this.projects = []
        this.templates = []
        this.currentView = 'inbox'
        this.currentProjectId = null
        this.filters = {
            context: '',
            energy: '',
            time: ''
        }
        this.searchQuery = ''
        this.advancedSearchFilters = {}
        this.savedSearches = []
        this.selectedContextFilters = new Set()
        this.selectedTaskId = null
        this.bulkSelectionMode = false
        this.selectedTaskIds = new Set()
        this.usageStats = {}
        this.defaultContexts = []
        this.focusTaskId = null
        this.calendarDate = new Date()
        this.history = []
        this.historyIndex = -1

        // Initialize managers
        this.archive = new ArchiveManager(this, this)
        this.bulkOperations = new BulkOperationsManager(this, this)
        this.calendar = new CalendarManager(this, this)
        this.contextFilter = new ContextFilterManager(this, this)
        this.dailyReview = new DailyReviewManager(this, this)
        this.dashboard = new DashboardManager(this, this)
        this.dataExportImport = new DataExportImportManager(this, this)
        this.dependencies = new DependenciesManager(this, this)
        this.focusPomodoro = new FocusPomodoroManager(this, this)
        this.globalQuickCapture = new GlobalQuickCaptureManager(this, this)
        this.navigation = new NavigationManager(this, this)
        this.newProjectButton = new NewProjectButtonManager(this, this)
        this.priorityScoring = new PriorityScoringManager(this, this)
        this.productivityHeatmap = new ProductivityHeatmapManager(this, this)
        this.projectModal = new ProjectModalManager(this, this)
        this.projectOperations = new ProjectOperations(this, this)
        this.quickCaptureWidget = new QuickCaptureWidgetManager(this, this)
        this.search = new SearchManager(this, this)
        this.smartDateSuggestions = new SmartDateSuggestionsManager(this, this)
        this.smartSuggestions = new SmartSuggestionsManager(this, this)
        this.subtasks = new SubtasksManager(this, this)
        this.taskModal = new TaskModalManager(this, this)
        this.taskOperations = new TaskOperations(this, this)
        this.templatesManager = new TemplatesManager(this, this)
        this.timeTracking = new TimeTrackingManager(this, this)
        this.undoRedo = new UndoRedoManager(this, this)
        this.weeklyReview = new WeeklyReviewManager(this, this)
        this.contextMenu = new ContextMenuManager(this, this)
        this.darkMode = new DarkModeManager()
        this.mobileNavigation = new MobileNavigationManager(this, this)
        this.parser = new TaskParser()

        // UI state
        this.showingArchivedProjects = false
        this.pendingTaskData = null
        this.touchData = {}
        this.touchStartTime = 0
        this.touchStartX = 0
        this.touchStartY = 0
        this.touchTimeout = null
        this.contextMenuTaskId = null

        // Debug
        this.debugMode = false
        this.debugBanner = null
        this.debugBannerTimeout = null

        console.log('app.js: Creating GTDApp instance...')
    }

    // =========================================================================
    // INITIALIZATION METHODS
    // =========================================================================
    
    /**
     * Initialize the application
     */
    async init(): Promise<void> {
        try {
            console.log('DEBUG: app.js loading...')

            // Register service worker for PWA support
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js')
                    console.log('Service Worker registered:', registration)
                } catch (swError) {
                    console.log('Service Worker registration failed:', swError)
        }
    }
}

            // Initialize dark mode from preference
            this.darkMode.initializeDarkMode()

            // Initialize storage
            await this.storage.init()
            await this.loadData()

            this.setupEventListeners()
            this.displayUserId()
            this.initializeCustomContexts()

            // Migrate blocked tasks to Waiting (one-time migration for existing data)
            await this.migrateBlockedTasksToWaiting()

            // Check if any waiting tasks now have their dependencies met
            await this.checkWaitingTasksDependencies()

            this.renderView()
            this.updateCounts()
            this.renderProjectsDropdown()
            this.contextFilter.updateContextFilter()

            console.log('app.js: GTDApp instance created')
            console.log('DEBUG: app.js loaded, waiting for DOM...')
        } catch (error) {
            this.handleInitializationError(error)
        }
    }

    /**
     * Display user ID in UI
     */
    displayUserId(): void {
        const userIdElement = document.getElementById(ElementIds.userId)
        if (userIdElement && this.storage.userId) {
            userIdElement.textContent = this.storage.userId.substr(0, 12) + '...'
        }
    }

    /**
     * Initialize custom contexts from localStorage
     */
    initializeCustomContexts(): void {
        const customContexts = localStorage.getItem('gtd_custom_contexts')
        if (customContexts) {
            try {
                const contexts = JSON.parse(customContexts)
                // Ensure defaultContexts includes custom contexts
                this.defaultContexts = [
                    ...new Set([...this.defaultContexts, ...contexts])
                ]
            } catch (e) {
                console.error('Failed to load custom contexts:', e)
            }
        }
    }

    /**
     * Handle initialization error
     */
    handleInitializationError(error: Error): void {
        console.error('Failed to initialize application:', error)
        const container = document.getElementById('app-container')
        if (container) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <h2>Failed to initialize application</h2>
                    <p>Error: ${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Reload</button>
                </div>
            `
        }
    }