/**
 * GTD Data Models - TypeScript Version
 * This is a direct TypeScript conversion of the original models.js
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type TaskType = 'task' | 'project' | 'reference'
export type TaskStatus = 'inbox' | 'next' | 'waiting' | 'someday' | 'completed'
export type EnergyLevel = 'high' | 'medium' | 'low' | ''
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'biweekly' | ''

export interface RecurrencePattern {
    type: RecurrenceType
    daysOfWeek?: number[] // 0-6, where 0 is Sunday
    dayOfMonth?: number // 1-31
    nthWeekday?: { n: number; weekday: number } // n: 1-5, weekday: 0-6
    dayOfYear?: string | { month: number; day: number } // string: 'MM-DD' or object: {month, day}
}

export interface Subtask {
    title: string
    completed: boolean
}

export interface TaskData {
    id?: string
    title?: string
    description?: string
    type?: TaskType
    status?: TaskStatus
    energy?: EnergyLevel
    time?: number
    timeSpent?: number
    projectId?: string | null
    contexts?: string[]
    tags?: string[] // Legacy property name, migrated to contexts
    completed?: boolean
    completedAt?: string | null
    dueDate?: string | null // YYYY-MM-DD format
    deferDate?: string | null // YYYY-MM-DD format
    waitingForTaskIds?: string[]
    waitingForDescription?: string
    recurrence?: string | RecurrencePattern
    recurrenceEndDate?: string | null
    recurrenceParentId?: string | null
    position?: number
    starred?: boolean
    notes?: string
    subtasks?: Subtask[]
    url?: string // For reference-type tasks
    createdAt?: string
    updatedAt?: string
}

// ============================================================================
// Task Class
// ============================================================================

export class Task {
    id: string
    title: string
    description: string
    type: TaskType
    status: TaskStatus
    energy: EnergyLevel
    time: number
    timeSpent: number
    projectId: string | null
    contexts: string[]
    completed: boolean
    completedAt: string | null
    dueDate: string | null
    deferDate: string | null
    waitingForTaskIds: string[]
    waitingForDescription: string
    recurrence: string | RecurrencePattern
    recurrenceEndDate: string | null
    recurrenceParentId: string | null
    position: number
    starred: boolean
    notes: string
    subtasks: Subtask[]
    url: string // For reference-type tasks
    createdAt: string
    updatedAt: string

    constructor (data: TaskData = {}) {
        this.id = data.id || this.generateId()
        this.title = data.title || ''
        this.description = data.description || ''
        this.type = data.type || 'task'
        this.status = data.status || 'inbox'
        this.energy = data.energy || ''
        this.time = data.time || 0
        this.timeSpent = data.timeSpent || 0
        this.projectId = data.projectId || null
        this.contexts = data.contexts || data.tags || [] // Support migration from old 'tags'
        this.completed = data.completed || false
        this.completedAt = data.completedAt || null
        this.dueDate = data.dueDate || null
        this.deferDate = data.deferDate || null
        this.waitingForTaskIds = data.waitingForTaskIds || []
        this.waitingForDescription = data.waitingForDescription || ''
        this.recurrence = data.recurrence || ''
        this.recurrenceEndDate = data.recurrenceEndDate || null
        this.recurrenceParentId = data.recurrenceParentId || null
        this.position = data.position || 0
        this.starred = data.starred || false
        this.notes = data.notes || ''
        this.subtasks = data.subtasks || []
        this.url = data.url || ''
        this.createdAt = data.createdAt || new Date().toISOString()
        this.updatedAt = data.updatedAt || new Date().toISOString()
    }

    generateId (): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    toJSON (): TaskData {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            type: this.type,
            status: this.status,
            energy: this.energy,
            time: this.time,
            timeSpent: this.timeSpent,
            projectId: this.projectId,
            contexts: this.contexts,
            completed: this.completed,
            completedAt: this.completedAt,
            dueDate: this.dueDate,
            deferDate: this.deferDate,
            waitingForTaskIds: this.waitingForTaskIds,
            waitingForDescription: this.waitingForDescription,
            recurrence: this.recurrence,
            recurrenceEndDate: this.recurrenceEndDate,
            recurrenceParentId: this.recurrenceParentId,
            position: this.position,
            starred: this.starred,
            notes: this.notes,
            subtasks: this.subtasks,
            url: this.url,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    }

    static fromJSON (json: TaskData): Task {
        return new Task(json)
    }

    markComplete (): void {
        this.completed = true
        this.completedAt = new Date().toISOString()
        this.status = 'completed'
        this.updatedAt = new Date().toISOString()
    }

    markIncomplete (): void {
        this.completed = false
        this.completedAt = null
        if (this.status === 'completed') {
            this.status = 'inbox'
        }
        this.updatedAt = new Date().toISOString()
    }

    toggleStar (): boolean {
        this.starred = !this.starred
        this.updatedAt = new Date().toISOString()
        return this.starred
    }

    /**
     * Check if task is available (not deferred or defer date has passed)
     */
    isAvailable (): boolean {
        if (!this.deferDate) return true
        const deferDate = new Date(this.deferDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return deferDate <= today
    }

    /**
     * Check if task is overdue (due date has passed and not completed)
     */
    isOverdue (): boolean {
        if (!this.dueDate || this.completed) return false
        const dueDate = new Date(this.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return dueDate < today
    }

    /**
     * Check if task is due today
     */
    isDueToday (): boolean {
        if (!this.dueDate || this.completed) return false
        const dueDate = new Date(this.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return dueDate >= today && dueDate < tomorrow
    }

    /**
     * Check if task is due within the next N days
     */
    isDueWithin (days: number): boolean {
        if (!this.dueDate || this.completed) return false
        const dueDate = new Date(this.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const futureDate = new Date(today)
        futureDate.setDate(futureDate.getDate() + days)
        return dueDate >= today && dueDate < futureDate
    }

    /**
     * Check if task dependencies are met (for waiting tasks)
     * Requires all dependent tasks to be completed
     */
    areDependenciesMet (allTasks: Task[]): boolean {
        if (!this.waitingForTaskIds || this.waitingForTaskIds.length === 0) {
            return true // No dependencies
        }

        // Check if all dependent tasks are completed
        return this.waitingForTaskIds.every((depTaskId) => {
            const depTask = allTasks.find((t) => t.id === depTaskId)
            return depTask && depTask.completed
        })
    }

    /**
     * Get pending (not completed) dependencies
     */
    getPendingDependencies (allTasks: Task[]): Task[] {
        if (!this.waitingForTaskIds || this.waitingForTaskIds.length === 0) {
            return []
        }

        return this.waitingForTaskIds
            .map((depTaskId) => allTasks.find((t) => t.id === depTaskId))
            .filter((task): task is Task => task !== undefined && !task.completed)
    }

    /**
     * Check if this is a recurring task
     */
    isRecurring (): boolean {
        if (!this.recurrence || this.recurrence === '') return false

        // Handle old string format
        if (typeof this.recurrence === 'string') {
            return true
        }

        // Handle new object format
        if (typeof this.recurrence === 'object' && (this.recurrence as RecurrencePattern).type) {
            return true
        }

        return false
    }

    /**
     * Get recurrence type (handles both old and new formats)
     */
    getRecurrenceType (): RecurrenceType | null {
        if (!this.recurrence) return null

        // Old string format
        if (typeof this.recurrence === 'string') {
            return this.recurrence as RecurrenceType
        }

        // New object format
        if (typeof this.recurrence === 'object' && (this.recurrence as RecurrencePattern).type) {
            return (this.recurrence as RecurrencePattern).type
        }

        return null
    }

    /**
     * Check if recurrence should end (has passed end date)
     */
    shouldRecurrenceEnd (): boolean {
        if (!this.recurrenceEndDate) return false
        const endDate = new Date(this.recurrenceEndDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return endDate < today
    }

    /**
     * Calculate the next occurrence date based on recurrence interval
     * Uses the due date if available, otherwise uses today's date
     * Supports both old string format and new object format
     */
    getNextOccurrenceDate (): string | null {
        const baseDate = this.dueDate ? new Date(this.dueDate) : new Date()
        baseDate.setHours(0, 0, 0, 0)

        const recurrenceType = this.getRecurrenceType()
        if (!recurrenceType) return null

        // Handle old string format (backward compatibility)
        if (typeof this.recurrence === 'string') {
            const nextDate = new Date(baseDate)
            switch (this.recurrence) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1)
                break
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7)
                break
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1)
                break
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1)
                break
            default:
                return null
            }
            return nextDate.toISOString().split('T')[0]
        }

        // Handle new object format
        if (typeof this.recurrence === 'object') {
            return this.getNextOccurrenceDateAdvanced(baseDate)
        }

        return null
    }

    /**
     * Calculate next occurrence for advanced recurrence patterns
     */
    private getNextOccurrenceDateAdvanced (baseDate: Date): string | null {
        const pattern = this.recurrence as RecurrencePattern
        const { type, daysOfWeek, dayOfMonth, nthWeekday, dayOfYear } = pattern
        const nextDate = new Date(baseDate)

        switch (type) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + 1)
            break

        case 'weekly':
            if (daysOfWeek && Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
                // Find the next occurrence of any of the specified days
                // Note: currentDayOfWeek is calculated but not used in this implementation
                // const currentDayOfWeek = nextDate.getDay() || 7 // Convert to 1-7 (Monday-Sunday)
                let daysUntilNext: number | null = null

                // Check each upcoming day to find the first matching day
                for (let i = 1; i <= 7; i++) {
                    const checkDate = new Date(nextDate)
                    checkDate.setDate(checkDate.getDate() + i)
                    const checkDayOfWeek = checkDate.getDay() || 7
                    if (daysOfWeek.includes(checkDayOfWeek)) {
                        daysUntilNext = i
                        break
                    }
                }

                if (daysUntilNext !== null) {
                    nextDate.setDate(nextDate.getDate() + daysUntilNext)
                }
            } else {
                // Default to next week if no days specified
                nextDate.setDate(nextDate.getDate() + 7)
            }
            break

        case 'monthly':
            if (dayOfMonth) {
                // Specific day of month (e.g., 15th of each month)
                nextDate.setMonth(nextDate.getMonth() + 1)
                nextDate.setDate(
                    Math.min(
                        dayOfMonth,
                        this.getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth() + 1)
                    )
                )
            } else if (nthWeekday) {
                // Nth weekday of month (e.g., 3rd Thursday)
                const { n, weekday } = nthWeekday
                nextDate.setMonth(nextDate.getMonth() + 1)
                const firstDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1)
                const firstWeekdayOfMonth = firstDayOfMonth.getDay() || 7

                // Calculate the date of the nth weekday
                const dayOffset = (weekday - firstWeekdayOfMonth + 7) % 7
                const targetDate = 1 + dayOffset + (n - 1) * 7

                // Ensure we don't go past the month (e.g., 5th Tuesday might not exist)
                const daysInMonth = this.getDaysInMonth(
                    nextDate.getFullYear(),
                    nextDate.getMonth() + 1
                )
                nextDate.setDate(Math.min(targetDate, daysInMonth))
            } else {
                // Default to same day next month
                nextDate.setMonth(nextDate.getMonth() + 1)
            }
            break

        case 'yearly':
            if (dayOfYear) {
                // Specific day of year (e.g., January 15th)
                let month: number, day: number

                if (typeof dayOfYear === 'string') {
                    // Handle string format like '12-25'
                    const [m, d] = dayOfYear.split('-').map(Number)
                    month = m
                    day = d
                } else {
                    // Handle object format
                    month = dayOfYear.month
                    day = dayOfYear.day
                }

                nextDate.setFullYear(nextDate.getFullYear() + 1)
                nextDate.setMonth(month - 1)
                nextDate.setDate(
                    Math.min(day, this.getDaysInMonth(nextDate.getFullYear(), month))
                )
            } else {
                // Default to same date next year
                nextDate.setFullYear(nextDate.getFullYear() + 1)
            }
            break

        default:
            return null
        }

        return nextDate.toISOString().split('T')[0]
    }

    /**
     * Get the number of days in a month
     */
    private getDaysInMonth (year: number, month: number): number {
        return new Date(year, month, 0).getDate()
    }

    /**
     * Create a new instance of this recurring task
     * Returns a new Task object with updated dates and same properties
     */
    createNextInstance (): Task | null {
        if (!this.isRecurring() || this.shouldRecurrenceEnd()) {
            return null
        }

        const nextDueDate = this.getNextOccurrenceDate()

        const nextTaskData: TaskData = {
            title: this.title,
            description: this.description,
            type: this.type,
            status: this.status === 'completed' ? 'inbox' : this.status,
            energy: this.energy,
            time: this.time,
            projectId: this.projectId,
            contexts: [...this.contexts],
            dueDate: nextDueDate,
            recurrence: this.recurrence,
            recurrenceEndDate: this.recurrenceEndDate,
            recurrenceParentId: this.recurrenceParentId || this.id // Keep track of original recurring task
        }

        return new Task(nextTaskData)
    }
}

// ============================================================================
// Project Class (separate from Task in current implementation)
// ============================================================================

export type ProjectStatus = 'active' | 'someday' | 'completed' | 'archived'

export interface ProjectData {
    id?: string
    title?: string
    description?: string
    status?: ProjectStatus
    contexts?: string[]
    tags?: string[] // Legacy property name, migrated to contexts
    position?: number
    createdAt?: string
    updatedAt?: string
}

export class Project {
    id: string
    title: string
    description: string
    status: ProjectStatus
    contexts: string[]
    position: number
    createdAt: string
    updatedAt: string

    constructor (data: ProjectData = {}) {
        this.id = data.id || this.generateId()
        this.title = data.title || ''
        this.description = data.description || ''
        this.status = data.status || 'active'
        this.contexts = data.contexts || data.tags || [] // Support migration from old 'tags'
        this.position = data.position || 0
        this.createdAt = data.createdAt || new Date().toISOString()
        this.updatedAt = data.updatedAt || new Date().toISOString()
    }

    generateId (): string {
        return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    toJSON (): ProjectData {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: this.status,
            contexts: this.contexts,
            position: this.position,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    }

    static fromJSON (json: ProjectData): Project {
        return new Project(json)
    }
}

// ============================================================================
// Reference Class (separate from Task in current implementation)
// ============================================================================

export interface ReferenceData {
    id?: string
    title?: string
    description?: string
    contexts?: string[]
    tags?: string[] // Legacy property name, migrated to contexts
    url?: string
    createdAt?: string
    updatedAt?: string
}

export class Reference {
    id: string
    title: string
    description: string
    contexts: string[]
    url: string
    createdAt: string
    updatedAt: string

    constructor (data: ReferenceData = {}) {
        this.id = data.id || this.generateId()
        this.title = data.title || ''
        this.description = data.description || ''
        this.contexts = data.contexts || data.tags || [] // Support migration from old 'tags'
        this.url = data.url || ''
        this.createdAt = data.createdAt || new Date().toISOString()
        this.updatedAt = data.updatedAt || new Date().toISOString()
    }

    generateId (): string {
        return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    toJSON (): ReferenceData {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            contexts: this.contexts,
            url: this.url,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    }

    static fromJSON (json: ReferenceData): Reference {
        return new Reference(json)
    }
}

// ============================================================================
// Template Class
// ============================================================================

export type TemplateCategory = 'general' | 'work' | 'personal' | 'meeting' | 'checklist'

export interface TemplateData {
    id?: string
    title?: string
    description?: string
    energy?: EnergyLevel
    time?: number
    contexts?: string[]
    notes?: string
    subtasks?: Subtask[]
    category?: TemplateCategory
    createdAt?: string
    updatedAt?: string
}

export class Template {
    id: string
    title: string
    description: string
    energy: EnergyLevel
    time: number
    contexts: string[]
    notes: string
    subtasks: Subtask[]
    category: TemplateCategory
    createdAt: string
    updatedAt: string

    constructor (data: TemplateData = {}) {
        this.id = data.id || this.generateId()
        this.title = data.title || ''
        this.description = data.description || ''
        this.energy = data.energy || ''
        this.time = data.time || 0
        this.contexts = data.contexts || []
        this.notes = data.notes || ''
        this.subtasks = data.subtasks || []
        this.category = data.category || 'general'
        this.createdAt = data.createdAt || new Date().toISOString()
        this.updatedAt = data.updatedAt || new Date().toISOString()
    }

    generateId (): string {
        return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    toJSON (): TemplateData {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            energy: this.energy,
            time: this.time,
            contexts: this.contexts,
            notes: this.notes,
            subtasks: this.subtasks,
            category: this.category,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    }

    static fromJSON (json: TemplateData): Template {
        return new Template(json)
    }

    /**
     * Create a new Task instance from this template
     * @returns {Task} A new task with the template's properties
     */
    createTask (): Task {
        const taskData: TaskData = {
            title: this.title,
            description: this.description,
            energy: this.energy,
            time: this.time,
            contexts: [...this.contexts],
            notes: this.notes,
            subtasks: this.subtasks.map((sub) => ({ ...sub })), // Deep copy subtasks
            status: 'inbox'
        }

        return new Task(taskData)
    }
}
