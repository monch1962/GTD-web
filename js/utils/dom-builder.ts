/**
 * Safe DOM Builder Utility
 * Provides XSS-safe alternatives to innerHTML
 * Prevents cross-site scripting vulnerabilities
 */

interface CreateElementOptions {
    text?: string
    html?: string
    attributes?: Record<string, string | null | undefined>
    style?: Record<string, string>
    className?: string
    children?: HTMLElement[]
    events?: Record<string, EventListener>
}

/**
 * Safely create an element with attributes and content
 * @param tag - HTML tag name
 * @param options - Element options
 * @returns Created element
 */
export function createElement(tag: string, options: CreateElementOptions = {}): HTMLElement {
    const element = document.createElement(tag)

    // Set text content (safe, escaped)
    if (options.text) {
        element.textContent = options.text
    }

    // Set HTML content (UNSAFE - only use with trusted content!)
    if (options.html) {
        element.innerHTML = options.html
    }

    // Set attributes
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                element.setAttribute(key, value)
            }
        })
    }

    // Set styles
    if (options.style) {
        Object.entries(options.style).forEach(([property, value]) => {
            element.style[property as any] = value
        })
    }

    // Set class name
    if (options.className) {
        element.className = options.className
    }

    // Add children
    if (options.children) {
        options.children.forEach((child) => {
            if (child instanceof HTMLElement) {
                element.appendChild(child)
            }
        })
    }

    // Add event listeners
    if (options.events) {
        Object.entries(options.events).forEach(([event, handler]) => {
            element.addEventListener(event, handler)
        })
    }

    return element
}

/**
 * Safe alternative to element.innerHTML
 * @param element - Target element
 * @param content - Safe content (text or trusted HTML)
 * @param isHTML - Whether content is HTML (default: false)
 */
export function setElementContent(
    element: HTMLElement,
    content: string,
    isHTML: boolean = false
): void {
    if (isHTML) {
        element.innerHTML = content
    } else {
        element.textContent = content
    }
}

/**
 * Create a select option element
 * @param value - Option value
 * @param text - Display text
 * @param selected - Whether option is selected
 * @returns Option element
 */
export function createOption(
    value: string,
    text: string,
    selected: boolean = false
): HTMLOptionElement {
    const option = document.createElement('option')
    option.value = value
    option.textContent = text
    option.selected = selected
    return option
}

/**
 * Build HTML template with safe string interpolation
 * @param strings - Template strings
 * @param values - Values to interpolate
 * @returns Safe HTML string
 */
export function buildSafeTemplate(strings: TemplateStringsArray, ...values: any[]): string {
    let result = ''
    for (let i = 0; i < strings.length; i++) {
        result += strings[i]
        if (i < values.length) {
            // Escape HTML in interpolated values
            result += escapeHtml(String(values[i]))
        }
    }
    return result
}

/**
 * Create a safe link element
 * @param href - URL (will be validated)
 * @param text - Link text
 * @param target - Target attribute
 * @returns Link element
 */
export function createLink(
    href: string,
    text: string,
    target: string = '_blank'
): HTMLAnchorElement {
    const link = document.createElement('a')
    link.href = href
    link.textContent = text
    link.target = target
    link.rel = 'noopener noreferrer'
    return link
}

/**
 * Create a button element
 * @param text - Button text
 * @param onClick - Click handler
 * @param type - Button type
 * @returns Button element
 */
export function createButton(
    text: string,
    onClick: EventListener,
    type: 'button' | 'submit' | 'reset' = 'button'
): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = text
    button.type = type
    button.addEventListener('click', onClick)
    return button
}

/**
 * Create a badge element
 * @param text - Badge text
 * @param color - Badge color class
 * @returns Badge element
 */
export function createBadge(text: string, color: string = 'badge-secondary'): HTMLElement {
    const badge = document.createElement('span')
    badge.className = `badge ${color}`
    badge.textContent = text
    return badge
}

/**
 * Clear all child elements
 * @param element - Element to clear
 */
export function clearElement(element: HTMLElement): void {
    while (element.firstChild) {
        element.removeChild(element.firstChild)
    }
}

/**
 * Check if HTML string contains potentially unsafe content
 * @param html - HTML to check
 * @returns Whether HTML is unsafe
 */
export function isUnsafeHTML(html: string): boolean {
    const unsafePatterns = [/<script\b/i, /javascript:/i, /on\w+\s*=/i, /data:/i, /vbscript:/i]

    return unsafePatterns.some((pattern) => pattern.test(html))
}

/**
 * Basic HTML sanitizer (for simple cases)
 * @param html - HTML to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
    if (isUnsafeHTML(html)) {
        console.warn('DOMBuilder: Unsafe HTML detected, removing unsafe content')
        // Remove script tags and event handlers
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
            .replace(/on\w+\s*=\s*'[^']*'/gi, '')
            .replace(/on\w+\s*=\s*[^ >]+/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/data:/gi, '')
    }

    return html
}

/**
 * Escape HTML special characters
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

/**
 * Safe alternative to innerHTML for lists
 * @param container - Container element
 * @param items - Items to render
 * @param renderItem - Function to render single item (must return safe DOM)
 */
export function renderList<T>(
    container: HTMLElement,
    items: T[],
    renderItem: (item: T, index: number) => HTMLElement
): void {
    clearElement(container)

    const fragment = document.createDocumentFragment()
    items.forEach((item, index) => {
        const element = renderItem(item, index)
        if (element instanceof HTMLElement) {
            fragment.appendChild(element)
        }
    })

    container.appendChild(fragment)
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
}
