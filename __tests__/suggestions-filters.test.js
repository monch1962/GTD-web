/**
 * Test: "What Should I Work On?" Filter Functionality
 * Ensure filters in suggestions modal work correctly and auto-update
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Suggestions Modal Filters', () => {
    describe('filter event listeners', () => {
        test('should have change event listeners on all filter selects', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n    \}/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Should get references to all filter selects
            expect(funcBody).toContain("getElementById('suggestion-context')");
            expect(funcBody).toContain("getElementById('suggestion-time')");
            expect(funcBody).toContain("getElementById('suggestion-energy')");

            // Should add event listeners to all filters
            expect(funcBody).toContain('contextSelect.addEventListener');
            expect(funcBody).toContain('timeSelect.addEventListener');
            expect(funcBody).toContain('energySelect.addEventListener');

            // Should listen for 'change' events
            expect(funcBody).toContain("'change'");
        });

        test('should auto-update suggestions when filters change', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n    \}/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Should have a function to update suggestions
            expect(funcBody).toContain('updateSuggestions');
            expect(funcBody).toContain('this.renderSuggestions()');

            // All three filters should call updateSuggestions on change
            const updatePattern = /addEventListener\(['"]change['"],\s*updateSuggestions\)/g;
            const matches = funcBody.match(updatePattern);

            expect(matches).toBeTruthy();
            expect(matches.length).toBeGreaterThanOrEqual(3); // At least 3 filters
        });

        test('should have refresh button that also updates', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n    \}/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Should have refresh button
            expect(funcBody).toContain("getElementById('refresh-suggestions')");

            // Refresh button should also trigger update
            expect(funcBody).toContain('refreshBtn.addEventListener');
        });
    });

    describe('filter values are passed to getSmartSuggestions', () => {
        test('should read filter values from DOM', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find the renderSuggestions function
            const funcMatch = appContent.match(/renderSuggestions\(\)\s*\{[\s\S]*?\n    \}/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Should get values from all three filters
            expect(funcBody).toContain("getElementById('suggestion-context').value");
            expect(funcBody).toContain("getElementById('suggestion-time').value");
            expect(funcBody).toContain("getElementById('suggestion-energy').value");
        });

        test('should pass filter values to getSmartSuggestions', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find the renderSuggestions function
            const funcMatch = appContent.match(/renderSuggestions\(\)\s*\{[\s\S]*?\n    \}/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Should call getSmartSuggestions with filter values
            expect(funcBody).toContain('this.getSmartSuggestions({');
            expect(funcBody).toContain('context,');
            expect(funcBody).toContain('availableMinutes:');
            expect(funcBody).toContain('energyLevel');
        });
    });

    describe('getSmartSuggestions uses filters correctly', () => {
        test('should accept and use context parameter', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find getSmartSuggestions function definition (not calls to it)
            const funcMatch = appContent.match(/getSmartSuggestions\(preferences[\s\S]*?\)\s*\{[\s\S]*?candidateTasks = this\.tasks/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Should destructure preferences parameter with context
            expect(funcBody).toContain('context =');
            expect(funcBody).toContain('energyLevel =');
            expect(funcBody).toContain('availableMinutes =');
        });

        test('should filter tasks by context with score boost', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find getSmartSuggestions function - search for context matching logic
            const contextMatch = appContent.match(/Context match[\s\S]*?if\s*\(context\s*&&[\s\S]*?includes\(context\)/);
            expect(contextMatch).toBeTruthy();

            const logic = contextMatch[0];

            // Should check if task contexts include the filter context
            expect(logic).toContain('task.contexts');
            expect(logic).toContain('includes(context)');
        });

        test('should filter tasks by energy level with score boost', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find getSmartSuggestions function - search for energy matching logic
            const energyMatch = appContent.match(/Energy level match[\s\S]*?if\s*\(energyLevel[\s\S]*?Matches your energy level/);
            expect(energyMatch).toBeTruthy();

            const logic = energyMatch[0];

            // Should check if task energy matches filter
            expect(logic).toContain('task.energy');
            expect(logic).toContain('energyLevel');
            expect(logic).toContain('Matches your energy level');
        });

        test('should filter tasks by available time', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find getSmartSuggestions function - search for time matching logic
            const timeMatch = appContent.match(/Time available match[\s\S]*?Fits your available time/);
            expect(timeMatch).toBeTruthy();

            const logic = timeMatch[0];

            // Should check if availableMinutes is provided
            expect(logic).toContain('availableMinutes');
            expect(logic).toContain('task.time');
            expect(logic).toContain('Fits your available time');
        });
    });

    describe('regression tests', () => {
        test('should not have filters without event listeners', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n    \}/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Extract the event listener setup section
            const eventListenerSection = funcBody.substring(
                funcBody.indexOf('Setup event listeners'),
                funcBody.indexOf('Initial render')
            );

            // Should have addEventListener for context
            expect(eventListenerSection).toMatch(/contextSelect\.addEventListener\(['"]change['"]/);

            // Should have addEventListener for time
            expect(eventListenerSection).toMatch(/timeSelect\.addEventListener\(['"]change['"]/);

            // Should have addEventListener for energy
            expect(eventListenerSection).toMatch(/energySelect\.addEventListener\(['"]change['"]/);
        });

        test('all filters should trigger renderSuggestions', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n    \}/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Count how many times updateSuggestions is used
            const updateCalls = (funcBody.match(/updateSuggestions/g) || []).length;

            // Should have updateSuggestions defined
            expect(funcBody).toContain('const updateSuggestions = () => this.renderSuggestions();');

            // Should be used multiple times (3 filters + button)
            expect(updateCalls).toBeGreaterThanOrEqual(4);
        });

        test('should not rely only on manual button click', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            // Find the showSuggestions function
            const funcMatch = appContent.match(/showSuggestions\(\)\s*\{[\s\S]*?\n    \}/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Should have change event listeners
            expect(funcBody).toContain("'change'");

            // Number of change listeners should be >= number of filters
            const changeListeners = (funcBody.match(/'change'/g) || []).length;
            expect(changeListeners).toBeGreaterThanOrEqual(3);
        });
    });

    describe('filter behavior', () => {
        test('context filter should boost matching tasks', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            const contextMatch = appContent.match(/Context match[\s\S]*?reasons\.push/);
            expect(contextMatch).toBeTruthy();

            const logic = contextMatch[0];

            // Should check if task contexts include the filter context
            expect(logic).toContain('task.contexts');
            expect(logic).toContain('context');

            // Should add score boost
            expect(logic).toContain('score +=');
        });

        test('energy filter should boost matching tasks', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            const energyMatch = appContent.match(/Energy level match[\s\S]*?reasons\.push/);
            expect(energyMatch).toBeTruthy();

            const logic = energyMatch[0];

            // Should check if task energy matches filter
            expect(logic).toContain('task.energy');
            expect(logic).toContain('energyLevel');

            // Should add score boost
            expect(logic).toContain('score +=');
        });

        test('time filter should handle available time', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            const timeMatch = appContent.match(/Time available match[\s\S]*?Fits your available time/);
            expect(timeMatch).toBeTruthy();

            const logic = timeMatch[0];

            // Should check available time
            expect(logic).toContain('availableMinutes');
            expect(logic).toContain('task.time');

            // Should add reason about fitting time
            expect(logic).toContain('Fits your available time');
        });

        test('empty filter values should not filter out tasks', () => {
            const appPath = path.join(__dirname, '..', 'js', 'app.js');
            const appContent = fs.readFileSync(appPath, 'utf-8');

            const funcMatch = appContent.match(/getSmartSuggestions\(preferences[\s\S]*?\)\s*\{[\s\S]*?candidateTasks = this\.tasks/);
            expect(funcMatch).toBeTruthy();

            const funcBody = funcMatch[0];

            // Should have default values for filters
            expect(funcBody).toContain('context =');
            expect(funcBody).toContain('energyLevel =');
            expect(funcBody).toContain('availableMinutes =');
        });
    });
});
