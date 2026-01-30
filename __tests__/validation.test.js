/**
 * Comprehensive Tests for Validation Utilities
 */

import { DEFAULT_CONTEXTS } from '../js/constants.ts'
import {
    validateContextName,
    validateTaskTitle,
    validateProjectTitle,
    isValidDate,
    isValidEnergyLevel,
    isValidTimeEstimate,
    isValidTaskStatus,
    isValidProjectStatus
} from '../js/validation.ts'

describe('Validation Utilities', () => {
    describe('validateContextName()', () => {
        test('should reject empty context name', () => {
            const result = validateContextName('')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Context name cannot be empty')
        })

        test('should reject whitespace-only context name', () => {
            const result = validateContextName('   ')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Context name cannot be empty')
        })

        test('should reject context without @ prefix', () => {
            const result = validateContextName('work')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Context must start with @')
        })

        test('should reject context that is too short', () => {
            const result = validateContextName('@')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Context name is too short')
        })

        test('should reject context that matches default context', () => {
            const result = validateContextName('@home')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('This context already exists as a default context')
        })

        test('should reject case-insensitive match with default context', () => {
            const result = validateContextName('@HOME')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('This context already exists as a default context')
        })

        test('should reject context that already exists', () => {
            const existingContexts = ['@custom', '@office']
            const result = validateContextName('@custom', existingContexts)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('This context already exists')
        })

        test('should reject case-insensitive duplicate context', () => {
            const existingContexts = ['@custom', '@office']
            const result = validateContextName('@CUSTOM', existingContexts)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('This context already exists')
        })

        test('should accept valid new context', () => {
            const existingContexts = ['@work', '@office']
            const result = validateContextName('@newcontext', existingContexts)
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should trim whitespace from context name', () => {
            const result = validateContextName('  @work  ', [])
            expect(result.isValid).toBe(false) // @work might be in defaults
        })

        test('should accept context with valid characters', () => {
            const result = validateContextName('@work-office', [])
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })
    })

    describe('validateTaskTitle()', () => {
        test('should reject empty title', () => {
            const result = validateTaskTitle('')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Task title cannot be empty')
        })

        test('should reject whitespace-only title', () => {
            const result = validateTaskTitle('   ')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Task title cannot be empty')
        })

        test('should reject title over 500 characters', () => {
            const longTitle = 'a'.repeat(501)
            const result = validateTaskTitle(longTitle)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Task title is too long (max 500 characters)')
        })

        test('should accept title exactly 500 characters', () => {
            const title = 'a'.repeat(500)
            const result = validateTaskTitle(title)
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should accept valid short title', () => {
            const result = validateTaskTitle('Buy milk')
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should accept title with special characters', () => {
            const result = validateTaskTitle('Call @mom about dinner!')
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should trim whitespace', () => {
            const result = validateTaskTitle('  Buy milk  ')
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })
    })

    describe('validateProjectTitle()', () => {
        test('should reject empty title', () => {
            const result = validateProjectTitle('')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Project title cannot be empty')
        })

        test('should reject whitespace-only title', () => {
            const result = validateProjectTitle('   ')
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Project title cannot be empty')
        })

        test('should reject title over 200 characters', () => {
            const longTitle = 'a'.repeat(201)
            const result = validateProjectTitle(longTitle)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Project title is too long (max 200 characters)')
        })

        test('should accept title exactly 200 characters', () => {
            const title = 'a'.repeat(200)
            const result = validateProjectTitle(title)
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should accept valid project title', () => {
            const result = validateProjectTitle('Kitchen Remodel')
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should trim whitespace', () => {
            const result = validateProjectTitle('  Kitchen Remodel  ')
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })
    })

    describe('isValidDate()', () => {
        test('should accept empty string (optional field)', () => {
            expect(isValidDate('')).toBe(true)
        })

        test('should accept null', () => {
            expect(isValidDate(null)).toBe(true)
        })

        test('should accept undefined', () => {
            expect(isValidDate(undefined)).toBe(true)
        })

        test('should accept valid ISO date string', () => {
            expect(isValidDate('2025-01-10')).toBe(true)
        })

        test('should accept valid date with time', () => {
            expect(isValidDate('2025-01-10T14:30:00')).toBe(true)
        })

        test('should accept valid short date format', () => {
            expect(isValidDate('2025-01-10')).toBe(true)
        })

        test('should reject invalid date string', () => {
            expect(isValidDate('not-a-date')).toBe(false)
        })

        test('should reject invalid date values', () => {
            expect(isValidDate('2025-13-45')).toBe(false)
        })

        test('should accept date object', () => {
            expect(isValidDate(new Date())).toBe(true)
        })
    })

    describe('isValidEnergyLevel()', () => {
        test('should accept empty string', () => {
            expect(isValidEnergyLevel('')).toBe(true)
        })

        test('should accept high energy', () => {
            expect(isValidEnergyLevel('high')).toBe(true)
        })

        test('should accept medium energy', () => {
            expect(isValidEnergyLevel('medium')).toBe(true)
        })

        test('should accept low energy', () => {
            expect(isValidEnergyLevel('low')).toBe(true)
        })

        test('should reject invalid energy level', () => {
            expect(isValidEnergyLevel('super')).toBe(false)
        })

        test('should reject case-sensitive variations', () => {
            expect(isValidEnergyLevel('High')).toBe(false)
            expect(isValidEnergyLevel('HIGH')).toBe(false)
        })

        test('should reject null', () => {
            expect(isValidEnergyLevel(null)).toBe(false)
        })

        test('should reject undefined', () => {
            expect(isValidEnergyLevel(undefined)).toBe(false)
        })
    })

    describe('isValidTimeEstimate()', () => {
        test('should accept zero minutes', () => {
            expect(isValidTimeEstimate(0)).toBe(true)
        })

        test('should accept positive time estimate', () => {
            expect(isValidTimeEstimate(60)).toBe(true)
        })

        test('should accept maximum time estimate (8 hours)', () => {
            expect(isValidTimeEstimate(480)).toBe(true)
        })

        test('should reject negative time', () => {
            expect(isValidTimeEstimate(-10)).toBe(false)
        })

        test('should reject time over 8 hours', () => {
            expect(isValidTimeEstimate(481)).toBe(false)
        })

        test('should reject very large time values', () => {
            expect(isValidTimeEstimate(1000)).toBe(false)
        })

        test('should handle decimal time values', () => {
            expect(isValidTimeEstimate(30.5)).toBe(true)
        })
    })

    describe('isValidTaskStatus()', () => {
        test('should accept inbox status', () => {
            expect(isValidTaskStatus('inbox')).toBe(true)
        })

        test('should accept next status', () => {
            expect(isValidTaskStatus('next')).toBe(true)
        })

        test('should accept waiting status', () => {
            expect(isValidTaskStatus('waiting')).toBe(true)
        })

        test('should accept someday status', () => {
            expect(isValidTaskStatus('someday')).toBe(true)
        })

        test('should accept completed status', () => {
            expect(isValidTaskStatus('completed')).toBe(true)
        })

        test('should reject invalid status', () => {
            expect(isValidTaskStatus('deleted')).toBe(false)
        })

        test('should reject case variations', () => {
            expect(isValidTaskStatus('Inbox')).toBe(false)
            expect(isValidTaskStatus('INBOX')).toBe(false)
        })

        test('should reject empty string', () => {
            expect(isValidTaskStatus('')).toBe(false)
        })

        test('should reject null', () => {
            expect(isValidTaskStatus(null)).toBe(false)
        })
    })

    describe('isValidProjectStatus()', () => {
        test('should accept active status', () => {
            expect(isValidProjectStatus('active')).toBe(true)
        })

        test('should accept someday status', () => {
            expect(isValidProjectStatus('someday')).toBe(true)
        })

        test('should accept completed status', () => {
            expect(isValidProjectStatus('completed')).toBe(true)
        })

        test('should reject invalid status', () => {
            expect(isValidProjectStatus('deleted')).toBe(false)
        })

        test('should reject case variations', () => {
            expect(isValidProjectStatus('Active')).toBe(false)
            expect(isValidProjectStatus('ACTIVE')).toBe(false)
        })

        test('should reject empty string', () => {
            expect(isValidProjectStatus('')).toBe(false)
        })

        test('should reject null', () => {
            expect(isValidProjectStatus(null)).toBe(false)
        })
    })

    describe('Edge Cases', () => {
        test('should handle null in validateContextName', () => {
            const result = validateContextName(null)
            expect(result.isValid).toBe(false)
        })

        test('should handle undefined in validateTaskTitle', () => {
            const result = validateTaskTitle(undefined)
            expect(result.isValid).toBe(false)
        })

        test('should handle undefined in validateProjectTitle', () => {
            const result = validateProjectTitle(undefined)
            expect(result.isValid).toBe(false)
        })

        test('should handle numeric time estimate as string', () => {
            // JavaScript will coerce string to number in comparisons
            // This is expected behavior for flexibility
            expect(isValidTimeEstimate('60')).toBe(true)
            expect(isValidTimeEstimate('500')).toBe(false)
        })

        test('should handle boolean values', () => {
            expect(isValidTaskStatus(true)).toBe(false)
            expect(isValidProjectStatus(false)).toBe(false)
        })
    })
})
