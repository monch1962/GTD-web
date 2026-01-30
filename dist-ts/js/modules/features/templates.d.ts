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
import { Template, TemplateData, TemplateCategory, Task } from '../../models';
interface AppState {
    tasks: Task[];
    templates: Template[];
    defaultContexts: string[];
}
interface AppDependencies {
    saveState?: (description: string) => void;
    saveTemplates?: () => Promise<void>;
    saveTasks?: () => Promise<void>;
    renderView?: () => void;
    updateCounts?: () => void;
    showNotification?: (message: string, type?: string) => void;
    editTemplate?: (templateId: string) => void;
    deleteTemplate?: (templateId: string) => Promise<void>;
    createTaskFromTemplate?: (templateId: string) => Promise<void>;
    removeTemplateSubtask?: (index: number) => void;
}
export declare class TemplatesManager {
    private state;
    private app;
    constructor(state: AppState, app: AppDependencies);
    /**
     * Setup templates functionality
     */
    setupTemplates(): void;
    /**
     * Open templates list modal
     */
    openTemplatesModal(): void;
    /**
     * Close templates list modal
     */
    closeTemplatesModal(): void;
    /**
     * Open template edit modal
     */
    openTemplateEditModal(templateId?: string | null): void;
    /**
     * Close template edit modal
     */
    closeTemplateEditModal(): void;
    /**
     * Handle template form submission
     */
    handleTemplateFormSubmit(e: Event): Promise<void>;
    /**
     * Delete a template
     */
    deleteTemplate(templateId: string): Promise<void>;
    /**
     * Save task as a template
     */
    saveTaskAsTemplate(taskId: string): void;
    /**
     * Open template edit modal with pre-filled data
     */
    openTemplateEditModalWithData(templateData: TemplateData): void;
    /**
     * Create task from template
     */
    createTaskFromTemplate(templateId: string): Promise<void>;
    /**
     * Render templates list grouped by category
     */
    renderTemplatesList(): void;
    /**
     * Edit template
     */
    editTemplate(templateId: string): void;
    /**
     * Render template contexts selection
     */
    renderTemplateContexts(selectedContexts?: string[]): void;
    /**
     * Get selected template contexts
     */
    getSelectedTemplateContexts(): string[];
    /**
     * Render template subtasks
     */
    renderTemplateSubtasks(subtasks?: Array<{
        title: string;
        completed: boolean;
    }>): void;
    /**
     * Add a subtask to template
     */
    addTemplateSubtask(): void;
    /**
     * Remove a subtask from template
     */
    removeTemplateSubtask(index: number): void;
    /**
     * Get template subtasks from form
     */
    getTemplateSubtasks(): Array<{
        title: string;
        completed: boolean;
    }>;
    /**
     * Get custom contexts from localStorage
     * @returns Array of custom context names
     */
    getCustomContexts(): string[];
    /**
     * Get templates by category
     * @param category - Category to filter by
     * @returns Array of templates
     */
    getTemplatesByCategory(category: TemplateCategory): Template[];
    /**
     * Search templates by title/description
     * @param query - Search query
     * @returns Array of matching templates
     */
    searchTemplates(query: string): Template[];
}
export {};
//# sourceMappingURL=templates.d.ts.map