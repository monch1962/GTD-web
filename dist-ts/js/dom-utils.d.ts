/**
 * DOM Utilities
 * Helper functions for DOM manipulation and element creation
 */
/**
 * Safely gets an element by ID, returning null if not found
 */
export declare function getElement(id: string): HTMLElement | null;
/**
 * Safely sets the text content of an element
 */
export declare function setTextContent(id: string, text: string): void;
/**
 * Safely sets the inner HTML of an element
 */
export declare function setInnerHTML(id: string, html: string): void;
/**
 * Adds an event listener to an element by ID
 */
export declare function addEventListener(id: string, event: string, handler: EventListenerOrEventListenerObject): void;
/**
 * Creates a button element with standard styling
 */
export declare function createButton(text: string, className: string, onClick?: EventListenerOrEventListenerObject): HTMLButtonElement;
/**
 * Creates an icon element
 */
export declare function createIcon(iconClass: string): HTMLElement;
/**
 * Toggles a CSS class on an element
 */
export declare function toggleClass(id: string, className: string, force?: boolean): void;
/**
 * Checks if an element has a specific class
 */
export declare function hasClass(id: string, className: string): boolean;
/**
 * Shows or hides an element
 */
export declare function setVisible(id: string, show: boolean): void;
/**
 * Gets the value of a form input
 */
export declare function getInputValue(id: string): string;
/**
 * Sets the value of a form input
 */
export declare function setInputValue(id: string, value: string): void;
/**
 * Escapes HTML to prevent XSS
 */
export declare function escapeHtml(text: string): string;
/**
 * Opens a modal by adding the 'active' class with focus management
 */
export declare function openModal(modalId: string, title?: string | null): void;
/**
 * Closes a modal by removing the 'active' class with focus restoration
 */
export declare function closeModal(modalId: string): void;
/**
 * Toggles modal visibility
 */
export declare function toggleModal(modalId: string, show: boolean): void;
/**
 * Sets up standard modal event listeners (close button, outside click, focus trap)
 */
export declare function setupModalListeners(modalId: string, closeButtons?: string[], onClose?: (() => void) | null): void;
/**
 * Accessibility Utilities
 */
/**
 * Announces a message to screen readers using a live region
 */
export declare function announce(message: string, priority?: 'polite' | 'assertive'): void;
/**
 * Form Utilities
 */
/**
 * Gets form data as an object
 */
export declare function getFormData(form: HTMLFormElement): Record<string, string>;
/**
 * Resets a form and clears validation states
 */
export declare function resetForm(form: HTMLFormElement): void;
/**
 * Displays a validation error on a form field
 */
export declare function showFieldError(fieldId: string, message: string): void;
/**
 * Clears errors from a form
 */
export declare function clearFormErrors(form: HTMLFormElement): void;
/**
 * Array Utilities
 */
/**
 * Groups an array by a key function
 */
export declare function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]>;
/**
 * Sorts an array by multiple criteria
 */
export declare function multiSort<T>(array: T[], comparators: ((a: T, b: T) => number)[]): T[];
/**
 * Date Utilities
 */
/**
 * Formats a date as YYYY-MM-DD
 */
export declare function formatDate(date: Date | string): string;
/**
 * Checks if a date is today
 */
export declare function isToday(date: Date | string): boolean;
/**
 * Gets days between two dates
 */
export declare function getDaysDiff(date1: Date | string, date2: Date | string): number;
/**
 * Validation Utilities
 */
/**
 * Validates that a value is not empty
 */
export declare function isNotEmpty(value: unknown): boolean;
/**
 * Validates an email address
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validates a date string (YYYY-MM-DD format)
 */
export declare function isValidDate(dateString: string): boolean;
//# sourceMappingURL=dom-utils.d.ts.map