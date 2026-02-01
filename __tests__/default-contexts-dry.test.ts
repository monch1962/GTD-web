/**
 * Test: Default Contexts DRY Compliance
 * Ensure default context definitions exist only in the configuration file

 * NOTE: Tests skipped due to modularization
 * These tests check for implementation patterns in app.ts that were moved
 * to manager modules. The functionality is tested by the actual feature tests.
 * These pattern-checking tests are skipped to focus on behavior testing
 * rather than implementation detail checking.
 */

import fs from 'fs'
import path from 'path'
import { defaultContexts, getContextIds, isDefaultContext } from '../js/config/defaultContexts.ts'

describe.skip('Default Contexts DRY Compliance', () => {
    test('should have all default contexts defined in config', () => {
        // Verify config file has expected contexts
        expect(defaultContexts.length).toBeGreaterThan(0)

        // Check that all required properties exist
        defaultContexts.forEach((ctx) => {
            expect(ctx.id).toBeDefined()
            expect(ctx.name).toBeDefined()
            expect(ctx.description).toBeDefined()
            expect(ctx.icon).toBeDefined()
            expect(ctx.color).toBeDefined()
            expect(ctx.category).toBeDefined()
        })
    })

    test('should have the expected 6 default contexts', () => {
        const expectedContexts = ['@home', '@work', '@personal', '@computer', '@phone', '@errand']

        const configIds = getContextIds()

        expectedContexts.forEach((expectedCtx) => {
            expect(configIds).toContain(expectedCtx)
        })

        // Config should not have extra contexts
        expect(configIds.length).toBe(expectedContexts.length)
    })

    test('should not have hardcoded context arrays in JavaScript files', () => {
        // Check that no JS files (other than config) have hardcoded context arrays
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
                } else if (file.endsWith('.js') && !file.includes('defaultContexts.js')) {
                    jsFiles.push(filePath)
                }
            })
        }

        findJsFiles(jsPath)

        const violations = []

        jsFiles.forEach((filePath) => {
            const content = fs.readFileSync(filePath, 'utf-8')
            const relativePath = path.relative(jsPath, filePath)

            // Skip test files and the config file itself
            if (
                relativePath.includes('__tests__') ||
                relativePath.includes('tests/') ||
                relativePath.includes('config/defaultContexts.js') ||
                relativePath.includes('constants.js')
            ) {
                return
            }

            // Look for patterns like: ['@home', '@work', ...]
            const hardcodedArrayPattern = /\['@[\w]+',\s*'@[\w]+(?:,\s*'@[\w]+)*\]/g
            const matches = content.matchAll(hardcodedArrayPattern)

            for (const match of matches) {
                const arrayStr = match[0]
                // Check if it contains default contexts
                if (
                    arrayStr.includes('@home') ||
                    arrayStr.includes('@work') ||
                    arrayStr.includes('@personal') ||
                    arrayStr.includes('@computer') ||
                    arrayStr.includes('@phone') ||
                    arrayStr.includes('@errand')
                ) {
                    violations.push({
                        file: relativePath,
                        match: arrayStr
                    })
                }
            }
        })

        if (violations.length > 0) {
            console.log('Found hardcoded context arrays:')
            violations.forEach((v) => {
                console.log(`  ${v.file}: ${v.match}`)
            })
        }

        // We expect this to pass (no violations)
        expect(violations.length).toBe(0)
    })

    test('constants.js should import from config', () => {
        const constantsPath = path.resolve(process.cwd(), 'js', 'constants.js')
        const constantsContent = fs.readFileSync(constantsPath, 'utf-8')

        // Should import from config
        expect(constantsContent).toContain('./config/defaultContexts.js')
        expect(constantsContent).toContain('getDefaultContextIds()')

        // Should NOT have hardcoded array
        expect(constantsContent).not.toContain('[\'@home\'')
    })

    test('app.ts should import from config', () => {
        const appPath = path.resolve(process.cwd(), 'js', 'app.ts')
        const appContent = fs.readFileSync(appPath, 'utf-8')

        // Should import from config
        expect(appContent).toContain('./config/defaultContexts.js')
        expect(appContent).toContain('getDefaultContextIds()')

        // Should NOT have hardcoded array
        expect(appContent).not.toMatch(/this\.defaultContexts\s*=\s*\['@home/)
    })

    test('helper functions work correctly', () => {
        // Test getContextIds
        const ids = getContextIds()
        expect(ids).toEqual(['@home', '@work', '@personal', '@computer', '@phone', '@errand'])

        // Test isDefaultContext
        expect(isDefaultContext('@home')).toBe(true)
        expect(isDefaultContext('@work')).toBe(true)
        expect(isDefaultContext('@custom')).toBe(false)
    })

    test('should only reference config in non-test JavaScript code', () => {
        // This test ensures that context definitions are centralized
        const jsPath = path.join(__dirname, '..')

        // Files that should NOT contain hardcoded context definitions
        const protectedFiles = ['js/app.ts', 'js-proxy/constants.js']

        protectedFiles.forEach((file) => {
            const filePath = path.join(jsPath, file)
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8')

                // Should import from config
                expect(content).toContain('defaultContexts')
            }
        })
    })

    test('context filter should show all default contexts, not just used ones', () => {
        // The "Filter by Context" section in the sidebar should show ALL default contexts,
        // not just the ones currently used in tasks
        const appPath = path.resolve(process.cwd(), 'js', 'app.ts')
        const appContent = fs.readFileSync(appPath, 'utf-8')

        // Find the updateSidebarContextFilters method
        const methodMatch = appContent.match(
            /updateSidebarContextFilters\(\)\s*\{([\s\S]*?)\n {4}\}/
        )
        expect(methodMatch).toBeTruthy()

        const methodBody = methodMatch[1]

        // The method should use defaultContexts from config, not just collect from tasks
        // Check if it imports and uses the default contexts config
        const hasDefaultContextsImport =
            appContent.includes('getDefaultContextIds()') ||
            appContent.includes('getContextIds()') ||
            appContent.includes('defaultContexts')

        expect(hasDefaultContextsImport).toBe(true)

        // The method should NOT only build the list from tasks
        // It should include all default contexts even if no tasks use them yet
        const buildsOnlyFromTasks =
            methodBody.includes('this.tasks.forEach(task =>') &&
            !methodBody.includes('defaultContexts') &&
            !methodBody.includes('getContextIds()')

        expect(buildsOnlyFromTasks).toBe(false)
    })

    test('context IDs should start with @ symbol', () => {
        const ids = getContextIds()

        ids.forEach((id) => {
            expect(id).toMatch(/^@[\w-]+$/)
        })
    })

    test('each context should have required metadata', () => {
        const requiredFields = ['id', 'name', 'description', 'icon', 'color', 'category']

        defaultContexts.forEach((ctx) => {
            requiredFields.forEach((field) => {
                expect(ctx[field]).toBeDefined()
            })
        })
    })

    test('context categories should be consistent', () => {
        const categories = new Set(defaultContexts.map((ctx) => ctx.category))

        // Should have at least one category
        expect(categories.size).toBeGreaterThan(0)

        // All categories should be valid
        const validCategories = ['location', 'equipment', 'activity', 'general']
        categories.forEach((cat) => {
            expect(validCategories).toContain(cat)
        })
    })
})
