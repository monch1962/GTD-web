/**
 * Performance monitoring module
 * Tracks and reports application performance metrics
 */

import { PerformanceThresholds } from '../constants'

interface PerformanceMetric {
    name: string
    startTime: number
    endTime: number | null
    duration: number | null
}

interface PerformanceObserver {
    (metric: PerformanceMetric): void
}

export class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetric>
    private observers: Set<PerformanceObserver>
    private isEnabled: boolean

    constructor () {
        this.metrics = new Map()
        this.observers = new Set()
        this.isEnabled =
            typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
    }

    /**
     * Start measuring an operation
     * @param operationName - Name of the operation to measure
     * @returns Operation ID
     */
    startMeasure (operationName: string): string | null {
        if (!this.isEnabled) return null

        const operationId = `${operationName}_${Date.now()}`
        const startTime = performance.now()

        this.metrics.set(operationId, {
            name: operationName,
            startTime,
            endTime: null,
            duration: null
        })

        return operationId
    }

    /**
     * End measuring an operation
     * @param operationId - Operation ID from startMeasure
     * @returns Duration in milliseconds
     */
    endMeasure (operationId: string): number {
        if (!this.isEnabled || !this.metrics.has(operationId)) return 0

        const metric = this.metrics.get(operationId)!
        metric.endTime = performance.now()
        metric.duration = metric.endTime - metric.startTime

        // Log if slow operation (> 100ms)
        if (metric.duration > PerformanceThresholds.SLOW_OPERATION_MS) {
            console.warn(
                `Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`
            )
        }

        // Notify observers
        this.notifyObservers(metric)

        return metric.duration
    }

    /**
     * Measure an async operation
     * @param operationName - Name of the operation
     * @param operation - Async function to measure
     * @returns Result of the operation
     */
    async measureAsync<T> (operationName: string, operation: () => Promise<T>): Promise<T> {
        const operationId = this.startMeasure(operationName)
        if (!operationId) return operation()

        try {
            const result = await operation()
            this.endMeasure(operationId)
            return result
        } catch (error) {
            this.endMeasure(operationId)
            throw error
        }
    }

    /**
     * Measure a synchronous operation
     * @param operationName - Name of the operation
     * @param operation - Function to measure
     * @returns Result of the operation
     */
    measureSync<T> (operationName: string, operation: () => T): T {
        const operationId = this.startMeasure(operationName)
        if (!operationId) return operation()

        try {
            const result = operation()
            this.endMeasure(operationId)
            return result
        } catch (error) {
            this.endMeasure(operationId)
            throw error
        }
    }

    /**
     * Add an observer for performance metrics
     * @param observer - Callback function
     */
    addObserver (observer: PerformanceObserver): void {
        this.observers.add(observer)
    }

    /**
     * Remove an observer
     * @param observer - Callback function to remove
     */
    removeObserver (observer: PerformanceObserver): void {
        this.observers.delete(observer)
    }

    /**
     * Notify all observers of a new metric
     */
    private notifyObservers (metric: PerformanceMetric): void {
        this.observers.forEach((observer) => {
            try {
                observer(metric)
            } catch (error) {
                console.error('Error in performance observer:', error)
            }
        })
    }

    /**
     * Get all recorded metrics
     * @returns Array of metrics
     */
    getMetrics (): PerformanceMetric[] {
        return Array.from(this.metrics.values())
    }

    /**
     * Get metrics for a specific operation
     * @param operationName - Name of the operation
     * @returns Array of metrics for that operation
     */
    getMetricsForOperation (operationName: string): PerformanceMetric[] {
        return this.getMetrics().filter((metric) => metric.name === operationName)
    }

    /**
     * Get average duration for an operation
     * @param operationName - Name of the operation
     * @returns Average duration in milliseconds
     */
    getAverageDuration (operationName: string): number {
        const metrics = this.getMetricsForOperation(operationName)
        if (metrics.length === 0) return 0

        const total = metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0)
        return total / metrics.length
    }

    /**
     * Get slowest operation
     * @returns Slowest metric or null
     */
    getSlowestOperation (): PerformanceMetric | null {
        const metrics = this.getMetrics()
        if (metrics.length === 0) return null

        return metrics.reduce((slowest, current) => {
            const currentDuration = current.duration || 0
            const slowestDuration = slowest.duration || 0
            return currentDuration > slowestDuration ? current : slowest
        })
    }

    /**
     * Clear all metrics
     */
    clearMetrics (): void {
        this.metrics.clear()
    }

    /**
     * Generate performance report
     * @returns Performance report object
     */
    generateReport (): Record<string, any> {
        const metrics = this.getMetrics()
        const operations = new Set(metrics.map((m) => m.name))

        const report: Record<string, any> = {
            totalOperations: metrics.length,
            uniqueOperations: operations.size,
            operations: {}
        }

        operations.forEach((operationName) => {
            const operationMetrics = this.getMetricsForOperation(operationName)
            const durations = operationMetrics.map((m) => m.duration || 0)
            const average = durations.reduce((a, b) => a + b, 0) / durations.length
            const max = Math.max(...durations)
            const min = Math.min(...durations)

            report.operations[operationName] = {
                count: durations.length,
                average: average.toFixed(2),
                max: max.toFixed(2),
                min: min.toFixed(2),
                total: durations.reduce((a, b) => a + b, 0).toFixed(2)
            }
        })

        const slowest = this.getSlowestOperation()
        if (slowest) {
            report.slowestOperation = {
                name: slowest.name,
                duration: slowest.duration?.toFixed(2)
            }
        }

        return report
    }

    /**
     * Enable or disable monitoring
     * @param enabled - Whether monitoring is enabled
     */
    setEnabled (enabled: boolean): void {
        this.isEnabled = enabled
    }

    /**
     * Check if monitoring is enabled
     * @returns Whether monitoring is enabled
     */
    isMonitoringEnabled (): boolean {
        return this.isEnabled
    }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor()
