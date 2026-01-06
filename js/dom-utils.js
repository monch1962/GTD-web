/**
 * DOM Utilities
 * Helper functions for DOM manipulation and element creation
 */

/**
 * Safely gets an element by ID, returning null if not found
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
export function getElement(id) {
    return document.getElementById(id);
}

/**
 * Safely sets the text content of an element
 * @param {string} id - Element ID
 * @param {string} text - Text content to set
 */
export function setTextContent(id, text) {
    const element = getElement(id);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Safely sets the inner HTML of an element
 * @param {string} id - Element ID
 * @param {string} html - HTML content to set
 */
export function setInnerHTML(id, html) {
    const element = getElement(id);
    if (element) {
        element.innerHTML = html;
    }
}

/**
 * Adds an event listener to an element by ID
 * @param {string} id - Element ID
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 */
export function addEventListener(id, event, handler) {
    const element = getElement(id);
    if (element) {
        element.addEventListener(event, handler);
    }
}

/**
 * Creates a button element with standard styling
 * @param {string} text - Button text
 * @param {string} className - CSS class name
 * @param {Function} onClick - Click handler
 * @returns {HTMLButtonElement}
 */
export function createButton(text, className, onClick) {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = text;
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    return button;
}

/**
 * Creates an icon element
 * @param {string} iconClass - Font Awesome icon class
 * @returns {HTMLElement}
 */
export function createIcon(iconClass) {
    const icon = document.createElement('i');
    icon.className = iconClass;
    return icon;
}

/**
 * Toggles a CSS class on an element
 * @param {string} id - Element ID
 * @param {string} className - Class name to toggle
 * @param {boolean} force - Force add (true) or remove (false)
 */
export function toggleClass(id, className, force) {
    const element = getElement(id);
    if (element) {
        element.classList.toggle(className, force);
    }
}

/**
 * Checks if an element has a specific class
 * @param {string} id - Element ID
 * @param {string} className - Class name to check
 * @returns {boolean}
 */
export function hasClass(id, className) {
    const element = getElement(id);
    return element ? element.classList.contains(className) : false;
}

/**
 * Shows or hides an element
 * @param {string} id - Element ID
 * @param {boolean} show - Whether to show the element
 */
export function setVisible(id, show) {
    const element = getElement(id);
    if (element) {
        element.style.display = show ? '' : 'none';
    }
}

/**
 * Gets the value of a form input
 * @param {string} id - Input element ID
 * @returns {string}
 */
export function getInputValue(id) {
    const element = getElement(id);
    return element ? element.value : '';
}

/**
 * Sets the value of a form input
 * @param {string} id - Input element ID
 * @param {string} value - Value to set
 */
export function setInputValue(id, value) {
    const element = getElement(id);
    if (element) {
        element.value = value;
    }
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string}
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Modal Utilities
 */

/**
 * Opens a modal by adding the 'active' class
 * @param {string} modalId - Modal element ID
 * @param {string} title - Optional title to set
 */
export function openModal(modalId, title = null) {
    const modal = getElement(modalId);
    if (modal) {
        modal.classList.add('active');
        if (title) {
            const titleElement = getElement(`${modalId}-title`);
            if (titleElement) titleElement.textContent = title;
        }
    }
}

/**
 * Closes a modal by removing the 'active' class
 * @param {string} modalId - Modal element ID
 */
export function closeModal(modalId) {
    const modal = getElement(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Toggles modal visibility
 * @param {string} modalId - Modal element ID
 * @param {boolean} show - Whether to show the modal
 */
export function toggleModal(modalId, show) {
    const modal = getElement(modalId);
    if (modal) {
        modal.classList.toggle('active', show);
    }
}

/**
 * Sets up standard modal event listeners (close button, outside click)
 * @param {string} modalId - Modal element ID
 * @param {string[]} closeButtons - Array of close button element IDs
 * @param {Function} onClose - Optional callback when modal closes
 */
export function setupModalListeners(modalId, closeButtons = [], onClose = null) {
    const modal = getElement(modalId);
    if (!modal) return;

    // Close buttons
    closeButtons.forEach(buttonId => {
        const button = getElement(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                closeModal(modalId);
                if (onClose) onClose();
            });
        }
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId);
            if (onClose) onClose();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal(modalId);
            if (onClose) onClose();
        }
    });
}

/**
 * Form Utilities
 */

/**
 * Gets form data as an object
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Form data as key-value pairs
 */
export function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    return data;
}

/**
 * Resets a form and clears validation states
 * @param {HTMLFormElement} form - Form element
 */
export function resetForm(form) {
    if (form) {
        form.reset();
        form.querySelectorAll('.error').forEach(el => el.remove());
    }
}

/**
 * Displays a validation error on a form field
 * @param {string} fieldId - Field element ID
 * @param {string} message - Error message
 */
export function showFieldError(fieldId, message) {
    const field = getElement(fieldId);
    if (!field) return;

    // Remove existing error
    const existingError = field.parentElement.querySelector('.error');
    if (existingError) existingError.remove();

    // Add new error
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = message;
    error.style.color = 'var(--danger-color)';
    error.style.fontSize = '0.85rem';
    error.style.marginTop = '4px';
    field.parentElement.appendChild(error);
}

/**
 * Clears errors from a form
 * @param {HTMLFormElement} form - Form element
 */
export function clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll('.error').forEach(el => el.remove());
}

/**
 * Array Utilities
 */

/**
 * Groups an array by a key function
 * @param {Array} array - Array to group
 * @param {Function} keyFn - Function to extract grouping key
 * @returns {Object} Grouped object
 */
export function groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Sorts an array by multiple criteria
 * @param {Array} array - Array to sort
 * @param {Array} comparators - Array of comparator functions
 * @returns {Array} Sorted array
 */
export function multiSort(array, comparators) {
    return [...array].sort((a, b) => {
        for (const comparator of comparators) {
            const result = comparator(a, b);
            if (result !== 0) return result;
        }
        return 0;
    });
}

/**
 * Date Utilities
 */

/**
 * Formats a date as YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Checks if a date is today
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export function isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
}

/**
 * Gets days between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Days difference
 */
export function getDaysDiff(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Validation Utilities
 */

/**
 * Validates that a value is not empty
 * @param {*} value - Value to validate
 * @returns {boolean}
 */
export function isNotEmpty(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value != null && value !== '';
}

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validates a date string (YYYY-MM-DD format)
 * @param {string} dateString - Date string to validate
 * @returns {boolean}
 */
export function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

