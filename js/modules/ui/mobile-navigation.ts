/**
 * MobileNavigationManager
 * Manages all mobile-specific navigation features including:
 * - Hamburger menu (sidebar toggle)
 * - Mobile menu dropdown (header actions menu)
 * - Bottom navigation
 * - Pull to refresh
 * - Swipe gestures for tasks
 */

import { createLogger } from '../utils/logger'
import type { AppState, AppDependencies } from '../../types'

interface Logger {
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
}

interface TouchData {
    startX: number
    startY: number
    lastX: number
    lastY: number
    taskElement: HTMLElement | null
    taskId: string | null
    startTime: number
}

export class MobileNavigationManager {
    private state: AppState
    private app: AppDependencies
    private logger: Logger

    // Pull to refresh state
    private pullStartY: number = 0
    private pullCurrentY: number = 0
    private isPulling: boolean = false
    private pullThreshold: number = 100

    // Swipe gesture state
    private touchData: TouchData | null = null
    private swipeThreshold: number = 100

    constructor (state: AppState, app: AppDependencies) {
        this.state = state // Kept for compatibility with manager pattern
        this.app = app
        this.logger = createLogger('MobileNav')

        // Dummy usage to satisfy TypeScript
        if (process.env.NODE_ENV === 'test' && this.state.tasks.length > 1000) {
            console.log('State has many tasks')
        }
    }

    /**
     * Setup all mobile navigation features
     * This is the main entry point for setting up mobile navigation
     */
    setupMobileNavigation (): void {
        // Call the internal setup directly
        // The DOM should already be ready when this is called from setupEventListeners
        this.setupMobileNavigationInternal()
    }

    /**
     * Internal setup method for mobile navigation
     * Can be called directly for testing purposes
     */
    setupMobileNavigationInternal (): void {
        this.logger.debug('Setting up mobile navigation...')

        this.setupHamburgerMenu()
        this.setupMobileMenuDropdown()
        this.setupBottomNavigation()
        this.setupPullToRefresh()
        this.setupSwipeGestures()
    }

    /**
     * Synchronous setup method for testing
     * This bypasses the setTimeout and DOMContentLoaded checks
     */
    setupForTest (): void {
        this.setupMobileNavigationInternal()
    }

    /**
     * Setup hamburger menu for sidebar toggle
     */
    setupHamburgerMenu (): void {
        const hamburger = document.getElementById('hamburger-menu') as HTMLButtonElement | null
        const sidebar = document.querySelector('.sidebar') as HTMLElement | null
        const overlay = document.getElementById('sidebar-overlay') as HTMLElement | null

        if (!hamburger || !sidebar || !overlay) {
            this.logger.warn('Hamburger menu elements not found')
            return
        }

        hamburger.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('active')
            sidebar.classList.toggle('active')
            overlay.classList.toggle('active')
            hamburger.classList.toggle('active')
            hamburger.setAttribute('aria-expanded', String(!isOpen))
        })

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active')
            overlay.classList.remove('active')
            hamburger.classList.remove('active')
            hamburger.setAttribute('aria-expanded', 'false')
        })
    }

    /**
     * Setup mobile menu dropdown in header
     */
    setupMobileMenuDropdown (): void {
        const mobileMenuBtn = document.getElementById('btn-mobile-menu') as HTMLButtonElement | null
        const mobileMenuDropdown = document.getElementById(
            'mobile-menu-dropdown'
        ) as HTMLElement | null

        if (!mobileMenuBtn || !mobileMenuDropdown) {
            this.logger.warn('Mobile menu dropdown elements not found')
            return
        }

        // Toggle mobile menu
        mobileMenuBtn.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()

            const isOpen = mobileMenuDropdown.style.display === 'block'
            mobileMenuDropdown.style.display = isOpen ? 'none' : 'block'
            mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen))
        })

        // Close menu when clicking outside
        document.addEventListener('click', (e: MouseEvent) => {
            if (
                mobileMenuDropdown.style.display === 'block' &&
                !mobileMenuDropdown.contains(e.target as Node) &&
                !mobileMenuBtn.contains(e.target as Node)
            ) {
                mobileMenuDropdown.style.display = 'none'
                mobileMenuBtn.setAttribute('aria-expanded', 'false')
            }
        })

        // Handle menu item clicks
        const menuItems = mobileMenuDropdown.querySelectorAll('.mobile-menu-item')
        menuItems.forEach((item) => {
            item.addEventListener('click', (e: Event) => {
                const action = (e.currentTarget as HTMLElement).getAttribute('data-action')

                // Close the menu
                mobileMenuDropdown.style.display = 'none'
                mobileMenuBtn.setAttribute('aria-expanded', 'false')

                // Execute the corresponding action
                switch (action) {
                case 'calendar-view':
                    this.app.showCalendar?.()
                    break
                case 'focus-mode':
                    this.app.enterFocusMode?.()
                    break
                case 'new-project':
                    this.app.openProjectModal?.(null)
                    break
                case 'daily-review':
                    this.app.showDailyReview?.()
                    break
                case 'weekly-review':
                    this.app.showWeeklyReview?.()
                    break
                case 'dashboard':
                    this.app.showDashboard?.()
                    break
                case 'dependencies':
                    this.app.showDependencies?.()
                    break
                case 'heatmap':
                    this.app.openHeatmapModal?.()
                    break
                case 'suggestions':
                    this.app.showSuggestions?.()
                    break
                case 'undo':
                    this.app.undo?.()
                    break
                case 'redo':
                    this.app.redo?.()
                    break
                }
            })
        })
    }

    /**
     * Setup bottom navigation for mobile
     */
    setupBottomNavigation (): void {
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item')

        if (bottomNavItems.length === 0) {
            this.logger.debug('No bottom nav items found')
            return
        }

        this.logger.debug(`Found bottom nav items: ${bottomNavItems.length}`)

        bottomNavItems.forEach((item) => {
            const view = item.getAttribute('data-view')
            const id = item.id

            item.addEventListener('click', () => {
                if (view) {
                    // Switch to the specified view
                    this.app.switchView?.(view)

                    // Update active state on bottom nav items
                    bottomNavItems.forEach((navItem) => {
                        navItem.classList.remove('active')
                    })
                    item.classList.add('active')

                    // Close sidebar if open
                    const sidebar = document.querySelector('.sidebar') as HTMLElement | null
                    const overlay = document.getElementById('sidebar-overlay') as HTMLElement | null
                    const hamburger = document.getElementById(
                        'hamburger-menu'
                    ) as HTMLButtonElement | null

                    if (sidebar && overlay && hamburger) {
                        sidebar.classList.remove('active')
                        overlay.classList.remove('active')
                        hamburger.classList.remove('active')
                        hamburger.setAttribute('aria-expanded', 'false')
                    }
                } else if (id === 'btn-templates-mobile') {
                    // Open templates modal
                    this.app.openTemplatesModal?.()
                } else if (id === 'btn-search-mobile') {
                    // Focus search input
                    const searchInput = document.getElementById(
                        'global-search'
                    ) as HTMLInputElement | null
                    if (searchInput) {
                        searchInput.focus()
                    } else {
                        this.app.showSearch?.()
                    }
                }
            })

            // Add touchend for better mobile responsiveness
            item.addEventListener('touchend', (e: Event) => {
                const touchEvent = e as TouchEvent
                touchEvent.preventDefault() // Prevent default touch behavior
                item.dispatchEvent(new MouseEvent('click'))
            })
        })
    }

    /**
     * Setup pull to refresh functionality
     */
    setupPullToRefresh (): void {
        const contentArea = document.querySelector('.main-content') as HTMLElement | null
        if (!contentArea) {
            this.logger.warn('Content area not found for pull-to-refresh')
            return
        }

        const pullIndicator = document.createElement('div')
        pullIndicator.className = 'pull-to-refresh'
        pullIndicator.style.cssText = `
            position: absolute;
            top: -50px;
            left: 0;
            right: 0;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
            color: var(--text-secondary);
            font-size: 0.9rem;
            transition: transform 0.2s;
            z-index: 1000;
        `
        pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Pull to refresh'
        contentArea.appendChild(pullIndicator)

        let isAtTop = false

        contentArea.addEventListener(
            'touchstart',
            (e: TouchEvent) => {
                isAtTop = contentArea.scrollTop === 0
                if (isAtTop) {
                    this.pullStartY = e.touches[0].clientY
                    this.isPulling = true
                }
            },
            { passive: true }
        )

        contentArea.addEventListener(
            'touchmove',
            (e: TouchEvent) => {
                if (!this.isPulling || !isAtTop) return

                this.pullCurrentY = e.touches[0].clientY
                const pullDistance = Math.max(0, this.pullCurrentY - this.pullStartY)

                if (pullDistance > 0) {
                    e.preventDefault() // Prevent scroll when pulling
                    const pullProgress = Math.min(pullDistance / this.pullThreshold, 1)
                    pullIndicator.style.transform = `translateY(${pullDistance}px)`
                    pullIndicator.style.opacity = String(pullProgress)

                    if (pullDistance > this.pullThreshold) {
                        pullIndicator.innerHTML =
                            '<i class="fas fa-sync-alt fa-spin"></i> Release to refresh'
                        pullIndicator.classList.add('refreshing')
                    } else {
                        pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Pull to refresh'
                        pullIndicator.classList.remove('refreshing')
                    }
                }
            },
            { passive: false }
        )

        contentArea.addEventListener('touchend', () => {
            if (!this.isPulling) return

            this.isPulling = false
            const pullDistance = this.pullCurrentY - this.pullStartY

            // Animate indicator back
            pullIndicator.style.transition = 'transform 0.3s, opacity 0.3s'
            pullIndicator.style.transform = 'translateY(0)'
            pullIndicator.style.opacity = '0'

            setTimeout(() => {
                pullIndicator.style.transition = ''
            }, 300)

            // Trigger refresh if pulled past threshold
            if (pullDistance > this.pullThreshold) {
                pullIndicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...'
                pullIndicator.classList.add('refreshing')
                this.refreshTasks()
            }
        })
    }

    /**
     * Setup swipe gestures for tasks
     */
    setupSwipeGestures (): void {
        const contentArea = document.querySelector('.tasks-container') as HTMLElement | null
        if (!contentArea) {
            this.logger.warn('Content area not found for swipe gestures')
            return
        }

        // Check if touch is available
        if (!('ontouchstart' in window)) {
            this.logger.debug('Touch not available, skipping swipe gestures')
            return
        }

        contentArea.addEventListener(
            'touchstart',
            (e: TouchEvent) => {
                const touch = e.touches[0]
                const target = e.target as HTMLElement
                const taskElement = target?.closest('.task-item') as HTMLElement | null

                if (taskElement) {
                    this.touchData = {
                        startX: touch.clientX,
                        startY: touch.clientY,
                        lastX: touch.clientX,
                        lastY: touch.clientY,
                        taskElement,
                        taskId: taskElement.getAttribute('data-task-id'),
                        startTime: Date.now()
                    }
                }
            },
            { passive: true }
        )

        contentArea.addEventListener(
            'touchmove',
            (e: TouchEvent) => {
                if (!this.touchData || !this.touchData.taskElement) return

                const touch = e.touches[0]
                const deltaX = touch.clientX - this.touchData.startX
                const deltaY = touch.clientY - this.touchData.startY

                // Update last position
                this.touchData.lastX = touch.clientX
                this.touchData.lastY = touch.clientY

                // Only process horizontal swipes (handle case where deltaY might be NaN)
                const absDeltaX = Math.abs(deltaX)
                const absDeltaY = Math.abs(deltaY)
                if (isNaN(absDeltaY) || absDeltaX > absDeltaY) {
                    e.preventDefault() // Prevent vertical scroll during horizontal swipe

                    // Apply transform to task element
                    this.touchData.taskElement.style.transform = `translateX(${deltaX}px)`
                    this.touchData.taskElement.style.transition = 'none'

                    // Visual feedback
                    if (deltaX > 0) {
                        // Swipe right (complete)
                        this.touchData.taskElement.style.backgroundColor =
                            'var(--success-color-light)'
                    } else {
                        // Swipe left (archive)
                        this.touchData.taskElement.style.backgroundColor =
                            'var(--warning-color-light)'
                    }
                }
            },
            { passive: false }
        )

        contentArea.addEventListener('touchend', () => {
            if (!this.touchData || !this.touchData.taskElement || !this.touchData.taskId) {
                this.touchData = null
                return
            }

            const deltaX = this.touchData.lastX - this.touchData.startX
            const elapsedTime = Date.now() - this.touchData.startTime

            // Reset task element
            this.touchData.taskElement.style.transform = ''
            this.touchData.taskElement.style.transition = 'transform 0.3s, background-color 0.3s'
            this.touchData.taskElement.style.backgroundColor = ''

            // Check if swipe was significant and fast enough
            if (Math.abs(deltaX) >= this.swipeThreshold && elapsedTime < 500) {
                if (deltaX > 0) {
                    // Swipe right - complete task
                    this.app.toggleTaskComplete?.(this.touchData.taskId)
                    this.app.showToast?.('Task completed!')
                } else {
                    // Swipe left - archive task
                    this.app.archiveTask?.(this.touchData.taskId)
                    this.app.showToast?.('Task archived!')
                }
            }

            this.touchData = null
        })
    }

    /**
     * Refresh tasks from storage
     */
    async refreshTasks (): Promise<void> {
        try {
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Reload tasks from storage
            const tasksData = this.app.storage?.getTasks?.() || []

            // Convert to Task instances if Task.fromJSON is available
            if (this.app.models?.Task?.fromJSON && tasksData.length > 0) {
                const tasks = tasksData.map((taskData: any) =>
                    this.app.models!.Task!.fromJSON!(taskData)
                )
                // Update state with loaded tasks
                this.state.tasks = tasks
            } else if (tasksData.length > 0) {
                // Use raw data if Task.fromJSON is not available
                this.state.tasks = tasksData
            } else {
                // Empty task list
                this.state.tasks = []
            }

            // Update UI
            this.app.renderView?.()
            this.app.updateCounts?.()

            // Hide refresh indicator
            const pullIndicator = document.querySelector('.pull-to-refresh') as HTMLElement | null
            if (pullIndicator) {
                pullIndicator.classList.remove('refreshing')
                pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Pull to refresh'
            }

            this.app.showToast?.('Tasks refreshed')
        } catch (error) {
            this.logger.error('Error refreshing tasks:', error)
            this.app.showNotification?.('Error refreshing tasks', 'error')
        }
    }
}
