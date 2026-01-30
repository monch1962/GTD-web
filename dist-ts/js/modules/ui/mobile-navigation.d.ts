/**
 * MobileNavigationManager
 * Manages all mobile-specific navigation features including:
 * - Hamburger menu (sidebar toggle)
 * - Mobile menu dropdown (header actions menu)
 * - Bottom navigation
 * - Pull to refresh
 * - Swipe gestures for tasks
 */
import { Task } from '../../models';
interface AppState {
    tasks: Task[];
}
interface AppDependencies {
    switchView?: (view: string) => void;
    showCalendar?: () => void;
    enterFocusMode?: () => void;
    openProjectModal?: () => void;
    showDailyReview?: () => void;
    showWeeklyReview?: () => void;
    showDashboard?: () => void;
    showDependencies?: () => void;
    showHeatmap?: () => void;
    showSuggestions?: () => void;
    openTemplatesModal?: () => void;
    showSearch?: () => void;
    undo?: () => void;
    redo?: () => void;
    toggleTaskComplete?: (taskId: string) => Promise<void>;
    archiveTask?: (taskId: string) => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    saveTasks?: () => Promise<void>;
    showNotification?: (message: string, type?: string) => void;
    showToast?: (message: string) => void;
}
export declare class MobileNavigationManager {
    private state;
    private app;
    private logger;
    private pullStartY;
    private pullCurrentY;
    private isPulling;
    private pullThreshold;
    private touchData;
    private swipeThreshold;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup all mobile navigation features
     * This is the main entry point for setting up mobile navigation
     */
    setupMobileNavigation(): void;
    /**
     * Internal setup method for mobile navigation
     * Can be called directly for testing purposes
     */
    setupMobileNavigationInternal(): void;
    /**
     * Synchronous setup method for testing
     * This bypasses the setTimeout and DOMContentLoaded checks
     */
    setupForTest(): void;
    /**
     * Setup hamburger menu for sidebar toggle
     */
    setupHamburgerMenu(): void;
    /**
     * Setup mobile menu dropdown in header
     */
    setupMobileMenuDropdown(): void;
    /**
     * Setup bottom navigation for mobile
     */
    setupBottomNavigation(): void;
    /**
     * Setup pull to refresh functionality
     */
    setupPullToRefresh(): void;
    /**
     * Setup swipe gestures for tasks
     */
    setupSwipeGestures(): void;
    /**
     * Refresh tasks from storage
     */
    refreshTasks(): Promise<void>;
}
export {};
//# sourceMappingURL=mobile-navigation.d.ts.map