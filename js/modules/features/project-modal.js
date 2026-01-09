/**
 * Project Modal module
 * Handles project creation and editing modal
 */

export class ProjectModalManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.pendingTaskData = null;
    }

    /**
     * Open project modal for creating/editing projects
     * @param {Project} project - Project to edit (null for new project)
     * @param {Object} pendingTaskData - Pending task data when creating project from task modal
     */
    openProjectModal(project = null, pendingTaskData = null) {
        const modal = document.getElementById('project-modal');
        const form = document.getElementById('project-form');
        const title = document.getElementById('project-modal-title');

        form.reset();

        // Store pending task data if coming from task modal
        this.pendingTaskData = pendingTaskData;

        if (project) {
            title.textContent = 'Edit Project';
            document.getElementById('project-id').value = project.id;
            document.getElementById('project-title').value = project.title;
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('project-status').value = project.status || 'active';
            document.getElementById('project-contexts').value = project.contexts ? project.contexts.join(', ') : '';
        } else {
            title.textContent = 'Add Project';
            document.getElementById('project-id').value = '';
        }

        modal.classList.add('active');
    }

    /**
     * Close project modal
     */
    closeProjectModal() {
        document.getElementById('project-modal').classList.remove('active');
        this.pendingTaskData = null;
    }

    /**
     * Save project from form
     */
    async saveProjectFromForm() {
        const projectId = document.getElementById('project-id').value;
        const title = document.getElementById('project-title').value.trim();
        const description = document.getElementById('project-description').value.trim();
        const status = document.getElementById('project-status').value;
        const contextsValue = document.getElementById('project-contexts').value;

        // Parse contexts
        let contexts = [];
        if (contextsValue) {
            contexts = contextsValue.split(',').map(c => c.trim()).filter(c => c);
            // Ensure contexts start with @
            contexts = contexts.map(c => c.startsWith('@') ? c : `@${c}`);
        }

        // Validate title
        if (!title) {
            this.app.showNotification?.('Please enter a project title');
            return;
        }

        // Save state for undo
        this.app.saveState?.(projectId ? 'Update project' : 'Create project');

        if (projectId) {
            // Update existing project
            const project = this.app.projects?.find(p => p.id === projectId);
            if (project) {
                project.title = title;
                project.description = description;
                project.status = status;
                project.contexts = contexts;
                project.updatedAt = new Date().toISOString();

                await this.app.saveProjects?.();
                this.app.renderView?.();
                this.app.updateCounts?.();
                this.app.renderProjectsDropdown?.();
                this.app.showNotification?.(`Project "${title}" updated`);
            }
        } else {
            // Create new project
            const { Project } = await import('../../models.js');
            const newProject = new Project({
                title,
                description,
                status,
                contexts,
                position: this.app.projects?.length || 0
            });

            this.app.projects?.push(newProject);
            await this.app.saveProjects?.();
            this.app.renderView?.();
            this.app.updateCounts?.();
            this.app.renderProjectsDropdown?.();
            this.app.showNotification?.(`Project "${title}" created`);
        }

        // Close modal
        this.closeProjectModal();

        // If we have pending task data, open task modal with new project selected
        if (this.pendingTaskData) {
            this.app.openTaskModal?.(null, newProject?.id || projectId, this.pendingTaskData);
            this.pendingTaskData = null;
        }
    }

    /**
     * Open Gantt chart modal for a project
     * @param {Project} project - Project to show Gantt chart for
     */
    openGanttChart(project) {
        const modal = document.getElementById('gantt-modal');
        const title = document.getElementById('gantt-modal-title');
        title.textContent = `${project.title} - Gantt Chart`;

        modal.classList.add('active');
        this.renderGanttChart(project);
    }

    /**
     * Close Gantt chart modal
     */
    closeGanttModal() {
        document.getElementById('gantt-modal').classList.remove('active');
    }

    /**
     * Render Gantt chart for a project
     * @param {Project} project - Project to render Gantt chart for
     */
    renderGanttChart(project) {
        const container = document.getElementById('gantt-chart');
        if (!container) return;

        // Get all tasks for this project (including completed ones)
        const projectTasks = this.app.tasks?.filter(t => t.projectId === project.id) || [];

        if (projectTasks.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-project-diagram" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Tasks in This Project</h3>
                    <p>Add tasks to this project to see their dependencies.</p>
                </div>
            `;
            return;
        }

        // Calculate dependency levels for tasks
        const taskLevels = {}; // task.id -> level (0 = no dependencies)
        const maxIterations = projectTasks.length + 1;

        // Initialize all tasks at level 0
        projectTasks.forEach(task => {
            taskLevels[task.id] = 0;
        });

        // Calculate levels based on dependencies
        for (let iter = 0; iter < maxIterations; iter++) {
            projectTasks.forEach(task => {
                if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                    const maxDepLevel = Math.max(0, ...task.waitingForTaskIds.map(depId => taskLevels[depId] || 0));
                    if (taskLevels[task.id] < maxDepLevel + 1) {
                        taskLevels[task.id] = maxDepLevel + 1;
                    }
                }
            });
        }

        // Group tasks by level
        const levelGroups = {};
        projectTasks.forEach(task => {
            const level = taskLevels[task.id];
            if (!levelGroups[level]) {
                levelGroups[level] = [];
            }
            levelGroups[level].push(task);
        });

        // Layout parameters
        const taskWidth = 200;
        const taskHeight = 60;
        const horizontalSpacing = 80;
        const verticalSpacing = 100;
        const marginLeft = 50;

        // Calculate dimensions
        const maxLevel = Math.max(...Object.keys(levelGroups).map(Number));
        const maxTasksInLevel = Math.max(...Object.values(levelGroups).map(tasks => tasks.length));
        const canvasWidth = marginLeft + (maxTasksInLevel * (taskWidth + horizontalSpacing));
        const canvasHeight = (maxLevel + 1) * (taskHeight + verticalSpacing) + 100;

        // Build SVG
        let svgHtml = `
            <svg width="${canvasWidth}" height="${canvasHeight}" style="overflow-x: auto;">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                </defs>
        `;

        // Render tasks and connections
        const taskPositions = {}; // task.id -> {x, y}
        let yPos = 50;

        Object.keys(levelGroups).sort((a, b) => a - b).forEach(level => {
            const tasks = levelGroups[level];
            const rowWidth = tasks.length * (taskWidth + horizontalSpacing) - horizontalSpacing;
            let xPos = marginLeft;

            tasks.forEach(task => {
                taskPositions[task.id] = { x: xPos, y: yPos, width: taskWidth, height: taskHeight };

                // Task rectangle
                const completedClass = task.completed ? 'completed' : '';
                const statusColor = task.status === 'next' ? '#48bb78' :
                                   task.status === 'waiting' ? '#ed8936' :
                                   task.status === 'someday' ? '#9f7aea' :
                                   '#4299e1';

                svgHtml += `
                    <g class="task-node ${completedClass}" data-task-id="${task.id}">
                        <rect x="${xPos}" y="${yPos}" width="${taskWidth}" height="${taskHeight}"
                              fill="${statusColor}" stroke="#2d3748" stroke-width="2" rx="4"/>
                        <text x="${xPos + taskWidth/2}" y="${yPos + 20}" text-anchor="middle"
                              fill="white" font-size="12" font-weight="500">${this.escapeHtml(task.title)}</text>
                        <text x="${xPos + taskWidth/2}" y="${yPos + 40}" text-anchor="middle"
                              fill="rgba(255,255,255,0.9)" font-size="10">${task.status}</text>
                    </g>
                `;

                xPos += taskWidth + horizontalSpacing;
            });

            yPos += taskHeight + verticalSpacing;
        });

        // Render dependency arrows
        projectTasks.forEach(task => {
            if (task.waitingForTaskIds && task.waitingForTaskIds.length > 0) {
                const targetPos = taskPositions[task.id];
                if (!targetPos) return;

                task.waitingForTaskIds.forEach(depId => {
                    const sourcePos = taskPositions[depId];
                    if (!sourcePos) return;

                    const startX = sourcePos.x + sourcePos.width / 2;
                    const startY = sourcePos.y + sourcePos.height;
                    const endX = targetPos.x + targetPos.width / 2;
                    const endY = targetPos.y;

                    // Draw curved arrow
                    const midY = (startY + endY) / 2;
                    svgHtml += `
                        <path d="M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}"
                              fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrowhead)"/>
                    `;
                });
            }
        });

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
