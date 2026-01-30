/**
 * HTML Template Helpers
 * Reusable HTML template generators to reduce code duplication
 */
import { Task } from './models';
interface TaskTemplateOptions {
    isBulkSelectMode?: boolean;
    isBulkSelected?: boolean;
    showPriority?: boolean;
    showCountdown?: boolean;
}
interface ProjectTemplateOptions {
    showTaskCount?: boolean;
    showStatus?: boolean;
}
/**
 * Task HTML Templates
 */
export declare class TaskTemplates {
    /**
     * Creates a task item HTML string
     * @param task - Task object
     * @param options - Rendering options
     * @returns HTML string
     */
    static createTaskItem(task: Task, options?: TaskTemplateOptions): string;
    /**
     * Creates task metadata HTML
     * @private
     */
    private static _createTaskMeta;
    /**
     * Creates task action buttons HTML
     * @private
     */
    private static _createTaskActions;
    /**
     * Creates an empty state HTML string
     * @param message - Message to display
     * @param icon - Icon class (default: fa-inbox)
     * @returns HTML string
     */
    static createEmptyState(message: string, icon?: string): string;
    /**
     * Creates a loading spinner HTML string
     * @param message - Loading message
     * @returns HTML string
     */
    static createLoadingSpinner(message?: string): string;
}
/**
 * Project HTML Templates
 */
export declare class ProjectTemplates {
    /**
     * Creates a project card HTML string
     * @param project - Project object
     * @param taskCount - Number of tasks in project
     * @param options - Rendering options
     * @returns HTML string
     */
    static createProjectCard(project: any, taskCount: number, options?: ProjectTemplateOptions): string;
}
/**
 * Modal HTML Templates
 */
export declare class ModalTemplates {
    /**
     * Creates a confirmation modal HTML string
     * @param title - Modal title
     * @param message - Confirmation message
     * @param confirmText - Confirm button text
     * @param cancelText - Cancel button text
     * @returns HTML string
     */
    static createConfirmationModal(title: string, message: string, confirmText?: string, cancelText?: string): string;
    /**
     * Creates an alert modal HTML string
     * @param title - Modal title
     * @param message - Alert message
     * @param type - Alert type (success, error, warning, info)
     * @returns HTML string
     */
    static createAlertModal(title: string, message: string, type?: string): string;
}
export {};
//# sourceMappingURL=template-helpers.d.ts.map