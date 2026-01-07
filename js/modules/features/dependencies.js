/**
 * Dependencies module
 * Handles task dependency visualization and analysis
 */

import { escapeHtml } from '../../dom-utils.js';

export class DependenciesManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
        this.depsCurrentView = 'graph';
    }

    /**
     * Setup dependencies visualization
     */
    setupDependenciesVisualization() {
        // Button to open dependencies modal
        const depsBtn = document.getElementById('btn-dependencies');
        if (depsBtn) {
            depsBtn.addEventListener('click', () => {
                this.openDependenciesModal();
            });
        }

        // Close modal
        const closeBtn = document.getElementById('close-dependencies-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeDependenciesModal();
            });
        }

        // View toggle buttons
        const graphViewBtn = document.getElementById('deps-view-graph');
        const chainsViewBtn = document.getElementById('deps-view-chains');
        const criticalViewBtn = document.getElementById('deps-view-critical');

        if (graphViewBtn) {
            graphViewBtn.addEventListener('click', () => {
                this.depsCurrentView = 'graph';
                this.updateDepsViewButtons();
                this.renderDependenciesView();
            });
        }

        if (chainsViewBtn) {
            chainsViewBtn.addEventListener('click', () => {
                this.depsCurrentView = 'chains';
                this.updateDepsViewButtons();
                this.renderDependenciesView();
            });
        }

        if (criticalViewBtn) {
            criticalViewBtn.addEventListener('click', () => {
                this.depsCurrentView = 'critical';
                this.updateDepsViewButtons();
                this.renderDependenciesView();
            });
        }

        // Project filter
        const projectFilter = document.getElementById('deps-filter-project');
        if (projectFilter) {
            projectFilter.addEventListener('change', () => this.renderDependenciesView());
        }

        // Initialize state
        this.depsCurrentView = 'graph';
    }

    /**
     * Populate dependencies project filter
     */
    populateDepsProjectFilter() {
        const projectFilter = document.getElementById('deps-filter-project');
        if (!projectFilter) return;

        // Keep "All Projects" option
        projectFilter.innerHTML = '<option value="">All Projects</option>';

        // Add active projects
        this.state.projects
            .filter(p => p.status === 'active')
            .forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.title;
                projectFilter.appendChild(option);
            });
    }

    /**
     * Open dependencies modal
     */
    openDependenciesModal() {
        const modal = document.getElementById('dependencies-modal');
        if (modal) {
            this.populateDepsProjectFilter();
            modal.classList.add('active');
            this.renderDependenciesView();
        }
    }

    /**
     * Close dependencies modal
     */
    closeDependenciesModal() {
        const modal = document.getElementById('dependencies-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Update dependencies view buttons
     */
    updateDepsViewButtons() {
        const buttons = {
            'graph': document.getElementById('deps-view-graph'),
            'chains': document.getElementById('deps-view-chains'),
            'critical': document.getElementById('deps-view-critical')
        };

        Object.keys(buttons).forEach(view => {
            const btn = buttons[view];
            if (btn) {
                if (view === this.depsCurrentView) {
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-primary');
                } else {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-secondary');
                }
            }
        });
    }

    /**
     * Render dependencies view
     */
    renderDependenciesView() {
        const projectFilter = document.getElementById('deps-filter-project');
        const projectId = projectFilter ? projectFilter.value : '';
        const tasks = this.getDependenciesTasks(projectId);

        // Update stats
        this.updateDepsStats(tasks);

        // Render based on current view
        const container = document.getElementById('deps-content');
        if (!container) return;

        switch (this.depsCurrentView) {
            case 'graph':
                this.renderDependencyGraph(tasks, container);
                break;
            case 'chains':
                this.renderDependencyChains(tasks, container);
                break;
            case 'critical':
                this.renderCriticalPath(tasks, container);
                break;
        }
    }

    /**
     * Get tasks with dependencies
     */
    getDependenciesTasks(projectId) {
        let tasks = this.state.tasks.filter(t => !t.completed);

        if (projectId) {
            tasks = tasks.filter(t => t.projectId === projectId);
        }

        return tasks;
    }

    /**
     * Update dependencies statistics
     */
    updateDepsStats(tasks) {
        const totalTasks = tasks.length;
        const withDeps = tasks.filter(t => t.waitingForTaskIds && t.waitingForTaskIds.length > 0).length;
        const blocked = tasks.filter(t => !t.areDependenciesMet(this.state.tasks)).length;
        const ready = tasks.filter(t => t.areDependenciesMet(this.state.tasks) && t.status !== 'completed').length;

        const totalEl = document.getElementById('deps-total-tasks');
        const withDepsEl = document.getElementById('deps-with-deps');
        const blockedEl = document.getElementById('deps-blocked');
        const readyEl = document.getElementById('deps-ready');

        if (totalEl) totalEl.textContent = totalTasks;
        if (withDepsEl) withDepsEl.textContent = withDeps;
        if (blockedEl) blockedEl.textContent = blocked;
        if (readyEl) readyEl.textContent = ready;
    }

    /**
     * Render dependency graph view
     */
    renderDependencyGraph(tasks, container) {
        const tasksWithDeps = tasks.filter(t => t.waitingForTaskIds && t.waitingForTaskIds.length > 0);

        if (tasksWithDeps.length === 0) {
            container.innerHTML = `
                <div class="deps-empty-state">
                    <i class="fas fa-project-diagram"></i>
                    <h3>No Dependencies Found</h3>
                    <p>Tasks with dependencies will appear here. You can set task dependencies in the task edit modal.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="dependency-graph" id="dependency-graph">
                <svg class="dependency-lines" id="dependency-lines"></svg>
                <div id="dependency-nodes"></div>
            </div>
        `;

        const nodesContainer = document.getElementById('dependency-nodes');
        const linesContainer = document.getElementById('dependency-lines');

        // Calculate node positions using a simple layered layout
        const nodePositions = this.calculateNodePositions(tasksWithDeps);

        // Render nodes
        tasksWithDeps.forEach(task => {
            const pos = nodePositions[task.id];
            if (!pos) return;

            const isBlocked = !task.areDependenciesMet(this.state.tasks);
            const nodeClass = `dependency-node ${isBlocked ? 'blocked' : 'ready'}`;

            const node = document.createElement('div');
            node.className = nodeClass;
            node.style.left = `${pos.x}px`;
            node.style.top = `${pos.y}px`;
            node.innerHTML = `
                <div class="dependency-node-title">${escapeHtml(task.title)}</div>
                <div class="dependency-node-meta">
                    ${task.waitingForTaskIds.length} dependenc${task.waitingForTaskIds.length > 1 ? 'ies' : 'y'}
                </div>
            `;
            node.addEventListener('click', () => this.app.openTaskModal?.(task));
            nodesContainer.appendChild(node);
        });

        // Render connection lines
        setTimeout(() => {
            this.renderDependencyLines(tasksWithDeps, nodePositions, linesContainer);
        }, 100);
    }

    /**
     * Calculate node positions for dependency graph
     */
    calculateNodePositions(tasks) {
        const positions = {};
        const levels = {};
        const levelGroups = {};

        // Calculate levels for each task (topological sort)
        tasks.forEach(task => {
            levels[task.id] = this.calculateTaskLevel(task, tasks);
        });

        // Group by levels
        tasks.forEach(task => {
            const level = levels[task.id];
            if (!levelGroups[level]) {
                levelGroups[level] = [];
            }
            levelGroups[level].push(task);
        });

        // Calculate positions
        const nodeWidth = 180;
        const nodeHeight = 80;
        const horizontalGap = 40;
        const verticalGap = 120;
        let maxWidth = 0;

        Object.keys(levelGroups).sort((a, b) => a - b).forEach(level => {
            const tasksInLevel = levelGroups[level];
            const levelWidth = tasksInLevel.length * (nodeWidth + horizontalGap);
            maxWidth = Math.max(maxWidth, levelWidth);

            tasksInLevel.forEach((task, index) => {
                const x = index * (nodeWidth + horizontalGap) + (maxWidth - levelWidth) / 2;
                const y = level * (nodeHeight + verticalGap) + 50;
                positions[task.id] = { x, y };
            });
        });

        return positions;
    }

    /**
     * Calculate task level in dependency hierarchy
     */
    calculateTaskLevel(task, allTasks) {
        if (!task.waitingForTaskIds || task.waitingForTaskIds.length === 0) {
            return 0;
        }

        const dependencies = task.waitingForTaskIds
            .map(id => allTasks.find(t => t.id === id))
            .filter(t => t && !t.completed);

        if (dependencies.length === 0) {
            return 0;
        }

        const depLevels = dependencies.map(dep => this.calculateTaskLevel(dep, allTasks));
        return Math.max(...depLevels) + 1;
    }

    /**
     * Render dependency connection lines
     */
    renderDependencyLines(tasks, positions, container) {
        const graphContainer = document.getElementById('dependency-graph');
        if (!graphContainer) return;

        const rect = graphContainer.getBoundingClientRect();
        container.setAttribute('width', rect.width);
        container.setAttribute('height', Math.max(rect.height, 600));

        let linesHTML = '';
        tasks.forEach(task => {
            const targetPos = positions[task.id];
            if (!targetPos) return;

            if (task.waitingForTaskIds) {
                task.waitingForTaskIds.forEach(depId => {
                    const depTask = this.state.tasks.find(t => t.id === depId);
                    if (!depTask) return;

                    const sourcePos = positions[depId];
                    if (!sourcePos) return;

                    // Calculate line coordinates (center of nodes)
                    const x1 = sourcePos.x + 90; // Half of node width
                    const y1 = sourcePos.y + 40; // Half of node height
                    const x2 = targetPos.x + 90;
                    const y2 = targetPos.y + 40;

                    // Create curved path
                    const midY = (y1 + y2) / 2;
                    const pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

                    const isBlocked = !depTask.completed;
                    const lineClass = `dependency-line ${isBlocked ? 'blocked' : 'completed'}`;

                    linesHTML += `<path class="${lineClass}" d="${pathData}"/>`;
                });
            }
        });

        container.innerHTML = linesHTML;
    }

    /**
     * Render dependency chains view
     */
    renderDependencyChains(tasks, container) {
        const chains = this.buildDependencyChains(tasks);

        if (chains.length === 0) {
            container.innerHTML = `
                <div class="deps-empty-state">
                    <i class="fas fa-stream"></i>
                    <h3>No Dependency Chains Found</h3>
                    <p>Tasks with sequential dependencies will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="dependency-chains">
                ${chains.map(chain => this.renderChain(chain)).join('')}
            </div>
        `;
    }

    /**
     * Build dependency chains
     */
    buildDependencyChains(tasks) {
        const visited = new Set();
        const chains = [];

        const buildChain = (task, currentChain = []) => {
            if (visited.has(task.id)) {
                if (currentChain.length > 1) {
                    chains.push([...currentChain]);
                }
                return;
            }

            visited.add(task.id);
            currentChain.push(task);

            // Find tasks that depend on this task
            const dependents = tasks.filter(t =>
                t.waitingForTaskIds && t.waitingForTaskIds.includes(task.id)
            );

            if (dependents.length === 0) {
                if (currentChain.length > 1) {
                    chains.push([...currentChain]);
                }
            } else {
                dependents.forEach(dep => buildChain(dep, currentChain));
            }

            currentChain.pop();
        };

        // Start from tasks with no dependencies (root nodes)
        tasks.filter(t => !t.waitingForTaskIds || t.waitingForTaskIds.length === 0).forEach(task => {
            if (!visited.has(task.id)) {
                buildChain(task);
            }
        });

        return chains.sort((a, b) => b.length - a.length);
    }

    /**
     * Render a single dependency chain
     */
    renderChain(chain) {
        const firstUncompleted = chain.findIndex(t => !t.completed);

        return `
            <div class="dependency-chain">
                <div class="dependency-chain-header">
                    <span class="dependency-chain-title">
                        ${escapeHtml(chain[0].title)} → ${escapeHtml(chain[chain.length - 1].title)}
                    </span>
                    <span class="dependency-chain-length">${chain.length} tasks</span>
                </div>
                <div class="dependency-chain-items">
                    ${chain.map((task, index) => {
                        let itemClass = 'dependency-chain-item';
                        if (task.completed) itemClass += ' completed';
                        else if (index === firstUncompleted) itemClass += ' current';

                        return `
                            <div class="${itemClass}" onclick="app.openTaskModal?.(app.tasks.find(t => t.id === '${task.id}'))">
                                <div style="font-weight: 600; margin-bottom: 4px;">
                                    ${index + 1}. ${escapeHtml(task.title)}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                                    ${task.completed ? '✓ Completed' : task.areDependenciesMet(this.state.tasks) ? 'Ready to start' : 'Blocked'}
                                </div>
                            </div>
                            ${index < chain.length - 1 ? '<div class="dependency-chain-arrow">→</div>' : ''}
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render critical path view
     */
    renderCriticalPath(tasks, container) {
        const criticalPath = this.calculateCriticalPath(tasks);

        if (criticalPath.length === 0) {
            container.innerHTML = `
                <div class="deps-empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No Critical Path Found</h3>
                    <p>The critical path shows the longest chain of dependent tasks that determines project duration.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="critical-path">
                <div class="critical-path-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span class="critical-path-title">Critical Path</span>
                </div>
                <div class="critical-path-timeline">
                    ${criticalPath.map((task, index) => `
                        <div class="critical-path-item ${task.completed ? 'completed' : ''}" style="position: relative;">
                            ${index < criticalPath.length - 1 ? '<div class="critical-path-connector"></div>' : ''}
                            <div class="critical-path-item-title">${escapeHtml(task.title)}</div>
                            <div class="critical-path-item-meta">
                                ${task.completed ? '✓ Completed' : `⏱️ ${task.time || 0} min • Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}`}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Calculate critical path using longest path algorithm
     */
    calculateCriticalPath(tasks) {
        // Build dependency graph
        const graph = {};
        const inDegree = {};

        tasks.forEach(task => {
            graph[task.id] = [];
            inDegree[task.id] = 0;
        });

        tasks.forEach(task => {
            if (task.waitingForTaskIds) {
                task.waitingForTaskIds.forEach(depId => {
                    if (graph[depId]) {
                        graph[depId].push(task);
                        inDegree[task.id]++;
                    }
                });
            }
        });

        // Find all paths and return the longest one
        const allPaths = [];
        const visited = new Set();

        const dfs = (taskId, path) => {
            visited.add(taskId);
            const task = tasks.find(t => t.id === taskId);
            if (task) path.push(task);

            const dependents = graph[taskId] || [];
            if (dependents.length === 0) {
                if (path.length > 1) {
                    allPaths.push([...path]);
                }
            } else {
                dependents.forEach(dep => {
                    if (!visited.has(dep.id)) {
                        dfs(dep.id, path);
                    }
                });
            }

            path.pop();
            visited.delete(taskId);
        };

        // Start from root nodes (no incoming edges)
        tasks.filter(t => inDegree[t.id] === 0).forEach(task => {
            dfs(task.id, []);
        });

        // Return the longest path
        if (allPaths.length === 0) return [];
        return allPaths.sort((a, b) => b.length - a.length)[0];
    }

    /**
     * Get current dependencies view
     * @returns {string} Current view mode
     */
    getCurrentView() {
        return this.depsCurrentView;
    }

    /**
     * Set dependencies view
     * @param {string} view - View to set
     */
    setCurrentView(view) {
        this.depsCurrentView = view;
        this.updateDepsViewButtons();
        this.renderDependenciesView();
    }

    /**
     * Get statistics about dependencies
     * @param {string} projectId - Optional project filter
     * @returns {Object} Dependencies statistics
     */
    getDependencyStats(projectId = null) {
        const tasks = this.getDependenciesTasks(projectId);
        const totalTasks = tasks.length;
        const withDeps = tasks.filter(t => t.waitingForTaskIds && t.waitingForTaskIds.length > 0).length;
        const blocked = tasks.filter(t => !t.areDependenciesMet(this.state.tasks)).length;
        const ready = tasks.filter(t => t.areDependenciesMet(this.state.tasks) && t.status !== 'completed').length;

        return {
            totalTasks,
            withDeps,
            blocked,
            ready
        };
    }
}
