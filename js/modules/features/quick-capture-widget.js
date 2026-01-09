/**
 * ============================================================================
 * Quick Capture Widget Manager
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

export class QuickCaptureWidgetManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Setup the quick capture widget
     */
    setupQuickCapture() {
        const toggleBtn = document.getElementById('quick-capture-toggle');
        const panel = document.getElementById('quick-capture-panel');
        const input = document.getElementById('quick-capture-input');
        const contextsContainer = document.getElementById('quick-capture-contexts');

        if (!toggleBtn || !panel || !input) return;

        // Toggle panel visibility
        toggleBtn.addEventListener('click', () => {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
            toggleBtn.classList.toggle('active', !isVisible);

            if (!isVisible) {
                input.focus();
                this.renderQuickCaptureContexts();
            }
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quick-capture-widget')) {
                panel.style.display = 'none';
                toggleBtn.classList.remove('active');
            }
        });

        // Handle input
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const title = input.value.trim();
                if (title) {
                    await this.app.quickAddTask?.(title);
                    input.value = '';
                    this.app.showNotification?.('Task captured!');
                }
            }
        });

        // Handle escape key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                panel.style.display = 'none';
                toggleBtn.classList.remove('active');
            }
        });
    }

    /**
     * Render context buttons in the quick capture panel
     */
    renderQuickCaptureContexts() {
        const container = document.getElementById('quick-capture-contexts');
        const input = document.getElementById('quick-capture-input');

        if (!container || !input) return;

        container.innerHTML = '';

        // Get all contexts (default + custom)
        const allContexts = [...this.state.defaultContexts];
        const customContexts = JSON.parse(localStorage.getItem('gtd_custom_contexts') || '[]');
        customContexts.forEach(ctx => {
            if (!allContexts.includes(ctx)) allContexts.push(ctx);
        });

        // Render context buttons
        allContexts.forEach(context => {
            const btn = document.createElement('button');
            btn.className = 'quick-capture-context';
            btn.textContent = context;
            btn.addEventListener('click', () => {
                const currentValue = input.value;
                input.value = currentValue + (currentValue ? ' ' : '') + context;
                input.focus();
            });
            container.appendChild(btn);
        });
    }
}
