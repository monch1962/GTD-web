/**
 * Storage Layer - Handles localStorage and remote-storage integration
 */

export class Storage {
    constructor(userId = null) {
        this.userId = userId || this.getUserId();
        this.remoteStorage = null;
        this.syncEnabled = false; // Disabled for now
        this.listeners = new Map();
    }

    async init() {
        // Remote storage temporarily disabled due to ES module compatibility issues
        // TODO: Implement cloud sync using a browser-compatible solution
        console.log('Storage initialized with localStorage only');
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
     * Get item from localStorage
     */
    getItem(key) {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error(`Error parsing ${key} from localStorage:`, e);
                return null;
            }
        }
        return null;
    }

    /**
     * Set item in localStorage and sync to remote
     */
    async setItem(key, value) {
        const data = JSON.stringify(value);
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
    }

    /**
     * Remove item from localStorage and remote
     */
    async removeItem(key) {
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
}
