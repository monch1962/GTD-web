'use strict'
/**
 * DOM Utilities
 * Helper functions for DOM manipulation and element creation
 */
Object.defineProperty(exports, '__esModule', { value: true })
exports.getElement = getElement
exports.setTextContent = setTextContent
exports.setInnerHTML = setInnerHTML
exports.addEventListener = addEventListener
exports.createButton = createButton
exports.createIcon = createIcon
exports.toggleClass = toggleClass
exports.hasClass = hasClass
exports.setVisible = setVisible
exports.getInputValue = getInputValue
exports.setInputValue = setInputValue
exports.escapeHtml = escapeHtml
exports.openModal = openModal
exports.closeModal = closeModal
exports.toggleModal = toggleModal
exports.setupModalListeners = setupModalListeners
exports.announce = announce
exports.getFormData = getFormData
exports.resetForm = resetForm
exports.showFieldError = showFieldError
exports.clearFormErrors = clearFormErrors
exports.groupBy = groupBy
exports.multiSort = multiSort
exports.formatDate = formatDate
exports.isToday = isToday
exports.getDaysDiff = getDaysDiff
exports.isNotEmpty = isNotEmpty
exports.isValidEmail = isValidEmail
exports.isValidDate = isValidDate
/**
 * Safely gets an element by ID, returning null if not found
 */
function getElement(id) {
    return document.getElementById(id)
}
/**
 * Safely sets the text content of an element
 */
function setTextContent(id, text) {
    const element = getElement(id)
    if (element) {
        element.textContent = text
    }
}
/**
 * Safely sets the inner HTML of an element
 */
function setInnerHTML(id, html) {
    const element = getElement(id)
    if (element) {
        element.innerHTML = html
    }
}
/**
 * Adds an event listener to an element by ID
 */
function addEventListener(id, event, handler) {
    const element = getElement(id)
    if (element) {
        element.addEventListener(event, handler)
    }
}
/**
 * Creates a button element with standard styling
 */
function createButton(text, className, onClick) {
    const button = document.createElement('button')
    button.className = className
    button.textContent = text
    if (onClick) {
        button.addEventListener('click', onClick)
    }
    return button
}
/**
 * Creates an icon element
 */
function createIcon(iconClass) {
    const icon = document.createElement('i')
    icon.className = iconClass
    return icon
}
/**
 * Toggles a CSS class on an element
 */
function toggleClass(id, className, force) {
    const element = getElement(id)
    if (element) {
        element.classList.toggle(className, force)
    }
}
/**
 * Checks if an element has a specific class
 */
function hasClass(id, className) {
    const element = getElement(id)
    return element ? element.classList.contains(className) : false
}
/**
 * Shows or hides an element
 */
function setVisible(id, show) {
    const element = getElement(id)
    if (element) {
        element.style.display = show ? '' : 'none'
    }
}
/**
 * Gets the value of a form input
 */
function getInputValue(id) {
    const element = getElement(id)
    return element ? element.value : ''
}
/**
 * Sets the value of a form input
 */
function setInputValue(id, value) {
    const element = getElement(id)
    if (element) {
        element.value = value
    }
}
/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}
/**
 * Modal Utilities
 */
// Store for focus management
const focusStack = []
/**
 * Gets all focusable elements within a container
 */
function getFocusableElements(container) {
    const focusableSelectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ]
    return Array.from(container.querySelectorAll(focusableSelectors.join(', ')))
}
/**
 * Opens a modal by adding the 'active' class with focus management
 */
function openModal(modalId, title = null) {
    const modal = getElement(modalId)
    if (modal) {
        // Store the currently focused element
        focusStack.push(document.activeElement)
        modal.classList.add('active')
        if (title) {
            const titleElement = getElement(`${modalId}-title`)
            if (titleElement) titleElement.textContent = title
        }
        // Focus the first focusable element in the modal
        const focusableElements = getFocusableElements(modal)
        if (focusableElements.length > 0) {
            focusableElements[0].focus()
        }
        // Set up focus trap
        modal.setAttribute('data-focus-trap', 'true')
    }
}
/**
 * Closes a modal by removing the 'active' class with focus restoration
 */
function closeModal(modalId) {
    const modal = getElement(modalId)
    if (modal) {
        modal.classList.remove('active')
        modal.removeAttribute('data-focus-trap')
        // Restore focus to the previously focused element
        const previousFocus = focusStack.pop()
        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus()
        }
    }
}
/**
 * Toggles modal visibility
 */
function toggleModal(modalId, show) {
    const modal = getElement(modalId)
    if (modal) {
        modal.classList.toggle('active', show)
    }
}
/**
 * Sets up standard modal event listeners (close button, outside click, focus trap)
 */
function setupModalListeners(modalId, closeButtons = [], onClose = null) {
    const modal = getElement(modalId)
    if (!modal) return
    // Close buttons
    closeButtons.forEach((buttonId) => {
        const button = getElement(buttonId)
        if (button) {
            button.addEventListener('click', () => {
                closeModal(modalId)
                if (onClose) onClose()
            })
        }
    })
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId)
            if (onClose) onClose()
        }
    })
    // Close on Escape key and focus trap
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return
        // Close on Escape
        if (e.key === 'Escape') {
            closeModal(modalId)
            if (onClose) onClose()
            return
        }
        // Focus trap for Tab key
        if (e.key === 'Tab') {
            const focusableElements = getFocusableElements(modal)
            if (focusableElements.length === 0) return
            const firstFocusable = focusableElements[0]
            const lastFocusable = focusableElements[focusableElements.length - 1]
            // Shift + Tab
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault()
                    lastFocusable.focus()
                }
            }
            // Tab
            else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault()
                    firstFocusable.focus()
                }
            }
        }
    })
}
/**
 * Accessibility Utilities
 */
/**
 * Announces a message to screen readers using a live region
 */
function announce(message, priority = 'polite') {
    const announcer = document.getElementById('announcer')
    if (announcer) {
        announcer.setAttribute('aria-live', priority)
        announcer.textContent = message
        // Clear after announcement to allow re-announcing same message
        setTimeout(() => {
            announcer.textContent = ''
        }, 1000)
    }
}
/**
 * Form Utilities
 */
/**
 * Gets form data as an object
 */
function getFormData(form) {
    const formData = new FormData(form)
    const data = {}
    for (const [key, value] of formData.entries()) {
        data[key] = value
    }
    return data
}
/**
 * Resets a form and clears validation states
 */
function resetForm(form) {
    if (form) {
        form.reset()
        form.querySelectorAll('.error').forEach((el) => el.remove())
    }
}
/**
 * Displays a validation error on a form field
 */
function showFieldError(fieldId, message) {
    const field = getElement(fieldId)
    if (!field) return
    // Remove existing error
    const existingError = field.parentElement?.querySelector('.error')
    if (existingError) existingError.remove()
    // Add new error
    const error = document.createElement('div')
    error.className = 'error'
    error.textContent = message
    error.style.color = 'var(--danger-color)'
    error.style.fontSize = '0.85rem'
    error.style.marginTop = '4px'
    field.parentElement?.appendChild(error)
}
/**
 * Clears errors from a form
 */
function clearFormErrors(form) {
    if (!form) return
    form.querySelectorAll('.error').forEach((el) => el.remove())
}
/**
 * Array Utilities
 */
/**
 * Groups an array by a key function
 */
function groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
        const key = keyFn(item)
        if (!groups[key]) {
            groups[key] = []
        }
        groups[key].push(item)
        return groups
    }, {})
}
/**
 * Sorts an array by multiple criteria
 */
function multiSort(array, comparators) {
    return [...array].sort((a, b) => {
        for (const comparator of comparators) {
            const result = comparator(a, b)
            if (result !== 0) return result
        }
        return 0
    })
}
/**
 * Date Utilities
 */
/**
 * Formats a date as YYYY-MM-DD
 */
function formatDate(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
/**
 * Checks if a date is today
 */
function isToday(date) {
    const today = new Date()
    const checkDate = new Date(date)
    return checkDate.toDateString() === today.toDateString()
}
/**
 * Gets days between two dates
 */
function getDaysDiff(date1, date2) {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    d1.setHours(0, 0, 0, 0)
    d2.setHours(0, 0, 0, 0)
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}
/**
 * Validation Utilities
 */
/**
 * Validates that a value is not empty
 */
function isNotEmpty(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0
    }
    return value != null && value !== ''
}
/**
 * Validates an email address
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}
/**
 * Validates a date string (YYYY-MM-DD format)
 */
function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
}
//# sourceMappingURL=dom-utils.js.map
