/**
 * Performance monitoring module
 * Tracks and reports application performance metrics
 */

export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Set();
        this.isEnabled = process.env.NODE_ENV !== 'production';
    }

    /**
     * Start measuring an operation
     * @param {string} operationName - Name of the operation to measure
     * @returns {string} Operation ID
     */
    startMeasure(operationName) {
        if (!this.isEnabled) return null;

        const operationId = `${operationName}_${Date.now()}`;
        const startTime = performance.now();

        this.metrics.set(operationId, {
            name: operationName,
            startTime,
            endTime: null,
            duration: null
        });

        return operationId;
    }

    /**
     * End measuring an operation
     * @param {string} operationId - Operation ID from startMeasure
     * @returns {number} Duration in milliseconds
     */
    endMeasure(operationId) {
        if (!this.isEnabled || !this.metrics.has(operationId)) return 0;

        const metric = this.metrics.get(operationId);
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;

        // Log if slow operation (> 100ms)
        if (metric.duration > 100) {
            console.warn(`⚠️  Slow operation: ${metric.name} took ${metric.duration.toFixed(2)}ms`);
        }

        // Notify observers
        this.observers.forEach(observer => {
            observer(metric);
        });

        return metric.duration;
    }

    /**
     * Measure a function execution time
     * @param {string} operationName - Name for the operation
     * @param {Function} fn - Function to measure
     * @returns {*} Result of the function
     */
    async measure(operationName, fn) {
        const operationId = this.startMeasure(operationName);

        try {
            const result = await fn();
            return result;
        } finally {
            if (operationId) {
                this.endMeasure(operationId);
            }
        }
    }

    /**
     * Mark a performance timestamp
     * @param {string} markName - Name of the mark
     */
    mark(markName) {
        if (!this.isEnabled) return;

        performance.mark(`${markName}_start`);
    }

    /**
     * Measure time between marks
     * @param {string} markName - Name of the measure
     * @returns {number} Duration in milliseconds
     */
    measure(markName) {
        if (!this.isEnabled) return 0;

        performance.mark(`${markName}_end`);
        performance.measure(markName, `${markName}_start`, `${markName}_end`);

        const entries = performance.getEntriesByName(markName);
        const measure = entries[entries.length - 1];

        return measure ? measure.duration : 0;
    }

    /**
     * Log performance metrics for an operation
     * @param {string} operationName - Operation name
     * @param {Object} data - Additional data to log
     */
    logMetric(operationName, data = {}) {
        if (!this.isEnabled) return;

        console.log(`📊 Performance Metric: ${operationName}`, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get performance report
     * @returns {Object} Performance summary
     */
    getReport() {
        if (!this.isEnabled) return {};

        const navigationTiming = performance.getEntriesByType('navigation')[0];

        return {
            // Page load metrics
            pageLoad: navigationTiming ? {
                domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart,
                loadComplete: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
                domInteractive: navigationTiming.domInteractive - navigationTiming.fetchStart
            } : null,

            // Resource timing
            resources: performance.getEntriesByType('resource').length,

            // Custom metrics
            customMetrics: Array.from(this.metrics.values())
                .filter(m => m.duration !== null)
                .map(m => ({
                    name: m.name,
                    duration: m.duration.toFixed(2) + 'ms'
                }))
        };
    }

    /**
     * Log memory usage
     */
    logMemoryUsage() {
        if (!this.isEnabled || !performance.memory) return;

        const memory = performance.memory;
        const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
        const totalMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
        const percentage = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1);

        console.log(`💾 Memory Usage: ${usedMB}MB / ${totalMB}MB (${percentage}%)`);

        // Warn if using > 80% of available memory
        if (parseFloat(percentage) > 80) {
            console.warn('⚠️  High memory usage detected');
        }
    }

    /**
     * Log FPS (frames per second)
     * @param {number} fps - Current FPS
     */
    logFPS(fps) {
        if (!this.isEnabled) return;

        const status = fps >= 55 ? '✅ Excellent' : fps >= 30 ? '✅ Good' : '⚠️  Poor';
        console.log(`🎯 FPS: ${fps.toFixed(1)} - ${status}`);
    }

    /**
     * Add performance observer
     * @param {Function} observer - Observer function
     */
    addObserver(observer) {
        if (typeof observer === 'function') {
            this.observers.add(observer);
        }
    }

    /**
     * Remove performance observer
     * @param {Function} observer - Observer function to remove
     */
    removeObserver(observer) {
        this.observers.delete(observer);
    }

    /**
     * Enable performance monitoring
     */
    enable() {
        this.isEnabled = true;
        console.log('📊 Performance monitoring enabled');
    }

    /**
     * Disable performance monitoring
     */
    disable() {
        this.isEnabled = false;
        console.log('📊 Performance monitoring disabled');
    }

    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics.clear();
        performance.clearMarks();
        performance.clearMeasures();
    }

    /**
     * Get browser performance hints
     * @returns {Object} Performance hints
     */
    getPerformanceHints() {
        const hints = [];

        // Check for long tasks
        const longTasks = performance.getEntriesByType('longtask');
        if (longTasks.length > 0) {
            hints.push({
                type: 'warning',
                message: `${longTasks.length} long tasks detected (blocking main thread)`
            });
        }

        // Check memory
        if (performance.memory) {
            const memoryPercentage = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
            if (memoryPercentage > 80) {
                hints.push({
                    type: 'warning',
                    message: `High memory usage: ${memoryPercentage.toFixed(1)}%`
                });
            }
        }

        // Check render timing
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(e => e.name === 'first-paint');
        const firstContentfulPaint = paintEntries.find(e => e.name === 'first-contentful-paint');

        if (firstPaint && firstPaint.startTime > 2000) {
            hints.push({
                type: 'warning',
                message: `Slow first paint: ${firstPaint.startTime.toFixed(0)}ms`
            });
        }

        if (firstContentfulPaint && firstContentfulPaint.startTime > 3000) {
            hints.push({
                type: 'warning',
                message: `Slow first contentful paint: ${firstContentfulPaint.startTime.toFixed(0)}ms`
            });
        }

        return hints;
    }

    /**
     * Log performance hints to console
     */
    logPerformanceHints() {
        const hints = this.getPerformanceHints();

        if (hints.length === 0) {
            console.log('✅ No performance issues detected');
        } else {
            console.log('⚠️  Performance Hints:');
            hints.forEach((hint, i) => {
                console.log(`   ${i + 1}. ${hint.message}`);
            });
        }
    }

    /**
     * Monitor render performance
     * @param {string} viewName - Name of the view being rendered
     */
    monitorRender(viewName) {
        this.mark(`${viewName}-render`);

        // Automatically log when render completes (call this after render)
        return () => {
            const duration = this.measure(`${viewName}-render`);
            this.logMetric('viewRender', {
                view: viewName,
                duration: duration.toFixed(2) + 'ms'
            });

            // Warn if render is slow
            if (duration > 100) {
                console.warn(`⚠️  Slow render: ${viewName} took ${duration.toFixed(2)}ms`);
            }
        };
    }

    /**
     * Create a performance observer for Long Tasks API
     */
    observeLongTasks() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                console.warn(`⚠️  Long Task detected: ${entry.duration.toFixed(2)}ms`);
            }
        });

        try {
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // longtask might not be supported in all browsers
            console.warn('Long task observation not available');
        }
    }

    /**
     * Log a summary of all collected metrics
     */
    logSummary() {
        if (!this.isEnabled) return;

        console.log('\n📊 Performance Summary');
        console.log('=====================\n');

        const report = this.getReport();

        if (report.pageLoad) {
            console.log('⏱️  Page Load Times:');
            console.log(`   DOM Content Loaded: ${report.pageLoad.domContentLoaded.toFixed(0)}ms`);
            console.log(`   Load Complete: ${report.pageLoad.loadComplete.toFixed(0)}ms`);
            console.log(`   DOM Interactive: ${report.pageLoad.domInteractive.toFixed(0)}ms`);
            console.log('');
        }

        if (report.customMetrics.length > 0) {
            console.log('📈 Custom Metrics:');
            report.customMetrics.forEach(metric => {
                console.log(`   ${metric.name}: ${metric.duration}`);
            });
            console.log('');
        }

        this.logPerformanceHints();
        this.logMemoryUsage();

        console.log('=====================\n');
    }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator to measure function performance
 * @param {string} operationName - Name for the operation
 * @returns {Function} Decorator function
 */
export function measurePerformance(operationName) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args) {
            const operationId = performanceMonitor.startMeasure(operationName);
            try {
                const result = await originalMethod.apply(this, args);
                return result;
            } finally {
                if (operationId) {
                    performanceMonitor.endMeasure(operationId);
                }
            }
        };

        return descriptor;
    };
}

/**
 * Utility function to measure async function
 * @param {string} operationName - Name for the operation
 * @param {Function} fn - Function to measure
 * @returns {Promise} Result of the function
 */
export async function measureAsync(operationName, fn) {
    return performanceMonitor.measure(operationName, fn);
}

export default performanceMonitor;
