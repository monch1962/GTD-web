/**
 * Templates module
 * Handles task/project templates for repetitive tasks
 *
 * Features:
 * - Create, edit, delete templates
 * - Organize templates by category
 * - Create tasks from templates
 * - Save tasks as templates
 * - Template contexts and subtasks management
 *
 * @example
 * const templates = new TemplatesManager(state, app);
 * templates.setupTemplates();
 * templates.openTemplatesModal();
 * await templates.createTaskFromTemplate('template-123');
 */

import { escapeHtml } from '../../dom-utils'
import type { AppState, AppDependencies } from '../../types'
import { Template } from '../../models'
import type { TemplateData, TemplateCategory, EnergyLevel } from '../../models'

interface TemplateCategoryInfo {
    label: string
    icon: string
    templates: Template[]
}

export class TemplatesManager {
    private state: AppState
    private app: AppDependencies

    constructor (state: AppState, app: AppDependencies) {
        this.state = state
        this.app = app
    }

    /**
     * Setup templates functionality
     */
    setupTemplates (): void {
        // Templates button in sidebar
        const templatesBtn = document.getElementById('templates-button')
        if (templatesBtn) {
            templatesBtn.addEventListener('click', (e) => {
                e.preventDefault()
                this.openTemplatesModal()
            })
        }

        // Close templates modal
        const closeTemplatesBtn = document.getElementById('close-templates-modal')
        if (closeTemplatesBtn) {
            closeTemplatesBtn.addEventListener('click', () => this.closeTemplatesModal())
        }

        // Create template button
        const createTemplateBtn = document.getElementById('btn-create-template')
        if (createTemplateBtn) {
            createTemplateBtn.addEventListener('click', () => this.openTemplateEditModal())
        }

        // Close template edit modal
        const closeTemplateEditBtn = document.getElementById('close-template-edit-modal')
        if (closeTemplateEditBtn) {
            closeTemplateEditBtn.addEventListener('click', () => this.closeTemplateEditModal())
        }

        const cancelTemplateBtn = document.getElementById('cancel-template-modal')
        if (cancelTemplateBtn) {
            cancelTemplateBtn.addEventListener('click', () => this.closeTemplateEditModal())
        }

        // Template form submission
        const templateForm = document.getElementById('template-form')
        if (templateForm) {
            templateForm.addEventListener('submit', (e) => this.handleTemplateFormSubmit(e))
        }

        // Add subtask button
        const addSubtaskBtn = document.getElementById('btn-add-template-subtask')
        if (addSubtaskBtn) {
            addSubtaskBtn.addEventListener('click', () => this.addTemplateSubtask())
        }
    }

    /**
     * Open templates list modal
     */
    openTemplatesModal (): void {
        // First, make sure the edit modal is closed
        this.closeTemplateEditModal()

        const modal = document.getElementById('templates-modal')
        if (modal) {
            modal.classList.add('active')
            this.renderTemplatesList()
        }
    }

    /**
     * Close templates list modal
     */
    closeTemplatesModal (): void {
        const modal = document.getElementById('templates-modal')
        if (modal) {
            modal.classList.remove('active')
        }
    }

    /**
     * Open template edit modal
     */
    openTemplateEditModal (templateId: string | null = null): void {
        // First, make sure the templates list modal is closed
        this.closeTemplatesModal()

        const modal = document.getElementById('template-edit-modal')
        const title = document.getElementById('template-modal-title')

        if (modal) {
            modal.classList.add('active')

            if (templateId) {
                // Edit existing template
                const template = this.state.templates.find((t) => t.id === templateId)
                if (template) {
                    if (title) title.textContent = 'Edit Template'
                    const idInput = document.getElementById('template-id') as HTMLInputElement
                    const titleInput = document.getElementById('template-title') as HTMLInputElement
                    const descInput = document.getElementById(
                        'template-description'
                    ) as HTMLTextAreaElement
                    const energyInput = document.getElementById(
                        'template-energy'
                    ) as HTMLSelectElement
                    const timeInput = document.getElementById('template-time') as HTMLInputElement
                    const categoryInput = document.getElementById(
                        'template-category'
                    ) as HTMLSelectElement
                    const notesInput = document.getElementById(
                        'template-notes'
                    ) as HTMLTextAreaElement

                    if (idInput) idInput.value = template.id
                    if (titleInput) titleInput.value = template.title
                    if (descInput) descInput.value = template.description
                    if (energyInput) energyInput.value = template.energy
                    if (timeInput) timeInput.value = template.time.toString()
                    if (categoryInput) categoryInput.value = template.category
                    if (notesInput) notesInput.value = template.notes

                    // Render contexts and subtasks
                    this.renderTemplateContexts(template.contexts)
                    this.renderTemplateSubtasks(template.subtasks)
                }
            } else {
                // Create new template
                if (title) title.textContent = 'Create Template'
                const form = document.getElementById('template-form') as HTMLFormElement
                if (form) form.reset()
                const idInput = document.getElementById('template-id') as HTMLInputElement
                if (idInput) idInput.value = ''
                this.renderTemplateContexts([])
                this.renderTemplateSubtasks([])
            }
        }
    }

    /**
     * Close template edit modal
     */
    closeTemplateEditModal (): void {
        const modal = document.getElementById('template-edit-modal')
        if (modal) {
            modal.classList.remove('active')
        }
    }

    /**
     * Handle template form submission
     */
    async handleTemplateFormSubmit (e: Event): Promise<void> {
        e.preventDefault()

        const idInput = document.getElementById('template-id') as HTMLInputElement
        const titleInput = document.getElementById('template-title') as HTMLInputElement
        const descInput = document.getElementById('template-description') as HTMLTextAreaElement
        const energyInput = document.getElementById('template-energy') as HTMLSelectElement
        const timeInput = document.getElementById('template-time') as HTMLInputElement
        const categoryInput = document.getElementById('template-category') as HTMLSelectElement
        const notesInput = document.getElementById('template-notes') as HTMLTextAreaElement

        const templateId = idInput ? idInput.value : ''
        const templateData: TemplateData = {
            title: titleInput ? titleInput.value : '',
            description: descInput ? descInput.value : '',
            energy: energyInput ? (energyInput.value as EnergyLevel) : '',
            time: timeInput ? parseInt(timeInput.value) || 0 : 0,
            category: categoryInput ? (categoryInput.value as TemplateCategory) : 'general',
            contexts: this.getSelectedTemplateContexts(),
            notes: notesInput ? notesInput.value : '',
            subtasks: this.getTemplateSubtasks()
        }

        this.app.saveState?.(templateId ? 'Edit template' : 'Create template')

        if (templateId) {
            // Update existing template
            const template = this.state.templates.find((t) => t.id === templateId)
            if (template) {
                Object.assign(template, templateData)
                template.updatedAt = new Date().toISOString()
            }
        } else {
            // Create new template
            const newTemplate = new Template(templateData)
            this.state.templates.push(newTemplate)
        }

        await this.app.saveTemplates?.()
        this.closeTemplateEditModal()

        // Open the templates modal to show the list with the new template
        this.openTemplatesModal()

        this.app.updateCounts?.()
        this.app.showNotification?.(templateId ? 'Template updated' : 'Template created')
    }

    /**
     * Delete a template
     */
    async deleteTemplate (templateId: string): Promise<void> {
        if (!confirm('Are you sure you want to delete this template?')) return

        this.app.saveState?.('Delete template')
        this.state.templates = this.state.templates.filter((t) => t.id !== templateId)
        await this.app.saveTemplates?.()
        this.renderTemplatesList()
        this.app.updateCounts?.()
        this.app.showNotification?.('Template deleted')
    }

    /**
     * Save task as a template
     */
    saveTaskAsTemplate (taskId: string): void {
        const task = this.state.tasks.find((t) => t.id === taskId)
        if (!task) return

        // Prepare the template data
        const templateData: TemplateData = {
            title: task.title || '',
            description: task.description || '',
            energy: task.energy || '',
            time: task.time || 0,
            category: 'general',
            notes: task.notes || '',
            contexts: task.contexts || [],
            subtasks: task.subtasks || []
        }

        // Open template edit modal with task data pre-filled
        this.openTemplateEditModalWithData(templateData)

        this.app.showNotification?.('Template pre-filled from task - modify and save')
    }

    /**
     * Open template edit modal with pre-filled data
     */
    openTemplateEditModalWithData (templateData: TemplateData): void {
        // First, make sure the templates list modal is closed
        this.closeTemplatesModal()

        const modal = document.getElementById('template-edit-modal')
        const title = document.getElementById('template-modal-title')

        if (modal) {
            modal.classList.add('active')

            // Set title for new template
            if (title) title.textContent = 'Create Template'

            // Clear the template-id field (this is a new template)
            const idInput = document.getElementById('template-id') as HTMLInputElement
            if (idInput) idInput.value = ''

            // Populate form with provided data
            const titleInput = document.getElementById('template-title') as HTMLInputElement
            const descInput = document.getElementById('template-description') as HTMLTextAreaElement
            const energyInput = document.getElementById('template-energy') as HTMLSelectElement
            const timeInput = document.getElementById('template-time') as HTMLInputElement
            const categoryInput = document.getElementById('template-category') as HTMLSelectElement
            const notesInput = document.getElementById('template-notes') as HTMLTextAreaElement

            if (titleInput) titleInput.value = templateData.title || ''
            if (descInput) descInput.value = templateData.description || ''
            if (energyInput) energyInput.value = templateData.energy || ''
            if (timeInput) timeInput.value = (templateData.time || 0).toString()
            if (categoryInput) categoryInput.value = templateData.category || 'general'
            if (notesInput) notesInput.value = templateData.notes || ''

            // Render contexts and subtasks
            this.renderTemplateContexts(templateData.contexts || [])
            this.renderTemplateSubtasks(templateData.subtasks || [])
        }
    }

    /**
     * Create task from template
     */
    async createTaskFromTemplate (templateId: string): Promise<void> {
        const template = this.state.templates.find((t) => t.id === templateId)
        if (!template) return

        const task = template.createTask()
        this.state.tasks.push(task)
        await this.app.saveTasks?.()
        this.closeTemplatesModal()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.showNotification?.('Task created from template')
    }

    /**
     * Render templates list grouped by category
     */
    renderTemplatesList (): void {
        const container = document.getElementById('templates-list')
        if (!container) return

        if (this.state.templates.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--spacing-xl); color: var(--text-secondary);">
                    <i class="fas fa-copy" style="font-size: 3rem; margin-bottom: var(--spacing-md); opacity: 0.3;"></i>
                    <p>No templates yet</p>
                    <p style="font-size: 0.9rem;">Create templates for repetitive tasks</p>
                </div>
            `
            return
        }

        // Group templates by category
        const categories: Record<string, TemplateCategoryInfo> = {
            general: { label: 'General', icon: 'fa-folder', templates: [] },
            work: { label: 'Work', icon: 'fa-briefcase', templates: [] },
            personal: { label: 'Personal', icon: 'fa-user', templates: [] },
            meeting: { label: 'Meeting', icon: 'fa-users', templates: [] },
            checklist: { label: 'Checklist', icon: 'fa-tasks', templates: [] }
        }

        this.state.templates.forEach((template) => {
            if (categories[template.category]) {
                categories[template.category].templates.push(template)
            }
        })

        let html = ''
        for (const [_key, category] of Object.entries(categories)) {
            if (category.templates.length === 0) continue

            html += `
                <div class="template-category" style="margin-bottom: var(--spacing-lg);">
                    <h3 style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); color: var(--primary-color);">
                        <i class="fas ${category.icon}"></i>
                        ${category.label}
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--spacing-md);">
            `

            category.templates.forEach((template) => {
                html += `
                    <div class="template-card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--spacing-md);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-sm);">
                            <h4 style="margin: 0; flex: 1;">${escapeHtml(template.title)}</h4>
                            <div class="template-actions" style="display: flex; gap: var(--spacing-xs);">
                                <button class="btn btn-sm btn-secondary" onclick="app.editTemplate('${template.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="app.deleteTemplate('${template.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        ${template.description ? `<p style="color: var(--text-secondary); margin: var(--spacing-xs) 0; font-size: 0.9rem;">${escapeHtml(template.description)}</p>` : ''}
                        <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-xs); margin-bottom: var(--spacing-sm);">
                            ${template.energy ? `<span class="badge" style="background: var(--energy-high);">${template.energy}</span>` : ''}
                            ${template.time ? `<span class="badge" style="background: var(--info-color);"><i class="fas fa-clock"></i> ${template.time}m</span>` : ''}
                            ${template.contexts.map((ctx) => `<span class="badge" style="background: var(--context-color);">${escapeHtml(ctx)}</span>`).join('')}
                        </div>
                        ${template.subtasks.length > 0 ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--spacing-sm);"><i class="fas fa-check-square"></i> ${template.subtasks.length} subtasks</div>` : ''}
                        <button class="btn btn-primary" style="width: 100%;" onclick="app.createTaskFromTemplate('${template.id}')">
                            <i class="fas fa-plus"></i> Create Task
                        </button>
                    </div>
                `
            })

            html += `
                    </div>
                </div>
            `
        }

        container.innerHTML = html
    }

    /**
     * Edit template
     */
    editTemplate (templateId: string): void {
        this.openTemplateEditModal(templateId)
    }

    /**
     * Render template contexts selection
     */
    renderTemplateContexts (selectedContexts: string[] = []): void {
        const container = document.getElementById('template-contexts-container')
        if (!container) return

        const allContexts = [...this.state.defaultContexts, ...this.getCustomContexts()]

        container.innerHTML = allContexts
            .map((context) => {
                const isSelected = selectedContexts.includes(context)
                return `
                <button type="button" class="context-btn ${isSelected ? 'active' : ''}" data-context="${escapeHtml(context)}">
                    ${escapeHtml(context)}
                </button>
            `
            })
            .join('')

        // Add click handlers
        container.querySelectorAll('.context-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active')
            })
        })
    }

    /**
     * Get selected template contexts
     */
    getSelectedTemplateContexts (): string[] {
        const container = document.getElementById('template-contexts-container')
        if (!container) return []

        const activeBtns = container.querySelectorAll('.context-btn.active')
        return Array.from(activeBtns).map((btn) => btn.getAttribute('data-context') || '')
    }

    /**
     * Render template subtasks
     */
    renderTemplateSubtasks (subtasks: Array<{ title: string; completed: boolean }> = []): void {
        const container = document.getElementById('template-subtasks-container')
        if (!container) return

        container.innerHTML = subtasks
            .map(
                (subtask, index) => `
            <div class="subtask-item" style="display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs); align-items: center;">
                <input type="text" class="form-control" value="${escapeHtml(subtask.title)}" data-index="${index}" placeholder="Subtask title">
                <button type="button" class="btn btn-secondary btn-sm" onclick="app.removeTemplateSubtask(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `
            )
            .join('')
    }

    /**
     * Add a subtask to template
     */
    addTemplateSubtask (): void {
        const container = document.getElementById('template-subtasks-container')
        if (!container) return

        const index = container.children.length
        const div = document.createElement('div')
        div.className = 'subtask-item'
        div.style.cssText =
            'display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs); align-items: center;'
        div.innerHTML = `
            <input type="text" class="form-control" data-index="${index}" placeholder="Subtask title">
            <button type="button" class="btn btn-secondary btn-sm" onclick="app.removeTemplateSubtask(${index})">
                <i class="fas fa-times"></i>
            </button>
        `
        container.appendChild(div)
        const input = div.querySelector('input') as HTMLInputElement
        if (input) input.focus()
    }

    /**
     * Remove a subtask from template
     */
    removeTemplateSubtask (index: number): void {
        const container = document.getElementById('template-subtasks-container')
        if (!container) return

        const items = container.querySelectorAll('.subtask-item')
        if (items[index]) {
            items[index].remove()
            // Reindex remaining items
            container.querySelectorAll('.subtask-item input').forEach((input, i) => {
                input.setAttribute('data-index', i.toString())
                const button = input.nextElementSibling as HTMLButtonElement
                if (button) button.setAttribute('onclick', `app.removeTemplateSubtask(${i})`)
            })
        }
    }

    /**
     * Get template subtasks from form
     */
    getTemplateSubtasks (): Array<{ title: string; completed: boolean }> {
        const container = document.getElementById('template-subtasks-container')
        if (!container) return []

        const items = container.querySelectorAll('.subtask-item input')
        return Array.from(items)
            .map((input) => (input as HTMLInputElement).value.trim())
            .filter((title) => title)
            .map((title) => ({ title, completed: false }))
    }

    /**
     * Get custom contexts from localStorage
     * @returns Array of custom context names
     */
    getCustomContexts (): string[] {
        const tags = localStorage.getItem('gtd_custom_contexts')
        return tags ? JSON.parse(tags) : []
    }

    /**
     * Get templates by category
     * @param category - Category to filter by
     * @returns Array of templates
     */
    getTemplatesByCategory (category: TemplateCategory): Template[] {
        return this.state.templates.filter((t) => t.category === category)
    }

    /**
     * Search templates by title/description
     * @param query - Search query
     * @returns Array of matching templates
     */
    searchTemplates (query: string): Template[] {
        const lowerQuery = query.toLowerCase()
        return this.state.templates.filter(
            (t) =>
                t.title.toLowerCase().includes(lowerQuery) ||
                (t.description && t.description.toLowerCase().includes(lowerQuery))
        )
    }
}
