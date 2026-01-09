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
 */

export class ProductivityHeatmapManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
    }

    // =========================================================================
    // SETUP
    // =========================================================================

    /**
     * Setup the productivity heatmap feature
     */
    setupProductivityHeatmap() {
        const heatmapBtn = document.getElementById('btn-heatmap');
        if (heatmapBtn) {
            heatmapBtn.addEventListener('click', () => this.openHeatmapModal());
        }

        const closeBtn = document.getElementById('close-heatmap-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeHeatmapModal());
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Open the heatmap modal
     */
    openHeatmapModal() {
        const modal = document.getElementById('heatmap-modal');
        if (modal) {
            modal.classList.add('active');
            this.renderProductivityHeatmap();
        }
    }

    /**
     * Close the heatmap modal
     */
    closeHeatmapModal() {
        const modal = document.getElementById('heatmap-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Render the productivity heatmap
     */
    renderProductivityHeatmap() {
        const container = document.getElementById('heatmap-container');
        if (!container) return;

        // Get completion data for the last 365 days
        const days = 365;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Build completion count per day
        const completionData = this.buildCompletionData(startDate, endDate);

        // Update statistics
        this.updateHeatmapStats(completionData);

        // Render the heatmap grid
        this.renderHeatmapGrid(completionData, days, container);
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    /**
     * Build completion data for date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Object} Completion data with date keys
     */
    buildCompletionData(startDate, endDate) {
        const data = {};
        const currentDate = new Date(startDate);

        // Initialize all days with 0
        while (currentDate <= endDate) {
            const dateKey = this.getDateKey(currentDate);
            data[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Count completed tasks per day
        this.state.tasks.forEach(task => {
            if (task.completed && task.completedAt) {
                const completedDate = new Date(task.completedAt);
                const dateKey = this.getDateKey(completedDate);
                if (data.hasOwnProperty(dateKey)) {
                    data[dateKey]++;
                }
            }
        });

        return data;
    }

    /**
     * Get date key in YYYY-MM-DD format
     * @param {Date} date - Date to format
     * @returns {string} Formatted date key
     */
    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    /**
     * Update heatmap statistics display
     * @param {Object} completionData - Completion data
     */
    updateHeatmapStats(completionData) {
        const values = Object.values(completionData);
        const totalCompleted = values.reduce((sum, count) => sum + count, 0);
        const bestDay = Math.max(...values);
        const daysWithData = values.filter(v => v > 0).length;
        const avgPerDay = daysWithData > 0 ? Math.round(totalCompleted / daysWithData * 10) / 10 : 0;

        // Calculate current streak
        const streak = this.calculateCurrentStreak(completionData);

        document.getElementById('heatmap-total-completed').textContent = totalCompleted;
        document.getElementById('heatmap-best-day').textContent = bestDay;
        document.getElementById('heatmap-avg-day').textContent = avgPerDay;
        document.getElementById('heatmap-streak').textContent = streak;
    }

    /**
     * Calculate current completion streak
     * @param {Object} completionData - Completion data
     * @returns {number} Current streak in days
     */
    calculateCurrentStreak(completionData) {
        let streak = 0;
        const today = new Date();
        const checkDate = new Date(today);

        while (true) {
            const dateKey = this.getDateKey(checkDate);
            if (completionData[dateKey] > 0) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (dateKey === this.getDateKey(today)) {
                // Today has no completions yet, check yesterday
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Render the heatmap grid
     * @param {Object} completionData - Completion data
     * @param {number} days - Number of days to display
     * @param {HTMLElement} container - Container element
     */
    renderHeatmapGrid(completionData, days, container) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Find the max value for normalization
        const maxCount = Math.max(...Object.values(completionData), 1);

        // Create day labels
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayLabelsHTML = dayLabels.map((day, index) => {
            if (index % 2 === 1) { // Show every other day
                return `<div class="heatmap-day-label">${day}</div>`;
            }
            return '<div class="heatmap-day-label"></div>';
        }).join('');

        // Create cells
        let cellsHTML = '';
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = this.getDateKey(currentDate);
            const count = completionData[dateKey] || 0;
            const level = this.getHeatmapLevel(count, maxCount);
            const formattedDate = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            cellsHTML += `<div class="heatmap-cell level-${level}" data-date="${formattedDate}" data-count="${count}"></div>`;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Create month labels
        const monthLabelsHTML = this.createMonthLabels(startDate, endDate);

        container.innerHTML = `
            <div class="heatmap-wrapper">
                <div class="heatmap-day-labels">${dayLabelsHTML}</div>
                <div>
                    <div class="heatmap-grid">${cellsHTML}</div>
                    <div class="heatmap-month-labels">${monthLabelsHTML}</div>
                </div>
            </div>
        `;

        // Add tooltip functionality
        this.setupHeatmapTooltips();
    }

    /**
     * Get heatmap level (0-4) for color intensity
     * @param {number} count - Task count for the day
     * @param {number} maxCount - Maximum count in the dataset
     * @returns {number} Level from 0-4
     */
    getHeatmapLevel(count, maxCount) {
        if (count === 0) return 0;
        if (maxCount <= 4) {
            return Math.min(count, 4);
        }
        const percentage = count / maxCount;
        if (percentage < 0.25) return 1;
        if (percentage < 0.5) return 2;
        if (percentage < 0.75) return 3;
        return 4;
    }

    /**
     * Create month labels for the heatmap
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {string} HTML string of month labels
     */
    createMonthLabels(startDate, endDate) {
        const labels = [];
        const currentMonth = new Date(startDate);
        currentMonth.setDate(1); // Set to first of month

        let weekIndex = 0;
        let weeksInMonth = 0;

        while (currentMonth <= endDate) {
            const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
            weeksInMonth = Math.ceil(daysInMonth / 7);

            const monthName = currentMonth.toLocaleDateString('en-US', { month: 'short' });
            const leftPos = weekIndex * 15 + 8; // 15px per week, 8px offset

            labels.push(`<span class="heatmap-month-label" style="left: ${leftPos}px;">${monthName}</span>`);

            weekIndex += weeksInMonth;
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }

        return labels.join('');
    }

    /**
     * Setup interactive tooltips for heatmap cells
     */
    setupHeatmapTooltips() {
        const cells = document.querySelectorAll('.heatmap-cell');
        let tooltip = null;

        cells.forEach(cell => {
            cell.addEventListener('mouseenter', (e) => {
                const date = e.target.dataset.date;
                const count = e.target.dataset.count;

                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.className = 'heatmap-tooltip';
                    document.body.appendChild(tooltip);
                }

                tooltip.innerHTML = `<strong>${count}</strong> tasks completed on ${date}`;
                tooltip.style.display = 'block';

                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = `${rect.left + rect.width / 2}px`;
                tooltip.style.top = `${rect.top - 40}px`;
                tooltip.style.transform = 'translateX(-50%)';
            });

            cell.addEventListener('mouseleave', () => {
                if (tooltip) {
                    tooltip.style.display = 'none';
                }
            });
        });
    }
}
