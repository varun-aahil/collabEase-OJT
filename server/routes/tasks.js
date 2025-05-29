const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Get all tasks for a project
router.get('/project/:projectId', isAuthenticated, async (req, res) => {
    try {
        const db = req.db;
        const projectId = req.params.projectId;
        
        // Validate project ID
        if (!projectId) {
            console.error('Error fetching tasks: Missing project ID');
            return res.status(400).json({ message: 'Project ID is required' });
        }
        
        console.log(`Fetching tasks for project: ${projectId}`);
        
        // Get tasks for the project
        const tasksSnapshot = await db.collection('tasks')
            .where('project', '==', projectId)
            .get();
        
        if (tasksSnapshot.empty) {
            console.log(`No tasks found for project: ${projectId}`);
            return res.json([]);
        }
        
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Found ${tasks.length} tasks for project: ${projectId}`);
        
        // Get user IDs for assigned users and creators
        const userIds = new Set();
        tasks.forEach(task => {
            if (task.assignedTo && typeof task.assignedTo === 'string' && task.assignedTo.trim() !== '') {
                userIds.add(task.assignedTo);
            }
            if (task.createdBy && typeof task.createdBy === 'string' && task.createdBy.trim() !== '') {
                userIds.add(task.createdBy);
            }
        });
        
        // Fetch all users in one batch
        const usersData = {};
        if (userIds.size > 0) {
            const userQueries = Array.from(userIds).map(userId => {
                if (!userId || typeof userId !== 'string' || userId.trim() === '') {
                    console.warn('Invalid userId found when fetching user data');
                    return Promise.resolve(null);
                }
                return db.collection('users').doc(userId).get();
            });
            
            const userDocs = await Promise.all(userQueries);
            
            userDocs.forEach(userDoc => {
                if (userDoc && userDoc.exists) {
                    const userData = userDoc.data();
                    usersData[userDoc.id] = {
                        id: userDoc.id,
                        displayName: userData.displayName,
                        image: userData.image
                    };
                }
            });
        }
        
        // Populate tasks with user data
        const populatedTasks = tasks.map(task => {
            return {
                ...task,
                assignedTo: task.assignedTo && usersData[task.assignedTo] ? usersData[task.assignedTo] : task.assignedTo,
                createdBy: task.createdBy && usersData[task.createdBy] ? usersData[task.createdBy] : task.createdBy
            };
        });
        
        // Sort by createdAt in descending order
        populatedTasks.sort((a, b) => 
            b.createdAt?.toDate?.() - a.createdAt?.toDate?.() || 0
        );
        
        res.json(populatedTasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// Get user's tasks
router.get('/my-tasks', isAuthenticated, async (req, res) => {
    try {
        const db = req.db;
        
        // Get tasks assigned to the user
        const tasksSnapshot = await db.collection('tasks')
            .where('assignedTo', '==', req.user.id)
            .get();
        
        if (tasksSnapshot.empty) {
            return res.json([]);
        }
        
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get project IDs
        const projectIds = new Set();
        const creatorIds = new Set();
        
        tasks.forEach(task => {
            if (task.project && typeof task.project === 'string' && task.project.trim() !== '') {
                projectIds.add(task.project);
            }
            if (task.createdBy && typeof task.createdBy === 'string' && task.createdBy.trim() !== '') {
                creatorIds.add(task.createdBy);
            }
        });
        
        // Fetch all projects in one batch
        const projectsData = {};
        if (projectIds.size > 0) {
            const projectQueries = Array.from(projectIds).map(projectId => {
                if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
                    console.warn('Invalid projectId found when fetching project data');
                    return Promise.resolve(null);
                }
                return db.collection('projects').doc(projectId).get();
            });
            
            const projectDocs = await Promise.all(projectQueries);
            
            projectDocs.forEach(projectDoc => {
                if (projectDoc && projectDoc.exists) {
                    const projectData = projectDoc.data();
                    projectsData[projectDoc.id] = {
                        id: projectDoc.id,
                        title: projectData.title
                    };
                }
            });
        }
        
        // Fetch all creators in one batch
        const creatorsData = {};
        if (creatorIds.size > 0) {
            const creatorQueries = Array.from(creatorIds).map(creatorId => {
                if (!creatorId || typeof creatorId !== 'string' || creatorId.trim() === '') {
                    console.warn('Invalid creatorId found when fetching creator data');
                    return Promise.resolve(null);
                }
                return db.collection('users').doc(creatorId).get();
            });
            
            const creatorDocs = await Promise.all(creatorQueries);
            
            creatorDocs.forEach(creatorDoc => {
                if (creatorDoc && creatorDoc.exists) {
                    const creatorData = creatorDoc.data();
                    creatorsData[creatorDoc.id] = {
                        id: creatorDoc.id,
                        displayName: creatorData.displayName,
                        image: creatorData.image
                    };
                }
            });
        }
        
        // Populate tasks with project and creator data
        const populatedTasks = tasks.map(task => {
            return {
                ...task,
                project: task.project ? projectsData[task.project] || task.project : null,
                createdBy: task.createdBy ? creatorsData[task.createdBy] || task.createdBy : null
            };
        });
        
        // Sort by dueDate in ascending order
        populatedTasks.sort((a, b) => {
            const dateA = a.dueDate?.toDate?.() || new Date(a.dueDate);
            const dateB = b.dueDate?.toDate?.() || new Date(b.dueDate);
            return dateA - dateB;
        });
        
        res.json(populatedTasks);
    } catch (error) {
        console.error('Error fetching user tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// Get dashboard statistics
router.get('/stats', isAuthenticated, async (req, res) => {
    try {
        const db = req.db;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Ensure user ID is valid
        if (!req.user.id || typeof req.user.id !== 'string' || req.user.id.trim() === '') {
            console.error('Invalid user ID in stats request');
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        console.log(`Fetching task statistics for user: ${req.user.id}`);
        
        // Get all tasks related to the user
        const assignedTasksSnapshot = await db.collection('tasks')
            .where('assignedTo', '==', req.user.id)
            .get();
            
        const createdTasksSnapshot = await db.collection('tasks')
            .where('createdBy', '==', req.user.id)
            .get();
            
        const assignedTasks = assignedTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const createdTasks = createdTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(`Found ${assignedTasks.length} assigned tasks and ${createdTasks.length} created tasks`);
        
        // Combine and remove duplicates
        const allTaskIds = new Set();
        const allTasks = [];
        
        [...assignedTasks, ...createdTasks].forEach(task => {
            if (!allTaskIds.has(task.id)) {
                allTaskIds.add(task.id);
                allTasks.push(task);
            }
        });
        
        // Calculate statistics
        const totalTasks = allTasks.length;
        
        const overdueTasks = assignedTasks.filter(task => {
            const dueDate = task.dueDate?.toDate?.() || new Date(task.dueDate);
            return dueDate < today && task.status !== 'completed';
        }).length;
        
        const todayTasks = assignedTasks.filter(task => {
            const dueDate = task.dueDate?.toDate?.() || new Date(task.dueDate);
            return dueDate >= today && dueDate < tomorrow && task.status !== 'completed';
        }).length;
        
        const completedTasks = assignedTasks.filter(task => 
            task.status === 'completed'
        ).length;
        
        res.json({
            totalTasks,
            overdueTasks,
            todayTasks,
            completedTasks
        });
    } catch (error) {
        console.error('Error fetching task statistics:', error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
});

// Create a new task
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const db = req.db;
        const { title, description, project, assignedTo, dueDate, priority } = req.body;
        
        // Validate title
        if (!title || typeof title !== 'string' || title.trim() === '') {
            console.error('Error creating task: Missing title');
            return res.status(400).json({ message: 'Task title is required' });
        }
        
        // Validate project ID
        if (!project || typeof project !== 'string' || project.trim() === '') {
            console.error('Error creating task: Missing or invalid project ID');
            return res.status(400).json({ message: 'Valid project ID is required' });
        }
        
        console.log(`Creating new task "${title}" for project: ${project}`);
        
        // Validate and clean up assignedTo if present
        let cleanedAssignedTo = null;
        if (assignedTo && typeof assignedTo === 'string' && assignedTo.trim() !== '') {
            cleanedAssignedTo = assignedTo.trim();
            
            // Verify that user exists
            const userDoc = await db.collection('users').doc(cleanedAssignedTo).get();
            if (!userDoc.exists) {
                console.warn(`Assigned user ${cleanedAssignedTo} does not exist`);
                // We still allow the task to be created, but log a warning
            }
        }
        
        // Verify that project exists
        const projectDoc = await db.collection('projects').doc(project).get();
        if (!projectDoc.exists) {
            console.error(`Project ${project} does not exist`);
            return res.status(400).json({ message: 'Project does not exist' });
        }
        
        const newTask = {
            title: title.trim(),
            description: description ? description.trim() : '',
            project,
            assignedTo: cleanedAssignedTo,
            createdBy: req.user.id,
            dueDate: dueDate ? new Date(dueDate) : null,
            priority: priority || 'medium',
            status: 'To Do',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const taskRef = await db.collection('tasks').add(newTask);
        
        // Get the created task
        const taskDoc = await taskRef.get();
        const task = { id: taskDoc.id, ...taskDoc.data() };
        
        // Get assigned user data
        let assignedToData = null;
        if (task.assignedTo && typeof task.assignedTo === 'string' && task.assignedTo.trim() !== '') {
            const userDoc = await db.collection('users').doc(task.assignedTo).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                assignedToData = {
                    id: userDoc.id,
                    displayName: userData.displayName,
                    image: userData.image
                };
            }
        }
        
        // Get creator data
        let createdByData = null;
        if (task.createdBy && typeof task.createdBy === 'string' && task.createdBy.trim() !== '') {
            const creatorDoc = await db.collection('users').doc(task.createdBy).get();
            if (creatorDoc.exists) {
                const creatorData = creatorDoc.data();
                createdByData = {
                    id: creatorDoc.id,
                    displayName: creatorData.displayName,
                    image: creatorData.image
                };
            }
        }
        
        // Get project data
        let projectData = null;
        if (task.project && typeof task.project === 'string' && task.project.trim() !== '') {
            const projectDoc = await db.collection('projects').doc(task.project).get();
            if (projectDoc.exists) {
                const projData = projectDoc.data();
                projectData = {
                    id: projectDoc.id,
                    title: projData.title
                };
            }
        }
        
        // Populate task with related data
        const populatedTask = {
            ...task,
            assignedTo: assignedToData || task.assignedTo,
            createdBy: createdByData || task.createdBy,
            project: projectData || task.project
        };
        
        console.log(`Task created successfully with ID: ${taskDoc.id}`);
        res.status(201).json(populatedTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Error creating task' });
    }
});

// Update task status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
    try {
        const db = req.db;
        const taskId = req.params.id;
        const { status } = req.body;
        
        // Validate task ID
        if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
            console.error('Error updating task status: Invalid task ID');
            return res.status(400).json({ message: 'Invalid task ID' });
        }
        
        // Validate status
        if (!status || typeof status !== 'string' || status.trim() === '') {
            console.error('Error updating task status: Invalid status value');
            return res.status(400).json({ message: 'Invalid status value' });
        }
        
        console.log(`Updating task ${taskId} status to ${status}`);
        
        // Get the task
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        
        if (!taskDoc.exists) {
            console.log(`Task ${taskId} not found`);
            return res.status(404).json({ message: 'Task not found' });
        }
        
        // Update the task status
        await db.collection('tasks').doc(taskId).update({
            status,
            updatedAt: new Date()
        });
        
        console.log(`Task ${taskId} status updated successfully`);
        
        // Get the updated task
        const updatedTaskDoc = await db.collection('tasks').doc(taskId).get();
        const task = { id: updatedTaskDoc.id, ...updatedTaskDoc.data() };
        
        // Get assigned user data
        let assignedToData = null;
        if (task.assignedTo && typeof task.assignedTo === 'string' && task.assignedTo.trim() !== '') {
            const userDoc = await db.collection('users').doc(task.assignedTo).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                assignedToData = {
                    id: userDoc.id,
                    displayName: userData.displayName,
                    image: userData.image
                };
            }
        }
        
        // Get creator data
        let createdByData = null;
        if (task.createdBy && typeof task.createdBy === 'string' && task.createdBy.trim() !== '') {
            const creatorDoc = await db.collection('users').doc(task.createdBy).get();
            if (creatorDoc.exists) {
                const creatorData = creatorDoc.data();
                createdByData = {
                    id: creatorDoc.id,
                    displayName: creatorData.displayName,
                    image: creatorData.image
                };
            }
        }
        
        // Get project data
        let projectData = null;
        if (task.project && typeof task.project === 'string' && task.project.trim() !== '') {
            const projectDoc = await db.collection('projects').doc(task.project).get();
            if (projectDoc.exists) {
                const projData = projectDoc.data();
                projectData = {
                    id: projectDoc.id,
                    title: projData.title
                };
            }
        }
        
        // Populate task with related data
        const populatedTask = {
            ...task,
            assignedTo: assignedToData || task.assignedTo,
            createdBy: createdByData || task.createdBy,
            project: projectData || task.project
        };
        
        res.json(populatedTask);
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ message: 'Error updating task' });
    }
});

// Delete task
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const db = req.db;
        const taskId = req.params.id;
        
        // Get the task
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        
        if (!taskDoc.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        const task = taskDoc.data();
        
        // Check if user is the creator
        if (task.createdBy !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }
        
        // Delete the task
        await db.collection('tasks').doc(taskId).delete();
        
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Error deleting task' });
    }
});

module.exports = router; 