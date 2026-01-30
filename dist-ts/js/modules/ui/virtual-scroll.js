'use strict'
/**
 * Virtual scrolling manager for large lists
 * Renders only visible items + buffer for optimal performance
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.VirtualScrollManager = void 0
const constants_1 = require('../../constants')
const logger_1 = require('../utils/logger')
class VirtualScrollManager {
    constructor(container, options = {}) {
        this.container = container
        this.itemHeight = options.itemHeight || constants_1.VirtualScrollConfig.ITEM_HEIGHT
        this.bufferItems = options.bufferItems || constants_1.VirtualScrollConfig.BUFFER_ITEMS
        this.renderItem = options.renderItem || ((item) => item)
        this.logger = (0, logger_1.createLogger)('VirtualScroll')
        // Scroll state
        this.scrollTop = 0
        this.viewportHeight = container.clientHeight
        // Items
        this.items = []
        this.totalItems = 0
        this.totalHeight = 0
        // DOM elements
        this.spacerTop = null
        this.spacerBottom = null
        this.viewport = null
        // State
        this.isDragging = false
        // Bind event handlers
        this.handleScroll = this._onScroll.bind(this)
        this.handleResize = this._onResize.bind(this)
        this.debouncedUpdate = this._debounce(
            this._updateVisibleItems.bind(this),
            options.scrollDebounce || 16
        )
        this._init()
    }
    /**
     * Initialize virtual scroll structure
     * @private
     */
    _init() {
        // Clear container
        this.container.innerHTML = ''
        // Create virtual scroll structure
        this.spacerTop = this._createSpacer()
        this.spacerBottom = this._createSpacer()
        this.viewport = this._createViewport()
        this.container.appendChild(this.spacerTop)
        this.container.appendChild(this.viewport)
        this.container.appendChild(this.spacerBottom)
        // Add event listeners
        this.container.addEventListener('scroll', this.handleScroll)
        window.addEventListener('resize', this.handleResize)
        // Initial render
        this._updateVisibleItems()
    }
    /**
     * Create spacer element
     * @private
     * @returns Spacer element
     */
    _createSpacer() {
        const spacer = document.createElement('div')
        spacer.className = 'virtual-scroll-spacer'
        return spacer
    }
    /**
     * Create viewport element
     * @private
     * @returns Viewport element
     */
    _createViewport() {
        const viewport = document.createElement('div')
        viewport.className = 'virtual-scroll-viewport'
        return viewport
    }
    /**
     * Set items to render
     * @param items - Array of items
     * @param renderFn - Optional render function
     */
    setItems(items, renderFn) {
        this.items = items
        this.totalItems = items.length
        this.totalHeight = this.totalItems * this.itemHeight
        if (renderFn) {
            this.renderItem = renderFn
        }
        // Update spacers
        this._updateSpacers()
        // Update visible items
        this._updateVisibleItems()
    }
    /**
     * Update spacer heights
     * @private
     */
    _updateSpacers() {
        if (!this.spacerTop || !this.spacerBottom) return
        // Top spacer represents items before visible range
        // Bottom spacer represents items after visible range
        // Actual heights will be calculated in _updateVisibleItems
        this.spacerTop.style.height = '0px'
        this.spacerBottom.style.height = '0px'
    }
    /**
     * Update visible items based on scroll position
     * @private
     */
    _updateVisibleItems() {
        if (!this.viewport || !this.spacerTop || !this.spacerBottom) return
        // Calculate visible range
        const startIndex = Math.max(
            0,
            Math.floor(this.scrollTop / this.itemHeight) - this.bufferItems
        )
        const endIndex = Math.min(
            this.totalItems - 1,
            Math.floor((this.scrollTop + this.viewportHeight) / this.itemHeight) + this.bufferItems
        )
        // Calculate spacer heights
        const topSpacerHeight = startIndex * this.itemHeight
        const bottomSpacerHeight = Math.max(0, this.totalHeight - (endIndex + 1) * this.itemHeight)
        // Update spacers
        this.spacerTop.style.height = `${topSpacerHeight}px`
        this.spacerBottom.style.height = `${bottomSpacerHeight}px`
        // Clear viewport
        this.viewport.innerHTML = ''
        // Render visible items
        if (startIndex <= endIndex) {
            const fragment = document.createDocumentFragment()
            for (let i = startIndex; i <= endIndex; i++) {
                const item = this.items[i]
                if (item) {
                    const element = this.renderItem(item, i)
                    if (element) {
                        fragment.appendChild(element)
                    }
                }
            }
            this.viewport.appendChild(fragment)
        }
        // Log performance info in development
        if (process.env.NODE_ENV === 'development') {
            const visibleCount = Math.max(0, endIndex - startIndex + 1)
            this.logger.debug(`Rendering ${visibleCount} of ${this.totalItems} items`)
        }
    }
    /**
     * Handle scroll event
     * @private
     */
    _onScroll() {
        this.scrollTop = this.container.scrollTop
        this.debouncedUpdate()
    }
    /**
     * Handle resize event
     * @private
     */
    _onResize() {
        this.viewportHeight = this.container.clientHeight
        this._updateVisibleItems()
    }
    /**
     * Scroll to specific item
     * @param index - Item index to scroll to
     */
    scrollToItem(index) {
        if (index < 0 || index >= this.totalItems) return
        const targetScrollTop = index * this.itemHeight
        this.container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        })
    }
    /**
     * Get visible item indices
     * @returns Array of visible item indices
     */
    getVisibleIndices() {
        const startIndex = Math.max(
            0,
            Math.floor(this.scrollTop / this.itemHeight) - this.bufferItems
        )
        const endIndex = Math.min(
            this.totalItems - 1,
            Math.floor((this.scrollTop + this.viewportHeight) / this.itemHeight) + this.bufferItems
        )
        const indices = []
        for (let i = startIndex; i <= endIndex; i++) {
            indices.push(i)
        }
        return indices
    }
    /**
     * Get item at position
     * @param y - Y position relative to container
     * @returns Item index or -1 if not found
     */
    getItemAtPosition(y) {
        const absoluteY = this.scrollTop + y
        return Math.floor(absoluteY / this.itemHeight)
    }
    /**
     * Debounce function
     * @private
     * @param func - Function to debounce
     * @param delay - Debounce delay in ms
     * @returns Debounced function
     */
    _debounce(func, delay) {
        let timeoutId
        return function (...args) {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => func.apply(this, args), delay)
        }
    }
    /**
     * Cleanup event listeners and DOM
     */
    destroy() {
        this.container.removeEventListener('scroll', this.handleScroll)
        window.removeEventListener('resize', this.handleResize)
        this.container.innerHTML = ''
    }
}
exports.VirtualScrollManager = VirtualScrollManager
//# sourceMappingURL=virtual-scroll.js.map
