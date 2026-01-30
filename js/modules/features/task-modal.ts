/**
 * Task Modal module
 * Handles task creation and editing with comprehensive form support
 *
 * Features:
 * - GTD status management (inbox, next, waiting, someday)
 * - Recurrence patterns (daily, weekly, monthly, yearly)
 * - Task dependencies and subtasks
 * - Natural language parsing integration
 * - Energy and time estimates
 * - Context tags
 * - Project assignment
 *
 * @example
 * const taskModal = new TaskModalManager(state, app);
 * taskModal.openTaskModal(); // Open for new task
 * taskModal.openTaskModal(existingTask); // Open for editing
 * taskModal.openTaskModal(null, 'project-123'); // Open with default project
 */

import {
    Task,
    Project,
    TaskData,
    TaskStatus,
    TaskType,
    RecurrencePattern,
    ProjectStatus
} from '../../models'

// Constants for recurrence labels
const RecurrenceLabels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
}

const WeekdayNames: Record<number, string> = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    7: 'Sun'
}

const NthWeekdayLabels: Record<number, string> = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: '4th',
    5: 'Last'
}

interface AppState {
    tasks: Task[]
    projects: Project[]
    currentView?: string
    selectedContextFilters?: Set<string>
}

interface AppInterface {
    saveTasks?: () => Promise<void>
    saveProjects?: () => Promise<void>
    saveState?: (action: string) => void
    renderView?: () => void
    updateCounts?: () => void
    updateContextFilter?: () => void
    renderProjectsDropdown?: () => void
    showNotification?: (message: string, type: string) => void
    showToast?: (message: string, type: string) => void
    openProjectModal?: (project: Project | null, formData?: any) => void
    normalizeContextName?: (context: string) => string
    trackTaskUsage?: (task: Task) => void
}

export class TaskModalManager {
    state: AppState
    app: AppInterface
    pendingTaskData: any | null

    /**
     * Create a new TaskModalManager instance
     * @param {Object} state - Application state object
     * @param {Array} state.tasks - Array of tasks
     * @param {Array} state.projects - Array of projects
     * @param {Object} app - Application instance
     * @param {Array} app.tasks - Tasks array (for dependencies)
     * @param {Function} app.openProjectModal - Open project modal
     * @param {Function} app.showNotification - Show toast notification
     * @param {Function} app.saveState - Save state for undo/redo
     * @param {Function} app.saveTasks - Save tasks to storage
     * @param {Function} app.renderView - Re-render current view
     * @param {Function} app.updateCounts - Update task counts
     * @param {Function} app.updateContextFilter - Update context filter UI
     */
    constructor (state: AppState, app: AppInterface) {
        this.state = state
        this.app = app
        this.pendingTaskData = null
    }

    /**
     * Open task modal for creating/editing tasks
     * @param {Task} task - Task to edit (null for new task)
     * @param {string} defaultProjectId - Default project ID
     * @param {Object} defaultData - Default data for form fields
     */
    openTaskModal (
        task: Task | null = null,
        defaultProjectId: string | null = null,
        defaultData: any = {}
    ) {
        const modal = document.getElementById('task-modal') as HTMLElement
        const form = document.getElementById('task-form') as HTMLFormElement
        const title = document.getElementById('modal-title') as HTMLElement

        // Reset form
        form.reset()

        // Update project options
        const projectSelect = document.getElementById('task-project') as HTMLSelectElement
        projectSelect.innerHTML = '<option value="">No Project</option>'

        // Add option to create new project
        const createOption = document.createElement('option')
        createOption.value = '__create_new__'
        createOption.textContent = '+ Create new project...'
        createOption.style.fontWeight = 'bold'
        createOption.style.color = 'var(--primary-color)'
        projectSelect.appendChild(createOption)

        // Add existing projects
        this.state.projects.forEach((project) => {
            const option = document.createElement('option')
            option.value = project.id
            option.textContent = project.title
            projectSelect.appendChild(option)
        })

        // Handle create new project selection
        projectSelect.addEventListener(
            'change',
            (e) => {
                if ((e.target as HTMLSelectElement).value === '__create_new__') {
                    // Remember the current form data
                    const formData = {
                        title: (document.getElementById('task-title') as HTMLInputElement).value,
                        description: (
                            document.getElementById('task-description') as HTMLTextAreaElement
                        ).value,
                        status: (document.getElementById('task-status') as HTMLSelectElement).value,
                        energy: (document.getElementById('task-energy') as HTMLSelectElement).value,
                        time: (document.getElementById('task-time') as HTMLSelectElement).value,
                        contexts: (document.getElementById('task-contexts') as HTMLInputElement)
                            .value,
                        dueDate: (document.getElementById('task-due-date') as HTMLInputElement)
                            .value,
                        deferDate: (document.getElementById('task-defer-date') as HTMLInputElement)
                            .value
                    }

                    // Close task modal and open project modal
                    this.closeTaskModal()
                    this.app.openProjectModal?.(null, formData)
                }
            },
            { once: true }
        )

        if (task) {
            title.textContent = 'Edit Task'
            ;(document.getElementById('task-id') as HTMLInputElement).value = task.id
            ;(document.getElementById('task-title') as HTMLInputElement).value = task.title
            ;(document.getElementById('task-description') as HTMLTextAreaElement).value =
                task.description || ''
            ;(document.getElementById('task-type') as HTMLSelectElement).value = task.type || 'task'
            ;(document.getElementById('task-status') as HTMLSelectElement).value =
                task.status || 'inbox'
            ;(document.getElementById('task-energy') as HTMLSelectElement).value = task.energy || ''
            ;(document.getElementById('task-time') as HTMLSelectElement).value =
                task.time?.toString() || ''
            ;(document.getElementById('task-project') as HTMLSelectElement).value =
                task.projectId || ''
            ;(document.getElementById('task-due-date') as HTMLInputElement).value =
                task.dueDate || ''
            ;(document.getElementById('task-defer-date') as HTMLInputElement).value =
                task.deferDate || ''
            ;(document.getElementById('task-waiting-for-description') as HTMLInputElement).value =
                task.waitingForDescription || ''
            ;(document.getElementById('task-contexts') as HTMLInputElement).value = task.contexts
                ? task.contexts.join(', ')
                : ''
            this.populateRecurrenceInForm(task.recurrence)
            ;(document.getElementById('task-recurrence-end-date') as HTMLInputElement).value =
                task.recurrenceEndDate || ''
            ;(document.getElementById('task-notes') as HTMLTextAreaElement).value = task.notes || ''
            this.renderSubtasksInModal(task.subtasks || [])
        } else {
            title.textContent = 'Add Task'
            ;(document.getElementById('task-id') as HTMLInputElement).value = ''
            ;(document.getElementById('task-status') as HTMLSelectElement).value =
                this.state.currentView === 'all' ? 'inbox' : this.state.currentView || 'inbox'
            ;(document.getElementById('task-waiting-for-description') as HTMLInputElement).value =
                ''
            this.populateRecurrenceInForm('')
            ;(document.getElementById('task-recurrence-end-date') as HTMLInputElement).value = ''
            ;(document.getElementById('task-notes') as HTMLTextAreaElement).value = ''
            this.renderSubtasksInModal([])
            ;(document.getElementById('task-contexts') as HTMLInputElement).value = ''

            // Set default data if provided
            if (defaultData.type) {
                ;(document.getElementById('task-type') as HTMLSelectElement).value =
                    defaultData.type
                // Update modal title based on type
                if (defaultData.type === 'project') {
                    title.textContent = 'Add Project'
                } else if (defaultData.type === 'reference') {
                    title.textContent = 'Add Reference'
                }
            }

            // Set default project if provided (when adding from project view)
            if (defaultProjectId) {
                ;(document.getElementById('task-project') as HTMLSelectElement).value =
                    defaultProjectId
            }
        }

        // Setup subtask add button
        const addSubtaskBtn = document.getElementById('btn-add-subtask')
        const newSubtaskInput = document.getElementById('new-subtask-input') as HTMLInputElement
        if (addSubtaskBtn && newSubtaskInput) {
            addSubtaskBtn.onclick = () => this.addSubtask()
            newSubtaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    this.addSubtask()
                }
            })
        }

        // Setup status change listener to show/hide waiting for fields
        const statusSelect = document.getElementById('task-status') as HTMLSelectElement
        const waitingForSection = document.getElementById('waiting-for-section') as HTMLElement
        const waitingForDepsSection = document.getElementById(
            'waiting-for-deps-section'
        ) as HTMLElement

        const updateWaitingForFields = () => {
            // Always show dependency section (it's useful for any task)
            waitingForDepsSection.style.display = 'block'
            this.renderWaitingForTasksList(task)

            // Only show waiting-for-description for "waiting" status
            if (statusSelect.value === 'waiting') {
                waitingForSection.style.display = 'block'
            } else {
                waitingForSection.style.display = 'none'
            }
        }

        statusSelect.addEventListener('change', updateWaitingForFields)
        updateWaitingForFields() // Initial call

        // Setup recurrence change listener to show/hide appropriate options
        const recurrenceTypeSelect = document.getElementById(
            'task-recurrence-type'
        ) as HTMLSelectElement
        const recurrenceEndDateGroup = document.getElementById(
            'recurrence-end-date-group'
        ) as HTMLElement
        const weeklyOptions = document.getElementById('recurrence-weekly-options') as HTMLElement
        const monthlyOptions = document.getElementById('recurrence-monthly-options') as HTMLElement
        const yearlyOptions = document.getElementById('recurrence-yearly-options') as HTMLElement

        const updateRecurrenceFields = () => {
            // Hide all options first
            weeklyOptions.style.display = 'none'
            monthlyOptions.style.display = 'none'
            yearlyOptions.style.display = 'none'
            recurrenceEndDateGroup.style.display = 'none'

            const recurrenceType = recurrenceTypeSelect.value

            if (recurrenceType && recurrenceType !== '') {
                recurrenceEndDateGroup.style.display = 'block'

                // Show type-specific options
                if (recurrenceType === 'weekly') {
                    weeklyOptions.style.display = 'block'
                } else if (recurrenceType === 'monthly') {
                    monthlyOptions.style.display = 'block'
                } else if (recurrenceType === 'yearly') {
                    yearlyOptions.style.display = 'block'
                }
            }
        }

        recurrenceTypeSelect.addEventListener('change', updateRecurrenceFields)
        updateRecurrenceFields() // Initial call

        modal.classList.add('active')
    }

    /**
     * Close task modal
     */
    closeTaskModal () {
        const modal = document.getElementById('task-modal')
        if (modal) {
            modal.classList.remove('active')
        }
    }

    /**
     * Populate recurrence form fields
     * @param {string|object} recurrence - Recurrence configuration
     */
    populateRecurrenceInForm (recurrence: string | RecurrencePattern | any) {
        // Reset all fields
        ;(document.getElementById('task-recurrence-type') as HTMLSelectElement).value = ''
        document.querySelectorAll('.recurrence-day-checkbox').forEach((cb: Element) => {
            ;(cb as HTMLInputElement).checked = false
        })
        ;(document.getElementById('recurrence-day-of-month') as HTMLInputElement).value = '1'
        ;(document.getElementById('recurrence-nth') as HTMLInputElement).value = '1'
        ;(document.getElementById('recurrence-weekday') as HTMLInputElement).value = '1'
        ;(document.getElementById('recurrence-year-month') as HTMLInputElement).value = '1'
        ;(document.getElementById('recurrence-year-day') as HTMLInputElement).value = '1'
        ;(
            document.querySelector(
                'input[name="monthly-recurrence-type"][value="day-of-month"]'
            ) as HTMLInputElement
        ).checked = true

        if (!recurrence || recurrence === '') {
            return
        }

        // Handle old string format (backward compatibility)
        if (typeof recurrence === 'string') {
            ;(document.getElementById('task-recurrence-type') as HTMLSelectElement).value =
                recurrence
            return
        }

        // Handle new object format
        if (typeof recurrence === 'object' && recurrence.type) {
            ;(document.getElementById('task-recurrence-type') as HTMLSelectElement).value =
                recurrence.type

            // Weekly: specific days
            if (recurrence.type === 'weekly' && recurrence.daysOfWeek) {
                recurrence.daysOfWeek.forEach((day: number) => {
                    const checkbox = document.querySelector(
                        `.recurrence-day-checkbox[value="${day}"]`
                    ) as HTMLInputElement
                    if (checkbox) checkbox.checked = true
                })
            }

            // Monthly: day of month OR nth weekday
            if (recurrence.type === 'monthly') {
                if (recurrence.dayOfMonth) {
                    ;(
                        document.querySelector(
                            'input[name="monthly-recurrence-type"][value="day-of-month"]'
                        ) as HTMLInputElement
                    ).checked = true
                    ;(
                        document.getElementById('recurrence-day-of-month') as HTMLInputElement
                    ).value = recurrence.dayOfMonth.toString()
                } else if (recurrence.nthWeekday) {
                    ;(
                        document.querySelector(
                            'input[name="monthly-recurrence-type"][value="nth-weekday"]'
                        ) as HTMLInputElement
                    ).checked = true
                    ;(document.getElementById('recurrence-nth') as HTMLInputElement).value =
                        recurrence.nthWeekday.n.toString()
                    ;(document.getElementById('recurrence-weekday') as HTMLInputElement).value =
                        recurrence.nthWeekday.weekday.toString()
                }
            }

            // Yearly: specific day of year
            if (recurrence.type === 'yearly' && recurrence.dayOfYear) {
                const [month, day] = recurrence.dayOfYear.split('-').map(Number)
                ;(document.getElementById('recurrence-year-month') as HTMLInputElement).value =
                    month.toString()
                ;(document.getElementById('recurrence-year-day') as HTMLInputElement).value =
                    day.toString()
            }
        }
    }

    /**
     * Build recurrence object from form fields
     * @returns {string|object} Recurrence configuration
     */
    buildRecurrenceFromForm (): string | RecurrencePattern {
        const recurrenceType = (
            document.getElementById('task-recurrence-type') as HTMLSelectElement
        ).value

        if (!recurrenceType || recurrenceType === '') {
            return ''
        }

        // For simple cases (daily), just return the string for backward compatibility
        if (recurrenceType === 'daily') {
            return 'daily'
        }

        const recurrence: RecurrencePattern = { type: recurrenceType as any }

        // Weekly: specific days
        if (recurrenceType === 'weekly') {
            const checkboxes = document.querySelectorAll('.recurrence-day-checkbox:checked')
            const selectedDays = Array.from(checkboxes).map((cb) =>
                parseInt((cb as HTMLInputElement).value)
            )

            if (selectedDays.length > 0) {
                recurrence.daysOfWeek = selectedDays.sort()
            } else {
                // If no days selected, default to simple weekly
                return 'weekly'
            }
        }

        // Monthly: day of month OR nth weekday
        if (recurrenceType === 'monthly') {
            const monthlyType = (
                document.querySelector(
                    'input[name="monthly-recurrence-type"]:checked'
                ) as HTMLInputElement
            ).value

            if (monthlyType === 'day-of-month') {
                const dayOfMonth = parseInt(
                    (document.getElementById('recurrence-day-of-month') as HTMLInputElement).value
                )
                if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
                    recurrence.dayOfMonth = dayOfMonth
                } else {
                    return 'monthly' // Default to simple monthly
                }
            } else if (monthlyType === 'nth-weekday') {
                const n = parseInt(
                    (document.getElementById('recurrence-nth') as HTMLInputElement).value
                )
                const weekday = parseInt(
                    (document.getElementById('recurrence-weekday') as HTMLInputElement).value
                )
                recurrence.nthWeekday = { n, weekday }
            }
        }

        // Yearly: specific day of year
        if (recurrenceType === 'yearly') {
            const month = parseInt(
                (document.getElementById('recurrence-year-month') as HTMLInputElement).value
            )
            const day = parseInt(
                (document.getElementById('recurrence-year-day') as HTMLInputElement).value
            )

            if (month && day) {
                recurrence.dayOfYear = `${month}-${day}`
            } else {
                return 'yearly' // Default to simple yearly
            }
        }

        return recurrence
    }

    /**
     * Get display label for recurrence
     * @param {string|object} recurrence - Recurrence value
     * @returns {string} Human-readable recurrence label
     */
    getRecurrenceLabel (recurrence: string | RecurrencePattern | any): string {
        if (!recurrence) {
            return ''
        }

        // Handle old string format (backward compatibility)
        if (typeof recurrence === 'string') {
            return RecurrenceLabels[recurrence] || recurrence
        }

        // Handle new object format
        if (typeof recurrence === 'object' && recurrence.type) {
            const baseLabel = RecurrenceLabels[recurrence.type] || recurrence.type

            // Add details for complex recurrences
            const details: string[] = []
            if (recurrence.type === 'weekly' && recurrence.daysOfWeek) {
                const dayNames = recurrence.daysOfWeek.map(
                    (day: number) => WeekdayNames[day] || day.toString()
                )
                details.push(`(${dayNames.join(', ')})`)
            } else if (recurrence.type === 'monthly' && recurrence.dayOfMonth) {
                details.push(`(day ${recurrence.dayOfMonth})`)
            } else if (recurrence.type === 'monthly' && recurrence.nthWeekday) {
                const nthLabel = NthWeekdayLabels[recurrence.nthWeekday.n]
                const weekdayLabel = WeekdayNames[recurrence.nthWeekday.weekday]
                details.push(`(${nthLabel} ${weekdayLabel})`)
            } else if (recurrence.type === 'yearly' && recurrence.dayOfYear) {
                const [month, day] = recurrence.dayOfYear.split('-')
                details.push(`(${month}/${day})`)
            }

            return details.length > 0 ? `${baseLabel} ${details.join(' ')}` : baseLabel
        }

        // Fallback
        return String(recurrence)
    }

    /**
     * Render subtasks in modal
     * @param {Array} subtasks - Array of subtasks
     */
    renderSubtasksInModal (subtasks: Array<{ title: string; completed: boolean }>) {
        const container = document.getElementById('subtasks-container')
        if (!container) return

        if (!subtasks || subtasks.length === 0) {
            container.innerHTML =
                '<p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: var(--spacing-sm);">No subtasks yet. Add subtasks to break down this task into smaller steps.</p>'
            return
        }

        container.innerHTML = subtasks
            .map(
                (subtask, index) => `
            <div data-subtask-index="${index}" style="display: flex; align-items: center; gap: var(--spacing-sm); padding: 6px 0; border-bottom: 1px solid var(--bg-secondary);">
                <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="app.toggleSubtaskCompletion?.(${index})" style="margin-right: 4px;">
                <span style="flex: 1; ${subtask.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${this.escapeHtml(subtask.title)}</span>
                <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 2px 6px;" onclick="app.removeSubtask?.(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `
            )
            .join('')
    }

    /**
     * Add a subtask
     */
    addSubtask () {
        const input = document.getElementById('new-subtask-input') as HTMLInputElement
        const title = input.value.trim()

        if (!title) return

        const currentSubtasks = this.getSubtasksFromModal()

        currentSubtasks.push({
            title,
            completed: false
        })

        this.renderSubtasksInModal(currentSubtasks)
        input.value = ''
    }

    /**
     * Remove a subtask
     * @param {number} index - Subtask index
     */
    removeSubtask (index: number) {
        const currentSubtasks = this.getSubtasksFromModal()
        currentSubtasks.splice(index, 1)
        this.renderSubtasksInModal(currentSubtasks)
    }

    /**
     * Toggle subtask completion
     * @param {number} index - Subtask index
     */
    toggleSubtaskCompletion (index: number) {
        const currentSubtasks = this.getSubtasksFromModal()
        if (currentSubtasks[index]) {
            currentSubtasks[index].completed = !currentSubtasks[index].completed
            this.renderSubtasksInModal(currentSubtasks)
        }
    }

    /**
     * Get subtasks from modal
     * @returns {Array} Array of subtasks
     */
    getSubtasksFromModal (): Array<{ title: string; completed: boolean }> {
        const container = document.getElementById('subtasks-container')
        if (!container) return []

        const subtaskElements = container.querySelectorAll('div[data-subtask-index]')
        const subtasks: Array<{ title: string; completed: boolean }> = []

        subtaskElements.forEach((el) => {
            const index = parseInt((el as HTMLElement).dataset.subtaskIndex || '0')
            const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement
            const span = el.querySelector('span')
            if (span) {
                subtasks[index] = {
                    title: span.textContent || '',
                    completed: checkbox.checked
                }
            }
        })

        return subtasks
    }

    /**
     * Render waiting for tasks list (dependencies)
     * @param {Task} currentTask - Current task being edited
     */
    renderWaitingForTasksList (currentTask: Task | null) {
        const container = document.getElementById('waiting-for-tasks-list')
        const currentTaskId = currentTask ? currentTask.id : null

        // Get all incomplete tasks except the current one
        const availableTasks = this.state.tasks.filter(
            (t) => !t.completed && t.id !== currentTaskId && t.status !== 'completed'
        )

        if (availableTasks.length === 0) {
            if (container) {
                container.innerHTML =
                    '<p style="color: var(--text-secondary); font-size: 0.875rem;">No other tasks available</p>'
            }
            return
        }

        if (!container) return
        container.innerHTML = ''

        availableTasks.forEach((task) => {
            const wrapper = document.createElement('div')
            wrapper.style.display = 'flex'
            wrapper.style.alignItems = 'center'
            wrapper.style.padding = '4px 0'
            wrapper.style.borderBottom = '1px solid var(--bg-secondary)'

            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            checkbox.id = `dep-task-${task.id}`
            checkbox.value = task.id
            checkbox.style.width = '16px'
            checkbox.style.height = '16px'
            checkbox.style.marginRight = '8px'
            checkbox.style.flexShrink = '0'

            // Check if this task is already a dependency
            if (
                currentTask &&
                currentTask.waitingForTaskIds &&
                currentTask.waitingForTaskIds.includes(task.id)
            ) {
                checkbox.checked = true
            }

            const label = document.createElement('label')
            label.htmlFor = `dep-task-${task.id}`
            label.textContent = task.title
            label.style.flex = '1'
            label.style.fontSize = '0.875rem'
            label.style.cursor = 'pointer'

            wrapper.appendChild(checkbox)
            wrapper.appendChild(label)

            // Add status badge
            const status = document.createElement('span')
            status.textContent = task.status
            status.style.fontSize = '0.75rem'
            status.style.padding = '2px 6px'
            status.style.borderRadius = '4px'
            status.style.marginLeft = '8px'
            status.style.backgroundColor = 'var(--bg-secondary)'
            status.style.color = 'var(--text-secondary)'
            wrapper.appendChild(status)

            // Add project badge if task belongs to a project
            if (task.projectId) {
                const project = this.state.projects.find((p) => p.id === task.projectId)
                if (project) {
                    const projectBadge = document.createElement('span')
                    projectBadge.textContent = project.title
                    projectBadge.style.fontSize = '0.75rem'
                    projectBadge.style.padding = '2px 6px'
                    projectBadge.style.borderRadius = '4px'
                    projectBadge.style.marginLeft = '6px'
                    projectBadge.style.backgroundColor = 'var(--accent-color)'
                    projectBadge.style.color = 'white'
                    projectBadge.style.fontWeight = '500'
                    wrapper.appendChild(projectBadge)
                }
            }

            container.appendChild(wrapper)
        })
    }

    /**
     * Get selected waiting for tasks (dependencies)
     * @returns {Array} Array of task IDs
     */
    getSelectedWaitingForTasks (): string[] {
        const selectedIds: string[] = []
        const checkboxes = document.querySelectorAll(
            '#waiting-for-tasks-list input[type="checkbox"]:checked'
        )
        checkboxes.forEach((cb) => {
            selectedIds.push((cb as HTMLInputElement).value)
        })
        return selectedIds
    }

    /**
     * Save task from form data
     */
    async saveTaskFromForm () {
        const taskId = (document.getElementById('task-id') as HTMLInputElement).value
        const tagsValue = (document.getElementById('task-contexts') as HTMLInputElement).value
        let tags = tagsValue
            ? tagsValue
                .split(',')
                .map((t) => t.trim())
                .filter((t) => t)
            : []

        // Ensure all contexts start with @
        tags = tags.map(
            (context) =>
                this.app.normalizeContextName?.(context) ||
                (context.startsWith('@') ? context : `@${context}`)
        )

        let status = (document.getElementById('task-status') as HTMLSelectElement)
            .value as TaskStatus
        const projectId =
            (document.getElementById('task-project') as HTMLSelectElement).value || null

        // GTD Rule: If task is being assigned to a project and is in Inbox,
        // automatically move it to Next Actions
        if (projectId && status === 'inbox') {
            status = 'next'
        }

        // Get waiting for data
        const waitingForDescription =
            (document.getElementById('task-waiting-for-description') as HTMLInputElement).value ||
            ''
        const waitingForTaskIds = this.getSelectedWaitingForTasks()

        // GTD Rule: If task has dependencies and is in Next or Someday, automatically move to Waiting
        // This ensures blocked tasks are visible in the Waiting view
        if (waitingForTaskIds.length > 0 && (status === 'next' || status === 'someday')) {
            status = 'waiting'
        }

        const newType = (document.getElementById('task-type') as HTMLSelectElement)
            .value as TaskType

        // Save state for undo
        this.app.saveState?.(taskId ? 'Edit task' : 'Create task')

        if (taskId) {
            // Update existing item - check both tasks and projects arrays
            const existingTask = this.state.tasks.find((t) => t.id === taskId)
            const existingProject = this.state.projects.find((p) => p.id === taskId)
            const existingItem = existingTask || existingProject
            const oldType = existingTask ? 'task' : existingProject ? 'project' : null

            if (existingItem) {
                // Check if type is changing
                if (oldType !== newType) {
                    // Type conversion: task <-> project
                    if (newType === 'project' && oldType === 'task') {
                        // Convert task to project
                        const projectData = {
                            id: taskId,
                            title: (document.getElementById('task-title') as HTMLInputElement)
                                .value,
                            description: (
                                document.getElementById('task-description') as HTMLTextAreaElement
                            ).value,
                            status: (status === 'inbox' ? 'active' : status) as ProjectStatus,
                            contexts: tags,
                            position: existingItem.position || 0
                        }

                        // Remove from tasks array
                        this.state.tasks = this.state.tasks.filter((t) => t.id !== taskId)

                        // Add to projects array
                        const project = new Project(projectData)
                        this.state.projects.push(project)

                        await this.app.saveTasks?.()
                        await this.app.saveProjects?.()
                        this.closeTaskModal()
                        this.app.renderView?.()
                        this.app.updateCounts?.()
                        this.app.updateContextFilter?.()
                        this.app.renderProjectsDropdown?.()
                        return
                    } else if (newType === 'task' && oldType === 'project') {
                        // Convert project to task
                        const taskData: TaskData = {
                            id: taskId,
                            title: (document.getElementById('task-title') as HTMLInputElement)
                                .value,
                            description: (
                                document.getElementById('task-description') as HTMLTextAreaElement
                            ).value,
                            type: 'task',
                            status: ((status as string) === 'active'
                                ? 'next'
                                : status) as TaskStatus,
                            energy: (document.getElementById('task-energy') as HTMLSelectElement)
                                .value as any,
                            time:
                                parseInt(
                                    (document.getElementById('task-time') as HTMLInputElement).value
                                ) || 0,
                            projectId,
                            contexts: tags,
                            dueDate:
                                (document.getElementById('task-due-date') as HTMLInputElement)
                                    .value || null,
                            deferDate:
                                (document.getElementById('task-defer-date') as HTMLInputElement)
                                    .value || null,
                            waitingForDescription,
                            waitingForTaskIds,
                            recurrence: this.buildRecurrenceFromForm(),
                            recurrenceEndDate:
                                (
                                    document.getElementById(
                                        'task-recurrence-end-date'
                                    ) as HTMLInputElement
                                ).value || null,
                            notes:
                                (document.getElementById('task-notes') as HTMLTextAreaElement)
                                    .value || '',
                            subtasks: this.getSubtasksFromModal()
                        }

                        // Remove from projects array
                        this.state.projects = this.state.projects.filter((p) => p.id !== taskId)

                        // Add to tasks array
                        const task = new Task(taskData)
                        this.state.tasks.push(task)

                        await this.app.saveTasks?.()
                        await this.app.saveProjects?.()
                        this.closeTaskModal()
                        this.app.renderView?.()
                        this.app.updateCounts?.()
                        this.app.updateContextFilter?.()
                        this.app.renderProjectsDropdown?.()
                        return
                    }
                }

                // No type change or unsupported conversion - just update
                if (existingTask) {
                    // Track if project assignment changed
                    const oldProjectId = existingTask.projectId

                    const taskData: TaskData = {
                        title: (document.getElementById('task-title') as HTMLInputElement).value,
                        description: (
                            document.getElementById('task-description') as HTMLTextAreaElement
                        ).value,
                        type: newType,
                        status,
                        energy: (document.getElementById('task-energy') as HTMLSelectElement)
                            .value as any,
                        time:
                            parseInt(
                                (document.getElementById('task-time') as HTMLInputElement).value
                            ) || 0,
                        projectId,
                        contexts: tags,
                        dueDate:
                            (document.getElementById('task-due-date') as HTMLInputElement).value ||
                            null,
                        deferDate:
                            (document.getElementById('task-defer-date') as HTMLInputElement)
                                .value || null,
                        waitingForDescription,
                        waitingForTaskIds,
                        recurrence: this.buildRecurrenceFromForm(),
                        recurrenceEndDate:
                            (
                                document.getElementById(
                                    'task-recurrence-end-date'
                                ) as HTMLInputElement
                            ).value || null,
                        notes:
                            (document.getElementById('task-notes') as HTMLTextAreaElement).value ||
                            '',
                        subtasks: this.getSubtasksFromModal()
                    }
                    Object.assign(existingTask, taskData)
                    existingTask.updatedAt = new Date().toISOString()
                    await this.app.saveTasks?.()

                    // Update project dropdown if task was assigned to a different project
                    if (oldProjectId !== projectId) {
                        this.app.renderProjectsDropdown?.()
                    }
                } else if (existingProject) {
                    const projectData = {
                        title: (document.getElementById('task-title') as HTMLInputElement).value,
                        description: (
                            document.getElementById('task-description') as HTMLTextAreaElement
                        ).value,
                        status: status === 'inbox' ? 'active' : status,
                        contexts: tags
                    }
                    Object.assign(existingProject, projectData)
                    existingProject.updatedAt = new Date().toISOString()
                    await this.app.saveProjects?.()
                }
            }
        } else {
            // Create new item
            if (newType === 'project') {
                // Creating a new project directly
                const projectData = {
                    title: (document.getElementById('task-title') as HTMLInputElement).value,
                    description: (
                        document.getElementById('task-description') as HTMLTextAreaElement
                    ).value,
                    status: (status === 'inbox' ? 'active' : status) as ProjectStatus,
                    contexts: tags
                }
                const project = new Project(projectData)
                this.state.projects.push(project)
                await this.app.saveProjects?.()
            } else {
                // Creating a new task or reference
                const taskData: TaskData = {
                    title: (document.getElementById('task-title') as HTMLInputElement).value,
                    description: (
                        document.getElementById('task-description') as HTMLTextAreaElement
                    ).value,
                    type: newType,
                    status,
                    energy: (document.getElementById('task-energy') as HTMLSelectElement)
                        .value as any,
                    time:
                        parseInt(
                            (document.getElementById('task-time') as HTMLInputElement).value
                        ) || 0,
                    projectId,
                    contexts: tags,
                    dueDate:
                        (document.getElementById('task-due-date') as HTMLInputElement).value ||
                        null,
                    deferDate:
                        (document.getElementById('task-defer-date') as HTMLInputElement).value ||
                        null,
                    waitingForDescription,
                    waitingForTaskIds,
                    recurrence: this.buildRecurrenceFromForm(),
                    recurrenceEndDate:
                        (document.getElementById('task-recurrence-end-date') as HTMLInputElement)
                            .value || null,
                    notes:
                        (document.getElementById('task-notes') as HTMLTextAreaElement).value || '',
                    subtasks: this.getSubtasksFromModal()
                }
                const task = new Task(taskData)
                this.state.tasks.push(task)
                await this.app.saveTasks?.()

                // Track usage for smart defaults
                this.app.trackTaskUsage?.(task)
            }
        }

        // If we created a new project or edited an existing one, save projects
        if (newType === 'project' && !taskId) {
            await this.app.saveProjects?.()
        }

        this.closeTaskModal()
        this.app.renderView?.()
        this.app.updateCounts?.()
        this.app.updateContextFilter?.()

        // Update project dropdown if:
        // 1. Creating/editing a project, OR
        // 2. Creating a new task with a project assignment
        if (newType === 'project' || (newType === 'task' && projectId && !taskId)) {
            this.app.renderProjectsDropdown?.()
        }
    }

    /**
     * Utility: Escape HTML
     */
    escapeHtml (text: string): string {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
}
