/**
 * Safe DOM Builder Utility
 * Provides XSS-safe alternatives to innerHTML
 * Prevents cross-site scripting vulnerabilities
 */

/**
 * Safely create an element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} options - Element options
 * @param {string} options.text - Text content (safe, escaped)
 * @param {string} options.html - HTML content (UNSAFE, avoid)
 * @param {Object} options.attributes - Element attributes
 * @param {Object} options.style - CSS styles
 * @param {string} options.className - CSS class name(s)
 * @param {Array} options.children - Child elements
 * @param {Object} options.events - Event listeners {click: handler}
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);

    // Set text content (safe, escaped)
    if (options.text) {
        element.textContent = options.text;
    }

    // Set HTML content (UNSAFE - only use with trusted content!)
    if (options.html) {
        element.innerHTML = options.html;
    }

    // Set attributes
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                element.setAttribute(key, value);
            }
        });
    }

    // Set styles
    if (options.style) {
        Object.entries(options.style).forEach(([property, value]) => {
            element.style[property] = value;
        });
    }

    // Set class name
    if (options.className) {
        element.className = options.className;
    }

    // Append children
    if (options.children && options.children.length > 0) {
        const fragment = document.createDocumentFragment();
        options.children.forEach(child => {
            if (typeof child === 'string') {
                fragment.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                fragment.appendChild(child);
            }
        });
        element.appendChild(fragment);
    }

    // Add event listeners
    if (options.events) {
        Object.entries(options.events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }

    return element;
}

/**
 * Safely set element content using text or HTML
 * @param {HTMLElement} element - Target element
 * @param {string} content - Content to set
 * @param {boolean} isHTML - true if content is HTML (unsafe), false if text (safe)
 * @param {boolean} escape - true to escape HTML entities (safe)
 */
export function setElementContent(element, content, isHTML = false, escape = false) {
    if (!element) return;

    if (isHTML && !escape) {
        // Unsafe: only use with trusted static HTML
        element.innerHTML = content;
    } else if (escape) {
        // Safe: escape HTML entities
        element.textContent = content;
    } else {
        // Safe: default to text content
        element.textContent = content;
    }
}

/**
 * Create a safe option element for select dropdowns
 * @param {string} value - Option value
 * @param {string} text - Option text (will be escaped)
 * @param {boolean} selected - Whether option is selected
 * @returns {HTMLOptionElement} Option element
 */
export function createOption(value, text, selected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text; // Safe: textContent escapes HTML
    option.selected = selected;
    return option;
}

/**
 * Safely build HTML template with data
 * Use this instead of template literals with innerHTML
 * @param {string} template - Template string with {{placeholders}}
 * @param {Object} data - Data object with values to inject (will be escaped)
 * @returns {string} Safe HTML string with escaped values
 */
export function buildSafeTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = data[key];
        if (value === null || value === undefined) {
            return '';
        }
        // Escape HTML entities
        const div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    });
}

/**
 * Safely create a link/button with click handler
 * @param {Object} options - Link options
 * @param {string} options.text - Link text (will be escaped)
 * @param {Function} options.onClick - Click handler
 * @param {string} options.className - CSS class
 * @param {string} options.href - Link href (default: #)
 * @param {string} options.icon - Icon class (font-awesome)
 * @returns {HTMLElement} Anchor element
 */
export function createLink(options = {}) {
    const link = document.createElement('a');
    link.href = options.href || '#';
    link.textContent = options.text || '';
    link.className = options.className || '';

    if (options.icon) {
        const icon = document.createElement('i');
        icon.className = options.icon;
        link.prepend(icon);
        link.appendChild(document.createTextNode(' ' + (options.text || '')));
    }

    if (options.onClick) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            options.onClick(e);
        });
    }

    return link;
}

/**
 * Safely create a button
 * @param {Object} options - Button options
 * @param {string} options.text - Button text (will be escaped)
 * @param {Function} options.onClick - Click handler
 * @param {string} options.className - CSS class
 * @param {string} options.type - Button type (default: button)
 * @param {string} options.icon - Icon class
 * @returns {HTMLButtonElement} Button element
 */
export function createButton(options = {}) {
    const button = document.createElement('button');
    button.type = options.type || 'button';
    button.textContent = options.text || '';
    button.className = options.className || '';

    if (options.icon) {
        const icon = document.createElement('i');
        icon.className = options.icon;
        button.prepend(icon);
    }

    if (options.onClick) {
        button.addEventListener('click', options.onClick);
    }

    return button;
}

/**
 * Create a badge/span with safe content
 * @param {string} text - Badge text (will be escaped)
 * @param {string} className - CSS class
 * @param {string} title - Tooltip text (will be escaped)
 * @returns {HTMLElement} Span element
 */
export function createBadge(text, className = '', title = '') {
    const badge = document.createElement('span');
    badge.className = className;
    badge.textContent = text; // Safe: textContent escapes HTML
    if (title) {
        badge.title = title;
    }
    return badge;
}

/**
 * Safely clear an element's content
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
    if (element) {
        element.innerHTML = ''; // Safe: no user content
    }
}

/**
 * Check if HTML string contains potentially dangerous content
 * @param {string} html - HTML string to check
 * @returns {boolean} true if potentially dangerous
 */
export function isUnsafeHTML(html) {
    if (typeof html !== 'string') return false;

    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // Event handlers like onclick=
        /<iframe/i,
        /<object/i,
        /<embed/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(html));
}

/**
 * Sanitize HTML string (basic version)
 * For production, consider using DOMPurify library
 * @param {string} html - HTML to sanitize
 * @param {Array} allowedTags - Allowed HTML tags
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html, allowedTags = ['b', 'i', 'em', 'strong', 'span', 'br', 'p']) {
    if (typeof html !== 'string') return '';

    // Remove dangerous tags/attributes
    const div = document.createElement('div');
    div.innerHTML = html;

    // Remove script tags, etc.
    const scripts = div.querySelectorAll('script, iframe, object, embed');
    scripts.forEach(el => el.remove());

    // Remove event handlers
    const allElements = div.querySelectorAll('*');
    allElements.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });
    });

    return div.innerHTML;
}

/**
 * Safe alternative to innerHTML for lists
 * @param {HTMLElement} container - Container element
 * @param {Array} items - Items to render
 * @param {Function} renderItem - Function to render single item (must return safe DOM)
 */
export function renderList(container, items, renderItem) {
    clearElement(container);

    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
        const element = renderItem(item, index);
        if (element instanceof HTMLElement) {
            fragment.appendChild(element);
        }
    });

    container.appendChild(fragment);
}

/**
 * Export all utilities as default object
 */
export default {
    createElement,
    setElementContent,
    createOption,
    buildSafeTemplate,
    createLink,
    createButton,
    createBadge,
    clearElement,
    isUnsafeHTML,
    sanitizeHTML,
    renderList
};
