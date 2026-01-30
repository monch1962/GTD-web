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
import { Task } from '../../models';
import type { Template } from '../../models';
interface State {
    tasks: Task[];
    templates: Template[];
    projects: Array<{
        id: string;
        title: string;
    }>;
}
interface App {
    saveTasks?: () => Promise<void> | void;
    renderView?: () => void;
    updateCounts?: () => void;
    showToast?: (message: string) => void;
    saveState?: (description: string) => void;
    selectTemplateForQuickCapture?: (templateId: string) => void;
}
export declare class GlobalQuickCaptureManager {
    private state;
    private app;
    constructor(state: State, app: App);
    /**
     * Setup the global quick capture feature
     */
    setupGlobalQuickCapture(): void;
    /**
     * Open the global quick capture overlay
     */
    openGlobalQuickCapture(): void;
    /**
     * Close the global quick capture overlay
     */
    closeGlobalQuickCapture(): void;
    /**
     * Handle quick capture input and create task
     * @param input - User input text
     */
    handleGlobalQuickCapture(input: string): void;
    /**
     * Toggle quick capture templates visibility
     */
    toggleQuickCaptureTemplates(): void;
    /**
     * Select a template and create task from it
     * @param templateId - ID of template to use
     */
    selectTemplateForQuickCapture(templateId: string): void;
    /**
     * Parse quick capture input with NLP
     * @param input - Raw user input
     * @returns Parsed task data
     */
    private parseQuickCaptureInput;
    /**
     * Render quick capture templates list
     * @param container - Container element
     */
    private renderQuickCaptureTemplates;
}
export {};
//# sourceMappingURL=global-quick-capture.d.ts.map