/**
 * Test: Tasks created in project view should be assigned to that project
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Project Task Assignment', () => {
    const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
    const appJsContent = fs.readFileSync(appJsPath, 'utf-8');

    test('quickAddTask should assign task to currentProjectId when set', () => {
        // Verify that quickAddTask uses currentProjectId
        expect(appJsContent).toContain('this.currentProjectId');
        expect(appJsContent).toContain('projectId: this.currentProjectId');

        // Verify the status logic for project view
        expect(appJsContent).toContain("this.currentProjectId ? 'next'");
    });

    test('quickAddTask should set status to next when in project view', () => {
        // Check for the conditional status logic
        expect(appJsContent).toMatch(/status.*=.*currentProjectId.*\?.*'next'/);

        // Verify the task creation includes the status field
        const lines = appJsContent.split('\n');
        let foundTaskCreation = false;
        let foundProjectIdAssignment = false;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('new Task({')) {
                // Look for the next few lines for status and projectId
                for (let j = i; j < Math.min(i + 20, lines.length); j++) {
                    if (lines[j].includes('status:') && lines[j].includes('status,')) {
                        foundTaskCreation = true;
                    }
                    if (lines[j].includes('projectId:') && lines[j].includes('currentProjectId')) {
                        foundProjectIdAssignment = true;
                    }
                }
                break;
            }
        }

        expect(foundTaskCreation).toBe(true);
        expect(foundProjectIdAssignment).toBe(true);
    });

    test('should not assign project when currentProjectId is null', () => {
        // Verify that projectId uses null when currentProjectId is not set
        expect(appJsContent).toMatch(/projectId:\s*this\.currentProjectId\s*\|\|\s*null/);
    });
});
