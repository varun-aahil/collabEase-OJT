const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const { isAuthenticated } = require("../middleware/auth");

// Get all projects for the authenticated user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { teamMembers: req.user._id }
      ]
    })
    .populate("owner", "displayName image")
    .populate("teamMembers", "displayName image")
    .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects" });
  }
});

// Create a new project
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { title, description, teamMembers } = req.body;
    
    const project = new Project({
      title,
      description,
      owner: req.user._id,
      teamMembers: teamMembers || []
    });

    await project.save();
    
    const populatedProject = await Project.findById(project._id)
      .populate("owner", "displayName image")
      .populate("teamMembers", "displayName image");

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Error creating project" });
  }
});

// Update a project
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { title, description, teamMembers, status } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is owner or team member
    if (!project.owner.equals(req.user._id) && !project.teamMembers.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to update this project" });
    }

    project.title = title || project.title;
    project.description = description || project.description;
    project.teamMembers = teamMembers || project.teamMembers;
    project.status = status || project.status;

    await project.save();
    
    const updatedProject = await Project.findById(project._id)
      .populate("owner", "displayName image")
      .populate("teamMembers", "displayName image");

    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Error updating project" });
  }
});

// Delete a project
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can delete the project
    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to delete this project" });
    }

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project" });
  }
});

module.exports = router; 