/**
 * Test: Context Utilities DRY Compliance
 * Ensure context combining functions exist and are used throughout the code
 */

import {
    getAllContexts,
    getContextTaskCounts,
    getContextIds
} from '../js/config/defaultContexts.ts'

describe('Context Utilities', () => {
    describe('getAllContexts function', () => {
        test('should return all default contexts when no tasks provided', () => {
            const contexts = getAllContexts([])

            expect(contexts).toBeInstanceOf(Set)
            expect(contexts.size).toBe(6) // All 6 default contexts

            const defaultIds = getContextIds()
            defaultIds.forEach((id) => {
                expect(contexts.has(id)).toBe(true)
            })
        })

        test('should return default contexts plus custom contexts from tasks', () => {
            const tasks = [
                { id: '1', contexts: ['@home', '@work'] },
                { id: '2', contexts: ['@custom1', '@personal'] },
                { id: '3', contexts: ['@custom2', '@home'] }
            ]

            const contexts = getAllContexts(tasks)

            expect(contexts).toBeInstanceOf(Set)

            // Should have all default contexts
            expect(contexts.has('@home')).toBe(true)
            expect(contexts.has('@work')).toBe(true)
            expect(contexts.has('@personal')).toBe(true)

            // Should have custom contexts
            expect(contexts.has('@custom1')).toBe(true)
            expect(contexts.has('@custom2')).toBe(true)
        })

        test('should handle tasks with null or undefined contexts', () => {
            const tasks = [
                { id: '1', contexts: null },
                { id: '2', contexts: undefined },
                { id: '3', contexts: ['@home'] }
            ]

            const contexts = getAllContexts(tasks)

            expect(contexts).toBeInstanceOf(Set)
            expect(contexts.has('@home')).toBe(true)
        })

        test('should handle empty context arrays', () => {
            const tasks = [
                { id: '1', contexts: [] },
                { id: '2', contexts: ['@work'] }
            ]

            const contexts = getAllContexts(tasks)

            expect(contexts).toBeInstanceOf(Set)
            expect(contexts.has('@work')).toBe(true)
        })

        test('should deduplicate contexts', () => {
            const tasks = [
                { id: '1', contexts: ['@home', '@work', '@home'] },
                { id: '2', contexts: ['@work', '@personal', '@work'] }
            ]

            const contexts = getAllContexts(tasks)

            // Should have all default contexts (6) plus custom contexts from tasks
            // But @home, @work, @personal are default contexts, so no new custom contexts added
            expect(contexts.size).toBe(6) // All 6 default contexts
            expect(contexts.has('@home')).toBe(true)
            expect(contexts.has('@work')).toBe(true)
            expect(contexts.has('@personal')).toBe(true)
        })
    })

    describe('getContextTaskCounts function', () => {
        test('should count tasks per context', () => {
            const tasks = [
                { id: '1', contexts: ['@home', '@work'] },
                { id: '2', contexts: ['@work', '@personal'] },
                { id: '3', contexts: ['@home'] },
                { id: '4', contexts: ['@custom'] }
            ]

            const counts = getContextTaskCounts(tasks)

            expect(typeof counts).toBe('object')
            expect(counts['@home']).toBe(2)
            expect(counts['@work']).toBe(2)
            expect(counts['@personal']).toBe(1)
            expect(counts['@custom']).toBe(1)
        })

        test('should handle tasks with no contexts', () => {
            const tasks = [
                { id: '1', contexts: [] },
                { id: '2', contexts: null },
                { id: '3', contexts: undefined },
                { id: '4', contexts: ['@home'] }
            ]

            const counts = getContextTaskCounts(tasks)

            expect(counts['@home']).toBe(1)
            // Should not have entries for null/undefined/empty contexts
            expect(Object.keys(counts).length).toBe(1)
        })

        test('should return empty map for empty task list', () => {
            const counts = getContextTaskCounts([])

            expect(typeof counts).toBe('object')
            expect(Object.keys(counts).length).toBe(0)
        })

        test('should handle duplicate contexts within same task', () => {
            const tasks = [
                { id: '1', contexts: ['@home', '@home', '@work'] },
                { id: '2', contexts: ['@work', '@work', '@home'] }
            ]

            const counts = getContextTaskCounts(tasks)

            // Counts duplicates within same task (does not deduplicate)
            expect(counts['@home']).toBe(3) // @home appears 3 times total
            expect(counts['@work']).toBe(3) // @work appears 3 times total
        })
    })

    describe('getContextIds function', () => {
        test('should return array of context IDs', () => {
            const ids = getContextIds()

            expect(Array.isArray(ids)).toBe(true)
            expect(ids.length).toBe(6) // All 6 default contexts

            // Should contain all default context IDs
            expect(ids).toContain('@home')
            expect(ids).toContain('@work')
            expect(ids).toContain('@personal')
            expect(ids).toContain('@errand')
            expect(ids).toContain('@computer')
            expect(ids).toContain('@phone')
        })

        test('should return immutable array', () => {
            const ids = getContextIds()
            const originalLength = ids.length

            // Try to modify the array
            ids.push('@test')

            // Should not affect the original
            const newIds = getContextIds()
            expect(newIds.length).toBe(originalLength)
            expect(newIds).not.toContain('@test')
        })
    })

    describe('Integration: Functions work together', () => {
        test('getAllContexts should include all contexts from getContextIds', () => {
            const defaultIds = getContextIds()
            const allContexts = getAllContexts([])

            defaultIds.forEach((id) => {
                expect(allContexts.has(id)).toBe(true)
            })
        })

        test('getContextTaskCounts should count contexts from getAllContexts', () => {
            const tasks = [
                { id: '1', contexts: ['@home', '@work'] },
                { id: '2', contexts: ['@work', '@personal'] }
            ]

            const allContexts = getAllContexts(tasks)
            const counts = getContextTaskCounts(tasks)

            // Every context in counts should be in allContexts
            Object.keys(counts).forEach((context) => {
                expect(allContexts.has(context)).toBe(true)
            })

            // Contexts with counts > 0 should be in allContexts
            expect(allContexts.has('@home')).toBe(true)
            expect(allContexts.has('@work')).toBe(true)
            expect(allContexts.has('@personal')).toBe(true)
        })
    })
})
