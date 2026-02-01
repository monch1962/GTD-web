/**
 * Comprehensive Tests for Validation Utilities
 */

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
            const result = validateContextName('@custom', ['@custom', '@other'])
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('This context already exists')
        })

        test('should reject case-insensitive duplicate context', () => {
            const result = validateContextName('@CUSTOM', ['@custom', '@other'])
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('This context already exists')
        })

        test('should accept valid new context', () => {
            const result = validateContextName('@newcontext', ['@existing'])
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should trim whitespace from context name', () => {
            const result = validateContextName('  @newcontext  ', ['@existing'])
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should accept context with valid characters', () => {
            const result = validateContextName('@context-123_name', [])
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
            const exactTitle = 'a'.repeat(500)
            const result = validateTaskTitle(exactTitle)
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should accept valid short title', () => {
            const result = validateTaskTitle('Buy groceries')
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should accept title with special characters', () => {
            const result = validateTaskTitle('Task with @mentions & symbols!')
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should trim whitespace', () => {
            const result = validateTaskTitle('  Buy groceries  ')
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
            const exactTitle = 'a'.repeat(200)
            const result = validateProjectTitle(exactTitle)
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should accept valid project title', () => {
            const result = validateProjectTitle('Website Redesign')
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })

        test('should trim whitespace', () => {
            const result = validateProjectTitle('  Website Redesign  ')
            expect(result.isValid).toBe(true)
            expect(result.error).toBeNull()
        })
    })

    describe('isValidDate()', () => {
        test('should accept valid date with time', () => {
            const result = isValidDate('2025-01-15T10:30:00Z')
            expect(result).toBe(true)
        })

        test('should accept empty string (optional field)', () => {
            const result = isValidDate('')
            expect(result).toBe(true)
        })

        test('should accept null', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidDate(null)
            expect(result).toBe(true)
        })

        test('should accept undefined', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidDate(undefined)
            expect(result).toBe(true)
        })

        test('should accept valid ISO date string', () => {
            const result = isValidDate('2025-01-15')
            expect(result).toBe(true)
        })

        test('should accept valid short date format', () => {
            const result = isValidDate('01/15/2025')
            expect(result).toBe(true)
        })

        test('should reject invalid date string', () => {
            const result = isValidDate('not-a-date')
            expect(result).toBe(false)
        })

        test('should reject invalid date values', () => {
            const result = isValidDate('2025-13-45')
            expect(result).toBe(false)
        })

        test('should accept date object', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidDate(new Date())
            expect(result).toBe(true)
        })
    })

    describe('isValidEnergyLevel()', () => {
        test('should accept empty string', () => {
            const result = isValidEnergyLevel('')
            expect(result).toBe(true)
        })

        test('should accept high energy', () => {
            const result = isValidEnergyLevel('high')
            expect(result).toBe(true)
        })

        test('should accept medium energy', () => {
            const result = isValidEnergyLevel('medium')
            expect(result).toBe(true)
        })

        test('should accept low energy', () => {
            const result = isValidEnergyLevel('low')
            expect(result).toBe(true)
        })

        test('should reject invalid energy level', () => {
            const result = isValidEnergyLevel('very-high')
            expect(result).toBe(false)
        })

        test('should reject case-sensitive variations', () => {
            const result = isValidEnergyLevel('High')
            expect(result).toBe(false)
        })

        test('should reject null', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidEnergyLevel(null)
            expect(result).toBe(false)
        })

        test('should reject undefined', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidEnergyLevel(undefined)
            expect(result).toBe(false)
        })
    })

    describe('isValidTimeEstimate()', () => {
        test('should accept zero minutes', () => {
            const result = isValidTimeEstimate(0)
            expect(result).toBe(true)
        })

        test('should accept positive time estimate', () => {
            const result = isValidTimeEstimate(30)
            expect(result).toBe(true)
        })

        test('should accept maximum time estimate (8 hours)', () => {
            const result = isValidTimeEstimate(480) // 8 hours in minutes
            expect(result).toBe(true)
        })

        test('should reject negative time', () => {
            const result = isValidTimeEstimate(-5)
            expect(result).toBe(false)
        })

        test('should reject time over 8 hours', () => {
            const result = isValidTimeEstimate(481) // 8 hours + 1 minute
            expect(result).toBe(false)
        })

        test('should reject very large time values', () => {
            const result = isValidTimeEstimate(10000)
            expect(result).toBe(false)
        })

        test('should handle decimal time values', () => {
            const result = isValidTimeEstimate(30.5)
            expect(result).toBe(true)
        })
    })

    describe('isValidTaskStatus()', () => {
        test('should accept inbox status', () => {
            const result = isValidTaskStatus('inbox')
            expect(result).toBe(true)
        })

        test('should accept next status', () => {
            const result = isValidTaskStatus('next')
            expect(result).toBe(true)
        })

        test('should accept waiting status', () => {
            const result = isValidTaskStatus('waiting')
            expect(result).toBe(true)
        })

        test('should accept someday status', () => {
            const result = isValidTaskStatus('someday')
            expect(result).toBe(true)
        })

        test('should accept completed status', () => {
            const result = isValidTaskStatus('completed')
            expect(result).toBe(true)
        })

        test('should reject invalid status', () => {
            const result = isValidTaskStatus('invalid')
            expect(result).toBe(false)
        })

        test('should reject case variations', () => {
            const result = isValidTaskStatus('Inbox')
            expect(result).toBe(false)
        })

        test('should reject empty string', () => {
            const result = isValidTaskStatus('')
            expect(result).toBe(false)
        })

        test('should reject null', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidTaskStatus(null)
            expect(result).toBe(false)
        })

        test('should reject undefined', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidTaskStatus(undefined)
            expect(result).toBe(false)
        })
    })

    describe('isValidProjectStatus()', () => {
        test('should accept active status', () => {
            const result = isValidProjectStatus('active')
            expect(result).toBe(true)
        })

        test('should accept someday status', () => {
            const result = isValidProjectStatus('someday')
            expect(result).toBe(true)
        })

        test('should accept completed status', () => {
            const result = isValidProjectStatus('completed')
            expect(result).toBe(true)
        })

        test('should reject invalid status', () => {
            const result = isValidProjectStatus('invalid')
            expect(result).toBe(false)
        })

        test('should reject case variations', () => {
            const result = isValidProjectStatus('Active')
            expect(result).toBe(false)
        })

        test('should reject empty string', () => {
            const result = isValidProjectStatus('')
            expect(result).toBe(false)
        })

        test('should reject null', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidProjectStatus(null)
            expect(result).toBe(false)
        })

        test('should reject undefined', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidProjectStatus(undefined)
            expect(result).toBe(false)
        })
    })

    describe('Edge Cases', () => {
        test('should handle numeric time estimate as string', () => {
            // @ts-expect-error Testing invalid input
            const result = isValidTimeEstimate('30')
            expect(result).toBe(true)
        })

        test('should handle null in validateContextName', () => {
            // @ts-expect-error Testing invalid input
            const result = validateContextName(null)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Context name cannot be empty')
        })

        test('should handle undefined in validateTaskTitle', () => {
            // @ts-expect-error Testing invalid input
            const result = validateTaskTitle(undefined)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Task title cannot be empty')
        })

        test('should handle undefined in validateProjectTitle', () => {
            // @ts-expect-error Testing invalid input
            const result = validateProjectTitle(undefined)
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('Project title cannot be empty')
        })

        test('should handle boolean values', () => {
            // @ts-expect-error Testing invalid input
            const result1 = isValidTaskStatus(true)
            expect(result1).toBe(false)

            // @ts-expect-error Testing invalid input
            const result2 = isValidProjectStatus(false)
            expect(result2).toBe(false)
        })
    })
})
