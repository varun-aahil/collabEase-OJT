const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { isAuthenticated } = require('../middleware/auth');

// Get all tasks for a project
router.get('/project/:projectId', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.find({ project: req.params.projectId })
            .populate('assignedTo', 'displayName image')
            .populate('createdBy', 'displayName image')
            .sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// Get user's tasks
router.get('/my-tasks', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('project', 'title')
            .populate('createdBy', 'displayName image')
            .sort({ dueDate: 1 });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching user tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

// Get dashboard statistics
router.get('/stats', isAuthenticated, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get total tasks
        const totalTasks = await Task.countDocuments({
            $or: [
                { assignedTo: req.user._id },
                { createdBy: req.user._id }
            ]
        });

        // Get overdue tasks
        const overdueTasks = await Task.countDocuments({
            assignedTo: req.user._id,
            dueDate: { $lt: today },
            status: { $ne: 'completed' }
        });

        // Get tasks due today
        const todayTasks = await Task.countDocuments({
            assignedTo: req.user._id,
            dueDate: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            },
            status: { $ne: 'completed' }
        });

        // Get completed tasks
        const completedTasks = await Task.countDocuments({
            assignedTo: req.user._id,
            status: 'completed'
        });

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
        const { title, description, project, assignedTo, dueDate, priority } = req.body;
        
        const task = new Task({
            title,
            description,
            project,
            assignedTo,
            createdBy: req.user._id,
            dueDate,
            priority
        });

        await task.save();
        
        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'displayName image')
            .populate('createdBy', 'displayName image')
            .populate('project', 'title');

        res.status(201).json(populatedTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Error creating task' });
    }
});

// Update task status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.status = status;
        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'displayName image')
            .populate('createdBy', 'displayName image')
            .populate('project', 'title');

        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ message: 'Error updating task' });
    }
});

// Delete task
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (!task.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }

        await task.deleteOne();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Error deleting task' });
    }
});

module.exports = router; 