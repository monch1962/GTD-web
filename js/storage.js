/**
 * Storage Layer - Handles localStorage persistence
 */

import { StorageConfig } from './constants.js';

export class Storage {
    constructor(userId = null) {
        this.userId = userId || this.getUserId();
        this.listeners = new Map();
        this.QUOTA_WARNING_THRESHOLD = StorageConfig.QUOTA_WARNING_THRESHOLD;
    }

    async init() {
        // Initialize localStorage
        console.log('Storage initialized with localStorage');

        return this;
    }

    /**
     * Get or generate user ID
     */
    getUserId() {
        let userId = localStorage.getItem('gtd_user_id');

        if (!userId) {
            // Generate a random UUID for new users
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('gtd_user_id', userId);
        }

        return userId;
    }

    /**
     * Check available localStorage space
     * @returns {Object} Space info with used, total, percentage, and available bytes
     */
    getStorageInfo() {
        let total = 0;
        let used = 0;

        // Calculate used space
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += key.length + localStorage[key].length;
            }
        }

        // Estimate total (typically 5-10MB, varies by browser)
        // We'll estimate based on actual usage patterns
        total = StorageConfig.ESTIMATED_TOTAL_SIZE;

        const percentage = (used / total) * 100;
        const available = total - used;

        return {
            used,
            total,
            percentage,
            available,
            nearQuota: percentage > (this.QUOTA_WARNING_THRESHOLD * 100)
        };
    }

    /**
     * Attempt to free up space by cleaning old archived data
     * @param {number} bytesToFree - Number of bytes to try to free
     * @returns {number} Bytes actually freed
     */
    async freeSpace(bytesToFree) {
        let bytesFreed = 0;

        // Try to remove old archived tasks first
        const archive = this.getArchivedTasks();
        if (archive.length > 0) {
            // Sort by archived date (oldest first)
            archive.sort((a, b) => new Date(a.archivedAt) - new Date(b.archivedAt));

            // Remove oldest archived entries until we've freed enough space
            const toRemove = [];
            for (const entry of archive) {
                const entrySize = JSON.stringify(entry).length;

                // Remove entries older than 180 days
                const archiveAge = Date.now() - new Date(entry.archivedAt).getTime();
                const maxAge = StorageConfig.ARCHIVE_MAX_AGE_MS;

                if (archiveAge > maxAge || (bytesFreed < bytesToFree)) {
                    toRemove.push(entry.task.id);
                    bytesFreed += entrySize;
                }

                if (bytesFreed >= bytesToFree) break;
            }

            // Remove old entries
            const newArchive = archive.filter(entry => !toRemove.includes(entry.task.id));
            await this.saveArchivedTasks(newArchive);

            console.log(`Freed ${bytesFreed} bytes by removing ${toRemove.length} old archive entries`);
        }

        return bytesFreed;
    }

    /**
     * Get item from localStorage with error handling
     */
    getItem(key) {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    console.error(`Error parsing ${key} from localStorage:`, e);
                    // Remove corrupted data
                    localStorage.removeItem(key);
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return null;
        }
    }

    /**
     * Set item in localStorage with quota management and error handling
     */
    async setItem(key, value) {
        const data = JSON.stringify(value);
        const dataSize = new Blob([data]).size;

        try {
            // Check if we're near quota before saving
            const storageInfo = this.getStorageInfo();
            if (storageInfo.nearQuota) {
                console.warn(`Storage nearly full: ${storageInfo.percentage.toFixed(1)}% used`);
                // Try to free up space proactively
                await this.freeSpace(dataSize * 2); // Free 2x the data size
            }

            localStorage.setItem(key, data);

            // Sync to remote storage
            if (this.remoteStorage && this.syncEnabled) {
                try {
                    await this.remoteStorage.setItem(key, data);
                    this.updateSyncStatus('synced');
                } catch (error) {
                    console.error('Error syncing to remote storage:', error);
                    this.updateSyncStatus('error');
                }
            }

            this.notifyListeners(key, value);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded:', error);

                // Try to free space and retry
                const freed = await this.freeSpace(dataSize * 3);

                if (freed > 0) {
                    try {
                        localStorage.setItem(key, data);
                        this.notifyListeners(key, value);

                        // Show user notification
                        this.showQuotaWarning();
                        return true;
                    } catch (retryError) {
                        console.error('Failed to save even after cleanup:', retryError);
                    }
                }

                // If we still can't save, show error to user
                this.showQuotaError();
                return false;
            } else {
                console.error(`Error saving ${key} to localStorage:`, error);
                return false;
            }
        }
    }

    /**
     * Remove item from localStorage and remote
     */
    async removeItem(key) {
        try {
            localStorage.removeItem(key);

            if (this.remoteStorage && this.syncEnabled) {
                try {
                    await this.remoteStorage.removeItem(key);
                    this.updateSyncStatus('synced');
                } catch (error) {
                    console.error('Error removing from remote storage:', error);
                    this.updateSyncStatus('error');
                }
            }

            this.notifyListeners(key, null);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
            return false;
        }
    }

    /**
     * Show quota warning to user
     */
    showQuotaWarning() {
        const storageInfo = this.getStorageInfo();
        const message = `Storage almost full (${storageInfo.percentage.toFixed(1)}% used). Old archive items are being cleaned up automatically.`;

        // Try to show notification if app is loaded
        if (typeof window !== 'undefined' && window.app && window.app.showNotification) {
            window.app.showNotification(message);
        } else {
            console.warn(message);
        }
    }

    /**
     * Show quota error to user
     */
    showQuotaError() {
        const message = 'Storage quota exceeded! Please archive old tasks or clear your browser data.';

        // Try to show notification if app is loaded
        if (typeof window !== 'undefined' && window.app && window.app.showNotification) {
            window.app.showNotification(message);
        } else {
            console.error(message);
        }

        // Show alert as fallback
        if (typeof window !== 'undefined') {
            alert(message + '\n\nTo fix this:\n1. Archive old tasks\n2. Clear completed tasks\n3. Export your data and clear browser storage');
        }
    }

    /**
     * Sync all data from remote storage
     */
    async syncFromRemote() {
        if (!this.remoteStorage) return;

        try {
            this.updateSyncStatus('syncing');

            // Get tasks from remote storage
            const remoteTasks = await this.remoteStorage.getItem('gtd_tasks');
            const localTasks = this.getItem('gtd_tasks');

            // Use the most recently updated data
            if (remoteTasks && localTasks) {
                const tasks = this.mergeData(localTasks, remoteTasks, 'updatedAt');
                // Save directly to localStorage to avoid sync loop
                localStorage.setItem('gtd_tasks', JSON.stringify(tasks));
            } else if (remoteTasks && !localTasks) {
                localStorage.setItem('gtd_tasks', JSON.stringify(remoteTasks));
            }

            // Get projects from remote storage
            const remoteProjects = await this.remoteStorage.getItem('gtd_projects');
            const localProjects = this.getItem('gtd_projects');

            if (remoteProjects && localProjects) {
                const projects = this.mergeData(localProjects, remoteProjects, 'updatedAt');
                // Save directly to localStorage to avoid sync loop
                localStorage.setItem('gtd_projects', JSON.stringify(projects));
            } else if (remoteProjects && !localProjects) {
                localStorage.setItem('gtd_projects', JSON.stringify(remoteProjects));
            }

            this.updateSyncStatus('synced');
        } catch (error) {
            console.error('Error syncing from remote storage:', error);
            this.updateSyncStatus('error');
        }
    }

    /**
     * Merge local and remote data based on timestamp
     */
    mergeData(local, remote, timestampField) {
        const merged = new Map();

        // Add all local items
        local.forEach(item => {
            merged.set(item.id, item);
        });

        // Override with newer remote items
        remote.forEach(item => {
            const localItem = merged.get(item.id);
            if (!localItem || new Date(item[timestampField]) > new Date(localItem[timestampField])) {
                merged.set(item.id, item);
            }
        });

        return Array.from(merged.values());
    }

    /**
     * Manual sync trigger
     */
    async sync() {
        await this.syncFromRemote();
    }

    /**
     * Update sync status in UI
     */
    updateSyncStatus(status) {
        const syncButton = document.getElementById('sync-status');
        if (!syncButton) return;

        const syncText = syncButton.querySelector('.sync-text');
        if (!syncText) return;

        syncButton.classList.remove('syncing', 'error');

        switch (status) {
            case 'syncing':
                syncButton.classList.add('syncing');
                syncText.textContent = 'Syncing...';
                break;
            case 'synced':
                syncText.textContent = 'Synced';
                break;
            case 'error':
                syncButton.classList.add('error');
                syncText.textContent = 'Sync Error';
                break;
        }
    }

    /**
     * Subscribe to data changes
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
    }

    /**
     * Notify listeners of data changes
     */
    notifyListeners(key, value) {
        const callbacks = this.listeners.get(key);
        if (callbacks) {
            callbacks.forEach(callback => callback(value));
        }
    }

    /**
     * Get all tasks
     */
    getTasks() {
        return this.getItem('gtd_tasks') || [];
    }

    /**
     * Save all tasks
     */
    async saveTasks(tasks) {
        await this.setItem('gtd_tasks', tasks);
    }

    /**
     * Get all projects
     */
    getProjects() {
        return this.getItem('gtd_projects') || [];
    }

    /**
     * Save all projects
     */
    async saveProjects(projects) {
        await this.setItem('gtd_projects', projects);
    }

    /**
     * Get settings
     */
    getSettings() {
        return this.getItem('gtd_settings') || {
            theme: 'light',
            defaultView: 'inbox'
        };
    }

    /**
     * Save settings
     */
    async saveSettings(settings) {
        await this.setItem('gtd_settings', settings);
    }

    /**
     * Get all templates
     */
    getTemplates() {
        return this.getItem('gtd_templates') || [];
    }

    /**
     * Save all templates
     */
    async saveTemplates(templates) {
        await this.setItem('gtd_templates', templates);
    }

    /**
     * Get archived tasks
     */
    getArchivedTasks() {
        return this.getItem('gtd_archive') || [];
    }

    /**
     * Save archived tasks
     */
    async saveArchivedTasks(archivedTasks) {
        await this.setItem('gtd_archive', archivedTasks);
    }

    /**
     * Add tasks to archive
     */
    async addToArchive(tasksToArchive) {
        const archive = this.getArchivedTasks();
        const archivedAt = new Date().toISOString();

        const archiveEntries = tasksToArchive.map(task => ({
            task: task.toJSON ? task.toJSON() : task,
            archivedAt,
            originalStatus: task.status,
            originalProjectId: task.projectId
        }));

        await this.saveArchivedTasks([...archive, ...archiveEntries]);
    }
}
