/**
 * GTD Web Application Constants - TypeScript Version
 * Centralized configuration and constants with type safety
 */
export type TaskStatusType = 'inbox' | 'next' | 'waiting' | 'someday' | 'completed';
export type TaskTypeType = 'task' | 'reference';
export type ProjectStatusType = 'active' | 'someday' | 'completed' | 'archived';
export type EnergyLevelType = 'high' | 'medium' | 'low';
export type RecurrenceIntervalType = '' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type WeekdayType = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type PriorityLevelType = 'Urgent' | 'High' | 'Medium' | 'Low' | 'Very Low';
export type ViewType = 'inbox' | 'next' | 'waiting' | 'someday' | 'projects' | 'reference' | 'all';
export type ContextActionType = 'edit' | 'duplicate' | 'toggle-star' | 'set-status' | 'set-energy' | 'set-project' | 'add-context' | 'remove-context' | 'set-due-date' | 'complete' | 'delete';
export interface ToastMessageTemplates {
    Task: {
        created: (count?: number) => string;
        completed: (count?: number) => string;
        deleted: (count?: number) => string;
        updated: () => string;
        duplicated: () => string;
        archived: (count?: number) => string;
        restored: () => string;
    };
    Status: {
        changed: (status: string) => string;
        updated: (status: string) => string;
    };
    Time: {
        tracked: (minutes: number, title: string) => string;
        started: () => string;
        stopped: () => string;
    };
    Project: {
        created: () => string;
        deleted: () => string;
        updated: () => string;
    };
    Undo: {
        saved: (action: string) => string;
        restored: (action: string) => string;
    };
    Focus: {
        entered: () => string;
        exited: () => string;
        completed: () => string;
    };
    Capture: {
        success: () => string;
        fromTemplate: (title: string) => string;
    };
}
export interface StorageInfo {
    used: number;
    total: number;
    percentage: number;
    available: number;
    nearQuota: boolean;
}
export declare const TaskStatus: {
    INBOX: TaskStatusType;
    NEXT: TaskStatusType;
    WAITING: TaskStatusType;
    SOMEDAY: TaskStatusType;
    COMPLETED: TaskStatusType;
};
export declare const TaskType: {
    TASK: TaskTypeType;
    REFERENCE: TaskTypeType;
};
export declare const ProjectStatus: {
    ACTIVE: ProjectStatusType;
    SOMEDAY: ProjectStatusType;
    COMPLETED: ProjectStatusType;
    ARCHIVED: ProjectStatusType;
};
export declare const EnergyLevel: {
    HIGH: EnergyLevelType;
    MEDIUM: EnergyLevelType;
    LOW: EnergyLevelType;
};
export declare const TimeEstimate: {
    NONE: number;
    FIVE: number;
    FIFTEEN: number;
    THIRTY: number;
    SIXTY: number;
    NINETY: number;
};
export declare const DEFAULT_CONTEXTS: string[];
export declare const Views: {
    INBOX: ViewType;
    NEXT: ViewType;
    WAITING: ViewType;
    SOMEDAY: ViewType;
    PROJECTS: ViewType;
    REFERENCE: ViewType;
};
export declare const StatusColors: Record<TaskStatusType | 'overdue', string>;
export declare const StatusLabels: Record<TaskStatusType, string>;
export declare const ViewLabels: Record<ViewType, string>;
export declare const ElementIds: {
    quickAddInput: string;
    taskModal: string;
    taskForm: string;
    projectModal: string;
    projectForm: string;
    ganttModal: string;
    ganttChart: string;
    tasksContainer: string;
    projectsContainer: string;
    referenceContainer: string;
    tagModal: string;
    tagForm: string;
    waitingForTasksList: string;
    projectsDropdown: string;
    userId: string;
};
export declare const StorageKeys: {
    TASKS: string;
    PROJECTS: string;
    REFERENCE: string;
    CUSTOM_CONTEXTS: string;
    USER_ID: string;
};
export declare const GanttConfig: {
    taskWidth: number;
    taskHeight: number;
    horizontalSpacing: number;
    verticalSpacing: number;
    marginLeft: number;
    marginTop: number;
    maxTitleLength: number;
};
export declare const RecurrenceInterval: {
    NONE: RecurrenceIntervalType;
    DAILY: RecurrenceIntervalType;
    WEEKLY: RecurrenceIntervalType;
    MONTHLY: RecurrenceIntervalType;
    YEARLY: RecurrenceIntervalType;
};
export declare const Weekday: Record<string, WeekdayType>;
export declare const WeekdayNames: Record<WeekdayType, string>;
export declare const NthWeekdayLabels: Record<number, string>;
export declare const RecurrenceLabels: Record<RecurrenceIntervalType, string>;
export declare const PomodoroConfig: {
    WORK_DURATION: number;
    BREAK_DURATION: number;
    LONG_BREAK_DURATION: number;
};
export declare const TimeThresholds: {
    ARCHIVE_TASKS_DAYS: number;
    STALLED_PROJECTS_DAYS: number;
    TASK_AGING_PENALTY_DAYS: number;
    TASK_AGING_HIGH_DAYS: number;
    TASK_AGING_MEDIUM_DAYS: number;
    DUE_SOON_DAYS: number;
    DUE_VERY_SOON_DAYS: number;
    COUNTDOWN_MAX_DAYS: number;
    COUNTDOWN_URGENT_DAYS: number;
    COUNTDOWN_WARNING_DAYS: number;
    COUNTDOWN_NORMAL_DAYS: number;
};
export declare const PriorityWeights: {
    BASE_SCORE: number;
    OVERDUE_BONUS: number;
    DUE_TODAY_BONUS: number;
    DUE_TOMORROW_BONUS: number;
    DUE_SOON_BONUS: number;
    DUE_WEEK_BONUS: number;
    STARRED_BONUS: number;
    NEXT_ACTION_BONUS: number;
    INBOX_BONUS: number;
    DEPENDENCY_READY_BONUS: number;
    DEPENDENCY_BLOCKED_PENALTY: number;
    QUICK_HIGH_ENERGY_BONUS: number;
    LONG_LOW_ENERGY_PENALTY: number;
    QUICK_TASK_BONUS: number;
    MEDIUM_TASK_BONUS: number;
    ACTIVE_PROJECT_BONUS: number;
    DEFER_PENALTY: number;
    OLD_TASK_BONUS: number;
    OLD_TASK_BONUS_MEDIUM: number;
    OLD_TASK_BONUS_LOW: number;
};
export declare const PriorityThresholds: {
    URGENT_MIN: number;
    HIGH_MIN: number;
    MEDIUM_MIN: number;
    LOW_MIN: number;
};
export declare const PriorityLabels: Record<PriorityLevelType, string>;
export declare const PriorityColors: Record<PriorityLevelType, string>;
export declare const UI: {
    TOAST_DURATION: number;
    TOAST_TIMEOUT: number;
    DEBOUNCE_DELAY: number;
    LONG_PRESS_DURATION: number;
    MAX_UNDO_STATES: number;
    HEATMAP_DAYS: number;
    SUGGESTIONS_MAX: number;
    DAILY_REVIEW_RECENT: number;
};
export declare const ModalIds: {
    TASK: string;
    PROJECT: string;
    CONTEXT: string;
    GANTT: string;
    DASHBOARD: string;
    HELP: string;
    TEMPLATES: string;
    DAILY_REVIEW: string;
    WEEKLY_REVIEW: string;
    ARCHIVE: string;
    DEPENDENCIES: string;
    HEATMAP: string;
    FOCUS_MODE: string;
    GLOBAL_QUICK_CAPTURE: string;
};
export declare const ToastMessages: ToastMessageTemplates;
export declare const ContextActions: Record<string, ContextActionType>;
export declare const HeatmapColors: {
    LEVEL_0: string;
    LEVEL_1: string;
    LEVEL_2: string;
    LEVEL_3: string;
    LEVEL_4: string;
};
export declare const VirtualScrollConfig: {
    ITEM_HEIGHT: number;
    BUFFER_ITEMS: number;
    THROTTLE_DELAY: number;
    DEBOUNCE_DELAY: number;
    ACTIVATION_THRESHOLD: number;
};
export declare const PerformanceThresholds: {
    SLOW_OPERATION_MS: number;
    HIGH_MEMORY_PERCENT: number;
    FPS_EXCELLENT: number;
    FPS_GOOD: number;
    FIRST_PAINT_MS: number;
    FIRST_CONTENTFUL_PAINT_MS: number;
};
export declare const StorageConfig: {
    QUOTA_WARNING_THRESHOLD: number;
    ESTIMATED_TOTAL_SIZE: number;
    ARCHIVE_MAX_AGE_DAYS: number;
    ARCHIVE_MAX_AGE_MS: number;
};
//# sourceMappingURL=constants.d.ts.map