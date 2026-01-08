/**
 * Context menu module
 * Handles right-click context menu for tasks
 */

import { escapeHtml } from '../../dom-utils.js';

export class ContextMenuManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.contextMenuTaskId = null;
        this.longPressTimer = null;
    }

    /**
     * Setup context menu functionality
     */
    setupContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        if (!contextMenu) return;

        // Close context menu on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });

        // Context menu item clicks
        contextMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.context-menu-item');
            if (!menuItem) return;

            const action = menuItem.dataset.action;
            const taskId = this.contextMenuTaskId;

            if (!taskId) return;

            e.preventDefault();
            e.stopPropagation();

            this.handleContextMenuAction(action, menuItem.dataset, taskId);
            this.hideContextMenu();
        });

        // Add right-click handler to task container
        document.addEventListener('contextmenu', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                e.preventDefault();
                const taskId = taskItem.dataset.taskId;
                this.showContextMenu(e, taskId);
            }
        });

        // Long-press for mobile - improved implementation
        let touchStartPos = null;

        document.addEventListener('touchstart', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem && e.touches.length > 0) {
                // Store touch position for later use
                touchStartPos = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };

                this.longPressTimer = setTimeout(() => {
                    // Check if we're still on the same task item
                    const currentTaskItem = document.elementFromPoint(touchStartPos.x, touchStartPos.y)?.closest('.task-item');
                    if (currentTaskItem && currentTaskItem.dataset.taskId === taskItem.dataset.taskId) {
                        const taskId = taskItem.dataset.taskId;
                        // Create a synthetic event object with the stored coordinates
                        const syntheticEvent = {
                            clientX: touchStartPos.x,
                            clientY: touchStartPos.y,
                            preventDefault: () => {}
                        };
                        this.showContextMenu(syntheticEvent, taskId);
                    }
                    touchStartPos = null;
                }, 500);
            }
        }, { passive: true }); // Use passive for better scroll performance

        document.addEventListener('touchend', (e) => {
            clearTimeout(this.longPressTimer);
            touchStartPos = null;
        });

        document.addEventListener('touchmove', (e) => {
            // Clear timer if moved too much (to prevent accidental triggers during scroll)
            if (touchStartPos && e.touches.length > 0) {
                const moveX = Math.abs(e.touches[0].clientX - touchStartPos.x);
                const moveY = Math.abs(e.touches[0].clientY - touchStartPos.y);
                // Allow small movements but cancel if moved more than 10px
                if (moveX > 10 || moveY > 10) {
                    clearTimeout(this.longPressTimer);
                    touchStartPos = null;
                }
            }
        }, { passive: true });
    }

    /**
     * Show context menu at position
     */
    showContextMenu(event, taskId) {
        const contextMenu = document.getElementById('context-menu');
        if (!contextMenu) return;

        this.contextMenuTaskId = taskId;

        // Populate projects submenu
        this.populateContextMenuProjects();

        // Populate context submenus
        this.populateAddContextMenu(taskId);
        this.populateRemoveContextMenu(taskId);

        // Position menu
        const x = event.clientX || event.pageX;
        const y = event.clientY || event.pageY;

        contextMenu.style.display = 'block';

        // Ensure menu stays within viewport
        const rect = contextMenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let posX = x;
        let posY = y;

        if (posX + rect.width > viewportWidth) {
            posX = viewportWidth - rect.width - 10;
        }

        if (posY + rect.height > viewportHeight) {
            posY = viewportHeight - rect.height - 10;
        }

        contextMenu.style.left = posX + 'px';
        contextMenu.style.top = posY + 'px';

        // Update star button text
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task) {
            const starItem = contextMenu.querySelector('[data-action="toggle-star"]');
            if (starItem) {
                starItem.innerHTML = task.starred
                    ? '<i class="fas fa-star" style="color: gold;"></i> Unstar'
                    : '<i class="far fa-star"></i> Star';
            }
        }
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
        this.contextMenuTaskId = null;
    }

    /**
     * Populate projects submenu in context menu
     */
    populateContextMenuProjects() {
        const submenu = document.getElementById('context-menu-projects');
        if (!submenu) return;

        // Clear existing items
        submenu.innerHTML = '<div class="context-menu-item" data-action="set-project" data-project=""><i class="fas fa-times-circle"></i> No Project</div>';

        // Add projects
        this.state.projects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.dataset.action = 'set-project';
            item.dataset.project = project.id;

            // Safe DOM creation (no innerHTML)
            const icon = document.createElement('i');
            icon.className = 'fas fa-folder';
            item.appendChild(icon);

            const text = document.createTextNode(' ' + project.title); // Safe: textContent escapes HTML
            item.appendChild(text);

            submenu.appendChild(item);
        });
    }

    /**
     * Handle context menu action
     */
    async handleContextMenuAction(action, data, taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        switch (action) {
            case 'edit':
                this.app.openTaskModal?.(task);
                break;

            case 'duplicate':
                await this.app.duplicateTask?.(taskId);
                break;

            case 'save-as-template':
                this.app.saveTaskAsTemplate?.(taskId);
                break;

            case 'toggle-star':
                this.app.saveState?.('Toggle task star');
                task.toggleStar();
                await this.app.saveTasks?.();
                this.app.renderView?.();
                this.app.showToast?.(task.starred ? 'Task starred' : 'Task unstarred');
                break;

            case 'set-status':
                this.app.saveState?.('Change task status');
                task.status = data.status;
                task.updatedAt = new Date().toISOString();
                await this.app.saveTasks?.();
                this.app.renderView?.();
                this.app.updateCounts?.();
                this.app.showToast?.(`Status changed to ${data.status}`);
                break;

            case 'set-energy':
                this.app.saveState?.('Change task energy');
                task.energy = data.energy;
                task.updatedAt = new Date().toISOString();
                await this.app.saveTasks?.();
                this.app.renderView?.();
                this.app.showToast?.(`Energy changed to ${data.energy || 'none'}`);
                break;

            case 'set-project':
                const projectId = data.project || null;
                this.app.saveState?.('Change task project');
                task.projectId = projectId;
                task.updatedAt = new Date().toISOString();
                await this.app.saveTasks?.();
                this.app.renderView?.();
                this.app.showToast?.(projectId ? 'Moved to project' : 'Removed from project');
                break;

            case 'add-context':
                const contextToAdd = data.context;
                if (contextToAdd) {
                    this.app.saveState?.('Add context to task');
                    task.contexts = task.contexts || [];
                    if (!task.contexts.includes(contextToAdd)) {
                        task.contexts.push(contextToAdd);
                        task.updatedAt = new Date().toISOString();
                        await this.app.saveTasks?.();
                        this.app.renderView?.();
                        this.app.showToast?.(`Added ${contextToAdd}`);
                    }
                }
                break;

            case 'remove-context':
                const contextToRemove = data.context;
                if (contextToRemove && task.contexts) {
                    this.app.saveState?.('Remove context from task');
                    const index = task.contexts.indexOf(contextToRemove);
                    if (index > -1) {
                        task.contexts.splice(index, 1);
                        task.updatedAt = new Date().toISOString();
                        await this.app.saveTasks?.();
                        this.app.renderView?.();
                        this.app.showToast?.(`Removed ${contextToRemove}`);
                    }
                }
                break;

            case 'complete':
                await this.app.toggleTaskComplete?.(taskId);
                break;

            case 'archive':
                await this.app.archiveTask?.(taskId);
                break;

            case 'delete':
                await this.app.deleteTask?.(taskId);
                break;
        }
    }

    /**
     * Populate "Add Context" submenu with available contexts
     */
    populateAddContextMenu(taskId) {
        const submenu = document.getElementById('context-menu-add-context');
        if (!submenu) return;

        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const usedContexts = task.contexts || [];
        const allContexts = [...this.state.defaultContexts, ...this.getCustomContexts()];
        const availableContexts = allContexts.filter(c => !usedContexts.includes(c));

        // Clear existing items
        submenu.innerHTML = '';

        if (availableContexts.length === 0) {
            const item = document.createElement('div');
            item.className = 'context-menu-item context-menu-disabled';
            item.textContent = 'No contexts available';
            submenu.appendChild(item);
            return;
        }

        // Add available contexts
        availableContexts.forEach(context => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.dataset.action = 'add-context';
            item.dataset.context = context;

            // Safe DOM creation
            const icon = document.createElement('i');
            icon.className = 'fas fa-tag';
            item.appendChild(icon);

            const text = document.createTextNode(' ' + context);
            item.appendChild(text);

            submenu.appendChild(item);
        });
    }

    /**
     * Populate "Remove Context" submenu with task's current contexts
     */
    populateRemoveContextMenu(taskId) {
        const submenu = document.getElementById('context-menu-remove-context');
        if (!submenu) return;

        const task = this.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const contexts = task.contexts || [];

        // Clear existing items
        submenu.innerHTML = '';

        if (contexts.length === 0) {
            const item = document.createElement('div');
            item.className = 'context-menu-item context-menu-disabled';
            item.textContent = 'No contexts to remove';
            submenu.appendChild(item);
            return;
        }

        // Add task's contexts
        contexts.forEach(context => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.dataset.action = 'remove-context';
            item.dataset.context = context;

            // Safe DOM creation
            const icon = document.createElement('i');
            icon.className = 'fas fa-eraser';
            item.appendChild(icon);

            const text = document.createTextNode(' ' + context);
            item.appendChild(text);

            submenu.appendChild(item);
        });
    }

    /**
     * Get custom contexts from localStorage
     * @returns {Array} Array of custom context names
     */
    getCustomContexts() {
        const tags = localStorage.getItem('gtd_custom_contexts');
        return tags ? JSON.parse(tags) : [];
    }

    /**
     * Get current context menu task ID
     * @returns {string|null}
     */
    getContextMenuTaskId() {
        return this.contextMenuTaskId;
    }

    /**
     * Check if context menu is visible
     * @returns {boolean}
     */
    isContextMenuVisible() {
        const contextMenu = document.getElementById('context-menu');
        return contextMenu ? contextMenu.style.display === 'block' : false;
    }
}
