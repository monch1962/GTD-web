/**
 * Storage Layer - Handles localStorage persistence - TypeScript Version
 */

import { StorageConfig } from './constants.ts'
import { Task, Project } from './models'

// ============================================================================
// Type Definitions
// ============================================================================

export interface StorageListener {
    (value: any): void
}

export interface RemoteStorage {
    setItem(key: string, value: string): Promise<void>
    getItem(key: string): Promise<string | null>
    removeItem(key: string): Promise<void>
}

export interface ArchiveEntry {
    task: Task // Task JSON data
    archivedAt: string
    originalStatus: string
    originalProjectId: string | null
}

export interface SyncStatus {
    status: 'syncing' | 'synced' | 'error'
    lastSync?: string
    error?: string
}

// ============================================================================
// Storage Class
// ============================================================================

export class Storage {
    userId: string | null
    listeners: Map<string, StorageListener[]>
    QUOTA_WARNING_THRESHOLD: number
    remoteStorage?: RemoteStorage
    syncEnabled: boolean = false
    syncStatus: SyncStatus = { status: 'synced' }

    constructor(userId: string | null = null) {
        this.userId = userId || this.getUserId()
        this.listeners = new Map()
        this.QUOTA_WARNING_THRESHOLD = StorageConfig.QUOTA_WARNING_THRESHOLD
    }

    async init(): Promise<this> {
        // Initialize localStorage
        console.log('Storage initialized with localStorage')
        return this
    }

    /**
     * Get or generate user ID
     */
    getUserId(): string {
        let userId = localStorage.getItem('gtd_user_id')

        if (!userId) {
            // Generate a random UUID for new users
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            localStorage.setItem('gtd_user_id', userId)
        }

        return userId
    }

    /**
     * Check available localStorage space
     * @returns Space info with used, total, percentage, and available bytes
     */
    getStorageInfo(): {
        used: number
        total: number
        percentage: number
        available: number
        nearQuota: boolean
    } {
        let total = 0
        let used = 0

        // Calculate used space
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += key.length + localStorage[key].length
            }
        }

        // Estimate total (typically 5-10MB, varies by browser)
        // We'll estimate based on actual usage patterns
        total = StorageConfig.ESTIMATED_TOTAL_SIZE

        const percentage = (used / total) * 100
        const available = total - used

        return {
            used,
            total,
            percentage,
            available,
            nearQuota: percentage > this.QUOTA_WARNING_THRESHOLD * 100
        }
    }

    /**
     * Attempt to free up space by cleaning old archived data
     * @param bytesToFree - Number of bytes to try to free
     * @returns Bytes actually freed
     */
    async freeSpace(bytesToFree: number): Promise<number> {
        let bytesFreed = 0

        // Try to remove old archived tasks first
        const archive = this.getArchivedTasks()
        if (archive.length > 0) {
            // Sort by archived date (oldest first)
            archive.sort(
                (a, b) => new Date(a.archivedAt).getTime() - new Date(b.archivedAt).getTime()
            )

            // Remove oldest archived entries until we've freed enough space
            const toRemove: string[] = []
            for (const entry of archive) {
                const entrySize = JSON.stringify(entry).length

                // Remove entries older than 180 days
                const archiveAge = Date.now() - new Date(entry.archivedAt).getTime()
                const maxAge = StorageConfig.ARCHIVE_MAX_AGE_MS

                if (archiveAge > maxAge || bytesFreed < bytesToFree) {
                    toRemove.push(entry.task.id)
                    bytesFreed += entrySize
                }

                if (bytesFreed >= bytesToFree) break
            }

            // Remove old entries
            const newArchive = archive.filter((entry) => !toRemove.includes(entry.task.id))
            await this.saveArchivedTasks(newArchive)

            console.log(
                `Freed ${bytesFreed} bytes by removing ${toRemove.length} old archive entries`
            )
        }

        return bytesFreed
    }

    /**
     * Get item from localStorage with error handling
     */
    getItem<T = any>(key: string): T | null {
        try {
            const data = localStorage.getItem(key)
            if (data) {
                try {
                    return JSON.parse(data) as T
                } catch (e) {
                    console.error(`Error parsing ${key} from localStorage:`, e)
                    // Remove corrupted data
                    localStorage.removeItem(key)
                    return null
                }
            }
            return null
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error)
            return null
        }
    }

    /**
     * Set item in localStorage with quota management and error handling
     */
    async setItem<T = any>(key: string, value: T): Promise<boolean> {
        const data = JSON.stringify(value)
        const dataSize = new Blob([data]).size

        try {
            // Check if we're near quota before saving
            const storageInfo = this.getStorageInfo()
            if (storageInfo.nearQuota) {
                console.warn(`Storage nearly full: ${storageInfo.percentage.toFixed(1)}% used`)
                // Try to free up space proactively
                await this.freeSpace(dataSize * 2) // Free 2x the data size
            }

            localStorage.setItem(key, data)

            // Sync to remote storage
            if (this.remoteStorage && this.syncEnabled) {
                try {
                    await this.remoteStorage.setItem(key, data)
                    this.updateSyncStatus('synced')
                } catch (error) {
                    console.error('Error syncing to remote storage:', error)
                    this.updateSyncStatus('error')
                }
            }

            this.notifyListeners(key, value)
            return true
        } catch (error: any) {
            if (error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded:', error)

                // Try to free space and retry
                const freed = await this.freeSpace(dataSize * 3)

                if (freed > 0) {
                    try {
                        localStorage.setItem(key, data)
                        this.notifyListeners(key, value)

                        // Show user notification
                        this.showQuotaWarning()
                        return true
                    } catch (retryError) {
                        console.error('Failed to save even after cleanup:', retryError)
                    }
                }

                // If we still can't save, show error to user
                this.showQuotaError()
                return false
            } else {
                console.error(`Error saving ${key} to localStorage:`, error)
                return false
            }
        }
    }

    /**
     * Remove item from localStorage and remote
     */
    async removeItem(key: string): Promise<boolean> {
        try {
            localStorage.removeItem(key)

            if (this.remoteStorage && this.syncEnabled) {
                try {
                    await this.remoteStorage.removeItem(key)
                    this.updateSyncStatus('synced')
                } catch (error) {
                    console.error('Error removing from remote storage:', error)
                    this.updateSyncStatus('error')
                }
            }

            this.notifyListeners(key, null)
            return true
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error)
            return false
        }
    }

    /**
     * Show quota warning to user
     */
    showQuotaWarning(): void {
        const storageInfo = this.getStorageInfo()
        const message = `Storage almost full (${storageInfo.percentage.toFixed(1)}% used). Old archive items are being cleaned up automatically.`

        // Try to show notification if app is loaded
        if (
            typeof window !== 'undefined' &&
            (window as any).app &&
            (window as any).app.showNotification
        ) {
            ;(window as any).app.showNotification(message)
        } else {
            console.warn(message)
        }
    }

    /**
     * Show quota error to user
     */
    showQuotaError(): void {
        const message =
            'Storage quota exceeded! Please archive old tasks or clear your browser data.'

        // Try to show notification if app is loaded
        if (
            typeof window !== 'undefined' &&
            (window as any).app &&
            (window as any).app.showNotification
        ) {
            ;(window as any).app.showNotification(message)
        } else {
            console.error(message)
        }

        // Show alert as fallback
        if (typeof window !== 'undefined') {
            alert(
                message +
                    '\n\nTo fix this:\n1. Archive old tasks\n2. Clear completed tasks\n3. Export your data and clear browser storage'
            )
        }
    }

    /**
     * Sync all data from remote storage
     */
    async syncFromRemote(): Promise<void> {
        if (!this.remoteStorage) return

        try {
            this.updateSyncStatus('syncing')

            // Get tasks from remote storage
            const remoteTasks = await this.remoteStorage.getItem('gtd_tasks')
            const localTasks = this.getItem<any[]>('gtd_tasks')

            // Use the most recently updated data
            if (remoteTasks && localTasks) {
                const remoteTasksParsed = JSON.parse(remoteTasks)
                const tasks = this.mergeData(localTasks, remoteTasksParsed, 'updatedAt')
                // Save directly to localStorage to avoid sync loop
                localStorage.setItem('gtd_tasks', JSON.stringify(tasks))
            } else if (remoteTasks && !localTasks) {
                localStorage.setItem('gtd_tasks', remoteTasks)
            }

            // Get projects from remote storage
            const remoteProjects = await this.remoteStorage.getItem('gtd_projects')
            const localProjects = this.getItem<any[]>('gtd_projects')

            if (remoteProjects && localProjects) {
                const remoteProjectsParsed = JSON.parse(remoteProjects)
                const projects = this.mergeData(localProjects, remoteProjectsParsed, 'updatedAt')
                // Save directly to localStorage to avoid sync loop
                localStorage.setItem('gtd_projects', JSON.stringify(projects))
            } else if (remoteProjects && !localProjects) {
                localStorage.setItem('gtd_projects', remoteProjects)
            }

            this.updateSyncStatus('synced')
        } catch (error) {
            console.error('Error syncing from remote storage:', error)
            this.updateSyncStatus('error')
        }
    }

    /**
     * Merge local and remote data based on timestamp
     */
    mergeData<T extends { id: string; [key: string]: any }>(
        local: T[],
        remote: T[],
        timestampField: string
    ): T[] {
        const merged = new Map<string, T>()

        // Add all local items
        local.forEach((item) => {
            merged.set(item.id, item)
        })

        // Override with newer remote items
        remote.forEach((item) => {
            const localItem = merged.get(item.id)
            if (
                !localItem ||
                new Date(item[timestampField]) > new Date(localItem[timestampField])
            ) {
                merged.set(item.id, item)
            }
        })

        return Array.from(merged.values())
    }

    /**
     * Manual sync trigger
     */
    async sync(): Promise<void> {
        await this.syncFromRemote()
    }

    /**
     * Update sync status in UI
     */
    updateSyncStatus(status: 'syncing' | 'synced' | 'error'): void {
        const syncButton = document.getElementById('sync-status')
        if (!syncButton) return

        const syncText = syncButton.querySelector('.sync-text')
        if (!syncText) return

        syncButton.classList.remove('syncing', 'error')

        switch (status) {
            case 'syncing':
                syncButton.classList.add('syncing')
                syncText.textContent = 'Syncing...'
                break
            case 'synced':
                syncText.textContent = 'Synced'
                break
            case 'error':
                syncButton.classList.add('error')
                syncText.textContent = 'Sync Error'
                break
        }
    }

    /**
     * Subscribe to data changes
     */
    subscribe(key: string, callback: StorageListener): void {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, [])
        }
        this.listeners.get(key)!.push(callback)
    }

    /**
     * Notify listeners of data changes
     */
    notifyListeners(key: string, value: any): void {
        const callbacks = this.listeners.get(key)
        if (callbacks) {
            callbacks.forEach((callback) => callback(value))
        }
    }

    // ============================================================================
    // Task-specific methods
    // ============================================================================

    /**
     * Get all tasks
     */
    getTasks(): Task[] {
        return this.getItem<Task[]>('gtd_tasks') || []
    }

    /**
     * Save all tasks
     */
    async saveTasks(tasks: Task[]): Promise<void> {
        await this.setItem('gtd_tasks', tasks)
    }

    /**
     * Get all projects
     */
    getProjects(): Project[] {
        return this.getItem<Project[]>('gtd_projects') || []
    }

    /**
     * Save all projects
     */
    async saveProjects(projects: Project[]): Promise<void> {
        await this.setItem('gtd_projects', projects)
    }

    /**
     * Get settings
     */
    getSettings(): any {
        return (
            this.getItem('gtd_settings') || {
                theme: 'light',
                defaultView: 'inbox'
            }
        )
    }

    /**
     * Save settings
     */
    async saveSettings(settings: any): Promise<void> {
        await this.setItem('gtd_settings', settings)
    }

    /**
     * Get all templates
     */
    getTemplates(): any[] {
        return this.getItem<any[]>('gtd_templates') || []
    }

    /**
     * Save all templates
     */
    async saveTemplates(templates: any[]): Promise<void> {
        await this.setItem('gtd_templates', templates)
    }

    /**
     * Get archived tasks
     */
    getArchivedTasks(): ArchiveEntry[] {
        return this.getItem<ArchiveEntry[]>('gtd_archive') || []
    }

    /**
     * Save archived tasks
     */
    async saveArchivedTasks(archivedTasks: ArchiveEntry[]): Promise<void> {
        await this.setItem('gtd_archive', archivedTasks)
    }

    /**
     * Add tasks to archive
     */
    async addToArchive(tasksToArchive: any[]): Promise<void> {
        const archive = this.getArchivedTasks()
        const archivedAt = new Date().toISOString()

        const archiveEntries: ArchiveEntry[] = tasksToArchive.map((task) => ({
            task: task.toJSON ? task.toJSON() : task,
            archivedAt,
            originalStatus: task.status,
            originalProjectId: task.projectId
        }))

        await this.saveArchivedTasks([...archive, ...archiveEntries])
    }
}
