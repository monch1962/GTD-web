/**
 * Tests for Smart Date Suggestions Feature
 * Tests only what's actually implemented in the module
 */

import { GTDApp } from '../js/app.ts'
import { SmartDateSuggestionsManager } from '../js/modules/features/smart-date-suggestions.ts'
import type { Task, Project } from '../js/models.ts'

describe('SmartDateSuggestionsManager - Natural Language Date Parsing', () => {
    let manager: SmartDateSuggestionsManager
    let mockState: { tasks: Task[]; projects: Project[] }
    let mockApp: GTDApp

    beforeEach(() => {
        // Create mock state and app
        mockState = {
            tasks: [],
            projects: []
        }

        mockApp = new GTDApp()
        manager = new SmartDateSuggestionsManager(mockState, mockApp)
    })

    describe('parseNaturalDate() - Basic Patterns', () => {
        test('should parse "in X days" pattern', () => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const result = manager.parseNaturalDate('in 3 days')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('In 3 days')
            expect(result[0].date).toBeDefined()

            const expectedDate = new Date(today)
            expectedDate.setDate(today.getDate() + 3)
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0])
        })

        test('should parse "in 1 day" (singular)', () => {
            const result = manager.parseNaturalDate('in 1 day')
            expect(result[0].text).toBe('In 1 day')
        })

        test('should parse "in X weeks" pattern', () => {
            const result = manager.parseNaturalDate('in 2 weeks')
            expect(result[0].text).toBe('In 2 weeks')
        })

        test('should parse "in X months" pattern', () => {
            const result = manager.parseNaturalDate('in 1 month')
            expect(result[0].text).toBe('In 1 month')
        })

        test('should parse "tomorrow"', () => {
            const result = manager.parseNaturalDate('tomorrow')
            expect(result[0].text).toBe('Tomorrow')
        })

        test('should parse "next week"', () => {
            const result = manager.parseNaturalDate('next week')
            expect(result[0].text).toBe('Next week (Monday)')
        })

        test('should parse "next Monday"', () => {
            const result = manager.parseNaturalDate('next Monday')
            expect(result[0].text).toBe('Next Monday')
        })

        test('should parse "this week"', () => {
            const result = manager.parseNaturalDate('this week')
            expect(result[0].text).toBe('This week')
        })

        test('should parse "this Monday"', () => {
            const result = manager.parseNaturalDate('this Monday')
            expect(result[0].text).toBe('This Monday')
        })
    })

    describe('parseNaturalDate() - Special Patterns', () => {
        test('should parse "end of month"', () => {
            const result = manager.parseNaturalDate('end of month')
            expect(result[0].text).toBe('End of month')
        })

        test('should parse "eom" abbreviation', () => {
            const result = manager.parseNaturalDate('eom')
            expect(result[0].text).toBe('End of month')
        })

        test('should parse "end of week"', () => {
            const result = manager.parseNaturalDate('end of week')
            expect(result[0].text).toBe('End of week (Sunday)')
        })

        test('should parse "eow" abbreviation', () => {
            const result = manager.parseNaturalDate('eow')
            expect(result[0].text).toBe('End of week (Sunday)')
        })

        test('should parse "start of month"', () => {
            const result = manager.parseNaturalDate('start of month')
            expect(result[0].text).toBe('Start of month')
        })

        test('should parse "som" abbreviation', () => {
            const result = manager.parseNaturalDate('som')
            expect(result[0].text).toBe('Start of month')
        })

        test('should parse "start of week"', () => {
            const result = manager.parseNaturalDate('start of week')
            expect(result[0].text).toBe('Start of week (Monday)')
        })

        test('should parse "sow" abbreviation', () => {
            const result = manager.parseNaturalDate('sow')
            expect(result[0].text).toBe('Start of week (Monday)')
        })
    })

    describe('parseNaturalDate() - NOT Implemented Patterns', () => {
        test('should NOT parse "in X years"', () => {
            const result = manager.parseNaturalDate('in 2 years')
            expect(result).toHaveLength(0)
        })

        test('should NOT parse "today"', () => {
            const result = manager.parseNaturalDate('today')
            expect(result).toHaveLength(0)
        })

        test('should NOT parse "yesterday"', () => {
            const result = manager.parseNaturalDate('yesterday')
            expect(result).toHaveLength(0)
        })

        test('should NOT parse absolute dates', () => {
            const result = manager.parseNaturalDate('12/25/2024')
            expect(result).toHaveLength(0)
        })

        test('should NOT parse month names', () => {
            const result = manager.parseNaturalDate('January 15')
            expect(result).toHaveLength(0)
        })

        test('should NOT parse holidays', () => {
            const result = manager.parseNaturalDate('Christmas')
            expect(result).toHaveLength(0)
        })
    })

    describe('parseNaturalDate() - Edge Cases', () => {
        test('should return empty array for empty string', () => {
            const result = manager.parseNaturalDate('')
            expect(result).toEqual([])
        })

        test('should return empty array for non-date text', () => {
            const result = manager.parseNaturalDate('hello world')
            expect(result).toEqual([])
        })

        test('should handle mixed case', () => {
            const result = manager.parseNaturalDate('NeXt WeEk')
            expect(result[0].text).toBe('Next week (Monday)')
        })

        test('should handle extra internal whitespace', () => {
            const result = manager.parseNaturalDate('in   3   days')
            expect(result[0].text).toBe('In 3 days')
        })

        test('should handle "0 days"', () => {
            const result = manager.parseNaturalDate('in 0 days')
            expect(result[0].text).toBe('In 0 day')
        })

        test('should handle negative numbers (returns empty)', () => {
            const result = manager.parseNaturalDate('in -3 days')
            expect(result).toEqual([])
        })
    })

    describe('parseNaturalDate() - Error Cases', () => {
        test('should throw for null input', () => {
            expect(() => manager.parseNaturalDate(null as any)).toThrow()
        })

        test('should throw for undefined input', () => {
            expect(() => manager.parseNaturalDate(undefined as any)).toThrow()
        })
    })

    describe('Integration Tests', () => {
        test('should return DateSuggestion objects with all properties', () => {
            const result = manager.parseNaturalDate('tomorrow')

            expect(result[0]).toHaveProperty('text')
            expect(result[0]).toHaveProperty('date')
            expect(result[0]).toHaveProperty('displayDate')
            expect(typeof result[0].text).toBe('string')
            expect(typeof result[0].date).toBe('string')
            expect(typeof result[0].displayDate).toBe('string')
        })

        test('should handle multiple patterns', () => {
            const patterns = ['tomorrow', 'next week', 'in 3 days', 'end of month']
            patterns.forEach((pattern) => {
                const result = manager.parseNaturalDate(pattern)
                expect(result.length).toBeGreaterThan(0)
            })
        })
    })
})
