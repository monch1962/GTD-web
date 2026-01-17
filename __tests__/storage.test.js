/**
 * Tests for storage.js - Storage class with localStorage persistence
 */

import { Storage } from '../js/storage.js'

describe('Storage Class', () => {
    let storage

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
        test('should initialize with provided userId', () => {
            const customStorage = new Storage('custom_user')
            expect(customStorage.userId).toBe('custom_user')
        })

        test('should generate userId if not provided', () => {
            const autoStorage = new Storage()
            expect(autoStorage.userId).toMatch(/^user_\d+_[a-z0-9]+$/)
        })

        test('should initialize with empty listeners map', () => {
            expect(storage.listeners instanceof Map).toBe(true)
            expect(storage.listeners.size).toBe(0)
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

        test('should reuse existing user ID from localStorage', () => {
            localStorage.clear()
            const storage1 = new Storage()
            const id1 = storage1.getUserId()

            // Create another storage without clearing - should reuse ID
            const storage2 = new Storage()
            const id2 = storage2.getUserId()

            expect(id1).toBe(id2)
            expect(localStorage.getItem('gtd_user_id')).toBe(id1)
        })

        test('should generate new ID after localStorage is cleared', () => {
            localStorage.clear()
            const storage1 = new Storage()
            const id1 = storage1.getUserId()

            // Clear localStorage and create new storage
            localStorage.clear()
            const storage2 = new Storage()
            const id2 = storage2.getUserId()

            expect(id1).not.toBe(id2)
        })
    })

    describe('getItem', () => {
        test('should retrieve and parse JSON item from localStorage', () => {
            const testData = { id: 1, name: 'Test' }
            localStorage.setItem('test_key', JSON.stringify(testData))

            const result = storage.getItem('test_key')
            expect(result).toEqual(testData)
        })

        test('should return null for non-existent item', () => {
            const result = storage.getItem('non_existent')
            expect(result).toBeNull()
        })

        test('should handle malformed JSON gracefully', () => {
            localStorage.setItem('bad_json', 'invalid json{')
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

            const result = storage.getItem('bad_json')
            expect(result).toBeNull()
            expect(consoleSpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        test('should handle empty string', () => {
            localStorage.setItem('empty', '')
            const result = storage.getItem('empty')
            expect(result).toBeNull()
        })
    })

    describe('setItem', () => {
        test('should save item to localStorage', () => {
            const testData = { id: 1, name: 'Test' }
            storage.setItem('test_key', testData)

            const stored = localStorage.getItem('test_key')
            expect(JSON.parse(stored)).toEqual(testData)
        })

        test.skip('should save item to remote storage when sync enabled (remote-storage removed)', async () => {
            mockRemoteStorage.setItem.mockResolvedValue(undefined)

            const testData = { id: 1, name: 'Test' }
            await storage.setItem('test_key', testData)

            expect(mockRemoteStorage.setItem).toHaveBeenCalledWith(
                'test_key',
                JSON.stringify(testData)
            )
        })

        test('should notify listeners on set', async () => {
            const callback = jest.fn()
            storage.subscribe('test_key', callback)

            const testData = { id: 1 }
            await storage.setItem('test_key', testData)

            expect(callback).toHaveBeenCalledWith(testData)
        })

        test.skip('should handle remote storage errors (remote-storage removed)', async () => {
            mockRemoteStorage.setItem.mockRejectedValue(new Error('Sync failed'))
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

            const testData = { id: 1 }
            await storage.setItem('test_key', testData)

            expect(consoleSpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })

        test.skip('should update sync status to error on failure (remote-storage removed)', async () => {
            mockRemoteStorage.setItem.mockRejectedValue(new Error('Sync failed'))
            document.body.innerHTML =
                '<button id="sync-status"><span class="sync-text"></span></button>'

            const testData = { id: 1 }
            await storage.setItem('test_key', testData)

            const syncButton = document.getElementById('sync-status')
            expect(syncButton.classList.contains('error')).toBe(true)
        })
    })

    describe.skip('removeItem (remote-storage removed)', () => {
        test('should remove item from localStorage', async () => {
            localStorage.setItem('test_key', JSON.stringify({ id: 1 }))
            await storage.removeItem('test_key')

            expect(localStorage.getItem('test_key')).toBeNull()
        })

        test('should remove from remote storage', async () => {
            mockRemoteStorage.removeItem.mockResolvedValue(undefined)

            await storage.removeItem('test_key')

            expect(mockRemoteStorage.removeItem).toHaveBeenCalledWith('test_key')
        })

        test('should notify listeners on remove', async () => {
            const callback = jest.fn()
            storage.subscribe('test_key', callback)

            await storage.removeItem('test_key')

            expect(callback).toHaveBeenCalledWith(null)
        })
    })

    describe('mergeData', () => {
        test('should merge local and remote data by timestamp', () => {
            const local = [
                { id: '1', name: 'Local 1', updatedAt: '2024-01-01T10:00:00.000Z' },
                { id: '2', name: 'Local 2', updatedAt: '2024-01-01T09:00:00.000Z' }
            ]

            const remote = [
                { id: '1', name: 'Remote 1', updatedAt: '2024-01-01T11:00:00.000Z' },
                { id: '3', name: 'Remote 3', updatedAt: '2024-01-01T08:00:00.000Z' }
            ]

            const merged = storage.mergeData(local, remote, 'updatedAt')

            expect(merged).toHaveLength(3)
            expect(merged.find((item) => item.id === '1').name).toBe('Remote 1') // Remote is newer
            expect(merged.find((item) => item.id === '2').name).toBe('Local 2') // Only in local
            expect(merged.find((item) => item.id === '3').name).toBe('Remote 3') // Only in remote
        })

        test('should handle empty arrays', () => {
            const merged = storage.mergeData([], [], 'updatedAt')
            expect(merged).toEqual([])
        })

        test('should handle empty local array', () => {
            const remote = [{ id: '1', name: 'Remote', updatedAt: '2024-01-01T10:00:00.000Z' }]
            const merged = storage.mergeData([], remote, 'updatedAt')

            expect(merged).toEqual(remote)
        })

        test('should handle empty remote array', () => {
            const local = [{ id: '1', name: 'Local', updatedAt: '2024-01-01T10:00:00.000Z' }]
            const merged = storage.mergeData(local, [], 'updatedAt')

            expect(merged).toEqual(local)
        })

        test('should preserve all items with same timestamps', () => {
            const local = [{ id: '1', name: 'Local', updatedAt: '2024-01-01T10:00:00.000Z' }]
            const remote = [{ id: '1', name: 'Remote', updatedAt: '2024-01-01T10:00:00.000Z' }]

            const merged = storage.mergeData(local, remote, 'updatedAt')

            expect(merged).toHaveLength(1)
            // Local should be kept when timestamps are equal
            expect(merged[0].name).toBe('Local')
        })
    })

    describe.skip('syncFromRemote (remote-storage removed)', () => {
        beforeEach(() => {
            document.body.innerHTML =
                '<button id="sync-status"><span class="sync-text"></span></button>'
        })

        test('should sync tasks from remote storage', async () => {
            const remoteTasks = [
                { id: '1', title: 'Remote Task', updatedAt: '2024-01-01T10:00:00.000Z' }
            ]

            mockRemoteStorage.getItem.mockImplementation((key) => {
                if (key === 'gtd_tasks') return Promise.resolve(remoteTasks)
                return Promise.resolve(null)
            })

            await storage.syncFromRemote()

            const tasks = storage.getItem('gtd_tasks')
            expect(tasks).toEqual(remoteTasks)
        })

        test('should sync projects from remote storage', async () => {
            const remoteProjects = [
                { id: '1', title: 'Remote Project', updatedAt: '2024-01-01T10:00:00.000Z' }
            ]

            mockRemoteStorage.getItem.mockImplementation((key) => {
                if (key === 'gtd_projects') return Promise.resolve(remoteProjects)
                return Promise.resolve(null)
            })

            await storage.syncFromRemote()

            const projects = storage.getItem('gtd_projects')
            expect(projects).toEqual(remoteProjects)
        })

        test('should merge remote and local data', async () => {
            const localTasks = [
                { id: '1', title: 'Local Task', updatedAt: '2024-01-01T09:00:00.000Z' }
            ]
            const remoteTasks = [
                { id: '1', title: 'Remote Task', updatedAt: '2024-01-01T10:00:00.000Z' }
            ]

            localStorage.setItem('gtd_tasks', JSON.stringify(localTasks))

            mockRemoteStorage.getItem.mockImplementation((key) => {
                if (key === 'gtd_tasks') return Promise.resolve(remoteTasks)
                return Promise.resolve(null)
            })

            await storage.syncFromRemote()

            const tasks = storage.getItem('gtd_tasks')
            expect(tasks[0].title).toBe('Remote Task') // Remote is newer
        })

        test('should update sync status', async () => {
            mockRemoteStorage.getItem.mockResolvedValue(null)

            await storage.syncFromRemote()

            const syncButton = document.getElementById('sync-status')
            expect(syncButton.querySelector('.sync-text').textContent).toBe('Synced')
        })

        test('should handle sync errors gracefully', async () => {
            mockRemoteStorage.getItem.mockRejectedValue(new Error('Network error'))
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

            await storage.syncFromRemote()

            expect(consoleSpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })
    })

    describe.skip('sync (remote-storage removed)', () => {
        test('should call syncFromRemote', async () => {
            const syncSpy = jest.spyOn(storage, 'syncFromRemote').mockResolvedValue()

            await storage.sync()

            expect(syncSpy).toHaveBeenCalled()

            syncSpy.mockRestore()
        })
    })

    describe.skip('updateSyncStatus (remote-storage removed)', () => {
        beforeEach(() => {
            document.body.innerHTML =
                '<button id="sync-status"><span class="sync-text"></span></button>'
        })

        test('should update to syncing status', () => {
            storage.updateSyncStatus('syncing')

            const syncButton = document.getElementById('sync-status')
            expect(syncButton.classList.contains('syncing')).toBe(true)
            expect(syncButton.querySelector('.sync-text').textContent).toBe('Syncing...')
        })

        test('should update to synced status', () => {
            storage.updateSyncStatus('synced')

            const syncButton = document.getElementById('sync-status')
            expect(syncButton.querySelector('.sync-text').textContent).toBe('Synced')
            expect(syncButton.classList.contains('syncing')).toBe(false)
        })

        test('should update to error status', () => {
            storage.updateSyncStatus('error')

            const syncButton = document.getElementById('sync-status')
            expect(syncButton.classList.contains('error')).toBe(true)
            expect(syncButton.querySelector('.sync-text').textContent).toBe('Sync Error')
        })
    })

    describe('subscribe', () => {
        test('should add listener for key', () => {
            const callback = jest.fn()
            storage.subscribe('test_key', callback)

            expect(storage.listeners.has('test_key')).toBe(true)
            expect(storage.listeners.get('test_key')).toContain(callback)
        })

        test('should allow multiple listeners for same key', () => {
            const callback1 = jest.fn()
            const callback2 = jest.fn()

            storage.subscribe('test_key', callback1)
            storage.subscribe('test_key', callback2)

            expect(storage.listeners.get('test_key')).toHaveLength(2)
        })
    })

    describe('notifyListeners', () => {
        test('should call all listeners for a key', () => {
            const callback1 = jest.fn()
            const callback2 = jest.fn()

            storage.subscribe('test_key', callback1)
            storage.subscribe('test_key', callback2)

            storage.notifyListeners('test_key', 'test_value')

            expect(callback1).toHaveBeenCalledWith('test_value')
            expect(callback2).toHaveBeenCalledWith('test_value')
        })

        test('should not call listeners for different keys', () => {
            const callback = jest.fn()
            storage.subscribe('key1', callback)

            storage.notifyListeners('key2', 'value')

            expect(callback).not.toHaveBeenCalled()
        })

        test('should handle key with no listeners', () => {
            expect(() => {
                storage.notifyListeners('non_existent', 'value')
            }).not.toThrow()
        })
    })

    describe('getTasks', () => {
        test('should return tasks array', () => {
            const tasks = [
                { id: '1', title: 'Task 1' },
                { id: '2', title: 'Task 2' }
            ]
            localStorage.setItem('gtd_tasks', JSON.stringify(tasks))

            const result = storage.getTasks()

            expect(result).toEqual(tasks)
        })

        test('should return empty array if no tasks', () => {
            const result = storage.getTasks()

            expect(result).toEqual([])
        })
    })

    describe('saveTasks', () => {
        test('should save tasks to storage', async () => {
            const tasks = [{ id: '1', title: 'Task 1' }]

            await storage.saveTasks(tasks)

            const stored = JSON.parse(localStorage.getItem('gtd_tasks'))
            expect(stored).toEqual(tasks)
        })
    })

    describe('getProjects', () => {
        test('should return projects array', () => {
            const projects = [{ id: '1', title: 'Project 1' }]
            localStorage.setItem('gtd_projects', JSON.stringify(projects))

            const result = storage.getProjects()

            expect(result).toEqual(projects)
        })

        test('should return empty array if no projects', () => {
            const result = storage.getProjects()

            expect(result).toEqual([])
        })
    })

    describe('saveProjects', () => {
        test('should save projects to storage', async () => {
            const projects = [{ id: '1', title: 'Project 1' }]

            await storage.saveProjects(projects)

            const stored = JSON.parse(localStorage.getItem('gtd_projects'))
            expect(stored).toEqual(projects)
        })
    })

    describe('getSettings', () => {
        test('should return default settings if none exist', () => {
            const result = storage.getSettings()

            expect(result).toEqual({
                theme: 'light',
                defaultView: 'inbox'
            })
        })

        test('should return saved settings', () => {
            const settings = { theme: 'dark', defaultView: 'next' }
            localStorage.setItem('gtd_settings', JSON.stringify(settings))

            const result = storage.getSettings()

            expect(result).toEqual(settings)
        })
    })

    describe('saveSettings', () => {
        test('should save settings to storage', async () => {
            const settings = { theme: 'dark' }

            await storage.saveSettings(settings)

            const stored = JSON.parse(localStorage.getItem('gtd_settings'))
            expect(stored).toEqual(settings)
        })
    })

    describe('init', () => {
        test('should initialize and return self', async () => {
            const result = await storage.init()

            expect(result).toBe(storage)
        })

        // Note: Remote storage integration is not yet implemented
        // These tests are skipped until remote storage is fully integrated
        test.skip('should initialize remote storage instance (not implemented)', async () => {
            // Future: When remote storage is implemented, this test should verify:
            // - RemoteStorage is instantiated with correct config
            // - storage.remoteStorage is set
        })

        test.skip('should sync from remote on init (not implemented)', async () => {
            // Future: When remote storage is implemented, this test should verify:
            // - syncFromRemote is called on init
        })
    })

    describe('Edge Cases', () => {
        test('should handle large data sets', async () => {
            const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
                id: `task_${i}`,
                title: `Task ${i}`
            }))

            await storage.saveTasks(largeTasks)

            const stored = storage.getTasks()
            expect(stored).toHaveLength(1000)
        })

        test('should handle special characters in data', async () => {
            const specialData = {
                title: 'Task with "quotes" and \'apostrophes\'',
                description: 'Special chars: <>&\\n\\t',
                tags: ['tag with spaces', 'tag@symbol']
            }

            await storage.setItem('special', specialData)

            const retrieved = storage.getItem('special')
            expect(retrieved).toEqual(specialData)
        })

        test('should handle unicode characters', async () => {
            const unicodeData = {
                title: 'Task with emoji 🎉 and unicode 中文',
                tags: ['日本語', '한국어']
            }

            await storage.setItem('unicode', unicodeData)

            const retrieved = storage.getItem('unicode')
            expect(retrieved).toEqual(unicodeData)
        })
    })
})
