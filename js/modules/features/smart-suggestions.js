/**
 * ============================================================================
 * Smart Suggestions Manager
 * ============================================================================
 *
 * Manages the "What Should I Work On?" feature that provides intelligent
 * task recommendations based on context, time availability, and energy level.
 *
 * This manager handles:
 * - Smart task scoring algorithm based on multiple factors
 * - Modal display with filters (context, time, energy)
 * - Task suggestion rendering with reasoning
 * - User selection and task highlighting
 */

import { escapeHtml } from '../../dom-utils.js';
import { getAllContexts } from '../../config/defaultContexts.js';

export class SmartSuggestionsManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
    }

    // =========================================================================
    // SETUP
    // =========================================================================

    /**
     * Setup the smart suggestions feature (called from app setup)
     * Currently no setup needed - feature is triggered on demand
     */
    setupSmartSuggestions() {
        // Feature is triggered via button click - no initialization needed
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Show the smart suggestions modal with filters
     */
    showSuggestions() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'suggestions-modal';

        // Get all contexts (default + custom) using standard function
        const allContexts = getAllContexts(this.state.tasks);
        const sortedContexts = Array.from(allContexts).sort();

        // Generate context options dynamically
        const contextOptions = sortedContexts.map(context =>
            `<option value="${escapeHtml(context)}">${escapeHtml(context)}</option>`
        ).join('\n                                ');

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3><i class="fas fa-lightbulb" style="color: var(--warning-color);"></i> What Should I Work On?</h3>
                    <button class="close-button" onclick="document.getElementById('suggestions-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="padding: var(--spacing-lg);">
                    <div id="suggestions-filters" style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <h4 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1rem;">Your Current Situation:</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md);">
                            <div>
                                <label style="font-size: 0.875rem; font-weight: 500; display: block; margin-bottom: var(--spacing-xs);">Where are you?</label>
                                <select id="suggestion-context" class="filter-select" style="width: 100%;">
                                    <option value="">Anywhere</option>
                                ${contextOptions}
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 0.875rem; font-weight: 500; display: block; margin-bottom: var(--spacing-xs);">How much time?</label>
                                <select id="suggestion-time" class="filter-select" style="width: 100%;">
                                    <option value="">Any amount</option>
                                    <option value="5">5 minutes</option>
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="120">2+ hours</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 0.875rem; font-weight: 500; display: block; margin-bottom: var(--spacing-xs);">Energy level?</label>
                                <select id="suggestion-energy" class="filter-select" style="width: 100%;">
                                    <option value="">Any level</option>
                                    <option value="high">High energy</option>
                                    <option value="medium">Medium energy</option>
                                    <option value="low">Low energy</option>
                                </select>
                            </div>
                        </div>
                        <button id="refresh-suggestions" class="btn btn-primary" style="margin-top: var(--spacing-md); width: 100%;">
                            <i class="fas fa-sync"></i> Get Suggestions
                        </button>
                    </div>
                    <div id="suggestions-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners for automatic filter updates
        const contextSelect = document.getElementById('suggestion-context');
        const timeSelect = document.getElementById('suggestion-time');
        const energySelect = document.getElementById('suggestion-energy');
        const refreshBtn = document.getElementById('refresh-suggestions');

        // Auto-update when any filter changes
        const updateSuggestions = () => this.renderSuggestions();

        if (contextSelect) contextSelect.addEventListener('change', updateSuggestions);
        if (timeSelect) timeSelect.addEventListener('change', updateSuggestions);
        if (energySelect) energySelect.addEventListener('change', updateSuggestions);
        if (refreshBtn) refreshBtn.addEventListener('click', updateSuggestions);

        // Initial render
        this.renderSuggestions();
    }

    /**
     * Get smart task suggestions based on preferences
     * @param {Object} preferences - User preferences for filtering
     * @param {string} preferences.context - Current context filter
     * @param {number} preferences.availableMinutes - Available time in minutes
     * @param {string} preferences.energyLevel - Current energy level
     * @param {number} preferences.maxSuggestions - Maximum number of suggestions to return
     * @returns {Array} Array of scored task suggestions with reasons
     */
    getSmartSuggestions(preferences = {}) {
        const {
            context = '',
            availableMinutes = null,
            energyLevel = '',
            maxSuggestions = 5
        } = preferences;

        // Get all actionable tasks (not completed, not deferred)
        let candidateTasks = this.state.tasks.filter(task => {
            if (task.completed) return false;
            if (task.type === 'reference') return false;
            if (task.status === 'someday') return false;
            if (task.status === 'completed') return false;
            if (!task.isAvailable()) return false; // Deferred tasks

            // Skip tasks with unmet dependencies
            if (!task.areDependenciesMet(this.state.tasks)) return false;

            // Filter by current view context
            if (this.state.currentView !== 'all' && this.state.currentView !== 'inbox') {
                if (this.state.currentView === 'next' && task.status !== 'next') return false;
                if (this.state.currentView === 'waiting' && task.status !== 'waiting') return false;
            }

            return true;
        });

        // Score each task based on multiple factors
        const scoredTasks = candidateTasks.map(task => {
            let score = 0;
            const reasons = [];

            // Factor 1: Overdue tasks (highest priority)
            if (task.isOverdue()) {
                score += 100;
                reasons.push('Overdue');
            }

            // Factor 2: Due today or soon
            if (task.isDueToday()) {
                score += 75;
                reasons.push('Due today');
            } else if (task.isDueWithin(3)) {
                score += 50;
                reasons.push(`Due in ${this.getDaysUntilDue(task)} days`);
            }

            // Factor 3: Context match
            if (context && task.contexts && task.contexts.includes(context)) {
                score += 60;
                reasons.push(`Matches current context (${context})`);
            }

            // Factor 4: Energy level match
            if (energyLevel && task.energy === energyLevel) {
                score += 40;
                reasons.push(`Matches your energy level (${energyLevel})`);
            }

            // Factor 5: Time available match
            if (availableMinutes && task.time) {
                if (task.time <= availableMinutes) {
                    score += 35;
                    reasons.push(`Fits your available time (${task.time}m)`);
                } else if (task.time > availableMinutes * 1.5) {
                    score -= 30; // Penalty for tasks too long
                    reasons.push(`Too long for available time (${task.time}m)`);
                }
            } else if (!availableMinutes && task.time && task.time <= 15) {
                score += 20;
                reasons.push('Quick task');
            }

            // Factor 6: Next Actions get priority
            if (task.status === 'next') {
                score += 25;
                reasons.push('Next Action');
            }

            // Factor 7: Quick tasks get slight boost
            if (task.time && task.time <= 5) {
                score += 15;
            }

            // Factor 8: Project urgency (projects due soon get priority)
            if (task.projectId) {
                const project = this.state.projects.find(p => p.id === task.projectId);
                if (project && project.status === 'active') {
                    score += 10;
                    reasons.push('Active project');
                }
            }

            // Factor 9: Waiting tasks get lower priority unless dependencies met
            if (task.status === 'waiting') {
                score -= 20;
                if (!reasons.includes('Dependencies met')) {
                    reasons.push('Waiting for something');
                }
            }

            // Factor 10: Tasks with descriptions are more defined
            if (task.description && task.description.trim().length > 10) {
                score += 5;
            }

            return { task, score, reasons };
        });

        // Sort by score (highest first) and limit results
        scoredTasks.sort((a, b) => b.score - a.score);

        // Return top suggestions
        return scoredTasks.slice(0, maxSuggestions);
    }

    /**
     * Get days until due date
     * @param {Task} task - Task to check
     * @returns {number|null} Days until due, or null if no due date
     */
    getDaysUntilDue(task) {
        if (!task.dueDate) return null;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    /**
     * Render task suggestions in the modal
     */
    renderSuggestions() {
        const context = document.getElementById('suggestion-context').value;
        const time = document.getElementById('suggestion-time').value;
        const energy = document.getElementById('suggestion-energy').value;

        const suggestions = this.getSmartSuggestions({
            context,
            availableMinutes: time ? parseInt(time) : null,
            energyLevel: energy
        });

        const container = document.getElementById('suggestions-list');

        if (suggestions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: var(--spacing-md); color: var(--success-color); opacity: 0.5;"></i>
                    <h3>No Tasks Available</h3>
                    <p>No actionable tasks match your current situation. Try adjusting your filters!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = suggestions.map(({ task, score, reasons }) => {
            const contexts = task.contexts && task.contexts.length > 0
                ? task.contexts.map(c => `<span class="task-context">${escapeHtml(c)}</span>`).join(' ')
                : '';

            const reasonBadges = reasons.slice(0, 3).map(reason =>
                `<span style="background: var(--info-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; margin-right: 4px;">${reason}</span>`
            ).join('');

            return `
                <div class="task-item" style="border-left: 4px solid var(--primary-color); cursor: pointer;" onclick="app.selectSuggestedTask('${task.id}')">
                    <div class="task-checkbox">
                        <span style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${score}</span>
                    </div>
                    <div class="task-content">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                        <div class="task-meta">
                            ${contexts}
                            ${task.energy ? `<span class="task-energy"><i class="fas fa-bolt"></i> ${task.energy}</span>` : ''}
                            ${task.time ? `<span class="task-time"><i class="fas fa-clock"></i> ${task.time}m</span>` : ''}
                            ${task.dueDate ? `<span class="task-due-date"><i class="fas fa-calendar-day"></i> ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                        </div>
                        <div style="margin-top: var(--spacing-sm);">
                            ${reasonBadges}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * User clicked on a suggested task - highlight it and close modal
     * @param {string} taskId - ID of the selected task
     */
    selectSuggestedTask(taskId) {
        // Remove the modal
        const modal = document.getElementById('suggestions-modal');
        if (modal) {
            modal.remove();
        }

        // Scroll to and highlight the task
        setTimeout(() => {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                taskElement.style.animation = 'pulse 0.5s ease-in-out 3';
            }
        }, 100);
    }
}
