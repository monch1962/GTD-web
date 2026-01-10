/**
 * Test: Advanced recurrence functionality
 */

import fs from 'fs'
import path from 'path'

describe('Advanced Recurrence', () => {
    const modelsPath = path.resolve(process.cwd(), 'js', 'models.js')
    const modelsContent = fs.readFileSync(modelsPath, 'utf-8')

    const appJsPath = path.resolve(process.cwd(), 'js', 'app.js')
    const appJsContent = fs.readFileSync(appJsPath, 'utf-8')

    const constantsPath = path.resolve(process.cwd(), 'js', 'constants.js')
    const constantsContent = fs.readFileSync(constantsPath, 'utf-8')

    test('should have weekday constants defined', () => {
        expect(constantsContent).toContain('Weekday')
        expect(constantsContent).toContain('MONDAY: 1')
        expect(constantsContent).toContain('SUNDAY: 7')
    })

    test('should have weekday names defined', () => {
        expect(constantsContent).toContain('WeekdayNames')
        expect(constantsContent).toContain("1: 'Monday'")
        expect(constantsContent).toContain("7: 'Sunday'")
    })

    test('should have nth weekday labels defined', () => {
        expect(constantsContent).toContain('NthWeekdayLabels')
        expect(constantsContent).toContain("1: '1st'")
        expect(constantsContent).toContain("3: '3rd'")
        expect(constantsContent).toContain("5: '5th'")
    })

    test('Task model should support both old and new recurrence formats', () => {
        expect(modelsContent).toContain('Support both old string format and new object format')
        expect(modelsContent).toMatch(/Old: 'daily', 'weekly'/)
        expect(modelsContent).toMatch(/New: { type: 'weekly'/)
    })

    test('isRecurring should handle both formats', () => {
        expect(modelsContent).toContain('isRecurring()')
        expect(modelsContent).toContain("typeof this.recurrence === 'string'")
        expect(modelsContent).toContain("typeof this.recurrence === 'object'")
    })

    test('should have getRecurrenceType method', () => {
        expect(modelsContent).toContain('getRecurrenceType()')
    })

    test('should have getNextOccurrenceDateAdvanced method', () => {
        expect(modelsContent).toContain('getNextOccurrenceDateAdvanced(')
        expect(modelsContent).toContain('daysOfWeek')
        expect(modelsContent).toContain('dayOfMonth')
        expect(modelsContent).toContain('nthWeekday')
        expect(modelsContent).toContain('dayOfYear')
    })

    test('should handle weekly recurrence with specific days', () => {
        expect(modelsContent).toMatch(/case 'weekly':.*daysOfWeek.*Array\.isArray/s)
        expect(modelsContent).toContain('daysOfWeek')
    })

    test('should handle monthly recurrence with day of month', () => {
        expect(modelsContent).toMatch(/case 'monthly':.*dayOfMonth/s)
    })

    test('should handle monthly recurrence with nth weekday', () => {
        expect(modelsContent).toMatch(/case 'monthly':.*nthWeekday/s)
        expect(modelsContent).toContain('firstWeekdayOfMonth')
        expect(modelsContent).toContain('dayOffset')
    })

    test('should handle yearly recurrence with specific day', () => {
        expect(modelsContent).toMatch(/case 'yearly':.*dayOfYear/s)
        expect(modelsContent).toMatch(/month, day\] = dayOfYear\.split/s)
    })

    test('should have getDaysInMonth helper method', () => {
        expect(modelsContent).toContain('getDaysInMonth(')
    })

    test('should maintain backward compatibility with old recurrence format', () => {
        expect(modelsContent).toMatch(/Handle old string format.*backward compatibility/s)
        expect(modelsContent).toMatch(/switch \(this\.recurrence\).*case 'daily'/s)
    })

    test('UI should have recurrence type dropdown', () => {
        const htmlPath = path.resolve(process.cwd(), 'index.html')
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

        expect(htmlContent).toContain('task-recurrence-type')
        expect(htmlContent).toContain('<option value="daily">Daily</option>')
    })

    test('UI should have weekly day checkboxes', () => {
        const htmlPath = path.resolve(process.cwd(), 'index.html')
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

        expect(htmlContent).toContain('recurrence-weekly-options')
        expect(htmlContent).toContain('recurrence-day-checkbox')
        expect(htmlContent).toMatch(/data-day="Monday"/)
    })

    test('UI should have monthly options', () => {
        const htmlPath = path.resolve(process.cwd(), 'index.html')
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

        expect(htmlContent).toContain('recurrence-monthly-options')
        expect(htmlContent).toContain('recurrence-day-of-month')
        expect(htmlContent).toContain('recurrence-nth')
        expect(htmlContent).toContain('recurrence-weekday')
    })

    test('UI should have yearly options', () => {
        const htmlPath = path.resolve(process.cwd(), 'index.html')
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

        expect(htmlContent).toContain('recurrence-yearly-options')
        expect(htmlContent).toContain('recurrence-year-month')
        expect(htmlContent).toContain('recurrence-year-day')
    })

    test('app should have buildRecurrenceFromForm method', () => {
        expect(appJsContent).toContain('buildRecurrenceFromForm()')
        expect(appJsContent).toMatch(/recurrence-day-checkbox:checked/)
    })

    test('app should have populateRecurrenceInForm method', () => {
        expect(appJsContent).toContain('populateRecurrenceInForm(')
        expect(appJsContent).toMatch(/typeof recurrence === 'string'/)
        expect(appJsContent).toContain('backward compatibility')
    })

    test('app should show/hide recurrence options based on type', () => {
        expect(appJsContent).toContain('updateRecurrenceFields')
        expect(appJsContent).toContain('weeklyOptions.style.display')
        expect(appJsContent).toContain('monthlyOptions.style.display')
        expect(appJsContent).toContain('yearlyOptions.style.display')
    })

    test('should save recurrence object from form', () => {
        expect(appJsContent).toContain('recurrence: this.buildRecurrenceFromForm()')
    })

    test('should load recurrence object into form', () => {
        expect(appJsContent).toContain('this.populateRecurrenceInForm(task.recurrence)')
    })
})
