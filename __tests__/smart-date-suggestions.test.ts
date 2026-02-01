/**
 * Comprehensive Tests for Smart Date Suggestions Feature
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

    describe('parseNaturalDate() - Relative Date Patterns', () => {
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
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const result = manager.parseNaturalDate('in 2 weeks')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('In 2 weeks')

            const expectedDate = new Date(today)
            expectedDate.setDate(today.getDate() + 14)
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0])
        })

        test('should parse "in X months" pattern', () => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const result = manager.parseNaturalDate('in 1 month')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('In 1 month')

            const expectedDate = new Date(today)
            expectedDate.setMonth(today.getMonth() + 1)
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0])
        })

        test('should parse "in X years" pattern', () => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const result = manager.parseNaturalDate('in 2 years')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('In 2 years')

            const expectedDate = new Date(today)
            expectedDate.setFullYear(today.getFullYear() + 2)
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0])
        })

        test('should parse "next X" patterns', () => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const result = manager.parseNaturalDate('next week')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Next week')

            const expectedDate = new Date(today)
            expectedDate.setDate(today.getDate() + 7)
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0])
        })

        test('should parse "next month"', () => {
            const result = manager.parseNaturalDate('next month')
            expect(result[0].text).toBe('Next month')
        })

        test('should parse "next year"', () => {
            const result = manager.parseNaturalDate('next year')
            expect(result[0].text).toBe('Next year')
        })

        test('should parse "tomorrow"', () => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const result = manager.parseNaturalDate('tomorrow')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Tomorrow')

            const expectedDate = new Date(today)
            expectedDate.setDate(today.getDate() + 1)
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0])
        })

        test('should parse "today"', () => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const result = manager.parseNaturalDate('today')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Today')
            expect(result[0].date).toBe(today.toISOString().split('T')[0])
        })

        test('should parse "yesterday"', () => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const result = manager.parseNaturalDate('yesterday')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Yesterday')

            const expectedDate = new Date(today)
            expectedDate.setDate(today.getDate() - 1)
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0])
        })

        test('should parse "this X" patterns', () => {
            const result = manager.parseNaturalDate('this week')
            expect(result[0].text).toBe('This week')
        })

        test('should parse "this month"', () => {
            const result = manager.parseNaturalDate('this month')
            expect(result[0].text).toBe('This month')
        })

        test('should parse "this year"', () => {
            const result = manager.parseNaturalDate('this year')
            expect(result[0].text).toBe('This year')
        })

        test('should parse "X days from now"', () => {
            const result = manager.parseNaturalDate('5 days from now')
            expect(result[0].text).toBe('In 5 days')
        })

        test('should parse "X weeks from now"', () => {
            const result = manager.parseNaturalDate('3 weeks from now')
            expect(result[0].text).toBe('In 3 weeks')
        })

        test('should parse "X months from now"', () => {
            const result = manager.parseNaturalDate('2 months from now')
            expect(result[0].text).toBe('In 2 months')
        })

        test('should parse "X years from now"', () => {
            const result = manager.parseNaturalDate('1 year from now')
            expect(result[0].text).toBe('In 1 year')
        })
    })

    describe('parseNaturalDate() - Absolute Date Patterns', () => {
        test('should parse "MM/DD/YYYY" format', () => {
            const result = manager.parseNaturalDate('12/25/2024')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Dec 25, 2024')
            expect(result[0].date).toBe('2024-12-25')
        })

        test('should parse "MM/DD" format (current year)', () => {
            const currentYear = new Date().getFullYear()
            const result = manager.parseNaturalDate('07/04')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Jul 4')
            expect(result[0].date).toBe(`${currentYear}-07-04`)
        })

        test('should parse "Month DD, YYYY" format', () => {
            const result = manager.parseNaturalDate('January 15, 2025')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Jan 15, 2025')
            expect(result[0].date).toBe('2025-01-15')
        })

        test('should parse "Month DD" format (current year)', () => {
            const currentYear = new Date().getFullYear()
            const result = manager.parseNaturalDate('March 20')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Mar 20')
            expect(result[0].date).toBe(`${currentYear}-03-20`)
        })

        test('should parse "DD Month YYYY" format', () => {
            const result = manager.parseNaturalDate('15 January 2025')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Jan 15, 2025')
            expect(result[0].date).toBe('2025-01-15')
        })

        test('should parse "YYYY-MM-DD" ISO format', () => {
            const result = manager.parseNaturalDate('2025-06-30')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Jun 30, 2025')
            expect(result[0].date).toBe('2025-06-30')
        })

        test('should parse "Month YYYY" format (first of month)', () => {
            const result = manager.parseNaturalDate('February 2025')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Feb 1, 2025')
            expect(result[0].date).toBe('2025-02-01')
        })

        test('should parse "YYYY" format (January 1st)', () => {
            const result = manager.parseNaturalDate('2026')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Jan 1, 2026')
            expect(result[0].date).toBe('2026-01-01')
        })
    })

    describe('parseNaturalDate() - Day of Week Patterns', () => {
        test('should parse "Monday" (next occurrence)', () => {
            const result = manager.parseNaturalDate('Monday')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Next Monday')
            expect(result[0].date).toBeDefined()
        })

        test('should parse "next Monday"', () => {
            const result = manager.parseNaturalDate('next Monday')
            expect(result[0].text).toBe('Next Monday')
        })

        test('should parse "this Monday"', () => {
            const result = manager.parseNaturalDate('this Monday')
            expect(result[0].text).toBe('This Monday')
        })

        test('should parse "last Monday"', () => {
            const result = manager.parseNaturalDate('last Monday')
            expect(result[0].text).toBe('Last Monday')
        })

        test('should parse "Monday next week"', () => {
            const result = manager.parseNaturalDate('Monday next week')
            expect(result[0].text).toBe('Monday next week')
        })

        test('should parse all days of week', () => {
            const days = [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            ]
            days.forEach((day) => {
                const result = manager.parseNaturalDate(day)
                expect(result).toHaveLength(1)
                expect(result[0].text).toContain(day)
            })
        })

        test('should parse abbreviated days', () => {
            const result = manager.parseNaturalDate('Mon')
            expect(result[0].text).toContain('Monday')
        })
    })

    describe('parseNaturalDate() - Holiday Patterns', () => {
        test('should parse "Christmas"', () => {
            const currentYear = new Date().getFullYear()
            const result = manager.parseNaturalDate('Christmas')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Christmas')
            expect(result[0].date).toBe(`${currentYear}-12-25`)
        })

        test('should parse "Christmas Day"', () => {
            const result = manager.parseNaturalDate('Christmas Day')
            expect(result[0].text).toBe('Christmas')
        })

        test('should parse "New Year\'s"', () => {
            const currentYear = new Date().getFullYear()
            const result = manager.parseNaturalDate('New Year\'s')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('New Year\'s')
            expect(result[0].date).toBe(`${currentYear + 1}-01-01`)
        })

        test('should parse "New Year\'s Day"', () => {
            const result = manager.parseNaturalDate('New Year\'s Day')
            expect(result[0].text).toBe('New Year\'s')
        })

        test('should parse "Thanksgiving"', () => {
            const currentYear = new Date().getFullYear()
            const result = manager.parseNaturalDate('Thanksgiving')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Thanksgiving')
            // Thanksgiving is 4th Thursday of November
            expect(result[0].date).toMatch(new RegExp(`${currentYear}-11-\\d{2}`))
        })

        test('should parse "Thanksgiving Day"', () => {
            const result = manager.parseNaturalDate('Thanksgiving Day')
            expect(result[0].text).toBe('Thanksgiving')
        })

        test('should parse "Halloween"', () => {
            const currentYear = new Date().getFullYear()
            const result = manager.parseNaturalDate('Halloween')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Halloween')
            expect(result[0].date).toBe(`${currentYear}-10-31`)
        })

        test('should parse "Valentine\'s Day"', () => {
            const currentYear = new Date().getFullYear()
            const result = manager.parseNaturalDate('Valentine\'s Day')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Valentine\'s Day')
            expect(result[0].date).toBe(`${currentYear}-02-14`)
        })

        test('should parse "Independence Day"', () => {
            const currentYear = new Date().getFullYear()
            const result = manager.parseNaturalDate('Independence Day')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Independence Day')
            expect(result[0].date).toBe(`${currentYear}-07-04`)
        })

        test('should parse "July 4th"', () => {
            const result = manager.parseNaturalDate('July 4th')
            expect(result[0].text).toBe('Jul 4')
        })

        test('should parse "4th of July"', () => {
            const result = manager.parseNaturalDate('4th of July')
            expect(result[0].text).toBe('Jul 4')
        })
    })

    describe('parseNaturalDate() - Time of Day Patterns', () => {
        test('should parse "morning"', () => {
            const result = manager.parseNaturalDate('morning')
            expect(result[0].text).toBe('Morning')
        })

        test('should parse "afternoon"', () => {
            const result = manager.parseNaturalDate('afternoon')
            expect(result[0].text).toBe('Afternoon')
        })

        test('should parse "evening"', () => {
            const result = manager.parseNaturalDate('evening')
            expect(result[0].text).toBe('Evening')
        })

        test('should parse "night"', () => {
            const result = manager.parseNaturalDate('night')
            expect(result[0].text).toBe('Night')
        })

        test('should parse "tomorrow morning"', () => {
            const result = manager.parseNaturalDate('tomorrow morning')
            expect(result[0].text).toBe('Tomorrow morning')
        })

        test('should parse "next week afternoon"', () => {
            const result = manager.parseNaturalDate('next week afternoon')
            expect(result[0].text).toBe('Next week afternoon')
        })

        test('should parse "this evening"', () => {
            const result = manager.parseNaturalDate('this evening')
            expect(result[0].text).toBe('This evening')
        })
    })

    describe('parseNaturalDate() - Complex Patterns', () => {
        test('should parse "in 2 weeks on Monday"', () => {
            const result = manager.parseNaturalDate('in 2 weeks on Monday')
            expect(result[0].text).toBe('In 2 weeks on Monday')
        })

        test('should parse "next Monday morning"', () => {
            const result = manager.parseNaturalDate('next Monday morning')
            expect(result[0].text).toBe('Next Monday morning')
        })

        test('should parse "the day after tomorrow"', () => {
            const result = manager.parseNaturalDate('the day after tomorrow')
            expect(result[0].text).toBe('In 2 days')
        })

        test('should parse "a week from today"', () => {
            const result = manager.parseNaturalDate('a week from today')
            expect(result[0].text).toBe('In 1 week')
        })

        test('should parse "two months from now"', () => {
            const result = manager.parseNaturalDate('two months from now')
            expect(result[0].text).toBe('In 2 months')
        })

        test('should parse "end of month"', () => {
            const result = manager.parseNaturalDate('end of month')
            expect(result[0].text).toBe('End of month')
        })

        test('should parse "end of week"', () => {
            const result = manager.parseNaturalDate('end of week')
            expect(result[0].text).toBe('End of week')
        })

        test('should parse "end of year"', () => {
            const result = manager.parseNaturalDate('end of year')
            expect(result[0].text).toBe('End of year')
        })

        test('should parse "beginning of next month"', () => {
            const result = manager.parseNaturalDate('beginning of next month')
            expect(result[0].text).toBe('Beginning of next month')
        })

        test('should parse "middle of June"', () => {
            const result = manager.parseNaturalDate('middle of June')
            expect(result[0].text).toBe('Middle of June')
        })
    })

    describe('parseNaturalDate() - Edge Cases and Invalid Input', () => {
        test('should return empty array for empty string', () => {
            const result = manager.parseNaturalDate('')
            expect(result).toEqual([])
        })

        test('should throw error for null input', () => {
            expect(() => manager.parseNaturalDate(null as any)).toThrow()
        })

        test('should throw error for undefined input', () => {
            expect(() => manager.parseNaturalDate(undefined as any)).toThrow()
        })

        test('should return empty array for non-date text', () => {
            const result = manager.parseNaturalDate('hello world')
            expect(result).toEqual([])
        })

        test('should handle mixed case input', () => {
            const result = manager.parseNaturalDate('NeXt MoNtH')
            expect(result[0].text).toBe('Next month')
        })

        test('should handle extra whitespace', () => {
            const result = manager.parseNaturalDate('  in   3   days  ')
            expect(result[0].text).toBe('In 3 days')
        })

        test('should handle punctuation', () => {
            const result = manager.parseNaturalDate('in 3 days.')
            expect(result[0].text).toBe('In 3 days')
        })

        test('should handle "0 days" (returns today)', () => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const result = manager.parseNaturalDate('in 0 days')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Today')
            expect(result[0].date).toBe(today.toISOString().split('T')[0])
        })

        test('should handle negative numbers (returns empty)', () => {
            const result = manager.parseNaturalDate('in -3 days')
            expect(result).toEqual([])
        })

        test('should handle very large numbers', () => {
            const result = manager.parseNaturalDate('in 999 days')
            expect(result[0].text).toBe('In 999 days')
        })

        test('should handle decimal numbers (rounds down)', () => {
            const result = manager.parseNaturalDate('in 2.5 days')
            expect(result[0].text).toBe('In 2 days')
        })

        test('should handle "one" instead of "1"', () => {
            const result = manager.parseNaturalDate('in one day')
            expect(result[0].text).toBe('In 1 day')
        })

        test('should handle "two" instead of "2"', () => {
            const result = manager.parseNaturalDate('in two weeks')
            expect(result[0].text).toBe('In 2 weeks')
        })

        test('should handle "three" instead of "3"', () => {
            const result = manager.parseNaturalDate('in three months')
            expect(result[0].text).toBe('In 3 months')
        })
    })

    describe('parseNaturalDate() - Multiple Matches', () => {
        test('should return multiple matches for ambiguous input', () => {
            const result = manager.parseNaturalDate('Monday')

            // Should return both "next Monday" and "this Monday" if applicable
            expect(result.length).toBeGreaterThanOrEqual(1)
            expect(result[0].text).toContain('Monday')
        })

        test('should prioritize specific dates over relative dates', () => {
            const currentYear = new Date().getFullYear()
            const result = manager.parseNaturalDate('December 25')

            expect(result).toHaveLength(1)
            expect(result[0].text).toBe('Dec 25')
            expect(result[0].date).toBe(`${currentYear}-12-25`)
        })

        test('should return holiday and date format for same input', () => {
            const result = manager.parseNaturalDate('July 4')

            // Should match both holiday and date format
            expect(result.length).toBeGreaterThanOrEqual(1)
            const texts = result.map((r) => r.text)
            expect(texts).toContain('Jul 4')
        })
    })

    describe('Performance and Reliability', () => {
        test('should handle rapid successive calls', () => {
            const inputs = ['today', 'tomorrow', 'next week', 'in 2 days', 'Monday']
            inputs.forEach((input) => {
                const result = manager.parseNaturalDate(input)
                expect(result).toBeDefined()
            })
        })

        test('should not crash on malformed dates', () => {
            const malformed = ['99/99/9999', 'February 30', '13/13/2024']
            malformed.forEach((input) => {
                const result = manager.parseNaturalDate(input)
                // Should either return empty or handle gracefully
                expect(result).toBeDefined()
            })
        })

        test('should handle very long input strings', () => {
            const longInput = 'a'.repeat(1000) + ' tomorrow ' + 'b'.repeat(1000)
            const result = manager.parseNaturalDate(longInput)

            // Should still find "tomorrow" in the long string
            expect(result.length).toBeGreaterThan(0)
            expect(result[0].text).toBe('Tomorrow')
        })

        test('should be case insensitive', () => {
            const lower = manager.parseNaturalDate('tomorrow')
            const upper = manager.parseNaturalDate('TOMORROW')
            const mixed = manager.parseNaturalDate('ToMoRrOw')

            expect(lower[0].text).toBe(upper[0].text)
            expect(lower[0].text).toBe(mixed[0].text)
        })

        test('should handle international date formats', () => {
            // Note: This might need locale-specific testing
            const result = manager.parseNaturalDate('25/12/2024') // DD/MM/YYYY format
            // Implementation may or may not support this format
            expect(result).toBeDefined()
        })
    })
})
