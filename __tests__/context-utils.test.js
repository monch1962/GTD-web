/**
 * Test: Context Utilities DRY Compliance
 * Ensure context combining functions exist and are used throughout the code
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
    getAllContexts,
    getContextTaskCounts,
    getContextIds
} from '../js/config/defaultContexts.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

            // Total should be 8 (6 default + 2 custom)
            expect(contexts.size).toBe(8)
        })

        test('should handle tasks with no contexts', () => {
            const tasks = [
                { id: '1', title: 'Task without contexts' },
                { id: '2', contexts: [] }
            ]

            const contexts = getAllContexts(tasks)

            // Should still have all default contexts
            expect(contexts.size).toBe(6)
        })

        test('should handle null or undefined tasks gracefully', () => {
            const contexts1 = getAllContexts(null)
            expect(contexts1.size).toBe(6)

            const contexts2 = getAllContexts(undefined)
            expect(contexts2.size).toBe(6)
        })
    })

    describe('getContextTaskCounts function', () => {
        test('should return empty object when no tasks provided', () => {
            const counts = getContextTaskCounts([])

            expect(counts).toEqual({})
        })

        test('should count tasks per context correctly', () => {
            const tasks = [
                { id: '1', contexts: ['@home', '@work'] },
                { id: '2', contexts: ['@home'] },
                { id: '3', contexts: ['@work', '@personal'] }
            ]

            const counts = getContextTaskCounts(tasks)

            expect(counts['@home']).toBe(2)
            expect(counts['@work']).toBe(2)
            expect(counts['@personal']).toBe(1)
        })

        test('should count tasks with multiple contexts in each context', () => {
            const tasks = [{ id: '1', contexts: ['@home', '@work', '@computer'] }]

            const counts = getContextTaskCounts(tasks)

            expect(counts['@home']).toBe(1)
            expect(counts['@work']).toBe(1)
            expect(counts['@computer']).toBe(1)
        })

        test('should handle tasks with no contexts', () => {
            const tasks = [
                { id: '1', title: 'Task without contexts' },
                { id: '2', contexts: [] }
            ]

            const counts = getContextTaskCounts([])

            expect(counts).toEqual({})
        })

        test('should count custom contexts', () => {
            const tasks = [
                { id: '1', contexts: ['@custom1'] },
                { id: '2', contexts: ['@custom1', '@custom2'] },
                { id: '3', contexts: ['@custom2'] }
            ]

            const counts = getContextTaskCounts(tasks)

            expect(counts['@custom1']).toBe(2)
            expect(counts['@custom2']).toBe(2)
        })
    })

    describe('DRY Compliance', () => {
        test('app.js should import and use getAllContexts', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Should import the function
            expect(appContent).toContain('getAllContexts')

            // Should use it in updateSidebarContextFilters
            expect(appContent).toContain('getAllContexts(this.tasks)')
        })

        test('app.js should import and use getContextTaskCounts', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Should import the function
            expect(appContent).toContain('getContextTaskCounts')

            // Should use it in updateSidebarContextFilters
            expect(appContent).toContain('getContextTaskCounts(this.tasks)')
        })

        test('should not have inline context collection logic in app.js', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Find the updateSidebarContextFilters method
            const methodMatch = appContent.match(
                /updateSidebarContextFilters\(\)\s*\{([\s\S]*?)\n {4}\}/
            )
            expect(methodMatch).toBeTruthy()

            const methodBody = methodMatch[1]

            // Should NOT have manual custom context collection
            const hasManualCustomCollection =
                methodBody.includes('customContexts') &&
                methodBody.includes('new Set()') &&
                methodBody.includes('this.tasks.forEach')

            expect(hasManualCustomCollection).toBe(false)

            // Should NOT have manual task counting
            const hasManualTaskCounting =
                methodBody.includes('contextTaskCounts = {}') &&
                methodBody.includes('this.tasks.forEach') &&
                methodBody.includes('(contextTaskCounts[')

            expect(hasManualTaskCounting).toBe(false)
        })

        test('no other JS files should duplicate context combining logic', () => {
            const jsPath = path.join(__dirname, '..')
            const jsFiles = []

            // Find all JS files
            const findJsFiles = (dir) => {
                const files = fs.readdirSync(dir)
                files.forEach((file) => {
                    const filePath = path.join(dir, file)
                    const stat = fs.statSync(filePath)
                    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                        findJsFiles(filePath)
                    } else if (file.endsWith('.js')) {
                        jsFiles.push(filePath)
                    }
                })
            }

            findJsFiles(jsPath)

            const violations = []

            jsFiles.forEach((filePath) => {
                const content = fs.readFileSync(filePath, 'utf-8')
                const relativePath = path.relative(jsPath, filePath)

                // Skip test files, config files, and dom-utils.js
                if (
                    relativePath.includes('__tests__') ||
                    relativePath.includes('tests/') ||
                    relativePath.includes('config/defaultContexts.js') ||
                    relativePath.includes('dom-utils.js')
                ) {
                    return
                }

                // Look for patterns that suggest inline context collection
                // Pattern 1: customContexts = new Set()
                if (content.includes('customContexts') && content.includes('new Set()')) {
                    // Make sure it's not just importing the function
                    if (!content.includes('getAllContexts')) {
                        violations.push({
                            file: relativePath,
                            reason: 'Has customContexts Set but does not import getAllContexts'
                        })
                    }
                }

                // Pattern 2: Manual context iteration for collecting all contexts
                const manualCollectionPattern =
                    /this\.tasks\.forEach\([\s\S]*?contexts\.forEach[\s\S]*?\!\s*defaultContexts\.includes/s
                if (manualCollectionPattern.test(content) && !content.includes('getAllContexts')) {
                    violations.push({
                        file: relativePath,
                        reason: 'Has manual context collection but does not use getAllContexts'
                    })
                }

                // Pattern 3: Manual task counting
                const manualCountingPattern =
                    /contextTaskCounts\s*=\s*\{\}[\s\S]*?this\.tasks\.forEach[\s\S]*?contextTaskCounts\[/
                if (
                    manualCountingPattern.test(content) &&
                    !content.includes('getContextTaskCounts')
                ) {
                    violations.push({
                        file: relativePath,
                        reason: 'Has manual task counting but does not use getContextTaskCounts'
                    })
                }
            })

            if (violations.length > 0) {
                console.log('Found files with duplicate context logic:')
                violations.forEach((v) => {
                    console.log(`  ${v.file}: ${v.reason}`)
                })
            }

            expect(violations.length).toBe(0)
        })
    })

    describe('Integration Tests', () => {
        test('getAllContexts and getContextTaskCounts work together', () => {
            const tasks = [
                { id: '1', contexts: ['@home', '@work'] },
                { id: '2', contexts: ['@custom', '@home'] },
                { id: '3', contexts: [] }
            ]

            const allContexts = getAllContexts(tasks)
            const counts = getContextTaskCounts(tasks)

            // Check that contexts with tasks have counts
            const contextsInTasks = new Set()
            tasks.forEach((task) => {
                if (task.contexts) {
                    task.contexts.forEach((context) => contextsInTasks.add(context))
                }
            })

            contextsInTasks.forEach((context) => {
                expect(counts[context]).toBeDefined()
                expect(typeof counts[context]).toBe('number')
                expect(counts[context]).toBeGreaterThan(0)
            })

            // Specific counts
            expect(counts['@home']).toBe(2)
            expect(counts['@work']).toBe(1)
            expect(counts['@custom']).toBe(1)

            // Contexts without tasks should not be in counts
            expect(counts['@personal']).toBeUndefined()
            expect(counts['@computer']).toBeUndefined()
        })

        test('functions handle edge cases gracefully', () => {
            // Empty tasks array
            expect(getAllContexts([]).size).toBe(6)
            expect(getContextTaskCounts([])).toEqual({})

            // Tasks with missing contexts property
            const tasksWithMissingContexts = [
                { id: '1' }, // No contexts property
                { id: '2', contexts: null }, // Null contexts
                { id: '3', contexts: [] } // Empty contexts
            ]

            const contexts = getAllContexts(tasksWithMissingContexts)
            expect(contexts.size).toBe(6) // Should still have default contexts

            const counts = getContextTaskCounts(tasksWithMissingContexts)
            expect(Object.keys(counts).length).toBe(0) // No counts
        })
    })
})
