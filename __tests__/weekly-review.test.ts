/**
 * Comprehensive Tests for Weekly Review Feature
 * Tests all Weekly Review functionality before modularization
 */

import { GTDApp } from '../js/app.ts'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Task, Project, Template } from '../js/models.ts'

describe('Weekly Review Feature - Comprehensive Tests', () => {
    let app: GTDApp

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

        // Mock URL methods for cleanupOldCompletedTasks
        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
        global.URL.revokeObjectURL = jest.fn()
    })

    afterEach(() => {
        document.body.innerHTML = ''
        localStorage.clear()
    })

    describe('setupWeeklyReview()', () => {
        test('should add click listener to weekly review button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('btn-weekly-review')!,
                'addEventListener'
            )

            app.setupWeeklyReview()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add click listener to close button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('close-weekly-review-modal')!,
                'addEventListener'
            )

            app.setupWeeklyReview()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should handle missing buttons gracefully', () => {
            document.body.innerHTML = '' // Remove all buttons

            expect(() => {
                app.setupWeeklyReview()
            }).not.toThrow()
        })
    })

    describe('showWeeklyReview()', () => {
        test('should display weekly review modal', () => {
            app.showWeeklyReview()

            const modal = document.getElementById('weekly-review-modal')
            expect(modal!.style.display).toBe('block')
        })

        test('should render weekly review content', () => {
            app.showWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content!.innerHTML).toBeTruthy()
        })

        test('should handle missing modal gracefully', () => {
            document.body.innerHTML = '' // Remove modal

            expect(() => {
                app.showWeeklyReview()
            }).not.toThrow()
        })
    })

    describe('closeWeeklyReview()', () => {
        test('should hide weekly review modal', () => {
            const modal = document.getElementById('weekly-review-modal')!
            modal.style.display = 'block'

            app.closeWeeklyReview()

            expect(modal.style.display).toBe('none')
        })

        test('should handle missing modal gracefully', () => {
            document.body.innerHTML = '' // Remove modal

            expect(() => {
                app.closeWeeklyReview()
            }).not.toThrow()
        })
    })

    describe('renderWeeklyReview()', () => {
        test('should render weekly review content', () => {
            // Add test data
            const lastWeek = new Date()
            lastWeek.setDate(lastWeek.getDate() - 3) // 3 days ago (within last week)

            app.tasks.push(
                new Task({ id: '1', title: 'Test Task', status: 'next' }),
                new Task({
                    id: '2',
                    title: 'Completed Task',
                    status: 'completed',
                    completed: true,
                    completedAt: lastWeek.toISOString()
                })
            )
            app.projects.push(new Project({ id: 'p1', title: 'Test Project', status: 'active' }))

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            // Weekly review shows counts, not individual task titles
            expect(content!.innerHTML).toContain('1 completed tasks')
            // Test Project won't appear unless it's stale (30+ days old)
        })

        test('should show completed tasks count', () => {
            const lastWeek = new Date()
            lastWeek.setDate(lastWeek.getDate() - 3) // 3 days ago (within last week)

            app.tasks.push(
                new Task({
                    id: '1',
                    title: 'Task 1',
                    status: 'completed',
                    completed: true,
                    completedAt: lastWeek.toISOString()
                }),
                new Task({
                    id: '2',
                    title: 'Task 2',
                    status: 'completed',
                    completed: true,
                    completedAt: lastWeek.toISOString()
                }),
                new Task({ id: '3', title: 'Task 3', status: 'next' })
            )

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content!.innerHTML).toContain('2 completed tasks')
        })

        test('should show overdue tasks', () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            app.tasks.push(
                new Task({
                    id: '1',
                    title: 'Overdue Task',
                    status: 'next',
                    dueDate: yesterday.toISOString().split('T')[0]
                })
            )

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content!.innerHTML).toContain('Overdue Task')
        })

        test('should show tasks due this week', () => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)

            app.tasks.push(
                new Task({
                    id: '1',
                    title: 'Due Tomorrow',
                    status: 'next',
                    dueDate: tomorrow.toISOString().split('T')[0]
                })
            )

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content!.innerHTML).toContain('Due Tomorrow')
        })

        test('should show waiting tasks count', () => {
            app.tasks.push(
                new Task({ id: '1', title: 'Waiting Task', status: 'waiting' }),
                new Task({ id: '2', title: 'Another Task', status: 'next' })
            )

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content!.innerHTML).toContain('1 Waiting')
        })

        test('should show someday tasks count', () => {
            app.tasks.push(
                new Task({ id: '1', title: 'Someday Task', status: 'someday' }),
                new Task({ id: '2', title: 'Another Task', status: 'next' })
            )

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content!.innerHTML).toContain('1 Someday')
        })

        test('should identify stale projects', () => {
            const staleDate = new Date()
            staleDate.setDate(staleDate.getDate() - 35) // 35 days ago (more than 30)

            app.projects.push(
                new Project({
                    id: 'p1',
                    title: 'Stale Project',
                    status: 'active',
                    updatedAt: staleDate.toISOString()
                })
            )

            // Add a task to the project that's also stale
            app.tasks.push(
                new Task({
                    id: 't1',
                    title: 'Stale task',
                    projectId: 'p1',
                    status: 'next',
                    updatedAt: staleDate.toISOString()
                })
            )

            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            expect(content!.innerHTML).toContain('Stale Project')
        })

        test('should show empty state when no data', () => {
            app.renderWeeklyReview()

            const content = document.getElementById('weekly-review-content')
            // With no data, weekly review shows 0 counts
            expect(content!.innerHTML).toContain('0 completed tasks')
            expect(content!.innerHTML).toContain('0 Waiting')
            expect(content!.innerHTML).toContain('0 Someday')
        })
    })

    describe('Weekly Review Actions', () => {
        beforeEach(() => {
            // Mock confirm to always return true
            jest.spyOn(window, 'confirm').mockReturnValue(true)
            jest.spyOn(app, 'saveProjects').mockResolvedValue()
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderWeeklyReview')
            jest.spyOn(app, 'renderProjectsDropdown')
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(window, 'alert')
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        describe('cleanupEmptyProjects()', () => {
            test('should remove projects with no tasks', async () => {
                app.projects.push(
                    new Project({ id: 'p1', title: 'Project with tasks', status: 'active' }),
                    new Project({ id: 'p2', title: 'Empty project', status: 'active' })
                )
                app.tasks.push(
                    new Task({
                        id: 't1',
                        title: 'Task in project',
                        projectId: 'p1',
                        status: 'next'
                    })
                )

                await app.weeklyReview.cleanupEmptyProjects()

                expect(app.projects).toHaveLength(1)
                expect(app.projects[0].title).toBe('Project with tasks')
                expect(app.saveProjects).toHaveBeenCalled()
                expect(app.renderProjectsDropdown).toHaveBeenCalled()
            })

            test('should alert when no empty projects', async () => {
                app.projects.push(
                    new Project({ id: 'p1', title: 'Project with tasks', status: 'active' })
                )
                app.tasks.push(
                    new Task({ id: 't1', title: 'Task', projectId: 'p1', status: 'next' })
                )

                await app.weeklyReview.cleanupEmptyProjects()

                expect(app.showWarning).toHaveBeenCalledWith('No empty projects to clean up.')
            })

            test('should respect user cancellation', async () => {
                jest.spyOn(window, 'confirm').mockReturnValue(false)

                app.projects.push(
                    new Project({ id: 'p1', title: 'Empty project', status: 'active' })
                )

                await app.weeklyReview.cleanupEmptyProjects()

                expect(app.projects).toHaveLength(1) // Should not be removed
                expect(app.saveProjects).not.toHaveBeenCalled()
            })
        })

        describe('cleanupOldCompletedTasks()', () => {
            test('should archive tasks completed more than 90 days ago', async () => {
                const oldDate = new Date()
                oldDate.setDate(oldDate.getDate() - 91) // 91 days ago (more than 90)

                app.tasks.push(
                    new Task({
                        id: 't1',
                        title: 'Old task',
                        status: 'completed',
                        completed: true,
                        completedAt: oldDate.toISOString()
                    }),
                    new Task({
                        id: 't2',
                        title: 'Recent task',
                        status: 'completed',
                        completed: true,
                        completedAt: new Date().toISOString()
                    })
                )

                await app.weeklyReview.cleanupOldCompletedTasks()

                expect(app.tasks).toHaveLength(1)
                expect(app.tasks[0].title).toBe('Recent task')
                expect(app.saveTasks).toHaveBeenCalled()
                expect(app.renderView).toHaveBeenCalled()
                expect(app.updateCounts).toHaveBeenCalled()
            })

            test('should alert when no old tasks', async () => {
                app.tasks.push(
                    new Task({
                        id: 't1',
                        title: 'Recent task',
                        status: 'completed',
                        completedAt: new Date().toISOString()
                    })
                )

                await app.weeklyReview.cleanupOldCompletedTasks()

                expect(app.showWarning).toHaveBeenCalledWith('No old completed tasks to archive.')
            })

            test('should respect user cancellation', async () => {
                jest.spyOn(window, 'confirm').mockReturnValue(false)

                const oldDate = new Date()
                oldDate.setDate(oldDate.getDate() - 31)

                app.tasks.push(
                    new Task({
                        id: 't1',
                        title: 'Old task',
                        status: 'completed',
                        completedAt: oldDate.toISOString()
                    })
                )

                await app.weeklyReview.cleanupOldCompletedTasks()

                expect(app.tasks).toHaveLength(1) // Should not be archived
                expect(app.saveTasks).not.toHaveBeenCalled()
            })
        })

        describe('markStaleProjectsSomeday()', () => {
            test('should move stale projects to someday', async () => {
                const staleDate = new Date()
                staleDate.setDate(staleDate.getDate() - 35) // 35 days ago (more than 30)

                app.projects.push(
                    new Project({
                        id: 'p1',
                        title: 'Stale project',
                        status: 'active',
                        updatedAt: staleDate.toISOString()
                    }),
                    new Project({
                        id: 'p2',
                        title: 'Active project',
                        status: 'active',
                        updatedAt: new Date().toISOString()
                    })
                )

                // Add stale tasks to the stale project
                app.tasks.push(
                    new Task({
                        id: 't1',
                        title: 'Stale task',
                        projectId: 'p1',
                        status: 'next',
                        updatedAt: staleDate.toISOString()
                    }),
                    new Task({
                        id: 't2',
                        title: 'Active task',
                        projectId: 'p2',
                        status: 'next',
                        updatedAt: new Date().toISOString()
                    })
                )

                await app.weeklyReview.markStaleProjectsSomeday()

                expect(app.projects[0].status).toBe('someday')
                expect(app.projects[1].status).toBe('active')
                expect(app.saveProjects).toHaveBeenCalled()
                expect(app.renderProjectsDropdown).toHaveBeenCalled()
            })

            test('should alert when no stale projects', async () => {
                app.projects.push(
                    new Project({
                        id: 'p1',
                        title: 'Active project',
                        status: 'active',
                        updatedAt: new Date().toISOString()
                    })
                )

                await app.weeklyReview.markStaleProjectsSomeday()

                expect(app.showWarning).toHaveBeenCalledWith('No stale projects to move.')
            })

            test('should respect user cancellation', async () => {
                jest.spyOn(window, 'confirm').mockReturnValue(false)

                const staleDate = new Date()
                staleDate.setDate(staleDate.getDate() - 8)

                app.projects.push(
                    new Project({
                        id: 'p1',
                        title: 'Stale project',
                        status: 'active',
                        updatedAt: staleDate.toISOString()
                    })
                )

                await app.weeklyReview.markStaleProjectsSomeday()

                expect(app.projects[0].status).toBe('active') // Should not be moved
                expect(app.saveProjects).not.toHaveBeenCalled()
            })
        })

        describe('Integration: Button clicks', () => {
            test('should show weekly review when button clicked', () => {
                app.setupWeeklyReview()
                const button = document.getElementById('btn-weekly-review') as HTMLButtonElement
                button.click()

                const modal = document.getElementById('weekly-review-modal')
                expect(modal!.style.display).toBe('block')
            })

            test('should close weekly review when close button clicked', () => {
                app.setupWeeklyReview()
                const modal = document.getElementById('weekly-review-modal') as HTMLElement
                modal.style.display = 'block'

                const closeButton = document.getElementById(
                    'close-weekly-review-modal'
                ) as HTMLButtonElement
                closeButton.click()

                expect(modal.style.display).toBe('none')
            })
        })

        describe('Edge Cases', () => {
            test('should handle empty state gracefully', () => {
                app.renderWeeklyReview()

                const content = document.getElementById('weekly-review-content')
                // With no data, weekly review shows 0 counts
                expect(content!.innerHTML).toContain('0 completed tasks')
                expect(content!.innerHTML).toContain('0 Waiting')
                expect(content!.innerHTML).toContain('0 Someday')
            })

            test('should handle tasks without completedAt', async () => {
                jest.spyOn(window, 'confirm').mockReturnValue(true)

                app.tasks.push(
                    new Task({
                        id: 't1',
                        title: 'Task without completedAt',
                        status: 'completed'
                        // No completedAt
                    })
                )

                await app.weeklyReview.cleanupOldCompletedTasks()

                expect(app.tasks).toHaveLength(1) // Should not be archived
            })

            test('should handle tasks without dueDate', () => {
                app.tasks.push(
                    new Task({
                        id: 't1',
                        title: 'Task without dueDate',
                        status: 'next'
                        // No dueDate
                    })
                )

                app.renderWeeklyReview()

                const content = document.getElementById('weekly-review-content')
                // Tasks without dueDate don't appear in weekly review unless overdue or due this week
                // Just verify the weekly review renders without errors
                expect(content!.innerHTML).toBeTruthy()
            })

            test('should handle multiple cleanup actions in sequence', async () => {
                jest.spyOn(window, 'confirm').mockReturnValue(true)

                // Setup test data
                const oldDate = new Date()
                oldDate.setDate(oldDate.getDate() - 91) // 91 days for cleanupOldCompletedTasks

                const staleDate = new Date()
                staleDate.setDate(staleDate.getDate() - 35) // 35 days for markStaleProjectsSomeday

                app.projects.push(
                    new Project({
                        id: 'p1',
                        title: 'Empty project',
                        status: 'active',
                        updatedAt: new Date().toISOString()
                    }),
                    new Project({
                        id: 'p2',
                        title: 'Stale project',
                        status: 'active',
                        updatedAt: staleDate.toISOString()
                    })
                )

                app.tasks.push(
                    new Task({
                        id: 't1',
                        title: 'Old completed task',
                        status: 'completed',
                        completed: true,
                        completedAt: oldDate.toISOString()
                    }),
                    // No task in p1 - it's truly empty
                    // t2 is not associated with any project
                    new Task({
                        id: 't3',
                        title: 'Stale task in stale project',
                        projectId: 'p2',
                        status: 'next',
                        updatedAt: staleDate.toISOString()
                    })
                )

                // Run all cleanup actions
                await app.weeklyReview.cleanupEmptyProjects()
                await app.weeklyReview.cleanupOldCompletedTasks()
                await app.weeklyReview.markStaleProjectsSomeday()

                // Verify results
                expect(app.projects).toHaveLength(1) // p1 removed (empty), p2 moved to someday (still exists)
                expect(app.projects[0].status).toBe('someday') // p2 moved to someday
                expect(app.tasks).toHaveLength(1) // t1 archived, t2 removed with project p1, t3 remains with p2
                expect(app.tasks[0].title).toBe('Stale task in stale project')
            })
        })
    })
})
