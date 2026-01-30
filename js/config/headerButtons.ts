/**
 * Header Buttons Configuration
 * Single source of truth for all header menu button definitions
 */

export interface HeaderButton {
    id: string
    title: string
    ariaLabel: string
    icon: string
    essentialOnMobile: boolean
    alwaysVisible: boolean
}

export const headerButtons: HeaderButton[] = [
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
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-redo',
        title: 'Redo (Ctrl+Y)',
        ariaLabel: 'Redo last action',
        icon: 'fa-redo',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-bulk-select',
        title: 'Select Multiple',
        ariaLabel: 'Select multiple tasks',
        icon: 'fa-check-double',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-suggestions',
        title: 'Smart Suggestions (Ctrl+N)',
        ariaLabel: 'Show smart suggestions',
        icon: 'fa-lightbulb',
        essentialOnMobile: false,
        alwaysVisible: true
    },
    {
        id: 'btn-export',
        title: 'Export Data',
        ariaLabel: 'Export application data',
        icon: 'fa-download',
        essentialOnMobile: false,
        alwaysVisible: false
    },
    {
        id: 'btn-import',
        title: 'Import Data',
        ariaLabel: 'Import application data',
        icon: 'fa-upload',
        essentialOnMobile: false,
        alwaysVisible: false
    },
    {
        id: 'btn-settings',
        title: 'Settings',
        ariaLabel: 'Open settings',
        icon: 'fa-cog',
        essentialOnMobile: true,
        alwaysVisible: true
    },
    {
        id: 'btn-help',
        title: 'Help',
        ariaLabel: 'Open help',
        icon: 'fa-question-circle',
        essentialOnMobile: false,
        alwaysVisible: false
    }
]
