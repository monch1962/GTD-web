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

        // Long-press for mobile
        document.addEventListener('touchstart', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                this.longPressTimer = setTimeout(() => {
                    const taskId = taskItem.dataset.taskId;
                    this.showContextMenu(e.touches[0], taskId);
                }, 500);
            }
        });

        document.addEventListener('touchend', () => {
            clearTimeout(this.longPressTimer);
        });

        document.addEventListener('touchmove', () => {
            clearTimeout(this.longPressTimer);
        });
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
            item.innerHTML = `<i class="fas fa-folder"></i> ${escapeHtml(project.title)}`;
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
                this.app.showNotification?.(task.starred ? 'Task starred' : 'Task unstarred');
                break;

            case 'set-status':
                this.app.saveState?.('Change task status');
                task.status = data.status;
                task.updatedAt = new Date().toISOString();
                await this.app.saveTasks?.();
                this.app.renderView?.();
                this.app.updateCounts?.();
                this.app.showNotification?.(`Status changed to ${data.status}`);
                break;

            case 'set-energy':
                this.app.saveState?.('Change task energy');
                task.energy = data.energy;
                task.updatedAt = new Date().toISOString();
                await this.app.saveTasks?.();
                this.app.renderView?.();
                this.app.showNotification?.(`Energy changed to ${data.energy || 'none'}`);
                break;

            case 'set-project':
                const projectId = data.project || null;
                this.app.saveState?.('Change task project');
                task.projectId = projectId;
                task.updatedAt = new Date().toISOString();
                await this.app.saveTasks?.();
                this.app.renderView?.();
                this.app.showNotification?.(projectId ? 'Moved to project' : 'Removed from project');
                break;

            case 'add-context':
                this.addContextFromMenu(task);
                break;

            case 'remove-context':
                this.removeContextFromMenu(task);
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
     * Add context to task from context menu
     */
    async addContextFromMenu(task) {
        const allContexts = [...this.state.defaultContexts, ...this.getCustomContexts()];
        const usedContexts = task.contexts || [];
        const availableContexts = allContexts.filter(c => !usedContexts.includes(c));

        if (availableContexts.length === 0) {
            this.app.showNotification?.('No more contexts to add');
            return;
        }

        // Simple prompt for now (could be improved with a custom modal)
        const context = prompt(`Enter context name or choose from:\n${availableContexts.join(', ')}`);

        if (!context) return;

        this.app.saveState?.('Add context to task');
        const formattedContext = context.startsWith('@') ? context : `@${context}`;
        task.contexts = task.contexts || [];
        task.contexts.push(formattedContext);
        task.updatedAt = new Date().toISOString();

        await this.app.saveTasks?.();
        this.app.renderView?.();
        this.app.showNotification?.(`Added ${formattedContext}`);
    }

    /**
     * Remove context from task from context menu
     */
    async removeContextFromMenu(task) {
        const contexts = task.contexts || [];
        if (contexts.length === 0) {
            this.app.showNotification?.('No contexts to remove');
            return;
        }

        // Simple prompt for now
        const contextList = contexts.map((c, i) => `${i + 1}. ${c}`).join('\n');
        const choice = prompt(`Enter number of context to remove:\n${contextList}`);

        if (!choice) return;

        const index = parseInt(choice) - 1;
        if (index >= 0 && index < contexts.length) {
            this.app.saveState?.('Remove context from task');
            const removed = task.contexts.splice(index, 1)[0];
            task.updatedAt = new Date().toISOString();
            await this.app.saveTasks?.();
            this.app.renderView?.();
            this.app.showNotification?.(`Removed ${removed}`);
        } else {
            this.app.showNotification?.('Invalid choice');
        }
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
