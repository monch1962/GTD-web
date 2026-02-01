// Vite entry point for GTD-web application
console.log('DEBUG: main.js loading...')

// Update diagnostic indicator
const updateMainJsIndicator = (msg) => {
    const indicator = document.getElementById('gtd-js-test')
    if (indicator) {
        indicator.innerHTML = `⚠️ ${msg}`
        indicator.style.background = 'cyan'
        console.log('DEBUG:', msg)
    }
}

updateMainJsIndicator('main.js loaded, importing TypeScript app...')

// Import the main TypeScript app
import './js/app.ts'
import './css/styles.css'

console.log('DEBUG: main.js imports complete')
updateMainJsIndicator('main.js: importing CSS...')
