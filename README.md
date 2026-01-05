# GTD Web - Getting Things Done Application

A clean, focused GTD (Getting Things Done) web application that runs in your browser with automatic cloud synchronization across devices.

## Features

- **Complete GTD Workflow**: Inbox, Next Actions, Waiting For, Someday/Maybe, Projects, and Reference
- **Clean Interface**: Minimal design inspired by Nirvana HQ
- **Smart Filtering**: Filter tasks by tags, energy level, and time required
- **Automatic Sync**: Data stored locally in localStorage and transparently synced to the cloud
- **Cross-Device Access**: Use the same app on multiple devices with automatic sync
- **Project Management**: Organize tasks into projects
- **Tag System**: Context tags for easy organization
- **Energy & Time Tracking**: Track energy required and time estimates

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser to `http://localhost:8080`

## Project Structure

```
GTD-web/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Application styles
├── js/
│   ├── models.js       # Data models (Task, Project, Reference)
│   ├── storage.js      # Storage layer with remote-storage integration
│   └── app.js          # Main application logic
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## How It Works

### Data Storage

The app uses a two-tier storage system:

1. **Local Storage**: All data is immediately saved to localStorage for instant access
2. **Remote Sync**: Data is automatically synced to [remote-storage](https://github.com/FrigadeHQ/remote-storage) cloud service

### User Identification

- Each browser instance generates a unique user ID
- The user ID is stored in localStorage (`gtd_user_id`)
- To sync across devices, you'll need to use the same user ID

### Manual Sync

Click the "Synced" button in the sidebar to manually trigger a sync.

## GTD Workflow

### 1. Inbox
Quick capture of all incoming tasks, ideas, and commitments.

### 2. Next Actions
Actionable tasks that can be done now. Filter by:
- **Energy Required**: High, Medium, Low
- **Time Available**: 5 min, 15 min, 30 min, 1 hour, 2+ hours
- **Tags**: Context-based filtering

### 3. Waiting For
Items delegated to others or waiting on external conditions.

### 4. Someday/Maybe
Things you might want to do someday, but not now.

### 5. Projects
Multi-step outcomes that require multiple tasks.

### 6. Reference
Non-actionable reference material and information.

## Usage Tips

### Quick Add
Use the quick add input at the top to quickly capture tasks. Press Enter to add.

### Editing Tasks
- Click the edit icon (✏️) on any task to open the edit modal
- Double-click a project card to view all tasks
- Check the checkbox to mark tasks complete

### Organizing with Tags
- Add tags to tasks using the @ symbol (e.g., @home, @work, @computer)
- Use the tag filter to show only tasks with specific tags
- Tags are automatically added to the filter dropdown

### Time & Energy
- Set time estimates in minutes
- Mark energy levels to match your current state
- Use filters to find tasks that match your available time and energy

## Syncing Across Devices

To use the same data on multiple devices:

1. Find your user ID in the sidebar footer
2. Open browser DevTools → Console
3. Run: `localStorage.getItem('gtd_user_id')`
4. Copy that user ID
5. On another device, open the app
6. In DevTools Console, run: `localStorage.setItem('gtd_user_id', 'YOUR_USER_ID')`
7. Refresh the page
8. Click the Sync button

## Data Privacy

- Data is stored locally in your browser
- Remote sync uses the free remote-storage community server
- For production use, consider deploying your own remote-storage server
- Do not store sensitive passwords or personal information

## Technologies Used

- **Vanilla JavaScript**: No framework dependencies
- **remote-storage**: Cross-device synchronization
- **CSS Variables**: Easy theming
- **Font Awesome**: Icons

## License

MIT

## Contributing

Feel free to submit issues and pull requests!
