/**
 * Script to generate test tasks for performance testing
 * Run in browser console to populate app with test data
 */

(function generateTestTasks() {
    const app = window.app;
    if (!app) {
        console.error('App not found. Make sure you run this on the GTD Web page.');
        return;
    }

    const contexts = ['@work', '@home', '@computer', '@phone', '@errands', '@anywhere'];
    const energies = ['high', 'medium', 'low'];
    const statuses = ['inbox', 'next', 'waiting', 'someday'];
    const projects = [
        'Project Alpha',
        'Project Beta',
        'Project Gamma',
        'Project Delta',
        'Project Epsilon'
    ];

    const taskTemplates = [
        'Review documentation for {project}',
        'Implement {context} feature',
        'Fix bug in {project} module',
        'Meeting with {context} team',
        'Code review for {project}',
        'Update {context} tests',
        'Deploy {project} to staging',
        'Refactor {context} code',
        'Write documentation for {project}',
        'Optimize {context} performance',
        'Design new {project} architecture',
        'Test {context} integration',
        'Create {project} mockups',
        'Analyze {context} metrics',
        'Plan {project} roadmap'
    ];

    let createdCount = 0;
    const targetCount = 100; // Generate 100 tasks

    console.log(`🚀 Generating ${targetCount} test tasks...`);

    for (let i = 0; i < targetCount; i++) {
        const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        const context = contexts[Math.floor(Math.random() * contexts.length)];
        const energy = energies[Math.floor(Math.random() * energies.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const project = Math.random() > 0.3 ? projects[Math.floor(Math.random() * projects.length)] : null;
        const time = [5, 15, 30, 45, 60][Math.floor(Math.random() * 5)];

        // Create task title
        const title = template
            .replace('{project}', project || 'General')
            .replace('{context}', context.replace('@', ''));

        // Create task
        const taskData = {
            title: title,
            description: `Auto-generated test task #${i + 1}`,
            status: status,
            contexts: [context],
            energy: energy,
            time: time,
            starred: Math.random() > 0.8, // 20% chance of being starred
            projectId: null
        };

        // Add to app
        const task = new Task(taskData);
        app.tasks.push(task);

        createdCount++;
    }

    // Save to localStorage
    app.saveTasks().then(() => {
        console.log(`✅ Successfully created ${createdCount} tasks!`);
        console.log(`📊 Tasks breakdown:`);
        console.log(`   - Total: ${app.tasks.length}`);
        console.log(`   - Inbox: ${app.tasks.filter(t => t.status === 'inbox').length}`);
        console.log(`   - Next: ${app.tasks.filter(t => t.status === 'next').length}`);
        console.log(`   - Waiting: ${app.tasks.filter(t => t.status === 'waiting').length}`);
        console.log(`   - Someday: ${app.tasks.filter(t => t.status === 'someday').length}`);
        console.log('');
        console.log(`🔄 Refreshing view...`);

        // Refresh the view
        app.renderView();
        app.updateCounts();

        console.log(`✨ Done! You now have ${app.tasks.length} tasks.`);
        console.log(`💡 Try switching between views to test performance!`);
    }).catch(err => {
        console.error('❌ Error saving tasks:', err);
    });

    return {
        count: createdCount,
        message: `Generated ${createdCount} test tasks`
    };
})();
