# GTD Web

A full-featured Getting Things Done (GTD) productivity application that runs entirely in your browser. Implement David Allen's GTD methodology to stay organized and productive.

![GTD Web](https://img.shields.io/badge/version-2.3.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Core GTD Workflow
- **Inbox** - Quick capture for all new tasks and ideas
- **Next Actions** - Actionable tasks you can do right now
- **Waiting** - Tasks blocked on dependencies or external factors
- **Someday** - Tasks for future consideration
- **Projects** - Multi-step outcomes with task tracking and health indicators
- **Reference** - Non-actionable information storage

### Advanced Features
- **🔄 Advanced Recurrence** - Set specific days for weekly (Mon/Wed/Fri), nth weekday for monthly (3rd Thursday), specific dates for yearly (Jan 15th)
- **🔗 Drag-and-Drop Dependencies** - In project view, drag tasks onto each other to create dependencies with visual feedback
- **📦 Project Archive/Delete** - One-click archive or delete for empty/completed projects with restore functionality
- **Auto-Assign to Project** - Tasks created in project view automatically assign to that project
- **Circular Dependency Prevention** - Automatic detection and blocking of circular dependencies using BFS algorithm
- **Task Dependencies Visualization** - Visual graphs, dependency chains, and critical path analysis
- **Productivity Heatmap** - GitHub-style contribution calendar showing 365 days of activity
- **Global Quick Capture** - Press Alt+N anywhere to instantly capture tasks with natural language parsing
- **Focus Timer Auto-Integration** - Auto-start timer in Focus Mode, auto-stop on completion, auto-track time
- **Task Priority Scoring** - Automatic 0-100 scores based on multiple factors (due date, energy, dependencies, age)
- **Archive System** - Archive completed tasks to keep your workspace clean
- **Quick Actions Menu** - Right-click context menu for fast task operations
- **Smart Date Suggestions** - Natural language parsing (in 3 days, tomorrow, next week)
- **Task Countdown Badges** - Visual days-remaining indicators on due tasks
- **Enhanced Analytics** - Productivity trends, task lifecycle duration, completion velocity
- **Bulk Operations** - Set status, energy, context, due dates on multiple tasks at once
- **Dark Mode** - Easy-on-the-eyes dark theme with system preference detection
- **Calendar View** - Visual calendar showing tasks by due date
- **Focus Mode** - Full-screen single-task focus with integrated Pomodoro timer (25/5 intervals)
- **Task Notes** - Add detailed notes and progress updates to tasks
- **Subtasks & Checklists** - Break down tasks into manageable steps with progress tracking
- **Quick Capture Widget** - Floating button for instant task capture from any view
- **Undo/Redo System** - Full history tracking with keyboard shortcuts (Ctrl+Z/Ctrl+Y)
- **Advanced Sorting** - Sort by due date, creation date, time estimate, or title
- **Time Analytics** - Dashboard showing time spent by context and project
- **Project Health Indicators** - Visual progress bars and health status for all projects
- **Natural Language Parsing** - Quick task entry with smart context/energy/time extraction
- **Smart Suggestions** - AI-powered task recommendations based on your patterns
- **Recurring Tasks** - Advanced recurrence with specific day selection (backward compatible with simple daily/weekly/monthly/yearly)
- **Task Dependencies** - Set tasks that must complete before others become actionable (drag-and-drop or manual)
- **Smart Context System** - Default contexts (@home, @work, @personal, @computer, @phone) plus custom contexts
  - All contexts automatically start with @ for easy identification
- **Gantt Charts** - Visual dependency diagrams for projects
- **Due Dates & Defer Dates** - Schedule deadlines and hide tasks until they're relevant
- **Project Management** - Create projects directly or convert tasks to projects
- **Automatic Workflow** - Tasks move from Inbox to Next Actions when assigned to projects
- **Visual Indicators** - See overdue tasks, blocked tasks, and pending dependencies at a glance
- **Task Starring/Pinning** - Mark important tasks with stars to keep them at the top of your lists
- **Task Templates** - Create reusable task templates for repetitive workflows (weekly reports, meeting notes, checklists)
- **Daily Review Mode** - Quick daily workflow with time-based greeting, urgent tasks, and quick actions
- **Quick Edit Inline** - Double-click any task title to edit it instantly without opening a modal
- **Saved Filter Presets** - Save and load custom filter combinations for frequently-used searches
- **Enhanced Mobile Support** - Touch-optimized interface with 44px touch targets, full-screen modals, and responsive design

### User Experience
- **Quick Task Capture** - Fast task entry with keyboard shortcuts
- **Custom Contexts** - Create your own contexts (auto-formatted with @ prefix)
- **Drag & Drop** - Reorder tasks and assign tasks to projects by dragging
- **Responsive Design** - Works on desktop and mobile browsers
- **Local-First Storage** - All data stays private in your browser
- **PWA Support** - Install as a Progressive Web App for offline use
- **Export/Import** - Backup and restore your data as JSON

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (comes with Node.js)

### Setup

1. **Clone or download the repository**
   ```bash
   cd /path/to/GTD-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

4. **Open in your browser**
   ```
   http://localhost:8080
   ```

That's it! The application runs entirely in the browser with no backend required.

## Running Tests

The project includes comprehensive unit tests for the data models.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Usage Guide

### Getting Started with GTD

1. **Capture Everything** - Use the Inbox or Quick Capture to quickly capture all tasks, ideas, and commitments
2. **Process Your Inbox** - Decide what each item means and where it belongs
3. **Organize by Context** - Use contexts like @home, @work, @computer to categorize
4. **Review Regularly** - Use the Weekly Review to check projects, waiting items, and someday/maybe tasks
5. **Do by Context** - Find the right task for your current context and situation

### Creating Tasks

**Quick Add (Fastest)**
1. Type your task in the quick-add input box
2. Optionally click context buttons to add them
3. Press Enter

**Quick Capture Widget**
1. Click the floating + button (bottom-right corner)
2. Type your task
3. Press Enter to capture instantly
4. Works from any view without navigation

**Natural Language Entry**
- Type: "Call mom @phone high 30min tomorrow"
- Automatically extracts: context (@phone), energy (high), time (30min), due date (tomorrow)

**Detailed Add**
1. Click the "Add Task" button
2. Fill in the form:
   - Title and description
   - Notes (detailed information)
   - Status (Inbox, Next Actions, Waiting For, etc.)
   - Energy level (high, medium, low)
   - Time estimate
   - Due date and defer date
   - Project assignment
   - Contexts
   - Subtasks/checklist items
3. Click Save

### Managing Projects

**Creating Projects**
1. Click the "New Project" button in the header (folder icon), OR
2. Create a task and change its Type to "Project" in the edit form
3. Projects show progress bars and health indicators

**Project Health Indicators**
- 🟢 **Good**: No overdue tasks, manageable task count
- 🟡 **Warning**: 1-2 overdue tasks or more than 10 tasks
- 🔴 **Critical**: 3+ overdue tasks
- ⚪ **Empty**: Project has no tasks yet

**Project Progress**
- Visual progress bar shows completion percentage
- Stats display: "5/10 tasks (50%)"
- Overdue task count shown when applicable

### Using Focus Mode

1. Click the "Focus Mode" button (bullseye icon) in the header
2. Select a task from smart suggestions
3. Work on the task in a distraction-free full-screen view
4. Use the Pomodoro timer:
   - **Start**: Begin 25-minute work session
   - **Pause**: Temporarily stop the timer
   - **Reset**: Reset timer to 25:00
5. At the end of 25 minutes, choose to take a 5-minute break or continue

### Using the Calendar View

1. Click the "Calendar View" button (calendar icon) in the header
2. See all tasks displayed on their due dates
3. Navigate between months using prev/next buttons
4. Click on tasks to see details

### Working with Notes

**Adding Notes**
1. Edit any task
2. Use the Notes textarea to add detailed information
3. Notes are great for:
   - Progress updates
   - Meeting notes
   - Reference information
   - Brainstorming ideas

**Viewing Notes**
- Click the notes icon (sticky note) on any task card
- Icon turns blue when task has notes
- Quick preview without opening edit modal

### Managing Subtasks

**Creating Subtasks**
1. Edit a task
2. Scroll to the "Subtasks / Checklist" section
3. Click "Add" or type in the input field
4. Press Enter or click "Add" button

**Using Subtasks**
- Check off items as you complete them
- Progress shows on task card (e.g., "2/5 subtasks")
- First 3 incomplete subtasks display inline
- Great for:
  - Multi-step processes
  - Shopping lists
  - Checklists
  - Procedure tracking

### Advanced Filtering & Sorting

**Sorting Options**
- **Recently Updated** (default) - Most recently modified tasks first
- **Due Date** - Tasks due soonest first
- **Date Created** - Newest tasks first
- **Time Estimate** - Longest tasks first
- **Title (A-Z)** - Alphabetical order

**Advanced Filters**
- Click in the search box to open advanced filters
- Filter by multiple criteria simultaneously:
  - Context
  - Energy level
  - Status
  - Due date (overdue, today, this week, this month, no date)
  - Sort option
- Save frequently-used searches for quick access

### Undo/Redo

**Keyboard Shortcuts**
- `Ctrl+Z` - Undo last action
- `Ctrl+Y` or `Ctrl+Shift+Z` - Redo

**Button Interface**
- Click undo/redo arrows in the header
- Buttons are disabled when no history available
- Toast notifications show what was undone/redone

**Tracked Actions**
- Create/edit/delete tasks
- Create/edit/delete projects
- Toggle task completion
- Duplicate tasks
- All actions are reversible (up to 50 states)

### Time Tracking & Analytics

**Tracking Time**
1. Click the timer icon on any task
2. Click "Start" to begin tracking
3. Click "Stop" when done
4. Time is saved automatically

**Viewing Analytics**
1. Click the "Dashboard" button (chart icon)
2. See time tracking section with:
   - **Total Time Tracked**: Sum of all time spent
   - **Tasks with Time**: Count of tracked tasks
   - **Average Time/Task**: Mean time per completed task
   - **Time by Context**: Bar chart showing distribution
   - **Time by Project**: Bar chart showing project time allocation

### Export/Import Data

**Export**
1. Click the "Export" button in the sidebar
2. JSON file downloads with timestamp (e.g., `gtd-backup-2025-01-06-14-30-45.json`)
3. Save the file somewhere safe

**Import**
1. Click the "Import" button in the sidebar
2. Select your backup JSON file
3. Data is merged with your existing data
4. All tasks, projects, and contexts are restored

### Using Task Dependencies

Create workflows where tasks automatically become actionable when others complete:

1. Create Task A: "Design mockups" (Next Actions)
2. Create Task B: "Get approval" (Waiting For)
3. In Task B, select Task A as a dependency
4. When Task A is completed, Task B automatically moves to Next Actions!

Perfect for:
- Multi-step processes
- Approval workflows
- Sequential tasks
- Team dependencies

### Creating Recurring Tasks

Automate repetitive tasks by setting them to recur:

1. Create or edit a task
2. Set a recurrence interval:
   - **Daily** - Tasks you do every day (e.g., "Check email")
   - **Weekly** - Weekly routines (e.g., "Team standup")
   - **Monthly** - Monthly tasks (e.g., "Pay bills")
   - **Yearly** - Annual tasks (e.g., "Performance review")
3. Optionally set a recurrence end date
4. Save the task
5. When you complete the task, a new instance is automatically created with the next due date

**Features:**
- Tasks maintain all properties (contexts, project, energy, time, notes, subtasks)
- Optional end dates to stop recurrence after a certain date
- Visual indicator shows recurrence interval (↻ Daily, etc.)
- Based on task's due date, or current date if no due date set

Perfect for:
- Daily habits and routines
- Weekly meetings and reports
- Monthly bills and reviews
- Annual maintenance tasks

### Working with Contexts

**About Contexts:**
- All contexts must start with `@` symbol (e.g., `@home`, `@work`)
- The `@` is automatically added if you forget it
- Contexts help you organize tasks by situation/location

**Default Contexts:**
- `@home` - Tasks to do at home
- `@work` - Work-related tasks
- `@personal` - Personal tasks
- `@computer` - Tasks requiring a computer
- `@phone` - Tasks requiring a phone
- `@errand` - Tasks requiring going out

**Creating Custom Contexts:**
1. Click the green "Create Context" button in the task form
2. Enter context name (e.g., "urgent" or "@shopping")
3. The `@` is added automatically if needed
4. Click "Create Context"
5. The context appears as a clickable button

**Deleting Contexts:**
1. Click the × button on any custom context
2. Confirm deletion
3. Context is removed from ALL tasks and projects

### Using Task Starring/Pinning

**About Starred Tasks:**
- Star important tasks to keep them at the top of your lists
- Starred tasks always appear first, regardless of other sort criteria
- Perfect for high-priority items or tasks you want to focus on today

**Starring Tasks:**
1. Click the star icon on any task card
2. The star turns gold when starred
3. Starred tasks automatically move to the top of your list
4. Click again to unstar

**Use Cases:**
- Today's must-do items
- High-priority tasks
- Tasks waiting for attention
- Quick bookmarking for later review

### Using Task Templates

**About Templates:**
- Create reusable task templates for repetitive workflows
- Templates save time on recurring tasks and processes
- Include all task properties: title, description, contexts, energy, time, notes, and subtasks

**Creating Templates:**
1. Click "Templates" in the sidebar
2. Click "Create Template"
3. Fill in the template details:
   - Title and description
   - Energy level and time estimate
   - Category (General, Work, Personal, Meeting, Checklist)
   - Contexts
   - Notes (instructions, reference info)
   - Subtasks/checklist items
4. Click "Save Template"

**Using Templates:**
1. Click "Templates" in the sidebar
2. Find your template by category
3. Click "Create Task" on the template card
4. A new task is created with all the template's properties
5. Edit the task as needed

**Template Categories:**
- **General** - Multipurpose templates
- **Work** - Professional workflows (reports, reviews)
- **Personal** - Personal routines and habits
- **Meeting** - Meeting preparation and follow-up
- **Checklist** - Reusable checklists and procedures

**Perfect for:**
- Weekly status reports
- Meeting preparation checklists
- Monthly bill payments
- Code review processes
- Project kickoff tasks
- Daily routine checklists

### Using Daily Review Mode

**About Daily Review:**
- Quick daily workflow to review your tasks and plan your day
- Time-based greeting (Morning/Afternoon/Evening)
- Shows urgent tasks, starred items, and inbox items
- Much lighter than the Weekly Review - takes 2-5 minutes

**Starting Daily Review:**
1. Click the sun icon (Daily Review) in the header
2. Review the overview section with counts for:
   - Tasks due today and overdue
   - Starred tasks
   - Inbox items to process
3. Use quick actions to:
   - Quick capture new tasks
   - Process your inbox
   - Review next actions
   - Use a template
4. Complete tasks directly from the review
5. Click on any task to edit it

**Daily Review Sections:**
- **Tasks Due Today & Overdue** - Urgent items that need attention
  - Shows overdue tasks in red with warning
  - Complete tasks with one click
  - Click task to edit details
- **Starred Tasks** - Your top 5 starred tasks
  - Quick access to important items
  - Great for today's priorities
- **Inbox to Process** - Unprocessed inbox items
  - GTD reminder to process your inbox
  - Shows first 5 items
  - Process: actionable? delete? delegate? defer?

**When to Use:**
- First thing in the morning - plan your day
- Midday - check progress and stay focused
- End of day - wrap up and prepare for tomorrow

### Quick Edit Inline

**About Inline Editing:**
- Edit task titles instantly without opening the modal
- Double-click any task title to edit
- Saves time for quick corrections and updates

**Editing Inline:**
1. Double-click on any task title
2. The title becomes an editable text field
3. Make your changes
4. Press Enter or click away to save
5. Press Escape to cancel

**Benefits:**
- Faster than opening the full edit modal
- Great for quick title corrections
- Keeps you in the flow
- Perfect for mobile users

### Using Saved Filter Presets

**About Saved Searches:**
- Save custom filter combinations for quick access
- Reuse frequently-used search criteria
- Access saved searches from the advanced search panel

**Saving a Search:**
1. Apply your filters (context, energy, status, due date, sort)
2. Enter a search query if needed
3. Click "Save Search" button
4. Give your search a name
5. The search is saved for future use

**Using Saved Searches:**
1. Click in the search box to show advanced filters
2. Select a saved search from the dropdown
3. All filters are applied automatically
4. Delete saved searches with the trash button

**Perfect for:**
- "High priority @work tasks due this week"
- "Phone calls to make"
- "Low energy tasks for afternoon"
- "Overdue inbox items"
- "Tasks by project"

### Mobile Usage

**Mobile-Optimized Features:**
- **Touch-Friendly Interface** - All buttons are 44px minimum for easy tapping
- **Full-Screen Modals** - Edit forms take full screen on mobile devices
- **Responsive Design** - Layout adapts to screen size
- **Icon-Only Buttons** - Buttons show icons only on small screens
- **Quick Capture** - Floating + button works from any view
- **Swipe & Tap** - Natural mobile interactions

**Mobile Tips:**
- Use Quick Capture for fast task entry
- Double tap task titles to edit inline
- Use daily review to plan your day on the go
- Templates save time on mobile entry
- Star important tasks for quick access
- Portrait mode works best for task lists

**Mobile-Specific Optimizations:**
- No accidental zoom on focus
- Large touch targets throughout
- Simplified button layouts
- Touch-optimized form inputs
- Full-screen task editing

### Viewing Project Dependencies (Gantt Chart)

Visualize task relationships within a project:

1. Go to "Projects" in the sidebar
2. Click on a project to view its tasks
3. Click the "Gantt Chart" button
4. See tasks organized by dependency level with arrows showing relationships

**Features:**
- Tasks with unmet dependencies show as "Waiting" (orange)
- Tasks ready to start show as "Next" (blue)
- Completed tasks show as "Completed" (green)
- Arrows indicate task dependencies
- Dependencies only work within the same project

### Understanding Task Status

| Status | Description | When to Use |
|--------|-------------|--------------|
| **Inbox** | Unprocessed items | Initial capture, process later |
| **Next Actions** | Actionable now | Physical, visible tasks you can do |
| **Waiting For** | Blocked externally | Waiting on someone/something else |
| **Someday/Maybe** | Not actionable now | Future ideas, maybe later |
| **Completed** | Done | Finished tasks (archive) |

### Date Management

**Due Dates**
- Set deadlines for time-sensitive tasks
- Overdue tasks show with red highlighting
- "Today" appears for tasks due today
- Calendar view shows all tasks by due date

**Defer Dates**
- Hide tasks until they become relevant
- Great for future tasks you don't want to see yet
- Tasks appear in Next Actions when defer date arrives

### Keyboard Shortcuts

**Global Shortcuts**
- `Alt+N` - Open global quick capture overlay (works from anywhere)
- `Ctrl+Z` - Undo last action
- `Ctrl+Y` / `Ctrl+Shift+Z` - Redo action
- `Escape` - Close modals, cancel quick capture

**Quick Capture**
- `Enter` - Submit task
- `Escape` - Close quick capture panel
- `T` - Browse templates (in global quick capture overlay)

### Task Dependencies Visualization

**Overview**
Visualize task relationships with multiple views to understand project dependencies and identify bottlenecks.

**Using Dependencies Visualization**
1. Click the graph icon in the header to open the Dependencies modal
2. Choose from three visualization views:
   - **Graph View**: Visual tree layout with curved connection lines showing dependencies
   - **Dependency Chains**: Sequential lists showing A→B→C task relationships
   - **Critical Path**: Timeline showing the longest chain determining project duration
3. Statistics show: total tasks, with dependencies, blocked tasks, ready-to-start
4. Filter by project to see specific dependency relationships
5. Click any task node to edit it directly

**Creating Task Dependencies**
1. Edit a task and scroll to "Dependencies"
2. Select tasks that must complete before this task can start
3. Tasks show as "Blocked" until dependencies are met
4. When dependencies complete, tasks automatically become actionable

**Use Cases**
- Multi-step projects where tasks must be completed in order
- Approval workflows (design → approval → development)
- Prerequisite tracking (learn basics → advanced topics)
- Identifying project bottlenecks and critical path

### Productivity Heatmap

**Overview**
GitHub-style contribution calendar showing your task completion activity over the last 365 days.

**Using the Heatmap**
1. Click the calendar icon in the header to view your productivity heatmap
2. See visual representation of completed tasks per day
3. Color intensity shows completion volume (5 levels)
4. View statistics: total completed, best day, average per day, current streak
5. Hover over any day to see exact count and date

**Features**
- 365-day activity history
- Color-coded intensity (gray → green scale)
- Streak tracking for consecutive days
- Month and day labels for navigation
- Statistics dashboard with key metrics

**Benefits**
- Visual motivation through activity tracking
- Identify productivity patterns
- Track streak consistency
- Celebrate progress milestones

### Global Quick Capture (Alt+N)

**Overview**
Instantly capture tasks from anywhere in the application using a global hotkey.

**Using Global Quick Capture**
1. Press `Alt+N` from any view to open the capture overlay
2. Type your task with optional syntax:
   - `@context` - Add contexts
   - `!high/!medium/!low` - Set energy level
   - `#project` - Assign to project
   - `today/tomorrow/in X days` - Set due date
3. Press `Enter` to save or `Escape` to cancel
4. Press `T` to browse and select templates

**Example Entries**
- "Call mom @phone" - Adds @phone context
- "Finish report !high @work today" - High energy, @work context, due today
- "Review code #project-alpha !medium" - Assigns to project-alpha
- "Weekly planning in 7 days" - Sets due date 7 days from now

**Benefits**
- Capture ideas without interrupting your flow
- Fast natural language input
- Works from any screen or view
- Template integration for common tasks

### Focus Timer Auto-Integration

**Overview**
The Pomodoro timer now integrates seamlessly with Focus Mode for automatic time tracking.

**Auto-Integration Features**
- **Auto-Start**: Timer starts automatically when entering Focus Mode
- **Auto-Track**: Time spent on focused task is tracked automatically
- **Auto-Stop**: Timer stops automatically when completing a task
- Toast notifications show time tracked when exiting focus mode

**Using Enhanced Focus Mode**
1. Click the bullseye icon (Focus Mode) in the header
2. Select a task from smart suggestions
3. Timer starts automatically (25-minute Pomodoro)
4. Work on the task distraction-free
5. Click "Complete Task" to auto-stop timer and track time
6. Toast shows how much time was tracked

**Benefits**
- No manual timer management needed
- Accurate time tracking without effort
- Seamless workflow from focus to completion
- Better focus with automatic sessions

### Task Priority Scoring

**Overview**
Automatic 0-100 priority scores help you focus on what matters most.

**Scoring Factors**
- Due date urgency (overdue +25, due today +20, due tomorrow +15)
- Starred tasks (+15)
- Task status (Next Actions +10)
- Dependencies (ready +10, blocked -10)
- Energy vs time match (quick high-energy +8)
- Time estimate (quick tasks +5)
- Project priority (+5 for active projects)
- Defer date penalty (-20 if deferred)
- Task age (old tasks +7)

**Priority Levels**
- **80-100 (Red)**: Urgent - Requires immediate attention
- **60-79 (Orange)**: High - Important tasks
- **40-59 (Yellow)**: Medium - Normal priority
- **20-39 (Blue)**: Low - Can wait
- **0-19 (Gray)**: Very Low - Backlog

**Viewing Priority Scores**
- Color-coded badges appear on all incomplete tasks
- Hover to see priority label
- Tasks auto-sort by priority (starred first, then by score)
- Helps you focus on high-impact tasks

### Archive System

**Overview**
Keep your active workspace clean by archiving completed tasks while preserving history.

**Using the Archive**
1. Click the Archive icon in the sidebar
2. View all archived tasks with metadata
3. **Auto-Archive**: Archive tasks completed more than 30 days ago
4. Search and filter by project
5. Restore archived tasks with one click
6. Delete permanently if needed

**Archive Statistics**
- Total number of archived tasks
- Original project and status preserved
- Archive date recorded
- Searchable full-text

**Benefits**
- Reduces clutter in active views
- Preserves task history
- Fast access to old tasks if needed
- Maintains performance with large datasets

### Quick Actions Context Menu

**Overview**
Right-click on any task for instant access to common operations.

**Using Context Menu**
- **Desktop**: Right-click on any task
- **Mobile**: Long-press (500ms) on any task
- Quick actions: edit, duplicate, toggle star, set status, set energy, move to project, add/remove context
- Complete or delete tasks directly
- Much faster than opening full edit modal

### Smart Date Suggestions

**Overview**
Type natural language in date fields and see intelligent suggestions.

**Supported Phrases**
- "in 3 days" - Relative days
- "tomorrow" - Next day
- "next week" - 7 days from now
- "end of month" - Last day of month
- "today" - Current date

**Using Smart Suggestions**
1. Click in a due date or defer date field
2. Start typing a natural language phrase
3. See suggestions appear below the field
4. Click any suggestion to auto-fill

### Task Countdown Badges

**Overview**
Visual indicators show days remaining on tasks with due dates.

**Badge Colors**
- **Red (≤2 days)**: Urgent deadline approaching
- **Orange (3-5 days)**: Due soon
- **Yellow (6-7 days)**: This week

**Viewing Countdowns**
- Appears on tasks due within 14 days
- Color coding for quick visual scanning
- Helps prioritize time-sensitive work

### Enhanced Analytics

**Overview**
Productivity dashboard with trends and insights about your task management.

**Analytics Sections**
- **Last 7 Days**: Bar chart showing tasks completed each day
- **Task Lifecycle**: Average time from creation to completion
- **Completion Velocity**: Trend indicator (up/down/stable)
- **Context Distribution**: Tasks by context
- **Project Time**: Time spent per project

**Using Analytics**
1. Click Dashboard button (chart icon) in header
2. Review productivity trends
3. Identify patterns in your work habits
4. Make data-driven decisions about task management

## Data Storage

### Local Storage
- All data is stored in your browser's localStorage
- Your tasks stay private on your device
- Works offline
- No account or internet connection required

### Backup & Export
To back up your data:
1. Click the "Export" button in the sidebar footer
2. A timestamped JSON file downloads automatically
3. Store the backup file in a safe location

To restore:
1. Click the "Import" button in the sidebar footer
2. Select your backup JSON file
3. Data is merged with existing data
4. Refresh to see restored items

### Clearing Data
- Clearing browser data will delete all tasks
- Export important data regularly
- Use browser sync to sync data across devices
- PWA offline storage available

## Development

### Project Structure
```
GTD-web/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Application styles
├── js/
│   ├── app.js          # Main application logic
│   ├── models.js       # Task, Project, Reference models
│   ├── storage.js      # LocalStorage wrapper
│   ├── constants.js    # Configuration constants
│   ├── dom-utils.js    # DOM manipulation utilities
│   └── nlp-parser.js   # Natural language parser
├── __tests__/
│   ├── storage.test.js # Storage layer tests
│   └── models.test.js  # Model tests
├── manifest.json       # PWA manifest
├── service-worker.js   # PWA service worker
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

### Adding New Features

1. **Models** - Add new properties to classes in `js/models.js`
2. **Storage** - Update persistence in `js/storage.js`
3. **UI** - Modify `js/app.js` for user interactions
4. **Styles** - Add CSS in `css/styles.css`
5. **Tests** - Write tests in `__tests__`

### Code Style
- ES6+ JavaScript modules
- Async/await for asynchronous operations
- Clear naming and comments
- Comprehensive error handling

## Troubleshooting

### Tasks not appearing
- Check browser console for errors (F12)
- Verify data in localStorage
- Try refreshing the page
- Check if filters are hiding tasks

### Contexts not saving
- Check if context name conflicts with existing contexts (case-insensitive)
- Look at browser console for error messages
- Verify localStorage has available space

### App stuck on "Loading..."
- Open browser DevTools console
- Check for JavaScript errors
- Try clearing cache and refreshing

### Recurring tasks not creating new instances
- Ensure the task has a recurrence interval set
- Check if recurrence end date has passed
- Verify the task is actually being completed (checkbox checked)
- Look for browser console errors

### Dark mode not persisting
- Check if localStorage is enabled
- Clear browser cache and cookies
- Verify system preference settings

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Requires a modern browser with ES6 module support.

## License

MIT License - feel free to use this application for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Credits

Created as a full-featured GTD implementation following David Allen's Getting Things Done methodology.

## Recent Updates

### Version 2.2.0 (Current) - Productivity Power Release

#### Major New Features
- ✨ **Task Dependencies Visualization** - Graph view, dependency chains, and critical path analysis
- ✨ **Productivity Heatmap Calendar** - GitHub-style contribution calendar showing 365 days of activity
- ✨ **Global Quick Capture (Alt+N)** - Instant task capture from anywhere with natural language parsing
- ✨ **Focus Timer Auto-Integration** - Auto-start, auto-track, auto-stop for seamless Pomodoro workflow
- ✨ **Task Priority Scoring** - Automatic 0-100 scores based on multiple intelligent factors

#### Additional Enhancements
- ✨ **Archive System** - Auto-archive completed tasks to reduce clutter
- ✨ **Quick Actions Context Menu** - Right-click tasks for instant operations
- ✨ **Smart Date Suggestions** - Natural language date parsing (in 3 days, tomorrow, next week)
- ✨ **Task Countdown Badges** - Visual days-remaining indicators on due tasks
- ✨ **Enhanced Analytics** - Productivity trends, task lifecycle, completion velocity
- ✨ **Bulk Operations** - Set status, energy, context, due dates on multiple tasks at once

#### Improvements
- 🔧 Faster task operations with context menu
- 🔧 Better productivity insights with enhanced analytics
- 🔧 Improved focus mode with automatic timer management
- 🔧 Cleaner workspace with archive system
- 🔧 Smarter prioritization with automatic scoring
- 🔧 Better task dependency visualization
- 🔧 Enhanced mobile long-press for context menu

#### UX Improvements
- ⚡ Instant task capture with global hotkey
- ⚡ One-click access to common task operations
- ⚡ Visual productivity motivation with heatmap
- ⚡ Automatic time tracking in focus mode
- ⚡ Data-driven prioritization
- ⚡ Reduced cognitive load with auto-scoring

### Version 2.1.0 - Productivity Enhancements Release

#### New Features
- ✨ **Task Starring/Pinning** - Mark important tasks with stars to keep them at the top of your lists
- ✨ **Task Templates** - Create reusable task templates for repetitive workflows (weekly reports, meeting notes, checklists)
- ✨ **Daily Review Mode** - Quick daily workflow with time-based greeting, urgent tasks overview, and quick actions
- ✨ **Quick Edit Inline** - Double-click any task title to edit it instantly without opening a modal
- ✨ **Enhanced Mobile Support** - Touch-optimized interface with 44px touch targets, full-screen modals, and responsive design
- ✨ **Saved Filter Presets** - Save and load custom filter combinations for frequently-used searches (previously implemented)

#### Improvements
- 🔧 Mobile browser experience significantly improved
- 🔧 Touch targets enlarged for mobile (44px minimum)
- 🔧 Full-screen modals on mobile devices
- 🔧 Icon-only buttons on small screens
- 🔧 Better responsive layout across all screen sizes
- 🔧 No accidental zoom on form focus
- 🔧 Starred tasks always appear first in lists
- 🔧 Templates organized by category for easy access
- 🔧 Daily review shows context-aware greeting
- 🔧 Inline editing saves time on quick updates

#### UX Improvements
- ⚡ Faster task editing with inline mode
- ⚡ Better mobile touch interactions
- ⚡ Streamlined daily workflow with daily review
- ⚡ Quick access to important tasks via starring
- ⚡ Time savings with reusable templates

### Version 2.0.0 - Major Feature Release

#### New Features
- ✨ **Dark Mode** - Toggle between light and dark themes with system preference detection
- ✨ **Calendar View** - Visual calendar displaying tasks by due date with month navigation
- ✨ **Focus Mode** - Full-screen single-task focus with integrated Pomodoro timer (25/5 min intervals)
- ✨ **Task Notes** - Add detailed notes and progress updates to any task
- ✨ **Subtasks & Checklists** - Break down tasks into manageable steps with progress tracking
- ✨ **Quick Capture Widget** - Floating button for instant task capture from any view
- ✨ **Undo/Redo System** - Full history tracking (50 states) with keyboard shortcuts
- ✨ **Advanced Sorting** - Sort tasks by due date, created date, time estimate, or title
- ✨ **Time Analytics Dashboard** - Visualize time spent by context and project
- ✨ **Project Health Indicators** - Progress bars and health status for all projects
- ✨ **Export/Import** - Backup and restore data as timestamped JSON files
- ✨ **PWA Support** - Install as Progressive Web App for offline use
- ✨ **Natural Language Parsing** - Smart task entry with context/energy/time extraction
- ✨ **Smart Suggestions** - AI-powered task recommendations based on usage patterns
- ✨ **Weekly Review** - Guided weekly review workflow with cleanup tools
- ✨ **Dashboard** - Productivity analytics with trends and insights
- ✨ **Advanced Search** - Multi-criteria filtering with saved searches

#### Improvements
- 🔧 Enhanced project creation (direct creation or task conversion)
- 🔧 Better drag-and-drop support throughout the app
- 🔧 Improved task card layout with more information
- 🔧 Enhanced time tracking with visual indicators
- 🔧 Bulk selection and operations for tasks
- 🔧 Better mobile responsiveness
- 🔧 Performance optimizations for large task lists
- 🔧 Improved accessibility and keyboard navigation

#### Bug Fixes
- 🐛 Fixed project type conversion (tasks to projects and vice versa)
- 🐛 Fixed context handling throughout the app
- 🐛 Fixed dependency tracking edge cases
- 🐛 Fixed recurring task creation issues
- 🐛 Fixed time tracking display bugs
- 🐛 Fixed filter interaction bugs

## Roadmap

Future enhancements being considered:
- [ ] Cloud sync options
- [ ] Mobile native apps
- [ ] Collaboration features
- [ ] Email integration (email-to-inbox)
- [ ] Calendar app integration (Google Calendar, Outlook)
- [ ] Advanced reporting templates
- [ ] Habit tracking separate from tasks
- [ ] Goals and areas of focus
- [ ] Voice input for mobile
- [ ] Task attachments and files

## Support

For issues, questions, or suggestions, please open an issue on the project repository.

---

**Stay organized. Get things done.** ✅
