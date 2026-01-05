/**
 * Validation Utilities
 * Helper functions for validating task and project data
 */

import { DEFAULT_CONTEXTS } from './constants.js';

/**
 * Validates if a context name is valid
 * @param {string} name - Context name to validate
 * @param {Array} existingContexts - List of existing context names
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateContextName(name, existingContexts = []) {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: 'Context name cannot be empty' };
    }

    const trimmedName = name.trim();

    // Check if it's a default context
    const isDefault = DEFAULT_CONTEXTS.some(ctx =>
        ctx.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDefault) {
        return { isValid: false, error: 'This context already exists as a default context' };
    }

    // Check if it already exists (case-insensitive)
    const exists = existingContexts.some(ctx =>
        ctx.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
        return { isValid: false, error: 'This context already exists' };
    }

    // Validate format (should start with @)
    if (!trimmedName.startsWith('@')) {
        return { isValid: false, error: 'Context must start with @' };
    }

    // Check minimum length
    if (trimmedName.length < 2) {
        return { isValid: false, error: 'Context name is too short' };
    }

    return { isValid: true, error: null };
}

/**
 * Validates if a task title is valid
 * @param {string} title - Task title to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateTaskTitle(title) {
    if (!title || title.trim().length === 0) {
        return { isValid: false, error: 'Task title cannot be empty' };
    }

    if (title.trim().length > 500) {
        return { isValid: false, error: 'Task title is too long (max 500 characters)' };
    }

    return { isValid: true, error: null };
}

/**
 * Validates if a project title is valid
 * @param {string} title - Project title to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateProjectTitle(title) {
    if (!title || title.trim().length === 0) {
        return { isValid: false, error: 'Project title cannot be empty' };
    }

    if (title.trim().length > 200) {
        return { isValid: false, error: 'Project title is too long (max 200 characters)' };
    }

    return { isValid: true, error: null };
}

/**
 * Validates if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean}
 */
export function isValidDate(dateString) {
    if (!dateString) return true; // Empty is valid (optional field)

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * Validates if energy level is valid
 * @param {string} energy - Energy level to validate
 * @returns {boolean}
 */
export function isValidEnergyLevel(energy) {
    const validLevels = ['', 'high', 'medium', 'low'];
    return validLevels.includes(energy);
}

/**
 * Validates if time estimate is valid
 * @param {number} time - Time estimate in minutes
 * @returns {boolean}
 */
export function isValidTimeEstimate(time) {
    return time >= 0 && time <= 480; // Max 8 hours
}

/**
 * Validates if task status is valid
 * @param {string} status - Task status to validate
 * @returns {boolean}
 */
export function isValidTaskStatus(status) {
    const validStatuses = ['inbox', 'next', 'waiting', 'someday', 'completed'];
    return validStatuses.includes(status);
}

/**
 * Validates if project status is valid
 * @param {string} status - Project status to validate
 * @returns {boolean}
 */
export function isValidProjectStatus(status) {
    const validStatuses = ['active', 'someday', 'completed'];
    return validStatuses.includes(status);
}
