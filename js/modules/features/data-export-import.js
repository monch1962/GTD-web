/**
 * Data Export/Import module
 * Handles exporting and importing GTD data to/from JSON files
 */

import { Task } from '../../models.js';
import { Project } from '../../models.js';

export class DataExportImportManager {
    constructor(state, app) {
        this.state = state;
        this.app = app;
    }

    /**
     * Setup event listeners for export and import buttons
     */
    setupDataExportImport() {
        const exportBtn = document.getElementById('btn-export');
        const importBtn = document.getElementById('btn-import');
        const fileInput = document.getElementById('import-file-input');

        if (!exportBtn || !importBtn || !fileInput) return;

        // Export functionality
        exportBtn.addEventListener('click', () => {
            this.exportData();
        });

        // Import functionality
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importData(file);
                // Reset file input so same file can be selected again if needed
                fileInput.value = '';
            }
        });
    }

    /**
     * Export all GTD data to a JSON file
     */
    exportData() {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                tasks: this.app.tasks?.map(task => task.toJSON()) || [],
                projects: this.app.projects?.map(project => project.toJSON()) || [],
                customContexts: JSON.parse(localStorage.getItem('gtd_custom_contexts') || '[]'),
                usageStats: this.app.usageStats || {}
            };

            // Create a blob and download
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            const now = new Date();
            const timestamp = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0') + '-' +
                String(now.getHours()).padStart(2, '0') + '-' +
                String(now.getMinutes()).padStart(2, '0') + '-' +
                String(now.getSeconds()).padStart(2, '0');
            link.href = url;
            link.download = `gtd-backup-${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            this.app.showSuccess('Data exported successfully! File downloaded.');
        } catch (error) {
            console.error('Export failed:', error);
            this.app.showError('Failed to export data. Please try again.');
        }
    }

    /**
     * Import GTD data from a JSON file
     * @param {File} file - The file to import
     */
    async importData(file) {
        try {
            // Confirm import with user
            const confirmMsg = 'This will replace all your current GTD data with the imported data.\n\n' +
                              'Are you sure you want to continue?';
            if (!confirm(confirmMsg)) {
                return;
            }

            // Read file
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importData = JSON.parse(e.target.result);

                    // Validate import data
                    if (!importData.tasks || !Array.isArray(importData.tasks)) {
                        throw new Error('Invalid import file: missing or invalid tasks array');
                    }
                    if (!importData.projects || !Array.isArray(importData.projects)) {
                        throw new Error('Invalid import file: missing or invalid projects array');
                    }

                    // Clear existing data
                    if (this.app.tasks) this.app.tasks = [];
                    if (this.app.projects) this.app.projects = [];

                    // Import tasks
                    importData.tasks.forEach(taskData => {
                        const task = new Task(taskData);
                        this.app.tasks?.push(task);
                    });

                    // Import projects
                    importData.projects.forEach(projectData => {
                        const project = new Project(projectData);
                        this.app.projects?.push(project);
                    });

                    // Import custom contexts if present
                    if (importData.customContexts && Array.isArray(importData.customContexts)) {
                        localStorage.setItem('gtd_custom_contexts', JSON.stringify(importData.customContexts));
                    }

                    // Import usage stats if present
                    if (importData.usageStats && this.app.usageStats !== undefined) {
                        this.app.usageStats = importData.usageStats;
                        this.app.saveUsageStats?.();
                    }

                    // Save to storage
                    await this.app.saveTasks?.();
                    await this.app.saveProjects?.();

                    // Refresh UI
                    this.app.renderView?.();
                    this.app.updateCounts?.();
                    this.app.renderProjectsDropdown?.();
                    this.app.renderCustomContexts?.();
                    this.app.updateQuickAddPlaceholder?.();

                    this.app.showSuccess(`Import successful! Imported ${this.app.tasks?.length || 0} tasks and ${this.app.projects?.length || 0} projects.`);
                } catch (parseError) {
                    console.error('Failed to parse import file:', parseError);
                    this.app.showError('Failed to parse import file. Please make sure it\'s a valid GTD backup file.');
                }
            };

            reader.onerror = () => {
                this.app.showError('Failed to read file. Please try again.');
            };

            reader.readAsText(file);
        } catch (error) {
            console.error('Import failed:', error);
            this.app.showError('Failed to import data. Please try again.');
        }
    }
}
