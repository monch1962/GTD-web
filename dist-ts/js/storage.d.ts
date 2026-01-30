/**
 * Storage Layer - Handles localStorage persistence
 */
interface StorageInfo {
    used: number;
    total: number;
    percentage: number;
    available: number;
    nearQuota: boolean;
}
interface ArchiveEntry {
    task: any;
    archivedAt: string;
    originalStatus: string;
    originalProjectId: string | null;
}
export declare class Storage {
    private userId;
    private listeners;
    private QUOTA_WARNING_THRESHOLD;
    private remoteStorage?;
    private syncEnabled;
    constructor(userId?: string | null);
    init(): Promise<this>;
    /**
     * Get or generate user ID
     */
    getUserId(): string;
    /**
     * Check available localStorage space
     * @returns Space info with used, total, percentage, and available bytes
     */
    getStorageInfo(): StorageInfo;
    /**
     * Attempt to free up space by cleaning old archived data
     * @param bytesToFree - Number of bytes to try to free
     * @returns Bytes actually freed
     */
    freeSpace(bytesToFree: number): Promise<number>;
    /**
     * Get item from localStorage with error handling
     */
    getItem(key: string): any;
    /**
     * Set item in localStorage with quota management and error handling
     */
    setItem(key: string, value: any): Promise<boolean>;
    /**
     * Remove item from localStorage and remote
     */
    removeItem(key: string): Promise<boolean>;
    /**
     * Show quota warning to user
     */
    showQuotaWarning(): void;
    /**
     * Show quota error to user
     */
    showQuotaError(): void;
    /**
     * Sync all data from remote storage
     */
    syncFromRemote(): Promise<void>;
    /**
     * Merge local and remote data based on timestamp
     */
    mergeData(local: any[], remote: any[], timestampField: string): any[];
    /**
     * Manual sync trigger
     */
    sync(): Promise<void>;
    /**
     * Update sync status in UI
     */
    updateSyncStatus(status: 'syncing' | 'synced' | 'error'): void;
    /**
     * Subscribe to data changes
     */
    subscribe(key: string, callback: (value: any) => void): void;
    /**
     * Notify listeners of data changes
     */
    notifyListeners(key: string, value: any): void;
    /**
     * Get all tasks
     */
    getTasks(): any[];
    /**
     * Save all tasks
     */
    saveTasks(tasks: any[]): Promise<void>;
    /**
     * Get all projects
     */
    getProjects(): any[];
    /**
     * Save all projects
     */
    saveProjects(projects: any[]): Promise<void>;
    /**
     * Get settings
     */
    getSettings(): any;
    /**
     * Save settings
     */
    saveSettings(settings: any): Promise<void>;
    /**
     * Get all templates
     */
    getTemplates(): any[];
    /**
     * Save all templates
     */
    saveTemplates(templates: any[]): Promise<void>;
    /**
     * Get archived tasks
     */
    getArchivedTasks(): ArchiveEntry[];
    /**
     * Save archived tasks
     */
    saveArchivedTasks(archivedTasks: ArchiveEntry[]): Promise<void>;
    /**
     * Add tasks to archive
     */
    addToArchive(tasksToArchive: any[]): Promise<void>;
}
export {};
//# sourceMappingURL=storage.d.ts.map