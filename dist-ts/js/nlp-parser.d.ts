/**
 * Natural Language Parser for Task Entry
 * Parses natural language input to extract task properties
 */
interface ParsedTaskData {
    title: string;
    contexts: string[];
    energy: string;
    time: number;
    recurrence: string;
    dueDate: string | null;
    priority: boolean;
}
export declare class TaskParser {
    private contextPattern;
    private energyPattern;
    private timePattern;
    private recurrencePattern;
    private priorityPattern;
    private datePatterns;
    constructor();
    /**
     * Parse natural language input and extract task properties
     * @param input - Raw user input
     * @returns Parsed task data
     */
    parse(input: string): ParsedTaskData;
    /**
     * Extract contexts from input
     */
    extractContexts(input: string): string[];
    /**
     * Extract energy level from input
     */
    extractEnergy(input: string): string;
    /**
     * Extract time estimate from input
     */
    extractTime(input: string): number;
    /**
     * Extract recurrence from input
     */
    extractRecurrence(input: string): string;
    /**
     * Extract priority/urgency flag
     */
    extractPriority(input: string): boolean;
    /**
     * Extract due date from input
     */
    extractDueDate(input: string): string | null;
    /**
     * Get the next occurrence of a weekday
     */
    getNextWeekday(weekday: string, daysOffset: number): string;
    /**
     * Remove parsed contexts from title
     */
    removeFromTitle(title: string, contexts: string[], pattern: RegExp): string;
    /**
     * Remove pattern match from title
     */
    removeFromTitleByPattern(title: string, pattern: RegExp, textToRemove: string): string;
    /**
     * Remove date strings from title
     */
    titleWithoutDates(title: string): string;
    /**
     * Clean up the final title
     */
    cleanTitle(title: string): string;
    /**
     * Format date as YYYY-MM-DD
     */
    formatDate(date: Date): string;
    /**
     * Get parsing examples for help text
     */
    static getExamples(): string[];
}
export {};
//# sourceMappingURL=nlp-parser.d.ts.map