/**
 * ============================================================================
 * Global Quick Capture Manager
 * ============================================================================
 *
 * Manages the global quick capture feature for instant task creation
 * from anywhere in the application using Alt+N hotkey.
 *
 * This manager handles:
 * - Alt+N hotkey listener for global access
 * - Overlay display/hide functionality
 * - NLP input parsing (contexts, energy, projects, dates)
 * - Template selection and task creation
 * - Escape key and click-outside-to-close behavior
 */

import { Task } from '../../models'
import { escapeHtml } from '../../dom-utils'
import type { Template } from '../../models'

interface State {
    tasks: Task[]
    templates: Template[]
    projects: Array<{ id: string; title: string }>
}

interface App {
    saveTasks?: () => Promise<void> | void
    renderView?: () => void
    updateCounts?: () => void
    showToast?: (message: string) => void
    saveState?: (description: string) => void
    selectTemplateForQuickCapture?: (templateId: string) => void
}

export class GlobalQuickCaptureManager {
    private state: State
    private app: App

    constructor (state: State, app: App) {
        this.state = state
        this.app = app
    }

    // =========================================================================
    // SETUP
    // =========================================================================

    /**
     * Setup the global quick capture feature
     */
    setupGlobalQuickCapture (): void {
        // Global hotkey listener (Alt+N)
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'n') {
                e.preventDefault()
                this.openGlobalQuickCapture()
            }
        })

        // Close overlay
        const closeBtn = document.getElementById('close-global-quick-capture')
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeGlobalQuickCapture())
        }

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('global-quick-capture-overlay')
                if (overlay && overlay.style.display !== 'none') {
                    this.closeGlobalQuickCapture()
                }
            }
        })

        // Handle input
        const input = document.getElementById('global-quick-capture-input')
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && (input as HTMLInputElement).value.trim()) {
                    this.handleGlobalQuickCapture((input as HTMLInputElement).value.trim())
                }
            })

            input.addEventListener('keydown', (e) => {
                // Press T to show templates
                if (e.key === 't' || e.key === 'T') {
                    e.preventDefault()
                    this.toggleQuickCaptureTemplates()
                }
            })
        }

        // Close on overlay click
        const overlay = document.getElementById('global-quick-capture-overlay')
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeGlobalQuickCapture()
                }
            })
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Open the global quick capture overlay
     */
    openGlobalQuickCapture (): void {
        const overlay = document.getElementById('global-quick-capture-overlay')
        if (overlay) {
            overlay.style.display = 'flex'
            const input = document.getElementById('global-quick-capture-input')
            if (input) {
                ;(input as HTMLInputElement).value = ''
                ;(input as HTMLInputElement).focus()
            }
            // Hide templates initially
            const templates = document.getElementById('global-quick-capture-templates')
            if (templates) {
                templates.style.display = 'none'
            }
        }
    }

    /**
     * Close the global quick capture overlay
     */
    closeGlobalQuickCapture (): void {
        const overlay = document.getElementById('global-quick-capture-overlay')
        if (overlay) {
            overlay.style.display = 'none'
        }
    }

    /**
     * Handle quick capture input and create task
     * @param input - User input text
     */
    handleGlobalQuickCapture (input: string): void {
        // Parse the input with enhanced NLP
        const taskData = this.parseQuickCaptureInput(input)

        // Create the task
        const task = new Task(taskData)
        this.state.tasks.unshift(task)

        // Persist changes
        this.app.saveTasks?.()
        this.app.renderView?.()
        this.app.updateCounts?.()

        this.closeGlobalQuickCapture()
        this.app.showToast?.('Task captured!')

        // Save state for undo
        this.app.saveState?.('Quick capture task')
    }

    /**
     * Toggle quick capture templates visibility
     */
    toggleQuickCaptureTemplates (): void {
        const templatesDiv = document.getElementById('global-quick-capture-templates')
        const listDiv = document.getElementById('global-quick-capture-templates-list')

        if (!templatesDiv || !listDiv) return

        if (templatesDiv.style.display === 'none') {
            // Render templates
            this.renderQuickCaptureTemplates(listDiv)
            templatesDiv.style.display = 'block'
        } else {
            templatesDiv.style.display = 'none'
        }
    }

    /**
     * Select a template and create task from it
     * @param templateId - ID of template to use
     */
    selectTemplateForQuickCapture (templateId: string): void {
        const template = this.state.templates.find((t) => t.id === templateId)
        if (!template) return

        // Create task from template
        const task = template.createTask()
        this.state.tasks.unshift(task)

        // Persist changes
        this.app.saveTasks?.()
        this.app.renderView?.()
        this.app.updateCounts?.()

        this.closeGlobalQuickCapture()
        this.app.showToast?.(`Created task from template: ${template.title}`)
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    /**
     * Parse quick capture input with NLP
     * @param input - Raw user input
     * @returns Parsed task data
     */
    private parseQuickCaptureInput (input: string): Record<string, any> {
        const taskData: Record<string, any> = {
            title: input,
            status: 'inbox'
        }

        // Extract contexts (@work, @home, etc.)
        const contextMatches = input.match(/@(\w+)/g)
        if (contextMatches) {
            taskData.contexts = contextMatches.map((c) => (c.startsWith('@') ? c : '@' + c))
            taskData.title = input.replace(/@\w+/g, '').trim()
        }

        // Extract energy (!high, !medium, !low)
        const energyMatch = input.match(/!(high|medium|low)/i)
        if (energyMatch) {
            taskData.energy = energyMatch[1].toLowerCase()
            taskData.title = taskData.title.replace(/!high|!medium|!low/gi, '').trim()
        }

        // Extract project (#projectname)
        const projectMatch = input.match(/#(\w+)/)
        if (projectMatch) {
            const projectName = projectMatch[1]
            const project = this.state.projects.find(
                (p) => p.title.toLowerCase() === projectName.toLowerCase()
            )
            if (project) {
                taskData.projectId = project.id
            }
            taskData.title = taskData.title.replace(/#\w+/g, '').trim()
        }

        // Extract dates (today, tomorrow, in X days)
        const lowerTitle = taskData.title.toLowerCase()

        if (lowerTitle.includes('today') || lowerTitle.includes('due today')) {
            taskData.dueDate = new Date().toISOString().split('T')[0]
            taskData.title = taskData.title.replace(/today|due today/gi, '').trim()
        } else if (lowerTitle.includes('tomorrow') || lowerTitle.includes('due tomorrow')) {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            taskData.dueDate = tomorrow.toISOString().split('T')[0]
            taskData.title = taskData.title.replace(/tomorrow|due tomorrow/gi, '').trim()
        }

        // Extract "in X days"
        const inDaysMatch = lowerTitle.match(/in\s+(\d+)\s+days?/)
        if (inDaysMatch) {
            const days = parseInt(inDaysMatch[1])
            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + days)
            taskData.dueDate = targetDate.toISOString().split('T')[0]
            taskData.title = taskData.title.replace(/in\s+\d+\s+days?/gi, '').trim()
        }

        return taskData
    }

    /**
     * Render quick capture templates list
     * @param container - Container element
     */
    private renderQuickCaptureTemplates (container: HTMLElement): void {
        if (this.state.templates.length === 0) {
            container.innerHTML =
                '<p style="color: var(--text-secondary);">No templates available. Create some in the Templates modal!</p>'
            return
        }

        container.innerHTML = this.state.templates
            .map(
                (template) => `
            <button onclick="app.selectTemplateForQuickCapture('${template.id}')">
                <h4>${escapeHtml(template.title)}</h4>
                ${template.description ? `<p>${escapeHtml(template.description)}</p>` : ''}
                <div style="margin-top: var(--spacing-xs); font-size: 0.75rem; color: var(--text-secondary);">
                    ${template.category ? `<span style="background: var(--primary-color); color: white; padding: 2px 6px; border-radius: 4px;">${template.category}</span>` : ''}
                </div>
            </button>
        `
            )
            .join('')
    }
}
