/**
 * Comprehensive Tests for Priority Scoring Feature - TypeScript Version
 */

import { GTDApp } from '../js/app.ts'
import { PriorityScoringManager } from '../js/modules/features/priority-scoring.ts'
import { Task, Project, TaskData, ProjectData } from '../js/models'

// Helper function to create a test task with minimal properties
function createTestTask (data: Partial<TaskData>): Task {
    // Start with a minimal task that won't add extra points
    const baseData: TaskData = {
        title: data.title || 'Test Task',
        completed: data.completed || false,
        status: 'waiting', // Not 'inbox' to avoid +5 points
        energy: '',
        time: 0,
        timeSpent: 0,
        projectId: null,
        contexts: [],
        completedAt: null,
        dueDate: null,
        deferDate: null,
        waitingForTaskIds: [],
        waitingForDescription: '',
        recurrence: '',
        recurrenceEndDate: null,
        recurrenceParentId: null,
        position: 0,
        starred: false,
        notes: '',
        subtasks: [],
        url: '',
        description: '',
        type: 'task'
    }

    // Override with provided data
    return new Task({ ...baseData, ...data })
}

describe('PriorityScoringManager - Score Calculation', () => {
    let _manager: PriorityScoringManager
    let mockState: { tasks: Task[]; projects: Project[] }
    let _mockApp: GTDApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }

        _mockApp = new GTDApp()
        _manager = new PriorityScoringManager(mockState)
    })

    describe('calculatePriorityScore() - Base Cases', () => {
        test('should return 0 for null task', () => {
            const score = _manager.calculatePriorityScore(null as unknown as Task)
            expect(score).toBe(0)
        })

        test('should return 0 for undefined task', () => {
            const score = _manager.calculatePriorityScore(undefined as unknown as Task)
            expect(score).toBe(0)
        })

        test('should return 0 for completed tasks', () => {
            const task = createTestTask({
                id: '1',
                title: 'Completed task',
                completed: true
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(0)
        })

        test('should return base score of 50 for minimal task', () => {
            const task = createTestTask({
                id: '1',
                title: 'Basic task',
                completed: false
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50)
        })

        test('should ensure score is within 0-100 range', () => {
            // Create task with many positive factors
            const task = createTestTask({
                id: '1',
                title: 'High priority',
                completed: false,
                dueDate: '2026-01-01', // Overdue
                starred: true,
                status: 'next',
                time: 5,
                energy: 'high',
                projectId: 'active-project',
                createdAt: '2025-12-01T00:00:00.000Z'
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(100)
        })
    })

    describe('calculatePriorityScore() - Due Date Factor (0-25 points)', () => {
        test('should add 25 points for overdue tasks', () => {
            const pastDate = new Date()
            pastDate.setDate(pastDate.getDate() - 5)

            const task = createTestTask({
                id: '1',
                title: 'Overdue task',
                completed: false,
                dueDate: pastDate.toISOString().split('T')[0]
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(75) // 50 base + 25 overdue
        })

        test('should add 20 points for tasks due today', () => {
            const today = new Date().toISOString().split('T')[0]

            const task = createTestTask({
                id: '1',
                title: 'Due today',
                completed: false,
                dueDate: today
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(70) // 50 base + 20 due today
        })

        test('should add 15 points for tasks due tomorrow', () => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)

            const task = createTestTask({
                id: '1',
                title: 'Due tomorrow',
                completed: false,
                dueDate: tomorrow.toISOString().split('T')[0]
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(65) // 50 base + 15 due tomorrow
        })

        test('should add 10 points for tasks due within 3 days', () => {
            const inThreeDays = new Date()
            inThreeDays.setDate(inThreeDays.getDate() + 3)

            const task = createTestTask({
                id: '1',
                title: 'Due in 3 days',
                completed: false,
                dueDate: inThreeDays.toISOString().split('T')[0]
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(60) // 50 base + 10 due soon
        })

        test('should add 5 points for tasks due within 7 days', () => {
            const inFiveDays = new Date()
            inFiveDays.setDate(inFiveDays.getDate() + 5)

            const task = createTestTask({
                id: '1',
                title: 'Due in 5 days',
                completed: false,
                dueDate: inFiveDays.toISOString().split('T')[0]
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(55) // 50 base + 5
        })

        test('should add 0 points for tasks due beyond 7 days', () => {
            const inTwoWeeks = new Date()
            inTwoWeeks.setDate(inTwoWeeks.getDate() + 14)

            const task = createTestTask({
                id: '1',
                title: 'Due in 2 weeks',
                completed: false,
                dueDate: inTwoWeeks.toISOString().split('T')[0]
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })
    })

    describe('calculatePriorityScore() - Starred Factor (0-15 points)', () => {
        test('should add 15 points for starred tasks', () => {
            const task = createTestTask({
                id: '1',
                title: 'Starred task',
                completed: false,
                starred: true
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(65) // 50 base + 15 starred
        })

        test('should not add points for non-starred tasks', () => {
            const task = createTestTask({
                id: '1',
                title: 'Regular task',
                completed: false,
                starred: false
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })
    })

    describe('calculatePriorityScore() - Task Status Factor (0-10 points)', () => {
        test('should add 10 points for next action status', () => {
            const task = createTestTask({
                id: '1',
                title: 'Next action',
                completed: false,
                status: 'next'
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(60) // 50 base + 10 next
        })

        test('should add 5 points for inbox status', () => {
            const task = createTestTask({
                id: '1',
                title: 'Inbox task',
                completed: false,
                status: 'inbox'
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(55) // 50 base + 5 inbox
        })

        test('should not add points for other statuses', () => {
            const task = createTestTask({
                id: '1',
                title: 'Waiting task',
                completed: false,
                status: 'waiting'
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })
    })

    describe('calculatePriorityScore() - Dependencies Factor (-10 to +10 points)', () => {
        test('should add 10 points when dependencies are met', () => {
            const depTask = createTestTask({ id: 'dep1', title: 'Dependency', completed: true })
            const currentTask = createTestTask({
                id: '1',
                title: 'Task with met deps',
                completed: false,
                waitingForTaskIds: ['dep1']
            })

            mockState.tasks = [depTask, currentTask]

            const score = _manager.calculatePriorityScore(currentTask)
            expect(score).toBe(60) // 50 base + 10 dependencies met
        })

        test('should subtract 10 points when dependencies are not met', () => {
            const depTask = createTestTask({ id: 'dep1', title: 'Dependency', completed: false })
            const currentTask = createTestTask({
                id: '1',
                title: 'Task with unmet deps',
                completed: false,
                waitingForTaskIds: ['dep1']
            })

            mockState.tasks = [depTask, currentTask]

            const score = _manager.calculatePriorityScore(currentTask)
            expect(score).toBe(40) // 50 base - 10 blocked
        })

        test('should not modify score when no dependencies', () => {
            const task = createTestTask({
                id: '1',
                title: 'Task without dependencies',
                completed: false
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })
    })

    describe('calculatePriorityScore() - Energy/Time Factor (-5 to +8 points)', () => {
        test('should add 8 points for quick high-energy tasks', () => {
            const task = createTestTask({
                id: '1',
                title: 'Quick high energy',
                completed: false,
                energy: 'high',
                time: 10
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(61) // 50 base + 8 (high energy + quick) + 3 (time estimate)
        })

        test('should subtract 5 points for long low-energy tasks', () => {
            const task = createTestTask({
                id: '1',
                title: 'Long low energy',
                completed: false,
                energy: 'low',
                time: 90
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(45) // 50 base - 5
        })

        test('should not modify score for medium energy/time combinations', () => {
            const task = createTestTask({
                id: '1',
                title: 'Medium task',
                completed: false,
                energy: 'medium',
                time: 30
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })
    })

    describe('calculatePriorityScore() - Time Estimate Factor (0-5 points)', () => {
        test('should add 5 points for very quick tasks (≤5 min)', () => {
            const task = createTestTask({
                id: '1',
                title: 'Very quick task',
                completed: false,
                time: 5
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(55) // 50 base + 5
        })

        test('should add 3 points for quick tasks (≤15 min)', () => {
            const task = createTestTask({
                id: '1',
                title: 'Quick task',
                completed: false,
                time: 15
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(53) // 50 base + 3
        })

        test('should not add points for longer tasks (>15 min)', () => {
            const task = createTestTask({
                id: '1',
                title: 'Longer task',
                completed: false,
                time: 30
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })
    })

    describe('calculatePriorityScore() - Project Priority Factor (0-5 points)', () => {
        test('should add 5 points for tasks in active projects', () => {
            const projectData: ProjectData = {
                id: 'proj1',
                title: 'Active Project',
                status: 'active'
            }
            const project = new Project(projectData)
            mockState.projects = [project]

            const task = createTestTask({
                id: '1',
                title: 'Project task',
                completed: false,
                projectId: 'proj1'
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(55) // 50 base + 5
        })

        test('should not add points for tasks in non-active projects', () => {
            const projectData: ProjectData = {
                id: 'proj1',
                title: 'Someday Project',
                status: 'someday'
            }
            const project = new Project(projectData)
            mockState.projects = [project]

            const task = createTestTask({
                id: '1',
                title: 'Project task',
                completed: false,
                projectId: 'proj1'
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })

        test('should not add points when project not found', () => {
            const task = createTestTask({
                id: '1',
                title: 'Orphan task',
                completed: false,
                projectId: 'nonexistent'
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })
    })

    describe('calculatePriorityScore() - Defer Date Factor (-20 points)', () => {
        test('should subtract 20 points for deferred tasks', () => {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + 7)

            const task = createTestTask({
                id: '1',
                title: 'Deferred task',
                completed: false,
                deferDate: futureDate.toISOString().split('T')[0]
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(30) // 50 base - 20 deferred
        })

        test('should not subtract points if task is available', () => {
            const task = createTestTask({
                id: '1',
                title: 'Available task',
                completed: false,
                deferDate: '2026-01-01'
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })
    })

    describe('calculatePriorityScore() - Task Age Factor (0-7 points)', () => {
        test('should add 7 points for tasks older than 30 days', () => {
            const oldDate = new Date()
            oldDate.setDate(oldDate.getDate() - 35)

            const task = createTestTask({
                id: '1',
                title: 'Old task',
                completed: false,
                createdAt: oldDate.toISOString()
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(57) // 50 base + 7
        })

        test('should add 5 points for tasks older than 14 days', () => {
            const oldDate = new Date()
            oldDate.setDate(oldDate.getDate() - 20)

            const task = createTestTask({
                id: '1',
                title: 'Old task',
                completed: false,
                createdAt: oldDate.toISOString()
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(55) // 50 base + 5
        })

        test('should add 3 points for tasks older than 7 days', () => {
            const oldDate = new Date()
            oldDate.setDate(oldDate.getDate() - 10)

            const task = createTestTask({
                id: '1',
                title: 'Old task',
                completed: false,
                createdAt: oldDate.toISOString()
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(53) // 50 base + 3
        })

        test('should not add points for new tasks (≤7 days)', () => {
            const recentDate = new Date()
            recentDate.setDate(recentDate.getDate() - 3)

            const task = createTestTask({
                id: '1',
                title: 'New task',
                completed: false,
                createdAt: recentDate.toISOString()
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(50) // 50 base only
        })
    })

    describe('calculatePriorityScore() - Combined Factors', () => {
        test('should combine multiple factors correctly', () => {
            const today = new Date().toISOString().split('T')[0]

            const task = createTestTask({
                id: '1',
                title: 'Complex task',
                completed: false,
                dueDate: today, // +20
                starred: true, // +15
                status: 'next', // +10
                time: 5 // +5
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(100) // 50 + 20 + 15 + 10 + 5 = 100 (maxed out)
        })

        test('should cap at 100 even with many positive factors', () => {
            const pastDate = new Date()
            pastDate.setDate(pastDate.getDate() - 5)

            const oldDate = new Date()
            oldDate.setDate(oldDate.getDate() - 35)

            const task = createTestTask({
                id: '1',
                title: 'Super priority',
                completed: false,
                dueDate: pastDate.toISOString().split('T')[0], // +25
                starred: true, // +15
                status: 'next', // +10
                energy: 'high',
                time: 5, // +8 + 5
                createdAt: oldDate.toISOString() // +7
            })

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(100) // Should cap at 100
        })

        test('should not go below 0 with many negative factors', () => {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + 7)

            const task = createTestTask({
                id: '1',
                title: 'Low priority',
                completed: false,
                deferDate: futureDate.toISOString().split('T')[0], // -20
                energy: 'low',
                time: 90, // -5
                waitingForTaskIds: ['dep1'] // -10
            })

            // Add a dependency task that's not completed
            const depTask = createTestTask({ id: 'dep1', title: 'Dependency', completed: false })
            mockState.tasks = [depTask, task]

            const score = _manager.calculatePriorityScore(task)
            expect(score).toBe(15) // 50 - 20 - 5 - 10 = 15 (minimum)
        })
    })
})

describe('PriorityScoringManager - Score Color Mapping', () => {
    let _manager: PriorityScoringManager
    let mockState: { tasks: Task[]; projects: Project[] }
    let _mockApp: GTDApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        _mockApp = new GTDApp()
        _manager = new PriorityScoringManager(mockState)
    })

    describe('getPriorityScoreColor()', () => {
        test('should return orange for high scores (60-79)', () => {
            expect(_manager.getPriorityScoreColor(60)).toBe('#f39c12')
            expect(_manager.getPriorityScoreColor(70)).toBe('#f39c12')
            expect(_manager.getPriorityScoreColor(79)).toBe('#f39c12')
        })

        test('should return warning color for medium scores (40-59)', () => {
            expect(_manager.getPriorityScoreColor(40)).toBe('var(--warning-color)')
            expect(_manager.getPriorityScoreColor(50)).toBe('var(--warning-color)')
            expect(_manager.getPriorityScoreColor(59)).toBe('var(--warning-color)')
        })

        test('should return info color for low scores (20-39)', () => {
            expect(_manager.getPriorityScoreColor(20)).toBe('var(--info-color)')
            expect(_manager.getPriorityScoreColor(30)).toBe('var(--info-color)')
            expect(_manager.getPriorityScoreColor(39)).toBe('var(--info-color)')
        })

        test('should return text-secondary for very low scores (<20)', () => {
            expect(_manager.getPriorityScoreColor(0)).toBe('var(--text-secondary)')
            expect(_manager.getPriorityScoreColor(10)).toBe('var(--text-secondary)')
            expect(_manager.getPriorityScoreColor(19)).toBe('var(--text-secondary)')
        })

        test('should handle boundary values correctly', () => {
            expect(_manager.getPriorityScoreColor(79)).toBe('#f39c12') // Not urgent yet
            expect(_manager.getPriorityScoreColor(80)).toBe('var(--danger-color)') // Urgent
            expect(_manager.getPriorityScoreColor(59)).toBe('var(--warning-color)') // Medium
            expect(_manager.getPriorityScoreColor(60)).toBe('#f39c12') // High
            expect(_manager.getPriorityScoreColor(39)).toBe('var(--info-color)') // Low
            expect(_manager.getPriorityScoreColor(40)).toBe('var(--warning-color)') // Medium
            expect(_manager.getPriorityScoreColor(19)).toBe('var(--text-secondary)') // Very low
            expect(_manager.getPriorityScoreColor(20)).toBe('var(--info-color)') // Low
        })
    })
})

describe('PriorityScoringManager - Score Label Mapping', () => {
    let _manager: PriorityScoringManager
    let mockState: { tasks: Task[]; projects: Project[] }
    let _mockApp: GTDApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        _mockApp = new GTDApp()
        _manager = new PriorityScoringManager(mockState)
    })

    describe('getPriorityLabel()', () => {
        test('should return "Urgent" for urgent scores (≥80)', () => {
            expect(_manager.getPriorityLabel(80)).toBe('Urgent')
            expect(_manager.getPriorityLabel(90)).toBe('Urgent')
            expect(_manager.getPriorityLabel(100)).toBe('Urgent')
        })

        test('should return "High" for high scores (60-79)', () => {
            expect(_manager.getPriorityLabel(60)).toBe('High')
            expect(_manager.getPriorityLabel(70)).toBe('High')
            expect(_manager.getPriorityLabel(79)).toBe('High')
        })

        test('should return "Medium" for medium scores (40-59)', () => {
            expect(_manager.getPriorityLabel(40)).toBe('Medium')
            expect(_manager.getPriorityLabel(50)).toBe('Medium')
            expect(_manager.getPriorityLabel(59)).toBe('Medium')
        })

        test('should return "Low" for low scores (20-39)', () => {
            expect(_manager.getPriorityLabel(20)).toBe('Low')
            expect(_manager.getPriorityLabel(30)).toBe('Low')
            expect(_manager.getPriorityLabel(39)).toBe('Low')
        })

        test('should return "Very Low" for very low scores (<20)', () => {
            expect(_manager.getPriorityLabel(0)).toBe('Very Low')
            expect(_manager.getPriorityLabel(10)).toBe('Very Low')
            expect(_manager.getPriorityLabel(19)).toBe('Very Low')
        })

        test('should handle boundary values correctly', () => {
            expect(_manager.getPriorityLabel(79)).toBe('High')
            expect(_manager.getPriorityLabel(80)).toBe('Urgent')
            expect(_manager.getPriorityLabel(59)).toBe('Medium')
            expect(_manager.getPriorityLabel(60)).toBe('High')
            expect(_manager.getPriorityLabel(39)).toBe('Low')
            expect(_manager.getPriorityLabel(40)).toBe('Medium')
            expect(_manager.getPriorityLabel(19)).toBe('Very Low')
            expect(_manager.getPriorityLabel(20)).toBe('Low')
        })
    })
})

describe('PriorityScoringManager - Private Methods', () => {
    let _manager: PriorityScoringManager
    let mockState: { tasks: Task[]; projects: Project[] }
    let _mockApp: GTDApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        _mockApp = new GTDApp()
        _manager = new PriorityScoringManager(mockState)
    })

    describe('getDaysUntilDue()', () => {
        test('should return positive number for future due dates', () => {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + 5)

            const task = createTestTask({
                id: '1',
                title: 'Future task',
                dueDate: futureDate.toISOString().split('T')[0]
            })

            // Access private method using type assertion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const days = (_manager as any).getDaysUntilDue(task)
            expect(days).toBe(5)
        })

        test('should return negative number for past due dates', () => {
            const pastDate = new Date()
            pastDate.setDate(pastDate.getDate() - 3)

            const task = createTestTask({
                id: '1',
                title: 'Past task',
                dueDate: pastDate.toISOString().split('T')[0]
            })

            // Access private method using type assertion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const days = (_manager as any).getDaysUntilDue(task)
            expect(days).toBe(-3)
        })

        test('should return 0 for today', () => {
            const today = new Date().toISOString().split('T')[0]

            const task = createTestTask({
                id: '1',
                title: 'Today task',
                dueDate: today
            })

            // Access private method using type assertion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const days = (_manager as any).getDaysUntilDue(task)
            expect(days).toBe(0)
        })

        test('should return null for tasks without due date', () => {
            const task = createTestTask({
                id: '1',
                title: 'No due date'
            })

            // Access private method using type assertion
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const days = (_manager as any).getDaysUntilDue(task)
            expect(days).toBeNull()
        })
    })
})
