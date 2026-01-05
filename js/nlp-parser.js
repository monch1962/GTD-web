/**
 * Natural Language Parser for Task Entry
 * Parses natural language input to extract task properties
 */

export class TaskParser {
    constructor() {
        // Context pattern: @word or just "word" (common contexts)
        this.contextPattern = /@(\w+)|\b(home|work|personal|computer|phone|office|errands|shopping|calls|email)\b/gi;

        // Energy pattern
        this.energyPattern = /\b(high|medium|low)\s*energy\b/i;

        // Time estimate pattern
        this.timePattern = /(\d+)\s*(min|minutes?|hrs?|hours?|h)\b/i;

        // Recurrence pattern
        this.recurrencePattern = /\b(daily|weekly|monthly|yearly|every day|every week|every month|every year|recurring)\b/i;

        // Priority/urgency pattern
        this.priorityPattern = /\b(urgent|asap|important|priority|critical)\b/i;

        // Due date patterns
        this.datePatterns = {
            today: /\b(today)\b/i,
            tomorrow: /\b(tomorrow)\b/i,
            nextWeek: /\b(next week)\b/i,
            inDays: /in (\d+) days?/i,
            inWeeks: /in (\d+) weeks?/i,
            onDate: /on (\d{1,2}[\/\-]\d{1,2})(?:[\/\-](\d{2,4}))?/,
            weekday: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
            nextWeekday: /\b(next monday|next tuesday|next wednesday|next thursday|next friday|next saturday|next sunday)\b/i
        };
    }

    /**
     * Parse natural language input and extract task properties
     * @param {string} input - Raw user input
     * @returns {Object} - Parsed task data
     */
    parse(input) {
        const result = {
            title: input,
            contexts: [],
            energy: '',
            time: 0,
            recurrence: '',
            dueDate: null,
            priority: false
        };

        // Extract and remove each component from title
        result.contexts = this.extractContexts(input);
        result.title = this.removeFromTitle(result.title, result.contexts, this.contextPattern);

        result.energy = this.extractEnergy(result.title);
        result.title = this.removeFromTitleByPattern(result.title, this.energyPattern, result.energy);

        result.time = this.extractTime(result.title);
        result.title = this.removeFromTitleByPattern(result.title, this.timePattern, result.time + '(?:min|minutes?|hrs?|hours?|h)');

        result.recurrence = this.extractRecurrence(result.title);
        result.title = this.removeFromTitleByPattern(result.title, this.recurrencePattern, result.recurrence);

        result.priority = this.extractPriority(result.title);
        result.title = this.removeFromTitleByPattern(result.title, this.priorityPattern, '');

        result.dueDate = this.extractDueDate(result.title);
        if (result.dueDate) {
            result.title = this.titleWithoutDates(result.title);
        }

        // Clean up the title
        result.title = this.cleanTitle(result.title);

        return result;
    }

    /**
     * Extract contexts from input
     */
    extractContexts(input) {
        const contexts = [];
        const matches = input.match(this.contextPattern);

        if (matches) {
            matches.forEach(match => {
                const cleanMatch = match.trim().toLowerCase();
                // Add @ prefix if not present
                const context = cleanMatch.startsWith('@') ? cleanMatch : `@${cleanMatch}`;
                if (!contexts.includes(context)) {
                    contexts.push(context);
                }
            });
        }

        return contexts;
    }

    /**
     * Extract energy level from input
     */
    extractEnergy(input) {
        const match = input.match(this.energyPattern);
        if (match) {
            const energy = match[1].toLowerCase();
            return energy; // 'high', 'medium', or 'low'
        }
        return '';
    }

    /**
     * Extract time estimate from input
     */
    extractTime(input) {
        const match = input.match(this.timePattern);
        if (match) {
            const amount = parseInt(match[1]);
            const unit = match[2].toLowerCase();

            if (unit.startsWith('h') || unit.startsWith('hr')) {
                return amount * 60; // Convert hours to minutes
            }
            return amount; // Already in minutes
        }
        return 0;
    }

    /**
     * Extract recurrence from input
     */
    extractRecurrence(input) {
        const match = input.match(this.recurrencePattern);
        if (match) {
            const recurrence = match[1].toLowerCase();
            // Map variations to standard values
            if (recurrence.includes('day')) return 'daily';
            if (recurrence.includes('week')) return 'weekly';
            if (recurrence.includes('month')) return 'monthly';
            if (recurrence.includes('year')) return 'yearly';
        }
        return '';
    }

    /**
     * Extract priority/urgency flag
     */
    extractPriority(input) {
        return this.priorityPattern.test(input);
    }

    /**
     * Extract due date from input
     */
    extractDueDate(input) {
        // Today
        if (this.datePatterns.today.test(input)) {
            return this.formatDate(new Date());
        }

        // Tomorrow
        if (this.datePatterns.tomorrow.test(input)) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this.formatDate(tomorrow);
        }

        // Next week
        if (this.datePatterns.nextWeek.test(input)) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            return this.formatDate(nextWeek);
        }

        // In X days
        const inDaysMatch = input.match(this.datePatterns.inDays);
        if (inDaysMatch) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + parseInt(inDaysMatch[1]));
            return this.formatDate(futureDate);
        }

        // In X weeks
        const inWeeksMatch = input.match(this.datePatterns.inWeeks);
        if (inWeeksMatch) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + (parseInt(inWeeksMatch[1]) * 7));
            return this.formatDate(futureDate);
        }

        // Specific date (MM/DD or MM-DD)
        const onDateMatch = input.match(this.datePatterns.onDate);
        if (onDateMatch) {
            const today = new Date();
            const month = parseInt(onDateMatch[1]);
            const day = parseInt(onDateMatch[2]);
            const year = onDateMatch[3] ? parseInt(onDateMatch[3]) : today.getFullYear();

            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
                return this.formatDate(date);
            }
        }

        // Weekday
        const weekdayMatch = input.match(this.datePatterns.weekday);
        if (weekdayMatch) {
            return this.getNextWeekday(weekdayMatch[1], 0);
        }

        // Next weekday
        const nextWeekdayMatch = input.match(this.datePatterns.nextWeekday);
        if (nextWeekdayMatch) {
            const weekday = nextWeekdayMatch[1].replace('next ', '').trim();
            return this.getNextWeekday(weekday, 7);
        }

        return null;
    }

    /**
     * Get the next occurrence of a weekday
     */
    getNextWeekday(weekday, daysOffset) {
        const weekdays = {
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 0
        };

        const targetDay = weekdays[weekday.toLowerCase()];
        const today = new Date();
        const currentDay = today.getDay();

        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) {
            daysUntil += 7;
        }

        const targetDate = new Date();
        targetDate.setDate(today.getDate() + daysUntil + daysOffset);
        return this.formatDate(targetDate);
    }

    /**
     * Remove parsed contexts from title
     */
    removeFromTitle(title, contexts, pattern) {
        let cleanTitle = title;
        contexts.forEach(context => {
            // Remove with or without @
            cleanTitle = cleanTitle.replace(new RegExp(context.replace('@', ''), 'gi'), '');
            cleanTitle = cleanTitle.replace(new RegExp(context, 'gi'), '');
        });
        return cleanTitle;
    }

    /**
     * Remove pattern match from title
     */
    removeFromTitleByPattern(title, pattern, textToRemove) {
        if (!textToRemove && !pattern) return title;
        return title.replace(pattern, '').trim();
    }

    /**
     * Remove date strings from title
     */
    titleWithoutDates(title) {
        let cleanTitle = title;

        // Remove all date patterns
        Object.values(this.datePatterns).forEach(pattern => {
            cleanTitle = cleanTitle.replace(pattern, '');
        });

        return cleanTitle.trim();
    }

    /**
     * Clean up the final title
     */
    cleanTitle(title) {
        return title
            .replace(/\s+/g, ' ')  // Collapse multiple spaces
            .replace(/\s*[,-:]+\s*$/g, '')  // Remove trailing punctuation
            .trim();  // Remove leading/trailing spaces
    }

    /**
     * Format date as YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Get parsing examples for help text
     */
    static getExamples() {
        return [
            "Call John @work tomorrow high energy",
            "Team meeting @computer weekly recurring",
            "Pay bills @home monthly due 15th",
            "Quick email check 15min low energy",
            "Gym workout @personal daily",
            "Review project @computer in 3 days",
            "Client meeting next tuesday 2hrs urgent"
        ];
    }
}
