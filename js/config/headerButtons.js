/**
 * Header Buttons Configuration
 * Single source of truth for all header menu button definitions
 */

export const headerButtons = [
    {
        id: 'btn-dark-mode',
        title: 'Toggle Dark Mode',
        ariaLabel: 'Toggle dark mode',
        icon: 'fa-moon',
        essentialOnMobile: true,
        alwaysVisible: true
    },
    {
        id: 'btn-calendar-view',
        title: 'Calendar View',
        ariaLabel: 'Open calendar view',
        icon: 'fa-calendar-alt',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-focus-mode',
        title: 'Focus Mode',
        ariaLabel: 'Enter focus mode',
        icon: 'fa-bullseye',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-new-project',
        title: 'New Project',
        ariaLabel: 'Create new project',
        icon: 'fa-folder-plus',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-daily-review',
        title: 'Daily Review',
        ariaLabel: 'Start daily review',
        icon: 'fa-sun',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-undo',
        title: 'Undo (Ctrl+Z)',
        ariaLabel: 'Undo last action',
        icon: 'fa-undo',
        essentialOnMobile: true,
        alwaysVisible: true,
        disabledByDefault: true
    },
    {
        id: 'btn-redo',
        title: 'Redo (Ctrl+Y)',
        ariaLabel: 'Redo action',
        icon: 'fa-redo',
        essentialOnMobile: true,
        alwaysVisible: true,
        disabledByDefault: true
    },
    {
        id: 'btn-weekly-review',
        title: 'Weekly Review',
        ariaLabel: 'Start weekly review',
        icon: 'fa-calendar-week',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-dashboard',
        title: 'Dashboard',
        ariaLabel: 'Open dashboard',
        icon: 'fa-chart-bar',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-dependencies',
        title: 'Task Dependencies',
        ariaLabel: 'View task dependencies',
        icon: 'fa-project-diagram',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-heatmap',
        title: 'Productivity Heatmap',
        ariaLabel: 'View productivity heatmap',
        icon: 'fa-calendar-alt',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-bulk-select',
        title: 'Select Multiple',
        ariaLabel: 'Enable bulk selection mode',
        icon: 'fa-check-square',
        text: 'Select Multiple',
        essentialOnMobile: false,
        alwaysVisible: false,
        hiddenByDefault: true,
        conditionallyShown: true // This button is shown/hidden programmatically
    },
    {
        id: 'btn-suggestions',
        title: 'What should I work on?',
        ariaLabel: 'Get smart task suggestions',
        icon: 'fa-lightbulb',
        text: 'What should I work on?',
        essentialOnMobile: false,
        alwaysVisible: true,
        primary: true
    }
]

// Helper function to get button by ID
export function getButtonById(id) {
    return headerButtons.find((btn) => btn.id === id)
}

// Helper function to get essential mobile buttons
export function getEssentialMobileButtons() {
    return headerButtons.filter((btn) => btn.essentialOnMobile)
}

// Helper function to get buttons hidden on mobile
export function getButtonsHiddenOnMobile() {
    return headerButtons.filter((btn) => !btn.essentialOnMobile)
}

// Helper function to get button IDs for CSS selectors
export function getButtonIds() {
    return headerButtons.map((btn) => btn.id)
}

// Helper function to get IDs of buttons hidden on mobile
export function getMobileHiddenButtonIds() {
    return headerButtons.filter((btn) => !btn.essentialOnMobile).map((btn) => btn.id)
}
