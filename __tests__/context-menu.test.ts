/**
 * Comprehensive Tests for Context Menu Feature
 * Tests all Context Menu functionality before modularization
 */

import { GTDApp } from '../js/app.ts'
import { Task } from '../js/models.ts'

describe('Context Menu Feature - Comprehensive Tests', () => {
    let app
    let contextMenu
    let taskContainer

    beforeEach(() => {
        localStorage.clear()

        // Create context menu element
        contextMenu = document.getElementById('context-menu')
        if (!contextMenu) {
            contextMenu = document.createElement('div')
            contextMenu.id = 'context-menu'
            contextMenu.className = 'context-menu'
            contextMenu.style.display = 'none'
            contextMenu.innerHTML = `
                <div class="context-menu-item" data-action="edit">
                    <i class="fas fa-edit"></i> Edit
                </div>
                <div class="context-menu-item" data-action="duplicate">
                    <i class="fas fa-copy"></i> Duplicate
                </div>
                <div class="context-menu-item" data-action="toggle-star">
                    <i class="far fa-star"></i> Star
                </div>
                <div class="context-menu-item" data-action="complete">
                    <i class="fas fa-check"></i> Complete
                </div>
                <div class="context-menu-item" data-action="archive">
                    <i class="fas fa-archive"></i> Archive
                </div>
                <div class="context-menu-item context-menu-danger" data-action="delete">
                    <i class="fas fa-trash"></i> Delete
                </div>
                <div class="context-menu-submenu-content" id="context-menu-projects"></div>
                <div class="context-menu-submenu-content" id="context-menu-add-context"></div>
                <div class="context-menu-submenu-content" id="context-menu-remove-context"></div>
            `
            document.body.appendChild(contextMenu)
        }

        // Create task container
        taskContainer = document.getElementById('tasks-container')
        if (!taskContainer) {
            taskContainer = document.createElement('div')
            taskContainer.id = 'tasks-container'
            document.body.appendChild(taskContainer)
        }

        // Create count elements (needed for updateCounts())
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

        // Create task modal elements (needed for openTaskModal)
        let taskModal = document.getElementById('task-modal')
        if (!taskModal) {
            taskModal = document.createElement('div')
            taskModal.id = 'task-modal'
            taskModal.style.display = 'none'
            document.body.appendChild(taskModal)

            const title = document.createElement('h3')
            title.id = 'modal-title'
            title.textContent = 'Edit Task'
            taskModal.appendChild(title)

            const form = document.createElement('form')
            form.id = 'task-form'
            taskModal.appendChild(form)

            const taskId = document.createElement('input')
            taskId.id = 'task-id'
            taskId.type = 'hidden'
            form.appendChild(taskId)

            const taskTitle = document.createElement('input')
            taskTitle.id = 'task-title'
            taskTitle.type = 'text'
            form.appendChild(taskTitle)

            const taskDesc = document.createElement('textarea')
            taskDesc.id = 'task-description'
            form.appendChild(taskDesc)

            const projectSelect = document.createElement('select')
            projectSelect.id = 'task-project'
            form.appendChild(projectSelect)
        }

        // Create new app instance
        app = new GTDApp()
        app.tasks = []
        app.projects = []
    })

    describe('setupContextMenu()', () => {
        test('should initialize contextMenuTaskId to null', () => {
            app.setupContextMenu()

            expect(app.contextMenu.contextMenuTaskId).toBeNull()
        })

        test('should add click listener to document to close menu on outside click', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener')

            app.setupContextMenu()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add click listener to context menu for item clicks', () => {
            const addEventListenerSpy = jest.spyOn(contextMenu, 'addEventListener')

            app.setupContextMenu()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add contextmenu listener to document for right-click', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener')

            app.setupContextMenu()

            const contextmenuCalls = addEventListenerSpy.mock.calls.filter(
                (call) => call[0] === 'contextmenu'
            )
            expect(contextmenuCalls.length).toBeGreaterThan(0)
        })

        test('should add touchstart listener for mobile long-press', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener')

            app.setupContextMenu()

            const touchstartCalls = addEventListenerSpy.mock.calls.filter(
                (call) => call[0] === 'touchstart'
            )
            expect(touchstartCalls.length).toBeGreaterThan(0)
        })

        test('should add touchend listener to cancel long-press', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener')

            app.setupContextMenu()

            const touchendCalls = addEventListenerSpy.mock.calls.filter(
                (call) => call[0] === 'touchend'
            )
            expect(touchendCalls.length).toBeGreaterThan(0)
        })

        test('should add touchmove listener to cancel long-press', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener')

            app.setupContextMenu()

            const touchmoveCalls = addEventListenerSpy.mock.calls.filter(
                (call) => call[0] === 'touchmove'
            )
            expect(touchmoveCalls.length).toBeGreaterThan(0)
        })
    })

    describe('showContextMenu()', () => {
        test('should display context menu', () => {
            expect(contextMenu.style.display).toBe('none')

            app.showContextMenu({ clientX: 100, clientY: 100 }, 'task-1')

            expect(contextMenu.style.display).toBe('block')
        })

        test('should store task ID in contextMenuTaskId', () => {
            app.showContextMenu({ clientX: 100, clientY: 100 }, 'task-123')

            expect(app.contextMenu.contextMenuTaskId).toBe('task-123')
        })

        test('should position menu at specified coordinates', () => {
            app.showContextMenu({ clientX: 150, clientY: 200 }, 'task-1')

            expect(contextMenu.style.left).toBe('150px')
            expect(contextMenu.style.top).toBe('200px')
        })

        test('should handle pageX/pageY fallback for coordinates', () => {
            app.showContextMenu({ pageX: 300, pageY: 400 }, 'task-1')

            expect(contextMenu.style.left).toBe('300px')
            expect(contextMenu.style.top).toBe('400px')
        })

        test('should adjust position if menu would go off right edge', () => {
            contextMenu.style.width = '200px'
            Object.defineProperty(window, 'innerWidth', { value: 250, configurable: true })

            app.showContextMenu({ clientX: 200, clientY: 100 }, 'task-1')

            // Should be repositioned to fit within viewport
            expect(parseInt(contextMenu.style.left)).toBeLessThanOrEqual(250)
        })

        test('should adjust position if menu would go off bottom edge', () => {
            contextMenu.style.height = '100px'
            Object.defineProperty(window, 'innerHeight', { value: 150, configurable: true })

            app.showContextMenu({ clientX: 100, clientY: 100 }, 'task-1')

            // Should be repositioned to fit within viewport
            expect(parseInt(contextMenu.style.top)).toBeLessThanOrEqual(150)
        })

        test('should update star button text for starred task', () => {
            const task = new Task({ id: 'task-1', title: 'Starred Task', starred: true })
            app.tasks.push(task)

            app.showContextMenu({ clientX: 100, clientY: 100 }, 'task-1')

            const starItem = contextMenu.querySelector('[data-action="toggle-star"]')
            expect(starItem.innerHTML).toContain('Unstar')
            expect(starItem.innerHTML).toContain('fa-star')
        })

        test('should update star button text for unstarred task', () => {
            const task = new Task({ id: 'task-1', title: 'Normal Task', starred: false })
            app.tasks.push(task)

            app.showContextMenu({ clientX: 100, clientY: 100 }, 'task-1')

            const starItem = contextMenu.querySelector('[data-action="toggle-star"]')
            expect(starItem.innerHTML).toContain('Star')
        })

        test('should call populateContextMenuProjects()', () => {
            const populateSpy = jest.spyOn(app.contextMenu, 'populateContextMenuProjects')

            app.showContextMenu({ clientX: 100, clientY: 100 }, 'task-1')

            expect(populateSpy).toHaveBeenCalled()
        })

        test('should handle missing context menu element gracefully', () => {
            contextMenu.remove()

            expect(() =>
                app.showContextMenu({ clientX: 100, clientY: 100 }, 'task-1')
            ).not.toThrow()
        })
    })

    describe('hideContextMenu()', () => {
        test('should hide context menu', () => {
            contextMenu.style.display = 'block'
            app.contextMenu.contextMenuTaskId = 'task-1'

            app.hideContextMenu()

            expect(contextMenu.style.display).toBe('none')
            expect(app.contextMenu.contextMenuTaskId).toBeNull()
        })

        test('should handle missing context menu element gracefully', () => {
            contextMenu.remove()

            expect(() => app.hideContextMenu()).not.toThrow()
        })
    })

    describe('populateContextMenuProjects()', () => {
        test('should populate projects submenu', () => {
            app.projects = [
                { id: 'proj-1', title: 'Project 1' },
                { id: 'proj-2', title: 'Project 2' }
            ]

            app.populateContextMenuProjects()

            const submenu = document.getElementById('context-menu-projects')
            expect(submenu.children.length).toBe(3) // "No Project" + 2 projects
        })

        test('should include "No Project" option', () => {
            app.populateContextMenuProjects()

            const submenu = document.getElementById('context-menu-projects')
            const noProjectItem = submenu.querySelector('[data-project=""]')
            expect(noProjectItem).toBeTruthy()
            expect(noProjectItem.innerHTML).toContain('No Project')
        })

        test('should clear existing items before populating', () => {
            const submenu = document.getElementById('context-menu-projects')
            submenu.innerHTML = '<div class="context-menu-item" data-action="old">Old Item</div>'

            app.populateContextMenuProjects()

            expect(submenu.innerHTML).not.toContain('Old Item')
        })

        test('should handle missing submenu element gracefully', () => {
            const submenu = document.getElementById('context-menu-projects')
            submenu.remove()

            expect(() => app.populateContextMenuProjects()).not.toThrow()
        })
    })

    describe('handleContextMenuAction()', () => {
        let task

        beforeEach(() => {
            task = new Task({
                id: 'task-1',
                title: 'Test Task',
                description: 'Test description'
            })
            app.tasks.push(task)
        })

        test('should handle edit action', async () => {
            const openModalSpy = jest.spyOn(app, 'openTaskModal').mockImplementation(() => {})

            await app.handleContextMenuAction('edit', {}, 'task-1')

            expect(openModalSpy).toHaveBeenCalledWith(task)
            openModalSpy.mockRestore()
        })

        test('should handle duplicate action', async () => {
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(app, 'showToast')

            const originalTaskCount = app.tasks.length

            await app.handleContextMenuAction('duplicate', {}, 'task-1')

            expect(app.tasks.length).toBe(originalTaskCount + 1)
        })

        test('should handle toggle-star action', async () => {
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('toggle-star', {}, 'task-1')

            expect(task.starred).toBe(true)
        })

        test('should handle set-status action', async () => {
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('set-status', { status: 'next' }, 'task-1')

            expect(task.status).toBe('next')
        })

        test('should handle set-energy action', async () => {
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('set-energy', { energy: 'high' }, 'task-1')

            expect(task.energy).toBe('high')
        })

        test('should handle set-project action', async () => {
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('set-project', { project: 'proj-1' }, 'task-1')

            expect(task.projectId).toBe('proj-1')
        })

        test('should handle set-project action with null (remove project)', async () => {
            task.projectId = 'proj-1'
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('set-project', { project: '' }, 'task-1')

            expect(task.projectId).toBeNull()
        })

        test('should handle complete action', async () => {
            const toggleSpy = jest.spyOn(app, 'toggleTaskComplete')

            await app.handleContextMenuAction('complete', {}, 'task-1')

            expect(toggleSpy).toHaveBeenCalledWith('task-1')
        })

        test('should handle archive action', async () => {
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
            const archiveSpy = jest.spyOn(app, 'archiveTask').mockResolvedValue()
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('archive', {}, 'task-1')

            expect(archiveSpy).toHaveBeenCalledWith('task-1')

            confirmSpy.mockRestore()
        })

        test('should handle delete action', async () => {
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
            jest.spyOn(app, 'saveState')
            jest.spyOn(app.storage, 'getTasks').mockReturnValue([])
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'updateCounts')

            await app.handleContextMenuAction('delete', {}, 'task-1')

            expect(app.tasks.find((t) => t.id === 'task-1')).toBeUndefined()

            confirmSpy.mockRestore()
        })

        test('should do nothing for unknown action', async () => {
            const originalTitle = task.title

            await app.handleContextMenuAction('unknown-action', {}, 'task-1')

            expect(task.title).toBe(originalTitle)
        })

        test('should do nothing if task not found', async () => {
            const result = await app.handleContextMenuAction('edit', {}, 'nonexistent-task')

            expect(result).toBeUndefined()
        })
    })

    describe('Mobile Long-Press Support', () => {
        test('should trigger context menu after 500ms long-press', async () => {
            jest.useFakeTimers()
            app.setupContextMenu()

            // Create a task element
            const taskItem = document.createElement('div')
            taskItem.className = 'task-item'
            taskItem.dataset.taskId = 'task-1'
            taskContainer.appendChild(taskItem)

            // Mock document.elementFromPoint to return the task item
            document.elementFromPoint = jest.fn().mockReturnValue(taskItem)

            const showSpy = jest.spyOn(app.contextMenu, 'showContextMenu')

            // Simulate touchstart on task
            const touchStartEvent = new Event('touchstart', { bubbles: true })
            Object.defineProperty(touchStartEvent, 'target', { value: taskItem, enumerable: true })
            touchStartEvent.touches = [{ clientX: 100, clientY: 100 }]

            document.dispatchEvent(touchStartEvent)

            // Fast-forward 500ms
            jest.advanceTimersByTime(500)

            expect(showSpy).toHaveBeenCalledWith(
                expect.objectContaining({ clientX: 100, clientY: 100 }),
                'task-1'
            )

            delete document.elementFromPoint
            jest.useRealTimers()
        })

        test('should cancel long-press on touchend', async () => {
            jest.useFakeTimers()
            app.setupContextMenu()

            const taskItem = document.createElement('div')
            taskItem.className = 'task-item'
            taskItem.dataset.taskId = 'task-1'
            taskContainer.appendChild(taskItem)

            const showSpy = jest.spyOn(app.contextMenu, 'showContextMenu')

            // Touch start
            const touchStartEvent = new Event('touchstart', { bubbles: true })
            Object.defineProperty(touchStartEvent, 'target', { value: taskItem, enumerable: true })
            touchStartEvent.touches = [{ clientX: 100, clientY: 100 }]
            document.dispatchEvent(touchStartEvent)

            // Touch end before 500ms
            jest.advanceTimersByTime(200)
            const touchEndEvent = new Event('touchend', { bubbles: true })
            document.dispatchEvent(touchEndEvent)

            // Fast-forward past 500ms
            jest.advanceTimersByTime(300)

            expect(showSpy).not.toHaveBeenCalled()

            jest.useRealTimers()
        })

        test('should cancel long-press on touchmove', async () => {
            jest.useFakeTimers()
            app.setupContextMenu()

            const taskItem = document.createElement('div')
            taskItem.className = 'task-item'
            taskItem.dataset.taskId = 'task-1'
            taskContainer.appendChild(taskItem)

            const showSpy = jest.spyOn(app.contextMenu, 'showContextMenu')

            // Touch start
            const touchStartEvent = new Event('touchstart', { bubbles: true })
            Object.defineProperty(touchStartEvent, 'target', { value: taskItem, enumerable: true })
            touchStartEvent.touches = [{ clientX: 100, clientY: 100 }]
            document.dispatchEvent(touchStartEvent)

            // Touch move before 500ms - move more than 10px to cancel
            jest.advanceTimersByTime(200)
            const touchMoveEvent = new Event('touchmove', { bubbles: true })
            touchMoveEvent.touches = [{ clientX: 120, clientY: 120 }] // Moved 20px
            document.dispatchEvent(touchMoveEvent)

            // Fast-forward past 500ms
            jest.advanceTimersByTime(300)

            expect(showSpy).not.toHaveBeenCalled()

            jest.useRealTimers()
        })
    })

    describe('Integration: Desktop Right-Click', () => {
        test('should show context menu on right-click for task', () => {
            app.setupContextMenu()

            const taskItem = document.createElement('div')
            taskItem.className = 'task-item'
            taskItem.dataset.taskId = 'task-1'
            taskContainer.appendChild(taskItem)

            const showSpy = jest.spyOn(app.contextMenu, 'showContextMenu')

            const contextMenuEvent = new Event('contextmenu', { bubbles: true, cancelable: true })
            Object.defineProperty(contextMenuEvent, 'target', { value: taskItem, enumerable: true })
            Object.defineProperty(contextMenuEvent, 'preventDefault', {
                value: jest.fn(),
                enumerable: true
            })

            document.dispatchEvent(contextMenuEvent)

            expect(showSpy).toHaveBeenCalled()
            expect(contextMenuEvent.preventDefault).toHaveBeenCalled()
        })

        test('should not show context menu when right-clicking non-task element', () => {
            app.setupContextMenu()

            const showSpy = jest.spyOn(app.contextMenu, 'showContextMenu')

            const nonTaskElement = document.createElement('div')
            nonTaskElement.className = 'not-a-task'
            document.body.appendChild(nonTaskElement)

            const contextMenuEvent = new Event('contextmenu', { bubbles: true })
            Object.defineProperty(contextMenuEvent, 'target', {
                value: nonTaskElement,
                enumerable: true
            })

            document.dispatchEvent(contextMenuEvent)

            expect(showSpy).not.toHaveBeenCalled()
        })
    })

    describe('Integration: Menu Item Clicks', () => {
        test('should handle action when menu item clicked', () => {
            app.setupContextMenu()
            app.contextMenu.contextMenuTaskId = 'task-1'

            const task = new Task({ id: 'task-1', title: 'Test', starred: false })
            app.tasks.push(task)

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')
            const hideSpy = jest.spyOn(app.contextMenu, 'hideContextMenu')

            const starItem = contextMenu.querySelector('[data-action="toggle-star"]')
            const clickEvent = new Event('click', { bubbles: true })
            Object.defineProperty(clickEvent, 'target', { value: starItem, enumerable: true })

            contextMenu.dispatchEvent(clickEvent)

            expect(task.starred).toBe(true)
            expect(hideSpy).toHaveBeenCalled()
        })

        test('should not handle action when clicking outside menu items', () => {
            app.setupContextMenu()
            app.contextMenu.contextMenuTaskId = 'task-1'

            const hideSpy = jest.spyOn(app.contextMenu, 'hideContextMenu')

            // Click on the menu container itself, not on a menu item
            const clickEvent = new MouseEvent('click', { bubbles: true })
            Object.defineProperty(clickEvent, 'target', { value: contextMenu, enumerable: true })
            Object.defineProperty(clickEvent, 'currentTarget', {
                value: contextMenu,
                enumerable: true
            })

            // Add a mock closest method that returns null (not a menu item)
            clickEvent.target.closest = jest.fn().mockReturnValue(null)

            contextMenu.dispatchEvent(clickEvent)

            expect(hideSpy).toHaveBeenCalled()
        })
    })

    describe('Edge Cases', () => {
        test('should handle missing task gracefully in actions', async () => {
            app.contextMenu.contextMenuTaskId = 'nonexistent-task'

            const result = await app.handleContextMenuAction('edit', {}, 'nonexistent-task')

            expect(result).toBeUndefined()
        })

        test('should handle null contextMenuTaskId', async () => {
            app.contextMenu.contextMenuTaskId = null

            const result = await app.handleContextMenuAction('edit', {}, null)

            expect(result).toBeUndefined()
        })

        test('should handle rapid open/close cycles', () => {
            app.showContextMenu({ clientX: 100, clientY: 100 }, 'task-1')
            expect(contextMenu.style.display).toBe('block')

            app.hideContextMenu()
            expect(contextMenu.style.display).toBe('none')

            app.showContextMenu({ clientX: 200, clientY: 200 }, 'task-2')
            expect(contextMenu.style.display).toBe('block')
            expect(app.contextMenu.contextMenuTaskId).toBe('task-2')
        })

        test('should handle coordinate calculation with both clientX and pageX', () => {
            // showContextMenu prefers clientX, then pageX for X
            // For Y, it prefers clientY, then pageY
            app.showContextMenu({ clientX: 100, clientY: 150, pageX: 200, pageY: 250 }, 'task-1')

            // Should use clientX for X
            expect(contextMenu.style.left).toBe('100px')
            // Should use clientY for Y (or fall back to pageY if clientY is undefined)
            const topValue = parseInt(contextMenu.style.top)
            expect(topValue).toBeGreaterThanOrEqual(100)
        })
    })

    describe('Missing Coverage - populateContextMenuProjects() branches', () => {
        beforeEach(() => {
            // Ensure the submenu exists and is empty before each test
            let submenu = document.getElementById('context-menu-projects')
            if (!submenu) {
                // Create it if it doesn't exist
                const contextMenu = document.getElementById('context-menu')
                if (contextMenu) {
                    submenu = document.createElement('div')
                    submenu.id = 'context-menu-projects'
                    submenu.className = 'context-menu-submenu-content'
                    contextMenu.appendChild(submenu)
                }
            } else {
                submenu.innerHTML = ''
            }
        })

        test('should handle empty projects array', () => {
            app.projects = []

            app.contextMenu.populateContextMenuProjects()

            const submenu = document.getElementById('context-menu-projects')
            expect(submenu.children.length).toBe(1) // Only "No Project"
        })

        test('should escape HTML in project titles', () => {
            app.projects = [
                { id: 'proj-1', title: '<script>alert("xss")</script>' },
                { id: 'proj-2', title: 'Project & Friends' }
            ]

            app.contextMenu.populateContextMenuProjects()

            const submenu = document.getElementById('context-menu-projects')
            expect(submenu.innerHTML).not.toContain('<script>')
            expect(submenu.innerHTML).toContain('&amp;')
        })

        test('should create correct data attributes for project items', () => {
            app.projects = [{ id: 'proj-1', title: 'Project 1' }]

            app.contextMenu.populateContextMenuProjects()

            const submenu = document.getElementById('context-menu-projects')
            expect(submenu).not.toBeNull() // Verify submenu exists

            const projectItem = submenu.querySelector('[data-project="proj-1"]')
            expect(projectItem).toBeTruthy()
            expect(projectItem.className).toContain('context-menu-item')
        })
    })

    describe('Missing Coverage - save-as-template action', () => {
        test('should handle save-as-template action', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Template Task',
                description: 'Template description',
                status: 'inbox'
            })
            app.tasks.push(task)

            const saveTemplateSpy = jest
                .spyOn(app, 'saveTaskAsTemplate')
                .mockImplementation(() => 'template-1')

            await app.handleContextMenuAction('save-as-template', {}, 'task-1')

            expect(saveTemplateSpy).toHaveBeenCalledWith('task-1')
            saveTemplateSpy.mockRestore()
        })

        test('should handle save-as-template when saveTaskAsTemplate fails', async () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox' })
            app.tasks.push(task)

            const saveTemplateSpy = jest.spyOn(app, 'saveTaskAsTemplate').mockReturnValue(null)

            await app.handleContextMenuAction('save-as-template', {}, 'task-1')

            expect(saveTemplateSpy).toHaveBeenCalledWith('task-1')
            saveTemplateSpy.mockRestore()
        })
    })

    describe('Missing Coverage - add-context action', () => {
        beforeEach(() => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox', contexts: [] })
            app.tasks.push(task)
        })

        test('should add context to task', async () => {
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('add-context', { context: '@work' }, 'task-1')

            const task = app.tasks.find((t) => t.id === 'task-1')
            expect(task.contexts).toContain('@work')
        })

        test('should show notification after adding context', async () => {
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            const toastSpy = jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('add-context', { context: '@home' }, 'task-1')

            expect(toastSpy).toHaveBeenCalledWith('Added @home')
        })

        test('should not add duplicate context', async () => {
            const task = app.tasks.find((t) => t.id === 'task-1')
            task.contexts = ['@work']

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('add-context', { context: '@work' }, 'task-1')

            expect(task.contexts.filter((c) => c === '@work').length).toBe(1)
        })
    })

    describe('Missing Coverage - remove-context action', () => {
        test('should remove context from task', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@work', '@home', '@phone']
            })
            app.tasks.push(task)

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('remove-context', { context: '@work' }, 'task-1')

            expect(task.contexts).not.toContain('@work')
            expect(task.contexts).toContain('@home')
            expect(task.contexts).toContain('@phone')
        })

        test('should show notification after removing context', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@work']
            })
            app.tasks.push(task)

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            const toastSpy = jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('remove-context', { context: '@work' }, 'task-1')

            expect(toastSpy).toHaveBeenCalledWith('Removed @work')
        })

        test('should handle removing non-existent context gracefully', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@home']
            })
            app.tasks.push(task)

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('remove-context', { context: '@work' }, 'task-1')

            expect(task.contexts).toEqual(['@home'])
        })
    })

    describe('Missing Coverage - populateAddContextMenu()', () => {
        test('should populate add context submenu with default contexts', () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox', contexts: [] })
            app.tasks.push(task)

            app.contextMenu.populateAddContextMenu('task-1')

            const submenu = document.getElementById('context-menu-add-context')
            expect(submenu.children.length).toBeGreaterThan(0)
        })

        test('should not include contexts that task already has', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@work', '@home']
            })
            app.tasks.push(task)

            app.contextMenu.populateAddContextMenu('task-1')

            const submenu = document.getElementById('context-menu-add-context')
            const workItem = submenu.querySelector('[data-context="@work"]')
            const homeItem = submenu.querySelector('[data-context="@home"]')
            expect(workItem).toBeFalsy()
            expect(homeItem).toBeFalsy()
        })

        test('should include custom contexts from localStorage', () => {
            localStorage.setItem('gtd_custom_contexts', JSON.stringify(['@custom1', '@custom2']))
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox', contexts: [] })
            app.tasks.push(task)

            app.contextMenu.populateAddContextMenu('task-1')

            const submenu = document.getElementById('context-menu-add-context')
            expect(submenu.innerHTML).toContain('@custom1')
            expect(submenu.innerHTML).toContain('@custom2')

            localStorage.removeItem('gtd_custom_contexts')
        })

        test('should clear existing items before populating', () => {
            const submenu = document.getElementById('context-menu-add-context')
            submenu.innerHTML = '<div class="context-menu-item" data-action="old">Old Item</div>'

            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox', contexts: [] })
            app.tasks.push(task)

            app.contextMenu.populateAddContextMenu('task-1')

            expect(submenu.innerHTML).not.toContain('Old Item')
        })

        test('should handle missing submenu element gracefully', () => {
            const submenu = document.getElementById('context-menu-add-context')
            submenu.remove()

            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox', contexts: [] })
            app.tasks.push(task)

            expect(() => app.contextMenu.populateAddContextMenu('task-1')).not.toThrow()
        })

        test('should handle missing task gracefully', () => {
            expect(() => app.contextMenu.populateAddContextMenu('nonexistent-task')).not.toThrow()
        })
    })

    describe('Missing Coverage - populateRemoveContextMenu()', () => {
        test('should populate remove context submenu with task contexts', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@work', '@home', '@phone']
            })
            app.tasks.push(task)

            app.contextMenu.populateRemoveContextMenu('task-1')

            const submenu = document.getElementById('context-menu-remove-context')
            expect(submenu.children.length).toBe(3)
        })

        test('should show message when task has no contexts', () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox', contexts: [] })
            app.tasks.push(task)

            app.contextMenu.populateRemoveContextMenu('task-1')

            const submenu = document.getElementById('context-menu-remove-context')
            expect(submenu.innerHTML).toContain('No contexts to remove')
        })

        test('should clear existing items before populating', () => {
            const submenu = document.getElementById('context-menu-remove-context')
            submenu.innerHTML = '<div class="context-menu-item" data-action="old">Old Item</div>'

            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@work']
            })
            app.tasks.push(task)

            app.contextMenu.populateRemoveContextMenu('task-1')

            expect(submenu.innerHTML).not.toContain('Old Item')
        })

        test('should handle missing submenu element gracefully', () => {
            const submenu = document.getElementById('context-menu-remove-context')
            submenu.remove()

            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@work']
            })
            app.tasks.push(task)

            expect(() => app.contextMenu.populateRemoveContextMenu('task-1')).not.toThrow()
        })

        test('should handle missing task gracefully', () => {
            expect(() =>
                app.contextMenu.populateRemoveContextMenu('nonexistent-task')
            ).not.toThrow()
        })
    })

    describe('Missing Coverage - getCustomContexts()', () => {
        test('should return custom contexts when defined', () => {
            localStorage.setItem(
                'gtd_custom_contexts',
                JSON.stringify(['@custom1', '@custom2', '@custom3'])
            )

            const customContexts = app.contextMenu.getCustomContexts()

            expect(customContexts).toEqual(['@custom1', '@custom2', '@custom3'])

            localStorage.removeItem('gtd_custom_contexts')
        })

        test('should return empty array when no custom contexts', () => {
            localStorage.clear()

            const customContexts = app.contextMenu.getCustomContexts()

            expect(customContexts).toEqual([])
        })

        test('should return null when localStorage has null value', () => {
            localStorage.setItem('gtd_custom_contexts', 'null')

            const customContexts = app.contextMenu.getCustomContexts()

            expect(customContexts).toBeNull()

            localStorage.removeItem('gtd_custom_contexts')
        })
    })

    describe('Missing Coverage - getContextMenuTaskId()', () => {
        test('should return current context menu task ID', () => {
            app.contextMenu.contextMenuTaskId = 'task-123'

            const taskId = app.contextMenu.getContextMenuTaskId()

            expect(taskId).toBe('task-123')
        })

        test('should return null when no task ID set', () => {
            app.contextMenu.contextMenuTaskId = null

            const taskId = app.contextMenu.getContextMenuTaskId()

            expect(taskId).toBeNull()
        })

        test('should return undefined when contextMenuTaskId is undefined', () => {
            app.contextMenu.contextMenuTaskId = undefined

            const taskId = app.contextMenu.getContextMenuTaskId()

            expect(taskId).toBeUndefined()
        })
    })

    describe('Missing Coverage - isContextMenuVisible()', () => {
        test('should return true when context menu is visible', () => {
            contextMenu.style.display = 'block'

            const isVisible = app.contextMenu.isContextMenuVisible()

            expect(isVisible).toBe(true)
        })

        test('should return false when context menu is hidden', () => {
            contextMenu.style.display = 'none'

            const isVisible = app.contextMenu.isContextMenuVisible()

            expect(isVisible).toBe(false)
        })

        test('should return false when context menu display is empty string', () => {
            contextMenu.style.display = ''

            const isVisible = app.contextMenu.isContextMenuVisible()

            expect(isVisible).toBe(false)
        })

        test('should return false when context menu element is missing', () => {
            contextMenu.remove()

            const isVisible = app.contextMenu.isContextMenuVisible()

            expect(isVisible).toBe(false)
        })
    })

    describe('Missing Coverage - Integration Tests', () => {
        test('should handle full add context workflow', async () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox', contexts: [] })
            app.tasks.push(task)

            // Populate add context menu
            app.contextMenu.populateAddContextMenu('task-1')

            // Find and click add context item
            const submenu = document.getElementById('context-menu-add-context')
            const addContextItem = submenu.querySelector('[data-context="@work"]')

            expect(addContextItem).toBeTruthy()

            // Simulate the click
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('add-context', { context: '@work' }, 'task-1')

            expect(task.contexts).toContain('@work')
        })

        test('should handle full remove context workflow', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@work', '@home']
            })
            app.tasks.push(task)

            // Populate remove context menu
            app.contextMenu.populateRemoveContextMenu('task-1')

            const submenu = document.getElementById('context-menu-remove-context')
            const removeContextItem = submenu.querySelector('[data-context="@work"]')

            expect(removeContextItem).toBeTruthy()

            // Simulate the action
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('remove-context', { context: '@work' }, 'task-1')

            expect(task.contexts).not.toContain('@work')
            expect(task.contexts).toContain('@home')
        })

        test('should get custom contexts in submenu population', () => {
            localStorage.setItem('gtd_custom_contexts', JSON.stringify(['@custom1', '@custom2']))
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox', contexts: [] })
            app.tasks.push(task)

            app.contextMenu.populateAddContextMenu('task-1')

            const submenu = document.getElementById('context-menu-add-context')
            const custom1Item = submenu.querySelector('[data-context="@custom1"]')
            const custom2Item = submenu.querySelector('[data-context="@custom2"]')

            expect(custom1Item).toBeTruthy()
            expect(custom2Item).toBeTruthy()

            localStorage.removeItem('gtd_custom_contexts')
        })

        test('should check visibility correctly during workflow', () => {
            expect(app.contextMenu.isContextMenuVisible()).toBe(false)

            app.showContextMenu({ clientX: 100, clientY: 100 }, 'task-1')

            expect(app.contextMenu.isContextMenuVisible()).toBe(true)
            expect(app.contextMenu.getContextMenuTaskId()).toBe('task-1')

            app.hideContextMenu()

            expect(app.contextMenu.isContextMenuVisible()).toBe(false)
            expect(app.contextMenu.getContextMenuTaskId()).toBeNull()
        })
    })

    describe('Missing Coverage - Edge Cases', () => {
        test('should handle save-as-template when saveTaskAsTemplate fails', async () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox' })
            app.tasks.push(task)

            const saveTemplateSpy = jest.spyOn(app, 'saveTaskAsTemplate').mockReturnValue(null)
            const toastSpy = jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('save-as-template', {}, 'task-1')

            expect(toastSpy).not.toHaveBeenCalled()
            saveTemplateSpy.mockRestore()
        })

        test('should handle archive action when user cancels confirm', async () => {
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)
            const archiveSpy = jest.spyOn(app, 'archiveTask').mockResolvedValue()

            await app.handleContextMenuAction('archive', {}, 'task-1')

            expect(archiveSpy).not.toHaveBeenCalled()

            confirmSpy.mockRestore()
        })

        test('should handle delete action when user cancels confirm', async () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox' })
            app.tasks.push(task)

            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()

            await app.handleContextMenuAction('delete', {}, 'task-1')

            expect(app.tasks.find((t) => t.id === 'task-1')).toBeDefined()

            confirmSpy.mockRestore()
        })

        test('should handle add-context when context already exists', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@work', '@home']
            })
            app.tasks.push(task)

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('add-context', { context: '@work' }, 'task-1')

            // Should still have only one @work
            expect(task.contexts.filter((c) => c === '@work').length).toBe(1)
        })

        test('should handle custom contexts with special characters', () => {
            localStorage.setItem(
                'gtd_custom_contexts',
                JSON.stringify(['@work-from-home', '@@special'])
            )

            const customContexts = app.contextMenu.getCustomContexts()

            expect(customContexts).toContain('@work-from-home')
            expect(customContexts).toContain('@@special')

            localStorage.removeItem('gtd_custom_contexts')
        })

        test('should handle empty string context in remove action', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                status: 'inbox',
                contexts: ['@work']
            })
            app.tasks.push(task)

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('remove-context', { context: '' }, 'task-1')

            // Should not crash and contexts should remain unchanged
            expect(task.contexts).toEqual(['@work'])
        })

        test('should handle context with whitespace in add action', async () => {
            const task = new Task({ id: 'task-1', title: 'Task', status: 'inbox', contexts: [] })
            app.tasks.push(task)

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'renderView')
            const toastSpy = jest.spyOn(app, 'showToast')

            await app.handleContextMenuAction('add-context', { context: '  @work  ' }, 'task-1')

            // Toast should show the context as provided (trimmed by the actual code)
            expect(toastSpy).toHaveBeenCalledWith('Added @work')
        })
    })
})
