/**
 * Tests for models.js - Task, Project, and Reference classes
 */

import { Task, Project, Reference } from '../js/models.js';

describe('Task Model', () => {
  describe('Constructor', () => {
    test('should create task with default values', () => {
      const task = new Task();
      expect(task.title).toBe('');
      expect(task.type).toBe('task');
      expect(task.status).toBe('inbox');
      expect(task.completed).toBe(false);
      expect(task.contexts).toEqual([]);
      expect(task.id).toMatch(/^task_\d+_[a-z0-9]+$/);
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    test('should create task with provided values', () => {
      const data = {
        title: 'Test Task',
        description: 'Test Description',
        type: 'task',
        status: 'next',
        energy: 'high',
        time: 30,
        contexts: ['@home', 'important'],
        completed: false
      };
      const task = new Task(data);
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.status).toBe('next');
      expect(task.energy).toBe('high');
      expect(task.time).toBe(30);
      expect(task.contexts).toEqual(['@home', 'important']);
    });

    test('should accept existing ID', () => {
      const task = new Task({ id: 'existing_id' });
      expect(task.id).toBe('existing_id');
    });
  });

  describe('toJSON', () => {
    test('should serialize task to JSON', () => {
      const task = new Task({
        title: 'Test Task',
        contexts: ['@work']
      });
      const json = task.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('title', 'Test Task');
      expect(json).toHaveProperty('contexts');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });

  describe('fromJSON', () => {
    test('should deserialize JSON to Task instance', () => {
      const json = {
        id: 'test_id',
        title: 'Test Task',
        status: 'next',
        contexts: ['@work'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };
      const task = Task.fromJSON(json);

      expect(task).toBeInstanceOf(Task);
      expect(task.id).toBe('test_id');
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('next');
      expect(task.contexts).toEqual(['@work']);
    });
  });

  describe('markComplete', () => {
    test('should mark task as complete', () => {
      const task = new Task({ title: 'Test Task' });
      task.markComplete();

      expect(task.completed).toBe(true);
      expect(task.completedAt).toBeDefined();
      expect(task.status).toBe('completed');
      expect(task.updatedAt).toBeDefined();
    });

    test('should set completedAt timestamp', () => {
      const task = new Task({ title: 'Test Task' });
      const beforeComplete = new Date();
      task.markComplete();
      const afterComplete = new Date();

      const completedAt = new Date(task.completedAt);
      expect(completedAt.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
      expect(completedAt.getTime()).toBeLessThanOrEqual(afterComplete.getTime());
    });
  });

  describe('markIncomplete', () => {
    test('should mark completed task as incomplete', () => {
      const task = new Task({
        title: 'Test Task',
        completed: true,
        status: 'completed'
      });
      task.markIncomplete();

      expect(task.completed).toBe(false);
      expect(task.completedAt).toBeNull();
      expect(task.status).toBe('inbox');
    });

    test('should not change status if not completed', () => {
      const task = new Task({
        title: 'Test Task',
        status: 'next'
      });
      task.markIncomplete();

      expect(task.completed).toBe(false);
      expect(task.status).toBe('next');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty contexts array', () => {
      const task = new Task({ contexts: [] });
      expect(task.contexts).toEqual([]);
    });

    test('should handle null projectId', () => {
      const task = new Task({ projectId: null });
      expect(task.projectId).toBeNull();
    });

    test('should handle zero time', () => {
      const task = new Task({ time: 0 });
      expect(task.time).toBe(0);
    });

    test('should handle missing energy', () => {
      const task = new Task({ energy: '' });
      expect(task.energy).toBe('');
    });
  });
});

describe('Project Model', () => {
  describe('Constructor', () => {
    test('should create project with default values', () => {
      const project = new Project();
      expect(project.title).toBe('');
      expect(project.status).toBe('active');
      expect(project.contexts).toEqual([]);
      expect(project.id).toMatch(/^project_\d+_[a-z0-9]+$/);
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    test('should create project with provided values', () => {
      const data = {
        title: 'Test Project',
        description: 'Project Description',
        status: 'someday',
        contexts: ['work', 'important']
      };
      const project = new Project(data);

      expect(project.title).toBe('Test Project');
      expect(project.description).toBe('Project Description');
      expect(project.status).toBe('someday');
      expect(project.contexts).toEqual(['work', 'important']);
    });

    test('should accept existing ID', () => {
      const project = new Project({ id: 'existing_project_id' });
      expect(project.id).toBe('existing_project_id');
    });
  });

  describe('toJSON', () => {
    test('should serialize project to JSON', () => {
      const project = new Project({
        title: 'Test Project',
        contexts: ['personal']
      });
      const json = project.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('title', 'Test Project');
      expect(json).toHaveProperty('contexts');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });

  describe('fromJSON', () => {
    test('should deserialize JSON to Project instance', () => {
      const json = {
        id: 'project_id',
        title: 'Test Project',
        status: 'active',
        contexts: ['work'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };
      const project = Project.fromJSON(json);

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe('project_id');
      expect(project.title).toBe('Test Project');
      expect(project.status).toBe('active');
      expect(project.contexts).toEqual(['work']);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty description', () => {
      const project = new Project({ description: '' });
      expect(project.description).toBe('');
    });

    test('should handle all status types', () => {
      const active = new Project({ status: 'active' });
      const someday = new Project({ status: 'someday' });
      const completed = new Project({ status: 'completed' });

      expect(active.status).toBe('active');
      expect(someday.status).toBe('someday');
      expect(completed.status).toBe('completed');
    });
  });
});

describe('Reference Model', () => {
  describe('Constructor', () => {
    test('should create reference with default values', () => {
      const reference = new Reference();
      expect(reference.title).toBe('');
      expect(reference.url).toBe('');
      expect(reference.contexts).toEqual([]);
      expect(reference.id).toMatch(/^ref_\d+_[a-z0-9]+$/);
      expect(reference.createdAt).toBeDefined();
      expect(reference.updatedAt).toBeDefined();
    });

    test('should create reference with provided values', () => {
      const data = {
        title: 'Reference Item',
        description: 'Reference Description',
        url: 'https://example.com',
        contexts: ['documentation']
      };
      const reference = new Reference(data);

      expect(reference.title).toBe('Reference Item');
      expect(reference.description).toBe('Reference Description');
      expect(reference.url).toBe('https://example.com');
      expect(reference.contexts).toEqual(['documentation']);
    });
  });

  describe('toJSON', () => {
    test('should serialize reference to JSON', () => {
      const reference = new Reference({
        title: 'Test Reference',
        url: 'https://test.com'
      });
      const json = reference.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('title', 'Test Reference');
      expect(json).toHaveProperty('url', 'https://test.com');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });

  describe('fromJSON', () => {
    test('should deserialize JSON to Reference instance', () => {
      const json = {
        id: 'ref_id',
        title: 'Reference',
        url: 'https://example.com',
        contexts: ['docs'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };
      const reference = Reference.fromJSON(json);

      expect(reference).toBeInstanceOf(Reference);
      expect(reference.id).toBe('ref_id');
      expect(reference.title).toBe('Reference');
      expect(reference.url).toBe('https://example.com');
      expect(reference.contexts).toEqual(['docs']);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty URL', () => {
      const reference = new Reference({ url: '' });
      expect(reference.url).toBe('');
    });

    test('should handle long URLs', () => {
      const longUrl = 'https://example.com/very/long/path/that/keeps/going?query=value&another=value';
      const reference = new Reference({ url: longUrl });
      expect(reference.url).toBe(longUrl);
    });
  });
});

describe('Model Integration', () => {
  test('should maintain data integrity through serialization cycle', () => {
    const originalTask = new Task({
      title: 'Integration Test',
      contexts: ['test'],
      energy: 'high',
      time: 15
    });

    const json = originalTask.toJSON();
    const restoredTask = Task.fromJSON(json);

    expect(restoredTask.title).toBe(originalTask.title);
    expect(restoredTask.contexts).toEqual(originalTask.contexts);
    expect(restoredTask.energy).toBe(originalTask.energy);
    expect(restoredTask.time).toBe(originalTask.time);
  });

  test('should handle multiple tasks with unique IDs', () => {
    const task1 = new Task();
    const task2 = new Task();
    const task3 = new Task();

    expect(task1.id).not.toBe(task2.id);
    expect(task2.id).not.toBe(task3.id);
    expect(task1.id).not.toBe(task3.id);
  });

  test('should handle multiple projects with unique IDs', () => {
    const project1 = new Project();
    const project2 = new Project();

    expect(project1.id).not.toBe(project2.id);
  });

  test('should handle multiple references with unique IDs', () => {
    const ref1 = new Reference();
    const ref2 = new Reference();

    expect(ref1.id).not.toBe(ref2.id);
  });
});
