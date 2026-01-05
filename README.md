# GTD Web

A full-featured Getting Things Done (GTD) productivity application that runs entirely in your browser. Implement David Allen's GTD methodology to stay organized and productive.

![GTD Web](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Core GTD Workflow
- **Inbox** - Quick capture for all new tasks and ideas
- **Next Actions** - Actionable tasks you can do right now
- **Waiting For** - Tasks blocked on dependencies or external factors
- **Someday/Maybe** - Tasks for future consideration
- **Projects** - Multi-step outcomes with task tracking
- **Reference** - Non-actionable information storage

### Advanced Features
- **Task Dependencies** - Set tasks that must complete before others become actionable
- **Smart Tagging System** - Default context tags (@home, @work, @personal, @computer, @phone) plus custom tags
- **Due Dates & Defer Dates** - Schedule deadlines and hide tasks until they're relevant
- **Energy & Time Filters** - Find tasks matching your current energy and available time
- **Project Management** - Create projects and assign tasks to them
- **Automatic Workflow** - Tasks move from Inbox to Next Actions when assigned to projects
- **Visual Indicators** - See overdue tasks, blocked tasks, and pending dependencies at a glance

### User Experience
- **Quick Task Capture** - Fast task entry with keyboard shortcuts
- **Custom Tags** - Create, use, and delete your own tags
- **Filter by Context** - Quickly find tasks by tag, energy level, or time
- **Responsive Design** - Works on desktop and mobile browsers
- **Local-First Storage** - All data stays private in your browser

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

1. **Capture Everything** - Use the Inbox to quickly capture all tasks, ideas, and commitments
2. **Process Your Inbox** - Decide what each item means and where it belongs
3. **Organize by Context** - Use tags like @home, @work, @computer to categorize
4. **Review Regularly** - Check your Waiting For, Someday/Maybe, and Projects weekly
5. **Do by Context** - Filter by tag, energy, and time to find the right task

### Creating Tasks

**Quick Add (Fastest)**
1. Type your task in the quick-add input box
2. Optionally click tag buttons to add them
3. Press Enter

**Detailed Add**
1. Click the "Add Task" button
2. Fill in the form:
   - Title and description
   - Status (Inbox, Next Actions, Waiting For, etc.)
   - Energy level (high, medium, low)
   - Time estimate
   - Due date and defer date
   - Project assignment
   - Tags
3. Click Save

### Managing Projects

1. Go to "Projects" in the sidebar
2. Click "Add Project"
3. Enter project details (title, description, status, tags)
4. Save
5. Assign tasks to the project when creating/editing them

**Pro Tip:** When you assign an Inbox task to a project, it automatically moves to Next Actions!

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

### Working with Tags

**Default Context Tags:**
- `@home` - Tasks to do at home
- `@work` - Work-related tasks
- `@personal` - Personal tasks
- `@computer` - Tasks requiring a computer
- `@phone` - Tasks requiring a phone

**Creating Custom Tags:**
1. Click the green "Create Tag" button
2. Enter tag name
3. Click "Create Tag"
4. The tag appears as a clickable button

**Deleting Tags:**
1. Click the × button on any custom tag
2. Confirm deletion
3. Tag is removed from ALL tasks and projects

### Filtering Tasks

Use the filters in the header to find the right task:

- **Tag Filter** - Show only tasks with a specific tag
- **Energy Filter** - Find tasks matching your energy (high/medium/low)
- **Time Filter** - Find tasks that fit your available time

Filters work together for powerful task discovery!

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

**Defer Dates**
- Hide tasks until they become relevant
- Great for future tasks you don't want to see yet
- Tasks appear in Next Actions when defer date arrives

## Data Storage

### Local Storage
- All data is stored in your browser's localStorage
- Your tasks stay private on your device
- Works offline
- No account or internet connection required

### Backup & Export
To back up your data:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Find `gtd_tasks`, `gtd_projects`, `gtd_custom_tags`
4. Copy and save the values

To restore:
1. Open the same DevTools section
2. Paste the saved values back
3. Refresh the page

### Clearing Data
- Clearing browser data will delete all tasks
- Consider exporting important data regularly
- Use browser sync to sync data across devices

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
│   └── storage.js      # LocalStorage wrapper
├── __tests__/
│   └── storage.test.js # Storage layer tests
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

### Tags not saving
- Check if tag name conflicts with existing tags (case-insensitive)
- Look at browser console for error messages
- Verify localStorage has available space

### App stuck on "Loading..."
- Open browser DevTools console
- Check for JavaScript errors
- Try clearing cache and refreshing

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

## Roadmap

Future enhancements being considered:
- [ ] Cloud sync (browser-compatible solution)
- [ ] Data export/import (JSON, CSV)
- [ ] Dark mode theme
- [ ] Calendar view
- [ ] Mobile app (PWA)
- [ ] Collaborative features
- [ ] Advanced reporting/analytics

## Support

For issues, questions, or suggestions, please open an issue on the project repository.

---

**Stay organized. Get things done.** ✅
