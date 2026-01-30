/**
 * ============================================================================
 * Smart Date Suggestions Manager
 * ============================================================================
 *
 * Manages natural language date parsing for quick date entry.
 *
 * This manager handles:
 * - Setup of date input suggestions for due date and defer date fields
 * - Natural language parsing (today, tomorrow, in X days, next week, etc.)
 * - UI dropdown suggestions with clickable options
 * - Multiple date patterns: relative dates, weekdays, month boundaries
 */

import { Task, Project } from '../../models'

// Define interfaces for state and app dependencies
interface AppState {
    tasks: Task[]
    projects: Project[]
}

interface AppDependencies {
    // This module doesn't use any app methods
}

interface DateSuggestion {
    text: string
    date: string
    displayDate: string
}

export class SmartDateSuggestionsManager {
    private _unusedState: AppState
    private _unusedApp: AppDependencies

    constructor(state: AppState, app: AppDependencies) {
        this._unusedState = state // Required by pattern, not used in this module
        this._unusedApp = app // Required by pattern, not used in this module
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Setup smart date suggestions for date inputs
     */
    setupSmartDateSuggestions(): void {
        const dueDateInput = document.getElementById('task-due-date') as HTMLInputElement | null
        const deferDateInput = document.getElementById('task-defer-date') as HTMLInputElement | null

        if (dueDateInput) {
            this.setupDateInputSuggestions(dueDateInput)
        }

        if (deferDateInput) {
            this.setupDateInputSuggestions(deferDateInput)
        }
    }

    /**
     * Setup date input suggestions for a specific input element
     * @param input - Date input element
     */
    setupDateInputSuggestions(input: HTMLInputElement): void {
        // Create suggestion dropdown
        const suggestionsDiv = document.createElement('div')
        suggestionsDiv.className = 'date-suggestions'
        suggestionsDiv.style.cssText = `
            display: none;
            position: absolute;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            margin-top: 4px;
        `

        const parent = input.parentNode as HTMLElement
        parent.style.position = 'relative'
        parent.appendChild(suggestionsDiv)

        // Show suggestions on input
        input.addEventListener('input', () => {
            const value = input.value.trim()
            if (!value) {
                suggestionsDiv.style.display = 'none'
                return
            }

            const suggestions = this.parseNaturalDate(value)
            if (suggestions.length > 0) {
                suggestionsDiv.innerHTML = suggestions
                    .map(
                        (s) => `
                    <div class="date-suggestion" data-date="${s.date}" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color);">
                        <div style="font-weight: 500;">${s.text}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">${s.displayDate}</div>
                    </div>
                `
                    )
                    .join('')
                suggestionsDiv.style.display = 'block'

                // Add click handlers
                suggestionsDiv.querySelectorAll('.date-suggestion').forEach((suggestion) => {
                    suggestion.addEventListener('click', () => {
                        input.value = (suggestion as HTMLElement).dataset.date || ''
                        suggestionsDiv.style.display = 'none'
                    })
                })
            } else {
                suggestionsDiv.style.display = 'none'
            }
        })

        // Hide suggestions on blur
        input.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionsDiv.style.display = 'none'
            }, 200)
        })

        // Hide on escape
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                suggestionsDiv.style.display = 'none'
            }
        })
    }

    /**
     * Parse natural language date input
     * @param input - User input string
     * @returns - Array of date suggestion objects
     */
    parseNaturalDate(input: string): DateSuggestion[] {
        const suggestions: DateSuggestion[] = []
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // Parse input patterns
        const lowerInput = input.toLowerCase()

        // "in X days"
        const inDaysMatch = lowerInput.match(/^in\s+(\d+)\s+days?$/)
        if (inDaysMatch) {
            const days = parseInt(inDaysMatch[1])
            const targetDate = new Date(today)
            targetDate.setDate(targetDate.getDate() + days)
            suggestions.push({
                text: `In ${days} day${days > 1 ? 's' : ''}`,
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                })
            })
        }

        // "in X weeks"
        const inWeeksMatch = lowerInput.match(/^in\s+(\d+)\s+weeks?$/)
        if (inWeeksMatch) {
            const weeks = parseInt(inWeeksMatch[1])
            const targetDate = new Date(today)
            targetDate.setDate(targetDate.getDate() + weeks * 7)
            suggestions.push({
                text: `In ${weeks} week${weeks > 1 ? 's' : ''}`,
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                })
            })
        }

        // "in X months"
        const inMonthsMatch = lowerInput.match(/^in\s+(\d+)\s+months?$/)
        if (inMonthsMatch) {
            const months = parseInt(inMonthsMatch[1])
            const targetDate = new Date(today)
            targetDate.setMonth(targetDate.getMonth() + months)
            suggestions.push({
                text: `In ${months} month${months > 1 ? 's' : ''}`,
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
            })
        }

        // "tomorrow"
        if (lowerInput === 'tomorrow') {
            const targetDate = new Date(today)
            targetDate.setDate(targetDate.getDate() + 1)
            suggestions.push({
                text: 'Tomorrow',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                })
            })
        }

        // "next week" / "next monday"
        const nextWeekMatch = lowerInput.match(
            /^next\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/
        )
        if (nextWeekMatch) {
            const target = nextWeekMatch[1]
            const targetDate = new Date(today)

            if (target === 'week') {
                // Next Monday
                const daysUntilMonday = (8 - targetDate.getDay()) % 7 || 7
                targetDate.setDate(targetDate.getDate() + daysUntilMonday)
                suggestions.push({
                    text: 'Next week (Monday)',
                    date: targetDate.toISOString().split('T')[0],
                    displayDate: targetDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    })
                })
            } else {
                // Specific day
                const days = [
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday'
                ]
                const targetDay = days.indexOf(target)
                const daysUntil = (targetDay - targetDate.getDay() + 7) % 7 || 7
                targetDate.setDate(targetDate.getDate() + daysUntil)
                suggestions.push({
                    text: `Next ${target.charAt(0).toUpperCase() + target.slice(1)}`,
                    date: targetDate.toISOString().split('T')[0],
                    displayDate: targetDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    })
                })
            }
        }

        // "this week" / "this monday"
        const thisWeekMatch = lowerInput.match(
            /^this\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/
        )
        if (thisWeekMatch) {
            const target = thisWeekMatch[1]
            const targetDate = new Date(today)

            if (target === 'week') {
                suggestions.push({
                    text: 'This week',
                    date: targetDate.toISOString().split('T')[0],
                    displayDate: targetDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    })
                })
            } else {
                const days = [
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday'
                ]
                const targetDay = days.indexOf(target)
                const daysUntil = (targetDay - targetDate.getDay() + 7) % 7
                targetDate.setDate(targetDate.getDate() + daysUntil)
                suggestions.push({
                    text: `This ${target.charAt(0).toUpperCase() + target.slice(1)}`,
                    date: targetDate.toISOString().split('T')[0],
                    displayDate: targetDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    })
                })
            }
        }

        // "end of month"
        if (lowerInput === 'end of month' || lowerInput === 'eom') {
            const targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            suggestions.push({
                text: 'End of month',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                })
            })
        }

        // "end of week"
        if (lowerInput === 'end of week' || lowerInput === 'eow') {
            const targetDate = new Date(today)
            const daysUntilSunday = (7 - targetDate.getDay()) % 7
            targetDate.setDate(targetDate.getDate() + daysUntilSunday)
            suggestions.push({
                text: 'End of week (Sunday)',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                })
            })
        }

        // "start of month"
        if (lowerInput === 'start of month' || lowerInput === 'som') {
            const targetDate = new Date(today.getFullYear(), today.getMonth(), 1)
            // If today is start of month, use next month
            if (targetDate.getTime() === today.getTime()) {
                targetDate.setMonth(targetDate.getMonth() + 1)
            }
            suggestions.push({
                text: 'Start of month',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                })
            })
        }

        // "start of week"
        if (lowerInput === 'start of week' || lowerInput === 'sow') {
            const targetDate = new Date(today)
            let daysUntilMonday = (1 - targetDate.getDay() + 7) % 7
            if (daysUntilMonday === 0) daysUntilMonday = 7 // Next Monday if today is Monday
            targetDate.setDate(targetDate.getDate() + daysUntilMonday)
            suggestions.push({
                text: 'Start of week (Monday)',
                date: targetDate.toISOString().split('T')[0],
                displayDate: targetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                })
            })
        }

        return suggestions
    }
}
