/**
 * GTD Data Models - TypeScript Version
 * This is a direct TypeScript conversion of the original models.js
 */
export type TaskType = 'task' | 'project' | 'reference';
export type TaskStatus = 'inbox' | 'next' | 'waiting' | 'someday' | 'completed';
export type EnergyLevel = 'high' | 'medium' | 'low' | '';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'biweekly' | '';
export interface RecurrencePattern {
    type: RecurrenceType;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    nthWeekday?: {
        n: number;
        weekday: number;
    };
    dayOfYear?: string | {
        month: number;
        day: number;
    };
}
export interface Subtask {
    title: string;
    completed: boolean;
}
export interface TaskData {
    id?: string;
    title?: string;
    description?: string;
    type?: TaskType;
    status?: TaskStatus;
    energy?: EnergyLevel;
    time?: number;
    timeSpent?: number;
    projectId?: string | null;
    contexts?: string[];
    tags?: string[];
    completed?: boolean;
    completedAt?: string | null;
    dueDate?: string | null;
    deferDate?: string | null;
    waitingForTaskIds?: string[];
    waitingForDescription?: string;
    recurrence?: string | RecurrencePattern;
    recurrenceEndDate?: string | null;
    recurrenceParentId?: string | null;
    position?: number;
    starred?: boolean;
    notes?: string;
    subtasks?: Subtask[];
    url?: string;
    createdAt?: string;
    updatedAt?: string;
}
export declare class Task {
    id: string;
    title: string;
    description: string;
    type: TaskType;
    status: TaskStatus;
    energy: EnergyLevel;
    time: number;
    timeSpent: number;
    projectId: string | null;
    contexts: string[];
    completed: boolean;
    completedAt: string | null;
    dueDate: string | null;
    deferDate: string | null;
    waitingForTaskIds: string[];
    waitingForDescription: string;
    recurrence: string | RecurrencePattern;
    recurrenceEndDate: string | null;
    recurrenceParentId: string | null;
    position: number;
    starred: boolean;
    notes: string;
    subtasks: Subtask[];
    url: string;
    createdAt: string;
    updatedAt: string;
    constructor(data?: TaskData);
    generateId(): string;
    toJSON(): TaskData;
    static fromJSON(json: TaskData): Task;
    markComplete(): void;
    markIncomplete(): void;
    toggleStar(): boolean;
    /**
     * Check if task is available (not deferred or defer date has passed)
     */
    isAvailable(): boolean;
    /**
     * Check if task is overdue (due date has passed and not completed)
     */
    isOverdue(): boolean;
    /**
     * Check if task is due today
     */
    isDueToday(): boolean;
    /**
     * Check if task is due within the next N days
     */
    isDueWithin(days: number): boolean;
    /**
     * Check if task dependencies are met (for waiting tasks)
     * Requires all dependent tasks to be completed
     */
    areDependenciesMet(allTasks: Task[]): boolean;
    /**
     * Get pending (not completed) dependencies
     */
    getPendingDependencies(allTasks: Task[]): Task[];
    /**
     * Check if this is a recurring task
     */
    isRecurring(): boolean;
    /**
     * Get recurrence type (handles both old and new formats)
     */
    getRecurrenceType(): RecurrenceType | null;
    /**
     * Check if recurrence should end (has passed end date)
     */
    shouldRecurrenceEnd(): boolean;
    /**
     * Calculate the next occurrence date based on recurrence interval
     * Uses the due date if available, otherwise uses today's date
     * Supports both old string format and new object format
     */
    getNextOccurrenceDate(): string | null;
    /**
     * Calculate next occurrence for advanced recurrence patterns
     */
    private getNextOccurrenceDateAdvanced;
    /**
     * Get the number of days in a month
     */
    private getDaysInMonth;
    /**
     * Create a new instance of this recurring task
     * Returns a new Task object with updated dates and same properties
     */
    createNextInstance(): Task | null;
}
export type ProjectStatus = 'active' | 'someday' | 'completed' | 'archived';
export interface ProjectData {
    id?: string;
    title?: string;
    description?: string;
    status?: ProjectStatus;
    contexts?: string[];
    tags?: string[];
    position?: number;
    createdAt?: string;
    updatedAt?: string;
}
export declare class Project {
    id: string;
    title: string;
    description: string;
    status: ProjectStatus;
    contexts: string[];
    position: number;
    createdAt: string;
    updatedAt: string;
    constructor(data?: ProjectData);
    generateId(): string;
    toJSON(): ProjectData;
    static fromJSON(json: ProjectData): Project;
}
export interface ReferenceData {
    id?: string;
    title?: string;
    description?: string;
    contexts?: string[];
    tags?: string[];
    url?: string;
    createdAt?: string;
    updatedAt?: string;
}
export declare class Reference {
    id: string;
    title: string;
    description: string;
    contexts: string[];
    url: string;
    createdAt: string;
    updatedAt: string;
    constructor(data?: ReferenceData);
    generateId(): string;
    toJSON(): ReferenceData;
    static fromJSON(json: ReferenceData): Reference;
}
export type TemplateCategory = 'general' | 'work' | 'personal' | 'meeting' | 'checklist';
export interface TemplateData {
    id?: string;
    title?: string;
    description?: string;
    energy?: EnergyLevel;
    time?: number;
    contexts?: string[];
    notes?: string;
    subtasks?: Subtask[];
    category?: TemplateCategory;
    createdAt?: string;
    updatedAt?: string;
}
export declare class Template {
    id: string;
    title: string;
    description: string;
    energy: EnergyLevel;
    time: number;
    contexts: string[];
    notes: string;
    subtasks: Subtask[];
    category: TemplateCategory;
    createdAt: string;
    updatedAt: string;
    constructor(data?: TemplateData);
    generateId(): string;
    toJSON(): TemplateData;
    static fromJSON(json: TemplateData): Template;
    /**
     * Create a new Task instance from this template
     * @returns {Task} A new task with the template's properties
     */
    createTask(): Task;
}
//# sourceMappingURL=models.d.ts.map