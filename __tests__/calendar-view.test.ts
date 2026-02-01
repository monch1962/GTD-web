/**
 * Comprehensive Tests for Calendar View Feature
 * Tests all Calendar View functionality before modularization
 */

import { GTDApp } from '../js/app.ts'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Task, Project, Template } from '../js/models.ts'

describe('Calendar View Feature - Comprehensive Tests', () => {
    let app
    let calendarModal
    let calendarContent

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear()

        // Create calendar modal elements if they don't exist
        calendarModal = document.getElementById('calendar-modal')
        if (!calendarModal) {
            calendarModal = document.createElement('div')
            calendarModal.id = 'calendar-modal'
            calendarModal.style.display = 'none'
            document.body.appendChild(calendarModal)
        }

        calendarContent = document.getElementById('calendar-content')
        if (!calendarContent) {
            calendarContent = document.createElement('div')
            calendarContent.id = 'calendar-content'
            calendarModal.appendChild(calendarContent)
        }

        // Create calendar button
        let calendarBtn = document.getElementById('btn-calendar-view')
        if (!calendarBtn) {
            calendarBtn = document.createElement('button')
            calendarBtn.id = 'btn-calendar-view'
            document.body.appendChild(calendarBtn)
        }

        // Create close calendar button
        let closeCalendarBtn = document.getElementById('close-calendar-modal')
        if (!closeCalendarBtn) {
            closeCalendarBtn = document.createElement('button')
            closeCalendarBtn.id = 'close-calendar-modal'
            document.body.appendChild(closeCalendarBtn)
        }

        // Create new app instance
        app = new GTDApp()
        app.tasks = []
    })

    describe('setupCalendarView()', () => {
        test('should add click event listener to calendar button', () => {
            const calendarBtn = document.getElementById('btn-calendar-view')
            const addEventListenerSpy = jest.spyOn(calendarBtn, 'addEventListener')

            app.setupCalendarView()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('click listener should show calendar modal', () => {
            app.setupCalendarView()

            const calendarBtn = document.getElementById('btn-calendar-view')
            const clickHandler = calendarBtn.addEventListener.mock.calls[0][1]

            expect(calendarModal.style.display).toBe('none')

            clickHandler()

            expect(calendarModal.style.display).toBe('block')
        })

        test('should add click event listener to close button', () => {
            const closeBtn = document.getElementById('close-calendar-modal')
            const addEventListenerSpy = jest.spyOn(closeBtn, 'addEventListener')

            app.setupCalendarView()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('close button should hide calendar modal', () => {
            // Show modal first
            calendarModal.style.display = 'block'

            app.setupCalendarView()

            const closeBtn = document.getElementById('close-calendar-modal')
            const clickHandler = closeBtn.addEventListener.mock.calls[0][1]

            clickHandler()

            expect(calendarModal.style.display).toBe('none')
        })
    })

    describe('showCalendar()', () => {
        test('should display calendar modal', () => {
            expect(calendarModal.style.display).toBe('none')

            app.showCalendar()

            expect(calendarModal.style.display).toBe('block')
        })

        test('should render calendar content', () => {
            const renderSpy = jest.spyOn(app.calendar, 'renderCalendar')

            app.showCalendar()

            expect(renderSpy).toHaveBeenCalled()
        })

        test('should handle missing modal gracefully', () => {
            calendarModal.remove()

            expect(() => app.showCalendar()).not.toThrow()
        })
    })

    describe('closeCalendar()', () => {
        test('should hide calendar modal', () => {
            // Show modal first
            calendarModal.style.display = 'block'

            app.closeCalendar()

            expect(calendarModal.style.display).toBe('none')
        })

        test('should handle missing modal gracefully', () => {
            calendarModal.remove()

            expect(() => app.closeCalendar()).not.toThrow()
        })
    })

    describe('renderCalendar()', () => {
        beforeEach(() => {
            // Set calendar date to a known month (January 2025)
            app.calendarDate = new Date(2025, 0, 1)
        })

        test('should render calendar grid with correct month', () => {
            app.renderCalendar()

            expect(calendarContent.innerHTML).toContain('January 2025')
        })

        test('should render weekday headers', () => {
            app.renderCalendar()

            expect(calendarContent.innerHTML).toContain('Sun')
            expect(calendarContent.innerHTML).toContain('Mon')
            expect(calendarContent.innerHTML).toContain('Sat')
        })

        test('should render days of the month', () => {
            app.renderCalendar()

            // January 2025 has 31 days
            expect(calendarContent.innerHTML).toContain('1')
            expect(calendarContent.innerHTML).toContain('31')
        })

        test('should display tasks with due dates', () => {
            const task = new Task({
                title: 'Test Task',
                dueDate: '2025-01-15',
                completed: false
            })
            app.tasks.push(task)

            app.renderCalendar()

            expect(calendarContent.innerHTML).toContain('Test Task')
        })

        test('should not display completed tasks', () => {
            const task = new Task({
                title: 'Completed Task',
                dueDate: '2025-01-15',
                completed: true
            })
            app.tasks.push(task)

            app.renderCalendar()

            expect(calendarContent.innerHTML).not.toContain('Completed Task')
        })

        test('should highlight today', () => {
            // Set calendar date to current month
            const today = new Date()
            app.calendarDate = new Date(today.getFullYear(), today.getMonth(), 1)

            app.renderCalendar()

            // Today should have special styling
            expect(calendarContent.innerHTML).toContain(today.getDate().toString())
        })

        test('should include navigation buttons', () => {
            app.renderCalendar()

            expect(calendarContent.innerHTML).toContain('navigateCalendar')
            expect(calendarContent.innerHTML).toContain('fa-chevron-left')
            expect(calendarContent.innerHTML).toContain('fa-chevron-right')
        })

        test('should show tasks for month section', () => {
            app.renderCalendar()

            expect(calendarContent.innerHTML).toContain('Tasks Due This Month')
        })
    })

    describe('navigateCalendar()', () => {
        test('should move to next month when direction is 1', () => {
            app.calendarDate = new Date(2025, 0, 15) // January 15, 2025

            app.navigateCalendar(1)

            expect(app.calendarDate.getMonth()).toBe(1) // February
            expect(app.calendarDate.getFullYear()).toBe(2025)
        })

        test('should move to previous month when direction is -1', () => {
            app.calendarDate = new Date(2025, 5, 15) // June 15, 2025

            app.navigateCalendar(-1)

            expect(app.calendarDate.getMonth()).toBe(4) // May
            expect(app.calendarDate.getFullYear()).toBe(2025)
        })

        test('should handle year rollover forward', () => {
            app.calendarDate = new Date(2025, 11, 15) // December 15, 2025

            app.navigateCalendar(1)

            expect(app.calendarDate.getMonth()).toBe(0) // January
            expect(app.calendarDate.getFullYear()).toBe(2026)
        })

        test('should handle year rollover backward', () => {
            app.calendarDate = new Date(2025, 0, 15) // January 15, 2025

            app.navigateCalendar(-1)

            expect(app.calendarDate.getMonth()).toBe(11) // December
            expect(app.calendarDate.getFullYear()).toBe(2024)
        })

        test('should re-render calendar after navigation', () => {
            const renderSpy = jest.spyOn(app.calendar, 'renderCalendar')

            app.navigateCalendar(1)

            expect(renderSpy).toHaveBeenCalled()
        })
    })

    describe('getTasksForMonth()', () => {
        beforeEach(() => {
            app.calendarDate = new Date(2025, 0, 1) // January 2025
        })

        test('should return message when no tasks due', () => {
            const result = app.getTasksForMonth(2025, 0)

            expect(result).toContain('No tasks due this month')
        })

        test('should list tasks due in the month', () => {
            const task1 = new Task({
                title: 'Task 1',
                dueDate: '2025-01-15',
                completed: false
            })
            const task2 = new Task({
                title: 'Task 2',
                dueDate: '2025-01-20',
                completed: false
            })
            app.tasks.push(task1, task2)

            const result = app.getTasksForMonth(2025, 0)

            expect(result).toContain('Task 1')
            expect(result).toContain('Task 2')
        })

        test('should not include completed tasks', () => {
            const task = new Task({
                title: 'Completed Task',
                dueDate: '2025-01-15',
                completed: true
            })
            app.tasks.push(task)

            const result = app.getTasksForMonth(2025, 0)

            expect(result).toContain('No tasks due this month')
        })

        test('should not include tasks from other months', () => {
            const task = new Task({
                title: 'February Task',
                dueDate: '2025-02-15',
                completed: false
            })
            app.tasks.push(task)

            const result = app.getTasksForMonth(2025, 0)

            expect(result).toContain('No tasks due this month')
        })

        test('should not include tasks without due dates', () => {
            const task = new Task({
                title: 'No Due Date',
                dueDate: null,
                completed: false
            })
            app.tasks.push(task)

            const result = app.getTasksForMonth(2025, 0)

            expect(result).toContain('No tasks due this month')
        })

        test('should include edit button for each task', () => {
            const task = new Task({
                id: 'test-task-1',
                title: 'Test Task',
                dueDate: '2025-01-15',
                completed: false
            })
            app.tasks.push(task)

            const result = app.getTasksForMonth(2025, 0)

            expect(result).toContain('openTaskModal')
            expect(result).toContain('test-task-1')
        })
    })

    describe('showTasksForDate()', () => {
        test('should show alert with tasks for specific date', () => {
            const task = new Task({
                title: 'Test Task',
                dueDate: '2025-01-15',
                completed: false
            })
            app.tasks.push(task)

            const showInfoSpy = jest.spyOn(app, 'showInfo').mockImplementation(() => {})

            app.showTasksForDate(2025, 0, 15)

            expect(showInfoSpy).toHaveBeenCalled()
            const infoCall = showInfoSpy.mock.calls[0][0]
            expect(infoCall).toContain('1/15/2025')
            expect(infoCall).toContain('Test Task')

            showInfoSpy.mockRestore()
        })

        test('should show "No tasks" when no tasks due on date', () => {
            const showInfoSpy = jest.spyOn(app, 'showInfo').mockImplementation(() => {})

            app.showTasksForDate(2025, 0, 15)

            expect(showInfoSpy).toHaveBeenCalled()
            const infoCall = showInfoSpy.mock.calls[0][0]
            expect(infoCall).toContain('No tasks')

            showInfoSpy.mockRestore()
        })

        test('should only show tasks for exact date', () => {
            const task1 = new Task({
                title: 'Task on 15th',
                dueDate: '2025-01-15',
                completed: false
            })
            const task2 = new Task({
                title: 'Task on 16th',
                dueDate: '2025-01-16',
                completed: false
            })
            app.tasks.push(task1, task2)

            const showInfoSpy = jest.spyOn(app, 'showInfo').mockImplementation(() => {})

            app.showTasksForDate(2025, 0, 15)

            const infoCall = showInfoSpy.mock.calls[0][0]
            expect(infoCall).toContain('Task on 15th')
            expect(infoCall).not.toContain('Task on 16th')

            showInfoSpy.mockRestore()
        })

        test('should not include tasks without due dates', () => {
            const task = new Task({
                title: 'No Due Date',
                dueDate: null,
                completed: false
            })
            app.tasks.push(task)

            const showInfoSpy = jest.spyOn(app, 'showInfo').mockImplementation(() => {})

            app.showTasksForDate(2025, 0, 15)

            const infoCall = showInfoSpy.mock.calls[0][0]
            expect(infoCall).toContain('No tasks')

            showInfoSpy.mockRestore()
        })
    })

    describe('Integration: Full Calendar Workflow', () => {
        test('should show, navigate, and close calendar', () => {
            // Setup
            app.setupCalendarView()
            app.calendarDate = new Date(2025, 0, 1)

            // Show calendar
            const calendarBtn = document.getElementById('btn-calendar-view')
            const showHandler = calendarBtn.addEventListener.mock.calls[0][1]
            showHandler()

            expect(calendarModal.style.display).toBe('block')

            // Navigate forward
            const oldMonth = app.calendarDate.getMonth()
            app.navigateCalendar(1)
            expect(app.calendarDate.getMonth()).toBe(oldMonth + 1)

            // Close calendar
            const closeBtn = document.getElementById('close-calendar-modal')
            const closeHandler = closeBtn.addEventListener.mock.calls[0][1]
            closeHandler()

            expect(calendarModal.style.display).toBe('none')
        })

        test('should display tasks on calendar dates', () => {
            app.calendarDate = new Date(2025, 0, 1)

            const task = new Task({
                title: 'Important Meeting',
                dueDate: '2025-01-15',
                completed: false
            })
            app.tasks.push(task)

            app.renderCalendar()

            // Task should appear in calendar
            expect(calendarContent.innerHTML).toContain('Important Meeting')

            // Task should be clickable
            expect(calendarContent.innerHTML).toContain('showTasksForDate(2025, 0, 15)')
        })
    })

    describe('Edge Cases', () => {
        test('should handle leap year (February)', () => {
            app.calendarDate = new Date(2024, 1, 1) // February 2024 (leap year)

            app.renderCalendar()

            // February 2024 should have 29 days
            expect(calendarContent.innerHTML).toContain('29')
        })

        test('should handle non-leap year (February)', () => {
            app.calendarDate = new Date(2025, 1, 1) // February 2025 (not leap year)

            app.renderCalendar()

            // February 2025 should have 28 days
            expect(calendarContent.innerHTML).toContain('28')
            expect(calendarContent.innerHTML).not.toContain('29')
        })

        test('should handle month starting on Sunday', () => {
            app.calendarDate = new Date(2025, 5, 1) // June 2025 starts on Sunday

            app.renderCalendar()

            expect(calendarContent.innerHTML).toContain('June 2025')
        })

        test('should handle month starting on Saturday', () => {
            app.calendarDate = new Date(2025, 2, 1) // March 2025 starts on Saturday

            app.renderCalendar()

            expect(calendarContent.innerHTML).toContain('March 2025')
        })

        test('should handle tasks with special characters in title', () => {
            app.calendarDate = new Date(2025, 0, 1)

            const task = new Task({
                title: 'Task with <script> & "quotes"',
                dueDate: '2025-01-15',
                completed: false
            })
            app.tasks.push(task)

            // Should render without throwing
            expect(() => app.renderCalendar()).not.toThrow()

            // Task should be in the output
            expect(calendarContent.innerHTML).toContain('Task with')
        })

        test('should handle empty tasks array', () => {
            app.tasks = []
            app.calendarDate = new Date(2025, 0, 1)

            expect(() => app.renderCalendar()).not.toThrow()
            expect(() => app.getTasksForMonth(2025, 0)).not.toThrow()
        })
    })
})
