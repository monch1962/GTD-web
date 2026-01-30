/**
 * Tests for storage.ts - Storage class with localStorage persistence
 */

import { Storage } from '../js/storage.ts'

describe('Storage Class', () => {
    let storage: Storage

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear()

        // Create new storage instance
        storage = new Storage('test_user_123')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        test('should generate userId if not provided', () => {
            const autoStorage = new Storage()
            const userId = autoStorage.getUserId()
            expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/)
        })
    })

    describe('getUserId', () => {
        test('should return existing user ID from localStorage', () => {
            localStorage.setItem('gtd_user_id', 'existing_user')
            const newStorage = new Storage()
            expect(newStorage.getUserId()).toBe('existing_user')
        })

        test('should generate and store new user ID if none exists', () => {
            const newStorage = new Storage()
            const userId = newStorage.getUserId()
            expect(userId).toMatch(/^user_\d+_[a-z0-9]+$/)
            expect(localStorage.getItem('gtd_user_id')).toBe(userId)
        })
    })

    describe('Data Operations', () => {
        test('should save and retrieve tasks', async () => {
            const tasks = [
                { id: 'task1', title: 'Task 1' },
                { id: 'task2', title: 'Task 2' }
            ]

            await storage.saveTasks(tasks)
            const retrieved = storage.getTasks()

            expect(retrieved).toEqual(tasks)
        })

        test('should save and retrieve projects', async () => {
            const projects = [
                { id: 'project1', title: 'Project 1' },
                { id: 'project2', title: 'Project 2' }
            ]

            await storage.saveProjects(projects)
            const retrieved = storage.getProjects()

            expect(retrieved).toEqual(projects)
        })

        test('should return empty array when no data exists', () => {
            expect(storage.getTasks()).toEqual([])
            expect(storage.getProjects()).toEqual([])
        })

        test('should handle malformed JSON in localStorage', () => {
            localStorage.setItem('gtd_tasks', 'invalid json')
            // Storage class returns empty array for malformed JSON
            expect(storage.getTasks()).toEqual([])
        })

        test('should handle null/undefined values in localStorage', () => {
            localStorage.setItem('gtd_tasks', 'null')
            expect(storage.getTasks()).toEqual([])

            localStorage.removeItem('gtd_tasks')
            expect(storage.getTasks()).toEqual([])
        })
    })

    describe('Error Handling', () => {
        test('should handle localStorage quota exceeded', async () => {
            // Mock localStorage.setItem to throw quota exceeded error
            const originalSetItem = localStorage.setItem
            localStorage.setItem = jest.fn(() => {
                throw new DOMException('Quota exceeded', 'QuotaExceededError')
            })

            const tasks = [{ id: 'task1', title: 'Task 1' }]

            // Should not throw, just fail silently
            await expect(storage.saveTasks(tasks)).resolves.not.toThrow()

            localStorage.setItem = originalSetItem
        })

        test('should handle other localStorage errors', async () => {
            const originalSetItem = localStorage.setItem
            localStorage.setItem = jest.fn(() => {
                throw new Error('Some other error')
            })

            const tasks = [{ id: 'task1', title: 'Task 1' }]

            // Should not throw
            await expect(storage.saveTasks(tasks)).resolves.not.toThrow()

            localStorage.setItem = originalSetItem
        })
    })
})
