'use strict'
/**
 * Context menu module
 * Handles right-click context menu for tasks
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.ContextMenuManager = void 0
const dom_utils_1 = require('../../dom-utils')
class ContextMenuManager {
    constructor(state, app) {
        this.contextMenuTaskId = null
        this.longPressTimer = null
        this.touchStartPos = null
        this.state = state
        this.app = app
    }
    /**
     * Setup context menu functionality
     */
    setupContextMenu() {
        const contextMenu = document.getElementById('context-menu')
        if (!contextMenu) return
        // Close context menu on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu()
            }
        })
        // Context menu item clicks
        contextMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.context-menu-item')
            if (!menuItem) return
            const action = menuItem.getAttribute('data-action')
            const taskId = this.contextMenuTaskId
            if (!taskId || !action) return
            e.preventDefault()
            e.stopPropagation()
            // Get dataset from HTML element
            const dataset = menuItem.dataset
            this.handleContextMenuAction(action, dataset, taskId)
            this.hideContextMenu()
        })
        // Add right-click handler to task container
        document.addEventListener('contextmenu', (e) => {
            const taskItem = e.target.closest('.task-item')
            if (taskItem) {
                e.preventDefault()
                const taskId = taskItem.getAttribute('data-task-id')
                if (taskId) {
                    this.showContextMenu(e, taskId)
                }
            }
        })
        // Long-press for mobile - improved implementation
        document.addEventListener(
            'touchstart',
            (e) => {
                const taskItem = e.target.closest('.task-item')
                if (taskItem && e.touches.length > 0) {
                    // Store touch position for later use
                    this.touchStartPos = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY
                    }
                    this.longPressTimer = setTimeout(() => {
                        // Check if we're still on the same task item
                        const currentTaskItem = document
                            .elementFromPoint(this.touchStartPos.x, this.touchStartPos.y)
                            ?.closest('.task-item')
                        if (
                            currentTaskItem &&
                            currentTaskItem.getAttribute('data-task-id') ===
                                taskItem.getAttribute('data-task-id')
                        ) {
                            const taskId = taskItem.getAttribute('data-task-id')
                            if (taskId) {
                                // Create a synthetic event object with the stored coordinates
                                const syntheticEvent = {
                                    clientX: this.touchStartPos.x,
                                    clientY: this.touchStartPos.y,
                                    preventDefault: () => {}
                                }
                                this.showContextMenu(syntheticEvent, taskId)
                            }
                        }
                        this.touchStartPos = null
                    }, 500)
                }
            },
            { passive: true }
        ) // Use passive for better scroll performance
        document.addEventListener('touchend', () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer)
                this.longPressTimer = null
            }
            this.touchStartPos = null
        })
        document.addEventListener(
            'touchmove',
            (e) => {
                // Clear timer if moved too much (to prevent accidental triggers during scroll)
                if (this.touchStartPos && e.touches.length > 0) {
                    const moveX = Math.abs(e.touches[0].clientX - this.touchStartPos.x)
                    const moveY = Math.abs(e.touches[0].clientY - this.touchStartPos.y)
                    // Allow small movements but cancel if moved more than 10px
                    if (moveX > 10 || moveY > 10) {
                        if (this.longPressTimer) {
                            clearTimeout(this.longPressTimer)
                            this.longPressTimer = null
                        }
                        this.touchStartPos = null
                    }
                }
            },
            { passive: true }
        )
    }
    /**
     * Show context menu at position
     */
    showContextMenu(event, taskId) {
        const contextMenu = document.getElementById('context-menu')
        if (!contextMenu) return
        this.contextMenuTaskId = taskId
        // Populate projects submenu
        this.populateContextMenuProjects()
        // Populate context submenus
        this.populateAddContextMenu(taskId)
        this.populateRemoveContextMenu(taskId)
        // Position menu
        const x = event.clientX || event.pageX || 0
        const y = event.clientY || event.pageY || 0
        contextMenu.style.display = 'block'
        // Ensure menu stays within viewport
        const rect = contextMenu.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        let posX = x
        let posY = y
        if (posX + rect.width > viewportWidth) {
            posX = viewportWidth - rect.width - 10
        }
        if (posY + rect.height > viewportHeight) {
            posY = viewportHeight - rect.height - 10
        }
        contextMenu.style.left = posX + 'px'
        contextMenu.style.top = posY + 'px'
        // Update star button text
        const task = this.state.tasks.find((t) => t.id === taskId)
        if (task) {
            const starItem = contextMenu.querySelector('[data-action="toggle-star"]')
            if (starItem) {
                starItem.innerHTML = task.starred
                    ? '<i class="fas fa-star" style="color: gold;"></i> Unstar'
                    : '<i class="far fa-star"></i> Star'
            }
        }
    }
    /**
     * Hide context menu
     */
    hideContextMenu() {
        const contextMenu = document.getElementById('context-menu')
        if (contextMenu) {
            contextMenu.style.display = 'none'
        }
        this.contextMenuTaskId = null
    }
    /**
     * Populate projects submenu in context menu
     */
    populateContextMenuProjects() {
        const submenu = document.getElementById('context-menu-projects')
        if (!submenu) return
        // Clear existing items
        submenu.innerHTML =
            '<div class="context-menu-item" data-action="set-project" data-project=""><i class="fas fa-times-circle"></i> No Project</div>'
        // Add projects
        this.state.projects.forEach((project) => {
            const item = document.createElement('div')
            item.className = 'context-menu-item'
            item.setAttribute('data-action', 'set-project')
            item.setAttribute('data-project', project.id || '')
            // Safe DOM creation (no innerHTML)
            const icon = document.createElement('i')
            icon.className = 'fas fa-folder'
            item.appendChild(icon)
            const text = document.createTextNode(' ' + (0, dom_utils_1.escapeHtml)(project.title)) // Safe: textContent escapes HTML
            item.appendChild(text)
            submenu.appendChild(item)
        })
    }
    /**
     * Handle context menu action
     */
    async handleContextMenuAction(action, data, taskId) {
        const task = this.state.tasks.find((t) => t.id === taskId)
        if (!task) return
        switch (action) {
            case 'edit':
                this.app.openTaskModal?.(task)
                break
            case 'duplicate':
                await this.app.duplicateTask?.(taskId)
                break
            case 'save-as-template':
                this.app.saveTaskAsTemplate?.(taskId)
                break
            case 'toggle-star':
                this.app.saveState?.('Toggle task star')
                task.toggleStar()
                await this.app.saveTasks?.()
                this.app.renderView?.()
                this.app.showToast?.(task.starred ? 'Task starred' : 'Task unstarred')
                break
            case 'set-status':
                this.app.saveState?.('Change task status')
                task.status = data.status
                task.updatedAt = new Date().toISOString()
                await this.app.saveTasks?.()
                this.app.renderView?.()
                this.app.updateCounts?.()
                this.app.showToast?.(`Status changed to ${data.status}`)
                break
            case 'set-energy':
                this.app.saveState?.('Change task energy')
                task.energy = data.energy
                task.updatedAt = new Date().toISOString()
                await this.app.saveTasks?.()
                this.app.renderView?.()
                this.app.showToast?.(`Energy changed to ${data.energy || 'none'}`)
                break
            case 'set-project':
                const projectId = data.project || null
                this.app.saveState?.('Change task project')
                task.projectId = projectId
                task.updatedAt = new Date().toISOString()
                await this.app.saveTasks?.()
                this.app.renderView?.()
                this.app.showToast?.(projectId ? 'Project assigned' : 'Project removed')
                break
            case 'complete':
                this.app.saveState?.('Complete task')
                task.markComplete()
                await this.app.saveTasks?.()
                this.app.renderView?.()
                this.app.updateCounts?.()
                this.app.showToast?.('Task completed')
                break
            case 'archive':
                if (confirm('Archive this task?')) {
                    this.app.saveState?.('Archive task')
                    task.status = 'completed'
                    task.completedAt = new Date().toISOString()
                    await this.app.saveTasks?.()
                    this.app.renderView?.()
                    this.app.updateCounts?.()
                    this.app.showToast?.('Task archived')
                }
                break
            case 'delete':
                if (confirm('Delete this task? This cannot be undone.')) {
                    this.app.saveState?.('Delete task')
                    const taskIndex = this.state.tasks.findIndex((t) => t.id === taskId)
                    if (taskIndex > -1) {
                        this.state.tasks.splice(taskIndex, 1)
                        await this.app.saveTasks?.()
                        this.app.renderView?.()
                        this.app.updateCounts?.()
                        this.app.showToast?.('Task deleted')
                    }
                }
                break
            case 'add-context':
                const contextToAdd = data.context
                if (contextToAdd && !task.contexts?.includes(contextToAdd)) {
                    this.app.saveState?.('Add context to task')
                    if (!task.contexts) task.contexts = []
                    task.contexts.push(contextToAdd)
                    task.updatedAt = new Date().toISOString()
                    await this.app.saveTasks?.()
                    this.app.renderView?.()
                    this.app.showToast?.(`Added context: ${contextToAdd}`)
                }
                break
            case 'remove-context':
                const contextToRemove = data.context
                if (contextToRemove && task.contexts?.includes(contextToRemove)) {
                    this.app.saveState?.('Remove context from task')
                    task.contexts = task.contexts.filter((c) => c !== contextToRemove)
                    task.updatedAt = new Date().toISOString()
                    await this.app.saveTasks?.()
                    this.app.renderView?.()
                    this.app.showToast?.(`Removed context: ${contextToRemove}`)
                }
                break
        }
    }
    /**
     * Populate add context submenu
     */
    populateAddContextMenu(taskId) {
        const submenu = document.getElementById('context-menu-add-context')
        if (!submenu) return
        const task = this.state.tasks.find((t) => t.id === taskId)
        if (!task) return
        // Clear existing items
        submenu.innerHTML = ''
        // Get default contexts from state or use empty array
        const defaultContexts = this.state.defaultContexts || []
        // Get custom contexts from localStorage
        const customContexts = this.getCustomContexts()
        // Combine all contexts
        const allContexts = [...defaultContexts, ...customContexts]
        // Filter out contexts the task already has
        const availableContexts = allContexts.filter((context) => !task.contexts?.includes(context))
        if (availableContexts.length === 0) {
            submenu.innerHTML =
                '<div class="context-menu-item" style="color: #999; font-style: italic;">No contexts available</div>'
            return
        }
        // Add available contexts
        availableContexts.forEach((context) => {
            const item = document.createElement('div')
            item.className = 'context-menu-item'
            item.setAttribute('data-action', 'add-context')
            item.setAttribute('data-context', context)
            const icon = document.createElement('i')
            icon.className = 'fas fa-tag'
            item.appendChild(icon)
            const text = document.createTextNode(' ' + (0, dom_utils_1.escapeHtml)(context))
            item.appendChild(text)
            submenu.appendChild(item)
        })
    }
    /**
     * Populate remove context submenu
     */
    populateRemoveContextMenu(taskId) {
        const submenu = document.getElementById('context-menu-remove-context')
        if (!submenu) return
        const task = this.state.tasks.find((t) => t.id === taskId)
        if (!task) return
        // Clear existing items
        submenu.innerHTML = ''
        if (!task.contexts || task.contexts.length === 0) {
            submenu.innerHTML =
                '<div class="context-menu-item" style="color: #999; font-style: italic;">No contexts to remove</div>'
            return
        }
        // Add task contexts
        task.contexts.forEach((context) => {
            const item = document.createElement('div')
            item.className = 'context-menu-item'
            item.setAttribute('data-action', 'remove-context')
            item.setAttribute('data-context', context)
            const icon = document.createElement('i')
            icon.className = 'fas fa-times-circle'
            item.appendChild(icon)
            const text = document.createTextNode(' ' + (0, dom_utils_1.escapeHtml)(context))
            item.appendChild(text)
            submenu.appendChild(item)
        })
    }
    /**
     * Get custom contexts from localStorage
     */
    getCustomContexts() {
        try {
            const customContexts = localStorage.getItem('gtd_custom_contexts')
            if (customContexts) {
                const parsed = JSON.parse(customContexts)
                return Array.isArray(parsed) ? parsed : []
            }
        } catch (e) {
            console.error('Error reading custom contexts:', e)
        }
        return []
    }
    /**
     * Get current context menu task ID
     */
    getContextMenuTaskId() {
        return this.contextMenuTaskId
    }
    /**
     * Check if context menu is visible
     */
    isContextMenuVisible() {
        const contextMenu = document.getElementById('context-menu')
        if (!contextMenu) return false
        return contextMenu.style.display === 'block'
    }
}
exports.ContextMenuManager = ContextMenuManager
//# sourceMappingURL=context-menu.js.map
