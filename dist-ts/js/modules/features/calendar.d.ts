/**
 * Calendar module
 * Handles calendar view for task visualization
 */
import type { Task } from '../../models';
interface State {
    tasks: Task[];
}
interface App {
    calendarDate: Date;
    showNotification?: (message: string, type?: string) => void;
    showInfo?: (message: string) => void;
    navigateCalendar?: (direction: number) => void;
    showTasksForDate?: (year: number, month: number, day: number) => void;
    openTaskModal?: (task: Task) => void;
    tasks?: Task[];
    saveTasks?: () => Promise<void>;
    renderView?: () => void;
}
export declare class CalendarManager {
    private state;
    private app;
    constructor(state: State, app: App);
    get calendarDate(): Date;
    /**
     * Setup calendar view functionality
     */
    setupCalendarView(): void;
    /**
     * Show calendar modal
     */
    showCalendar(): void;
    /**
     * Close calendar modal
     */
    closeCalendar(): void;
    /**
     * Render calendar view
     */
    renderCalendar(): void;
    /**
     * Navigate between months
     * @param direction - Direction to navigate (-1 for previous, 1 for next)
     */
    navigateCalendar(direction: number): void;
    /**
     * Get tasks for a specific month
     * @param year - Year
     * @param month - Month (0-11)
     * @returns HTML string of tasks
     */
    getTasksForMonth(year: number, month: number): string;
    /**
     * Show tasks for a specific date
     * @param year - Year
     * @param month - Month (0-11)
     * @param day - Day of month
     */
    showTasksForDate(year: number, month: number, day: number): void;
    /**
     * Get current calendar date
     * @returns Current calendar date
     */
    getCalendarDate(): Date;
    /**
     * Set calendar date
     * @param date - Date to set
     */
    setCalendarDate(date: Date): void;
    /**
     * Go to today in calendar
     */
    goToToday(): void;
}
export {};
//# sourceMappingURL=calendar.d.ts.map