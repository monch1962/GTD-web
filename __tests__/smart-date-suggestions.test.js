/**
 * Comprehensive Tests for Smart Date Suggestions Feature
 */

import { SmartDateSuggestionsManager } from '../js/modules/features/smart-date-suggestions.js';
import { GTDApp } from '../js/app.js';

describe('SmartDateSuggestionsManager - Natural Language Date Parsing', () => {
    let manager;
    let mockState;
    let mockApp;

    beforeEach(() => {
        // Create mock state and app
        mockState = {
            tasks: [],
            projects: []
        };

        mockApp = new GTDApp();
        manager = new SmartDateSuggestionsManager(mockState, mockApp);
    });

    describe('parseNaturalDate() - Relative Date Patterns', () => {
        test('should parse "in X days" pattern', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = manager.parseNaturalDate('in 3 days');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('In 3 days');
            expect(result[0].date).toBeDefined();

            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() + 3);
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0]);
        });

        test('should parse "in 1 day" (singular)', () => {
            const result = manager.parseNaturalDate('in 1 day');
            expect(result[0].text).toBe('In 1 day');
        });

        test('should parse "in X weeks" pattern', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = manager.parseNaturalDate('in 2 weeks');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('In 2 weeks');

            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() + 14);
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0]);
        });

        test('should parse "in 1 week" (singular)', () => {
            const result = manager.parseNaturalDate('in 1 week');
            expect(result[0].text).toBe('In 1 week');
        });

        test('should parse "in X months" pattern', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = manager.parseNaturalDate('in 3 months');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('In 3 months');

            const expectedDate = new Date(today);
            expectedDate.setMonth(today.getMonth() + 3);
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0]);
        });

        test('should parse "tomorrow"', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = manager.parseNaturalDate('tomorrow');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Tomorrow');

            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() + 1);
            expect(result[0].date).toBe(expectedDate.toISOString().split('T')[0]);
        });
    });

    describe('parseNaturalDate() - Weekday Patterns', () => {
        test('should parse "next week" (next Monday)', () => {
            const result = manager.parseNaturalDate('next week');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Next week (Monday)');
            expect(result[0].date).toBeDefined();
        });

        test('should parse "next monday"', () => {
            const result = manager.parseNaturalDate('next monday');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Next Monday');
        });

        test('should parse "next tuesday"', () => {
            const result = manager.parseNaturalDate('next tuesday');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Next Tuesday');
        });

        test('should parse all weekdays (wednesday, thursday, friday, saturday, sunday)', () => {
            const weekdays = ['wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

            weekdays.forEach(day => {
                const result = manager.parseNaturalDate(`next ${day}`);
                expect(result).toHaveLength(1);
                expect(result[0].text).toBe(`Next ${day.charAt(0).toUpperCase() + day.slice(1)}`);
            });
        });

        test('should parse "this week"', () => {
            const result = manager.parseNaturalDate('this week');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('This week');
        });

        test('should parse "this monday"', () => {
            const result = manager.parseNaturalDate('this monday');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('This Monday');
        });

        test('should parse all weekdays for "this" pattern', () => {
            const weekdays = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

            weekdays.forEach(day => {
                const result = manager.parseNaturalDate(`this ${day}`);
                expect(result).toHaveLength(1);
                expect(result[0].text).toBe(`This ${day.charAt(0).toUpperCase() + day.slice(1)}`);
            });
        });
    });

    describe('parseNaturalDate() - Month Boundaries', () => {
        test('should parse "end of month"', () => {
            const result = manager.parseNaturalDate('end of month');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('End of month');
        });

        test('should parse "eom" abbreviation', () => {
            const fullResult = manager.parseNaturalDate('end of month');
            const abbrResult = manager.parseNaturalDate('eom');

            expect(fullResult[0].date).toBe(abbrResult[0].date);
        });

        test('should parse "end of week"', () => {
            const result = manager.parseNaturalDate('end of week');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('End of week (Sunday)');
        });

        test('should parse "eow" abbreviation', () => {
            const fullResult = manager.parseNaturalDate('end of week');
            const abbrResult = manager.parseNaturalDate('eow');

            expect(fullResult[0].date).toBe(abbrResult[0].date);
        });

        test('should parse "start of month"', () => {
            const result = manager.parseNaturalDate('start of month');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Start of month');
        });

        test('should parse "som" abbreviation', () => {
            const fullResult = manager.parseNaturalDate('start of month');
            const abbrResult = manager.parseNaturalDate('som');

            expect(fullResult[0].date).toBe(abbrResult[0].date);
        });

        test('should parse "start of week"', () => {
            const result = manager.parseNaturalDate('start of week');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Start of week (Monday)');
        });

        test('should parse "sow" abbreviation', () => {
            const fullResult = manager.parseNaturalDate('start of week');
            const abbrResult = manager.parseNaturalDate('sow');

            expect(fullResult[0].date).toBe(abbrResult[0].date);
        });
    });

    describe('parseNaturalDate() - Case Insensitivity', () => {
        test('should handle mixed case input', () => {
            const result1 = manager.parseNaturalDate('TOMORROW');
            const result2 = manager.parseNaturalDate('ToMoRrOw');
            const result3 = manager.parseNaturalDate('tomorrow');

            expect(result1[0].date).toBe(result2[0].date);
            expect(result2[0].date).toBe(result3[0].date);
        });

        test('should handle uppercase pattern input', () => {
            const result = manager.parseNaturalDate('IN 5 DAYS');

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('In 5 days');
        });
    });

    describe('parseNaturalDate() - Edge Cases', () => {
        test('should return empty array for unrecognized input', () => {
            const result = manager.parseNaturalDate('gibberish input');

            expect(result).toEqual([]);
        });

        test('should return empty array for empty string', () => {
            const result = manager.parseNaturalDate('');

            expect(result).toEqual([]);
        });

        test('should return empty array for whitespace only', () => {
            const result = manager.parseNaturalDate('   ');

            expect(result).toEqual([]);
        });

        test('should handle extra whitespace in patterns', () => {
            const result1 = manager.parseNaturalDate('in 3 days');
            const result2 = manager.parseNaturalDate('in  3  days');

            // The regex uses \s+ which should handle multiple spaces
            expect(result2).toHaveLength(1);
        });
    });

    describe('parseNaturalDate() - Return Value Structure', () => {
        test('should return suggestions with correct structure', () => {
            const result = manager.parseNaturalDate('tomorrow');

            expect(result[0]).toHaveProperty('text');
            expect(result[0]).toHaveProperty('date');
            expect(result[0]).toHaveProperty('displayDate');
            expect(typeof result[0].text).toBe('string');
            expect(typeof result[0].date).toBe('string');
            expect(typeof result[0].displayDate).toBe('string');
        });

        test('should return date in ISO format (YYYY-MM-DD)', () => {
            const result = manager.parseNaturalDate('tomorrow');

            expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });
});

describe('SmartDateSuggestionsManager - UI Integration', () => {
    let manager;
    let mockState;
    let mockApp;
    let mockInput;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';

        mockState = { tasks: [], projects: [] };
        mockApp = new GTDApp();
        manager = new SmartDateSuggestionsManager(mockState, mockApp);

        // Create mock input
        mockInput = document.createElement('input');
        mockInput.type = 'text';
        mockInput.id = 'test-date-input';
        document.body.appendChild(mockInput);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('setupDateInputSuggestions()', () => {
        test('should create suggestion dropdown element', () => {
            manager.setupDateInputSuggestions(mockInput);

            const suggestionsDiv = mockInput.parentNode.querySelector('.date-suggestions');
            expect(suggestionsDiv).toBeTruthy();
            expect(suggestionsDiv.style.display).toBe('none');
        });

        test('should setup input event listener', () => {
            const inputSpy = jest.spyOn(mockInput, 'addEventListener');

            manager.setupDateInputSuggestions(mockInput);

            expect(inputSpy).toHaveBeenCalledWith('input', expect.any(Function));
            expect(inputSpy).toHaveBeenCalledWith('blur', expect.any(Function));
            expect(inputSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            inputSpy.mockRestore();
        });

        test('should show suggestions when typing valid pattern', (done) => {
            manager.setupDateInputSuggestions(mockInput);

            const suggestionsDiv = mockInput.parentNode.querySelector('.date-suggestions');

            // Trigger input event
            mockInput.value = 'tomorrow';
            mockInput.dispatchEvent(new Event('input'));

            setTimeout(() => {
                expect(suggestionsDiv.style.display).toBe('block');
                done();
            }, 0);
        });

        test('should not show suggestions for invalid input', (done) => {
            manager.setupDateInputSuggestions(mockInput);

            const suggestionsDiv = mockInput.parentNode.querySelector('.date-suggestions');

            mockInput.value = 'invalid input';
            mockInput.dispatchEvent(new Event('input'));

            setTimeout(() => {
                expect(suggestionsDiv.style.display).toBe('none');
                done();
            }, 0);
        });

        test('should hide suggestions on blur', (done) => {
            manager.setupDateInputSuggestions(mockInput);

            const suggestionsDiv = mockInput.parentNode.querySelector('.date-suggestions');

            // First show suggestions
            mockInput.value = 'tomorrow';
            mockInput.dispatchEvent(new Event('input'));

            setTimeout(() => {
                expect(suggestionsDiv.style.display).toBe('block');

                // Now blur
                mockInput.dispatchEvent(new Event('blur'));

                setTimeout(() => {
                    expect(suggestionsDiv.style.display).toBe('none');
                    done();
                }, 250);
            }, 0);
        });

        test('should hide suggestions on Escape key', (done) => {
            manager.setupDateInputSuggestions(mockInput);

            const suggestionsDiv = mockInput.parentNode.querySelector('.date-suggestions');

            mockInput.value = 'tomorrow';
            mockInput.dispatchEvent(new Event('input'));

            setTimeout(() => {
                expect(suggestionsDiv.style.display).toBe('block');

                const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
                mockInput.dispatchEvent(escapeEvent);

                expect(suggestionsDiv.style.display).toBe('none');
                done();
            }, 0);
        });

        test('should apply click handler to suggestions', (done) => {
            manager.setupDateInputSuggestions(mockInput);

            mockInput.value = 'tomorrow';
            mockInput.dispatchEvent(new Event('input'));

            setTimeout(() => {
                const suggestionsDiv = mockInput.parentNode.querySelector('.date-suggestions');
                const suggestion = suggestionsDiv.querySelector('.date-suggestion');

                expect(suggestion).toBeTruthy();

                suggestion.click();

                expect(mockInput.value).toBe(suggestion.dataset.date);
                expect(suggestionsDiv.style.display).toBe('none');
                done();
            }, 0);
        });
    });

    describe('setupSmartDateSuggestions()', () => {
        test('should setup suggestions for due date input if exists', () => {
            const dueDateInput = document.createElement('input');
            dueDateInput.id = 'task-due-date';
            document.body.appendChild(dueDateInput);

            manager.setupSmartDateSuggestions();

            const suggestionsDiv = dueDateInput.parentNode.querySelector('.date-suggestions');
            expect(suggestionsDiv).toBeTruthy();
        });

        test('should setup suggestions for defer date input if exists', () => {
            const deferDateInput = document.createElement('input');
            deferDateInput.id = 'task-defer-date';
            document.body.appendChild(deferDateInput);

            manager.setupSmartDateSuggestions();

            const suggestionsDiv = deferDateInput.parentNode.querySelector('.date-suggestions');
            expect(suggestionsDiv).toBeTruthy();
        });

        test('should handle missing inputs gracefully', () => {
            expect(() => {
                manager.setupSmartDateSuggestions();
            }).not.toThrow();
        });
    });
});
