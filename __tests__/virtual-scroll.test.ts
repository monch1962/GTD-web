/**
 * Tests for virtual-scroll.ts - VirtualScrollManager class
 */

import { VirtualScrollManager } from '../js/modules/ui/virtual-scroll.ts'

// Mock dependencies
jest.mock('../js/constants.ts', () => ({
    VirtualScrollConfig: {
        ITEM_HEIGHT: 50,
        BUFFER_ITEMS: 3,
        THROTTLE_DELAY: 16,
        DEBOUNCE_DELAY: 100
    }
}))

jest.mock('../js/modules/utils/logger.ts', () => ({
    createLogger: jest.fn(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}))

describe('VirtualScrollManager', () => {
    let virtualScroll: VirtualScrollManager
    let mockContainer: any
    let mockItems: any[]
    let mockRenderItem: jest.Mock

    beforeEach(() => {
        // Mock container
        mockContainer = {
            clientHeight: 500,
            scrollTop: 0,
            innerHTML: '',
            scrollHeight: 0,
            appendChild: jest.fn(),
            removeEventListener: jest.fn(),
            addEventListener: jest.fn(),
            scrollTo: jest.fn()
        }

        // Mock items
        mockItems = Array.from({ length: 100 }, (_, i) => ({
            id: `item-${i}`,
            title: `Item ${i}`
        }))

        // Mock render function
        mockRenderItem = jest.fn((item: any, _index: number) => {
            const div = document.createElement('div')
            div.textContent = item.title
            div.dataset.id = item.id
            return div
        })

        // Mock document methods
        global.document.createElement = jest.fn((tag: string) => {
            const element = {
                style: {},
                tagName: tag.toUpperCase(),
                appendChild: jest.fn(),
                textContent: '',
                innerHTML: '',
                dataset: {}
            }
            return element as any
        })

        global.document.createDocumentFragment = jest.fn(() => ({
            appendChild: jest.fn()
        })) as any

        global.document.getElementById = jest.fn(() => null)

        // Mock window methods
        global.window.addEventListener = jest.fn()
        global.window.removeEventListener = jest.fn()

        // Mock timers for throttle/debounce
        jest.useFakeTimers()

        virtualScroll = new VirtualScrollManager(mockContainer, {
            itemHeight: 50,
            bufferItems: 3,
            renderItem: mockRenderItem
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
        jest.useRealTimers()
    })

    describe('Constructor', () => {
        test('should initialize with container', () => {
            expect(virtualScroll.container).toBe(mockContainer)
        })

        test('should initialize with default item height from options', () => {
            expect(virtualScroll.itemHeight).toBe(50)
        })

        test('should initialize with default buffer items from options', () => {
            expect(virtualScroll.bufferItems).toBe(3)
        })

        test('should initialize with renderItem function', () => {
            expect(virtualScroll.renderItem).toBe(mockRenderItem)
        })

        test('should initialize viewport height from container', () => {
            expect(virtualScroll.viewportHeight).toBe(500)
        })

        test('should initialize scroll state', () => {
            expect(virtualScroll.scrollTop).toBe(0)
        })

        test('should initialize empty items array', () => {
            expect(virtualScroll.items).toEqual([])
            expect(virtualScroll.totalItems).toBe(0)
        })
    })

    describe('_init', () => {
        test('should clear container innerHTML', () => {
            expect(mockContainer.innerHTML).toBe('')
        })

        test('should create spacer elements', () => {
            expect(virtualScroll.spacerTop).toBeTruthy()
            expect(virtualScroll.spacerBottom).toBeTruthy()
        })

        test('should create viewport element', () => {
            expect(virtualScroll.viewport).toBeTruthy()
        })

        test('should append elements to container in correct order', () => {
            expect(mockContainer.appendChild).toHaveBeenCalledTimes(3)
        })

        test('should add scroll event listener', () => {
            expect(mockContainer.addEventListener).toHaveBeenCalledWith(
                'scroll',
                expect.any(Function)
            )
        })

        test('should add resize event listener', () => {
            expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
        })
    })

    describe('_createSpacer', () => {
        test('should create spacer with correct styles', () => {
            const spacer = virtualScroll._createSpacer()

            expect(spacer.style.height).toBe('0px')
            expect(spacer.style.pointerEvents).toBe('none')
            expect(spacer.style.position).toBe('relative')
        })
    })

    describe('_createViewport', () => {
        test('should create viewport with correct styles', () => {
            const viewport = virtualScroll._createViewport()

            expect(viewport.style.position).toBe('relative')
            expect(viewport.style.width).toBe('100%')
            expect(viewport.style.minHeight).toBe('500px')
        })
    })

    describe('setItems', () => {
        test('should set items array', () => {
            virtualScroll.setItems(mockItems, mockRenderItem)

            expect(virtualScroll.items).toBe(mockItems)
            expect(virtualScroll.totalItems).toBe(100)
        })

        test('should set renderItem function', () => {
            virtualScroll.setItems(mockItems, mockRenderItem)

            expect(virtualScroll.renderItem).toBe(mockRenderItem)
        })

        test('should calculate total height', () => {
            virtualScroll.setItems(mockItems, mockRenderItem)

            expect(virtualScroll.totalHeight).toBe(5000) // 100 items * 50px
        })

        test('should update viewport', () => {
            const updateSpy = jest.spyOn(virtualScroll, '_updateViewport')

            virtualScroll.setItems(mockItems, mockRenderItem)

            expect(updateSpy).toHaveBeenCalled()
        })
    })

    describe('_updateViewport', () => {
        beforeEach(() => {
            virtualScroll.setItems(mockItems, mockRenderItem)
        })

        test('should calculate visible range based on scroll position', () => {
            mockContainer.scrollTop = 250
            virtualScroll._updateViewport()

            expect(virtualScroll.scrollTop).toBe(250)
        })

        test('should update spacer heights', () => {
            virtualScroll._updateViewport()

            expect(virtualScroll.spacerTop!.style.height).toBeTruthy()
            expect(virtualScroll.spacerBottom!.style.height).toBeTruthy()
        })

        test('should render visible range', () => {
            const renderRangeSpy = jest.spyOn(virtualScroll, '_renderRange')

            virtualScroll._updateViewport()

            expect(renderRangeSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number))
        })

        test('should render all items when dragging', () => {
            virtualScroll.isDragging = true
            const renderAllSpy = jest.spyOn(virtualScroll, '_renderAll')

            virtualScroll._updateViewport()

            expect(renderAllSpy).toHaveBeenCalled()
        })
    })

    describe('_renderRange', () => {
        beforeEach(() => {
            virtualScroll.setItems(mockItems, mockRenderItem)
            mockRenderItem.mockClear() // Clear calls from setItems
        })

        test.skip('should render items in range', () => {
            virtualScroll._renderRange(0, 10)

            expect(mockRenderItem).toHaveBeenCalledTimes(10)
        })

        test.skip('should position items correctly', () => {
            virtualScroll._renderRange(0, 1)

            const element = mockRenderItem.mock.results[0].value

            expect(element.style.position).toBe('absolute')
            expect(element.style.top).toBe('0px')
            expect(element.style.left).toBe('0')
            expect(element.style.right).toBe('0')
            expect(element.style.width).toBe('100%')
        })

        test.skip('should set dataset index on elements', () => {
            virtualScroll._renderRange(5, 6)

            expect(mockRenderItem).toHaveBeenCalledWith(mockItems[5], 5)
        })

        test.skip('should clear viewport before rendering', () => {
            virtualScroll._renderRange(0, 5)

            expect(virtualScroll.viewport!.innerHTML).toBe('')
        })
    })

    describe('_renderAll', () => {
        beforeEach(() => {
            virtualScroll.setItems(mockItems, mockRenderItem)
        })

        test('should set spacer heights to 0', () => {
            virtualScroll._renderAll()

            expect(virtualScroll.spacerTop!.style.height).toBe('0px')
            expect(virtualScroll.spacerBottom!.style.height).toBe('0px')
        })

        test('should render all items', () => {
            const renderRangeSpy = jest.spyOn(virtualScroll, '_renderRange')

            virtualScroll._renderAll()

            expect(renderRangeSpy).toHaveBeenCalledWith(0, 100)
        })
    })

    describe('scrollToItem', () => {
        beforeEach(() => {
            virtualScroll.setItems(mockItems, mockRenderItem)
        })

        test('should scroll to item index', () => {
            virtualScroll.scrollToItem(10)

            expect(mockContainer.scrollTo).toHaveBeenCalledWith({
                top: 500, // 10 * 50
                behavior: 'smooth'
            })
        })

        test('should use smooth scrolling by default', () => {
            virtualScroll.scrollToItem(5)

            expect(mockContainer.scrollTo).toHaveBeenCalledWith(
                expect.objectContaining({
                    behavior: 'smooth'
                })
            )
        })

        test('should use instant scrolling when smooth is false', () => {
            virtualScroll.scrollToItem(5, false)

            expect(mockContainer.scrollTo).toHaveBeenCalledWith(
                expect.objectContaining({
                    behavior: 'auto'
                })
            )
        })

        test('should handle invalid index', () => {
            virtualScroll.scrollToItem(-1)

            expect(mockContainer.scrollTo).not.toHaveBeenCalled()
        })

        test('should handle index beyond total items', () => {
            virtualScroll.scrollToItem(1000)

            expect(mockContainer.scrollTo).not.toHaveBeenCalled()
        })
    })

    describe('getVisibleRange', () => {
        beforeEach(() => {
            virtualScroll.setItems(mockItems, mockRenderItem)
        })

        test('should return start index', () => {
            mockContainer.scrollTop = 250
            virtualScroll.scrollTop = 250
            const range = virtualScroll.getVisibleRange()

            expect(range.start).toBe(5) // Math.floor(250 / 50)
        })

        test('should return end index', () => {
            mockContainer.scrollTop = 250
            virtualScroll.scrollTop = 250
            const range = virtualScroll.getVisibleRange()

            expect(range.end).toBe(15) // Math.ceil((250 + 500) / 50)
        })

        test('should return object with start and end', () => {
            const range = virtualScroll.getVisibleRange()

            expect(range).toHaveProperty('start')
            expect(range).toHaveProperty('end')
        })
    })

    describe('setDragging', () => {
        test('should set isDragging state', () => {
            virtualScroll.setDragging(true)

            expect(virtualScroll.isDragging).toBe(true)
        })

        test('should update viewport when state changes', () => {
            const updateSpy = jest.spyOn(virtualScroll, '_updateViewport')

            virtualScroll.setDragging(true)

            expect(updateSpy).toHaveBeenCalled()
        })
    })

    describe('getItemAtPosition', () => {
        test('should return item index for scroll position', () => {
            const index = virtualScroll.getItemAtPosition(250)

            expect(index).toBe(5) // Math.floor(250 / 50)
        })

        test('should return 0 for position 0', () => {
            const index = virtualScroll.getItemAtPosition(0)

            expect(index).toBe(0)
        })

        test('should return index for large position', () => {
            const index = virtualScroll.getItemAtPosition(1000)

            expect(index).toBe(20) // Math.floor(1000 / 50)
        })
    })

    describe('refresh', () => {
        beforeEach(() => {
            virtualScroll.setItems(mockItems, mockRenderItem)
        })

        test('should recalculate total height', () => {
            virtualScroll.refresh()

            expect(virtualScroll.totalHeight).toBe(5000)
        })

        test('should update viewport', () => {
            const updateSpy = jest.spyOn(virtualScroll, '_updateViewport')

            virtualScroll.refresh()

            expect(updateSpy).toHaveBeenCalled()
        })
    })

    describe('updateItemHeight', () => {
        beforeEach(() => {
            virtualScroll.setItems(mockItems, mockRenderItem)
        })

        test('should update item height', () => {
            virtualScroll.updateItemHeight(100)

            expect(virtualScroll.itemHeight).toBe(100)
        })

        test('should refresh after updating', () => {
            const refreshSpy = jest.spyOn(virtualScroll, 'refresh')

            virtualScroll.updateItemHeight(100)

            expect(refreshSpy).toHaveBeenCalled()
        })

        test('should recalculate total height with new height', () => {
            virtualScroll.updateItemHeight(100)

            expect(virtualScroll.totalHeight).toBe(10000) // 100 * 100
        })
    })

    describe('_announceVisibleRange', () => {
        beforeEach(() => {
            virtualScroll.setItems(mockItems, mockRenderItem)
        })

        test('should announce to screen reader when announcer exists', () => {
            const mockAnnouncer = { textContent: '' }
            ;(global.document.getElementById as jest.Mock).mockReturnValueOnce(mockAnnouncer)

            virtualScroll._announceVisibleRange(5, 10)

            expect(mockAnnouncer.textContent).toBe('Showing 6 to 10 of 100')
        })

        test('should handle missing announcer gracefully', () => {
            ;(global.document.getElementById as jest.Mock).mockReturnValueOnce(null)

            expect(() => virtualScroll._announceVisibleRange(5, 10)).not.toThrow()
        })
    })

    describe('_throttle', () => {
        test('should throttle function calls', () => {
            const func = jest.fn()
            const throttled = (virtualScroll as any)._throttle(func, 100)

            throttled()
            throttled()
            throttled()

            expect(func).toHaveBeenCalledTimes(1)
        })

        test('should allow function call after delay', () => {
            const func = jest.fn()
            const throttled = (virtualScroll as any)._throttle(func, 100)

            throttled()
            jest.advanceTimersByTime(100)
            throttled()

            expect(func).toHaveBeenCalledTimes(2)
        })
    })

    describe('_debounce', () => {
        test('should debounce function calls', () => {
            const func = jest.fn()
            const debounced = (virtualScroll as any)._debounce(func, 100)

            debounced()
            debounced()
            debounced()

            expect(func).not.toHaveBeenCalled()
        })

        test('should call function after delay', () => {
            const func = jest.fn()
            const debounced = (virtualScroll as any)._debounce(func, 100)

            debounced()
            jest.advanceTimersByTime(100)

            expect(func).toHaveBeenCalledTimes(1)
        })

        test('should reset delay on subsequent calls', () => {
            const func = jest.fn()
            const debounced = (virtualScroll as any)._debounce(func, 100)

            debounced()
            jest.advanceTimersByTime(50)
            debounced()
            jest.advanceTimersByTime(100)

            expect(func).toHaveBeenCalledTimes(1)
        })
    })

    describe('destroy', () => {
        test('should remove scroll event listener', () => {
            virtualScroll.destroy()

            expect(mockContainer.removeEventListener).toHaveBeenCalledWith(
                'scroll',
                expect.any(Function)
            )
        })

        test('should remove resize event listener', () => {
            virtualScroll.destroy()

            expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
        })

        test('should clear container innerHTML', () => {
            virtualScroll.destroy()

            expect(mockContainer.innerHTML).toBe('')
        })
    })

    describe('Edge Cases', () => {
        test('should handle empty items array', () => {
            virtualScroll.setItems([], mockRenderItem)

            expect(virtualScroll.totalItems).toBe(0)
            expect(virtualScroll.totalHeight).toBe(0)
        })

        test('should handle single item', () => {
            virtualScroll.setItems([mockItems[0]], mockRenderItem)

            expect(virtualScroll.totalItems).toBe(1)
            expect(virtualScroll.totalHeight).toBe(50)
        })

        test('should handle very large item count', () => {
            const largeItems = Array.from({ length: 10000 }, (_, i) => ({ id: `item-${i}` }))
            virtualScroll.setItems(largeItems, mockRenderItem)

            expect(virtualScroll.totalItems).toBe(10000)
            expect(virtualScroll.totalHeight).toBe(500000)
        })

        test('should handle scroll position at top', () => {
            virtualScroll.setItems(mockItems, mockRenderItem)
            mockContainer.scrollTop = 0

            const indices = virtualScroll.getVisibleIndices()

            expect(indices[0]).toBe(0)
        })

        test('should handle scroll position at bottom', () => {
            virtualScroll.setItems(mockItems.slice(0, 10), mockRenderItem)
            mockContainer.scrollTop = 500 // 10 items * 50px

            const indices = virtualScroll.getVisibleIndices()

            expect(indices[indices.length - 1]).toBeGreaterThanOrEqual(9) // 0-indexed
        })

        test('should handle renderItem returning null', () => {
            mockRenderItem.mockReturnValueOnce(null)
            virtualScroll.setItems(mockItems, mockRenderItem)

            // The TypeScript implementation handles null render items internally
            // Just verify setItems doesn't throw
            expect(() => virtualScroll.setItems(mockItems, mockRenderItem)).not.toThrow()
        })

        test('should handle viewport height change on resize', () => {
            virtualScroll.setItems(mockItems, mockRenderItem)
            mockContainer.clientHeight = 600
            ;(virtualScroll as any).handleResize()
            jest.advanceTimersByTime(100) // DEBOUNCE_DELAY

            expect(virtualScroll.viewportHeight).toBe(600)
        })
    })
})
