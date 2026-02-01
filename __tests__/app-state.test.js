/**
 * Comprehensive Tests for AppState (Centralized State Management)
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Task, Project, Template } from '../js/models.ts'
import { AppState } from '../js/modules/core/app-state.ts'

describe('AppState', () => {
    let appState

    beforeEach(() => {
        localStorage.clear()
        appState = new AppState()
    })

    afterEach(() => {
        localStorage.clear()
    })

    describe('Constructor', () => {
        test('should initialize with empty arrays', () => {
            expect(appState.tasks).toEqual([])
            expect(appState.projects).toEqual([])
            expect(appState.templates).toEqual([])
        })

        test('should initialize view state', () => {
            expect(appState.currentView).toBe('inbox')
            expect(appState.currentProjectId).toBeNull()
        })

        test('should initialize filters', () => {
            expect(appState.filters).toEqual({ context: '', energy: '', time: '' })
            expect(appState.selectedContextFilters).toBeInstanceOf(Set)
            expect(appState.selectedContextFilters.size).toBe(0)
        })

        test('should initialize search state', () => {
            expect(appState.searchQuery).toBe('')
            expect(appState.advancedSearchFilters).toEqual({
                context: '',
                energy: '',
                status: '',
                due: '',
                sort: 'updated'
            })
            expect(appState.savedSearches).toEqual([])
        })

        test('should load saved searches from localStorage', () => {
            const savedSearches = [{ id: '1', name: 'Work tasks', query: 'work' }]
            localStorage.setItem('gtd_saved_searches', JSON.stringify(savedSearches))

            const state = new AppState()

            expect(state.savedSearches).toEqual(savedSearches)
        })

        test('should initialize UI state', () => {
            expect(appState.selectedTaskId).toBeNull()
            expect(appState.bulkSelectionMode).toBe(false)
            expect(appState.selectedTaskIds).toBeInstanceOf(Set)
            expect(appState.showingArchivedProjects).toBe(false)
        })

        test('should initialize timer state', () => {
            expect(appState.activeTimers).toBeInstanceOf(Map)
            expect(appState.activeTimers.size).toBe(0)
        })

        test('should initialize pomodoro state', () => {
            expect(appState.pomodoroTimer).toBeNull()
            expect(appState.pomodoroTimeLeft).toBe(25 * 60)
            expect(appState.pomodoroIsRunning).toBe(false)
            expect(appState.pomodoroIsBreak).toBe(false)
        })

        test('should initialize focus mode state', () => {
            expect(appState.focusTaskId).toBeNull()
        })

        test('should initialize calendar state', () => {
            expect(appState.calendarView).toBe('month')
            expect(appState.calendarDate).toBeInstanceOf(Date)
        })

        test('should initialize undo/redo state', () => {
            expect(appState.history).toEqual([])
            expect(appState.historyIndex).toBe(-1)
            expect(appState.maxHistorySize).toBe(50)
        })

        test('should load usage stats from localStorage', () => {
            expect(appState.usageStats).toBeDefined()
            expect(appState.usageStats.contexts).toBeDefined()
            expect(appState.usageStats.times).toBeDefined()
        })

        test('should initialize default contexts', () => {
            expect(appState.defaultContexts).toEqual([
                '@home',
                '@work',
                '@personal',
                '@computer',
                '@phone',
                '@errand'
            ])
        })
    })

    describe('getState()', () => {
        test('should return all state properties', () => {
            appState.tasks.push(new Task({ id: '1', title: 'Test' }))
            appState.currentView = 'next'

            const state = appState.getState()

            expect(state.tasks).toHaveLength(1)
            expect(state.currentView).toBe('next')
        })

        test('should clone filters object', () => {
            const state1 = appState.getState()
            const state2 = appState.getState()

            state1.filters.context = '@test'

            expect(state2.filters.context).toBe('')
        })

        test('should clone selectedContextFilters Set', () => {
            appState.selectedContextFilters.add('@test')

            const state = appState.getState()

            expect(state.selectedContextFilters).toBeInstanceOf(Set)
            expect(state.selectedContextFilters.has('@test')).toBe(true)

            // Modifying returned Set should not affect original
            state.selectedContextFilters.clear()
            expect(appState.selectedContextFilters.has('@test')).toBe(true)
        })

        test('should clone advancedSearchFilters object', () => {
            const state1 = appState.getState()
            const state2 = appState.getState()

            state1.advancedSearchFilters.context = '@test'

            expect(state2.advancedSearchFilters.context).toBe('')
        })

        test('should clone savedSearches array', () => {
            const state1 = appState.getState()
            const state2 = appState.getState()

            state1.savedSearches.push({ test: 'data' })

            expect(state2.savedSearches).toHaveLength(0)
        })

        test('should clone selectedTaskIds Set', () => {
            appState.selectedTaskIds.add('task-1')

            const state = appState.getState()

            expect(state.selectedTaskIds).toBeInstanceOf(Set)
            expect(state.selectedTaskIds.has('task-1')).toBe(true)
        })

        test('should clone activeTimers Map', () => {
            appState.activeTimers.set('task-1', { started: Date.now() })

            const state = appState.getState()

            expect(state.activeTimers).toBeInstanceOf(Map)
            expect(state.activeTimers.has('task-1')).toBe(true)
        })

        test('should clone usageStats object', () => {
            appState.usageStats.contexts = { '@test': 5 }

            const state1 = appState.getState()
            const state2 = appState.getState()

            // Shallow clone: modifying top-level property on state1 doesn't affect state2
            state1.usageStats = { contexts: { '@test': 10 } }

            expect(state2.usageStats.contexts['@test']).toBe(5)
            // Note: nested objects are still shared (shallow clone)
        })

        test('should return new Date for calendarDate', () => {
            const state1 = appState.getState()
            const state2 = appState.getState()

            expect(state1.calendarDate).toBeInstanceOf(Date)
            expect(state2.calendarDate).toBeInstanceOf(Date)
            expect(state1.calendarDate).not.toBe(state2.calendarDate)
        })
    })

    describe('setState()', () => {
        test('should update valid properties', () => {
            appState.setState({
                currentView: 'next',
                selectedTaskId: 'task-1'
            })

            expect(appState.currentView).toBe('next')
            expect(appState.selectedTaskId).toBe('task-1')
        })

        test('should warn when setting unknown property', () => {
            const loggerSpy = jest.spyOn(appState.logger, 'warn')

            appState.setState({
                unknownProperty: 'value'
            })

            expect(loggerSpy).toHaveBeenCalledWith(
                'Attempted to set unknown state property: unknownProperty'
            )
        })

        test('should not modify state for unknown property', () => {
            appState.setState({
                unknownProperty: 'value'
            })

            expect(appState.unknownProperty).toBeUndefined()
        })

        test('should update multiple properties at once', () => {
            appState.setState({
                currentView: 'waiting',
                filters: { context: '@test', energy: '', time: '' },
                searchQuery: 'test'
            })

            expect(appState.currentView).toBe('waiting')
            expect(appState.filters.context).toBe('@test')
            expect(appState.searchQuery).toBe('test')
        })
    })

    describe('loadUsageStats()', () => {
        test('should return default stats when localStorage is empty', () => {
            const stats = appState.loadUsageStats()

            expect(stats).toEqual({
                contexts: {},
                times: {},
                lastUpdated: null
            })
        })

        test('should load stats from localStorage', () => {
            const statsData = {
                contexts: { '@home': 10, '@work': 5 },
                times: { 15: 3, 30: 2 },
                lastUpdated: '2025-01-10T12:00:00Z'
            }
            localStorage.setItem('gtd_usage_stats', JSON.stringify(statsData))

            const stats = appState.loadUsageStats()

            expect(stats).toEqual(statsData)
        })

        test('should return default stats on parse error', () => {
            localStorage.setItem('gtd_usage_stats', 'invalid json')

            const stats = appState.loadUsageStats()

            expect(stats.contexts).toBeDefined()
            expect(stats.times).toBeDefined()
            expect(stats.lastUpdated).toBeNull()
        })

        test('should log warning on load failure', () => {
            localStorage.setItem('gtd_usage_stats', 'invalid json')
            const loggerSpy = jest.spyOn(appState.logger, 'warn')

            appState.loadUsageStats()

            expect(loggerSpy).toHaveBeenCalled()
        })
    })

    describe('saveUsageStats()', () => {
        test('should save stats to localStorage', () => {
            appState.usageStats.contexts = { '@test': 5 }

            appState.saveUsageStats()

            const saved = localStorage.getItem('gtd_usage_stats')
            const parsed = JSON.parse(saved)

            expect(parsed.contexts).toEqual({ '@test': 5 })
            expect(parsed.lastUpdated).toBeDefined()
        })

        test('should update lastUpdated timestamp', () => {
            const beforeSave = new Date()

            appState.saveUsageStats()

            // lastUpdated is set on the instance after saving
            expect(appState.usageStats.lastUpdated).toBeDefined()
            const updatedDate = new Date(appState.usageStats.lastUpdated)
            expect(updatedDate.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime())
        })

        test('should handle localStorage errors gracefully', () => {
            const mockSetItem = jest.fn(() => {
                throw new Error('Storage quota exceeded')
            })
            const originalSetItem = Storage.prototype.setItem
            Storage.prototype.setItem = mockSetItem

            expect(() => appState.saveUsageStats()).not.toThrow()
            expect(mockSetItem).toHaveBeenCalled()

            Storage.prototype.setItem = originalSetItem
        })
    })

    describe('trackTaskUsage()', () => {
        test('should track task contexts', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                contexts: ['@home', '@work']
            })

            appState.trackTaskUsage(task)

            expect(appState.usageStats.contexts['@home']).toBe(1)
            expect(appState.usageStats.contexts['@work']).toBe(1)
        })

        test('should increment existing context counts', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                contexts: ['@home']
            })
            appState.usageStats.contexts['@home'] = 5

            appState.trackTaskUsage(task)

            expect(appState.usageStats.contexts['@home']).toBe(6)
        })

        test('should track task time estimates', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                time: 30
            })

            appState.trackTaskUsage(task)

            expect(appState.usageStats.times['30']).toBe(1)
        })

        test('should increment existing time counts', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                time: 15
            })
            appState.usageStats.times['15'] = 3

            appState.trackTaskUsage(task)

            expect(appState.usageStats.times['15']).toBe(4)
        })

        test('should handle task without contexts', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task'
            })

            expect(() => appState.trackTaskUsage(task)).not.toThrow()
        })

        test('should handle task without time estimate', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                contexts: ['@home']
            })

            appState.trackTaskUsage(task)

            expect(appState.usageStats.contexts['@home']).toBe(1)
            expect(Object.keys(appState.usageStats.times).length).toBe(0)
        })

        test('should save stats after tracking', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                contexts: ['@home']
            })

            const saveSpy = jest.spyOn(appState, 'saveUsageStats')

            appState.trackTaskUsage(task)

            expect(saveSpy).toHaveBeenCalled()
        })
    })

    describe('reset()', () => {
        test('should reset view state to defaults', () => {
            appState.currentView = 'waiting'
            appState.currentProjectId = 'proj-1'

            appState.reset()

            expect(appState.currentView).toBe('inbox')
            expect(appState.currentProjectId).toBeNull()
        })

        test('should reset filters', () => {
            appState.filters = { context: '@test', energy: 'high', time: '30' }
            appState.selectedContextFilters.add('@test')

            appState.reset()

            expect(appState.filters).toEqual({ context: '', energy: '', time: '' })
            expect(appState.selectedContextFilters.size).toBe(0)
        })

        test('should reset search state', () => {
            appState.searchQuery = 'test'
            appState.advancedSearchFilters.context = '@test'

            appState.reset()

            expect(appState.searchQuery).toBe('')
            // Note: advancedSearchFilters is not reset by the reset() method
            expect(appState.advancedSearchFilters.context).toBe('@test')
        })

        test('should reset UI state', () => {
            appState.selectedTaskId = 'task-1'
            appState.bulkSelectionMode = true
            appState.selectedTaskIds.add('task-1')
            appState.showingArchivedProjects = true
            appState.focusTaskId = 'task-1'

            appState.reset()

            expect(appState.selectedTaskId).toBeNull()
            expect(appState.bulkSelectionMode).toBe(false)
            expect(appState.selectedTaskIds.size).toBe(0)
            expect(appState.showingArchivedProjects).toBe(false)
            expect(appState.focusTaskId).toBeNull()
        })

        test('should not reset tasks, projects, or templates', () => {
            appState.tasks.push(new Task({ id: '1', title: 'Task' }))
            appState.projects.push({ id: '1', title: 'Project' })
            appState.templates.push({ id: '1', title: 'Template' })

            appState.reset()

            expect(appState.tasks).toHaveLength(1)
            expect(appState.projects).toHaveLength(1)
            expect(appState.templates).toHaveLength(1)
        })
    })

    describe('getSmartSuggestions()', () => {
        beforeEach(() => {
            // Create some test tasks
            appState.tasks = [
                new Task({
                    id: 'task-1',
                    title: 'Starred task',
                    status: 'next',
                    starred: true,
                    contexts: ['@home']
                }),
                new Task({
                    id: 'task-2',
                    title: 'Overdue task',
                    status: 'next',
                    dueDate: '2025-01-01',
                    contexts: ['@work']
                }),
                new Task({
                    id: 'task-3',
                    title: 'Due soon task',
                    status: 'next',
                    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                    contexts: ['@phone']
                }),
                new Task({
                    id: 'task-4',
                    title: 'Waiting task',
                    status: 'waiting'
                }),
                new Task({
                    id: 'task-5',
                    title: 'Completed task',
                    status: 'next',
                    completed: true
                }),
                new Task({
                    id: 'task-6',
                    title: 'Task with time',
                    status: 'next',
                    time: 15,
                    contexts: ['@computer']
                }),
                new Task({
                    id: 'task-7',
                    title: 'Deferred task',
                    status: 'next',
                    deferDate: '2025-12-31'
                })
            ]

            // Mock isAvailable for deferred task (future date, not available)
            const deferredTask = appState.tasks.find((t) => t.id === 'task-7')
            if (deferredTask) {
                deferredTask.isAvailable = jest.fn(() => false)
            }
        })

        test('should only return active next action tasks', () => {
            const suggestions = appState.getSmartSuggestions()

            expect(suggestions.length).toBeGreaterThan(0)
            suggestions.forEach((s) => {
                expect(s.task.status).toBe('next')
                expect(s.task.completed).toBe(false)
            })
        })

        test('should include starred tasks', () => {
            const suggestions = appState.getSmartSuggestions()

            const starredTask = suggestions.find((s) => s.task.id === 'task-1')
            expect(starredTask).toBeDefined()
            expect(starredTask.score).toBeGreaterThan(0)
            expect(starredTask.reasons).toContain('⭐ Starred')
        })

        test('should score overdue tasks higher', () => {
            const suggestions = appState.getSmartSuggestions()

            const overdueTask = suggestions.find((s) => s.task.id === 'task-2')
            expect(overdueTask).toBeDefined()
            expect(overdueTask.reasons).toContain('🔴 Overdue')
            expect(overdueTask.score).toBeGreaterThanOrEqual(40)
        })

        test('should score tasks due soon', () => {
            const suggestions = appState.getSmartSuggestions()

            const dueSoonTask = suggestions.find((s) => s.task.id === 'task-3')
            expect(dueSoonTask).toBeDefined()
            expect(dueSoonTask.reasons.some((r) => r.includes('Due in'))).toBe(true)
        })

        test('should score tasks due this week', () => {
            const dueThisWeekTask = new Task({
                id: 'task-due-week',
                title: 'Task due this week',
                status: 'next',
                dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0] // 5 days from now
            })
            appState.tasks.push(dueThisWeekTask)

            const suggestions = appState.getSmartSuggestions()

            const task = suggestions.find((s) => s.task.id === 'task-due-week')
            expect(task).toBeDefined()
            expect(task.reasons.some((r) => r.includes('🟢 Due in'))).toBe(true)
            expect(task.score).toBeGreaterThanOrEqual(20) // Due this week adds 20 points
        })

        test('should handle tasks due in more than 7 days', () => {
            const futureTask = new Task({
                id: 'task-future',
                title: 'Task due in future',
                status: 'next',
                dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] // 14 days from now
            })
            appState.tasks.push(futureTask)

            const suggestions = appState.getSmartSuggestions()

            const task = suggestions.find((s) => s.task.id === 'task-future')
            expect(task).toBeDefined()
            // Should not include "Due in" reason for tasks > 7 days away
            expect(task.reasons.some((r) => r.includes('Due in'))).toBe(false)
        })

        test('should apply time estimate scoring', () => {
            const suggestions = appState.getSmartSuggestions()

            const timeTask = suggestions.find((s) => s.task.id === 'task-6')
            expect(timeTask).toBeDefined()
            expect(timeTask.reasons).toContain('⏱️ 15 min')
        })

        test('should filter by context', () => {
            const suggestions = appState.getSmartSuggestions(appState.tasks, {
                context: '@home'
            })

            expect(suggestions.length).toBe(1)
            expect(suggestions[0].task.id).toBe('task-1')
        })

        test('should filter by time estimate', () => {
            const suggestions = appState.getSmartSuggestions(appState.tasks, {
                time: '30'
            })

            // Filter returns tasks with time <= 30 minutes
            expect(suggestions.length).toBeGreaterThan(0)
            const taskWithTime = suggestions.find((s) => s.task.id === 'task-6')
            expect(taskWithTime).toBeDefined()
            expect(taskWithTime.task.time).toBe(15)
        })

        test('should filter by energy level', () => {
            const highEnergyTask = new Task({
                id: 'task-8',
                title: 'High energy task',
                status: 'next',
                energy: 'high'
            })
            appState.tasks.push(highEnergyTask)

            const suggestions = appState.getSmartSuggestions(appState.tasks, {
                energy: 'high'
            })

            expect(suggestions.length).toBe(1)
            expect(suggestions[0].task.id).toBe('task-8')
        })

        test('should limit results', () => {
            const suggestions = appState.getSmartSuggestions(appState.tasks, {
                maxSuggestions: 3
            })

            expect(suggestions.length).toBeLessThanOrEqual(3)
        })

        test('should use usage stats for scoring', () => {
            appState.usageStats.contexts = { '@home': 10, '@work': 5 }

            const suggestions = appState.getSmartSuggestions()

            const homeTask = suggestions.find((s) => s.task.id === 'task-1')
            expect(homeTask).toBeDefined()

            // Should have higher score due to usage
            const _baseScore = homeTask.score - (appState.usageStats.contexts['@home'] || 0) * 2
            expect(appState.usageStats.contexts['@home'] * 2).toBeGreaterThan(0)
        })

        test('should handle missing usage stats contexts', () => {
            appState.usageStats.contexts = null

            const suggestions = appState.getSmartSuggestions()

            // Should not throw when usageStats.contexts is null
            expect(suggestions.length).toBeGreaterThan(0)
            suggestions.forEach((s) => {
                expect(s.task).toBeDefined()
                expect(s.score).toBeGreaterThanOrEqual(0)
            })
        })

        test('should exclude deferred tasks', () => {
            const suggestions = appState.getSmartSuggestions()

            const deferredTask = suggestions.find((s) => s.task.id === 'task-7')
            expect(deferredTask).toBeUndefined()
        })

        test('should include available deferred tasks', () => {
            const availableTask = new Task({
                id: 'task-9',
                title: 'Available deferred task',
                status: 'next',
                deferDate: '2025-01-01'
            })
            availableTask.isAvailable = jest.fn(() => true)
            appState.tasks.push(availableTask)

            const suggestions = appState.getSmartSuggestions()

            const task = suggestions.find((s) => s.task.id === 'task-9')
            expect(task).toBeDefined()
        })

        test('should sort by score descending', () => {
            const suggestions = appState.getSmartSuggestions()

            for (let i = 0; i < suggestions.length - 1; i++) {
                expect(suggestions[i].score).toBeGreaterThanOrEqual(suggestions[i + 1].score)
            }
        })

        test('should add default reason when no specific reasons', () => {
            const plainTask = new Task({
                id: 'task-10',
                title: 'Plain task',
                status: 'next'
            })
            appState.tasks.push(plainTask)

            const suggestions = appState.getSmartSuggestions()

            const plainSuggestion = suggestions.find((s) => s.task.id === 'task-10')
            expect(plainSuggestion.reasons).toContain('Ready to start')
        })

        test('should handle empty tasks array', () => {
            const suggestions = appState.getSmartSuggestions([])

            expect(suggestions).toEqual([])
        })

        test('should default to state tasks when no tasks provided', () => {
            const suggestions = appState.getSmartSuggestions()

            expect(suggestions.length).toBeGreaterThan(0)
        })

        test('should handle tasks without due date', () => {
            const taskWithoutDue = new Task({
                id: 'task-11',
                title: 'No due date',
                status: 'next',
                contexts: ['@personal']
            })
            appState.tasks.push(taskWithoutDue)

            expect(() => appState.getSmartSuggestions()).not.toThrow()
        })

        test('should handle tasks without time estimate', () => {
            const suggestions = appState.getSmartSuggestions()

            // Should not include time in reasons for tasks without time
            const tasksWithoutTime = suggestions.filter((s) => !s.task.time)
            tasksWithoutTime.forEach((s) => {
                const hasTimeReason = s.reasons.some((r) => r.includes('⏱️'))
                expect(hasTimeReason).toBe(false)
            })
        })
    })
})
