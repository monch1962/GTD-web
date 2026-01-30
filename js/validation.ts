/**
 * Validation Utilities
 * Helper functions for validating task and project data
 */

import { DEFAULT_CONTEXTS } from './constants'

/**
 * Validation result interface
 */
export interface ValidationResult {
    isValid: boolean
    error: string | null
}

/**
 * Validates if a context name is valid
 */
export function validateContextName (
    name: string,
    existingContexts: string[] = []
): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: 'Context name cannot be empty' }
    }

    const trimmedName = name.trim()

    // Check if it's a default context
    const isDefault = DEFAULT_CONTEXTS.some(
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
export function validateTaskTitle (title: string): ValidationResult {
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
export function validateProjectTitle (title: string): ValidationResult {
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
export function isValidDate (dateString: string): boolean {
    if (!dateString) return true // Empty is valid (optional field)

    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Validates if energy level is valid
 */
export function isValidEnergyLevel (energy: string): boolean {
    const validLevels = ['', 'high', 'medium', 'low']
    return validLevels.includes(energy)
}

/**
 * Validates if time estimate is valid
 */
export function isValidTimeEstimate (time: number): boolean {
    return time >= 0 && time <= 480 // Max 8 hours
}

/**
 * Validates if task status is valid
 */
export function isValidTaskStatus (status: string): boolean {
    const validStatuses = ['inbox', 'next', 'waiting', 'someday', 'completed']
    return validStatuses.includes(status)
}

/**
 * Validates if project status is valid
 */
export function isValidProjectStatus (status: string): boolean {
    const validStatuses = ['active', 'someday', 'completed']
    return validStatuses.includes(status)
}
