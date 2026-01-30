/**
 * Undo/Redo system module
 * Manages history and provides undo/redo functionality
 */

import { Task } from "../../models";
import { Project } from "../../models";

export class UndoRedoManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
    }

    /**
     * Setup undo/redo event listeners
     */
    setupUndoRedo() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if user is typing in an input or textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            // Ctrl+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Y or Ctrl+Shift+Z for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
        });

        // Button listeners
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');

        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }

        this.updateUndoRedoButtons();
    }

    /**
     * Save current state to history
     * @param {string} action - Description of the action
     */
    saveState(action) {
        // Save current state to history
        const state = {
            action: action,
            tasks: JSON.parse(JSON.stringify(this.state.tasks.map(t => t.toJSON()))),
            projects: JSON.parse(JSON.stringify(this.state.projects.map(p => p.toJSON()))),
            timestamp: new Date().toISOString()
        };

        // Remove any states after current index (we're creating a new branch)
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add new state
        this.history.push(state);
        this.historyIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateUndoRedoButtons();
    }

    /**
     * Undo last action
     */
    async undo() {
        if (this.historyIndex <= 0) return;

        this.historyIndex--;
        const state = this.history[this.historyIndex];

        // Restore state
        this.state.tasks = state.tasks.map(t => Task.fromJSON(t));
        this.state.projects = state.projects.map(p => Project.fromJSON(p));

        await this.app.saveTasks?.();
        await this.app.saveProjects?.();

        this.app.renderView?.();
        this.app.updateCounts?.();
        this.app.renderProjectsDropdown?.();
        this.updateUndoRedoButtons();

        this.app.showNotification?.(`Undid: ${state.action}`);
    }

    /**
     * Redo last undone action
     */
    async redo() {
        if (this.historyIndex >= this.history.length - 1) return;

        this.historyIndex++;
        const state = this.history[this.historyIndex];

        // Restore state
        this.state.tasks = state.tasks.map(t => Task.fromJSON(t));
        this.state.projects = state.projects.map(p => Project.fromJSON(p));

        await this.app.saveTasks?.();
        await this.app.saveProjects?.();

        this.app.renderView?.();
        this.app.updateCounts?.();
        this.app.renderProjectsDropdown?.();
        this.updateUndoRedoButtons();

        this.app.showNotification?.(`Redid: ${state.action}`);
    }

    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');

        if (undoBtn) {
            undoBtn.disabled = this.historyIndex <= 0;
            undoBtn.style.opacity = this.historyIndex <= 0 ? '0.5' : '1';
        }
        if (redoBtn) {
            redoBtn.disabled = this.historyIndex >= this.history.length - 1;
            redoBtn.style.opacity = this.historyIndex >= this.history.length - 1 ? '0.5' : '1';
        }
    }

    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this.historyIndex > 0;
    }

    /**
     * Check if redo is available
     * @returns {boolean}
     */
    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    /**
     * Get current history index
     * @returns {number}
     */
    getCurrentIndex() {
        return this.historyIndex;
    }

    /**
     * Get total history size
     * @returns {number}
     */
    getHistorySize() {
        return this.history.length;
    }

    /**
     * Clear all history
     */
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        this.updateUndoRedoButtons();
    }

    /**
     * Get history entry at index
     * @param {number} index - History index
     * @returns {Object|null} History entry
     */
    getHistoryEntry(index) {
        return this.history[index] || null;
    }
}
