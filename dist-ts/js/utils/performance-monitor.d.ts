/**
 * Performance monitoring module
 * Tracks and reports application performance metrics
 */
interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime: number | null;
    duration: number | null;
}
interface PerformanceObserver {
    (metric: PerformanceMetric): void;
}
export declare class PerformanceMonitor {
    private metrics;
    private observers;
    private isEnabled;
    constructor();
    /**
     * Start measuring an operation
     * @param operationName - Name of the operation to measure
     * @returns Operation ID
     */
    startMeasure(operationName: string): string | null;
    /**
     * End measuring an operation
     * @param operationId - Operation ID from startMeasure
     * @returns Duration in milliseconds
     */
    endMeasure(operationId: string): number;
    /**
     * Measure an async operation
     * @param operationName - Name of the operation
     * @param operation - Async function to measure
     * @returns Result of the operation
     */
    measureAsync<T>(operationName: string, operation: () => Promise<T>): Promise<T>;
    /**
     * Measure a synchronous operation
     * @param operationName - Name of the operation
     * @param operation - Function to measure
     * @returns Result of the operation
     */
    measureSync<T>(operationName: string, operation: () => T): T;
    /**
     * Add an observer for performance metrics
     * @param observer - Callback function
     */
    addObserver(observer: PerformanceObserver): void;
    /**
     * Remove an observer
     * @param observer - Callback function to remove
     */
    removeObserver(observer: PerformanceObserver): void;
    /**
     * Notify all observers of a new metric
     */
    private notifyObservers;
    /**
     * Get all recorded metrics
     * @returns Array of metrics
     */
    getMetrics(): PerformanceMetric[];
    /**
     * Get metrics for a specific operation
     * @param operationName - Name of the operation
     * @returns Array of metrics for that operation
     */
    getMetricsForOperation(operationName: string): PerformanceMetric[];
    /**
     * Get average duration for an operation
     * @param operationName - Name of the operation
     * @returns Average duration in milliseconds
     */
    getAverageDuration(operationName: string): number;
    /**
     * Get slowest operation
     * @returns Slowest metric or null
     */
    getSlowestOperation(): PerformanceMetric | null;
    /**
     * Clear all metrics
     */
    clearMetrics(): void;
    /**
     * Generate performance report
     * @returns Performance report object
     */
    generateReport(): Record<string, any>;
    /**
     * Enable or disable monitoring
     * @param enabled - Whether monitoring is enabled
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if monitoring is enabled
     * @returns Whether monitoring is enabled
     */
    isMonitoringEnabled(): boolean;
}
export declare const performanceMonitor: PerformanceMonitor;
export {};
//# sourceMappingURL=performance-monitor.d.ts.map