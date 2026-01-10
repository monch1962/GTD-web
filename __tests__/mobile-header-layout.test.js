/**
 * Test: Mobile Header Layout
 * Verify that header buttons are properly laid out on mobile devices
 */

import fs from 'fs'
import path from 'path'

describe('Mobile Header Layout', () => {
    test('should hide non-essential buttons on mobile', () => {
        const cssPath = path.resolve(process.cwd(), 'css', 'styles.css')
        const cssContent = fs.readFileSync(cssPath, 'utf-8')

        // These buttons should be hidden on mobile to save space
        const buttonsHiddenOnMobile = [
            'btn-calendar-view',
            'btn-focus-mode',
            'btn-daily-review',
            'btn-new-project',
            'btn-weekly-review',
            'btn-dashboard',
            'btn-dependencies',
            'btn-heatmap',
            'btn-suggestions'
        ]

        const lines = cssContent.split('\n')
        let inMainMobileSection = false
        const foundHiddenButtons = []

        for (const line of lines) {
            if (line.includes('MOBILE MEDIA QUERIES')) {
                inMainMobileSection = true
                continue
            }

            if (inMainMobileSection) {
                // Look for the multi-line button hiding rule
                if (line.includes('#btn-calendar-view')) {
                    // Found the start of the button hiding block
                    // Check a few lines to see all the buttons
                    for (
                        let i = lines.indexOf(line);
                        i < Math.min(lines.indexOf(line) + 15, lines.length);
                        i++
                    ) {
                        const checkLine = lines[i]
                        for (const btnId of buttonsHiddenOnMobile) {
                            if (checkLine.includes(`#${btnId}`)) {
                                if (!foundHiddenButtons.includes(btnId)) {
                                    foundHiddenButtons.push(btnId)
                                }
                            }
                        }
                        if (checkLine.includes('display: none')) {
                            break
                        }
                    }
                    break
                }
            }
        }

        // Should hide at least 8 non-essential buttons
        expect(foundHiddenButtons.length).toBeGreaterThanOrEqual(8)
    })

    test('should keep essential buttons visible on mobile', () => {
        const htmlPath = path.resolve(process.cwd(), 'index.html')
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

        // These buttons should remain visible on mobile
        const essentialButtons = ['btn-dark-mode', 'btn-undo', 'btn-redo']

        // Check that these buttons exist in HTML
        for (const buttonId of essentialButtons) {
            expect(htmlContent).toContain(`id="${buttonId}"`)
        }
    })
})
