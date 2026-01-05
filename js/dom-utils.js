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
