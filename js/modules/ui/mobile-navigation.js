/**
 * MobileNavigationManager
 * Manages all mobile-specific navigation features including:
 * - Hamburger menu (sidebar toggle)
 * - Mobile menu dropdown (header actions menu)
 * - Bottom navigation
 * - Pull to refresh
 * - Swipe gestures for tasks
 */

export class MobileNavigationManager {
    /**
     * @param {Object} state - The application state object
     * @param {Object} app - The main app instance for delegation
     */
    constructor(state, app) {
        this.state = state;
        this.app = app;
    }

    /**
     * Setup all mobile navigation features
     * This is the main entry point for setting up mobile navigation
     */
    setupMobileNavigation() {
        // Call the internal setup directly
        // The DOM should already be ready when this is called from setupEventListeners
        this.setupMobileNavigationInternal();
    }

    /**
     * Internal setup method for mobile navigation
     * Can be called directly for testing purposes
     */
    setupMobileNavigationInternal() {
        console.log('[Mobile Nav] Setting up mobile navigation...');

        this.setupHamburgerMenu();
        this.setupMobileMenuDropdown();
        this.setupBottomNavigation();
        this.setupPullToRefresh();
        this.setupSwipeGestures();
    }

    /**
     * Synchronous setup method for testing
     * This bypasses the setTimeout and DOMContentLoaded checks
     */
    setupForTest() {
        this.setupMobileNavigationInternal();
    }

    /**
     * Setup hamburger menu for sidebar toggle
     */
    setupHamburgerMenu() {
        const hamburger = document.getElementById('hamburger-menu');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (!hamburger || !sidebar || !overlay) {
            console.warn('[Mobile Nav] Hamburger menu elements not found');
            return;
        }

        hamburger.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('active');
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            hamburger.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', !isOpen);
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    }

    /**
     * Setup mobile menu dropdown in header
     */
    setupMobileMenuDropdown() {
        const mobileMenuBtn = document.getElementById('btn-mobile-menu');
        const mobileMenuDropdown = document.getElementById('mobile-menu-dropdown');

        if (!mobileMenuBtn || !mobileMenuDropdown) {
            console.warn('[Mobile Nav] Mobile menu dropdown elements not found');
            return;
        }

        // Toggle mobile menu
        mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isOpen = mobileMenuDropdown.style.display === 'block';
            mobileMenuDropdown.style.display = isOpen ? 'none' : 'block';
            mobileMenuBtn.setAttribute('aria-expanded', !isOpen);
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileMenuDropdown.style.display === 'block' &&
                !mobileMenuDropdown.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                mobileMenuDropdown.style.display = 'none';
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Handle menu item clicks
        const menuItems = mobileMenuDropdown.querySelectorAll('.mobile-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;

                // Close the menu
                mobileMenuDropdown.style.display = 'none';
                mobileMenuBtn.setAttribute('aria-expanded', 'false');

                // Execute the corresponding action
                switch (action) {
                    case 'calendar-view':
                        this.app.showCalendar?.();
                        break;
                    case 'focus-mode':
                        this.app.enterFocusMode?.();
                        break;
                    case 'new-project':
                        this.app.openProjectModal?.();
                        break;
                    case 'daily-review':
                        this.app.showDailyReview?.();
                        break;
                    case 'weekly-review':
                        this.app.showWeeklyReview?.();
                        break;
                    case 'dashboard':
                        this.app.showDashboard?.();
                        break;
                    case 'dependencies':
                        this.app.showDependencies?.();
                        break;
                    case 'heatmap':
                        this.app.openHeatmapModal?.();
                        break;
                    case 'suggestions':
                        this.app.showSuggestions?.();
                        break;
                    case 'undo':
                        this.app.undo?.();
                        break;
                    case 'redo':
                        this.app.redo?.();
                        break;
                }
            });
        });
    }

    /**
     * Setup bottom navigation for mobile
     */
    setupBottomNavigation() {
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-view]');
        console.log('[Mobile Nav] Found bottom nav items:', bottomNavItems.length);

        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const hamburger = document.getElementById('hamburger-menu');

        bottomNavItems.forEach((item, index) => {
            console.log('[Mobile Nav] Setting up item:', item.dataset.view);

            // Use click event with proper binding
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                console.log('[Bottom Nav] Clicked view:', view);

                // Call switchView with proper context
                if (this.app.switchView && typeof this.app.switchView === 'function') {
                    this.app.switchView(view);
                } else {
                    console.error('[Bottom Nav] switchView not available');
                }

                // Update active state
                bottomNavItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Close sidebar if open
                if (sidebar) {
                    sidebar.classList.remove('active');
                    if (overlay) overlay.classList.remove('active');
                    if (hamburger) hamburger.classList.remove('active');
                }
            });

            // Also add touchend for better mobile responsiveness
            item.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent mouse click event
                const view = item.dataset.view;
                console.log('[Bottom Nav] Touch ended on view:', view);

                if (this.app.switchView && typeof this.app.switchView === 'function') {
                    this.app.switchView(view);
                }

                // Update active state
                bottomNavItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Close sidebar if open
                if (sidebar) {
                    sidebar.classList.remove('active');
                    if (overlay) overlay.classList.remove('active');
                    if (hamburger) hamburger.classList.remove('active');
                }
            });
        });

        // Templates Mobile Button
        const btnTemplatesMobile = document.getElementById('btn-templates-mobile');
        if (btnTemplatesMobile) {
            btnTemplatesMobile.addEventListener('click', () => {
                this.app.openTemplatesModal?.();
            });
        }

        // Search Mobile Button
        const btnSearchMobile = document.getElementById('btn-search-mobile');
        if (btnSearchMobile) {
            btnSearchMobile.addEventListener('click', () => {
                const searchInput = document.getElementById('global-search');
                if (searchInput) {
                    searchInput.focus();
                }
            });
        }
    }

    /**
     * Setup pull to refresh functionality
     */
    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        const pullThreshold = 80;
        const contentArea = document.querySelector('.content-area');

        if (!contentArea) {
            console.warn('[Mobile Nav] Content area not found for pull-to-refresh');
            return;
        }

        // Add pull-to-refresh indicator
        const indicator = document.createElement('div');
        indicator.className = 'pull-to-refresh';
        indicator.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Pull to refresh</span>';
        contentArea.style.position = 'relative';
        contentArea.insertBefore(indicator, contentArea.firstChild);

        contentArea.addEventListener('touchstart', (e) => {
            if (contentArea.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });

        contentArea.addEventListener('touchmove', (e) => {
            if (!isPulling) return;

            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > 0 && contentArea.scrollTop === 0) {
                const pullDistance = Math.min(diff * 0.5, pullThreshold);
                indicator.style.transform = `translateY(${pullDistance}px)`;

                if (pullDistance >= pullThreshold) {
                    indicator.classList.add('refreshing');
                } else {
                    indicator.classList.remove('refreshing');
                }
            }
        }, { passive: true });

        contentArea.addEventListener('touchend', async () => {
            if (!isPulling) return;

            const diff = currentY - startY;
            indicator.style.transform = 'translateY(0)';

            if (diff >= pullThreshold * 2) {
                // Trigger refresh
                indicator.classList.add('refreshing');
                await this.refreshTasks();
                setTimeout(() => {
                    indicator.classList.remove('refreshing');
                }, 1000);
            }

            isPulling = false;
            startY = 0;
            currentY = 0;
        });
    }

    /**
     * Setup swipe gestures for task items
     */
    setupSwipeGestures() {
        // Only enable swipe gestures on touch devices
        if (!('ontouchstart' in window)) {
            console.log('[Mobile Nav] Touch not available, skipping swipe gestures');
            return;
        }

        const tasksContainer = document.querySelector('.content-area');
        if (!tasksContainer) {
            console.warn('[Mobile Nav] Tasks container not found for swipe gestures');
            return;
        }

        let startX = 0;
        let currentX = 0;
        let currentTaskElement = null;
        let isSwipping = false;

        tasksContainer.addEventListener('touchstart', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;

            startX = e.touches[0].clientX;
            currentTaskElement = taskItem;
            isSwipping = true;
        }, { passive: true });

        tasksContainer.addEventListener('touchmove', (e) => {
            if (!isSwipping || !currentTaskElement) return;

            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            const threshold = 50;

            // Prevent scrolling while swiping
            if (Math.abs(diff) > 10) {
                e.preventDefault();
            }

            if (Math.abs(diff) > threshold) {
                currentTaskElement.style.transform = `translateX(${diff}px)`;
            }
        }, { passive: false });

        tasksContainer.addEventListener('touchend', (e) => {
            if (!isSwipping || !currentTaskElement) return;

            const diff = currentX - startX;
            const threshold = 80;
            const taskId = currentTaskElement.dataset.taskId;

            if (Math.abs(diff) > threshold) {
                // Swipe completed - trigger action
                if (diff > 0) {
                    // Swipe right - complete task
                    this.app.toggleTaskComplete?.(taskId);
                } else {
                    // Swipe left - delete/archive task
                    this.app.archiveTask?.(taskId);
                }
            }

            // Reset
            currentTaskElement.style.transform = '';
            currentTaskElement = null;
            isSwipping = false;
            startX = 0;
            currentX = 0;
        });
    }

    /**
     * Refresh tasks from storage (used by pull-to-refresh)
     */
    async refreshTasks() {
        // Reload tasks from storage
        const tasksData = this.app.storage.getTasks();
        this.app.tasks = tasksData.map(data => {
            // Import Task model if needed
            const { Task } = this.app.models || {};
            if (Task && typeof Task.fromJSON === 'function') {
                return Task.fromJSON(data);
            }
            return data;
        });
        this.app.renderView?.();
        this.app.updateCounts?.();
    }
}
