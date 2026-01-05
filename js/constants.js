/**
 * GTD Web Application Constants
 * Centralized configuration and constants
 */

// Task statuses
export const TaskStatus = {
    INBOX: 'inbox',
    NEXT: 'next',
    WAITING: 'waiting',
    SOMEDAY: 'someday',
    COMPLETED: 'completed'
};

// Task types
export const TaskType = {
    TASK: 'task',
    REFERENCE: 'reference'
};

// Project statuses
export const ProjectStatus = {
    ACTIVE: 'active',
    SOMEDAY: 'someday',
    COMPLETED: 'completed'
};

// Energy levels
export const EnergyLevel = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

// Time estimates (in minutes)
export const TimeEstimate = {
    NONE: 0,
    FIVE: 5,
    FIFTEEN: 15,
    THIRTY: 30,
    SIXTY: 60,
    NINETY: 90
};

// Default contexts
export const DEFAULT_CONTEXTS = [
    '@home',
    '@work',
    '@personal',
    '@computer',
    '@phone'
];

// View names
export const Views = {
    INBOX: 'inbox',
    NEXT: 'next',
    WAITING: 'waiting',
    SOMEDAY: 'someday',
    PROJECTS: 'projects',
    REFERENCE: 'reference'
};

// Status colors for Gantt chart
export const StatusColors = {
    inbox: '#95a5a6',
    next: '#4a90d9',
    waiting: '#f39c12',
    someday: '#9b59b6',
    completed: '#5cb85c',
    overdue: '#e74c3c'
};

// Status display labels
export const StatusLabels = {
    inbox: 'Inbox',
    next: 'Next',
    waiting: 'Waiting',
    someday: 'Someday',
    completed: 'Completed'
};

// Element IDs
export const ElementIds = {
    quickAddInput: 'quick-add-input',
    taskModal: 'task-modal',
    taskForm: 'task-form',
    projectModal: 'project-modal',
    projectForm: 'project-form',
    ganttModal: 'gantt-modal',
    ganttChart: 'gantt-chart',
    tasksContainer: 'tasks-container',
    projectsContainer: 'projects-container',
    referenceContainer: 'reference-container',
    tagModal: 'tag-modal',
    tagForm: 'tag-form',
    waitingForTasksList: 'waiting-for-tasks-list',
    projectsDropdown: 'projects-dropdown',
    userId: 'user-id'
};

// Storage keys
export const StorageKeys = {
    TASKS: 'gtd_tasks',
    PROJECTS: 'gtd_projects',
    REFERENCE: 'gtd_reference',
    CUSTOM_CONTEXTS: 'gtd_custom_contexts',
    USER_ID: 'gtd_user_id'
};

// Gantt chart configuration
export const GanttConfig = {
    taskWidth: 200,
    taskHeight: 60,
    horizontalSpacing: 80,
    verticalSpacing: 100,
    marginLeft: 50,
    marginTop: 50,
    maxTitleLength: 25
};
