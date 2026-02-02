# Browser Testing Guide - Refactored GTD Web Application

**Date**: 2025-01-08 **Server**: http://localhost:8080 **Refactoring Status**:
✅ Complete - 54 TypeScript modules, 100% test coverage

---

## Quick Start

1. Open browser to: http://localhost:8080
2. Open Developer Tools (F12 or Ctrl+Shift+I)
3. Go to Console tab
4. Check for any errors (should be none!)

---

## Phase 1: Smoke Testing (5 minutes)

### ✅ Initial Load Check

- [ ] **Page loads** - Application displays without errors
- [ ] **Console clear** - No JavaScript errors in console
- [ ] **Sidebar visible** - Navigation sidebar shows all views
- [ ] **Quick add input** - Input field visible at top
- [ ] **Counts display** - Task counts show (probably 0 on fresh load)

### ✅ Console Verification

Open Console and run:

```javascript
// Verify app initialized
console.log('App initialized:', app !== undefined)
console.log('Tasks loaded:', app.tasks.length)
console.log('Projects loaded:', app.projects.length)
console.log('Current view:', app.currentView)
```

**Expected Output:**

```
App initialized: true
Tasks loaded: [number]
Projects loaded: [number]
Current view: inbox
```

---

## Phase 2: Core Task Operations (10 minutes)

### ✅ Quick Add Task

1. Type in quick add: `Test task @work high priority`
2. Press Enter
3. **Verify**: Task appears in Inbox
4. **Verify**: Task has @work context
5. **Verify**: Count updates in sidebar

### ✅ Create Task with Modal

1. Click any "Add Task" button (or double-click on task list)
2. Fill in:
    - Title: `Test task from modal`
    - Description: `Testing modal functionality`
    - Status: Next Action
    - Energy: High
    - Time: 15 min
3. Click Save
4. **Verify**: Task appears in Next Actions view
5. **Verify**: All fields saved correctly

### ✅ Edit Task

1. Click on any task to open edit modal
2. Change title to: `Edited task title`
3. Change project to a test project
4. Click Save
5. **Verify**: Changes persist
6. **Verify**: Task moves to correct view

### ✅ Complete Task

1. Click checkbox on a task
2. **Verify**: Task gets struck through
3. **Verify**: Task disappears from active view
4. **Verify**: Count updates

### ✅ Delete Task

1. Right-click on a task
2. Select "Delete" from context menu
3. **Verify**: Confirmation dialog appears
4. Confirm deletion
5. **Verify**: Task removed from list

---

## Phase 3: Project Operations (5 minutes)

### ✅ Create Project

1. Click "New Project" button
2. Enter: `Test Project`
3. Status: Active
4. Context: @work
5. Click Save
6. **Verify**: Project appears in sidebar dropdown

### ✅ Assign Task to Project

1. Create or edit a task
2. Select "Test Project" from project dropdown
3. Save task
4. **Verify**: Task shows project badge
5. **Verify**: Task moves to Next Actions (if was in Inbox)

---

## Phase 4: View Navigation (5 minutes)

### ✅ Navigate Views

Click each view in sidebar and verify:

- [ ] **Inbox** - Shows tasks with status=inbox
- [ ] **Next Actions** - Shows tasks with status=next
- [ ] **Waiting** - Shows tasks with status=waiting
- [ ] **Someday** - Shows tasks with status=someday
- [ ] **Projects** - Shows projects list
- [ ] **Calendar** - Opens calendar modal
- [ ] **Dashboard** - Opens dashboard modal

### ✅ Context Filtering

1. Click context checkboxes in sidebar (@work, @home, etc.)
2. **Verify**: Only tasks with selected contexts show
3. **Verify**: Notification appears
4. Clear filters
5. **Verify**: All tasks reappear

---

## Phase 5: Search & Filtering (5 minutes)

### ✅ Basic Search

1. Type in search box: `test`
2. **Verify**: Only matching tasks show
3. Clear search
4. **Verify**: All tasks return

### ✅ Advanced Search

1. Click in search box
2. Advanced search panel appears
3. Set filters:
    - Context: @work
    - Energy: High
    - Status: Next Action
4. **Verify**: Combined filters work

### ✅ Save Search

1. Set advanced filters
2. Click "Save Search"
3. Name it: `High priority work tasks`
4. **Verify**: Saved search appears in dropdown
5. **Verify**: Can load saved search

---

## Phase 6: Advanced Features (10 minutes)

### ✅ Calendar View

1. Click Calendar button
2. **Verify**: Calendar modal opens
3. **Verify**: Tasks with due dates show on calendar
4. Navigate months
5. **Verify**: Navigation works

### ✅ Dashboard

1. Click Dashboard button
2. **Verify**: Dashboard modal opens
3. **Verify**: Charts render correctly
4. **Verify**: Statistics display accurately

### ✅ Focus Mode

1. Click Focus Mode button
2. **Verify**: Task selector appears (if tasks available)
3. Select a task
4. **Verify**: Full-screen focus mode activates
5. **Verify**: Pomodoro timer starts automatically
6. Complete task or exit
7. **Verify**: Returns to main view

### ✅ Task Dependencies

1. Click Dependencies button
2. **Verify**: Dependencies modal opens
3. Create some tasks with dependencies
4. **Verify**: Graph view shows dependencies
5. **Verify**: Chains view displays
6. **Verify**: Critical path calculates

### ✅ Templates

1. Create a task with subtasks and notes
2. Save as Template: `Test Template`
3. Create new task from template
4. **Verify**: All template data copies correctly

### ✅ Recurring Tasks

1. Create task with recurrence:
    - Title: `Daily standup`
    - Recurrence: Weekly
    - Days: Mon, Wed, Fri
2. Mark complete
3. **Verify**: New task created for next occurrence
4. **Verify**: Recurrence label shows on task

---

## Phase 7: Bulk Operations (5 minutes)

### ✅ Bulk Selection

1. Click "Select Multiple" button (or press Ctrl+B)
2. **Verify**: Checkboxes appear on tasks
3. Select 3 tasks
4. **Verify**: Bulk actions bar appears
5. Click "Complete" on selected tasks
6. **Verify**: All selected tasks complete
7. Exit bulk mode
8. **Verify**: Normal mode returns

---

## Phase 8: Keyboard Shortcuts (5 minutes)

Test these keyboard shortcuts:

- [ ] **Ctrl+K** - Quick add focus
- [ ] **j / ↓** - Next task
- [ ] **k / ↑** - Previous task
- [ ] **Enter** - Open selected task
- [ ] **Ctrl+Enter** - Save task
- [ ] **Escape** - Close modal
- [ ] **Ctrl+Z** - Undo
- [ ] **Ctrl+Y** - Redo
- [ ] **Ctrl+B** - Toggle bulk selection
- [ ] **/** - Focus search
- [ ] **c** - Create new task
- [ ] **n** - Next view
- [ ] **i** - Inbox view

---

## Phase 9: Drag & Drop (5 minutes)

### ✅ Task Reordering

1. Drag a task to reorder
2. **Verify**: Task moves to new position
3. Refresh page
4. **Verify**: Position saved

### ✅ Project Assignment via Drag

1. Drag task onto project in sidebar
2. **Verify**: Task assigned to project
3. **Verify**: Visual feedback during drag

---

## Phase 10: Archive & Restore (3 minutes)

### ✅ Archive Task

1. Right-click task
2. Select "Archive"
3. **Verify**: Task removed from active list
4. Open Archive modal
5. **Verify**: Task appears in archive

### ✅ Restore Task

1. In Archive modal, click restore on task
2. **Verify**: Task returns to active list
3. **Verify**: Status restored correctly

---

## Phase 11: Dark Mode (2 minutes)

### ✅ Toggle Dark Mode

1. Click dark mode button (moon icon)
2. **Verify**: Theme changes to dark
3. Refresh page
4. **Verify**: Dark mode preference persists
5. Toggle back to light mode

---

## Phase 12: Mobile Responsive (5 minutes)

### ✅ Mobile Layout

1. Resize browser to mobile width (< 768px)
2. **Verify**: Sidebar collapses
3. Click hamburger menu
4. **Verify**: Sidebar slides in
5. Click outside sidebar
6. **Verify**: Sidebar closes
7. **Verify**: Touch interactions work

---

## Phase 13: Undo/Redo (3 minutes)

### ✅ Undo Operations

1. Make several changes (add, edit, complete tasks)
2. Press Ctrl+Z multiple times
3. **Verify**: Changes undo in reverse order
4. Press Ctrl+Y
5. **Verify**: Changes redo

---

## Phase 14: Edge Cases (5 minutes)

### ✅ Empty States

1. Delete all tasks from a view
2. **Verify**: Empty state message shows
3. **Verify**: Helpful instructions display

### ✅ Long Task Titles

1. Create task with very long title (100+ chars)
2. **Verify**: Title truncates gracefully
3. Hover over task
4. **Verify**: Full title shows in tooltip

### ✅ Special Characters

1. Create task with: `Test "quote" & 'apostrophe' <tag>`
2. **Verify**: Characters render correctly
3. **Verify**: No XSS vulnerabilities

### ✅ Rapid Operations

1. Quickly add 10 tasks in a row
2. **Verify**: All tasks save correctly
3. **Verify**: No performance issues

---

## Phase 15: Performance Check (3 minutes)

### ✅ Large Dataset

1. Create 50+ tasks
2. **Verify**: Page remains responsive
3. Scroll through list
4. **Verify**: Smooth scrolling (60fps)
5. Search/filter
6. **Verify**: Filters apply quickly

---

## Module Verification

Check that all refactored modules load correctly:

```javascript
// Run in browser console
console.log('=== Module Verification ===')
console.log('State:', app.state !== undefined)
console.log('ViewManager:', app.viewManager !== undefined)
console.log('TaskRenderer:', app.taskRenderer !== undefined)
console.log('TaskOperations:', app.taskOperations !== undefined)
console.log('ProjectOperations:', app.projectOperations !== undefined)
console.log('TaskModal:', app.taskModal !== undefined)
console.log('SearchManager:', app.searchManager !== undefined)
console.log('TemplatesManager:', app.templatesManager !== undefined)
console.log('CalendarManager:', app.calendarManager !== undefined)
console.log('DashboardManager:', app.dashboardManager !== undefined)
console.log('FocusPomodoro:', app.focusPomodoro !== undefined)
console.log('DependenciesManager:', app.dependenciesManager !== undefined)
console.log('BulkSelection:', app.bulkSelection !== undefined)
console.log('KeyboardNav:', app.keyboardNav !== undefined)
console.log('ContextMenu:', app.contextMenu !== undefined)
console.log('DarkMode:', app.darkMode !== undefined)
console.log('Notifications:', app.notifications !== undefined)
console.log('UndoRedo:', app.undoRedo !== undefined)
```

**Expected**: All `true`

---

## Common Issues & Solutions

### Issue: Console shows "Module not found"

**Solution**: Check all module files exist in `/js/modules/` directory

### Issue: Tasks not saving

**Solution**: Check localStorage is enabled, clear browser cache

### Issue: View not updating

**Solution**: Click another view, then return. Check for errors in console.

### Issue: Drag and drop not working

**Solution**: Ensure you're not in bulk selection mode

---

## Test Results Summary

After completing all tests, fill out this summary:

**Date**: \***\*\_\_\_\*\*** **Tester**: \***\*\_\_\_\*\***
**Browser**: \***\*\_\_\_\*\***

| Phase                 | Status        | Issues Found |
| --------------------- | ------------- | ------------ |
| 1. Smoke Testing      | ☐ Pass ☐ Fail |              |
| 2. Task Operations    | ☐ Pass ☐ Fail |              |
| 3. Project Operations | ☐ Pass ☐ Fail |              |
| 4. View Navigation    | ☐ Pass ☐ Fail |              |
| 5. Search & Filter    | ☐ Pass ☐ Fail |              |
| 6. Advanced Features  | ☐ Pass ☐ Fail |              |
| 7. Bulk Operations    | ☐ Pass ☐ Fail |              |
| 8. Keyboard Shortcuts | ☐ Pass ☐ Fail |              |
| 9. Drag & Drop        | ☐ Pass ☐ Fail |              |
| 10. Archive & Restore | ☐ Pass ☐ Fail |              |
| 11. Dark Mode         | ☐ Pass ☐ Fail |              |
| 12. Mobile Responsive | ☐ Pass ☐ Fail |              |
| 13. Undo/Redo         | ☐ Pass ☐ Fail |              |
| 14. Edge Cases        | ☐ Pass ☐ Fail |              |
| 15. Performance       | ☐ Pass ☐ Fail |              |

**Overall Status**: ☐ All Pass ☐ Minor Issues ☐ Major Issues

**Notes**:

---

---

---

---

## Console Commands for Debugging

### Check Task State

```javascript
console.table(
    app.tasks.map((t) => ({
        id: t.id.substring(0, 8),
        title: t.title,
        status: t.status,
        project: t.projectId || 'none',
        completed: t.completed
    }))
)
```

### Manually Trigger Render

```javascript
app.renderView()
```

### Check Module State

```javascript
console.log('Current view:', app.currentView)
console.log('Filtered tasks:', app.viewManager.getFilteredTasks())
console.log('Selected contexts:', app.contextFilter.getSelectedContexts())
```

### Clear All Data (Careful!)

```javascript
localStorage.clear()
location.reload()
```

---

**Happy Testing! 🎯**

Report any issues found with:

- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Browser version
