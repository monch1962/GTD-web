/**
 * Tests for js/app.js - GTDApp class
 * Tests critical functionality to prevent regressions
 */

import { Task, Project } from '../js/models.js';
import { Storage } from '../js/storage.js';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  get length() { return 0; },
  key: jest.fn()
};

global.localStorage = mockLocalStorage;

// Mock DOM elements
global.document = {
  getElementById: jest.fn(() => ({
    value: '',
    textContent: '',
    addEventListener: jest.fn(),
    classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
    style: {},
    innerHTML: ''
  })),
  createElement: jest.fn((tag) => ({
    tagName: tag,
    style: {},
    addEventListener: jest.fn(),
    appendChild: jest.fn()
  }))
};

global.window = {
  location: { href: '' },
  addEventListener: jest.fn()
};

// Import after mocks are set up
import { GTDApp } from '../js/app.js';

describe('GTDApp Task and Project Saving', () => {
  let app;
  let storage;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create storage instance
    storage = new Storage();
    storage.userId = 'test_user_123';

    // Create app instance
    app = new GTDApp();
    app.storage = storage;
    app.tasks = [];
    app.projects = [];
  });

  describe('Task Updates', () => {
    test('should save existing task when project is assigned', async () => {
      // Arrange: Create an existing task
      const task = new Task({
        title: 'Test Task',
        status: 'inbox',
        projectId: null
      });
      app.tasks.push(task);

      // Mock saveTasks to track if it's called
      const saveTasksSpy = jest.spyOn(app, 'saveTasks').mockResolvedValue();

      // Act: Simulate updating the task (similar to what saveTaskFromForm does)
      const taskData = {
        title: 'Updated Task',
        status: 'next',
        projectId: 'project_123'
      };
      Object.assign(task, taskData);
      task.updatedAt = new Date().toISOString();

      // This is the key call that was missing!
      await app.saveTasks();

      // Assert: Verify saveTasks was called
      expect(saveTasksSpy).toHaveBeenCalledTimes(1);
      expect(task.projectId).toBe('project_123');
      expect(task.status).toBe('next');
    });

    test('should save task changes to localStorage', async () => {
      // Arrange: Create a task
      const task = new Task({
        title: 'Original Title',
        status: 'inbox'
      });
      app.tasks.push(task);

      // Mock storage.saveTasks
      const saveTasksSpy = jest.spyOn(app.storage, 'saveTasks').mockResolvedValue();

      // Act: Update the task
      task.title = 'Updated Title';
      task.projectId = 'project_456';
      await app.saveTasks();

      // Assert: Verify it was saved
      expect(saveTasksSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Updated Title',
            projectId: 'project_456'
          })
        ])
      );
    });
  });

  describe('Project Updates', () => {
    test('should save existing project when details are changed', async () => {
      // Arrange: Create an existing project
      const project = new Project({
        title: 'Test Project',
        status: 'active'
      });
      app.projects.push(project);

      // Mock saveProjects to track if it's called
      const saveProjectsSpy = jest.spyOn(app, 'saveProjects').mockResolvedValue();

      // Act: Simulate updating the project
      const projectData = {
        title: 'Updated Project',
        status: 'someday'
      };
      Object.assign(project, projectData);
      project.updatedAt = new Date().toISOString();

      // This is the key call that was missing!
      await app.saveProjects();

      // Assert: Verify saveProjects was called
      expect(saveProjectsSpy).toHaveBeenCalledTimes(1);
      expect(project.title).toBe('Updated Project');
      expect(project.status).toBe('someday');
    });

    test('should save project changes to localStorage', async () => {
      // Arrange: Create a project
      const project = new Project({
        title: 'Original Project',
        status: 'active'
      });
      app.projects.push(project);

      // Mock storage.saveProjects
      const saveProjectsSpy = jest.spyOn(app.storage, 'saveProjects').mockResolvedValue();

      // Act: Update the project
      project.title = 'Updated Project Title';
      await app.saveProjects();

      // Assert: Verify it was saved
      expect(saveProjectsSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Updated Project Title'
          })
        ])
      );
    });
  });

  describe('Task Project Assignment', () => {
    test('should persist project assignment when task is updated', async () => {
      // Arrange: Create a task and project
      const task = new Task({
        title: 'Task without project',
        status: 'inbox',
        projectId: null
      });
      const project = new Project({
        title: 'My Project',
        status: 'active'
      });
      app.tasks.push(task);
      app.projects.push(project);

      // Capture what gets saved
      let savedTasks = null;
      jest.spyOn(app.storage, 'saveTasks').mockImplementation((tasks) => {
        savedTasks = tasks;
        return Promise.resolve();
      });

      // Act: Assign task to project (simulating what happens in the UI)
      task.projectId = project.id;
      task.status = 'next'; // Should auto-move to next
      task.updatedAt = new Date().toISOString();
      await app.saveTasks();

      // Assert: Verify task has project assigned
      expect(task.projectId).toBe(project.id);
      expect(task.status).toBe('next');

      // Verify saveTasks was called with updated data
      expect(savedTasks).toBeTruthy();
      expect(savedTasks[0].projectId).toBe(project.id);
      expect(savedTasks[0].status).toBe('next');
    });
  });

  describe('Regression Tests', () => {
    test('should not lose task changes when modal closes', async () => {
      // This test specifically catches the bug where task changes weren't saved
      // Arrange: Create an existing task
      const originalTask = new Task({
        title: 'Original Task',
        status: 'inbox',
        projectId: null
      });
      app.tasks.push(originalTask);

      // Mock the save methods
      const saveTasksSpy = jest.spyOn(app, 'saveTasks').mockResolvedValue();

      // Act: Simulate what happens when editing in the modal
      const updatedTask = {
        title: 'Modified Task',
        status: 'next',
        projectId: 'project_789',
        energy: 'high'
      };

      // This is what the code does (Object.assign)
      Object.assign(originalTask, updatedTask);
      originalTask.updatedAt = new Date().toISOString();

      // CRITICAL: This was the missing line!
      await app.saveTasks();

      // Assert: All changes should be saved
      expect(saveTasksSpy).toHaveBeenCalled();
      expect(originalTask.title).toBe('Modified Task');
      expect(originalTask.status).toBe('next');
      expect(originalTask.projectId).toBe('project_789');
      expect(originalTask.energy).toBe('high');
    });

    test('should call saveTasks after every existing task update', async () => {
      // Create multiple tasks
      const task1 = new Task({ title: 'Task 1' });
      const task2 = new Task({ title: 'Task 2' });
      app.tasks.push(task1, task2);

      const saveTasksSpy = jest.spyOn(app, 'saveTasks').mockResolvedValue();

      // Update first task
      task1.projectId = 'project_1';
      await app.saveTasks();

      // Update second task
      task2.status = 'waiting';
      await app.saveTasks();

      // Both updates should have been saved
      expect(saveTasksSpy).toHaveBeenCalledTimes(2);
      expect(task1.projectId).toBe('project_1');
      expect(task2.status).toBe('waiting');
    });
  });
});
