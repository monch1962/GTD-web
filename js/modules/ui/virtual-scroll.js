/**
 * Virtual scrolling manager for large lists
 * Renders only visible items + buffer for optimal performance
 */

import { VirtualScrollConfig } from '../../constants.js';

export class VirtualScrollManager {
    constructor(container, options = {}) {
        this.container = container;
        this.itemHeight = options.itemHeight || VirtualScrollConfig.ITEM_HEIGHT;
        this.bufferItems = options.bufferItems || VirtualScrollConfig.BUFFER_ITEMS;
        this.renderItem = options.renderItem || ((item) => item);

        // Scroll state
        this.scrollTop = 0;
        this.viewportHeight = container.clientHeight;

        // Items
        this.items = [];
        this.totalItems = 0;
        this.totalHeight = 0;

        // DOM elements
        this.spacerTop = null;
        this.spacerBottom = null;
        this.viewport = null;

        // State
        this.isDragging = false;

        this._init();
    }

    /**
     * Initialize virtual scroll structure
     * @private
     */
    _init() {
        // Clear container
        this.container.innerHTML = '';

        // Create virtual scroll structure
        this.spacerTop = this._createSpacer();
        this.spacerBottom = this._createSpacer();
        this.viewport = this._createViewport();

        this.container.appendChild(this.spacerTop);
        this.container.appendChild(this.viewport);
        this.container.appendChild(this.spacerBottom);

        // Throttled scroll handler (60fps)
        this.handleScroll = this._throttle(() => this._updateViewport(), VirtualScrollConfig.THROTTLE_DELAY);
        this.container.addEventListener('scroll', this.handleScroll);

        // Handle resize
        this.handleResize = this._debounce(() => {
            this.viewportHeight = this.container.clientHeight;
            this._updateViewport();
        }, VirtualScrollConfig.DEBOUNCE_DELAY);
        window.addEventListener('resize', this.handleResize);
    }

    /**
     * Create a spacer element
     * @private
     * @returns {HTMLElement} Spacer div
     */
    _createSpacer() {
        const div = document.createElement('div');
        div.style.height = '0px';
        div.style.pointerEvents = 'none';
        div.style.position = 'relative';
        return div;
    }

    /**
     * Create the viewport element
     * @private
     * @returns {HTMLElement} Viewport div
     */
    _createViewport() {
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.width = '100%';
        div.style.minHeight = `${this.viewportHeight}px`;
        return div;
    }

    /**
     * Set items to be virtualized
     * @param {Array} items - Array of data items
     * @param {Function} renderItem - Function to render single item
     */
    setItems(items, renderItem) {
        this.items = items;
        this.totalItems = items.length;
        this.renderItem = renderItem;
        this.totalHeight = this.totalItems * this.itemHeight;

        this._updateViewport();
    }

    /**
     * Update viewport based on scroll position
     * @private
     */
    _updateViewport() {
        if (this.isDragging) {
            // Render all items during drag for smooth drag-and-drop
            this._renderAll();
            return;
        }

        this.scrollTop = this.container.scrollTop;

        // Calculate visible range
        const startIndex = Math.max(0,
            Math.floor(this.scrollTop / this.itemHeight) - this.bufferItems
        );
        const endIndex = Math.min(
            this.totalItems,
            Math.ceil((this.scrollTop + this.viewportHeight) / this.itemHeight) + this.bufferItems
        );

        // Update spacers to maintain scroll height
        this.spacerTop.style.height = `${startIndex * this.itemHeight}px`;
        this.spacerBottom.style.height = `${(this.totalItems - endIndex) * this.itemHeight}px`;

        // Render visible items
        this._renderRange(startIndex, endIndex);

        // Announce to screen readers
        this._announceVisibleRange(startIndex, endIndex);
    }

    /**
     * Render a range of items
     * @private
     * @param {number} startIndex - Start index
     * @param {number} endIndex - End index
     */
    _renderRange(startIndex, endIndex) {
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        for (let i = startIndex; i < endIndex; i++) {
            const item = this.items[i];
            const element = this.renderItem(item, i);

            if (element) {
                element.style.position = 'absolute';
                element.style.top = `${i * this.itemHeight}px`;
                element.style.left = '0';
                element.style.right = '0';
                element.style.width = '100%';
                element.style.boxSizing = 'border-box';
                element.dataset.index = i;

                fragment.appendChild(element);
            }
        }

        this.viewport.innerHTML = '';
        this.viewport.appendChild(fragment);
    }

    /**
     * Render all items (for drag-and-drop mode)
     * @private
     */
    _renderAll() {
        this.spacerTop.style.height = '0px';
        this.spacerBottom.style.height = '0px';
        this._renderRange(0, this.totalItems);
    }

    /**
     * Scroll to specific item
     * @param {number} index - Item index
     * @param {boolean} smooth - Use smooth scrolling
     */
    scrollToItem(index, smooth = true) {
        if (index < 0 || index >= this.totalItems) {
            console.warn(`Invalid index: ${index}`);
            return;
        }

        const targetScroll = index * this.itemHeight;
        this.container.scrollTo({
            top: targetScroll,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    /**
     * Get currently visible item indices
     * @returns {Object} Object with start and end indices
     */
    getVisibleRange() {
        return {
            start: Math.floor(this.scrollTop / this.itemHeight),
            end: Math.ceil((this.scrollTop + this.viewportHeight) / this.itemHeight)
        };
    }

    /**
     * Enable/disable drag mode (renders all items when dragging)
     * @param {boolean} isDragging - Drag mode state
     */
    setDragging(isDragging) {
        this.isDragging = isDragging;
        this._updateViewport();
    }

    /**
     * Get item at scroll position
     * @param {number} scrollTop - Scroll position
     * @returns {number} Item index
     */
    getItemAtPosition(scrollTop) {
        return Math.floor(scrollTop / this.itemHeight);
    }

    /**
     * Refresh viewport (call after data changes)
     */
    refresh() {
        this.totalHeight = this.totalItems * this.itemHeight;
        this._updateViewport();
    }

    /**
     * Update item height (recalculate layout)
     * @param {number} newItemHeight - New item height in pixels
     */
    updateItemHeight(newItemHeight) {
        this.itemHeight = newItemHeight;
        this.refresh();
    }

    /**
     * Announce visible range for accessibility
     * @private
     * @param {number} start - Start index
     * @param {number} end - End index
     */
    _announceVisibleRange(start, end) {
        const announcer = document.getElementById('a11y-announcer');
        if (announcer) {
            announcer.textContent = `Showing ${start + 1} to ${Math.min(end, this.totalItems)} of ${this.totalItems}`;
        }
    }

    /**
     * Throttle utility function
     * @private
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} Throttled function
     */
    _throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Debounce utility function
     * @private
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in ms
     * @returns {Function} Debounced function
     */
    _debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Cleanup event listeners and DOM
     */
    destroy() {
        this.container.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        this.container.innerHTML = '';
    }
}
