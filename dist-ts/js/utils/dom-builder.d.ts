/**
 * Safe DOM Builder Utility
 * Provides XSS-safe alternatives to innerHTML
 * Prevents cross-site scripting vulnerabilities
 */
interface CreateElementOptions {
    text?: string;
    html?: string;
    attributes?: Record<string, string | null | undefined>;
    style?: Record<string, string>;
    className?: string;
    children?: HTMLElement[];
    events?: Record<string, EventListener>;
}
/**
 * Safely create an element with attributes and content
 * @param tag - HTML tag name
 * @param options - Element options
 * @returns Created element
 */
export declare function createElement(tag: string, options?: CreateElementOptions): HTMLElement;
/**
 * Safe alternative to element.innerHTML
 * @param element - Target element
 * @param content - Safe content (text or trusted HTML)
 * @param isHTML - Whether content is HTML (default: false)
 */
export declare function setElementContent(element: HTMLElement, content: string, isHTML?: boolean): void;
/**
 * Create a select option element
 * @param value - Option value
 * @param text - Display text
 * @param selected - Whether option is selected
 * @returns Option element
 */
export declare function createOption(value: string, text: string, selected?: boolean): HTMLOptionElement;
/**
 * Build HTML template with safe string interpolation
 * @param strings - Template strings
 * @param values - Values to interpolate
 * @returns Safe HTML string
 */
export declare function buildSafeTemplate(strings: TemplateStringsArray, ...values: any[]): string;
/**
 * Create a safe link element
 * @param href - URL (will be validated)
 * @param text - Link text
 * @param target - Target attribute
 * @returns Link element
 */
export declare function createLink(href: string, text: string, target?: string): HTMLAnchorElement;
/**
 * Create a button element
 * @param text - Button text
 * @param onClick - Click handler
 * @param type - Button type
 * @returns Button element
 */
export declare function createButton(text: string, onClick: EventListener, type?: 'button' | 'submit' | 'reset'): HTMLButtonElement;
/**
 * Create a badge element
 * @param text - Badge text
 * @param color - Badge color class
 * @returns Badge element
 */
export declare function createBadge(text: string, color?: string): HTMLElement;
/**
 * Clear all child elements
 * @param element - Element to clear
 */
export declare function clearElement(element: HTMLElement): void;
/**
 * Check if HTML string contains potentially unsafe content
 * @param html - HTML to check
 * @returns Whether HTML is unsafe
 */
export declare function isUnsafeHTML(html: string): boolean;
/**
 * Basic HTML sanitizer (for simple cases)
 * @param html - HTML to sanitize
 * @returns Sanitized HTML
 */
export declare function sanitizeHTML(html: string): string;
/**
 * Safe alternative to innerHTML for lists
 * @param container - Container element
 * @param items - Items to render
 * @param renderItem - Function to render single item (must return safe DOM)
 */
export declare function renderList<T>(container: HTMLElement, items: T[], renderItem: (item: T, index: number) => HTMLElement): void;
/**
 * Export all utilities as default object
 */
declare const _default: {
    createElement: typeof createElement;
    setElementContent: typeof setElementContent;
    createOption: typeof createOption;
    buildSafeTemplate: typeof buildSafeTemplate;
    createLink: typeof createLink;
    createButton: typeof createButton;
    createBadge: typeof createBadge;
    clearElement: typeof clearElement;
    isUnsafeHTML: typeof isUnsafeHTML;
    sanitizeHTML: typeof sanitizeHTML;
    renderList: typeof renderList;
};
export default _default;
//# sourceMappingURL=dom-builder.d.ts.map