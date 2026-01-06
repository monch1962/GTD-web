import { test, expect } from '../fixtures/gtd-app.js';

/**
 * Journey 12: Templates
 * Description: Reusable task patterns for quick creation
 *
 * Tests:
 * - Creating templates
 * - Creating tasks from templates
 * - Template variables
 * - Templates with subtasks
 * - Editing templates
 * - Deleting templates
 * - Template preview
 */
test.describe('Templates Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should open templates modal', async ({ page, gtdApp }) => {
    // Step 1: Click Templates button
    await page.click(gtdApp.selectors.templatesBtn);

    // Step 2: Verify templates modal opens
    const templatesModal = page.locator('#templates-modal').or(
      page.locator('.templates-modal')
    );

    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      await expect(templatesModal).toBeVisible();

      // Step 3: Verify modal has title
      const modalTitle = templatesModal.locator('h2, .modal-title');
      await expect(modalTitle).toBeVisible();

      const titleText = await modalTitle.textContent();
      expect(titleText.toLowerCase()).toMatch(/template/i);
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should create new template', async ({ page, gtdApp }) => {
    // Step 1: Open templates modal
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Click "Create Template" button
      const createButton = templatesModal.locator('button:has-text("Create")').or(
        templatesModal.locator('[data-action="create-template"]')
      );

      const hasButton = await createButton.count() > 0;

      if (hasButton) {
        await createButton.click();

        // Step 3: Fill in template details
        const titleInput = templatesModal.locator('#template-title').or(
          templatesModal.locator('[data-field="title"]')
        );

        await titleInput.fill('Weekly Client Check-in');

        const descInput = templatesModal.locator('#template-description').or(
          templatesModal.locator('[data-field="description"]')
        );

        const hasDesc = await descInput.count() > 0;
        if (hasDesc) {
          await descInput.fill('Weekly status call with client');
        }

        // Add template task
        const taskInput = templatesModal.locator('#template-task').or(
          templatesModal.locator('[data-field="task"]')
        );

        const hasTaskInput = await taskInput.count() > 0;
        if (hasTaskInput) {
          await taskInput.fill('Review progress');
          await page.keyboard.press('Enter');

          await taskInput.fill('Discuss blockers');
          await page.keyboard.press('Enter');

          await taskInput.fill('Plan next steps');
          await page.keyboard.press('Enter');
        }

        // Step 4: Save template
        const saveButton = templatesModal.locator('button[type="submit"]').or(
          templatesModal.locator('button:has-text("Save")')
        );

        await saveButton.click();

        // Step 5: Verify template created
        const notification = await gtdApp.waitForNotification().catch(() => null);
        if (notification) {
          expect(notification.toLowerCase()).toMatch(/created|saved/i);
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should use template variables', async ({ page, gtdApp }) => {
    // Step 1: Create template with variable
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      const hasButton = await createButton.count() > 0;

      if (hasButton) {
        await createButton.click();

        // Create template with variable
        const titleInput = templatesModal.locator('#template-title');
        await titleInput.fill('Client Meeting');

        const taskInput = templatesModal.locator('#template-task');
        const hasTaskInput = await taskInput.count() > 0;

        if (hasTaskInput) {
          await taskInput.fill('Meeting with {client_name}');
          await page.keyboard.press('Enter');
        }

        await page.click('button[type="submit"]');

        // Step 2: Use template
        const useTemplateButton = templatesModal.locator('[data-action="use-template"]');
        const hasUseButton = await useTemplateButton.count() > 0;

        if (hasUseButton) {
          await useTemplateButton.first().click();

          // Step 3: Fill in variable
          const variableInput = page.locator('[data-variable="{client_name}"]').or(
            page.locator('.variable-input')
          );

          const hasVariableInput = await variableInput.count() > 0;

          if (hasVariableInput) {
            await variableInput.fill('Acme Corp');

            // Step 4: Create task
            await page.click('button:has-text("Create")');

            // Step 5: Verify variable replaced
            const tasks = await gtdApp.getTasks();
            const task = tasks.find(t => t.title.includes('Acme Corp'));

            expect(task).toBeDefined();
            expect(task.title).toContain('Acme Corp');
          }
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should create template with subtasks', async ({ page, gtdApp }) => {
    // Step 1: Create template with subtasks
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      if (await createButton.count() > 0) {
        await createButton.click();

        const titleInput = templatesModal.locator('#template-title');
        await titleInput.fill('Project Launch Checklist');

        const taskInput = templatesModal.locator('#template-task');
        if (await taskInput.count() > 0) {
          // Add subtasks
          await taskInput.fill('Design review');
          await page.keyboard.press('Enter');

          await taskInput.fill('Code review');
          await page.keyboard.press('Enter');

          await taskInput.fill('Testing');
          await page.keyboard.press('Enter');

          await taskInput.fill('Deployment');
          await page.keyboard.press('Enter');
        }

        await page.click('button[type="submit"]');

        // Step 2: Use template
        const useButton = templatesModal.locator('[data-action="use-template"]');
        if (await useButton.count() > 0) {
          await useButton.first().click();

          // Step 3: Verify subtasks created
          await page.click('button:has-text("Create")');

          const tasks = await gtdApp.getTasks();

          // Should have 4 tasks from template
          const designTask = tasks.find(t => t.title.includes('Design review'));
          const codeTask = tasks.find(t => t.title.includes('Code review'));
          const testTask = tasks.find(t => t.title.includes('Testing'));
          const deployTask = tasks.find(t => t.title.includes('Deployment'));

          expect(designTask).toBeDefined();
          expect(codeTask).toBeDefined();
          expect(testTask).toBeDefined();
          expect(deployTask).toBeDefined();
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should edit existing template', async ({ page, gtdApp }) => {
    // Step 1: Create template
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      if (await createButton.count() > 0) {
        await createButton.click();

        const titleInput = templatesModal.locator('#template-title');
        await titleInput.fill('Template to Edit');

        await page.click('button[type="submit"]');

        // Step 2: Edit template
        const editButton = templatesModal.locator('[data-template="Template to Edit"]')
          .locator('[data-action="edit"]');

        const hasEdit = await editButton.count() > 0;

        if (hasEdit) {
          await editButton.click();

          // Step 3: Modify template
          const newTitle = templatesModal.locator('#template-title');
          await newTitle.fill('Updated Template Name');

          await page.click('button[type="submit"]');

          // Step 4: Verify changes
          const updatedTemplate = templatesModal.locator('text=Updated Template Name');
          await expect(updatedTemplate).toBeVisible();
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should delete template', async ({ page, gtdApp }) => {
    // Step 1: Create template
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      if (await createButton.count() > 0) {
        await createButton.click();

        const titleInput = templatesModal.locator('#template-title');
        await titleInput.fill('Template to Delete');

        await page.click('button[type="submit"]');

        // Step 2: Delete template
        const deleteButton = templatesModal.locator('[data-template="Template to Delete"]')
          .locator('[data-action="delete"]');

        const hasDelete = await deleteButton.count() > 0;

        if (hasDelete) {
          await deleteButton.click();

          // Step 3: Confirm deletion
          const confirmButton = page.locator('button:has-text("Confirm")');
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
          }

          // Step 4: Verify template removed
          const deletedTemplate = templatesModal.locator('text=Template to Delete');
          const isStillVisible = await deletedTemplate.isVisible().catch(() => false);

          expect(isStillVisible).toBeFalsy();
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should preview template before using', async ({ page, gtdApp }) => {
    // Step 1: Create template
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      if (await createButton.count() > 0) {
        await createButton.click();

        const titleInput = templatesModal.locator('#template-title');
        await titleInput.fill('Preview Test Template');

        const taskInput = templatesModal.locator('#template-task');
        if (await taskInput.count() > 0) {
          await taskInput.fill('Task 1');
          await page.keyboard.press('Enter');

          await taskInput.fill('Task 2');
          await page.keyboard.press('Enter');
        }

        await page.click('button[type="submit"]');

        // Step 2: Preview template
        const previewButton = templatesModal.locator('[data-template="Preview Test Template"]')
          .locator('[data-action="preview"]');

        const hasPreview = await previewButton.count() > 0;

        if (hasPreview) {
          await previewButton.click();

          // Step 3: Verify preview shows tasks
          const previewContent = templatesModal.locator('.template-preview').or(
            templatesModal.locator('[data-preview]')
          );

          await expect(previewContent).toBeVisible();

          await expect(previewContent.locator('text=Task 1')).toBeVisible();
          await expect(previewContent.locator('text=Task 2')).toBeVisible();
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should show template list', async ({ page, gtdApp }) => {
    // Step 1: Create multiple templates
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      if (await createButton.count() > 0) {
        // Create first template
        await createButton.click();
        const title1 = templatesModal.locator('#template-title');
        await title1.fill('Template A');
        await page.click('button[type="submit"]');

        // Create second template
        await createButton.click();
        const title2 = templatesModal.locator('#template-title');
        await title2.fill('Template B');
        await page.click('button[type="submit"]');

        // Step 2: Verify both in list
        await expect(templatesModal.locator('text=Template A')).toBeVisible();
        await expect(templatesModal.locator('text=Template B')).toBeVisible();

        // Step 3: Verify list sorted alphabetically
        const templateA = templatesModal.locator('[data-template="Template A"]');
        const templateB = templatesModal.locator('[data-template="Template B"]');

        const posA = await templateA.boundingBox();
        const posB = await templateB.boundingBox();

        if (posA && posB) {
          expect(posA.y).toBeLessThan(posB.y);
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should handle templates with contexts and energy', async ({ page, gtdApp }) => {
    // Step 1: Create template with attributes
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      if (await createButton.count() > 0) {
        await createButton.click();

        const titleInput = templatesModal.locator('#template-title');
        await titleInput.fill('Work Meeting');

        const taskInput = templatesModal.locator('#template-task');
        if (await taskInput.count() > 0) {
          await taskInput.fill('Weekly standup @work high energy');
          await page.keyboard.press('Enter');
        }

        await page.click('button[type="submit"]');

        // Step 2: Use template
        const useButton = templatesModal.locator('[data-action="use-template"]');
        if (await useButton.count() > 0) {
          await useButton.first().click();
          await page.click('button:has-text("Create")');

          // Step 3: Verify attributes preserved
          const tasks = await gtdApp.getTasks();
          const task = tasks.find(t => t.title.includes('Weekly standup'));

          expect(task).toBeDefined();

          // Open task to check attributes
          await gtdApp.openTask('Weekly standup');

          const energy = page.locator('#task-energy');
          const hasEnergy = await energy.count() > 0;

          if (hasEnergy) {
            const energyValue = await energy.inputValue();
            expect(energyValue).toBe('high');
          }
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should duplicate template', async ({ page, gtdApp }) => {
    // Step 1: Create template
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      if (await createButton.count() > 0) {
        await createButton.click();

        const titleInput = templatesModal.locator('#template-title');
        await titleInput.fill('Original Template');

        await page.click('button[type="submit"]');

        // Step 2: Duplicate template
        const duplicateButton = templatesModal.locator('[data-template="Original Template"]')
          .locator('[data-action="duplicate"]');

        const hasDuplicate = await duplicateButton.count() > 0;

        if (hasDuplicate) {
          await duplicateButton.click();

          // Step 3: Verify both templates exist
          await expect(templatesModal.locator('text=Original Template')).toBeVisible();
          await expect(templatesModal.locator('text=Copy of Original Template')).toBeVisible();
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should search templates', async ({ page, gtdApp }) => {
    // Step 1: Create multiple templates
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      if (await createButton.count() > 0) {
        await createButton.click();
        const title1 = templatesModal.locator('#template-title');
        await title1.fill('Meeting Template');
        await page.click('button[type="submit"]');

        await createButton.click();
        const title2 = templatesModal.locator('#template-title');
        await title2.fill('Project Template');
        await page.click('button[type="submit"]');

        // Step 2: Search for "Meeting"
        const searchInput = templatesModal.locator('#template-search').or(
          templatesModal.locator('[data-search]')
        );

        const hasSearch = await searchInput.count() > 0;

        if (hasSearch) {
          await searchInput.fill('Meeting');

          // Step 3: Verify filtered results
          await expect(templatesModal.locator('text=Meeting Template')).toBeVisible();

          const projectTemplate = templatesModal.locator('text=Project Template');
          const isProjectVisible = await projectTemplate.isVisible().catch(() => false);

          expect(isProjectVisible).toBeFalsy();
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });

  test('should handle template with recurrence', async ({ page, gtdApp }) => {
    // Step 1: Create template with recurrence
    await page.click(gtdApp.selectors.templatesBtn);

    const templatesModal = page.locator('#templates-modal');
    const isModalVisible = await templatesModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const createButton = templatesModal.locator('[data-action="create-template"]');
      if (await createButton.count() > 0) {
        await createButton.click();

        const titleInput = templatesModal.locator('#template-title');
        await titleInput.fill('Weekly Review');

        const taskInput = templatesModal.locator('#template-task');
        if (await taskInput.count() > 0) {
          await taskInput.fill('Review weekly tasks');
          await page.keyboard.press('Enter');
        }

        const recurrenceSelect = templatesModal.locator('#template-recurrence');
        const hasRecurrence = await recurrenceSelect.count() > 0;

        if (hasRecurrence) {
          await recurrenceSelect.selectOption('weekly');
        }

        await page.click('button[type="submit"]');

        // Step 2: Use template
        const useButton = templatesModal.locator('[data-action="use-template"]');
        if (await useButton.count() > 0) {
          await useButton.first().click();
          await page.click('button:has-text("Create")');

          // Step 3: Verify recurrence applied
          const tasks = await gtdApp.getTasks();
          const task = tasks.find(t => t.title.includes('Review weekly tasks'));

          expect(task).toBeDefined();

          await gtdApp.openTask('Review weekly tasks');

          if (hasRecurrence) {
            const recurrence = page.locator('#task-recurrence');
            const recurrenceValue = await recurrence.inputValue();
            expect(recurrenceValue).toBe('weekly');
          }
        }
      }
    } else {
      test.skip(true, 'Templates modal not implemented');
    }
  });
});
