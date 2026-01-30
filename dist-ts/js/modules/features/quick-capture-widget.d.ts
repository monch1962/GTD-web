/**
 * ============================================================================
 * Quick Capture Widget Manager - TypeScript Version
 * ============================================================================
 *
 * Manages the floating quick capture panel for fast task entry.
 *
 * This manager handles:
 * - Quick capture panel toggle (show/hide)
 * - Context buttons for quick tagging
 * - Keyboard shortcuts (Enter to submit, Escape to close)
 * - Click outside to close functionality
 */
/**
 * App interface for type safety
 */
interface App {
    quickAddTask?: (title: string) => Promise<void>;
    showNotification?: (message: string) => void;
}
/**
 * State interface for quick capture
 */
interface State {
    defaultContexts: string[];
}
export declare class QuickCaptureWidgetManager {
    private state;
    private app;
    constructor(state: State, app: App);
    /**
     * Setup the quick capture widget
     */
    setupQuickCapture(): void;
    /**
     * Render context buttons in the quick capture panel
     */
    renderQuickCaptureContexts(): void;
}
export {};
//# sourceMappingURL=quick-capture-widget.d.ts.map