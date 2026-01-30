/**
 * Virtual scrolling manager for large lists
 * Renders only visible items + buffer for optimal performance
 */
import { createLogger } from '../utils/logger';
interface VirtualScrollOptions {
    itemHeight?: number;
    bufferItems?: number;
    renderItem?: (item: any, index: number) => HTMLElement;
    scrollDebounce?: number;
}
export declare class VirtualScrollManager {
    container: HTMLElement;
    itemHeight: number;
    bufferItems: number;
    renderItem: (item: any, index: number) => HTMLElement;
    logger: ReturnType<typeof createLogger>;
    scrollTop: number;
    viewportHeight: number;
    items: any[];
    totalItems: number;
    totalHeight: number;
    spacerTop: HTMLElement | null;
    spacerBottom: HTMLElement | null;
    viewport: HTMLElement | null;
    isDragging: boolean;
    private handleScroll;
    private handleResize;
    private debouncedUpdate;
    constructor(container: HTMLElement, options?: VirtualScrollOptions);
    /**
     * Initialize virtual scroll structure
     * @private
     */
    private _init;
    /**
     * Create spacer element
     * @private
     * @returns Spacer element
     */
    private _createSpacer;
    /**
     * Create viewport element
     * @private
     * @returns Viewport element
     */
    private _createViewport;
    /**
     * Set items to render
     * @param items - Array of items
     * @param renderFn - Optional render function
     */
    setItems(items: any[], renderFn?: (item: any, index: number) => HTMLElement): void;
    /**
     * Update spacer heights
     * @private
     */
    private _updateSpacers;
    /**
     * Update visible items based on scroll position
     * @private
     */
    private _updateVisibleItems;
    /**
     * Handle scroll event
     * @private
     */
    private _onScroll;
    /**
     * Handle resize event
     * @private
     */
    private _onResize;
    /**
     * Scroll to specific item
     * @param index - Item index to scroll to
     */
    scrollToItem(index: number): void;
    /**
     * Get visible item indices
     * @returns Array of visible item indices
     */
    getVisibleIndices(): number[];
    /**
     * Get item at position
     * @param y - Y position relative to container
     * @returns Item index or -1 if not found
     */
    getItemAtPosition(y: number): number;
    /**
     * Debounce function
     * @private
     * @param func - Function to debounce
     * @param delay - Debounce delay in ms
     * @returns Debounced function
     */
    private _debounce;
    /**
     * Cleanup event listeners and DOM
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=virtual-scroll.d.ts.map