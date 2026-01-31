/**
 * ============================================================================
 * Productivity Heatmap Manager
 * ============================================================================
 *
 * Manages the GitHub-style productivity heatmap visualization showing
 * task completion activity over the last 365 days.
 *
 * This manager handles:
 * - Heatmap modal display and control
 * - 365-day completion data aggregation
 * - Statistics calculation (total, best day, average, streak)
 * - GitHub-style heatmap grid rendering
 * - Interactive tooltips showing daily completion counts
 * - Month and day labels
 *
 * @example
 * const heatmap = new ProductivityHeatmapManager(state, app);
 * heatmap.setupProductivityHeatmap();
 * heatmap.openHeatmapModal();
 * heatmap.renderProductivityHeatmap();
 */
import { Task, Project } from '../../models'
// Define interfaces for state and app dependencies
interface AppState {
    tasks: Task[]
    projects: Project[]
}
// AppDependencies is not used in this module but kept for consistency
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppDependencies {
    // No methods needed since app is not used
}
interface CompletionData {
    [dateKey: string]: number
}
export class ProductivityHeatmapManager {
    private state: AppState
    private _app: AppDependencies
    /**
     * @param state - The application state object
     * @param app - The main app instance for delegation
     */
    constructor (state: AppState, app: AppDependencies) {
        this.state = state
        this._app = app
    }

    // =========================================================================
    // SETUP
    // =========================================================================
    /**
     * Setup the productivity heatmap feature
     */
    setupProductivityHeatmap (): void {
        const heatmapBtn = document.getElementById('btn-heatmap')
        if (heatmapBtn) {
            heatmapBtn.addEventListener('click', () => this.openHeatmapModal())
        }
        const closeBtn = document.getElementById('close-heatmap-modal')
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeHeatmapModal())
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================
    /**
     * Open the heatmap modal
     */
    openHeatmapModal (): void {
        const modal = document.getElementById('heatmap-modal')
        if (modal) {
            modal.classList.add('active')
            this.renderProductivityHeatmap()
        }
    }

    /**
     * Close the heatmap modal
     */
    closeHeatmapModal (): void {
        const modal = document.getElementById('heatmap-modal')
        if (modal) {
            modal.classList.remove('active')
        }
    }

    /**
     * Render the productivity heatmap
     */
    renderProductivityHeatmap (): void {
        const container = document.getElementById('heatmap-container')
        if (!container) return
        // Get completion data for the last 365 days
        const days = 365
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        // Build completion count per day
        const completionData = this.buildCompletionData(startDate, endDate)
        // Update statistics
        this.updateHeatmapStats(completionData)
        // Render the heatmap grid
        this.renderHeatmapGrid(completionData, days, container)
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================
    /**
     * Build completion data for date range
     * @param startDate - Start date
     * @param endDate - End date
     * @returns Completion data with date keys
     */
    buildCompletionData (startDate: Date, endDate: Date): CompletionData {
        const data: CompletionData = {}
        // Initialize all days with 0
        for (
            let currentDate = new Date(startDate);
            currentDate <= endDate;
            currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        ) {
            const dateKey = this.getDateKey(currentDate)
            data[dateKey] = 0
        }
        // Count completed tasks per day
        this.state.tasks.forEach((task) => {
            if (task.completed && task.completedAt) {
                const completedDate = new Date(task.completedAt)
                const dateKey = this.getDateKey(completedDate)
                if (Object.prototype.hasOwnProperty.call(data, dateKey)) {
                    data[dateKey]++
                }
            }
        })
        return data
    }

    /**
     * Get date key in YYYY-MM-DD format
     * @param date - Date to format
     * @returns Formatted date key
     */
    getDateKey (date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    /**
     * Update heatmap statistics display
     * @param completionData - Completion data
     */
    updateHeatmapStats (completionData: CompletionData): void {
        const values = Object.values(completionData)
        const totalCompleted = values.reduce((sum, count) => sum + count, 0)
        const bestDay = Math.max(...values)
        const daysWithData = values.filter((v) => v > 0).length
        const avgPerDay =
            daysWithData > 0 ? Math.round((totalCompleted / daysWithData) * 10) / 10 : 0
        // Calculate current streak
        const streak = this.calculateCurrentStreak(completionData)
        const totalEl = document.getElementById('heatmap-total-completed')
        const bestDayEl = document.getElementById('heatmap-best-day')
        const avgDayEl = document.getElementById('heatmap-avg-day')
        const streakEl = document.getElementById('heatmap-streak')
        if (totalEl) totalEl.textContent = totalCompleted.toString()
        if (bestDayEl) bestDayEl.textContent = bestDay.toString()
        if (avgDayEl) avgDayEl.textContent = avgPerDay.toString()
        if (streakEl) streakEl.textContent = streak.toString()
    }

    /**
     * Calculate current completion streak
     * @param completionData - Completion data
     * @returns Current streak in days
     */
    calculateCurrentStreak (completionData: CompletionData): number {
        let streak = 0
        const today = new Date()
        const checkDate = new Date(today)
        while (true) {
            const dateKey = this.getDateKey(checkDate)
            if (completionData[dateKey] > 0) {
                streak++
                checkDate.setDate(checkDate.getDate() - 1)
            } else if (dateKey === this.getDateKey(today)) {
                // Today has no completions yet, check yesterday
                checkDate.setDate(checkDate.getDate() - 1)
            } else {
                break
            }
        }
        return streak
    }

    /**
     * Render the heatmap grid
     * @param completionData - Completion data
     * @param days - Number of days to display
     * @param container - Container element
     */
    renderHeatmapGrid (completionData: CompletionData, days: number, container: HTMLElement): void {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        // Find the max value for normalization
        const maxCount = Math.max(...Object.values(completionData), 1)
        // Create day labels
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const dayLabelsHTML = dayLabels
            .map((day, index) => {
                if (index % 2 === 1) {
                    // Show every other day
                    return `<div class="heatmap-day-label">${day}</div>`
                }
                return '<div class="heatmap-day-label"></div>'
            })
            .join('')
        // Create cells
        let cellsHTML = ''
        for (
            let currentDate = new Date(startDate);
            currentDate <= endDate;
            currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        ) {
            const dateKey = this.getDateKey(currentDate)
            const count = completionData[dateKey] || 0
            const level = this.getHeatmapLevel(count, maxCount)
            const formattedDate = currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            cellsHTML += `<div class="heatmap-cell level-${level}" data-date="${formattedDate}" data-count="${count}"></div>`
        }
        // Create month labels
        const monthLabelsHTML = this.createMonthLabels(startDate, endDate)
        container.innerHTML = `
            <div class="heatmap-wrapper">
                <div class="heatmap-day-labels">${dayLabelsHTML}</div>
                <div>
                    <div class="heatmap-grid">${cellsHTML}</div>
                    <div class="heatmap-month-labels">${monthLabelsHTML}</div>
                </div>
            </div>
        `
        // Add tooltip functionality
        this.setupHeatmapTooltips()
    }

    /**
     * Get heatmap level (0-4) for color intensity
     * @param count - Task count for the day
     * @param maxCount - Maximum count in the dataset
     * @returns Level from 0-4
     */
    getHeatmapLevel (count: number, maxCount: number): number {
        if (count === 0) return 0
        if (maxCount <= 4) {
            return Math.min(count, 4)
        }
        const percentage = count / maxCount
        if (percentage < 0.25) return 1
        if (percentage < 0.5) return 2
        if (percentage < 0.75) return 3
        return 4
    }

    /**
     * Create month labels for the heatmap
     * @param startDate - Start date
     * @param endDate - End date
     * @returns HTML string of month labels
     */
    createMonthLabels (startDate: Date, endDate: Date): string {
        const labels: string[] = []
        let weekIndex = 0
        let weeksInMonth = 0
        for (
            let currentMonth = new Date(startDate);
            currentMonth <= endDate;
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        ) {
            currentMonth.setDate(1) // Set to first of month
            const daysInMonth = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                0
            ).getDate()
            weeksInMonth = Math.ceil(daysInMonth / 7)
            const monthName = currentMonth.toLocaleDateString('en-US', { month: 'short' })
            const leftPos = weekIndex * 15 + 8 // 15px per week, 8px offset
            labels.push(
                `<span class="heatmap-month-label" style="left: ${leftPos}px;">${monthName}</span>`
            )
            weekIndex += weeksInMonth
        }
        return labels.join('')
    }

    /**
     * Setup interactive tooltips for heatmap cells
     */
    setupHeatmapTooltips (): void {
        const cells = document.querySelectorAll('.heatmap-cell')
        let tooltip: HTMLElement | null = null
        cells.forEach((cell) => {
            cell.addEventListener('mouseenter', (e) => {
                const target = e.target as HTMLElement
                const date = target.dataset.date
                const count = target.dataset.count
                if (!tooltip) {
                    tooltip = document.createElement('div')
                    tooltip.className = 'heatmap-tooltip'
                    document.body.appendChild(tooltip)
                }
                tooltip.innerHTML = `<strong>${count}</strong> tasks completed on ${date}`
                tooltip.style.display = 'block'
                const rect = target.getBoundingClientRect()
                tooltip.style.left = `${rect.left + rect.width / 2}px`
                tooltip.style.top = `${rect.top - 40}px`
                tooltip.style.transform = 'translateX(-50%)'
            })
            cell.addEventListener('mouseleave', () => {
                if (tooltip) {
                    tooltip.style.display = 'none'
                }
            })
        })
    }
}
