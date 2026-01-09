/**
 * Validation utilities for GTD application
 *
 * Provides common validation functions for tasks, projects, and user input
 *
 * @example
 * import { Validation } from './modules/utils/validation.js';
 * if (!Validation.isValidTaskTitle('')) {
 *   console.error('Invalid title');
 * }
 */

/**
 * Validation helper class
 */
export class Validation {
    /**
     * Check if value is defined (not null or undefined)
     * @param {any} value - Value to check
     * @returns {boolean} True if defined
     */
    static isDefined(value) {
        return value !== null && value !== undefined;
    }

    /**
     * Check if value is a non-empty string
     * @param {any} value - Value to check
     * @returns {boolean} True if non-empty string
     */
    static isNonEmptyString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }

    /**
     * Check if value is a valid array with at least one item
     * @param {any} value - Value to check
     * @returns {boolean} True if non-empty array
     */
    static isNonEmptyArray(value) {
        return Array.isArray(value) && value.length > 0;
    }

    /**
     * Check if value is a valid date
     * @param {any} value - Value to check
     * @returns {boolean} True if valid date
     */
    static isValidDate(value) {
        if (!value) return false;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Validate task title
     * @param {string} title - Task title to validate
     * @returns {Object} Validation result with isValid and error
     *
     * @example
     * const result = Validation.isValidTaskTitle('My task');
     * if (!result.isValid) {
     *   console.error(result.error);
     * }
     */
    static isValidTaskTitle(title) {
        if (!this.isNonEmptyString(title)) {
            return {
                isValid: false,
                error: 'Task title is required and cannot be empty'
            };
        }

        if (title.length > 500) {
            return {
                isValid: false,
                error: 'Task title cannot exceed 500 characters'
            };
        }

        return { isValid: true };
    }

    /**
     * Validate project title
     * @param {string} title - Project title to validate
     * @returns {Object} Validation result with isValid and error
     */
    static isValidProjectTitle(title) {
        if (!this.isNonEmptyString(title)) {
            return {
                isValid: false,
                error: 'Project title is required and cannot be empty'
            };
        }

        if (title.length > 200) {
            return {
                isValid: false,
                error: 'Project title cannot exceed 200 characters'
            };
        }

        return { isValid: true };
    }

    /**
     * Validate GTD status
     * @param {string} status - Status to validate
     * @returns {boolean} True if valid status
     */
    static isValidStatus(status) {
        const validStatuses = ['inbox', 'next', 'waiting', 'someday', 'done', 'archived'];
        return validStatuses.includes(status);
    }

    /**
     * Validate context tag (must start with @)
     * @param {string} context - Context to validate
     * @returns {Object} Validation result with isValid and error
     */
    static isValidContext(context) {
        if (!this.isNonEmptyString(context)) {
            return {
                isValid: false,
                error: 'Context cannot be empty'
            };
        }

        const trimmedContext = context.trim();
        if (!trimmedContext.startsWith('@')) {
            return {
                isValid: false,
                error: 'Context must start with @ symbol'
            };
        }

        if (trimmedContext.length < 2) {
            return {
                isValid: false,
                error: 'Context must have at least one character after @'
            };
        }

        if (trimmedContext.length > 50) {
            return {
                isValid: false,
                error: 'Context cannot exceed 50 characters'
            };
        }

        return { isValid: true };
    }

    /**
     * Validate energy level
     * @param {string} energy - Energy level to validate
     * @returns {boolean} True if valid energy level
     */
    static isValidEnergy(energy) {
        const validEnergies = ['', 'high', 'medium', 'low'];
        return validEnergies.includes(energy);
    }

    /**
     * Validate time estimate
     * @param {string} time - Time estimate to validate
     * @returns {boolean} True if valid time estimate
     */
    static isValidTime(time) {
        const validTimes = ['', '5m', '15m', '30m', '1h', '2h', '3h', '5h'];
        return validTimes.includes(time);
    }

    /**
     * Validate recurrence pattern
     * @param {Object} recurrence - Recurrence object to validate
     * @returns {Object} Validation result with isValid and error
     */
    static isValidRecurrence(recurrence) {
        if (!recurrence) {
            return { isValid: true }; // No recurrence is valid
        }

        if (typeof recurrence !== 'object') {
            return {
                isValid: false,
                error: 'Recurrence must be an object'
            };
        }

        const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];
        if (!recurrence.frequency || !validFrequencies.includes(recurrence.frequency)) {
            return {
                isValid: false,
                error: `Invalid recurrence frequency. Must be one of: ${validFrequencies.join(', ')}`
            };
        }

        return { isValid: true };
    }

    /**
     * Validate task object
     * @param {Object} task - Task object to validate
     * @returns {Object} Validation result with isValid and errors array
     */
    static validateTask(task) {
        const errors = [];

        // Required fields
        const titleValidation = this.isValidTaskTitle(task.title);
        if (!titleValidation.isValid) {
            errors.push(titleValidation.error);
        }

        // Optional fields validation
        if (task.status && !this.isValidStatus(task.status)) {
            errors.push(`Invalid status: ${task.status}`);
        }

        if (task.energy && !this.isValidEnergy(task.energy)) {
            errors.push(`Invalid energy level: ${task.energy}`);
        }

        if (task.time && !this.isValidTime(task.time)) {
            errors.push(`Invalid time estimate: ${task.time}`);
        }

        if (task.dueDate && !this.isValidDate(task.dueDate)) {
            errors.push('Invalid due date');
        }

        if (task.deferDate && !this.isValidDate(task.deferDate)) {
            errors.push('Invalid defer date');
        }

        if (task.contexts && Array.isArray(task.contexts)) {
            task.contexts.forEach((context, index) => {
                const contextValidation = this.isValidContext(context);
                if (!contextValidation.isValid) {
                    errors.push(`Invalid context at index ${index}: ${contextValidation.error}`);
                }
            });
        }

        if (task.recurrence && !this.isValidRecurrence(task.recurrence).isValid) {
            errors.push(`Invalid recurrence pattern`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate project object
     * @param {Object} project - Project object to validate
     * @returns {Object} Validation result with isValid and errors array
     */
    static validateProject(project) {
        const errors = [];

        // Required fields
        const titleValidation = this.isValidProjectTitle(project.title);
        if (!titleValidation.isValid) {
            errors.push(titleValidation.error);
        }

        // Optional fields validation
        if (project.status && !this.isValidStatus(project.status)) {
            errors.push(`Invalid status: ${project.status}`);
        }

        if (project.contexts && Array.isArray(project.contexts)) {
            project.contexts.forEach((context, index) => {
                const contextValidation = this.isValidContext(context);
                if (!contextValidation.isValid) {
                    errors.push(`Invalid context at index ${index}: ${contextValidation.error}`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitize user input to prevent XSS
     * @param {string} input - User input to sanitize
     * @returns {string} Sanitized input
     */
    static sanitizeInput(input) {
        if (!input) return '';
        if (typeof input !== 'string') return String(input);

        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validate and sanitize user input
     * @param {string} input - User input to validate and sanitize
     * @param {Object} options - Validation options
     * @param {number} options.maxLength - Maximum allowed length
     * @param {boolean} options.required - Whether input is required
     * @returns {Object} Result with isValid, sanitized value, and error
     */
    static validateAndSanitizeInput(input, options = {}) {
        const { maxLength = 1000, required = false } = options;

        // Check required
        if (required && !this.isNonEmptyString(input)) {
            return {
                isValid: false,
                error: 'This field is required'
            };
        }

        // Allow empty if not required
        if (!input && !required) {
            return {
                isValid: true,
                value: ''
            };
        }

        // Check length
        if (input.length > maxLength) {
            return {
                isValid: false,
                error: `Input cannot exceed ${maxLength} characters`
            };
        }

        // Sanitize
        const sanitized = this.sanitizeInput(input);

        return {
            isValid: true,
            value: sanitized
        };
    }
}

/**
 * Create a validator function with custom rules
 * @param {Object} rules - Validation rules
 * @returns {Function} Validator function
 *
 * @example
 * const validateEmail = createValidator({
 *   pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 *   errorMessage: 'Invalid email address'
 * });
 */
export function createValidator(rules) {
    return (value) => {
        // Required check
        if (rules.required && !Validation.isNonEmptyString(value)) {
            return {
                isValid: false,
                error: rules.errorMessage || 'This field is required'
            };
        }

        // Allow empty if not required
        if (!value && !rules.required) {
            return { isValid: true };
        }

        // Pattern check
        if (rules.pattern && !rules.pattern.test(value)) {
            return {
                isValid: false,
                error: rules.errorMessage || 'Invalid format'
            };
        }

        // Min length check
        if (rules.minLength && value.length < rules.minLength) {
            return {
                isValid: false,
                error: rules.errorMessage || `Must be at least ${rules.minLength} characters`
            };
        }

        // Max length check
        if (rules.maxLength && value.length > rules.maxLength) {
            return {
                isValid: false,
                error: rules.errorMessage || `Cannot exceed ${rules.maxLength} characters`
            };
        }

        // Custom validator
        if (rules.custom && !rules.custom(value)) {
            return {
                isValid: false,
                error: rules.errorMessage || 'Invalid value'
            };
        }

        return { isValid: true };
    };
}
