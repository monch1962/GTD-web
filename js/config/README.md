# Configuration Files

## Purpose

This directory contains configuration files that serve as the **single source of truth** for various UI elements in the GTD-web application, ensuring DRY (Don't Repeat Yourself) compliance.

## Header Buttons (`headerButtons.js`)

### Overview

The `headerButtons.js` file defines all header menu button configurations in one place. This includes:

- Button IDs
- Display titles
- Accessibility labels
- Icon classes
- Mobile visibility rules
- Default states

### Button Properties

Each button object contains:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique button ID (used in HTML) |
| `title` | string | Button title/tooltip text |
| `ariaLabel` | string | Accessibility label for screen readers |
| `icon` | string | Font Awesome icon class |
| `text` | string | (optional) Additional button text |
| `essentialOnMobile` | boolean | Whether button should be visible on mobile |
| `alwaysVisible` | boolean | Whether button is always visible in the header |
| `disabledByDefault` | boolean | (optional) Whether button starts disabled |
| `hiddenByDefault` | boolean | (optional) Whether button starts hidden |
| `conditionallyShown` | boolean | (optional) Whether button is shown/hidden programmatically |
| `primary` | boolean | (optional) Whether button uses primary styling |

### Mobile Visibility Rules

- **Essential on mobile** (`essentialOnMobile: true`): These buttons are always visible on mobile devices
  - Dark mode
  - Undo
  - Redo

- **Hidden on mobile** (`essentialOnMobile: false`): These buttons are hidden on mobile to save space
  - Calendar View
  - Focus Mode
  - New Project
  - Daily Review
  - Weekly Review
  - Dashboard
  - Dependencies
  - Heatmap
  - Suggestions

- **Conditionally shown**: These buttons are shown/hidden programmatically
  - Bulk Select (shown only when in bulk selection mode)

### Helper Functions

The module exports several helper functions:

- `getButtonById(id)` - Get a single button configuration by ID
- `getEssentialMobileButtons()` - Get all buttons that should be visible on mobile
- `getButtonsHiddenOnMobile()` - Get all buttons that should be hidden on mobile
- `getButtonIds()` - Get all button IDs
- `getMobileHiddenButtonIds()` - Get IDs of buttons hidden on mobile

### Usage Example

```javascript
import { headerButtons, getEssentialMobileButtons } from './js/config/headerButtons.js';

// Get all buttons
console.log(headerButtons);

// Get only mobile-essential buttons
const mobileButtons = getEssentialMobileButtons();

// Check if a button is essential on mobile
const darkModeBtn = getButtonById('btn-dark-mode');
if (darkModeBtn && darkModeBtn.essentialOnMobile) {
    // Button is visible on mobile
}
```

### Testing

Run tests with:
```bash
NODE_OPTIONS="--experimental-vm-modules" npx jest __tests__/header-buttons-dry.test.js
```

## Default Contexts (`defaultContexts.js`)

### Overview

The `defaultContexts.js` file defines all default context configurations in one place. This includes:

- Context IDs (e.g., @home, @work)
- Display names
- Descriptions
- Icon classes
- Color codes
- Categories

### Context Properties

Each context object contains:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Context identifier (starts with @) |
| `name` | string | Display name for the context |
| `description` | string | Description of when to use this context |
| `icon` | string | Font Awesome icon class |
| `color` | string | Hex color code for UI display |
| `category` | string | Category: location, equipment, activity, or general |

### Default Contexts

| ID | Name | Description | Category |
|----|------|-------------|----------|
| @home | Home | Tasks to do at home | location |
| @work | Work | Work-related tasks | location |
| @personal | Personal | Personal tasks and activities | general |
| @computer | Computer | Tasks requiring a computer | equipment |
| @phone | Phone | Phone calls and communication | equipment |
| @errand | Errand | Tasks requiring going out | activity |

### Helper Functions

The module exports several helper functions:

- `getContextIds()` - Get all context IDs
- `getContextById(id)` - Get a single context configuration by ID
- `getContextsByCategory(category)` - Get all contexts in a category
- `getDefaultContextIds()` - Get simple array of context IDs (for backward compatibility)
- `isDefaultContext(contextId)` - Check if a context is a default context
- `getCategories()` - Get all unique categories

### Usage Example

```javascript
import { defaultContexts, getContextIds, isDefaultContext } from './js/config/defaultContexts.js';

// Get all contexts
console.log(defaultContexts);

// Get all context IDs
const ids = getContextIds(); // ['@home', '@work', '@personal', '@computer', '@phone', '@errand']

// Check if a context is default
if (isDefaultContext('@home')) {
    // This is a default context
}

// Get contexts by category
const locationContexts = getContextsByCategory('location');
```

### Adding a New Default Context

When adding a new default context:

1. **Add to configuration** - Add the context definition to `defaultContexts.js`
2. **Run tests** - Ensure the DRY compliance tests pass
3. **Update UI** - The context will automatically appear in dropdowns and filters

Example:

```javascript
// In defaultContexts.js
{
    id: '@meeting',
    name: 'Meeting',
    description: 'Scheduled meetings and appointments',
    icon: 'fa-users',
    color: '#e67e22',
    category: 'activity'
}
```

### Testing

The test suite at `__tests__/default-contexts-dry.test.js` ensures:

- All contexts are defined in the config
- No hardcoded context arrays in JavaScript files
- `app.js` and `constants.js` import from config
- Helper functions work correctly
- Context IDs follow naming conventions (start with @)
- All required metadata is present
- Categories are consistent

Run tests with:
```bash
NODE_OPTIONS="--experimental-vm-modules" npx jest __tests__/default-contexts-dry.test.js
```

## Benefits

1. **Single Source of Truth**: All definitions in one place
2. **Type Safety**: Easy to see all available items and their properties
3. **DRY Compliance**: Eliminates duplicate definitions across the codebase
4. **Easy Maintenance**: Adding/removing/modifying items requires changes in only one file
5. **Consistency**: Ensures consistent properties across the application
6. **Testability**: Easy to test and validate configurations
7. **Rich Metadata**: Each item has descriptive properties (icons, colors, descriptions)
