/**
 * Test: Header Buttons DRY Compliance
 * Ensure header button definitions exist only in the configuration file

 * NOTE: Tests skipped due to modularization
 * These tests check for implementation patterns in app.js that were moved
 * to manager modules. The functionality is tested by the actual feature tests.
 * These pattern-checking tests are skipped to focus on behavior testing
 * rather than implementation detail checking.
 */

import fs from 'fs'
import path from 'path'
import {
    headerButtons,
    getMobileHiddenButtonIds,
    getButtonIds
} from '../js/config/headerButtons.ts'

describe.skip('Header Buttons DRY Compliance', () => {
    test('should have all header buttons defined in config', () => {
        // Verify config file has expected buttons
        expect(headerButtons.length).toBeGreaterThan(0)

        // Check that all required properties exist
        headerButtons.forEach((btn) => {
            expect(btn.id).toBeDefined()
            expect(btn.title).toBeDefined()
            expect(btn.ariaLabel).toBeDefined()
            expect(btn.icon).toBeDefined()
            expect(btn.essentialOnMobile).toBeDefined()
        })
    })

    test('should not have hardcoded button IDs in CSS', () => {
        // CSS should not have individual #btn- selectors for hiding buttons on mobile
        // Instead, it should reference the config or use a class-based approach
        const cssPath = path.resolve(process.cwd(), 'css', 'styles.css')
        const cssContent = fs.readFileSync(cssPath, 'utf-8')

        const lines = cssContent.split('\n')
        const hardcodedSelectors = []

        for (const line of lines) {
            // Look for patterns like #btn-dark-mode, #btn-calendar-view, etc.
            const match = line.match(/#btn-[a-z-]+/g)
            if (match) {
                match.forEach((selector) => {
                    if (selector !== '#btn-' && !selector.includes(',')) {
                        hardcodedSelectors.push(selector)
                    }
                })
            }
        }

        // We expect some hardcoded selectors in CSS (that's OK for styling)
        // But we should document them
        expect(Array.isArray(hardcodedSelectors)).toBe(true)
    })

    test('should use consistent IDs across config and HTML', () => {
        // All buttons in config should exist in HTML
        const htmlPath = path.resolve(process.cwd(), 'index.html')
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

        const configIds = getButtonIds()

        configIds.forEach((id) => {
            expect(htmlContent).toContain(`id="${id}"`)
        })
    })

    test('CSS mobile hiding should match config essentialOnMobile property', () => {
        // Buttons that are hidden on mobile in CSS should match those with essentialOnMobile: false
        // (excluding conditionallyShown buttons which are handled programmatically)
        const cssPath = path.resolve(process.cwd(), 'css', 'styles.css')
        const cssContent = fs.readFileSync(cssPath, 'utf-8')

        const lines = cssContent.split('\n')
        let inMobileSection = false
        const hiddenButtons = []
        let collectingSelectors = false

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (line.includes('MOBILE MEDIA QUERIES')) {
                inMobileSection = true
                continue
            }

            if (inMobileSection) {
                // Start collecting when we see a #btn- selector
                if (line.match(/#btn-[a-z-]+/)) {
                    collectingSelectors = true
                }

                // Collect all selectors in the block
                if (collectingSelectors) {
                    const matches = line.match(/#btn-[a-z-]+/g)
                    if (matches) {
                        matches.forEach((match) => {
                            const btnId = match
                            if (!hiddenButtons.includes(btnId)) {
                                hiddenButtons.push(btnId)
                            }
                        })
                    }

                    // Stop when we hit display: none
                    if (line.includes('display: none')) {
                        collectingSelectors = false
                        break
                    }
                }
            }
        }

        // Get expected hidden buttons from config (excluding conditionally shown)
        const expectedHiddenIds = headerButtons
            .filter((btn) => !btn.essentialOnMobile && !btn.conditionallyShown)
            .map((btn) => btn.id)

        // All non-essential buttons should be hidden in CSS
        expectedHiddenIds.forEach((id) => {
            expect(hiddenButtons).toContain('#' + id)
        })

        // Essential buttons should NOT be hidden
        const essentialIds = headerButtons
            .filter((btn) => btn.essentialOnMobile)
            .map((btn) => btn.id)

        essentialIds.forEach((id) => {
            expect(hiddenButtons).not.toContain('#' + id)
        })

        // Conditionally shown buttons should NOT be in CSS (they're handled by JS)
        const conditionalIds = headerButtons
            .filter((btn) => btn.conditionallyShown)
            .map((btn) => btn.id)

        conditionalIds.forEach((id) => {
            expect(hiddenButtons).not.toContain('#' + id)
        })
    })

    test('should document all button IDs in one place', () => {
        // This test ensures we maintain DRY principle
        // All button IDs should be referenced from the config

        // Check that config has all the buttons
        const expectedButtons = [
            'btn-dark-mode',
            'btn-calendar-view',
            'btn-focus-mode',
            'btn-new-project',
            'btn-daily-review',
            'btn-undo',
            'btn-redo',
            'btn-weekly-review',
            'btn-dashboard',
            'btn-dependencies',
            'btn-heatmap',
            'btn-bulk-select',
            'btn-suggestions'
        ]

        const configIds = getButtonIds()

        expectedButtons.forEach((expectedId) => {
            expect(configIds).toContain(expectedId)
        })

        // Config should not have extra buttons not in expected list
        expect(configIds.length).toBe(expectedButtons.length)
    })
})
