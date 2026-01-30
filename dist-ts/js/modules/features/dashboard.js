'use strict'
/**
 * Dashboard module
 * Handles analytics and productivity dashboard
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.DashboardManager = void 0
const dom_utils_1 = require('../../dom-utils')
class DashboardManager {
    constructor(state, app) {
        this.state = state
        this.app = app
    }
    /**
     * Setup dashboard functionality
     */
    setupDashboard() {
        const dashboardBtn = document.getElementById('btn-dashboard')
        const closeDashboardBtn = document.getElementById('close-dashboard-modal')
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => {
                this.showDashboard()
            })
        }
        if (closeDashboardBtn) {
            closeDashboardBtn.addEventListener('click', () => {
                this.closeDashboard()
            })
        }
    }
    /**
     * Show dashboard modal
     */
    showDashboard() {
        const modal = document.getElementById('dashboard-modal')
        if (!modal) return
        modal.style.display = 'block'
        this.renderDashboard()
    }
    /**
     * Close dashboard modal
     */
    closeDashboard() {
        const modal = document.getElementById('dashboard-modal')
        if (modal) modal.style.display = 'none'
    }
    /**
     * Render dashboard with all analytics
     */
    renderDashboard() {
        const dashboardContent = document.getElementById('dashboard-content')
        if (!dashboardContent) return
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        // Calculate metrics
        const totalTasks = this.state.tasks.length
        const completedTasks = this.state.tasks.filter((t) => t.completed)
        const activeTasks = this.state.tasks.filter((t) => !t.completed)
        const completedThisWeek = completedTasks.filter(
            (t) => t.completedAt && new Date(t.completedAt) >= weekAgo
        ).length
        const completedThisMonth = completedTasks.filter(
            (t) => t.completedAt && new Date(t.completedAt) >= monthAgo
        ).length
        // Context analytics
        const contextUsage = {}
        const contextCompletion = {}
        this.state.tasks.forEach((task) => {
            if (task.contexts) {
                task.contexts.forEach((context) => {
                    if (!contextUsage[context]) contextUsage[context] = 0
                    contextUsage[context]++
                    if (!contextCompletion[context]) {
                        contextCompletion[context] = { total: 0, completed: 0 }
                    }
                    contextCompletion[context].total++
                    if (task.completed) {
                        contextCompletion[context].completed++
                    }
                })
            }
        })
        // Energy analytics
        const energyStats = {
            high: { total: 0, completed: 0 },
            medium: { total: 0, completed: 0 },
            low: { total: 0, completed: 0 }
        }
        this.state.tasks.forEach((task) => {
            if (task.energy && energyStats[task.energy]) {
                energyStats[task.energy].total++
                if (task.completed) energyStats[task.energy].completed++
            }
        })
        // Time estimation accuracy
        const tasksWithTime = this.state.tasks.filter((t) => t.completed && t.time && t.timeSpent)
        let avgAccuracy = 0
        if (tasksWithTime.length > 0) {
            const accuracies = tasksWithTime.map((t) => {
                const estimated = t.time
                const actual = t.timeSpent || 1
                return Math.min(estimated / actual, actual / estimated)
            })
            avgAccuracy = Number(
                ((accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 100).toFixed(0)
            )
        }
        // Project completion
        const activeProjects = this.state.projects.filter((p) => p.status === 'active')
        const completedProjects = this.state.projects.filter((p) => p.status === 'completed')
        // Stalled projects (no recent activity)
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const stalledProjects = activeProjects.filter((p) => {
            const projectTasks = this.state.tasks.filter(
                (t) => t.projectId === p.id && !t.completed
            )
            const recentUpdates = projectTasks.filter((t) => {
                const updatedAt = new Date(t.updatedAt)
                return updatedAt >= thirtyDaysAgo
            })
            return projectTasks.length > 0 && recentUpdates.length === 0
        })
        // Render dashboard
        dashboardContent.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                <!-- Overview Cards -->
                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem; color: var(--text-secondary);">Total Tasks</h3>
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-color);">${totalTasks}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${activeTasks.length} active, ${completedTasks.length} completed</div>
                </div>

                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem; color: var(--text-secondary);">Completed This Week</h3>
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--success-color);">${completedThisWeek}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${completedThisMonth} this month</div>
                </div>

                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem; color: var(--text-secondary);">Projects</h3>
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--accent-color);">${activeProjects.length}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${completedProjects.length} completed, ${stalledProjects.length} stalled</div>
                </div>

                ${
                    tasksWithTime.length > 0
                        ? `
                <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem; color: var(--text-secondary);">Estimation Accuracy</h3>
                    <div style="font-size: 2.5rem; font-weight: bold; color: var(--info-color);">${avgAccuracy}%</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">Based on ${tasksWithTime.length} completed tasks</div>
                </div>
                `
                        : ''
                }
            </div>

            <!-- Productivity Trends -->
            <div style="margin-bottom: var(--spacing-lg);">
                <h3 style="margin-bottom: var(--spacing-md);">📈 Productivity Trends</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-md);">
                    <!-- Last 7 Days Completion -->
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Tasks Completed (Last 7 Days)</h4>
                        <div style="display: flex; align-items: flex-end; gap: 4px; height: 120px; margin-top: var(--spacing-md);">
                            ${this.renderLast7DaysChart()}
                        </div>
                        <div style="margin-top: var(--spacing-sm); font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
                            ${this.getLast7DaysAverage()} avg tasks/day
                        </div>
                    </div>

                    <!-- Average Task Lifecycle -->
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Average Task Lifecycle</h4>
                        <div style="text-align: center; padding: var(--spacing-md) 0;">
                            <div style="font-size: 2.5rem; font-weight: bold; color: var(--primary-color);">${this.getAverageTaskLifecycle()}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Days from creation to completion</div>
                        </div>
                        ${this.getLifecycleInsight()}
                    </div>

                    <!-- Completion Velocity -->
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Completion Velocity</h4>
                        <div style="text-align: center; padding: var(--spacing-md) 0;">
                            <div style="font-size: 2.5rem; font-weight: bold; color: ${this.getVelocityTrend().color};">${this.getVelocityTrend().icon} ${this.getVelocityTrend().value}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">${this.getVelocityTrend().label}</div>
                        </div>
                        <div style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background: var(--bg-secondary); border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-secondary);">
                            ${this.getVelocityInsight()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Context Analytics -->
            <div style="margin-bottom: var(--spacing-lg);">
                <h3 style="margin-bottom: var(--spacing-md);">Context Usage</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--spacing-sm);">
                    ${Object.entries(contextUsage)
                        .sort((a, b) => b[1] - a[1])
                        .map(([context, count]) => {
                            const completion = contextCompletion[context]
                            const completionRate =
                                completion.total > 0
                                    ? Math.round((completion.completed / completion.total) * 100)
                                    : 0
                            return `
                                <div style="background: var(--bg-primary); padding: var(--spacing-sm); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                        <strong>${(0, dom_utils_1.escapeHtml)(context)}</strong>
                                        <span style="color: var(--text-secondary);">${count} tasks</span>
                                    </div>
                                    <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
                                        <div style="height: 100%; background: var(--success-color); width: ${completionRate}%;"></div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${completionRate}% complete</div>
                                </div>
                            `
                        })
                        .join('')}
                </div>
            </div>

            <!-- Energy Analytics -->
            <div style="margin-bottom: var(--spacing-lg);">
                <h3 style="margin-bottom: var(--spacing-md);">Energy Level Performance</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md);">
                    ${['high', 'medium', 'low']
                        .map((energy) => {
                            const stats = energyStats[energy]
                            const rate =
                                stats.total > 0
                                    ? Math.round((stats.completed / stats.total) * 100)
                                    : 0
                            return `
                            <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color); margin-bottom: var(--spacing-xs);">${energy.charAt(0).toUpperCase() + energy.slice(1)}</div>
                                <div style="font-size: 0.9rem; margin-bottom: var(--spacing-xs);">${stats.completed}/${stats.total} completed</div>
                                <div style="font-size: 2rem; font-weight: bold; color: ${rate >= 70 ? 'var(--success-color)' : rate >= 40 ? 'var(--warning-color)' : 'var(--danger-color)'};">${rate}%</div>
                            </div>
                        `
                        })
                        .join('')}
                </div>
            </div>

            <!-- Time Tracking Analytics -->
            <div style="margin-bottom: var(--spacing-lg);">
                <h3 style="margin-bottom: var(--spacing-md);">Time Tracking</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Total Time Tracked</h4>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${this.formatTotalTime()}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Across all tasks</div>
                    </div>

                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Tasks with Time</h4>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--info-color);">${this.state.tasks.filter((t) => t.timeSpent && t.timeSpent > 0).length}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Tasks tracked</div>
                    </div>

                    <div style="background: var(--bg-primary); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 0.9rem; color: var(--text-secondary);">Avg Time/Task</h4>
                        <div style="font-size: 2rem; font-weight: bold; color: var(--success-color);">${this.getAverageTimePerTask()}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Minutes per task</div>
                    </div>
                </div>

                ${this.renderTimeByContext()}
                ${this.renderTimeByProject()}
            </div>

            ${
                stalledProjects.length > 0
                    ? `
            <!-- Stalled Projects -->
            <div>
                <h3 style="margin-bottom: var(--spacing-md); color: var(--warning-color);">
                    <i class="fas fa-exclamation-triangle"></i> Stalled Projects (30+ days inactive)
                </h3>
                <div style="display: grid; gap: var(--spacing-sm);">
                    ${stalledProjects
                        .map((project) => {
                            const projectTasks = this.state.tasks.filter(
                                (t) => t.projectId === project.id && !t.completed
                            )
                            return `
                            <div style="background: var(--bg-primary); padding: var(--spacing-sm); border-radius: var(--radius-sm); border-left: 3px solid var(--warning-color);">
                                <strong>${(0, dom_utils_1.escapeHtml)(project.title)}</strong>
                                <div style="font-size: 0.85rem; color: var(--text-secondary);">${projectTasks.length} pending tasks</div>
                            </div>
                        `
                        })
                        .join('')}
                </div>
            </div>
            `
                    : ''
            }
        `
    }
    /**
     * Format total time tracked
     */
    formatTotalTime() {
        const totalMinutes = this.state.tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0)
        if (totalMinutes === 0) return '0m'
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }
    /**
     * Get average time per task
     */
    getAverageTimePerTask() {
        const tasksWithTime = this.state.tasks.filter((t) => t.timeSpent && t.timeSpent > 0)
        if (tasksWithTime.length === 0) return 0
        const totalMinutes = tasksWithTime.reduce((sum, task) => sum + task.timeSpent, 0)
        return Math.round(totalMinutes / tasksWithTime.length)
    }
    /**
     * Render time tracking by context
     */
    renderTimeByContext() {
        const timeByContext = {}
        this.state.tasks.forEach((task) => {
            if (task.timeSpent && task.timeSpent > 0 && task.contexts) {
                task.contexts.forEach((context) => {
                    if (!timeByContext[context]) timeByContext[context] = 0
                    timeByContext[context] += task.timeSpent
                })
            }
        })
        const entries = Object.entries(timeByContext).sort((a, b) => b[1] - a[1])
        if (entries.length === 0) return ''
        const maxTime = Math.max(...entries.map((e) => e[1]))
        return `
            <div style="margin-top: var(--spacing-md);">
                <h4 style="margin-bottom: var(--spacing-sm); font-size: 1rem;">Time by Context</h4>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-xs);">
                    ${entries
                        .map(([context, minutes]) => {
                            const percentage = (minutes / maxTime) * 100
                            return `
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                <div style="width: 100px; font-size: 0.85rem;">${(0, dom_utils_1.escapeHtml)(context)}</div>
                                <div style="flex: 1; height: 20px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; position: relative;">
                                    <div style="height: 100%; background: var(--primary-color); width: ${percentage}%; transition: width 0.3s;"></div>
                                    <div style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--text-primary);">${Math.round(minutes)} min</div>
                                </div>
                            </div>
                        `
                        })
                        .join('')}
                </div>
            </div>
        `
    }
    /**
     * Render time tracking by project
     */
    renderTimeByProject() {
        const timeByProject = {}
        this.state.tasks.forEach((task) => {
            if (task.timeSpent && task.timeSpent > 0 && task.projectId) {
                const project = this.state.projects.find((p) => p.id === task.projectId)
                const projectName = project ? project.title : 'Unknown Project'
                if (!timeByProject[projectName]) timeByProject[projectName] = 0
                timeByProject[projectName] += task.timeSpent
            }
        })
        const entries = Object.entries(timeByProject).sort((a, b) => b[1] - a[1])
        if (entries.length === 0) return ''
        const maxTime = Math.max(...entries.map((e) => e[1]))
        return `
            <div style="margin-top: var(--spacing-md);">
                <h4 style="margin-bottom: var(--spacing-sm); font-size: 1rem;">Time by Project</h4>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-xs);">
                    ${entries
                        .map(([project, minutes]) => {
                            const percentage = (minutes / maxTime) * 100
                            return `
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                <div style="width: 150px; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${(0, dom_utils_1.escapeHtml)(project)}</div>
                                <div style="flex: 1; height: 20px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; position: relative;">
                                    <div style="height: 100%; background: var(--success-color); width: ${percentage}%; transition: width 0.3s;"></div>
                                    <div style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: var(--text-primary);">${Math.round(minutes)} min</div>
                                </div>
                            </div>
                        `
                        })
                        .join('')}
                </div>
            </div>
        `
    }
    /**
     * Render last 7 days chart
     */
    renderLast7DaysChart() {
        const days = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            days.push(date)
        }
        // Get completed tasks per day
        const completedByDay = days.map((date) => {
            const dayStart = new Date(date)
            const dayEnd = new Date(date)
            dayEnd.setDate(dayEnd.getDate() + 1)
            return this.state.tasks.filter((t) => {
                if (!t.completedAt) return false
                const completedDate = new Date(t.completedAt)
                return completedDate >= dayStart && completedDate < dayEnd
            }).length
        })
        const maxCount = Math.max(...completedByDay, 1)
        return completedByDay
            .map((count, index) => {
                const height = (count / maxCount) * 100
                const date = days[index]
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                const isToday = index === 6
                return `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${count}</div>
                    <div style="width: 100%; height: 80px; background: var(--bg-secondary); border-radius: 4px 4px 0 0; position: relative; overflow: hidden;">
                        <div style="position: absolute; bottom: 0; width: 100%; height: ${height}%; background: ${isToday ? 'var(--primary-color)' : 'var(--success-color)'}; transition: height 0.3s;"></div>
                    </div>
                    <div style="font-size: 0.7rem; color: ${isToday ? 'var(--primary-color)' : 'var(--text-secondary)'}; font-weight: ${isToday ? 'bold' : 'normal'};">${dayName}</div>
                </div>
            `
            })
            .join('')
    }
    /**
     * Get last 7 days average
     */
    getLast7DaysAverage() {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let totalCompleted = 0
        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dayStart = new Date(date)
            const dayEnd = new Date(date)
            dayEnd.setDate(dayEnd.getDate() + 1)
            totalCompleted += this.state.tasks.filter((t) => {
                if (!t.completedAt) return false
                const completedDate = new Date(t.completedAt)
                return completedDate >= dayStart && completedDate < dayEnd
            }).length
        }
        return (totalCompleted / 7).toFixed(1)
    }
    /**
     * Get average task lifecycle in days
     */
    getAverageTaskLifecycle() {
        const completedTasks = this.state.tasks.filter(
            (t) => t.completed && t.createdAt && t.completedAt
        )
        if (completedTasks.length === 0) return 0
        const totalDays = completedTasks.reduce((sum, task) => {
            const created = new Date(task.createdAt)
            const completed = new Date(task.completedAt)
            const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
            return sum + days
        }, 0)
        return Math.round(totalDays / completedTasks.length)
    }
    /**
     * Get insight about task lifecycle
     */
    getLifecycleInsight() {
        const avg = this.getAverageTaskLifecycle()
        if (avg === 0) return ''
        let insight = ''
        let color = 'var(--text-secondary)'
        if (avg <= 1) {
            insight = '⚡ Super fast! You complete tasks quickly.'
            color = 'var(--success-color)'
        } else if (avg <= 3) {
            insight = '👍 Great velocity! Tasks get done in ~3 days.'
            color = 'var(--info-color)'
        } else if (avg <= 7) {
            insight = '📊 Good pace. Tasks are completed within a week.'
            color = 'var(--primary-color)'
        } else if (avg <= 14) {
            insight = '🐢 Consider breaking down large tasks.'
            color = 'var(--warning-color)'
        } else {
            insight = '⚠️ Tasks are taking a while. Try smaller subtasks.'
            color = 'var(--danger-color)'
        }
        return `<div style="margin-top: var(--spacing-sm); font-size: 0.85rem; color: ${color};">${insight}</div>`
    }
    /**
     * Get velocity trend
     */
    getVelocityTrend() {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        // Last 7 days
        const last7Days = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dayStart = new Date(date)
            const dayEnd = new Date(date)
            dayEnd.setDate(dayEnd.getDate() + 1)
            last7Days.push(
                this.state.tasks.filter((t) => {
                    if (!t.completedAt) return false
                    const completedDate = new Date(t.completedAt)
                    return completedDate >= dayStart && completedDate < dayEnd
                }).length
            )
        }
        // Previous 7 days
        const prev7Days = []
        for (let i = 7; i < 14; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dayStart = new Date(date)
            const dayEnd = new Date(date)
            dayEnd.setDate(dayEnd.getDate() + 1)
            prev7Days.push(
                this.state.tasks.filter((t) => {
                    if (!t.completedAt) return false
                    const completedDate = new Date(t.completedAt)
                    return completedDate >= dayStart && completedDate < dayEnd
                }).length
            )
        }
        const last7Total = last7Days.reduce((a, b) => a + b, 0)
        const prev7Total = prev7Days.reduce((a, b) => a + b, 0)
        const last7Avg = last7Total / 7
        const prev7Avg = prev7Total / 7
        const percentChange = prev7Avg === 0 ? 100 : ((last7Avg - prev7Avg) / prev7Avg) * 100
        const roundedChange = Math.round(percentChange)
        if (roundedChange > 20) {
            return {
                value: `+${roundedChange}%`,
                label: 'vs previous week',
                icon: '📈',
                color: 'var(--success-color)'
            }
        } else if (roundedChange > 0) {
            return {
                value: `+${roundedChange}%`,
                label: 'vs previous week',
                icon: '➕',
                color: 'var(--info-color)'
            }
        } else if (roundedChange > -20) {
            return {
                value: `${roundedChange}%`,
                label: 'vs previous week',
                icon: '➡️',
                color: 'var(--warning-color)'
            }
        } else {
            return {
                value: `${roundedChange}%`,
                label: 'vs previous week',
                icon: '📉',
                color: 'var(--danger-color)'
            }
        }
    }
    /**
     * Get velocity insight
     */
    getVelocityInsight() {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        // This week
        let thisWeekCompleted = 0
        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dayStart = new Date(date)
            const dayEnd = new Date(date)
            dayEnd.setDate(dayEnd.getDate() + 1)
            thisWeekCompleted += this.state.tasks.filter((t) => {
                if (!t.completedAt) return false
                const completedDate = new Date(t.completedAt)
                return completedDate >= dayStart && completedDate < dayEnd
            }).length
        }
        if (thisWeekCompleted >= 20) {
            return "🔥 Outstanding productivity! You're on fire!"
        } else if (thisWeekCompleted >= 10) {
            return '💪 Strong week! Keep up the great work.'
        } else if (thisWeekCompleted >= 5) {
            return '👍 Good progress. Stay focused!'
        } else if (thisWeekCompleted > 0) {
            return '📝 Making progress. Every task counts!'
        } else {
            return '💭 Start small. Complete one task today!'
        }
    }
}
exports.DashboardManager = DashboardManager
//# sourceMappingURL=dashboard.js.map
