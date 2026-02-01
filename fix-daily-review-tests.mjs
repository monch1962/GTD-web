import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const filePath = path.join(__dirname, '__tests__/daily-review.test.ts')
let content = fs.readFileSync(filePath, 'utf8')

// Track describe block numbers for naming
let describeCount = 0
let testCount = 0

// Fix describe blocks
content = content.replace(/describe\('\.\*',\s*\(_\)\s*=>\s*\{/g, (match) => {
    describeCount++
    const describeNames = [
        'DailyReviewManager - Initialization',
        'DailyReviewManager - Setup',
        'DailyReviewManager - Show/Hide Modal',
        'DailyReviewManager - Content Generation',
        'DailyReviewManager - Task Analysis',
        'DailyReviewManager - Project Analysis',
        'DailyReviewManager - Review Completion',
        'DailyReviewManager - Keyboard Navigation',
        'DailyReviewManager - Accessibility',
        'DailyReviewManager - Error Handling',
        'DailyReviewManager - Integration',
        'DailyReviewManager - Edge Cases',
        'DailyReviewManager - Performance'
    ]

    const name = describeNames[describeCount - 1] || `DailyReviewManager - Block ${describeCount}`
    return `describe('${name}', () => {`
})

// Fix test blocks - we need to be more careful here
// First, let's see what tests we have by analyzing the file
const lines = content.split('\n')
let inDescribe = 0
let currentDescribe = ''
const fixedLines = []

for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track describe blocks
    if (line.includes("describe('")) {
        const match = line.match(/describe\('([^']+)'/)
        if (match) {
            currentDescribe = match[1]
            inDescribe++
        }
        fixedLines.push(line)
    } else if (line.includes('describe(') && line.includes('=>')) {
        // Already fixed describe block
        fixedLines.push(line)
    } else if (line.includes("test('.*',")) {
        // This is a regex test pattern that needs fixing
        // We need to infer the test name from context
        testCount++

        // Look ahead a few lines to understand what the test does
        let testName = `test ${testCount}`

        // Check next few lines for clues
        for (let j = 1; j <= 5 && i + j < lines.length; j++) {
            const nextLine = lines[i + j]
            if (nextLine.includes('expect(')) {
                if (nextLine.includes('manager.state')) {
                    testName = 'should initialize with state and app references'
                } else if (nextLine.includes('showDailyReview')) {
                    testName = 'should call showDailyReview when button clicked'
                } else if (nextLine.includes('closeDailyReview')) {
                    testName = 'should call closeDailyReview when close button clicked'
                } else if (nextLine.includes('not.toThrow')) {
                    testName = 'should handle missing buttons gracefully'
                } else if (nextLine.includes('modal.style.display')) {
                    if (nextLine.includes("'block'")) {
                        testName = 'should show modal when showDailyReview is called'
                    } else if (nextLine.includes("'none'")) {
                        testName = 'should hide modal when closeDailyReview is called'
                    }
                }
                break
            }
        }

        fixedLines.push(line.replace("test('.*', (_) => {", `test('${testName}', () => {`))
    } else if (line.includes('test(') && line.includes('=>')) {
        // Already has proper test name or different pattern
        fixedLines.push(line)
    } else {
        fixedLines.push(line)
    }
}

content = fixedLines.join('\n')

// Write the fixed content back
fs.writeFileSync(filePath, content)
console.log(
    `Fixed ${describeCount} describe blocks and ${testCount} test blocks in daily-review.test.ts`
)
