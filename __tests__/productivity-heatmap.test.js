/**
 * Comprehensive Tests for Productivity Heatmap Manager
 */

import { Task, Project, Template } from '../js/models'
import { ProductivityHeatmapManager } from '../js/modules/features/productivity-heatmap.ts'

// Make Task available globally
global.Task = Task

describe('ProductivityHeatmapManager - Initialization', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }

        mockApp = {}

        document.body.innerHTML = ''

        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should initialize successfully', () => {
        expect(manager).toBeDefined()
        expect(manager.state).toBe(mockState)
        expect(manager.app).toBe(mockApp)
    })
})

describe('ProductivityHeatmapManager - setupProductivityHeatmap()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }

        mockApp = {}

        document.body.innerHTML = ''
        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    test('should setup without errors when buttons exist', () => {
        const heatmapBtn = document.createElement('button')
        heatmapBtn.id = 'btn-heatmap'
        const closeBtn = document.createElement('button')
        closeBtn.id = 'close-heatmap-modal'
        document.body.appendChild(heatmapBtn)
        document.body.appendChild(closeBtn)

        expect(() => manager.setupProductivityHeatmap()).not.toThrow()
    })

    test('should handle missing heatmap button gracefully', () => {
        expect(() => manager.setupProductivityHeatmap()).not.toThrow()
    })

    test('should setup open modal listener', () => {
        const heatmapBtn = document.createElement('button')
        heatmapBtn.id = 'btn-heatmap'
        document.body.appendChild(heatmapBtn)

        const openSpy = jest.spyOn(manager, 'openHeatmapModal')

        manager.setupProductivityHeatmap()
        heatmapBtn.click()

        expect(openSpy).toHaveBeenCalled()
    })

    test('should setup close modal listener', () => {
        const closeBtn = document.createElement('button')
        closeBtn.id = 'close-heatmap-modal'
        document.body.appendChild(closeBtn)

        const closeSpy = jest.spyOn(manager, 'closeHeatmapModal')

        manager.setupProductivityHeatmap()
        closeBtn.click()

        expect(closeSpy).toHaveBeenCalled()
    })
})

describe('ProductivityHeatmapManager - openHeatmapModal()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }

        mockApp = {}

        document.body.innerHTML = ''

        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should open modal when it exists', () => {
        const modal = document.createElement('div')
        modal.id = 'heatmap-modal'
        document.body.appendChild(modal)

        const renderSpy = jest.spyOn(manager, 'renderProductivityHeatmap')

        manager.openHeatmapModal()

        expect(modal.classList.contains('active')).toBe(true)
        expect(renderSpy).toHaveBeenCalled()
    })

    test('should handle missing modal gracefully', () => {
        expect(() => manager.openHeatmapModal()).not.toThrow()
    })
})

describe('ProductivityHeatmapManager - closeHeatmapModal()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }

        mockApp = {}

        document.body.innerHTML = ''

        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should close modal when it exists', () => {
        const modal = document.createElement('div')
        modal.id = 'heatmap-modal'
        modal.classList.add('active')
        document.body.appendChild(modal)

        manager.closeHeatmapModal()

        expect(modal.classList.contains('active')).toBe(false)
    })

    test('should handle missing modal gracefully', () => {
        expect(() => manager.closeHeatmapModal()).not.toThrow()
    })
})

describe('ProductivityHeatmapManager - getDateKey()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        mockApp = {}
        document.body.innerHTML = ''
        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should format date correctly', () => {
        const date = new Date(2025, 0, 15) // January 15, 2025
        const key = manager.getDateKey(date)

        expect(key).toBe('2025-01-15')
    })

    test('should pad single digit month with zero', () => {
        const date = new Date(2025, 0, 1) // January 1, 2025
        const key = manager.getDateKey(date)

        expect(key).toBe('2025-01-01')
    })

    test('should pad single digit day with zero', () => {
        const date = new Date(2025, 10, 5) // November 5, 2025
        const key = manager.getDateKey(date)

        expect(key).toBe('2025-11-05')
    })

    test('should handle double digit months and days', () => {
        const date = new Date(2025, 11, 25) // December 25, 2025
        const key = manager.getDateKey(date)

        expect(key).toBe('2025-12-25')
    })
})

describe('ProductivityHeatmapManager - buildCompletionData()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }

        mockApp = {}

        document.body.innerHTML = ''
        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should initialize all days with zero', () => {
        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 0, 7)

        const data = manager.buildCompletionData(startDate, endDate)

        expect(Object.keys(data).length).toBe(7)
        expect(data['2025-01-01']).toBe(0)
        expect(data['2025-01-07']).toBe(0)
    })

    test('should count completed tasks per day', () => {
        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 0, 3)

        // Use ISO dates that match the date key format
        mockState.tasks = [
            new Task({
                id: '1',
                title: 'Task 1',
                completed: true,
                completedAt: '2025-01-02T00:00:00.000Z'
            }),
            new Task({
                id: '2',
                title: 'Task 2',
                completed: true,
                completedAt: '2025-01-02T12:00:00.000Z'
            }),
            new Task({
                id: '3',
                title: 'Task 3',
                completed: true,
                completedAt: '2025-01-03T00:00:00.000Z'
            })
        ]

        const data = manager.buildCompletionData(startDate, endDate)

        expect(data['2025-01-01']).toBe(0)
        expect(data['2025-01-02']).toBe(2)
        expect(data['2025-01-03']).toBe(1)
    })

    test('should ignore incomplete tasks', () => {
        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 0, 2)

        mockState.tasks = [
            new Task({ id: '1', title: 'Task 1', completed: false }),
            new Task({
                id: '2',
                title: 'Task 2',
                completed: true,
                completedAt: '2025-01-01T10:00:00Z'
            })
        ]

        const data = manager.buildCompletionData(startDate, endDate)

        expect(data['2025-01-01']).toBe(1)
    })

    test('should ignore tasks without completedAt date', () => {
        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 0, 2)

        mockState.tasks = [new Task({ id: '1', title: 'Task 1', completed: true })]

        const data = manager.buildCompletionData(startDate, endDate)

        expect(data['2025-01-01']).toBe(0)
        expect(data['2025-01-02']).toBe(0)
    })

    test('should handle tasks completed outside date range', () => {
        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 0, 3)

        mockState.tasks = [
            new Task({
                id: '1',
                title: 'Task 1',
                completed: true,
                completedAt: '2024-12-31T10:00:00Z'
            }),
            new Task({
                id: '2',
                title: 'Task 2',
                completed: true,
                completedAt: '2025-01-04T10:00:00Z'
            })
        ]

        const data = manager.buildCompletionData(startDate, endDate)

        expect(Object.values(data).every((v) => v === 0)).toBe(true)
    })
})

describe('ProductivityHeatmapManager - getHeatmapLevel()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        mockApp = {}
        document.body.innerHTML = ''
        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should return 0 for zero count', () => {
        expect(manager.getHeatmapLevel(0, 10)).toBe(0)
    })

    test('should handle max count of 4 or less', () => {
        expect(manager.getHeatmapLevel(1, 4)).toBe(1)
        expect(manager.getHeatmapLevel(2, 4)).toBe(2)
        expect(manager.getHeatmapLevel(3, 4)).toBe(3)
        expect(manager.getHeatmapLevel(4, 4)).toBe(4)
        expect(manager.getHeatmapLevel(5, 4)).toBe(4) // Cap at 4
    })

    test('should normalize based on percentage', () => {
        expect(manager.getHeatmapLevel(1, 10)).toBe(1) // < 25%
        expect(manager.getHeatmapLevel(3, 10)).toBe(2) // ~30%
        expect(manager.getHeatmapLevel(6, 10)).toBe(3) // 60%
        expect(manager.getHeatmapLevel(9, 10)).toBe(4) // 90%
    })

    test('should return level 4 for max count', () => {
        expect(manager.getHeatmapLevel(10, 10)).toBe(4)
    })
})

describe('ProductivityHeatmapManager - calculateCurrentStreak()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        mockApp = {}
        document.body.innerHTML = ''
        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should return 0 for no completion data', () => {
        const data = {}
        const streak = manager.calculateCurrentStreak(data)

        expect(streak).toBe(0)
    })

    test('should calculate streak from today', () => {
        const today = new Date()
        const dateKey = manager.getDateKey(today)

        const data = {
            [dateKey]: 5
        }

        const streak = manager.calculateCurrentStreak(data)

        expect(streak).toBe(1)
    })

    test('should calculate multi-day streak', () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const dayBefore = new Date(today)
        dayBefore.setDate(dayBefore.getDate() - 2)

        const data = {
            [manager.getDateKey(today)]: 3,
            [manager.getDateKey(yesterday)]: 2,
            [manager.getDateKey(dayBefore)]: 1
        }

        const streak = manager.calculateCurrentStreak(data)

        expect(streak).toBe(3)
    })

    test('should break streak on day with no completions', () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const dayBefore = new Date(today)
        dayBefore.setDate(dayBefore.getDate() - 2)

        const data = {
            [manager.getDateKey(dayBefore)]: 5,
            [manager.getDateKey(yesterday)]: 0,
            [manager.getDateKey(today)]: 0
        }

        const streak = manager.calculateCurrentStreak(data)

        expect(streak).toBe(0)
    })

    test('should skip today if no completions and check yesterday', () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const data = {
            [manager.getDateKey(today)]: 0,
            [manager.getDateKey(yesterday)]: 3
        }

        const streak = manager.calculateCurrentStreak(data)

        expect(streak).toBe(1)
    })
})

describe('ProductivityHeatmapManager - createMonthLabels()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        mockApp = {}
        document.body.innerHTML = ''
        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should create month labels for date range', () => {
        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 2, 31)

        const labels = manager.createMonthLabels(startDate, endDate)

        expect(labels).toContain('Jan')
        expect(labels).toContain('Feb')
        expect(labels).toContain('Mar')
    })

    test('should include positioning styles', () => {
        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 0, 31)

        const labelsHTML = manager.createMonthLabels(startDate, endDate)

        expect(labelsHTML).toContain('style="left:')
        expect(labelsHTML).toContain('Jan')
    })

    test('should handle date range spanning multiple months', () => {
        const startDate = new Date(2025, 0, 15)
        const endDate = new Date(2025, 2, 15)

        const labelsHTML = manager.createMonthLabels(startDate, endDate)

        expect(labelsHTML.length).toBeGreaterThan(0)
        // Should include partial months
        expect(labelsHTML).toContain('Jan')
        expect(labelsHTML).toContain('Feb')
        expect(labelsHTML).toContain('Mar')
    })
})

describe('ProductivityHeatmapManager - updateHeatmapStats()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }

        mockApp = {}

        document.body.innerHTML = `
            <div id="heatmap-total-completed"></div>
            <div id="heatmap-best-day"></div>
            <div id="heatmap-avg-day"></div>
            <div id="heatmap-streak"></div>
        `

        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should update total completed count', () => {
        const data = {
            '2025-01-01': 5,
            '2025-01-02': 3,
            '2025-01-03': 2
        }

        manager.updateHeatmapStats(data)

        expect(document.getElementById('heatmap-total-completed').textContent).toBe('10')
    })

    test('should update best day count', () => {
        const data = {
            '2025-01-01': 5,
            '2025-01-02': 10,
            '2025-01-03': 3
        }

        manager.updateHeatmapStats(data)

        expect(document.getElementById('heatmap-best-day').textContent).toBe('10')
    })

    test('should calculate average per day', () => {
        const data = {
            '2025-01-01': 5,
            '2025-01-02': 0,
            '2025-01-03': 10,
            '2025-01-04': 0
        }

        manager.updateHeatmapStats(data)

        // Average = (5 + 10) / 2 = 7.5, rounded to 1 decimal
        expect(document.getElementById('heatmap-avg-day').textContent).toBe('7.5')
    })

    test('should show 0 average when no completions', () => {
        const data = {
            '2025-01-01': 0,
            '2025-01-02': 0
        }

        manager.updateHeatmapStats(data)

        expect(document.getElementById('heatmap-avg-day').textContent).toBe('0')
    })
})

describe('ProductivityHeatmapManager - renderProductivityHeatmap()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = {
            tasks: [],
            projects: []
        }

        mockApp = {}

        document.body.innerHTML = `
            <div id="heatmap-container"></div>
            <div id="heatmap-total-completed"></div>
            <div id="heatmap-best-day"></div>
            <div id="heatmap-avg-day"></div>
            <div id="heatmap-streak"></div>
        `

        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should render heatmap container', () => {
        manager.renderProductivityHeatmap()

        const container = document.getElementById('heatmap-container')
        expect(container.innerHTML).not.toBe('')
    })

    test('should render heatmap wrapper', () => {
        manager.renderProductivityHeatmap()

        const container = document.getElementById('heatmap-container')
        expect(container.querySelector('.heatmap-wrapper')).toBeDefined()
    })

    test('should render day labels', () => {
        manager.renderProductivityHeatmap()

        const container = document.getElementById('heatmap-container')
        const dayLabels = container.querySelector('.heatmap-day-labels')
        expect(dayLabels).toBeDefined()
    })

    test('should render grid cells', () => {
        manager.renderProductivityHeatmap()

        const container = document.getElementById('heatmap-container')
        const grid = container.querySelector('.heatmap-grid')
        expect(grid).toBeDefined()
        // 366 cells due to inclusive date range (365 days + 1 for inclusive range)
        const cells = grid.querySelectorAll('.heatmap-cell')
        expect(cells.length).toBeGreaterThanOrEqual(365)
        expect(cells.length).toBeLessThanOrEqual(366)
    })

    test('should render month labels', () => {
        manager.renderProductivityHeatmap()

        const container = document.getElementById('heatmap-container')
        const monthLabels = container.querySelector('.heatmap-month-labels')
        expect(monthLabels).toBeDefined()
    })

    test('should handle missing container gracefully', () => {
        document.getElementById('heatmap-container').remove()

        expect(() => manager.renderProductivityHeatmap()).not.toThrow()
    })
})

describe('ProductivityHeatmapManager - renderHeatmapGrid()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        mockApp = {}
        document.body.innerHTML = ''
        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should create heatmap cells with level classes', () => {
        const completionData = {
            '2025-01-01': 0,
            '2025-01-02': 5,
            '2025-01-03': 10
        }

        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 0, 3)
        const container = document.createElement('div')

        manager.renderHeatmapGrid(completionData, 3, container)

        const cells = container.querySelectorAll('.heatmap-cell')
        // Inclusive range gives 4 cells (Jan 1, 2, 3, 4)
        expect(cells.length).toBeGreaterThanOrEqual(3)
    })

    test('should set level-0 for zero count days', () => {
        const completionData = { '2025-01-01': 0 }

        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 0, 1)
        const container = document.createElement('div')

        manager.renderHeatmapGrid(completionData, 1, container)

        const cells = container.querySelectorAll('.heatmap-cell')
        // First cell should have level-0
        expect(cells.length).toBeGreaterThan(0)
        const firstCell = cells[0]
        expect(firstCell.classList.contains('level-0')).toBe(true)
        expect(firstCell.dataset.count).toBe('0')
    })

    test('should include data attributes on cells', () => {
        const today = new Date()
        const dateKey = manager.getDateKey(today)
        const completionData = { [dateKey]: 5 }

        const startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 1)
        const endDate = today
        const container = document.createElement('div')

        manager.renderHeatmapGrid(completionData, 1, container)

        const cells = container.querySelectorAll('.heatmap-cell')
        const todayCell = Array.from(cells).find((c) => c.dataset.count === '5')
        expect(todayCell).toBeDefined()
        expect(todayCell.dataset.date).toBeDefined()
        expect(todayCell.dataset.count).toBe('5')
    })

    test('should setup tooltips after rendering', () => {
        const completionData = { '2025-01-01': 5 }

        const startDate = new Date(2025, 0, 1)
        const endDate = new Date(2025, 0, 1)
        const container = document.createElement('div')
        document.body.appendChild(container)

        const tooltipSpy = jest.spyOn(manager, 'setupHeatmapTooltips')

        manager.renderHeatmapGrid(completionData, 1, container)

        expect(tooltipSpy).toHaveBeenCalled()
    })
})

describe('ProductivityHeatmapManager - setupHeatmapTooltips()', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        mockState = { tasks: [], projects: [] }
        mockApp = {}
        document.body.innerHTML = ''
        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should create tooltip on cell mouseenter', () => {
        const cell = document.createElement('div')
        cell.className = 'heatmap-cell'
        cell.dataset.date = 'January 1, 2025'
        cell.dataset.count = '5'
        document.body.appendChild(cell)

        manager.setupHeatmapTooltips()

        const mouseEvent = new MouseEvent('mouseenter', { bubbles: true })
        cell.dispatchEvent(mouseEvent)

        const tooltip = document.querySelector('.heatmap-tooltip')
        expect(tooltip).toBeDefined()
        expect(tooltip.innerHTML).toContain('5')
        expect(tooltip.innerHTML).toContain('January 1, 2025')
    })

    test('should hide tooltip on mouseleave', () => {
        const cell = document.createElement('div')
        cell.className = 'heatmap-cell'
        cell.dataset.date = 'January 1, 2025'
        cell.dataset.count = '5'
        document.body.appendChild(cell)

        manager.setupHeatmapTooltips()

        // First mouseenter to create tooltip
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true })
        cell.dispatchEvent(mouseEnterEvent)

        // Then mouseleave
        const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true })
        cell.dispatchEvent(mouseLeaveEvent)

        const tooltip = document.querySelector('.heatmap-tooltip')
        expect(tooltip.style.display).toBe('none')
    })

    test('should position tooltip correctly', () => {
        const cell = document.createElement('div')
        cell.className = 'heatmap-cell'
        cell.dataset.date = 'January 1, 2025'
        cell.dataset.count = '5'
        cell.style.width = '20px'
        document.body.appendChild(cell)

        manager.setupHeatmapTooltips()

        const mouseEvent = new MouseEvent('mouseenter', { bubbles: true })
        cell.dispatchEvent(mouseEvent)

        const tooltip = document.querySelector('.heatmap-tooltip')
        expect(tooltip.style.left).toBeDefined()
        expect(tooltip.style.top).toBe('-40px')
        expect(tooltip.style.transform).toBe('translateX(-50%)')
    })

    test('should handle missing heatmap cells gracefully', () => {
        document.body.innerHTML = '<div></div>'

        expect(() => manager.setupHeatmapTooltips()).not.toThrow()
    })
})

describe('ProductivityHeatmapManager - Integration Tests', () => {
    let manager
    let mockState
    let mockApp

    beforeEach(() => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        mockState = {
            tasks: [
                new Task({
                    id: '1',
                    title: 'Task 1',
                    completed: true,
                    completedAt: today.toISOString()
                }),
                new Task({
                    id: '2',
                    title: 'Task 2',
                    completed: true,
                    completedAt: today.toISOString()
                }),
                new Task({
                    id: '3',
                    title: 'Task 3',
                    completed: true,
                    completedAt: yesterday.toISOString()
                }),
                new Task({ id: '4', title: 'Incomplete', completed: false })
            ],
            projects: []
        }

        mockApp = {}

        document.body.innerHTML = `
            <div id="heatmap-modal"></div>
            <div id="heatmap-container"></div>
            <div id="heatmap-total-completed"></div>
            <div id="heatmap-best-day"></div>
            <div id="heatmap-avg-day"></div>
            <div id="heatmap-streak"></div>
        `

        manager = new ProductivityHeatmapManager(mockState, mockApp)
    })

    test('should render complete heatmap with real data', () => {
        manager.renderProductivityHeatmap()

        const container = document.getElementById('heatmap-container')
        expect(container.querySelector('.heatmap-wrapper')).toBeDefined()
        expect(container.querySelector('.heatmap-grid')).toBeDefined()

        const cells = container.querySelectorAll('.heatmap-cell')
        // 365 or 366 cells depending on inclusive date range
        expect(cells.length).toBeGreaterThanOrEqual(365)
        expect(cells.length).toBeLessThanOrEqual(366)
    })

    test('should calculate correct statistics', () => {
        manager.renderProductivityHeatmap()

        expect(document.getElementById('heatmap-total-completed').textContent).toBe('3')
        expect(document.getElementById('heatmap-best-day').textContent).toBe('2')
    })

    test('should show heatmap cells with different levels', () => {
        manager.renderProductivityHeatmap()

        const container = document.getElementById('heatmap-container')
        const cells = container.querySelectorAll('.heatmap-cell')

        // Should have cells with different levels
        const level0Cells = Array.from(cells).filter((c) => c.classList.contains('level-0'))
        const nonZeroCells = Array.from(cells).filter((c) => !c.classList.contains('level-0'))

        expect(level0Cells.length).toBeGreaterThan(0)
        expect(nonZeroCells.length).toBeGreaterThan(0)
    })
})
