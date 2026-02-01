/**
 * Comprehensive Tests for Task Operations
 */

import { Task } from '../js/models.ts'
import { TaskOperations } from '../js/modules/features/task-operations.ts'

describe('TaskOperations', () => {
    let taskOps: TaskOperations
    let mockState: {
        tasks: Task[]
        currentView: string
        currentProjectId: string | null
        trackTaskUsage: jest.Mock
    }
    let mockApp: {
        parser: {
            parse: jest.Mock
        }
        saveState: jest.Mock
        saveTasks: jest.Mock
        renderView: jest.Mock
        updateCounts: jest.Mock
        updateContextFilter: jest.Mock
        renderProjectsDropdown: jest.Mock
        showSuccess: jest.Mock
        showWarning: jest.Mock
        showError: jest.Mock
        showToast: jest.Mock
        showNotification: jest.Mock
    }

    beforeEach(() => {
        localStorage.clear()

        mockState = {
            tasks: [],
            currentView: 'inbox',
            currentProjectId: null,
            trackTaskUsage: jest.fn()
        }

        mockApp = {
            parser: {
                parse: jest.fn((title: string) => ({ title }))
            },
            saveState: jest.fn(),
            saveTasks: jest.fn().mockResolvedValue(undefined),
            renderView: jest.fn(),
            updateCounts: jest.fn(),
            updateContextFilter: jest.fn(),
            renderProjectsDropdown: jest.fn(),
            showSuccess: jest.fn(),
            showWarning: jest.fn(),
            showError: jest.fn(),
            showToast: jest.fn(),
            showNotification: jest.fn()
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        taskOps = new TaskOperations(mockState as any, mockApp as any)
    })

    describe('quickAddTask()', () => {
        test('should add task with default status when in inbox view', async () => {
            await taskOps.quickAddTask('Buy milk')

            expect(mockState.tasks.length).toBe(1)
            expect(mockState.tasks[0].title).toBe('Buy milk')
            expect(mockState.tasks[0].status).toBe('inbox')
        })

        test('should add task with current view status', async () => {
            mockState.currentView = 'next'
            await taskOps.quickAddTask('Call mom')

            expect(mockState.tasks[0].status).toBe('next')
        })

        test('should add task with next status when in project', async () => {
            mockState.currentProjectId = 'proj-1'
            await taskOps.quickAddTask('Project task')

            expect(mockState.tasks[0].status).toBe('next')
            expect(mockState.tasks[0].projectId).toBe('proj-1')
        })

        test('should use natural language parser results', async () => {
            mockApp.parser.parse.mockReturnValue({
                title: 'Call mom',
                contexts: ['@phone'],
                energy: 'high',
                time: 30,
                dueDate: '2025-01-15'
            })

            await taskOps.quickAddTask('Call mom tomorrow high energy @phone')

            expect(mockApp.parser.parse).toHaveBeenCalledWith(
                'Call mom tomorrow high energy @phone'
            )
            expect(mockState.tasks[0].contexts).toEqual(['@phone'])
            expect(mockState.tasks[0].energy).toBe('high')
        })

        test('should handle parser without results', async () => {
            mockApp.parser.parse.mockReturnValue(null)

            await taskOps.quickAddTask('Buy milk')

            expect(mockState.tasks[0].title).toBe('Buy milk')
        })

        test('should save state for undo', async () => {
            await taskOps.quickAddTask('Buy milk')

            expect(mockApp.saveState).toHaveBeenCalledWith('Add task')
        })

        test('should track task usage', async () => {
            await taskOps.quickAddTask('Buy milk')

            expect(mockState.trackTaskUsage).toHaveBeenCalledWith(mockState.tasks[0])
        })

        test('should save and render after adding', async () => {
            await taskOps.quickAddTask('Buy milk')

            expect(mockApp.saveTasks).toHaveBeenCalled()
            expect(mockApp.renderView).toHaveBeenCalled()
            expect(mockApp.updateCounts).toHaveBeenCalled()
        })
    })

    describe('duplicateTask()', () => {
        beforeEach(() => {
            const originalTask = new Task({
                id: 'task-1',
                title: 'Original Task',
                status: 'next',
                completed: true,
                completedAt: '2025-01-10T12:00:00Z',
                timeSpent: 60
            })
            mockState.tasks.push(originalTask)
        })

        test('should create a copy of task', async () => {
            await taskOps.duplicateTask('task-1')

            expect(mockState.tasks.length).toBe(2)
            expect(mockState.tasks[1].title).toBe('Original Task (copy)')
        })

        test('should reset completion status on duplicate', async () => {
            await taskOps.duplicateTask('task-1')

            expect(mockState.tasks[1].completed).toBe(false)
            expect(mockState.tasks[1].completedAt).toBeNull()
        })

        test('should preserve other task properties', async () => {
            await taskOps.duplicateTask('task-1')

            expect(mockState.tasks[1].status).toBe('next')
            expect(mockState.tasks[1].timeSpent).toBe(60)
        })

        test('should return silently if task not found', async () => {
            await taskOps.duplicateTask('nonexistent')

            expect(mockState.tasks.length).toBe(1)
        })

        test('should save state for undo', async () => {
            await taskOps.duplicateTask('task-1')

            expect(mockApp.saveState).toHaveBeenCalledWith('Duplicate task')
        })
    })

    describe('toggleTaskComplete()', () => {
        test('should mark incomplete task as complete', async () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'next' })
            mockState.tasks.push(task)

            await taskOps.toggleTaskComplete('task-1')

            expect(task.completed).toBe(true)
        })

        test('should mark complete task as incomplete', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'next',
                completed: true,
                completedAt: '2025-01-10T12:00:00Z'
            })
            mockState.tasks.push(task)

            await taskOps.toggleTaskComplete('task-1')

            expect(task.completed).toBe(false)
        })

        test('should create next instance of recurring task', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Daily standup',
                status: 'next',
                recurrence: { type: 'daily' }
            })
            mockState.tasks.push(task)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(task as any).isRecurring = jest.fn(() => true)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(task as any).shouldRecurrenceEnd = jest.fn(() => false)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(task as any).createNextInstance = jest.fn(
                () => new Task({ title: 'Daily standup (copy)' })
            )

            await taskOps.toggleTaskComplete('task-1')

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((task as any).createNextInstance).toHaveBeenCalled()
        })

        test('should not create next instance if recurrence ends', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'One-time task',
                status: 'next'
            })
            mockState.tasks.push(task)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(task as any).shouldRecurrenceEnd = jest.fn(() => true)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(task as any).createNextInstance = jest.fn()

            await taskOps.toggleTaskComplete('task-1')

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((task as any).createNextInstance).not.toHaveBeenCalled()
        })

        test('should do nothing if task not found', async () => {
            await taskOps.toggleTaskComplete('nonexistent')

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })
    })

    describe('deleteTask()', () => {
        test('should delete task when confirmed', async () => {
            jest.spyOn(window, 'confirm').mockReturnValue(true)
            const task = new Task({ id: 'task-1', title: 'Task' })
            mockState.tasks.push(task)

            await taskOps.deleteTask('task-1')

            expect(mockState.tasks.length).toBe(0)
        })

        test('should not delete task when cancelled', async () => {
            jest.spyOn(window, 'confirm').mockReturnValue(false)
            const task = new Task({ id: 'task-1', title: 'Task' })
            mockState.tasks.push(task)

            await taskOps.deleteTask('task-1')

            expect(mockState.tasks.length).toBe(1)
        })

        test('should save state for undo', async () => {
            jest.spyOn(window, 'confirm').mockReturnValue(true)
            const task = new Task({ id: 'task-1', title: 'Task' })
            mockState.tasks.push(task)

            await taskOps.deleteTask('task-1')

            expect(mockApp.saveState).toHaveBeenCalledWith('Delete task')
        })
    })

    describe('migrateBlockedTasksToWaiting()', () => {
        test('should move tasks with unmet dependencies to waiting', async () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Task with deps',
                status: 'next',
                waitingForTaskIds: ['task-2']
            })
            const task2 = new Task({
                id: 'task-2',
                title: 'Dependency task',
                status: 'completed'
            })
            mockState.tasks.push(task1, task2)

            const moved = await taskOps.migrateBlockedTasksToWaiting()

            expect(moved).toBe(1)
            expect(task1.status).toBe('waiting')
        })

        test('should not move tasks with met dependencies', async () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Task with met deps',
                status: 'next',
                waitingForTaskIds: ['task-2']
            })
            const task2 = new Task({
                id: 'task-2',
                title: 'Completed dependency',
                status: 'next',
                completed: true
            })
            mockState.tasks.push(task1, task2)

            const moved = await taskOps.migrateBlockedTasksToWaiting()

            expect(moved).toBe(0)
            expect(task1.status).toBe('next')
        })

        test('should only check next and someday tasks', async () => {
            const inboxTask = new Task({
                id: 'task-1',
                title: 'Inbox task',
                status: 'inbox',
                waitingForTaskIds: ['task-2']
            })
            mockState.tasks.push(inboxTask)

            const moved = await taskOps.migrateBlockedTasksToWaiting()

            expect(moved).toBe(0)
            expect(inboxTask.status).toBe('inbox')
        })

        test('should not move completed tasks', async () => {
            const completedTask = new Task({
                id: 'task-1',
                title: 'Completed task',
                status: 'next',
                completed: true,
                waitingForTaskIds: ['task-2']
            })
            mockState.tasks.push(completedTask)

            const moved = await taskOps.migrateBlockedTasksToWaiting()

            expect(moved).toBe(0)
        })

        test('should update project dropdown', async () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Task with deps',
                status: 'next',
                waitingForTaskIds: ['task-2']
            })
            mockState.tasks.push(task1)

            await taskOps.migrateBlockedTasksToWaiting()

            expect(mockApp.renderProjectsDropdown).toHaveBeenCalled()
        })
    })

    describe('checkWaitingTasksDependencies()', () => {
        test('should move waiting tasks with met dependencies to next', async () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Waiting task',
                status: 'waiting',
                waitingForTaskIds: ['task-2']
            })
            const task2 = new Task({
                id: 'task-2',
                title: 'Dependency',
                status: 'completed',
                completed: true
            })
            mockState.tasks.push(task1, task2)

            const moved = await taskOps.checkWaitingTasksDependencies()

            expect(moved).toBe(1)
            expect(task1.status).toBe('next')
            expect(task1.waitingForTaskIds).toEqual([])
        })

        test('should move waiting tasks when defer date has arrived', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Deferred task',
                status: 'waiting',
                deferDate: '2025-01-01'
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(task as any).isAvailable = jest.fn(() => true)
            mockState.tasks.push(task)

            const moved = await taskOps.checkWaitingTasksDependencies()

            expect(moved).toBe(1)
            expect(task.status).toBe('next')
        })

        test('should move waiting tasks with no dependencies or defer date', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Generic waiting task',
                status: 'waiting'
            })
            mockState.tasks.push(task)

            const moved = await taskOps.checkWaitingTasksDependencies()

            expect(moved).toBe(1)
            expect(task.status).toBe('next')
        })

        test('should keep waiting tasks with unmet dependencies', async () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Waiting task',
                status: 'waiting',
                waitingForTaskIds: ['task-2']
            })
            const task2 = new Task({
                id: 'task-2',
                title: 'Incomplete dependency',
                status: 'next'
            })
            mockState.tasks.push(task1, task2)

            const moved = await taskOps.checkWaitingTasksDependencies()

            expect(moved).toBe(0)
            expect(task1.status).toBe('waiting')
        })

        test('should not affect non-waiting tasks', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Next task',
                status: 'next'
            })
            mockState.tasks.push(task)

            const moved = await taskOps.checkWaitingTasksDependencies()

            expect(moved).toBe(0)
            expect(task.status).toBe('next')
        })
    })

    describe('updateTaskPositions()', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="tasks-container">
                    <div class="task-item" data-task-id="task-1"></div>
                    <div class="task-item" data-task-id="task-2"></div>
                    <div class="task-item" data-task-id="task-3"></div>
                </div>
            `
        })

        test('should update task positions based on DOM order', async () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', status: 'next' })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', status: 'next' })
            const task3 = new Task({ id: 'task-3', title: 'Task 3', status: 'next' })
            mockState.tasks.push(task1, task2, task3)

            await taskOps.updateTaskPositions()

            expect(task1.position).toBe(0)
            expect(task2.position).toBe(1)
            expect(task3.position).toBe(2)
        })

        test('should ignore completed tasks', async () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', status: 'next' })
            const task2 = new Task({
                id: 'task-2',
                title: 'Task 2',
                status: 'next',
                completed: true
            })
            const task3 = new Task({ id: 'task-3', title: 'Task 3', status: 'next' })
            mockState.tasks.push(task1, task2, task3)

            await taskOps.updateTaskPositions()

            expect(task1.position).toBe(0)
            // task3 gets position 2 because it's at index 2 in DOM (including completed task2)
            expect(task3.position).toBe(2)
        })

        test('should return early if container not found', async () => {
            document.body.innerHTML = ''

            const task1 = new Task({ id: 'task-1', title: 'Task 1', status: 'next' })
            mockState.tasks.push(task1)

            await taskOps.updateTaskPositions()

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })
    })

    describe('getTaskById()', () => {
        test('should return task when found', () => {
            const task = new Task({ id: 'task-1', title: 'Task' })
            mockState.tasks.push(task)

            const result = taskOps.getTaskById('task-1')

            expect(result).toBe(task)
        })

        test('should return null when not found', () => {
            const result = taskOps.getTaskById('nonexistent')

            expect(result).toBeNull()
        })
    })

    describe('updateTask()', () => {
        test('should update task properties', async () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'next' })
            mockState.tasks.push(task)

            await taskOps.updateTask('task-1', { title: 'Updated Task', status: 'waiting' })

            expect(task.title).toBe('Updated Task')
            expect(task.status).toBe('waiting')
        })

        test('should update timestamp', async () => {
            const task = new Task({ id: 'task-1', title: 'Task' })
            mockState.tasks.push(task)

            await taskOps.updateTask('task-1', { title: 'Updated' })

            expect(task.updatedAt).toBeDefined()
        })

        test('should return early if task not found', async () => {
            await taskOps.updateTask('nonexistent', { title: 'Updated' })

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })

        test('should save state for undo', async () => {
            const task = new Task({ id: 'task-1', title: 'Task' })
            mockState.tasks.push(task)

            await taskOps.updateTask('task-1', { title: 'Updated' })

            expect(mockApp.saveState).toHaveBeenCalledWith('Update task')
        })
    })

    describe('assignTaskToProject()', () => {
        test('should assign task to project', async () => {
            const task = new Task({ id: 'task-1', title: 'Task' })
            mockState.tasks.push(task)

            await taskOps.assignTaskToProject('task-1', 'proj-1')

            expect(task.projectId).toBe('proj-1')
        })

        test('should unassign task from project', async () => {
            const task = new Task({ id: 'task-1', title: 'Task', projectId: 'proj-1' })
            mockState.tasks.push(task)

            await taskOps.assignTaskToProject('task-1', null)

            expect(task.projectId).toBeNull()
        })

        test('should return early if task not found', async () => {
            await taskOps.assignTaskToProject('nonexistent', 'proj-1')

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })
    })

    describe('addTimeSpent()', () => {
        test('should add time to task', async () => {
            const task = new Task({ id: 'task-1', title: 'Task', timeSpent: 30 })
            mockState.tasks.push(task)

            await taskOps.addTimeSpent('task-1', 15)

            expect(task.timeSpent).toBe(45)
        })

        test('should handle task with no existing time', async () => {
            const task = new Task({ id: 'task-1', title: 'Task' })
            mockState.tasks.push(task)

            await taskOps.addTimeSpent('task-1', 30)

            expect(task.timeSpent).toBe(30)
        })

        test('should return early if task not found', async () => {
            await taskOps.addTimeSpent('nonexistent', 30)

            expect(mockApp.saveTasks).not.toHaveBeenCalled()
        })
    })

    describe('getTasksForProject()', () => {
        test('should return tasks for project', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', projectId: 'proj-1' })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', projectId: 'proj-2' })
            mockState.tasks.push(task1, task2)

            const result = taskOps.getTasksForProject('proj-1')

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('task-1')
        })

        test('should return empty array if no tasks for project', () => {
            const result = taskOps.getTasksForProject('proj-1')

            expect(result).toEqual([])
        })
    })

    describe('getActiveTasks()', () => {
        test('should return only active tasks', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', status: 'next' })
            const task2 = new Task({
                id: 'task-2',
                title: 'Task 2',
                status: 'next',
                completed: true
            })
            mockState.tasks.push(task1, task2)

            const result = taskOps.getActiveTasks()

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('task-1')
        })

        test('should return empty array if no active tasks', () => {
            const result = taskOps.getActiveTasks()

            expect(result).toEqual([])
        })
    })

    describe('getCompletedTasks()', () => {
        test('should return completed tasks', () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Task 1',
                status: 'next',
                completed: true
            })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', status: 'next' })
            mockState.tasks.push(task1, task2)

            const result = taskOps.getCompletedTasks()

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('task-1')
        })
    })

    describe('searchTasks()', () => {
        test('should search in task titles', () => {
            const task1 = new Task({ id: 'task-1', title: 'Buy groceries', status: 'next' })
            const task2 = new Task({ id: 'task-2', title: 'Call mom', status: 'next' })
            mockState.tasks.push(task1, task2)

            const result = taskOps.searchTasks('buy')

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('task-1')
        })

        test('should search case-insensitively', () => {
            const task = new Task({ id: 'task-1', title: 'Buy groceries', status: 'next' })
            mockState.tasks.push(task)

            const result = taskOps.searchTasks('GROCERIES')

            expect(result).toHaveLength(1)
        })

        test('should search in task descriptions', () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Task',
                description: 'Remember to buy milk',
                status: 'next'
            })
            const task2 = new Task({
                id: 'task-2',
                title: 'Task',
                description: 'Call mom',
                status: 'next'
            })
            mockState.tasks.push(task1, task2)

            const result = taskOps.searchTasks('milk')

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('task-1')
        })

        test('should return empty array if no matches', () => {
            const task = new Task({ id: 'task-1', title: 'Buy groceries', status: 'next' })
            mockState.tasks.push(task)

            const result = taskOps.searchTasks('xyz')

            expect(result).toEqual([])
        })

        test('should handle tasks without description', () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'next' })
            mockState.tasks.push(task)

            expect(() => taskOps.searchTasks('test')).not.toThrow()
        })
    })
})
