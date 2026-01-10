/**
 * Test: "What Should I Work On?" Context Display
 * Ensure the suggestions modal includes custom contexts, not just default ones
 */

import fs from 'fs'
import path from 'path'

describe('Suggestions Modal Context Display', () => {
    describe('showSuggestions function', () => {
        test('should use getAllContexts to generate context options', () => {
            const appPath = path.resolve(process.cwd(), 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Should import getAllContexts
            expect(appContent).toContain('getAllContexts')

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n {4}\}/)
            expect(funcMatch).toBeTruthy()

            const funcBody = funcMatch[0]

            // Should call getAllContexts with this.tasks
            expect(funcBody).toContain('getAllContexts(this.tasks)')

            // Should convert to array and sort
            expect(funcBody).toContain('Array.from(allContexts).sort()')

            // Should dynamically generate options
            expect(funcBody).toContain('.map(context =>')
            expect(funcBody).toContain('${contextOptions}')
        })

        test('should not have hardcoded context options', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n {4}\}/)
            expect(funcMatch).toBeTruthy()

            const funcBody = funcMatch[0]

            // Find the suggestion-context select in the function
            const selectMatch = funcBody.match(/<select id="suggestion-context"[\s\S]*?<\/select>/)
            expect(selectMatch).toBeTruthy()

            const selectHTML = selectMatch[0]

            // Should NOT have hardcoded option tags for default contexts
            // Look for the pattern of old hardcoded options
            const hardcodedOptions = [
                '<option value="@home">@home</option>',
                '<option value="@work">@work</option>',
                '<option value="@computer">@computer</option>',
                '<option value="@phone">@phone</option>',
                '<option value="@personal">@personal</option>'
            ]

            hardcodedOptions.forEach((option) => {
                // The select should NOT contain these hardcoded options
                // They should be generated dynamically instead
                expect(selectHTML).not.toContain(option)
            })

            // Should have the dynamic placeholder
            expect(selectHTML).toContain('${contextOptions}')
        })

        test('should generate options using map and join', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n {4}\}/)
            expect(funcMatch).toBeTruthy()

            const funcBody = funcMatch[0]

            // Should have a map call to generate options
            expect(funcBody).toMatch(/sortedContexts\.map\(context/)
            expect(funcBody).toMatch(/\.join\(/)

            // Should escape HTML to prevent XSS
            expect(funcBody).toContain('escapeHtml(context)')
        })

        test('should include "Anywhere" option plus all contexts', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n {4}\}/)
            expect(funcMatch).toBeTruthy()

            const funcBody = funcMatch[0]

            // Find the suggestion-context select
            const selectMatch = funcBody.match(/<select id="suggestion-context"[\s\S]*?<\/select>/)
            expect(selectMatch).toBeTruthy()

            const selectHTML = selectMatch[0]

            // Should have the "Anywhere" option (empty value)
            expect(selectHTML).toContain('<option value="">Anywhere</option>')

            // Should have the dynamic context options
            expect(selectHTML).toContain('${contextOptions}')
        })
    })

    describe('regression test for hardcoded contexts', () => {
        test('should never hardcode default context list in suggestions', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Find all select elements with id="suggestion-context"
            const selectMatches = appContent.matchAll(
                /<select[^>]*id="suggestion-context"[^>]*>[\s\S]*?<\/select>/g
            )

            const violations = []

            for (const match of selectMatches) {
                const selectHTML = match[0]

                // Check if it contains hardcoded default context options
                // A hardcoded option would look like: <option value="@home">@home</option>
                // It would NOT use ${} template literals

                // Extract all options except the first one (which is "Anywhere")
                const optionMatches = selectHTML.matchAll(
                    /<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g
                )

                const options = Array.from(optionMatches)

                // If there are more than 2 options and none use template literals, it's hardcoded
                if (options.length > 2) {
                    const hasTemplateLiteral =
                        selectHTML.includes('${contextOptions}') ||
                        selectHTML.includes('${context}')

                    if (!hasTemplateLiteral) {
                        violations.push({
                            select: selectHTML.substring(0, 200) + '...'
                        })
                    }
                }
            }

            if (violations.length > 0) {
                console.log('Found hardcoded context options in suggestion modal:')
                violations.forEach((v) => {
                    console.log(`  ${v.select}`)
                })
            }

            expect(violations.length).toBe(0)
        })

        test('context list in suggestions should match getAllContexts pattern', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Find showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n {4}\}/)
            expect(funcMatch).toBeTruthy()

            const funcBody = funcMatch[0]

            // Should follow the standard pattern:
            // 1. Call getAllContexts(this.tasks)
            // 2. Convert to array
            // 3. Sort
            // 4. Map to option elements
            // 5. Join

            const hasStandardPattern =
                funcBody.includes('getAllContexts(this.tasks)') &&
                funcBody.includes('Array.from') &&
                funcBody.includes('.sort()') &&
                funcBody.includes('.map(') &&
                funcBody.includes('.join(')

            expect(hasStandardPattern).toBe(true)
        })
    })

    describe('integration with context utilities', () => {
        test('should import getAllContexts from config', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Should import getAllContexts
            expect(appContent).toMatch(/import.*getAllContexts.*from.*defaultContexts/)
        })

        test('suggestions modal uses same context source as sidebar', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Both showSuggestions and updateSidebarContextFilters should use getAllContexts
            const showSuggestionsMatch = appContent.match(
                /showSuggestions\(\)\s*\{[\s\S]*?\n {4}\}/
            )
            const sidebarFiltersMatch = appContent.match(
                /updateSidebarContextFilters\(\)\s*\{[\s\S]*?\n {4}\}/
            )

            expect(showSuggestionsMatch).toBeTruthy()
            expect(sidebarFiltersMatch).toBeTruthy()

            const showSuggestionsBody = showSuggestionsMatch[0]
            const sidebarFiltersBody = sidebarFiltersMatch[0]

            // Both should use getAllContexts
            expect(showSuggestionsBody).toContain('getAllContexts(this.tasks)')
            expect(sidebarFiltersBody).toContain('getAllContexts(this.tasks)')
        })
    })

    describe('context sorting and formatting', () => {
        test('should sort contexts alphabetically', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n {4}\}/)
            expect(funcMatch).toBeTruthy()

            const funcBody = funcMatch[0]

            // Should sort the contexts
            expect(funcBody).toContain('.sort()')
        })

        test('should escape HTML in context values', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n {4}\}/)
            expect(funcMatch).toBeTruthy()

            const funcBody = funcMatch[0]

            // Should escape HTML to prevent XSS attacks
            expect(funcBody).toContain('escapeHtml(context)')
        })

        test('should include all contexts including custom ones', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n {4}\}/)
            expect(funcMatch).toBeTruthy()

            const funcBody = funcMatch[0]

            // The function should use getAllContexts which includes both default and custom
            expect(funcBody).toContain('getAllContexts(this.tasks)')

            // Should NOT filter out custom contexts
            expect(funcBody).not.toContain('filter(context =>')
            expect(funcBody).not.toContain('defaultContexts.includes')
        })
    })

    describe('DRY compliance', () => {
        test('should not duplicate context list generation logic', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Count how many times we have inline context array generation
            // Look for patterns like: ['@home', '@work', ...]
            const inlineContextArrayPattern = /\['@[\w]+',\s*'@[\w]+(?:,\s*'@[\w]+)*\]/g
            const matches = appContent.matchAll(inlineContextArrayPattern)

            const contextGenerationMatches = []

            for (const match of matches) {
                const beforeMatch = appContent.substring(0, match.index)
                const lineStart = beforeMatch.lastIndexOf('\n') + 1
                const lineEnd = appContent.indexOf('\n', match.index)
                const line = appContent.substring(lineStart, lineEnd)

                // Only count if it's not in getAllContexts function itself
                if (
                    !line.includes('function getAllContexts') &&
                    !line.includes('export function')
                ) {
                    contextGenerationMatches.push(line.trim())
                }
            }

            if (contextGenerationMatches.length > 0) {
                console.log('Found inline context arrays (should use getAllContexts):')
                contextGenerationMatches.forEach((m) => {
                    console.log(`  ${m}`)
                })
            }

            // We want to minimize inline context arrays
            // Allow some legacy code but ensure new code uses the helper
            expect(contextGenerationMatches.length).toBeLessThan(3)
        })

        test('all context dropdowns should use getAllContexts pattern', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js')
            const appContent = fs.readFileSync(appPath, 'utf-8')

            // Find all select elements that might show contexts
            const selectMatches = appContent.matchAll(/<select[^>]*>[\s\S]*?<\/select>/g)

            const violations = []

            for (const match of selectMatches) {
                const selectHTML = match[0]

                // Check if this select has context options
                if (selectHTML.includes('@home') || selectHTML.includes('@work')) {
                    // Check if it uses dynamic generation
                    const beforeMatch = appContent.substring(0, match.index)
                    const lineStart = beforeMatch.lastIndexOf('\n') + 1
                    const lineEnd = appContent.indexOf('\n', match.index)
                    const line = appContent.substring(lineStart, lineEnd)

                    // Look back a bit to see if there's a getAllContexts call
                    const contextBefore = appContent.substring(
                        Math.max(0, match.index - 1000),
                        match.index
                    )

                    if (!selectHTML.includes('${') && !contextBefore.includes('getAllContexts')) {
                        violations.push({
                            line: line.trim().substring(0, 100)
                        })
                    }
                }
            }

            if (violations.length > 0) {
                console.log('Found select elements with hardcoded contexts:')
                violations.forEach((v) => {
                    console.log(`  ${v.line}`)
                })
            }

            expect(violations.length).toBe(0)
        })
    })
})
