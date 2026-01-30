/**
 * GTD Web Application - Main Application Controller (TypeScript)
 * A clean TypeScript version of the main app
 */

import { ElementIds } from './constants'
import { Task, Project, Template } from './models'
import { Storage } from './storage'

// Import manager interfaces
import type { AppDependencies, AppState } from './types'

// Define interfaces for better TypeScript support
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

class GTDApp implements AppState, AppDependencies {
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
    // CONSTRUCTOR
    // =========================================================================
    constructor () {
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

        console.log('app.ts: Creating GTDApp instance...')
    }

    // =========================================================================
    // INITIALIZATION METHODS
    // =========================================================================

    /**
     * Initialize the application
     */
    async init (): Promise<void> {
        try {
            console.log('DEBUG: app.ts loading...')

            // Register service worker for PWA support
            if ('serviceWorker' in navigator) {
                try {
                    const registration =
                        await navigator.serviceWorker.register('/service-worker.js')
                    console.log('Service Worker registered:', registration)
                } catch (swError) {
                    console.log('Service Worker registration failed:', swError)
                }
            }

            // Initialize storage
            await this.storage.init()
            await this.loadData()

            this.setupEventListeners()
            this.displayUserId()
            this.initializeCustomContexts()

            this.renderView()
            this.updateCounts()
            this.renderProjectsDropdown()

            console.log('app.ts: GTDApp instance created')
            console.log('DEBUG: app.ts loaded, waiting for DOM...')
        } catch (error) {
            this.handleInitializationError(error as Error)
        }
    }

    /**
     * Display user ID in UI
     */
    displayUserId (): void {
        const userIdElement = document.getElementById(ElementIds.userId)
        if (userIdElement && this.storage.userId) {
            userIdElement.textContent = this.storage.userId.substr(0, 12) + '...'
        }
    }

    /**
     * Initialize custom contexts from localStorage
     */
    initializeCustomContexts (): void {
        const customContexts = localStorage.getItem('gtd_custom_contexts')
        if (customContexts) {
            try {
                const contexts = JSON.parse(customContexts)
                // Ensure defaultContexts includes custom contexts
                const combined = [...this.defaultContexts, ...contexts]
                this.defaultContexts = Array.from(new Set(combined))
            } catch (e) {
                console.error('Failed to load custom contexts:', e)
            }
        }
    }

    /**
     * Handle initialization error
     */
    handleInitializationError (error: Error): void {
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

    // =========================================================================
    // STUB METHODS - To be implemented
    // =========================================================================

    async loadData (): Promise<void> {
        // To be implemented
        console.log('loadData: Stub method')
    }

    setupEventListeners (): void {
        // To be implemented
        console.log('setupEventListeners: Stub method')
    }

    renderView (): void {
        // To be implemented
        console.log('renderView: Stub method')
    }

    updateCounts (): void {
        // To be implemented
        console.log('updateCounts: Stub method')
    }

    renderProjectsDropdown (): void {
        // To be implemented
        console.log('renderProjectsDropdown: Stub method')
    }

    // =========================================================================
    // CORE METHODS REQUIRED BY MODULES
    // =========================================================================

    async saveTasks (): Promise<void> {
        // To be implemented
        console.log('saveTasks: Stub method')
    }

    async saveProjects (): Promise<void> {
        // To be implemented
        console.log('saveProjects: Stub method')
    }

    async saveTemplates (): Promise<void> {
        // To be implemented
        console.log('saveTemplates: Stub method')
    }

    saveState (description: string): void {
        // To be implemented
        console.log('saveState: Stub method -', description)
    }

    showNotification (title: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
        // To be implemented
        console.log(`showNotification: ${type} - ${title}`)
    }
}
