'use strict'
/**
 * Calendar module
 * Handles calendar view for task visualization
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.CalendarManager = void 0
const dom_utils_1 = require('../../dom-utils')
class CalendarManager {
    constructor(state, app) {
        this.state = state
        this.app = app
        // Use the app's calendarDate instead of creating our own
        // This ensures synchronization between app and calendar module
    }
    // Getter for calendarDate - uses app's calendarDate
    get calendarDate() {
        return this.app.calendarDate
    }
    /**
     * Setup calendar view functionality
     */
    setupCalendarView() {
        const calendarBtn = document.getElementById('btn-calendar-view')
        const closeCalendarBtn = document.getElementById('close-calendar-modal')
        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => {
                this.showCalendar()
            })
        }
        if (closeCalendarBtn) {
            closeCalendarBtn.addEventListener('click', () => {
                this.closeCalendar()
            })
        }
    }
    /**
     * Show calendar modal
     */
    showCalendar() {
        const modal = document.getElementById('calendar-modal')
        if (!modal) return
        modal.style.display = 'block'
        this.renderCalendar()
    }
    /**
     * Close calendar modal
     */
    closeCalendar() {
        const modal = document.getElementById('calendar-modal')
        if (modal) modal.style.display = 'none'
    }
    /**
     * Render calendar view
     */
    renderCalendar() {
        const calendarContent = document.getElementById('calendar-content')
        if (!calendarContent) return
        const year = this.calendarDate.getFullYear()
        const month = this.calendarDate.getMonth()
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay() // 0 = Sunday
        // Month navigation
        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ]
        // Get tasks by due date for this month
        const tasksByDate = {}
        this.state.tasks
            .filter((t) => !t.completed && t.dueDate)
            .forEach((task) => {
                const dueDate = new Date(task.dueDate)
                if (dueDate.getFullYear() === year && dueDate.getMonth() === month) {
                    const day = dueDate.getDate()
                    if (!tasksByDate[day]) tasksByDate[day] = []
                    tasksByDate[day].push(task)
                }
            })
        // Build calendar grid
        let calendarHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                <button class="btn btn-secondary" onclick="app.navigateCalendar(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 style="margin: 0;">${monthNames[month]} ${year}</h3>
                <button class="btn btn-secondary" onclick="app.navigateCalendar(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: var(--spacing-md);">
                <div style="text-align: center; font-weight: bold; color: var(--danger-color);">Sun</div>
                <div style="text-align: center; font-weight: bold;">Mon</div>
                <div style="text-align: center; font-weight: bold;">Tue</div>
                <div style="text-align: center; font-weight: bold;">Wed</div>
                <div style="text-align: center; font-weight: bold;">Thu</div>
                <div style="text-align: center; font-weight: bold;">Fri</div>
                <div style="text-align: center; font-weight: bold; color: var(--primary-color);">Sat</div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
        `
        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML +=
                '<div style="min-height: 80px; padding: 4px; background: var(--bg-secondary); border-radius: var(--radius-sm);"></div>'
        }
        // Days of the month
        const today = new Date()
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday =
                today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year
            const dateTasks = tasksByDate[day] || []
            const isWeekend =
                (day + startingDayOfWeek - 1) % 7 === 0 || (day + startingDayOfWeek - 1) % 7 === 6
            calendarHTML += `
                <div style="min-height: 80px; padding: 4px; background: var(--bg-primary); border: 1px solid ${isToday ? 'var(--primary-color)' : 'var(--border-color)'}; border-radius: var(--radius-sm); cursor: pointer;" onclick="app.showTasksForDate(${year}, ${month}, ${day})">
                    <div style="font-weight: ${isToday ? 'bold' : 'normal'}; color: ${isWeekend ? 'var(--text-secondary)' : 'var(--text-primary)'}; margin-bottom: 4px;">${day}</div>
                    <div style="font-size: 0.75rem;">
                        ${dateTasks
                            .slice(0, 3)
                            .map(
                                (task) => `
                            <div style="background: var(--accent-color); color: white; padding: 2px 4px; margin-bottom: 2px; border-radius: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${(0, dom_utils_1.escapeHtml)(task.title)}">${(0, dom_utils_1.escapeHtml)(task.title)}</div>
                        `
                            )
                            .join('')}
                        ${dateTasks.length > 3 ? `<div style="color: var(--text-secondary); font-size: 0.7rem;">+${dateTasks.length - 3} more</div>` : ''}
                    </div>
                </div>
            `
        }
        calendarHTML += `
            </div>

            <div style="margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
                <h4>Tasks Due This Month</h4>
                <div style="max-height: 300px; overflow-y: auto; margin-top: var(--spacing-sm);">
                    ${this.getTasksForMonth(year, month)}
                </div>
            </div>
        `
        calendarContent.innerHTML = calendarHTML
    }
    /**
     * Navigate between months
     * @param direction - Direction to navigate (-1 for previous, 1 for next)
     */
    navigateCalendar(direction) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + direction)
        this.renderCalendar()
    }
    /**
     * Get tasks for a specific month
     * @param year - Year
     * @param month - Month (0-11)
     * @returns HTML string of tasks
     */
    getTasksForMonth(year, month) {
        const tasksDue = this.state.tasks.filter((t) => {
            if (!t.dueDate || t.completed) return false
            const dueDate = new Date(t.dueDate)
            return dueDate.getFullYear() === year && dueDate.getMonth() === month
        })
        if (tasksDue.length === 0) {
            return '<p style="color: var(--text-secondary);">No tasks due this month.</p>'
        }
        return tasksDue
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .map(
                (task) => `
            <div style="padding: 8px; background: var(--bg-primary); border-radius: var(--radius-sm); margin-bottom: var(--spacing-xs); border-left: 3px solid var(--accent-color);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${(0, dom_utils_1.escapeHtml)(task.title)}</strong>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${task.dueDate}</div>
                    </div>
                    <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px;" onclick="event.stopPropagation(); app.openTaskModal?.(app.tasks.find(t => t.id === '${task.id}'))">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `
            )
            .join('')
    }
    /**
     * Show tasks for a specific date
     * @param year - Year
     * @param month - Month (0-11)
     * @param day - Day of month
     */
    showTasksForDate(year, month, day) {
        const tasks = this.state.tasks.filter((t) => {
            if (!t.dueDate) return false
            const dueDate = new Date(t.dueDate)
            return (
                dueDate.getFullYear() === year &&
                dueDate.getMonth() === month &&
                dueDate.getDate() === day
            )
        })
        const dateStr = `${month + 1}/${day}/${year}`
        if (tasks.length === 0) {
            this.app.showInfo?.(`No tasks due on ${dateStr}`)
        } else {
            const taskSummary =
                tasks.length === 1
                    ? tasks[0].title
                    : `${tasks.length} tasks due (e.g., ${tasks[0].title}${tasks.length > 1 ? `, ${tasks[1].title}` : ''}${tasks.length > 2 ? '...' : ''})`
            this.app.showInfo?.(`${dateStr}: ${taskSummary}`)
        }
    }
    /**
     * Get current calendar date
     * @returns Current calendar date
     */
    getCalendarDate() {
        return new Date(this.calendarDate)
    }
    /**
     * Set calendar date
     * @param date - Date to set
     */
    setCalendarDate(date) {
        this.app.calendarDate = new Date(date)
        this.renderCalendar()
    }
    /**
     * Go to today in calendar
     */
    goToToday() {
        this.app.calendarDate = new Date()
        this.renderCalendar()
    }
}
exports.CalendarManager = CalendarManager
//# sourceMappingURL=calendar.js.map
