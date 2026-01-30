/**
 * Comprehensive Tests for Dependencies Visualization Feature
 * Tests all Dependencies Visualization functionality before modularization
 */

import { GTDApp } from '../js/app.ts'
import { Task, Project } from '../js/models.ts'

describe('Dependencies Visualization Feature - Comprehensive Tests', () => {
    let app

    beforeEach(() => {
        localStorage.clear()

        // Create dependencies modal elements
        let modal = document.getElementById('dependencies-modal')
        if (!modal) {
            modal = document.createElement('div')
            modal.id = 'dependencies-modal'
            modal.className = 'modal'
            document.body.appendChild(modal)
        }

        // Always ensure deps-content exists
        let content = document.getElementById('deps-content')
        if (!content) {
            content = document.createElement('div')
            content.id = 'deps-content'
            modal.appendChild(content)
        }

        // Create buttons
        const buttons = [
            { id: 'btn-dependencies', clickHandler: null },
            { id: 'close-dependencies-modal', clickHandler: null },
            { id: 'deps-view-graph', clickHandler: null },
            { id: 'deps-view-chains', clickHandler: null },
            { id: 'deps-view-critical', clickHandler: null }
        ]

        buttons.forEach((btnConfig) => {
            let btn = document.getElementById(btnConfig.id)
            if (!btn) {
                btn = document.createElement('button')
                btn.id = btnConfig.id
                if (btnConfig.id.startsWith('deps-view')) {
                    btn.className = 'btn btn-secondary'
                }
                document.body.appendChild(btn)
            }
        })

        // Create project filter
        let filter = document.getElementById('deps-filter-project')
        if (!filter) {
            filter = document.createElement('select')
            filter.id = 'deps-filter-project'
            document.body.appendChild(filter)
        }

        // Create stats elements
        const statsIds = ['deps-total-tasks', 'deps-with-deps', 'deps-blocked', 'deps-ready']
        statsIds.forEach((id) => {
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
    })

    describe('setupDependenciesVisualization()', () => {
        test('should add click listener to dependencies button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('btn-dependencies'),
                'addEventListener'
            )

            app.setupDependenciesVisualization()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add click listener to close button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('close-dependencies-modal'),
                'addEventListener'
            )

            app.setupDependenciesVisualization()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add click listeners to view toggle buttons', () => {
            const graphBtnSpy = jest.spyOn(
                document.getElementById('deps-view-graph'),
                'addEventListener'
            )
            const chainsBtnSpy = jest.spyOn(
                document.getElementById('deps-view-chains'),
                'addEventListener'
            )
            const criticalBtnSpy = jest.spyOn(
                document.getElementById('deps-view-critical'),
                'addEventListener'
            )

            app.setupDependenciesVisualization()

            expect(graphBtnSpy).toHaveBeenCalledWith('click', expect.any(Function))
            expect(chainsBtnSpy).toHaveBeenCalledWith('click', expect.any(Function))
            expect(criticalBtnSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add change listener to project filter', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('deps-filter-project'),
                'addEventListener'
            )

            app.setupDependenciesVisualization()

            expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
        })

        test('should initialize current view to graph', () => {
            app.setupDependenciesVisualization()

            expect(app.dependencies.depsCurrentView).toBe('graph')
        })

        test('should handle missing buttons gracefully', () => {
            const btn = document.getElementById('btn-dependencies')
            const closeBtn = document.getElementById('close-dependencies-modal')

            btn.remove()
            closeBtn.remove()

            expect(() => app.setupDependenciesVisualization()).not.toThrow()
        })
    })

    describe('populateDepsProjectFilter()', () => {
        test('should populate filter with active projects', () => {
            const project1 = new Project({ id: 'proj-1', title: 'Project 1', status: 'active' })
            const project2 = new Project({ id: 'proj-2', title: 'Project 2', status: 'active' })
            const project3 = new Project({ id: 'proj-3', title: 'Project 3', status: 'someday' })
            app.projects.push(project1, project2, project3)

            app.populateDepsProjectFilter()

            const filter = document.getElementById('deps-filter-project')
            expect(filter.innerHTML).toContain('All Projects')
            expect(filter.innerHTML).toContain('Project 1')
            expect(filter.innerHTML).toContain('Project 2')
            expect(filter.innerHTML).not.toContain('Project 3')
        })

        test('should handle missing filter gracefully', () => {
            const filter = document.getElementById('deps-filter-project')
            filter.remove()

            expect(() => app.populateDepsProjectFilter()).not.toThrow()
        })

        test('should handle empty projects list', () => {
            app.populateDepsProjectFilter()

            const filter = document.getElementById('deps-filter-project')
            expect(filter.innerHTML).toContain('All Projects')
        })
    })

    describe('openDependenciesModal()', () => {
        test('should display dependencies modal', () => {
            app.openDependenciesModal()

            const modal = document.getElementById('dependencies-modal')
            expect(modal.classList.contains('active')).toBe(true)
        })

        test('should populate project filter', () => {
            const populateSpy = jest.spyOn(app.dependencies, 'populateDepsProjectFilter')

            app.openDependenciesModal()

            expect(populateSpy).toHaveBeenCalled()
        })

        test('should render dependencies view', () => {
            const renderSpy = jest.spyOn(app.dependencies, 'renderDependenciesView')

            app.openDependenciesModal()

            expect(renderSpy).toHaveBeenCalled()
        })

        test('should handle missing modal gracefully', () => {
            const modal = document.getElementById('dependencies-modal')
            modal.remove()

            expect(() => app.openDependenciesModal()).not.toThrow()
        })
    })

    describe('closeDependenciesModal()', () => {
        test('should hide dependencies modal', () => {
            const modal = document.getElementById('dependencies-modal')
            modal.classList.add('active')

            app.closeDependenciesModal()

            expect(modal.classList.contains('active')).toBe(false)
        })

        test('should handle missing modal gracefully', () => {
            const modal = document.getElementById('dependencies-modal')
            modal.remove()

            expect(() => app.closeDependenciesModal()).not.toThrow()
        })
    })

    describe('updateDepsViewButtons()', () => {
        beforeEach(() => {
            // Set initial button classes
            document.getElementById('deps-view-graph').className = 'btn btn-secondary'
            document.getElementById('deps-view-chains').className = 'btn btn-secondary'
            document.getElementById('deps-view-critical').className = 'btn btn-secondary'
        })

        test('should update button classes for graph view', () => {
            app.dependencies.depsCurrentView = 'graph'
            app.updateDepsViewButtons()

            expect(
                document.getElementById('deps-view-graph').classList.contains('btn-primary')
            ).toBe(true)
            expect(
                document.getElementById('deps-view-chains').classList.contains('btn-secondary')
            ).toBe(true)
            expect(
                document.getElementById('deps-view-critical').classList.contains('btn-secondary')
            ).toBe(true)
        })

        test('should update button classes for chains view', () => {
            app.dependencies.depsCurrentView = 'chains'
            app.updateDepsViewButtons()

            expect(
                document.getElementById('deps-view-graph').classList.contains('btn-secondary')
            ).toBe(true)
            expect(
                document.getElementById('deps-view-chains').classList.contains('btn-primary')
            ).toBe(true)
            expect(
                document.getElementById('deps-view-critical').classList.contains('btn-secondary')
            ).toBe(true)
        })

        test('should update button classes for critical view', () => {
            app.dependencies.depsCurrentView = 'critical'
            app.updateDepsViewButtons()

            expect(
                document.getElementById('deps-view-graph').classList.contains('btn-secondary')
            ).toBe(true)
            expect(
                document.getElementById('deps-view-chains').classList.contains('btn-secondary')
            ).toBe(true)
            expect(
                document.getElementById('deps-view-critical').classList.contains('btn-primary')
            ).toBe(true)
        })

        test('should handle missing buttons gracefully', () => {
            app.depsCurrentView = 'graph'

            const graphBtn = document.getElementById('deps-view-graph')
            graphBtn.remove()

            expect(() => app.updateDepsViewButtons()).not.toThrow()
        })
    })

    describe('getDependenciesTasks()', () => {
        test('should filter out completed tasks', () => {
            const task1 = new Task({ id: 'task-1', title: 'Active task', completed: false })
            const task2 = new Task({ id: 'task-2', title: 'Completed task', completed: true })
            app.tasks.push(task1, task2)

            const result = app.getDependenciesTasks(null)

            expect(result.length).toBe(1)
            expect(result[0].id).toBe('task-1')
        })

        test('should filter by project when projectId provided', () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Task 1',
                projectId: 'proj-1',
                completed: false
            })
            const task2 = new Task({
                id: 'task-2',
                title: 'Task 2',
                projectId: 'proj-2',
                completed: false
            })
            app.tasks.push(task1, task2)

            const result = app.getDependenciesTasks('proj-1')

            expect(result.length).toBe(1)
            expect(result[0].id).toBe('task-1')
        })

        test('should return all incomplete tasks when no projectId', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', completed: false })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', completed: false })
            app.tasks.push(task1, task2)

            const result = app.getDependenciesTasks(null)

            expect(result.length).toBe(2)
        })
    })

    describe('updateDepsStats()', () => {
        test('should update statistics correctly', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', completed: false })
            const task2 = new Task({
                id: 'task-2',
                title: 'Task 2',
                completed: false,
                waitingForTaskIds: ['task-1']
            })
            const task3 = new Task({
                id: 'task-3',
                title: 'Task 3',
                completed: false,
                waitingForTaskIds: ['task-1']
            })
            app.tasks.push(task1, task2, task3)

            app.updateDepsStats(app.tasks)

            expect(document.getElementById('deps-total-tasks').textContent).toBe('3')
            expect(document.getElementById('deps-with-deps').textContent).toBe('2')
            expect(document.getElementById('deps-blocked').textContent).toBe('2')
            expect(document.getElementById('deps-ready').textContent).toBe('1')
        })

        test('should handle tasks with no dependencies', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', completed: false })
            app.tasks.push(task1)

            app.updateDepsStats(app.tasks)

            expect(document.getElementById('deps-total-tasks').textContent).toBe('1')
            expect(document.getElementById('deps-with-deps').textContent).toBe('0')
            expect(document.getElementById('deps-blocked').textContent).toBe('0')
            expect(document.getElementById('deps-ready').textContent).toBe('1')
        })
    })

    describe('calculateTaskLevel()', () => {
        test('should return 0 for tasks with no dependencies', () => {
            const task = new Task({ id: 'task-1', title: 'Task 1' })

            const level = app.calculateTaskLevel(task, [])

            expect(level).toBe(0)
        })

        test('should calculate level for dependent tasks', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1' })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', waitingForTaskIds: ['task-1'] })
            const task3 = new Task({ id: 'task-3', title: 'Task 3', waitingForTaskIds: ['task-2'] })

            const level1 = app.calculateTaskLevel(task1, [task1, task2, task3])
            const level2 = app.calculateTaskLevel(task2, [task1, task2, task3])
            const level3 = app.calculateTaskLevel(task3, [task1, task2, task3])

            expect(level1).toBe(0)
            expect(level2).toBe(1)
            expect(level3).toBe(2)
        })

        test('should handle missing dependencies', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task 1',
                waitingForTaskIds: ['non-existent']
            })

            const level = app.calculateTaskLevel(task, [])

            expect(level).toBe(0)
        })
    })

    describe('buildDependencyChains()', () => {
        test('should build chains from dependencies', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', completed: true })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', waitingForTaskIds: ['task-1'] })
            const task3 = new Task({ id: 'task-3', title: 'Task 3', waitingForTaskIds: ['task-2'] })
            app.tasks.push(task1, task2, task3)

            const chains = app.buildDependencyChains(app.tasks)

            expect(chains.length).toBeGreaterThan(0)
            expect(chains[0]).toContainEqual(task1)
            expect(chains[0]).toContainEqual(task2)
            expect(chains[0]).toContainEqual(task3)
        })

        test('should return empty array when no dependencies', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1' })
            const task2 = new Task({ id: 'task-2', title: 'Task 2' })
            app.tasks.push(task1, task2)

            const chains = app.buildDependencyChains(app.tasks)

            expect(chains.length).toBe(0)
        })

        test('should sort chains by length', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', completed: true })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', waitingForTaskIds: ['task-1'] })
            const task3 = new Task({ id: 'task-3', title: 'Task 3', waitingForTaskIds: ['task-2'] })
            const task4 = new Task({ id: 'task-4', title: 'Task 4' })
            app.tasks.push(task1, task2, task3, task4)

            const chains = app.buildDependencyChains(app.tasks)

            expect(chains[0].length).toBeGreaterThanOrEqual(chains[chains.length - 1].length)
        })
    })

    describe('calculateCriticalPath()', () => {
        test('should calculate critical path', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', completed: true })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', waitingForTaskIds: ['task-1'] })
            const task3 = new Task({ id: 'task-3', title: 'Task 3', waitingForTaskIds: ['task-2'] })
            app.tasks.push(task1, task2, task3)

            const path = app.calculateCriticalPath(app.tasks)

            expect(path.length).toBe(3)
            expect(path[0].id).toBe('task-1')
            expect(path[1].id).toBe('task-2')
            expect(path[2].id).toBe('task-3')
        })

        test('should return empty array when no dependencies', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1' })
            const task2 = new Task({ id: 'task-2', title: 'Task 2' })
            app.tasks.push(task1, task2)

            const path = app.calculateCriticalPath(app.tasks)

            expect(path.length).toBe(0)
        })

        test('should return the longest path when multiple paths exist', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', completed: true })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', waitingForTaskIds: ['task-1'] })
            const task3 = new Task({ id: 'task-3', title: 'Task 3', waitingForTaskIds: ['task-2'] })
            const task4 = new Task({ id: 'task-4', title: 'Task 4', waitingForTaskIds: ['task-1'] })
            app.tasks.push(task1, task2, task3, task4)

            const path = app.calculateCriticalPath(app.tasks)

            expect(path.length).toBe(3)
        })
    })

    describe('renderDependenciesView()', () => {
        test('should render graph view by default', () => {
            app.dependencies.depsCurrentView = 'graph'
            jest.spyOn(app.dependencies, 'getDependenciesTasks').mockReturnValue([])
            jest.spyOn(app.dependencies, 'updateDepsStats')

            app.renderDependenciesView()

            expect(app.dependencies.updateDepsStats).toHaveBeenCalled()
        })

        test('should switch to chains view', () => {
            app.dependencies.depsCurrentView = 'chains'
            jest.spyOn(app.dependencies, 'getDependenciesTasks').mockReturnValue([])
            jest.spyOn(app.dependencies, 'updateDepsStats')
            const renderChainsSpy = jest.spyOn(app.dependencies, 'renderDependencyChains')

            app.renderDependenciesView()

            expect(renderChainsSpy).toHaveBeenCalled()
        })

        test('should switch to critical view', () => {
            app.dependencies.depsCurrentView = 'critical'
            jest.spyOn(app.dependencies, 'getDependenciesTasks').mockReturnValue([])
            jest.spyOn(app.dependencies, 'updateDepsStats')
            const renderCriticalSpy = jest.spyOn(app.dependencies, 'renderCriticalPath')

            app.renderDependenciesView()

            expect(renderCriticalSpy).toHaveBeenCalled()
        })

        test('should handle missing container gracefully', () => {
            const container = document.getElementById('deps-content')
            container.remove()

            expect(() => app.renderDependenciesView()).not.toThrow()
        })
    })

    describe('renderDependencyGraph()', () => {
        test('should render empty state when no tasks with dependencies', () => {
            const container = document.getElementById('deps-content')

            app.renderDependencyGraph([], container)

            expect(container.innerHTML).toContain('No Dependencies Found')
        })

        test('should render graph with nodes', () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Task 1',
                waitingForTaskIds: []
            })
            const task2 = new Task({
                id: 'task-2',
                title: 'Task 2',
                waitingForTaskIds: ['task-1']
            })

            const container = document.getElementById('deps-content')

            app.renderDependencyGraph([task2], container)

            expect(container.innerHTML).toContain('dependency-graph')
        })

        test('should handle empty tasks array', () => {
            const container = document.getElementById('deps-content')

            app.renderDependencyGraph([], container)

            expect(container.innerHTML).toContain('No Dependencies Found')
        })
    })

    describe('renderDependencyChains()', () => {
        test('should render empty state when no chains', () => {
            const container = document.getElementById('deps-content')

            app.renderDependencyChains([], container)

            expect(container.innerHTML).toContain('No Dependency Chains Found')
        })

        test('should render chains', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', completed: true })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', waitingForTaskIds: ['task-1'] })

            const container = document.getElementById('deps-content')

            app.renderDependencyChains([task1, task2], container)

            expect(container.innerHTML).toContain('dependency-chains')
        })
    })

    describe('renderCriticalPath()', () => {
        test('should render empty state when no critical path', () => {
            const container = document.getElementById('deps-content')

            app.renderCriticalPath([], container)

            expect(container.innerHTML).toContain('No Critical Path Found')
        })

        test('should render critical path', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', completed: true })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', waitingForTaskIds: ['task-1'] })

            const container = document.getElementById('deps-content')

            app.renderCriticalPath([task1, task2], container)

            expect(container.innerHTML).toContain('critical-path')
        })
    })

    describe('Integration: View switching', () => {
        test('should switch views when buttons clicked', () => {
            app.setupDependenciesVisualization()

            const graphBtn = document.getElementById('deps-view-graph')
            const chainsBtn = document.getElementById('deps-view-chains')
            const criticalBtn = document.getElementById('deps-view-critical')

            // Mock renderDependenciesView
            jest.spyOn(app.dependencies, 'renderDependenciesView')

            // Click chains button
            chainsBtn.click()
            expect(app.dependencies.depsCurrentView).toBe('chains')

            // Click critical button
            criticalBtn.click()
            expect(app.dependencies.depsCurrentView).toBe('critical')

            // Click graph button
            graphBtn.click()
            expect(app.dependencies.depsCurrentView).toBe('graph')
        })
    })

    describe('Edge Cases', () => {
        test('should handle circular dependencies gracefully', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', waitingForTaskIds: ['task-2'] })
            const task2 = new Task({ id: 'task-2', title: 'Task 2', waitingForTaskIds: ['task-1'] })
            app.tasks.push(task1, task2)

            // buildDependencyChains should handle cycles gracefully (uses visited set)
            expect(() => app.buildDependencyChains(app.tasks)).not.toThrow()
        })

        test('should handle self-referencing dependencies', () => {
            const task1 = new Task({ id: 'task-1', title: 'Task 1', waitingForTaskIds: ['task-1'] })
            app.tasks.push(task1)

            // buildDependencyChains should handle self-referencing gracefully
            expect(() => app.buildDependencyChains(app.tasks)).not.toThrow()
        })

        test('should handle missing dependency tasks', () => {
            const task1 = new Task({
                id: 'task-1',
                title: 'Task 1',
                waitingForTaskIds: ['missing-task']
            })
            app.tasks.push(task1)

            const level = app.calculateTaskLevel(task1, app.tasks)

            expect(level).toBe(0)
        })

        test('should handle very deep dependency chains', () => {
            const tasks = []
            for (let i = 0; i < 20; i++) {
                const waitingFor = i > 0 ? [tasks[i - 1].id] : []
                const task = new Task({
                    id: `task-${i}`,
                    title: `Task ${i}`,
                    waitingForTaskIds: waitingFor
                })
                tasks.push(task)
            }
            app.tasks = tasks

            expect(() => app.calculateTaskLevel(tasks[19], app.tasks)).not.toThrow()
        })
    })
})
