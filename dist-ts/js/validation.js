'use strict'
/**
 * Validation Utilities
 * Helper functions for validating task and project data
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.validateContextName = validateContextName
exports.validateTaskTitle = validateTaskTitle
exports.validateProjectTitle = validateProjectTitle
exports.isValidDate = isValidDate
exports.isValidEnergyLevel = isValidEnergyLevel
exports.isValidTimeEstimate = isValidTimeEstimate
exports.isValidTaskStatus = isValidTaskStatus
exports.isValidProjectStatus = isValidProjectStatus
const constants_1 = require('./constants')
/**
 * Validates if a context name is valid
 */
function validateContextName(name, existingContexts = []) {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: 'Context name cannot be empty' }
    }
    const trimmedName = name.trim()
    // Check if it's a default context
    const isDefault = constants_1.DEFAULT_CONTEXTS.some(
        (ctx) => ctx.toLowerCase() === trimmedName.toLowerCase()
    )
    if (isDefault) {
        return { isValid: false, error: 'This context already exists as a default context' }
    }
    // Check if it already exists (case-insensitive)
    const exists = existingContexts.some((ctx) => ctx.toLowerCase() === trimmedName.toLowerCase())
    if (exists) {
        return { isValid: false, error: 'This context already exists' }
    }
    // Validate format (should start with @)
    if (!trimmedName.startsWith('@')) {
        return { isValid: false, error: 'Context must start with @' }
    }
    // Check minimum length
    if (trimmedName.length < 2) {
        return { isValid: false, error: 'Context name is too short' }
    }
    return { isValid: true, error: null }
}
/**
 * Validates if a task title is valid
 */
function validateTaskTitle(title) {
    if (!title || title.trim().length === 0) {
        return { isValid: false, error: 'Task title cannot be empty' }
    }
    if (title.trim().length > 500) {
        return { isValid: false, error: 'Task title is too long (max 500 characters)' }
    }
    return { isValid: true, error: null }
}
/**
 * Validates if a project title is valid
 */
function validateProjectTitle(title) {
    if (!title || title.trim().length === 0) {
        return { isValid: false, error: 'Project title cannot be empty' }
    }
    if (title.trim().length > 200) {
        return { isValid: false, error: 'Project title is too long (max 200 characters)' }
    }
    return { isValid: true, error: null }
}
/**
 * Validates if a date string is valid
 */
function isValidDate(dateString) {
    if (!dateString) return true // Empty is valid (optional field)
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
}
/**
 * Validates if energy level is valid
 */
function isValidEnergyLevel(energy) {
    const validLevels = ['', 'high', 'medium', 'low']
    return validLevels.includes(energy)
}
/**
 * Validates if time estimate is valid
 */
function isValidTimeEstimate(time) {
    return time >= 0 && time <= 480 // Max 8 hours
}
/**
 * Validates if task status is valid
 */
function isValidTaskStatus(status) {
    const validStatuses = ['inbox', 'next', 'waiting', 'someday', 'completed']
    return validStatuses.includes(status)
}
/**
 * Validates if project status is valid
 */
function isValidProjectStatus(status) {
    const validStatuses = ['active', 'someday', 'completed']
    return validStatuses.includes(status)
}
//# sourceMappingURL=validation.js.map
