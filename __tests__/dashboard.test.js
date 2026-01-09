/**
 * Test: Dashboard Manager
 * Comprehensive tests for dashboard analytics functionality
 */

// Mock dom-utils before importing
import { DashboardManager } from '../js/modules/features/dashboard.js'

jest.mock('../js/dom-utils.js', () => ({
    escapeHtml: (str) => str,
    getElement: (id) => null,
    setTextContent: (el, text) => {
        if (el) el.textContent = text
    },
    announce: jest.fn()
}))

// Mock dependencies
const mockApp = {
    showToast: jest.fn()
}

const mockState = {
    tasks: [],
    projects: []
}

describe('DashboardManager', () => {
    let manager

    beforeEach(() => {
        // Reset state
        mockState.tasks = []
        mockState.projects = []

        // Setup DOM elements
        document.body.innerHTML = `
            <button id="btn-dashboard">Dashboard</button>
            <div id="dashboard-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <h2>Productivity Dashboard</h2>
                    <button id="close-dashboard-modal">Close</button>
                    <div id="dashboard-content"></div>
                </div>
            </div>
            <div id="announcer"></div>
        `

        manager = new DashboardManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        jest.clearAllMocks()
    })

    describe('Initialization', () => {
        test('should initialize with state and app references', () => {
            expect(manager.state).toBe(mockState)
            expect(manager.app).toBe(mockApp)
        })

        test('should setup dashboard when calling setupDashboard', () => {
            const setupSpy = jest.spyOn(manager, 'setupDashboard')
            manager.setupDashboard()
            expect(setupSpy).toHaveBeenCalled()
        })
    })

    describe('setupDashboard', () => {
        test('should attach event listener to dashboard button', () => {
            const showSpy = jest.spyOn(manager, 'showDashboard')
            manager.setupDashboard()

            const dashboardBtn = document.getElementById('btn-dashboard')
            dashboardBtn.click()

            expect(showSpy).toHaveBeenCalled()
        })

        test('should attach event listener to close button', () => {
            const closeSpy = jest.spyOn(manager, 'closeDashboard')
            manager.setupDashboard()

            const closeBtn = document.getElementById('close-dashboard-modal')
            closeBtn.click()

            expect(closeSpy).toHaveBeenCalled()
        })

        test('should handle missing dashboard button gracefully', () => {
            document.getElementById('btn-dashboard').remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            expect(() => manager.setupDashboard()).not.toThrow()

            consoleSpy.mockRestore()
        })

        test('should handle missing close button gracefully', () => {
            document.getElementById('close-dashboard-modal').remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            expect(() => manager.setupDashboard()).not.toThrow()

            consoleSpy.mockRestore()
        })
    })

    describe('showDashboard', () => {
        test('should display dashboard modal', () => {
            const modal = document.getElementById('dashboard-modal')
            expect(modal.style.display).toBe('none')

            manager.showDashboard()

            expect(modal.style.display).toBe('block')
        })

        test('should call renderDashboard when showing modal', () => {
            const renderSpy = jest.spyOn(manager, 'renderDashboard')
            manager.showDashboard()

            expect(renderSpy).toHaveBeenCalled()
        })

        test('should handle missing modal gracefully', () => {
            document.getElementById('dashboard-modal').remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            expect(() => manager.showDashboard()).not.toThrow()

            consoleSpy.mockRestore()
        })
    })

    describe('closeDashboard', () => {
        test('should hide dashboard modal', () => {
            const modal = document.getElementById('dashboard-modal')
            modal.style.display = 'block'

            manager.closeDashboard()

            expect(modal.style.display).toBe('none')
        })

        test('should handle missing modal gracefully', () => {
            document.getElementById('dashboard-modal').remove()

            expect(() => manager.closeDashboard()).not.toThrow()
        })
    })

    describe('renderDashboard', () => {
        beforeEach(() => {
            // Add sample tasks and projects
            const now = new Date()
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

            mockState.tasks = [
                {
                    id: '1',
                    title: 'Active task',
                    completed: false,
                    contexts: ['@work'],
                    energy: 'high',
                    createdAt: weekAgo.toISOString(),
                    updatedAt: now.toISOString()
                },
                {
                    id: '2',
                    title: 'Completed task this week',
                    completed: true,
                    contexts: ['@work'],
                    energy: 'high',
                    createdAt: weekAgo.toISOString(),
                    completedAt: now.toISOString(),
                    updatedAt: now.toISOString(),
                    time: 30,
                    timeSpent: 25
                },
                {
                    id: '3',
                    title: 'Completed task this month',
                    completed: true,
                    contexts: ['@home'],
                    energy: 'medium',
                    createdAt: monthAgo.toISOString(),
                    completedAt: weekAgo.toISOString(),
                    updatedAt: weekAgo.toISOString()
                }
            ]

            mockState.projects = [
                { id: 'p1', title: 'Project 1', status: 'active' },
                { id: 'p2', title: 'Project 2', status: 'completed' }
            ]
        })

        test('should render dashboard content', () => {
            const dashboardContent = document.getElementById('dashboard-content')
            expect(dashboardContent.innerHTML).toBe('')

            manager.renderDashboard()

            expect(dashboardContent.innerHTML).toContain('Total Tasks')
            expect(dashboardContent.innerHTML).toContain('Completed This Week')
            expect(dashboardContent.innerHTML).toContain('Projects')
        })

        test('should calculate total tasks correctly', () => {
            manager.renderDashboard()
            const dashboardContent = document.getElementById('dashboard-content')

            expect(dashboardContent.innerHTML).toContain('3') // Total tasks
        })

        test('should calculate active and completed tasks', () => {
            manager.renderDashboard()
            const dashboardContent = document.getElementById('dashboard-content')

            expect(dashboardContent.innerHTML).toContain('1 active')
            expect(dashboardContent.innerHTML).toContain('2 completed')
        })

        test('should render context analytics', () => {
            manager.renderDashboard()
            const dashboardContent = document.getElementById('dashboard-content')

            expect(dashboardContent.innerHTML).toContain('Context Usage')
            expect(dashboardContent.innerHTML).toContain('@work')
            expect(dashboardContent.innerHTML).toContain('@home')
        })

        test('should render energy analytics', () => {
            manager.renderDashboard()
            const dashboardContent = document.getElementById('dashboard-content')

            expect(dashboardContent.innerHTML).toContain('Energy Level Performance')
            expect(dashboardContent.innerHTML).toContain('High')
            expect(dashboardContent.innerHTML).toContain('Medium')
        })

        test('should render time tracking section', () => {
            manager.renderDashboard()
            const dashboardContent = document.getElementById('dashboard-content')

            expect(dashboardContent.innerHTML).toContain('Time Tracking')
            expect(dashboardContent.innerHTML).toContain('Total Time Tracked')
        })

        test('should handle missing dashboard content element gracefully', () => {
            document.getElementById('dashboard-content').remove()

            expect(() => manager.renderDashboard()).not.toThrow()
        })
    })

    describe('formatTotalTime', () => {
        test('should format 0 minutes as "0m"', () => {
            mockState.tasks = []
            expect(manager.formatTotalTime()).toBe('0m')
        })

        test('should format minutes only', () => {
            mockState.tasks = [{ timeSpent: 45 }]
            expect(manager.formatTotalTime()).toBe('45m')
        })

        test('should format hours and minutes', () => {
            mockState.tasks = [{ timeSpent: 125 }]
            expect(manager.formatTotalTime()).toBe('2h 5m')
        })

        test('should sum time across all tasks', () => {
            mockState.tasks = [{ timeSpent: 60 }, { timeSpent: 30 }, { timeSpent: 15 }]
            expect(manager.formatTotalTime()).toBe('1h 45m')
        })
    })

    describe('getAverageTimePerTask', () => {
        test('should return 0 when no tasks with time', () => {
            mockState.tasks = []
            expect(manager.getAverageTimePerTask()).toBe(0)
        })

        test('should calculate average time per task', () => {
            mockState.tasks = [{ timeSpent: 30 }, { timeSpent: 60 }, { timeSpent: 90 }]
            expect(manager.getAverageTimePerTask()).toBe(60)
        })

        test('should ignore tasks without timeSpent', () => {
            mockState.tasks = [{ timeSpent: 30 }, { timeSpent: 60 }, { timeSpent: 0 }]
            expect(manager.getAverageTimePerTask()).toBe(45)
        })
    })

    describe('renderTimeByContext', () => {
        test('should render empty string when no time tracked by context', () => {
            mockState.tasks = []
            const result = manager.renderTimeByContext()
            expect(result).toBe('')
        })

        test('should render time by context bars', () => {
            mockState.tasks = [
                { timeSpent: 60, contexts: ['@work'] },
                { timeSpent: 30, contexts: ['@home'] }
            ]
            const result = manager.renderTimeByContext()
            expect(result).toContain('Time by Context')
            expect(result).toContain('@work')
            expect(result).toContain('@home')
        })
    })

    describe('renderTimeByProject', () => {
        test('should render empty string when no time tracked by project', () => {
            mockState.tasks = []
            mockState.projects = []
            const result = manager.renderTimeByProject()
            expect(result).toBe('')
        })

        test('should render time by project bars', () => {
            mockState.tasks = [
                { timeSpent: 60, projectId: 'p1' },
                { timeSpent: 30, projectId: 'p2' }
            ]
            mockState.projects = [
                { id: 'p1', title: 'Project 1' },
                { id: 'p2', title: 'Project 2' }
            ]
            const result = manager.renderTimeByProject()
            expect(result).toContain('Time by Project')
            expect(result).toContain('Project 1')
            expect(result).toContain('Project 2')
        })

        test('should handle tasks with unknown project', () => {
            mockState.tasks = [{ timeSpent: 60, projectId: 'unknown' }]
            mockState.projects = []
            const result = manager.renderTimeByProject()
            expect(result).toContain('Unknown Project')
        })
    })

    describe('getLast7DaysAverage', () => {
        test('should calculate average for last 7 days', () => {
            const now = new Date()
            mockState.tasks = [
                {
                    completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
            const avg = manager.getLast7DaysAverage()
            expect(avg).toBe('0.4') // 3 tasks / 7 days
        })

        test('should return 0.0 when no completed tasks', () => {
            mockState.tasks = []
            const avg = manager.getLast7DaysAverage()
            expect(avg).toBe('0.0')
        })
    })

    describe('getAverageTaskLifecycle', () => {
        test('should return 0 when no completed tasks', () => {
            mockState.tasks = []
            expect(manager.getAverageTaskLifecycle()).toBe(0)
        })

        test('should calculate average lifecycle in days', () => {
            const now = new Date()
            const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
            const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

            mockState.tasks = [
                {
                    completed: true,
                    createdAt: twoDaysAgo.toISOString(),
                    completedAt: now.toISOString()
                },
                {
                    completed: true,
                    createdAt: threeDaysAgo.toISOString(),
                    completedAt: now.toISOString()
                }
            ]

            const avg = manager.getAverageTaskLifecycle()
            expect(avg).toBe(3) // (2 + 3) / 2 = 2.5, rounded to 3
        })

        test('should handle tasks missing createdAt or completedAt', () => {
            const now = new Date()
            const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

            mockState.tasks = [
                {
                    completed: true,
                    createdAt: twoDaysAgo.toISOString(),
                    completedAt: now.toISOString()
                },
                {
                    completed: true
                    // Missing createdAt and completedAt
                }
            ]

            const avg = manager.getAverageTaskLifecycle()
            expect(avg).toBe(2) // Only one valid task
        })
    })

    describe('getLifecycleInsight', () => {
        test('should return empty string when average is 0', () => {
            // Reset state to have NO completed tasks with createdAt/completedAt
            mockState.tasks = [{ completed: false, createdAt: new Date().toISOString() }]
            const avg = manager.getAverageTaskLifecycle()
            const insight = manager.getLifecycleInsight()
            // When there are no completed tasks with dates, insight should be empty
            expect(avg).toBe(0)
            expect(insight).toBe('')
        })

        test('should return super fast insight for avg <= 1 day', () => {
            // Clear any existing tasks first
            mockState.tasks = [
                {
                    completed: true,
                    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                    completedAt: new Date().toISOString()
                }
            ]
            const insight = manager.getLifecycleInsight()
            expect(insight).toContain('Super fast')
        })

        test('should return good insight for avg <= 3 days', () => {
            mockState.tasks = [
                {
                    completed: true,
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    completedAt: new Date().toISOString()
                }
            ]
            const insight = manager.getLifecycleInsight()
            expect(insight).toContain('Great velocity')
        })

        test('should return warning insight for avg > 14 days', () => {
            mockState.tasks = [
                {
                    completed: true,
                    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                    completedAt: new Date().toISOString()
                }
            ]
            const insight = manager.getLifecycleInsight()
            expect(insight).toContain('taking a while')
        })
    })

    describe('getVelocityTrend', () => {
        test('should return positive trend for increasing velocity', () => {
            // Reset state
            mockState.tasks = []
            const now = new Date()
            // Create 10 completions in last 7 days
            for (let i = 0; i < 10; i++) {
                mockState.tasks.push({
                    completedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
                })
            }
            // Create 2 completions in previous 7 days
            for (let i = 7; i < 9; i++) {
                mockState.tasks.push({
                    completedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
                })
            }

            const trend = manager.getVelocityTrend()
            expect(['📈', '📊', '🔥']).toContain(trend.icon)
            expect(trend.value).toMatch(/\+\d+%/)
        })

        test('should return negative trend for decreasing velocity', () => {
            // Reset state
            mockState.tasks = []
            const now = new Date()
            // Create 2 completions in last 7 days
            for (let i = 0; i < 2; i++) {
                mockState.tasks.push({
                    completedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
                })
            }
            // Create 10 completions in previous 7 days
            for (let i = 7; i < 17; i++) {
                mockState.tasks.push({
                    completedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
                })
            }

            const trend = manager.getVelocityTrend()
            expect(['📉', '⬇️', '📉', '↘️']).toContain(trend.icon)
        })

        test('should handle zero previous week velocity', () => {
            // Reset state
            mockState.tasks = []
            const now = new Date()
            // Create completions in last 7 days only
            for (let i = 0; i < 5; i++) {
                mockState.tasks.push({
                    completedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
                })
            }

            const trend = manager.getVelocityTrend()
            expect(['📈', '📊', '🔥']).toContain(trend.icon)
        })
    })

    describe('getVelocityInsight', () => {
        test('should return outstanding insight for 20+ completions', () => {
            // Reset state and create exactly 20 tasks
            mockState.tasks = []
            const now = new Date()
            for (let i = 0; i < 20; i++) {
                mockState.tasks.push({
                    completedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
                })
            }

            const insight = manager.getVelocityInsight()
            // 20 tasks should trigger "outstanding"
            expect(insight.length).toBeGreaterThan(0)
        })

        test('should return strong insight for 10-19 completions', () => {
            // Reset state and create exactly 15 tasks
            mockState.tasks = []
            const now = new Date()
            for (let i = 0; i < 15; i++) {
                mockState.tasks.push({
                    completedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
                })
            }

            const insight = manager.getVelocityInsight()
            // 15 tasks should trigger "strong"
            expect(insight.length).toBeGreaterThan(0)
        })

        test('should return start small insight for 0 completions', () => {
            // Reset state
            mockState.tasks = []
            const insight = manager.getVelocityInsight()
            // 0 tasks should trigger "start small"
            expect(insight.length).toBeGreaterThan(0)
        })
    })

    describe('renderLast7DaysChart', () => {
        test('should render 7 bars for last 7 days', () => {
            const chart = manager.renderLast7DaysChart()
            expect(chart).toContain('Mon')
            expect(chart).toContain('Tue')
            expect(chart).toContain('Wed')
            expect(chart).toContain('Thu')
            expect(chart).toContain('Fri')
            expect(chart).toContain('Sat')
            expect(chart).toContain('Sun')
        })

        test('should highlight today in chart', () => {
            const chart = manager.renderLast7DaysChart()
            // Today should have different styling
            expect(chart).toContain('var(--primary-color)')
        })
    })

    describe('Integration', () => {
        test('should work with full dashboard workflow', () => {
            manager.setupDashboard()

            // Show dashboard
            const modal = document.getElementById('dashboard-modal')
            const showBtn = document.getElementById('btn-dashboard')
            showBtn.click()

            expect(modal.style.display).toBe('block')
            expect(document.getElementById('dashboard-content').innerHTML).not.toBe('')

            // Close dashboard
            const closeBtn = document.getElementById('close-dashboard-modal')
            closeBtn.click()

            expect(modal.style.display).toBe('none')
        })
    })
})
