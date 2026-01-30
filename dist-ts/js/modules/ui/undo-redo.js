'use strict'
/**
 * Undo/Redo system module
 * Manages history and provides undo/redo functionality
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.UndoRedoManager = void 0
class UndoRedoManager {
    constructor(state, app) {
        this.state = state
        this.app = app
        this.history = []
        this.historyIndex = -1
        this.maxHistorySize = 50
    }
    /**
     * Setup undo/redo event listeners
     */
    setupUndoRedo() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if user is typing in an input or textarea
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target.isContentEditable
            ) {
                return
            }
            // Ctrl+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                this.undo()
            }
            // Ctrl+Y or Ctrl+Shift+Z for redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                this.redo()
            }
        })
        // Button listeners
        const undoBtn = document.getElementById('btn-undo')
        const redoBtn = document.getElementById('btn-redo')
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo())
        }
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo())
        }
    }
    /**
     * Save current state to history
     * @param action - Description of the action being saved
     */
    saveState(action) {
        // If we're not at the end of history, truncate future history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1)
        }
        // Create state snapshot
        const snapshot = {
            tasks: this._deepCopy(this.state.tasks),
            projects: this._deepCopy(this.state.projects)
        }
        // Add to history
        const entry = {
            action,
            timestamp: new Date().toISOString(),
            stateSnapshot: snapshot
        }
        this.history.push(entry)
        this.historyIndex = this.history.length - 1
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift()
            this.historyIndex = Math.min(this.historyIndex, this.history.length - 1)
        }
        // Update UI
        this.updateUndoRedoButtons()
    }
    /**
     * Undo last action
     */
    undo() {
        if (this.historyIndex < 0) {
            this.app.showNotification?.('Nothing to undo', 'info')
            return
        }
        // Get previous state
        const previousIndex = this.historyIndex - 1
        if (previousIndex >= 0) {
            const previousState = this.history[previousIndex].stateSnapshot
            // Restore state
            this.state.tasks = this._deepCopy(previousState.tasks)
            this.state.projects = this._deepCopy(previousState.projects)
            // Update history index
            this.historyIndex = previousIndex
            // Save restored state
            this.app.saveTasks?.()
            this.app.saveProjects?.()
            // Update UI
            this.app.renderView?.()
            this.app.updateCounts?.()
            this.updateUndoRedoButtons()
            // Show notification
            const action = this.history[this.historyIndex].action
            this.app.showNotification?.(`Undo: ${action}`, 'success')
        } else {
            // At beginning of history
            this.historyIndex = -1
            this.updateUndoRedoButtons()
            this.app.showNotification?.('Nothing to undo', 'info')
        }
    }
    /**
     * Redo last undone action
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1) {
            this.app.showNotification?.('Nothing to redo', 'info')
            return
        }
        // Get next state
        const nextIndex = this.historyIndex + 1
        if (nextIndex < this.history.length) {
            const nextState = this.history[nextIndex].stateSnapshot
            // Restore state
            this.state.tasks = this._deepCopy(nextState.tasks)
            this.state.projects = this._deepCopy(nextState.projects)
            // Update history index
            this.historyIndex = nextIndex
            // Save restored state
            this.app.saveTasks?.()
            this.app.saveProjects?.()
            // Update UI
            this.app.renderView?.()
            this.app.updateCounts?.()
            this.updateUndoRedoButtons()
            // Show notification
            const action = this.history[this.historyIndex].action
            this.app.showNotification?.(`Redo: ${action}`, 'success')
        }
    }
    /**
     * Update undo/redo button states
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('btn-undo')
        const redoBtn = document.getElementById('btn-redo')
        const canUndo = this.historyIndex > 0
        const canRedo = this.historyIndex < this.history.length - 1
        if (undoBtn) {
            undoBtn.disabled = !canUndo
            undoBtn.title = canUndo
                ? `Undo: ${this.history[this.historyIndex]?.action || 'previous action'}`
                : 'Nothing to undo'
        }
        if (redoBtn) {
            redoBtn.disabled = !canRedo
            redoBtn.title = canRedo
                ? `Redo: ${this.history[this.historyIndex + 1]?.action || 'next action'}`
                : 'Nothing to redo'
        }
    }
    /**
     * Deep copy an object
     * @private
     * @param obj - Object to copy
     * @returns Deep copy of the object
     */
    _deepCopy(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this._deepCopy(item))
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime())
        }
        const copy = {}
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                copy[key] = this._deepCopy(obj[key])
            }
        }
        return copy
    }
    /**
     * Clear all history
     */
    clearHistory() {
        this.history = []
        this.historyIndex = -1
        this.updateUndoRedoButtons()
    }
    /**
     * Get history entry at index
     * @param index - History index
     * @returns History entry or null
     */
    getHistoryEntry(index) {
        return this.history[index] || null
    }
}
exports.UndoRedoManager = UndoRedoManager
//# sourceMappingURL=undo-redo.js.map
