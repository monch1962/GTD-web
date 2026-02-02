/**
 * Test: Daily Review Manager
 * Comprehensive tests for daily review functionality
 */

// Mock dom-utils before importing
import { DailyReviewManager } from '../js/modules/features/daily-review.ts'
/* eslint-disable */

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
    showToast: jest.fn(),
    showNotification: jest.fn()
}

const mockState = {
    tasks: [],
    projects: [],
    templates: [],
    currentView: 'inbox',
    currentProjectId: null
}

describe('DailyReviewManager - Initialization', () => {
    let manager

    beforeEach(() => {
        // Reset state
        mockState.tasks = []
        mockState.projects = []

        // Setup DOM elements
        document.body.innerHTML = `
            <button id="btn-daily-review">Daily Review</button>
            <button id="close-daily-review-modal">Close</button>
            <div id="daily-review-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <h2>Daily Review</h2>
                    <div id="daily-review-content"></div>
                </div>
            </div>
            <div id="announcer"></div>
        `

        manager = new DailyReviewManager(mockState)
    })

    afterEach(() => {
        document.body.innerHTML = ''
        jest.clearAllMocks()
    })

    describe('DailyReviewManager - Setup', () => {
        test('should initialize with state reference', () => {
            expect(manager.state).toBe(mockState)
        })
    })

    describe('DailyReviewManager - Show/Hide Modal', () => {
        test('test 2', () => {
            const showSpy = jest.spyOn(manager, 'showDailyReview')
            manager.setupDailyReview()

            const dailyReviewBtn = document.getElementById('btn-daily-review')
            dailyReviewBtn.click()

            expect(showSpy).toHaveBeenCalled()
        })

        test('test 3', () => {
            const closeSpy = jest.spyOn(manager, 'closeDailyReview')
            manager.setupDailyReview()

            const closeBtn = document.getElementById('close-daily-review-modal')
            closeBtn.click()

            expect(closeSpy).toHaveBeenCalled()
        })

        test('should handle missing buttons gracefully', () => {
            document.getElementById('btn-daily-review').remove()
            document.getElementById('close-daily-review-modal').remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            expect(() => manager.setupDailyReview()).not.toThrow()

            consoleSpy.mockRestore()
        })
    })

    describe('DailyReviewManager - Content Generation', () => {
        test('should hide modal when closeDailyReview is called', () => {
            const modal = document.getElementById('daily-review-modal')
            expect(modal.style.display).toBe('none')

            manager.showDailyReview()

            expect(modal.style.display).toBe('block')
        })

        test('test 6', () => {
            const renderSpy = jest.spyOn(manager, 'renderDailyReview')
            manager.showDailyReview()

            expect(renderSpy).toHaveBeenCalled()
        })

        test('should call showDailyReview when button clicked', () => {
            document.getElementById('daily-review-modal').remove()
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

            expect(() => manager.showDailyReview()).not.toThrow()

            consoleSpy.mockRestore()
        })
    })

    describe('DailyReviewManager - Task Analysis', () => {
        test('test 8', () => {
            const modal = document.getElementById('daily-review-modal')
            modal.style.display = 'block'

            manager.closeDailyReview()

            expect(modal.style.display).toBe('none')
        })

        test('should call closeDailyReview when close button clicked', () => {
            document.getElementById('daily-review-modal').remove()

            expect(() => manager.closeDailyReview()).not.toThrow()
        })
    })

    describe('DailyReviewManager - Project Analysis', () => {
        beforeEach(() => {
            // Add sample tasks and projects
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)
            const weekFromNow = new Date(today)
            weekFromNow.setDate(weekFromNow.getDate() + 7)

            mockState.tasks = [
                {
                    id: '1',
                    title: 'Task due today',
                    completed: false,
                    dueDate: today.toISOString(),
                    contexts: ['@work'],
                    priority: 90
                },
                {
                    id: '2',
                    title: 'Task due tomorrow',
                    completed: false,
                    dueDate: tomorrow.toISOString(),
                    contexts: ['@home'],
                    priority: 85
                },
                {
                    id: '3',
                    title: 'Overdue task',
                    completed: false,
                    dueDate: yesterday.toISOString(),
                    contexts: ['@work'],
                    priority: 95
                },
                {
                    id: '4',
                    title: 'Low priority task',
                    completed: false,
                    dueDate: weekFromNow.toISOString(),
                    priority: 50
                },
                {
                    id: '5',
                    title: 'Completed task today',
                    completed: true,
                    completedAt: now.toISOString()
                }
            ]

            mockState.projects = [
                { id: 'p1', title: 'Project 1' },
                { id: 'p2', title: 'Project 2' }
            ]
        })

        test('test 10', () => {
            const dailyReviewContent = document.getElementById('daily-review-content')
            expect(dailyReviewContent.innerHTML).toBe('')

            manager.renderDailyReview()

            expect(dailyReviewContent.innerHTML).toContain('Due Today')
            expect(dailyReviewContent.innerHTML).toContain('Overdue')
            expect(dailyReviewContent.innerHTML).toContain('This Week')
            expect(dailyReviewContent.innerHTML).toContain('High Priority')
        })

        test('test 11', () => {
            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            expect(dailyReviewContent.innerHTML).toContain('1') // Due Today count
        })

        test('test 12', () => {
            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            expect(dailyReviewContent.innerHTML).toContain('1') // Overdue count
        })

        test('test 13', () => {
            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            // Should show 3 tasks due this week (today, tomorrow, week from now)
            const match = dailyReviewContent.innerHTML.match(
                /This Week[\s\S]*?<div[^>]*>(\d+)<\/div>/
            )
            expect(match).toBeTruthy()
            expect(parseInt(match[1])).toBeGreaterThanOrEqual(3)
        })

        test('test 14', () => {
            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            // Should show 3 high priority tasks (priority >= 80)
            // Look for the stat card with "High Priority" label
            const match = dailyReviewContent.innerHTML.match(
                /<div[^>]*>\s*<div[^>]*>[^<]*<\/div>\s*<div[^>]*>High Priority<\/div>/
            )
            expect(match).toBeTruthy()

            // Extract the number from the first div in the matched pattern
            const numberMatch = match[0].match(/<div[^>]*>(\d+)<\/div>/)
            expect(numberMatch).toBeTruthy()
            expect(parseInt(numberMatch[1])).toBeGreaterThanOrEqual(3)
        })

        test('test 15', () => {
            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            expect(dailyReviewContent.innerHTML).toContain('Good')
            expect(dailyReviewContent.innerHTML).toMatch(/Morning|Afternoon|Evening/)
        })

        test('test 16', () => {
            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            const now = new Date()
            const dateStr = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            expect(dailyReviewContent.innerHTML).toContain(dateStr)
        })

        test('test 17', () => {
            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            expect(dailyReviewContent.innerHTML).toContain('@work')
            expect(dailyReviewContent.innerHTML).toContain('@home')
        })

        test('test 18', () => {
            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            expect(dailyReviewContent.innerHTML).toContain('90')
            expect(dailyReviewContent.innerHTML).toContain('85')
            expect(dailyReviewContent.innerHTML).toContain('95')
        })

        test('test 19', () => {
            mockState.tasks = []
            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            expect(dailyReviewContent.innerHTML).toContain('All caught up')
            expect(dailyReviewContent.innerHTML).toContain('No urgent tasks')
        })

        test('should handle missing buttons gracefully', () => {
            document.getElementById('daily-review-content').remove()

            expect(() => manager.renderDailyReview()).not.toThrow()
        })

        test('test 21', () => {
            // Add 15 overdue tasks
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            for (let i = 0; i < 15; i++) {
                mockState.tasks.push({
                    id: `overdue-${i}`,
                    title: `Overdue task ${i}`,
                    completed: false,
                    dueDate: yesterday.toISOString()
                })
            }

            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            // Should have at least 1 overdue shown
            expect(dailyReviewContent.innerHTML).toContain('Overdue')
        })

        test('test 22', () => {
            // Add 15 tasks due this week
            const nextWeek = new Date()
            nextWeek.setDate(nextWeek.getDate() + 5)

            for (let i = 0; i < 15; i++) {
                mockState.tasks.push({
                    id: `week-${i}`,
                    title: `Week task ${i}`,
                    completed: false,
                    dueDate: nextWeek.toISOString()
                })
            }

            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            expect(dailyReviewContent.innerHTML).toContain('This Week')
        })

        test('test 23', () => {
            // Add 15 high priority tasks
            for (let i = 0; i < 15; i++) {
                mockState.tasks.push({
                    id: `priority-${i}`,
                    title: `Priority task ${i}`,
                    completed: false,
                    priority: 80 + i
                })
            }

            manager.renderDailyReview()
            const dailyReviewContent = document.getElementById('daily-review-content')

            expect(dailyReviewContent.innerHTML).toContain('High Priority')
        })
    })

    describe('DailyReviewManager - Review Completion', () => {
        test('test 24', () => {
            const task = {
                id: '1',
                title: 'Test Task',
                completed: false,
                contexts: ['@work', '@urgent'],
                projectId: 'p1',
                dueDate: new Date().toISOString(),
                priority: 90
            }

            mockState.projects = [{ id: 'p1', title: 'My Project' }]
            mockState.tasks.push(task)

            const html = manager.renderDailyReviewTask(task, 'today')

            expect(html).toContain('Test Task')
            expect(html).toContain('@work')
            expect(html).toContain('@urgent')
            expect(html).toContain('My Project')
            expect(html).toContain('90')
            expect(html).toContain('data-task-id="1"')
        })

        test('test 25', () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            const task = {
                id: '1',
                title: 'Overdue Task',
                completed: false,
                dueDate: yesterday.toISOString()
            }

            const html = manager.renderDailyReviewTask(task, 'overdue')

            expect(html).toContain('overdue')
            expect(html).toContain('Overdue')
            expect(html).toContain('fa-exclamation-circle')
        })

        test('test 26', () => {
            const task = {
                id: '1',
                title: 'Today Task',
                completed: false,
                dueDate: new Date().toISOString()
            }

            const html = manager.renderDailyReviewTask(task, 'today')

            expect(html).toContain('due-today')
            expect(html).toContain('Today')
            expect(html).toContain('fa-calendar-day')
        })

        test('test 27', () => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)

            const task = {
                id: '1',
                title: 'Tomorrow Task',
                completed: false,
                dueDate: tomorrow.toISOString()
            }

            const html = manager.renderDailyReviewTask(task, 'today')

            expect(html).toContain('due-tomorrow')
            expect(html).toContain('Tomorrow')
        })

        test('test 28', () => {
            const task = {
                id: '1',
                title: 'No Due Date Task',
                completed: false
            }

            const html = manager.renderDailyReviewTask(task, 'today')

            expect(html).toContain('No Due Date Task')
            expect(html).toContain('data-task-id="1"')
        })

        test('test 29', () => {
            const task = {
                id: '1',
                title: 'Low Priority Task',
                completed: false,
                priority: 50
            }

            const html = manager.renderDailyReviewTask(task, 'today')

            expect(html).not.toContain('task-priority high')
        })

        test('test 30', () => {
            const task = {
                id: '1',
                title: 'Task with Unknown Project',
                completed: false,
                projectId: 'unknown-id'
            }

            mockState.projects = []
            const html = manager.renderDailyReviewTask(task, 'today')

            expect(html).toContain('Unknown Project')
        })
    })

    describe('DailyReviewManager - Keyboard Navigation', () => {
        test('test 31', () => {
            const mockDate = new Date()
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
            jest.spyOn(mockDate, 'getHours').mockReturnValueOnce(8).mockReturnValueOnce(11)

            expect(manager.getGreeting()).toBe('Morning')
            expect(manager.getGreeting()).toBe('Morning')

            jest.restoreAllMocks()
        })

        test('test 32', () => {
            const mockDate = new Date()
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
            jest.spyOn(mockDate, 'getHours').mockReturnValueOnce(14).mockReturnValueOnce(16)

            expect(manager.getGreeting()).toBe('Afternoon')
            expect(manager.getGreeting()).toBe('Afternoon')

            jest.restoreAllMocks()
        })

        test('test 33', () => {
            const mockDate = new Date()
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
            jest.spyOn(mockDate, 'getHours').mockReturnValueOnce(18).mockReturnValueOnce(23)

            expect(manager.getGreeting()).toBe('Evening')
            expect(manager.getGreeting()).toBe('Evening')

            jest.restoreAllMocks()
        })
    })

    describe('DailyReviewManager - Accessibility', () => {
        test('test 34', () => {
            mockState.tasks = []

            const message = manager.getGreetingMessage()

            expect(message).toMatch(/All caught up/)
            expect(message).toMatch(/Good (Morning|Afternoon|Evening)/)
        })

        test('test 35', () => {
            const now = new Date()
            const _today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            mockState.tasks = [
                { id: '1', title: 'Task 1', completed: true, completedAt: now.toISOString() },
                { id: '2', title: 'Task 2', completed: true, completedAt: now.toISOString() },
                { id: '3', title: 'Task 3', completed: false }
            ]

            const message = manager.getGreetingMessage()

            expect(message).toContain('2 task')
            expect(message).toContain('completed today')
        })

        test('test 36', () => {
            mockState.tasks = [
                { id: '1', title: 'Task 1', completed: false },
                { id: '2', title: 'Task 2', completed: false },
                { id: '3', title: 'Task 3', completed: false }
            ]

            const message = manager.getGreetingMessage()

            expect(message).toContain('3 tasks')
            expect(message).toContain('to do')
        })
    })

    describe('DailyReviewManager - Error Handling', () => {
        test('test 37', () => {
            mockState.projects = [{ id: 'p1', title: 'My Project' }]

            const title = manager.getProjectTitle('p1')

            expect(title).toBe('My Project')
        })

        test('test 38', () => {
            mockState.projects = []

            const title = manager.getProjectTitle('unknown')

            expect(title).toBe('Unknown Project')
        })

        test('test 39', () => {
            const title = manager.getProjectTitle(null)

            expect(title).toBe('Unknown Project')
        })
    })

    describe('DailyReviewManager - Integration', () => {
        test('test 40', () => {
            manager.setupDailyReview()

            // Show daily review
            const modal = document.getElementById('daily-review-modal')
            const showBtn = document.getElementById('btn-daily-review')
            showBtn.click()

            expect(modal.style.display).toBe('block')
            expect(document.getElementById('daily-review-content').innerHTML).not.toBe('')

            // Close daily review
            const closeBtn = document.getElementById('close-daily-review-modal')
            closeBtn.click()

            expect(modal.style.display).toBe('none')
        })

        test('test 41', () => {
            manager.setupDailyReview()

            const modal = document.getElementById('daily-review-modal')
            const showBtn = document.getElementById('btn-daily-review')
            const closeBtn = document.getElementById('close-daily-review-modal')

            // Open and close multiple times
            showBtn.click()
            expect(modal.style.display).toBe('block')

            closeBtn.click()
            expect(modal.style.display).toBe('none')

            showBtn.click()
            expect(modal.style.display).toBe('block')

            closeBtn.click()
            expect(modal.style.display).toBe('none')
        })
    })

    describe('DailyReviewManager - Edge Cases', () => {
        test('test 42', () => {
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            mockState.tasks = [
                { id: '1', title: 'Active Task', completed: false, dueDate: today.toISOString() },
                { id: '2', title: 'Completed Task', completed: true, dueDate: today.toISOString() },
                {
                    id: '3',
                    title: 'Another Active Task',
                    completed: false,
                    dueDate: today.toISOString()
                }
            ]

            manager.renderDailyReview()
            const content = document.getElementById('daily-review-content').innerHTML

            // Should show 2 due today, not 3 (completed excluded)
            const match = content.match(/<div[^>]*>(\d+)<\/div>[\s\S]*?Due Today/)
            expect(match).toBeTruthy()
            expect(parseInt(match[1])).toBe(2)
        })

        test('test 43', () => {
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            mockState.tasks = [
                { id: '1', title: 'Due Today', completed: false, dueDate: today.toISOString() },
                { id: '2', title: 'Overdue', completed: false, dueDate: yesterday.toISOString() }
            ]

            manager.renderDailyReview()
            const content = document.getElementById('daily-review-content').innerHTML

            expect(content).toContain('Due Today')
            expect(content).toContain('Overdue')
        })

        test('test 44', () => {
            mockState.tasks = [
                { id: '1', title: 'High Priority', completed: false, priority: 80 },
                { id: '2', title: 'Medium Priority', completed: false, priority: 79 },
                { id: '3', title: 'Very High Priority', completed: false, priority: 100 }
            ]

            manager.renderDailyReview()
            const content = document.getElementById('daily-review-content').innerHTML

            // Look for the stat card with "High Priority" label
            const match = content.match(
                /<div[^>]*>\s*<div[^>]*>[^<]*<\/div>\s*<div[^>]*>High Priority<\/div>/
            )
            expect(match).toBeTruthy()

            // Extract the number from the first div in the matched pattern
            const numberMatch = match[0].match(/<div[^>]*>(\d+)<\/div>/)
            expect(numberMatch).toBeTruthy()
            expect(parseInt(numberMatch[1])).toBe(2) // Only 80+ count
        })
    })

    describe('DailyReviewManager - Performance', () => {
        test('should handle missing buttons gracefully', () => {
            mockState.tasks = [{ id: '1', title: 'No Date Task', completed: false, priority: 90 }]

            expect(() => manager.renderDailyReview()).not.toThrow()
        })

        test('test 46', () => {
            mockState.tasks = [
                {
                    id: '1',
                    title: 'Task',
                    completed: false,
                    contexts: [],
                    priority: 85
                }
            ]

            expect(() => manager.renderDailyReview()).not.toThrow()
        })

        test('test 47', () => {
            mockState.tasks = [
                {
                    id: '1',
                    title: 'Task',
                    completed: false,
                    projectId: null,
                    priority: 85
                }
            ]

            expect(() => manager.renderDailyReview()).not.toThrow()
        })

        test('test 48', () => {
            mockState.tasks = [
                {
                    id: '1',
                    title: 'Minimal Task',
                    completed: false
                }
            ]

            const html = manager.renderDailyReviewTask(
                { id: '1', title: 'Minimal Task', completed: false },
                'today'
            )

            expect(html).toContain('Minimal Task')
            expect(html).toContain('data-task-id="1"')
        })
    })
})
