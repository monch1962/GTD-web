// Mock dom-utils for testing
export const escapeHtml = (str) => str
export const getElement = (id) => null
export const setTextContent = (el, text) => {
    if (el) el.textContent = text
}
export const announce = () => {}
