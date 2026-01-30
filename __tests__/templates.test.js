/**
 * Comprehensive Tests for Templates System Feature
 * Tests all Templates System functionality before modularization
 */

import { GTDApp } from '../js/app.js'
import { Task, Template } from '../js/models'

describe('Templates System Feature - Comprehensive Tests', () => {
    let app

    beforeEach(() => {
        localStorage.clear()

        // Create templates modal elements
        let templatesModal = document.getElementById('templates-modal')
        if (!templatesModal) {
            templatesModal = document.createElement('div')
            templatesModal.id = 'templates-modal'
            templatesModal.className = 'modal'
            document.body.appendChild(templatesModal)

            const list = document.createElement('div')
            list.id = 'templates-list'
            templatesModal.appendChild(list)
        }

        let templateEditModal = document.getElementById('template-edit-modal')
        if (!templateEditModal) {
            templateEditModal = document.createElement('div')
            templateEditModal.id = 'template-edit-modal'
            templateEditModal.className = 'modal'
            document.body.appendChild(templateEditModal)
        }

        // Create buttons
        const buttons = [
            { id: 'templates-button' },
            { id: 'close-templates-modal' },
            { id: 'btn-create-template' },
            { id: 'close-template-edit-modal' },
            { id: 'cancel-template-modal' },
            { id: 'btn-add-template-subtask' }
        ]

        buttons.forEach((btnConfig) => {
            let btn = document.getElementById(btnConfig.id)
            if (!btn) {
                btn = document.createElement('button')
                btn.id = btnConfig.id
                document.body.appendChild(btn)
            }
        })

        // Create template form
        let templateForm = document.getElementById('template-form')
        if (!templateForm) {
            templateForm = document.createElement('form')
            templateForm.id = 'template-form'
            document.body.appendChild(templateForm)

            const fields = [
                { id: 'template-id', tag: 'input', type: 'hidden' },
                { id: 'template-title', tag: 'input', type: 'text' },
                { id: 'template-description', tag: 'textarea' },
                { id: 'template-energy', tag: 'select' },
                { id: 'template-time', tag: 'input', type: 'number' },
                { id: 'template-category', tag: 'select' },
                { id: 'template-notes', tag: 'textarea' }
            ]

            fields.forEach((field) => {
                const el = document.createElement(field.tag)
                el.id = field.id
                if (field.type) el.type = field.type

                // Add options to select elements
                if (field.tag === 'select') {
                    if (field.id === 'template-energy') {
                        ;['', 'low', 'medium', 'high'].forEach((value) => {
                            const option = document.createElement('option')
                            option.value = value
                            el.appendChild(option)
                        })
                    } else if (field.id === 'template-category') {
                        ;['general', 'work', 'personal', 'meeting', 'checklist'].forEach(
                            (value) => {
                                const option = document.createElement('option')
                                option.value = value
                                option.textContent = value.charAt(0).toUpperCase() + value.slice(1)
                                el.appendChild(option)
                            }
                        )
                    }
                }

                templateForm.appendChild(el)
            })

            // Create containers for contexts and subtasks
            const contextsContainer = document.createElement('div')
            contextsContainer.id = 'template-contexts-container'
            templateForm.appendChild(contextsContainer)

            const subtasksContainer = document.createElement('div')
            subtasksContainer.id = 'template-subtasks-container'
            templateForm.appendChild(subtasksContainer)
        }

        // Create modal title
        let modalTitle = document.getElementById('template-modal-title')
        if (!modalTitle) {
            modalTitle = document.createElement('h2')
            modalTitle.id = 'template-modal-title'
            document.body.appendChild(modalTitle)
        }

        // Create count elements for updateCounts
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

        // Create tasks-container for renderView
        let tasksContainer = document.getElementById('tasks-container')
        if (!tasksContainer) {
            tasksContainer = document.createElement('div')
            tasksContainer.id = 'tasks-container'
            document.body.appendChild(tasksContainer)
        }

        app = new GTDApp()
        app.tasks = []
        app.templates = []
    })

    describe('setupTemplates()', () => {
        test('should add click listener to templates button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('templates-button'),
                'addEventListener'
            )

            app.setupTemplates()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add click listener to close templates modal button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('close-templates-modal'),
                'addEventListener'
            )

            app.setupTemplates()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add click listener to create template button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('btn-create-template'),
                'addEventListener'
            )

            app.setupTemplates()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add click listener to close template edit modal button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('close-template-edit-modal'),
                'addEventListener'
            )

            app.setupTemplates()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should add submit listener to template form', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('template-form'),
                'addEventListener'
            )

            app.setupTemplates()

            expect(addEventListenerSpy).toHaveBeenCalledWith('submit', expect.any(Function))
        })

        test('should add click listener to add template subtask button', () => {
            const addEventListenerSpy = jest.spyOn(
                document.getElementById('btn-add-template-subtask'),
                'addEventListener'
            )

            app.setupTemplates()

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
        })

        test('should handle missing buttons gracefully', () => {
            const templatesBtn = document.getElementById('templates-button')
            const closeBtn = document.getElementById('close-templates-modal')

            templatesBtn.remove()
            closeBtn.remove()

            expect(() => app.setupTemplates()).not.toThrow()
        })
    })

    describe('openTemplatesModal()', () => {
        test('should display templates modal', () => {
            const closeSpy = jest.spyOn(app.templatesManager, 'closeTemplateEditModal')
            const renderSpy = jest.spyOn(app.templatesManager, 'renderTemplatesList')

            app.openTemplatesModal()

            const modal = document.getElementById('templates-modal')
            expect(modal.classList.contains('active')).toBe(true)
            expect(closeSpy).toHaveBeenCalled()
            expect(renderSpy).toHaveBeenCalled()
        })

        test('should handle missing modal gracefully', () => {
            const modal = document.getElementById('templates-modal')
            modal.remove()

            expect(() => app.openTemplatesModal()).not.toThrow()
        })
    })

    describe('closeTemplatesModal()', () => {
        test('should hide templates modal', () => {
            const modal = document.getElementById('templates-modal')
            modal.classList.add('active')

            app.closeTemplatesModal()

            expect(modal.classList.contains('active')).toBe(false)
        })

        test('should handle missing modal gracefully', () => {
            const modal = document.getElementById('templates-modal')
            modal.remove()

            expect(() => app.closeTemplatesModal()).not.toThrow()
        })
    })

    describe('openTemplateEditModal()', () => {
        test('should open modal for new template', () => {
            const closeSpy = jest.spyOn(app.templatesManager, 'closeTemplatesModal')
            const renderContextsSpy = jest.spyOn(app.templatesManager, 'renderTemplateContexts')
            const renderSubtasksSpy = jest.spyOn(app.templatesManager, 'renderTemplateSubtasks')

            app.openTemplateEditModal()

            const modal = document.getElementById('template-edit-modal')
            const title = document.getElementById('template-modal-title')

            expect(modal.classList.contains('active')).toBe(true)
            expect(title.textContent).toBe('Create Template')
            expect(closeSpy).toHaveBeenCalled()
            expect(renderContextsSpy).toHaveBeenCalledWith([])
            expect(renderSubtasksSpy).toHaveBeenCalledWith([])
        })

        test('should open modal for editing existing template', () => {
            const template = new Template({
                id: 'tmpl-1',
                title: 'Test Template',
                description: 'Test Description',
                energy: 'high',
                time: 30,
                category: 'work',
                contexts: ['Home', 'Office'],
                subtasks: [{ title: 'Subtask 1', completed: false }]
            })
            app.templates.push(template)

            const renderContextsSpy = jest.spyOn(app.templatesManager, 'renderTemplateContexts')
            const renderSubtasksSpy = jest.spyOn(app.templatesManager, 'renderTemplateSubtasks')

            app.openTemplateEditModal('tmpl-1')

            const title = document.getElementById('template-modal-title')
            expect(title.textContent).toBe('Edit Template')
            expect(document.getElementById('template-id').value).toBe('tmpl-1')
            expect(document.getElementById('template-title').value).toBe('Test Template')
            expect(document.getElementById('template-description').value).toBe('Test Description')
            expect(document.getElementById('template-energy').value).toBe('high')
            expect(document.getElementById('template-time').value).toBe('30')
            expect(document.getElementById('template-category').value).toBe('work')
            expect(document.getElementById('template-notes').value).toBe('')
            expect(renderContextsSpy).toHaveBeenCalledWith(['Home', 'Office'])
            expect(renderSubtasksSpy).toHaveBeenCalledWith([
                { title: 'Subtask 1', completed: false }
            ])
        })

        test('should handle missing modal gracefully', () => {
            const modal = document.getElementById('template-edit-modal')
            modal.remove()

            expect(() => app.openTemplateEditModal()).not.toThrow()
        })

        test('should handle non-existent template id', () => {
            // Clear the form first to avoid pollution from previous test
            document.getElementById('template-title').value = ''

            app.openTemplateEditModal('non-existent')

            // Should still open modal but with empty form
            const modal = document.getElementById('template-edit-modal')
            expect(modal.classList.contains('active')).toBe(true)
            // Form should be reset (empty title)
            expect(document.getElementById('template-title').value).toBe('')
        })
    })

    describe('closeTemplateEditModal()', () => {
        test('should hide template edit modal', () => {
            const modal = document.getElementById('template-edit-modal')
            modal.classList.add('active')

            app.closeTemplateEditModal()

            expect(modal.classList.contains('active')).toBe(false)
        })

        test('should handle missing modal gracefully', () => {
            const modal = document.getElementById('template-edit-modal')
            modal.remove()

            expect(() => app.closeTemplateEditModal()).not.toThrow()
        })
    })

    describe('renderTemplatesList()', () => {
        test('should render empty state when no templates', () => {
            app.renderTemplatesList()

            const container = document.getElementById('templates-list')
            expect(container.innerHTML).toContain('No templates yet')
        })

        test('should render templates grouped by category', () => {
            const template1 = new Template({ id: 'tmpl-1', title: 'Work Task 1', category: 'work' })
            const template2 = new Template({
                id: 'tmpl-2',
                title: 'Personal Task 1',
                category: 'personal'
            })
            app.templates.push(template1, template2)

            app.renderTemplatesList()

            const container = document.getElementById('templates-list')
            expect(container.innerHTML).toContain('Work')
            expect(container.innerHTML).toContain('Personal')
            expect(container.innerHTML).toContain('Work Task 1')
            expect(container.innerHTML).toContain('Personal Task 1')
        })

        test('should show template details in list', () => {
            const template = new Template({
                id: 'tmpl-1',
                title: 'Test Template',
                description: 'Test Description',
                energy: 'high',
                time: 30,
                contexts: ['Home'],
                subtasks: [{ title: 'Subtask 1', completed: false }]
            })
            app.templates.push(template)

            app.renderTemplatesList()

            const container = document.getElementById('templates-list')
            expect(container.innerHTML).toContain('Test Template')
            expect(container.innerHTML).toContain('Test Description')
            expect(container.innerHTML).toContain('high')
            expect(container.innerHTML).toContain('30m')
            expect(container.innerHTML).toContain('1 subtasks')
        })

        test('should handle missing container gracefully', () => {
            const container = document.getElementById('templates-list')
            container.remove()

            expect(() => app.renderTemplatesList()).not.toThrow()
        })
    })

    describe('editTemplate()', () => {
        test('should open edit modal with template data', () => {
            const template = new Template({ id: 'tmpl-1', title: 'Test Template' })
            app.templates.push(template)

            const openModalSpy = jest.spyOn(app.templatesManager, 'openTemplateEditModal')

            app.editTemplate('tmpl-1')

            expect(openModalSpy).toHaveBeenCalledWith('tmpl-1')
        })
    })

    describe('renderTemplateContexts()', () => {
        beforeEach(() => {
            // Ensure container exists for each test
            let container = document.getElementById('template-contexts-container')
            if (!container) {
                const templateForm = document.getElementById('template-form')
                if (templateForm) {
                    container = document.createElement('div')
                    container.id = 'template-contexts-container'
                    templateForm.appendChild(container)
                }
            }
        })

        test('should render default contexts', () => {
            app.renderTemplateContexts([])

            const container = document.getElementById('template-contexts-container')
            expect(container.innerHTML.length).toBeGreaterThan(0)
        })

        test('should render contexts with active state', () => {
            app.renderTemplateContexts(['@home', '@work'])

            const container = document.getElementById('template-contexts-container')
            const activeBtns = container.querySelectorAll('.context-btn.active')
            expect(activeBtns.length).toBe(2)
        })

        test('should add click handlers to context buttons', () => {
            const renderSpy = jest.spyOn(app.templatesManager, 'renderTemplateContexts')
            app.renderTemplateContexts([])

            expect(renderSpy).toHaveBeenCalledWith([])

            const container = document.getElementById('template-contexts-container')
            const firstBtn = container.querySelector('.context-btn')

            firstBtn.click()
            expect(firstBtn.classList.contains('active')).toBe(true)

            firstBtn.click()
            expect(firstBtn.classList.contains('active')).toBe(false)
        })

        test('should handle missing container gracefully', () => {
            const container = document.getElementById('template-contexts-container')
            container.remove()

            expect(() => app.renderTemplateContexts([])).not.toThrow()
        })
    })

    describe('getSelectedTemplateContexts()', () => {
        beforeEach(() => {
            // Ensure container exists for each test
            let container = document.getElementById('template-contexts-container')
            if (!container) {
                const templateForm = document.getElementById('template-form')
                if (templateForm) {
                    container = document.createElement('div')
                    container.id = 'template-contexts-container'
                    templateForm.appendChild(container)
                }
            }
        })

        test('should return empty array when no contexts selected', () => {
            app.renderTemplateContexts([])

            const result = app.getSelectedTemplateContexts()
            expect(result).toEqual([])
        })

        test('should return selected contexts', () => {
            app.renderTemplateContexts([])

            const container = document.getElementById('template-contexts-container')
            const firstBtn = container.querySelector('.context-btn')
            firstBtn.click()

            const result = app.getSelectedTemplateContexts()

            expect(result.length).toBe(1)
        })

        test('should handle missing container gracefully', () => {
            const container = document.getElementById('template-contexts-container')
            container.remove()

            const result = app.getSelectedTemplateContexts()
            expect(result).toEqual([])
        })
    })

    describe('renderTemplateSubtasks()', () => {
        test('should render subtasks', () => {
            const subtasks = [
                { title: 'Subtask 1', completed: false },
                { title: 'Subtask 2', completed: true }
            ]

            app.renderTemplateSubtasks(subtasks)

            const container = document.getElementById('template-subtasks-container')
            expect(container.innerHTML).toContain('Subtask 1')
            expect(container.innerHTML).toContain('Subtask 2')
        })

        test('should render empty when no subtasks', () => {
            app.renderTemplateSubtasks([])

            const container = document.getElementById('template-subtasks-container')
            expect(container.innerHTML).toBe('')
        })

        test('should handle missing container gracefully', () => {
            const container = document.getElementById('template-subtasks-container')
            container.remove()

            expect(() => app.renderTemplateSubtasks([])).not.toThrow()
        })
    })

    describe('addTemplateSubtask()', () => {
        beforeEach(() => {
            // Ensure container exists for each test
            let container = document.getElementById('template-subtasks-container')
            if (!container) {
                const templateForm = document.getElementById('template-form')
                if (templateForm) {
                    container = document.createElement('div')
                    container.id = 'template-subtasks-container'
                    templateForm.appendChild(container)
                }
            }
        })

        test('should add new subtask to container', () => {
            app.renderTemplateSubtasks([])

            const container = document.getElementById('template-subtasks-container')
            const initialCount = container.children.length

            app.addTemplateSubtask()

            expect(container.children.length).toBe(initialCount + 1)
        })

        test('should focus new subtask input', () => {
            app.renderTemplateSubtasks([])

            const focusSpy = jest.spyOn(HTMLInputElement.prototype, 'focus')

            app.addTemplateSubtask()

            expect(focusSpy).toHaveBeenCalled()
        })

        test('should handle missing container gracefully', () => {
            const container = document.getElementById('template-subtasks-container')
            container.remove()

            expect(() => app.addTemplateSubtask()).not.toThrow()
        })
    })

    describe('removeTemplateSubtask()', () => {
        beforeEach(() => {
            // Ensure container exists for each test
            let container = document.getElementById('template-subtasks-container')
            if (!container) {
                const templateForm = document.getElementById('template-form')
                if (templateForm) {
                    container = document.createElement('div')
                    container.id = 'template-subtasks-container'
                    templateForm.appendChild(container)
                }
            }
        })

        test('should remove subtask at index', () => {
            const subtasks = [
                { title: 'Subtask 1', completed: false },
                { title: 'Subtask 2', completed: false }
            ]
            app.renderTemplateSubtasks(subtasks)

            const container = document.getElementById('template-subtasks-container')
            const initialCount = container.children.length

            app.removeTemplateSubtask(0)

            expect(container.children.length).toBe(initialCount - 1)
        })

        test('should reindex remaining subtasks', () => {
            const subtasks = [
                { title: 'Subtask 1', completed: false },
                { title: 'Subtask 2', completed: false },
                { title: 'Subtask 3', completed: false }
            ]
            app.renderTemplateSubtasks(subtasks)

            app.removeTemplateSubtask(1)

            const container = document.getElementById('template-subtasks-container')
            const inputs = container.querySelectorAll('.subtask-item input')
            expect(inputs.length).toBe(2)
            expect(inputs[0].dataset.index).toBe('0')
            expect(inputs[1].dataset.index).toBe('1')
        })

        test('should handle missing container gracefully', () => {
            const container = document.getElementById('template-subtasks-container')
            container.remove()

            expect(() => app.removeTemplateSubtask(0)).not.toThrow()
        })
    })

    describe('getTemplateSubtasks()', () => {
        beforeEach(() => {
            // Ensure container exists for each test
            let container = document.getElementById('template-subtasks-container')
            if (!container) {
                const templateForm = document.getElementById('template-form')
                if (templateForm) {
                    container = document.createElement('div')
                    container.id = 'template-subtasks-container'
                    templateForm.appendChild(container)
                }
            }
        })

        test('should return array of subtasks', () => {
            app.renderTemplateSubtasks([])

            const container = document.getElementById('template-subtasks-container')
            const div1 = document.createElement('div')
            div1.className = 'subtask-item'
            const input1 = document.createElement('input')
            input1.className = 'form-control'
            input1.value = 'Subtask 1'
            input1.dataset.index = '0'
            div1.appendChild(input1)
            container.appendChild(div1)

            const div2 = document.createElement('div')
            div2.className = 'subtask-item'
            const input2 = document.createElement('input')
            input2.className = 'form-control'
            input2.value = ''
            input2.dataset.index = '1'
            div2.appendChild(input2)
            container.appendChild(div2)

            const result = app.getTemplateSubtasks()

            expect(result.length).toBe(1)
            expect(result[0].title).toBe('Subtask 1')
            expect(result[0].completed).toBe(false)
        })

        test('should filter out empty subtasks', () => {
            app.renderTemplateSubtasks([])

            const container = document.getElementById('template-subtasks-container')
            const div = document.createElement('div')
            div.className = 'subtask-item'
            const input = document.createElement('input')
            input.className = 'form-control'
            input.value = '   '
            input.dataset.index = '0'
            div.appendChild(input)
            container.appendChild(div)

            const result = app.getTemplateSubtasks()

            expect(result.length).toBe(0)
        })

        test('should handle missing container gracefully', () => {
            const container = document.getElementById('template-subtasks-container')
            if (container) {
                container.remove()
            }

            const result = app.getTemplateSubtasks()

            expect(result).toEqual([])
        })
    })

    describe('handleTemplateFormSubmit()', () => {
        test('should create new template', async () => {
            document.getElementById('template-id').value = ''
            document.getElementById('template-title').value = 'New Template'
            document.getElementById('template-description').value = 'Description'
            document.getElementById('template-energy').value = 'high'
            document.getElementById('template-time').value = '30'
            document.getElementById('template-category').value = 'work'
            document.getElementById('template-notes').value = 'Notes'

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTemplates').mockResolvedValue()
            jest.spyOn(app.templatesManager, 'closeTemplateEditModal')
            jest.spyOn(app.templatesManager, 'openTemplatesModal')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(app, 'showToast')
            jest.spyOn(app.templatesManager, 'getSelectedTemplateContexts').mockReturnValue([
                'Home'
            ])
            jest.spyOn(app.templatesManager, 'getTemplateSubtasks').mockReturnValue([])

            const event = new Event('submit')
            await app.handleTemplateFormSubmit(event)

            expect(app.templates.length).toBe(1)
            expect(app.templates[0].title).toBe('New Template')
        })

        test('should update existing template', async () => {
            const template = new Template({ id: 'tmpl-1', title: 'Old Title' })
            app.templates.push(template)

            document.getElementById('template-id').value = 'tmpl-1'
            document.getElementById('template-title').value = 'Updated Title'

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTemplates').mockResolvedValue()
            jest.spyOn(app.templatesManager, 'closeTemplateEditModal')
            jest.spyOn(app.templatesManager, 'openTemplatesModal')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(app, 'showToast')
            jest.spyOn(app.templatesManager, 'getSelectedTemplateContexts').mockReturnValue([])
            jest.spyOn(app.templatesManager, 'getTemplateSubtasks').mockReturnValue([])

            const event = new Event('submit')
            await app.handleTemplateFormSubmit(event)

            expect(app.templates[0].title).toBe('Updated Title')
        })

        test('should prevent default form submission', async () => {
            const event = new Event('submit')
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTemplates').mockResolvedValue()
            jest.spyOn(app.templatesManager, 'closeTemplateEditModal')
            jest.spyOn(app.templatesManager, 'openTemplatesModal')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(app, 'showToast')
            jest.spyOn(app.templatesManager, 'getSelectedTemplateContexts').mockReturnValue([])
            jest.spyOn(app.templatesManager, 'getTemplateSubtasks').mockReturnValue([])

            await app.handleTemplateFormSubmit(event)

            expect(preventDefaultSpy).toHaveBeenCalled()
        })
    })

    describe('deleteTemplate()', () => {
        test('should delete template', async () => {
            const template = new Template({ id: 'tmpl-1', title: 'Test Template' })
            app.templates.push(template)

            jest.spyOn(window, 'confirm').mockReturnValue(true)
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTemplates').mockResolvedValue()
            jest.spyOn(app.templatesManager, 'renderTemplatesList')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(app, 'showToast')

            await app.deleteTemplate('tmpl-1')

            expect(app.templates.length).toBe(0)
        })

        test('should not delete when user cancels', async () => {
            const template = new Template({ id: 'tmpl-1', title: 'Test Template' })
            app.templates.push(template)

            jest.spyOn(window, 'confirm').mockReturnValue(false)

            await app.deleteTemplate('tmpl-1')

            expect(app.templates.length).toBe(1)
        })
    })

    describe('saveTaskAsTemplate()', () => {
        test('should save task as template', () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task Title',
                description: 'Task Description',
                energy: 'medium',
                timeEstimated: 45,
                category: 'personal',
                notes: 'Task Notes',
                contexts: ['Office'],
                subtasks: [{ title: 'Subtask', completed: false }]
            })
            app.tasks.push(task)

            const openModalSpy = jest.spyOn(app.templatesManager, 'openTemplateEditModalWithData')
            jest.spyOn(app, 'showToast')

            app.saveTaskAsTemplate('task-1')

            expect(openModalSpy).toHaveBeenCalled()
            const templateData = openModalSpy.mock.calls[0][0]
            expect(templateData.title).toBe('Task Title')
            expect(templateData.energy).toBe('medium')
            expect(templateData.contexts).toEqual(['Office'])
        })

        test('should handle missing task gracefully', () => {
            const openModalSpy = jest.spyOn(app.templatesManager, 'openTemplateEditModalWithData')

            app.saveTaskAsTemplate('non-existent')

            expect(openModalSpy).not.toHaveBeenCalled()
        })
    })

    describe('openTemplateEditModalWithData()', () => {
        test('should open modal with provided data', () => {
            const templateData = {
                title: 'Test Template',
                description: 'Test Description',
                energy: 'high',
                time: 60,
                category: 'work',
                notes: 'Test Notes',
                contexts: ['Home'],
                subtasks: [{ title: 'Subtask', completed: false }]
            }

            const closeSpy = jest.spyOn(app.templatesManager, 'closeTemplatesModal')
            const renderContextsSpy = jest.spyOn(app.templatesManager, 'renderTemplateContexts')
            const renderSubtasksSpy = jest.spyOn(app.templatesManager, 'renderTemplateSubtasks')

            app.openTemplateEditModalWithData(templateData)

            const modal = document.getElementById('template-edit-modal')
            expect(modal.classList.contains('active')).toBe(true)
            expect(document.getElementById('template-title').value).toBe('Test Template')
            expect(document.getElementById('template-description').value).toBe('Test Description')
            expect(closeSpy).toHaveBeenCalled()
            expect(renderContextsSpy).toHaveBeenCalledWith(['Home'])
            expect(renderSubtasksSpy).toHaveBeenCalledWith([{ title: 'Subtask', completed: false }])
        })

        test('should handle missing data gracefully', () => {
            const renderContextsSpy = jest.spyOn(app.templatesManager, 'renderTemplateContexts')
            const renderSubtasksSpy = jest.spyOn(app.templatesManager, 'renderTemplateSubtasks')

            app.openTemplateEditModalWithData({})

            expect(renderContextsSpy).toHaveBeenCalledWith([])
            expect(renderSubtasksSpy).toHaveBeenCalledWith([])
        })
    })

    describe('createTaskFromTemplate()', () => {
        test('should create task from template', async () => {
            const template = new Template({
                id: 'tmpl-1',
                title: 'Template Task',
                description: 'From Template',
                subtasks: [{ title: 'Template Subtask', completed: false }]
            })
            app.templates.push(template)

            jest.spyOn(app, 'saveTasks').mockResolvedValue()
            jest.spyOn(app, 'closeTemplatesModal')
            jest.spyOn(app, 'renderView')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(app, 'showToast')

            await app.createTaskFromTemplate('tmpl-1')

            expect(app.tasks.length).toBe(1)
            expect(app.tasks[0].title).toBe('Template Task')
            expect(app.tasks[0].subtasks.length).toBe(1)
        })

        test('should handle non-existent template gracefully', async () => {
            await app.createTaskFromTemplate('non-existent')

            expect(app.tasks.length).toBe(0)
        })
    })

    describe('Integration: Template creation workflow', () => {
        test('should complete full template creation workflow', async () => {
            // Open templates modal
            app.openTemplatesModal()
            expect(document.getElementById('templates-modal').classList.contains('active')).toBe(
                true
            )

            // Open create template modal
            app.openTemplateEditModal()
            expect(
                document.getElementById('template-edit-modal').classList.contains('active')
            ).toBe(true)

            // Fill form
            document.getElementById('template-title').value = 'Integration Test Template'
            document.getElementById('template-category').value = 'general'

            // Mock dependencies
            jest.spyOn(app, 'saveState')
            jest.spyOn(app, 'saveTemplates').mockResolvedValue()
            jest.spyOn(app.templatesManager, 'closeTemplateEditModal')
            jest.spyOn(app.templatesManager, 'openTemplatesModal')
            jest.spyOn(app, 'updateCounts')
            jest.spyOn(app, 'showToast')
            jest.spyOn(app.templatesManager, 'getSelectedTemplateContexts').mockReturnValue([])
            jest.spyOn(app.templatesManager, 'getTemplateSubtasks').mockReturnValue([])

            // Submit form
            const event = new Event('submit')
            await app.handleTemplateFormSubmit(event)

            // Verify template was created
            expect(app.templates.length).toBe(1)
            expect(app.templates[0].title).toBe('Integration Test Template')
        })
    })

    describe('Edge Cases', () => {
        test('should handle templates with empty title', () => {
            // Ensure templates-list exists
            let container = document.getElementById('templates-list')
            if (!container) {
                const modal = document.getElementById('templates-modal')
                container = document.createElement('div')
                container.id = 'templates-list'
                modal.appendChild(container)
            }

            const template = new Template({ id: 'tmpl-1', title: '' })
            app.templates.push(template)

            app.renderTemplatesList()

            container = document.getElementById('templates-list')
            expect(container.innerHTML.length).toBeGreaterThan(0)
        })

        test('should handle templates with very long title', () => {
            // Ensure templates-list exists
            let container = document.getElementById('templates-list')
            if (!container) {
                const modal = document.getElementById('templates-modal')
                container = document.createElement('div')
                container.id = 'templates-list'
                modal.appendChild(container)
            }

            const longTitle = 'A'.repeat(200)
            const template = new Template({ id: 'tmpl-1', title: longTitle })
            app.templates.push(template)

            expect(() => app.renderTemplatesList()).not.toThrow()
        })

        test('should handle templates with many subtasks', () => {
            const subtasks = Array.from({ length: 50 }, (_, i) => ({
                title: `Subtask ${i}`,
                completed: false
            }))

            expect(() => app.renderTemplateSubtasks(subtasks)).not.toThrow()
        })

        test('should handle special characters in template data', () => {
            // Ensure templates-list exists
            let container = document.getElementById('templates-list')
            if (!container) {
                const modal = document.getElementById('templates-modal')
                container = document.createElement('div')
                container.id = 'templates-list'
                modal.appendChild(container)
            }

            const template = new Template({
                id: 'tmpl-1',
                title: 'Template <script>alert("xss")</script>',
                description: 'Test & Description "with quotes'
            })
            app.templates.push(template)

            app.renderTemplatesList()

            container = document.getElementById('templates-list')
            expect(container.innerHTML).not.toContain('<script>')
        })

        test('should handle concurrent modal operations', () => {
            app.openTemplatesModal()
            app.openTemplateEditModal()

            const templatesModal = document.getElementById('templates-modal')
            const editModal = document.getElementById('template-edit-modal')

            expect(templatesModal.classList.contains('active')).toBe(false)
            expect(editModal.classList.contains('active')).toBe(true)
        })
    })

    describe('Missing Coverage - setupTemplates() Cancel Button', () => {
        test('should add click listener to cancel template modal button', () => {
            const cancelBtn = document.getElementById('cancel-template-modal')
            expect(cancelBtn).toBeTruthy()

            const closeSpy = jest.spyOn(app.templatesManager, 'closeTemplateEditModal')

            // Trigger setup to add listeners
            app.templatesManager.setupTemplates()

            // Click the cancel button
            cancelBtn.click()

            expect(closeSpy).toHaveBeenCalled()
            closeSpy.mockRestore()
        })

        test('should call openTemplatesModal when templates button clicked', () => {
            const templatesBtn = document.getElementById('templates-button')
            expect(templatesBtn).toBeTruthy()

            const openSpy = jest.spyOn(app.templatesManager, 'openTemplatesModal')

            // Trigger setup to add listeners
            app.templatesManager.setupTemplates()

            // Click the templates button
            const clickEvent = new MouseEvent('click', { bubbles: true })
            templatesBtn.dispatchEvent(clickEvent)

            expect(openSpy).toHaveBeenCalled()
            openSpy.mockRestore()
        })
    })

    describe('Missing Coverage - getTemplatesByCategory()', () => {
        beforeEach(() => {
            // Add templates with different categories
            app.templates.push(
                new Template({ id: 't1', title: 'General Template', category: 'general' }),
                new Template({ id: 't2', title: 'Work Template', category: 'work' }),
                new Template({ id: 't3', title: 'Another Work Template', category: 'work' }),
                new Template({ id: 't4', title: 'Personal Template', category: 'personal' })
            )
        })

        test('should filter templates by category', () => {
            const workTemplates = app.templatesManager.getTemplatesByCategory('work')

            expect(workTemplates).toHaveLength(2)
            expect(workTemplates.every((t) => t.category === 'work')).toBe(true)
            expect(workTemplates.map((t) => t.title)).toContain('Work Template')
            expect(workTemplates.map((t) => t.title)).toContain('Another Work Template')
        })

        test('should return empty array for category with no templates', () => {
            const meetingTemplates = app.templatesManager.getTemplatesByCategory('meeting')

            expect(meetingTemplates).toEqual([])
            expect(meetingTemplates).toHaveLength(0)
        })

        test('should return all templates when category exists', () => {
            const generalTemplates = app.templatesManager.getTemplatesByCategory('general')

            expect(generalTemplates).toHaveLength(1)
            expect(generalTemplates[0].title).toBe('General Template')
        })

        test('should handle multiple categories separately', () => {
            const workTemplates = app.templatesManager.getTemplatesByCategory('work')
            const personalTemplates = app.templatesManager.getTemplatesByCategory('personal')

            expect(workTemplates).toHaveLength(2)
            expect(personalTemplates).toHaveLength(1)
            expect(workTemplates).not.toEqual(personalTemplates)
        })
    })

    describe('Missing Coverage - searchTemplates()', () => {
        beforeEach(() => {
            // Add templates with searchable content
            app.templates.push(
                new Template({
                    id: 't1',
                    title: 'Weekly Meeting Template',
                    description: 'Template for weekly team meetings'
                }),
                new Template({
                    id: 't2',
                    title: 'Daily Standup',
                    description: 'Quick daily check-in with team'
                }),
                new Template({
                    id: 't3',
                    title: 'Project Planning',
                    description: 'Comprehensive project planning session'
                }),
                new Template({
                    id: 't4',
                    title: 'Code Review Checklist',
                    description: 'Steps for reviewing code'
                })
            )
        })

        test('should search templates by title', () => {
            const results = app.templatesManager.searchTemplates('meeting')

            expect(results).toHaveLength(1)
            expect(results[0].title).toBe('Weekly Meeting Template')
        })

        test('should search templates by description', () => {
            const results = app.templatesManager.searchTemplates('team')

            expect(results).toHaveLength(2)
            expect(results.map((t) => t.title)).toContain('Weekly Meeting Template')
            expect(results.map((t) => t.title)).toContain('Daily Standup')
        })

        test('should be case-insensitive', () => {
            const results1 = app.templatesManager.searchTemplates('MEETING')
            const results2 = app.templatesManager.searchTemplates('meeting')
            const results3 = app.templatesManager.searchTemplates('Meeting')

            expect(results1).toEqual(results2)
            expect(results2).toEqual(results3)
            expect(results1).toHaveLength(1)
        })

        test('should return empty array when no matches found', () => {
            const results = app.templatesManager.searchTemplates('nonexistent')

            expect(results).toEqual([])
            expect(results).toHaveLength(0)
        })

        test('should handle empty search query', () => {
            const results = app.templatesManager.searchTemplates('')

            // Empty query should match all (since '' is included in all strings)
            expect(results).toHaveLength(4)
        })

        test('should match partial words in title', () => {
            const results = app.templatesManager.searchTemplates('review')

            expect(results).toHaveLength(1)
            expect(results[0].title).toBe('Code Review Checklist')
        })

        test('should match partial words in description', () => {
            const results = app.templatesManager.searchTemplates('planning')

            expect(results).toHaveLength(1)
            expect(results[0].title).toBe('Project Planning')
        })

        test('should handle templates without description', () => {
            app.templates.push(
                new Template({
                    id: 't5',
                    title: 'Template without description',
                    description: ''
                })
            )

            const results = app.templatesManager.searchTemplates('without')

            expect(results).toHaveLength(1)
            expect(results[0].title).toBe('Template without description')
        })

        test('should handle templates with null description', () => {
            app.templates.push(
                new Template({
                    id: 't6',
                    title: 'Template with null description',
                    description: null
                })
            )

            const results = app.templatesManager.searchTemplates('null')

            expect(results).toHaveLength(1)
            expect(results[0].title).toBe('Template with null description')
        })

        test('should handle special characters in search query', () => {
            app.templates.push(
                new Template({
                    id: 't7',
                    title: 'C++ Review',
                    description: 'Code review for C++'
                })
            )

            const results = app.templatesManager.searchTemplates('C++')

            expect(results).toHaveLength(1)
            expect(results[0].title).toBe('C++ Review')
        })

        test('should find multiple matches across title and description', () => {
            const results = app.templatesManager.searchTemplates('template')

            // Should match: "Weekly Meeting Template", "Template for weekly team meetings"
            expect(results.length).toBeGreaterThanOrEqual(1)
        })
    })
})
