/**
 * Test: Templates System
 * Verify that templates functionality works correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Templates System', () => {
    const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
    const indexHtmlPath = path.join(__dirname, '..', 'index.html');
    const appJsContent = fs.readFileSync(appJsPath, 'utf-8');
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

    test('should have Save as Template in context menu', () => {
        expect(indexHtmlContent).toContain('data-action="save-as-template"');
        expect(indexHtmlContent).toContain('Save as Template');
    });

    test('should have icon for Save as Template menu item', () => {
        expect(indexHtmlContent).toMatch(/data-action="save-as-template"[\s\S]*?fa-file-alt/);
    });

    test('should have saveTaskAsTemplate method', () => {
        expect(appJsContent).toContain('saveTaskAsTemplate(');
        expect(appJsContent).toContain('async saveTaskAsTemplate(taskId)');
    });

    test('should handle save-as-template action in context menu handler', () => {
        expect(appJsContent).toContain("case 'save-as-template':");
        expect(appJsContent).toContain('this.saveTaskAsTemplate(taskId)');
    });

    test('should populate template form from task data', () => {
        expect(appJsContent).toContain("document.getElementById('template-title').value = task.title");
        expect(appJsContent).toContain("document.getElementById('template-description').value = task.description");
        expect(appJsContent).toContain("document.getElementById('template-energy').value = task.energy");
    });

    test('should copy task contexts to template', () => {
        expect(appJsContent).toContain('this.renderTemplateContexts(task.contexts');
    });

    test('should copy task subtasks to template', () => {
        expect(appJsContent).toContain('this.renderTemplateSubtasks(task.subtasks');
    });

    test('should open template edit modal when saving task as template', () => {
        expect(appJsContent).toContain('this.openTemplateEditModal()');
    });

    test('should show notification when template is pre-filled', () => {
        expect(appJsContent).toMatch(/Template pre-filled from task/);
    });

    test('should open templates modal after saving template', () => {
        // After saving a template, the templates list modal should open
        expect(appJsContent).toMatch(/this\.openTemplatesModal\(\)/);
    });
});
