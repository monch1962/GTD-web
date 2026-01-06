# GTD-Web Refactoring Guide

This document provides guidance on refactoring GTD-web to use the new utility functions and reduce code duplication.

## Overview of New Utilities

### 1. Enhanced DOM Utilities (`js/dom-utils.js`)

#### Modal Utilities
```javascript
// OLD:
const modal = document.getElementById('task-modal');
modal.classList.add('active');

// NEW:
import { openModal, closeModal, toggleModal } from './dom-utils.js';
openModal('task-modal', 'Edit Task');
closeModal('task-modal');
```

#### Form Utilities
```javascript
// OLD:
const form = document.getElementById('task-form');
const formData = new FormData(form);
const data = {};
for (const [key, value] of formData.entries()) {
    data[key] = value;
}

// NEW:
import { getFormData, resetForm, showFieldError, clearFormErrors } from './dom-utils.js';
const data = getFormData(form);
resetForm(form);
showFieldError('task-title', 'Title is required');
```

#### Date Utilities
```javascript
// OLD:
const today = new Date();
today.setHours(0, 0, 0, 0);
const checkDate = new Date(dateString);
const diff = Math.ceil((checkDate - today) / (1000 * 60 * 60 * 24));

// NEW:
import { formatDate, isToday, getDaysDiff } from './dom-utils.js';
const formatted = formatDate(new Date());
const isTodayDate = isToday(dateString);
const daysDiff = getDaysDiff(date1, date2);
```

### 2. Extended Constants (`js/constants.js`)

#### Pomodoro Configuration
```javascript
// OLD:
this.pomodoroTimeLeft = 25 * 60;
this.pomodoroBreakTime = 5 * 60;

// NEW:
import { PomodoroConfig } from './constants.js';
this.pomodoroTimeLeft = PomodoroConfig.WORK_DURATION;
this.pomodoroBreakTime = PomodoroConfig.BREAK_DURATION;
```

#### Time Thresholds
```javascript
// OLD:
if (daysSinceCreated > 30) { score += 7; }
else if (daysSinceCreated > 14) { score += 5; }

// NEW:
import { TimeThresholds } from './constants.js';
if (daysSinceCreated > TimeThresholds.TASK_AGING_PENALTY_DAYS) { score += 7; }
else if (daysSinceCreated > TimeThresholds.TASK_AGING_HIGH_DAYS) { score += 5; }
```

#### Priority Weights
```javascript
// OLD:
if (isOverdue) score += 25;
if (starred) score += 15;
if (status === 'next') score += 10;

// NEW:
import { PriorityWeights } from './constants.js';
if (isOverdue) score += PriorityWeights.OVERDUE_BONUS;
if (starred) score += PriorityWeights.STARRED_BONUS;
if (status === 'next') score += PriorityWeights.NEXT_ACTION_BONUS;
```

#### Toast Messages
```javascript
// OLD:
this.showToast(`${count} tasks completed`);
this.showToast('Task updated');

// NEW:
import { ToastMessages } from './constants.js';
this.showToast(ToastMessages.Task.completed(count));
this.showToast(ToastMessages.Task.updated());
```

### 3. HTML Template Helpers (`js/template-helpers.js`)

#### Task Rendering
```javascript
// OLD (repeated 100+ lines of HTML building):
div.innerHTML = `
    <div class="task-item ${task.completed ? 'completed' : ''}">
        <div class="task-drag-handle"><i class="fas fa-grip-vertical"></i></div>
        ...
    </div>
`;

// NEW:
import { TaskTemplates } from './template-helpers.js';
div.innerHTML = TaskTemplates.createTaskItem(task, { showPriority: true });
```

#### Modal Creation
```javascript
// OLD:
const modalHTML = `
    <div id="new-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Title</h2>
                <button class="close-button">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    </div>
`;

// NEW:
import { ModalTemplates } from './template-helpers.js';
const modalHTML = ModalTemplates.createModal('new-modal', 'Title', content);
```

#### Statistics Cards
```javascript
// OLD:
html += `
    <div class="stat-card">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
    </div>
`;

// NEW:
import { StatisticsTemplates } from './template-helpers.js';
html += StatisticsTemplates.createStatCard({ value, label, icon, color });
```

## Refactoring Priority List

### High Priority (Do First)

1. **Replace Magic Numbers with Constants**
   - Search app.js for: `25 * 60`, `30`, `90`, `300`, etc.
   - Replace with corresponding constants from `constants.js`
   - Example: `25 * 60` → `PomodoroConfig.WORK_DURATION`

2. **Use Modal Utilities**
   - Find all instances of: `document.getElementById('...').classList.add('active')`
   - Replace with: `openModal('modal-id')`
   - Estimated: 40+ instances throughout the code

3. **Use Toast Message Templates**
   - Find all instances of: `this.showToast('...')` with string concatenation
   - Replace with: `this.showToast(ToastMessages.Task.completed(count))`
   - Estimated: 50+ instances

### Medium Priority

4. **Refactor Date Calculations**
   - Find all date arithmetic: `date.setDate(date.getDate() - X)`
   - Replace with: `getDaysDiff(date1, date2)`
   - Improves code readability and reduces bugs

5. **Use Form Utilities**
   - Find all form data extraction: `new FormData(form)`
   - Replace with: `getFormData(form)`
   - Add form validation helpers

6. **Use Template Helpers**
   - Identify repeated HTML generation patterns
   - Replace with template helper functions
   - Focus on: task cards, project cards, statistics

### Low Priority (Nice to Have)

7. **Extract Long Functions**
   - `renderDashboard()` - Break into smaller sub-functions
   - `renderTask()` - Simplify using template helpers
   - `setup*()` methods - Consolidate repeated patterns

8. **Consolidate Event Listeners**
   - Use `setupModalListeners()` for all modals
   - Create utility for bulk event listener setup

9. **Standardize Naming**
   - Ensure all IDs use kebab-case
   - Ensure all JS uses camelCase
   - Add ElementIds constants for all DOM elements

## Refactoring Checklist

- [ ] Replace Pomodoro magic numbers (25 * 60, 5 * 60)
- [ ] Replace time threshold magic numbers (30, 90, etc.)
- [ ] Replace priority score magic numbers
- [ ] Use `openModal()` / `closeModal()` for all modals
- [ ] Use `ToastMessages` templates for all toasts
- [ ] Use `formatDate()` for all date formatting
- [ ] Use `getDaysDiff()` for date calculations
- [ ] Use `getFormData()` for form handling
- [ ] Use `TaskTemplates.createTaskItem()` for task rendering
- [ ] Use `ProjectTemplates.createProjectCard()` for projects
- [ ] Extract 3+ long functions into smaller helpers
- [ ] Add JSDoc comments to utility functions
- [ ] Test all refactored code

## Code Examples

### Example 1: Refactoring Modal Setup

**Before:**
```javascript
setupHelpModal() {
    const modal = document.getElementById('help-modal');
    const closeBtn = document.getElementById('close-help-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
}
```

**After:**
```javascript
setupHelpModal() {
    setupModalListeners('help-modal', ['close-help-modal']);
}
```

### Example 2: Refactoring Toast Messages

**Before:**
```javascript
if (tasksToArchive.length > 0) {
    this.showToast(`Archived ${tasksToArchive.length} tasks`);
}
```

**After:**
```javascript
import { ToastMessages } from './constants.js';

if (tasksToArchive.length > 0) {
    this.showToast(ToastMessages.Task.archived(tasksToArchive.length));
}
```

### Example 3: Refactoring Priority Scoring

**Before:**
```javascript
calculatePriorityScore(task) {
    let score = 50;
    if (task.dueDate) {
        const daysUntilDue = this.getDaysUntilDue(task);
        if (daysUntilDue < 0) {
            score += 25;
        } else if (daysUntilDue === 0) {
            score += 20;
        }
    }
    if (task.starred) {
        score += 15;
    }
    // ... more hardcoded values
    return score;
}
```

**After:**
```javascript
import { PriorityWeights, PriorityThresholds, PriorityColors } from './constants.js';

calculatePriorityScore(task) {
    let score = PriorityWeights.BASE_SCORE;

    if (task.dueDate) {
        const daysUntilDue = this.getDaysUntilDue(task);
        if (daysUntilDue < 0) {
            score += PriorityWeights.OVERDUE_BONUS;
        } else if (daysUntilDue === 0) {
            score += PriorityWeights.DUE_TODAY_BONUS;
        }
    }

    if (task.starred) {
        score += PriorityWeights.STARRED_BONUS;
    }

    // ... more calculations using constants
    return Math.max(0, Math.min(100, score));
}
```

### Example 4: Refactoring Date Utilities

**Before:**
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
const dueDate = new Date(task.dueDate);
const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
```

**After:**
```javascript
import { getDaysDiff } from './dom-utils.js';
const daysDiff = getDaysDiff(new Date(), task.dueDate);
```

## Testing Refactored Code

After refactoring any section, test the following:

1. **Modal Operations**: Open, close, escape key, outside click
2. **Form Operations**: Create, edit, validate, submit
3. **Task Operations**: Create, edit, delete, complete
4. **Toast Messages**: Verify all toast messages appear correctly
5. **Priority Scoring**: Verify scores are calculated correctly
6. **Date Operations**: Verify date calculations are accurate

## Benefits of Refactoring

1. **Maintainability**: Centralized constants make updates easier
2. **Readability**: Descriptive function names instead of repeated code
3. **Testability**: Small, focused utilities are easier to test
4. **Consistency**: Standardized patterns across the codebase
5. **Reduced Bugs**: Less duplicate code means fewer places for bugs to hide
6. **Easier Onboarding**: Clear patterns help new developers understand code

## Migration Strategy

1. **Phase 1**: Add utilities (✅ Completed)
   - dom-utils.js enhancements
   - constants.js additions
   - template-helpers.js creation

2. **Phase 2**: Refactor high-priority items
   - Replace magic numbers with constants
   - Use modal utilities
   - Use toast message templates

3. **Phase 3**: Refactor medium-priority items
   - Use date utilities
   - Use form utilities
   - Use template helpers for HTML generation

4. **Phase 4**: Break down long functions
   - Extract sub-functions
   - Improve code organization
   - Add comprehensive JSDoc comments

5. **Phase 5**: Polish and optimize
   - Performance improvements
   - Additional utilities as needed
   - Code style consistency

## Resources

- **dom-utils.js**: DOM manipulation, modal handling, forms, dates, validation
- **constants.js**: All configuration, thresholds, weights, templates
- **template-helpers.js**: HTML template generators for common UI elements
- **Original Analysis**: See agent output from commit ab4e130 for detailed findings

## Next Steps

1. Review this guide
2. Start with high-priority items
3. Test thoroughly after each change
4. Commit changes with descriptive messages
5. Update this guide as new patterns emerge
