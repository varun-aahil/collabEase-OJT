const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Get all tasks for a project
router.get('/project/:projectId', isAuthenticated, async (req, res) => {
    try {
        const db = req.db;
        const projectId = req.params.projectId;
        
        // Get tasks for the project
        const tasksSnapshot = await db.collection('tasks')
            .where('project', '==', projectId)
            .get();
        
        if (tasksSnapshot.empty) {
            return res.json([]);
        }
        
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get user IDs for assigned users and creators
        const userIds = new Set();
        tasks.forEach(task => {
            if (task.assignedTo) userIds.add(task.assignedTo);
            if (task.createdBy) userIds.add(task.createdBy);
        });
        
        // Fetch all users in one batch
        const usersData = {};
        if (userIds.size > 0) {
            const userQueries = Array.from(userIds).map(userId => 
                db.collection('users').doc(userId).get()
            );
            
            const userDocs = await Promise.all(userQueries);
            
            userDocs.forEach(userDoc => {
                if (userDoc.exists) {
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
                assignedTo: task.assignedTo ? usersData[task.assignedTo] || task.assignedTo : null,
                createdBy: task.createdBy ? usersData[task.createdBy] || task.createdBy : null
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
            if (task.project) projectIds.add(task.project);
            if (task.createdBy) creatorIds.add(task.createdBy);
        });
        
        // Fetch all projects in one batch
        const projectsData = {};
        if (projectIds.size > 0) {
            const projectQueries = Array.from(projectIds).map(projectId => 
                db.collection('projects').doc(projectId).get()
            );
            
            const projectDocs = await Promise.all(projectQueries);
            
            projectDocs.forEach(projectDoc => {
                if (projectDoc.exists) {
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
            const creatorQueries = Array.from(creatorIds).map(creatorId => 
                db.collection('users').doc(creatorId).get()
            );
            
            const creatorDocs = await Promise.all(creatorQueries);
            
            creatorDocs.forEach(creatorDoc => {
                if (creatorDoc.exists) {
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
        
        // Get all tasks related to the user
        const assignedTasksSnapshot = await db.collection('tasks')
            .where('assignedTo', '==', req.user.id)
            .get();
            
        const createdTasksSnapshot = await db.collection('tasks')
            .where('createdBy', '==', req.user.id)
            .get();
            
        const assignedTasks = assignedTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const createdTasks = createdTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
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
        
        const newTask = {
            title,
            description,
            project,
            assignedTo,
            createdBy: req.user.id,
            dueDate: dueDate ? new Date(dueDate) : null,
            priority: priority || 'medium',
            status: 'todo',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const taskRef = await db.collection('tasks').add(newTask);
        
        // Get the created task
        const taskDoc = await taskRef.get();
        const task = { id: taskDoc.id, ...taskDoc.data() };
        
        // Get assigned user data
        let assignedToData = null;
        if (task.assignedTo) {
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
        if (task.createdBy) {
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
        if (task.project) {
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
        
        // Get the task
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        
        if (!taskDoc.exists) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        // Update the task status
        await db.collection('tasks').doc(taskId).update({
            status,
            updatedAt: new Date()
        });
        
        // Get the updated task
        const updatedTaskDoc = await db.collection('tasks').doc(taskId).get();
        const task = { id: updatedTaskDoc.id, ...updatedTaskDoc.data() };
        
        // Get assigned user data
        let assignedToData = null;
        if (task.assignedTo) {
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
        if (task.createdBy) {
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
        if (task.project) {
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