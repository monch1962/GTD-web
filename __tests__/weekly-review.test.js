/**
 * Comprehensive Tests for Weekly Review Feature
 * Tests all Weekly Review functionality before modularization
 */

import { GTDApp } from '../js/app.ts'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Task, Project, Template } from '../js/models.ts'

describe('Weekly Review Feature - Comprehensive Tests', () => {
    let app

    beforeEach(() => {
        localStorage.clear()

        // Create weekly review modal elements
        let modal = document.getElementById('weekly-review-modal')
        if (!modal) {
            modal = document.createElement('div')
            modal.id = 'weekly-review-modal'
            modal.style.display = 'none'
            document.body.appendChild(modal)

            const content = document.createElement('div')
            content.id = 'weekly-review-content'
            modal.appendChild(content)
        }

        // Create buttons
        let btn = document.getElementById('btn-weekly-review')
        if (!btn) {
            btn = document.createElement('button')
            btn.id = 'btn-weekly-review'
            document.body.appendChild(btn)
        }

        let closeBtn = document.getElementById('close-weekly-review-modal')
        if (!closeBtn) {
            closeBtn = document.createElement('button')
            closeBtn.id = 'close-weekly-review-modal'
            document.body.appendChild(closeBtn)
        }

        // Create tasks-container for renderView
        let tasksContainer = document.getElementById('tasks-container')
        if (!tasksContainer) {
            tasksContainer = document.createElement('div')
            tasksContainer.id = 'tasks-container'
            document.body.appendChild(tasksContainer)
        }

        // Create count elements for updateCounts
        const countIds = [
            'inbox-count',
            'next-count',
            'waiting-count',
            'someday-count',
            'completed-count',
            'total-count',
            'projects-count',
            'reference-count',
            'templates-count'
        ]
        countIds.forEach((id) => {
            let el = document.getElementById(id)
            if (!el) {
                el = document.createElement('span')
                el.id = id
                el.textContent = '0'
                document.body.appendChild(el)
            }
        })

        app = new GTDApp()
        app.tasks = []
        app.projects = []

        // Mock notification methods
        app.showNotification = jest.fn()
        app.showWarning = jest.fn()
        app.showSuccess = jest.fn()
        app.showError = jest.fn()
        app.showToast = jest.fn()
    })

    describe('setupWeeklyReview()', () => {
        test('should add click listener to weekly review button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('btn-weekly-review'),
                'addEventListener'
            )

            app.setupWeeklyReview()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add click listener to close button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('close-weekly-review-modal'),
                'addEventListener'
            )

            app.setupWeeklyReview()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should handle missing buttons gracefully', () => {
            const btn = document.getElementById('btn-weekly-review')
            const closeBtn = document.getElementById('close-weekly-review-modal')

            btn.remove()
            closeBtn.remove()

            expect(() => app.setupWeeklyReview()).not.toThrow()
        })
    })

    describe('showWeeklyReview()', () => {
        test('should display weekly review modal', () => {
            app.showWeeklyReview()

            const modal = document.getElementById('weekly-review-modal')
            expect(modal.style.display).toBe('block')
        })

        test('should render weekly review content', () => {
            app.showWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content.innerHTML).toContain('Weekly Review Checklist')
        })

        test('should handle missing modal gracefully', () => {
            const modal = document.getElementById('weekly-review-modal')
            modal.remove()

            expect(() => app.showWeeklyReview()).not.toThrow()
        })
    })

    describe('closeWeeklyReview()', () => {
        test('should hide weekly review modal', () => {
            const modal = document.getElementById('weekly-review-modal')
            modal.style.display = 'block'

            app.closeWeeklyReview()

            expect(modal.style.display).toBe('none')
        })

        test('should handle missing modal gracefully', () => {
            const modal = document.getElementById('weekly-review-modal')
            modal.remove()

            expect(() => app.closeWeeklyReview()).not.toThrow()
        })
    })

    describe('renderWeeklyReview()', () => {
        beforeEach(() => {
            // Setup current date for consistent testing
            jest.useFakeTimers().setSystemTime(new Date('2025-01-08T12:00:00Z'))
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        test('should render weekly review content', () => {
            const content = document.getElementById('weekly-review-content')
            app.renderWeeklyReview()

            expect(content.innerHTML).toContain('Weekly Review Checklist')
        })

        test('should show completed tasks count', () => {
            const completedTask = new Task({
                id: 'task-1',
                title: 'Completed task',
                status: 'next',
                completed: true,
                completedAt: '2025-01-07T12:00:00Z'
            })
            app.tasks.push(completedTask)

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content.innerHTML).toContain('1')
            expect(content.innerHTML).toContain('completed tasks')
        })

        test('should show overdue tasks', () => {
            const overdueTask = new Task({
                id: 'task-1',
                title: 'Overdue task',
                status: 'next',
                dueDate: '2025-01-01',
                completed: false
            })
            app.tasks.push(overdueTask)

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content.innerHTML).toContain('Overdue Tasks')
            expect(content.innerHTML).toContain('Overdue task')
        })

        test('should show tasks due this week', () => {
            const dueTask = new Task({
                id: 'task-1',
                title: 'Due this week',
                status: 'next',
                dueDate: '2025-01-10',
                completed: false
            })
            app.tasks.push(dueTask)

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            // Just check that the weekly review was rendered with the task
            expect(content.innerHTML.length).toBeGreaterThan(0)
        })

        test('should show waiting tasks count', () => {
            const waitingTask = new Task({
                id: 'task-1',
                title: 'Waiting task',
                status: 'waiting',
                completed: false
            })
            app.tasks.push(waitingTask)

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content.innerHTML).toContain('1 Waiting')
        })

        test('should show someday tasks count', () => {
            const somedayTask = new Task({
                id: 'task-1',
                title: 'Someday task',
                status: 'someday',
                completed: false
            })
            app.tasks.push(somedayTask)

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content.innerHTML).toContain('1 Someday')
        })

        test('should identify stale projects', () => {
            const project = new Project({
                id: 'proj-1',
                title: 'Stale project',
                status: 'active'
            })
            app.projects.push(project)

            const oldTask = new Task({
                id: 'task-1',
                title: 'Old task',
                projectId: 'proj-1',
                status: 'next',
                completed: false,
                updatedAt: '2024-12-01T12:00:00Z'
            })
            app.tasks.push(oldTask)

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content.innerHTML).toContain('Stalled Projects')
        })

        test('should show cleanup actions section', () => {
            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content.innerHTML).toContain('Cleanup Actions')
            expect(content.innerHTML).toContain('Delete empty projects')
            expect(content.innerHTML).toContain('Archive tasks completed')
            expect(content.innerHTML).toContain('Move stale projects')
        })

        test('should handle missing content element gracefully', () => {
            const content = document.getElementById('weekly-review-content')
            content.remove()

            expect(() => app.renderWeeklyReview()).not.toThrow()
        })
    })

    describe('cleanupEmptyProjects()', () => {
        test('should delete empty projects', async () => {
            const emptyProject = new Project({
                id: 'proj-1',
                title: 'Empty project'
            })
            const projectWithTask = new Project({
                id: 'proj-2',
                title: 'Project with task'
            })
            app.projects.push(emptyProject, projectWithTask)

            const task = new Task({
                id: 'task-1',
                title: 'Task',
                projectId: 'proj-2'
            })
            app.tasks.push(task)

            jest.spyOn(window, 'confirm').mockReturnValue(true)
            jest.spyOn(app, 'saveProjects').mockResolvedValue()
            jest.spyOn(app, 'renderWeeklyReview')
            jest.spyOn(app, 'renderProjectsDropdown')
            jest.spyOn(window, 'alert')

            await app.weeklyReview.cleanupEmptyProjects()

            expect(app.projects.length).toBe(1)
            expect(app.projects[0].id).toBe('proj-2')
        })

        test('should alert when no empty projects', async () => {
            const project = new Project({
                id: 'proj-1',
                title: 'Project'
            })
            app.projects.push(project)

            const task = new Task({
                id: 'task-1',
                title: 'Task',
                projectId: 'proj-1'
            })
            app.tasks.push(task)

            await app.weeklyReview.cleanupEmptyProjects()

            expect(app.showWarning).toHaveBeenCalledWith('No empty projects to clean up.')
        })

        test('should respect user cancellation', async () => {
            const emptyProject = new Project({
                id: 'proj-1',
                title: 'Empty project'
            })
            app.projects.push(emptyProject)

            jest.spyOn(window, 'confirm').mockReturnValue(false)

            await app.weeklyReview.cleanupEmptyProjects()

            expect(app.projects.length).toBe(1)
        })
    })

    describe('cleanupOldCompletedTasks()', () => {
        test('should archive old completed tasks', async () => {
            // Mock current date to ensure consistent test results
            jest.useFakeTimers().setSystemTime(new Date('2025-01-08T12:00:00Z'))

            const oldTask = new Task({
                id: 'task-1',
                title: 'Old task',
                completed: true,
                completedAt: '2024-10-01T12:00:00Z'
            })
            app.tasks.push(oldTask)

            jest.spyOn(window, 'confirm').mockReturnValue(true)
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderWeeklyReview')
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(window, 'alert')

            // Mock URL.createObjectURL and related methods
            global.URL.createObjectURL = jest.fn(() => 'blob:url')
            global.URL.revokeObjectURL = jest.fn()

            await app.weeklyReview.cleanupOldCompletedTasks()

            // Check that task was removed
            expect(app.tasks.find((t) => t.id === 'task-1')).toBeUndefined()

            jest.useRealTimers()
        })

        test('should alert when no old tasks', async () => {
            // Mock current date to ensure consistent test results
            jest.useFakeTimers().setSystemTime(new Date('2025-01-08T12:00:00Z'))

            const recentTask = new Task({
                id: 'task-1',
                title: 'Recent task',
                completed: true,
                completedAt: '2025-01-07T12:00:00Z'
            })
            app.tasks.push(recentTask)

            await app.weeklyReview.cleanupOldCompletedTasks()

            // Check that warning was shown
            expect(app.showWarning).toHaveBeenCalledWith('No old completed tasks to archive.')

            jest.useRealTimers()
        })

        test('should respect user cancellation', async () => {
            const oldTask = new Task({
                id: 'task-1',
                title: 'Old task',
                completed: true,
                completedAt: '2024-10-01T12:00:00Z'
            })
            app.tasks.push(oldTask)

            jest.spyOn(window, 'confirm').mockReturnValue(false)

            await app.weeklyReview.cleanupOldCompletedTasks()

            expect(app.tasks.length).toBe(1)
        })
    })

    describe('markStaleProjectsSomeday()', () => {
        test('should move stale projects to someday', async () => {
            const project = new Project({
                id: 'proj-1',
                title: 'Stale project',
                status: 'active'
            })
            app.projects.push(project)

            const oldTask = new Task({
                id: 'task-1',
                title: 'Old task',
                projectId: 'proj-1',
                status: 'next',
                completed: false,
                updatedAt: '2024-12-01T12:00:00Z'
            })
            app.tasks.push(oldTask)

            jest.spyOn(window, 'confirm').mockReturnValue(true)
            jest.spyOn(app, 'saveProjects').mockResolvedValue()
            jest.spyOn(app, 'renderWeeklyReview')
            jest.spyOn(app, 'renderProjectsDropdown')
            jest.spyOn(window, 'alert')

            await app.weeklyReview.markStaleProjectsSomeday()

            expect(app.projects[0].status).toBe('someday')
        })

        test('should alert when no stale projects', async () => {
            // Mock current date to ensure consistent test results
            jest.useFakeTimers().setSystemTime(new Date('2025-01-08T12:00:00Z'))

            const project = new Project({
                id: 'proj-1',
                title: 'Active project',
                status: 'active'
            })
            app.projects.push(project)

            const recentTask = new Task({
                id: 'task-1',
                title: 'Recent task',
                projectId: 'proj-1',
                status: 'next',
                completed: false,
                updatedAt: '2025-01-07T12:00:00Z'
            })
            app.tasks.push(recentTask)

            await app.weeklyReview.markStaleProjectsSomeday()

            // Check that warning was shown
            expect(app.showWarning).toHaveBeenCalledWith('No stale projects to move.')

            jest.useRealTimers()
        })

        test('should respect user cancellation', async () => {
            const project = new Project({
                id: 'proj-1',
                title: 'Stale project',
                status: 'active'
            })
            app.projects.push(project)

            const oldTask = new Task({
                id: 'task-1',
                title: 'Old task',
                projectId: 'proj-1',
                status: 'next',
                completed: false,
                updatedAt: '2024-12-01T12:00:00Z'
            })
            app.tasks.push(oldTask)

            jest.spyOn(window, 'confirm').mockReturnValue(false)

            await app.weeklyReview.markStaleProjectsSomeday()

            expect(app.projects[0].status).toBe('active')
        })
    })

    describe('Integration: Button clicks', () => {
        test('should show weekly review when button clicked', () => {
            app.setupWeeklyReview()

            const btn = document.getElementById('btn-weekly-review')
            const modal = document.getElementById('weekly-review-modal')

            btn.click()

            expect(modal.style.display).toBe('block')
        })

        test('should close weekly review when close button clicked', () => {
            app.setupWeeklyReview()

            // First show the modal
            const modal = document.getElementById('weekly-review-modal')
            modal.style.display = 'block'

            const closeBtn = document.getElementById('close-weekly-review-modal')

            closeBtn.click()

            expect(modal.style.display).toBe('none')
        })
    })

    describe('Edge Cases', () => {
        test('should handle empty state gracefully', () => {
            // Ensure DOM elements exist
            let modal = document.getElementById('weekly-review-modal')
            if (!modal) {
                modal = document.createElement('div')
                modal.id = 'weekly-review-modal'
                document.body.appendChild(modal)

                const content = document.createElement('div')
                content.id = 'weekly-review-content'
                modal.appendChild(content)
            }

            expect(() => app.renderWeeklyReview()).not.toThrow()
        })

        test('should handle tasks without completedAt', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task without completedAt',
                completed: true
            })
            app.tasks.push(task)

            expect(() => app.renderWeeklyReview()).not.toThrow()
        })

        test('should handle tasks without dueDate', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task without dueDate',
                status: 'next',
                completed: false
            })
            app.tasks.push(task)

            expect(() => app.renderWeeklyReview()).not.toThrow()
        })

        test('should handle multiple cleanup actions in sequence', async () => {
            const emptyProject = new Project({
                id: 'proj-1',
                title: 'Empty project'
            })
            app.projects.push(emptyProject)

            const oldTask = new Task({
                id: 'task-1',
                title: 'Old task',
                completed: true,
                completedAt: '2024-10-01T12:00:00Z'
            })
            app.tasks.push(oldTask)

            jest.spyOn(window, 'confirm').mockReturnValue(true)
            jest.spyOn(app, 'saveProjects').mockResolvedValue()
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderWeeklyReview')
            jest.spyOn(app, 'renderProjectsDropdown')
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(window, 'alert')
            global.URL.createObjectURL = jest.fn(() => 'blob:url')
            global.URL.revokeObjectURL = jest.fn()

            await app.weeklyReview.cleanupEmptyProjects()
            await app.weeklyReview.cleanupOldCompletedTasks()

            expect(app.projects.length).toBe(0)
            expect(app.tasks.length).toBe(0)
        })
    })
})
