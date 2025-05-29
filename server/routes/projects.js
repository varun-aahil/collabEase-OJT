const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");

// Get all projects for the authenticated user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    console.log("GET /api/projects - User authenticated:", req.user.id);
    const db = req.db;
    const projectsRef = db.collection('projects');
    
    // Query projects where user is owner or team member
    console.log("Querying projects for owner:", req.user.id);
    const ownerQuery = await projectsRef.where('owner', '==', req.user.id).get();
    console.log(`Found ${ownerQuery.docs.length} projects as owner`);
    
    console.log("Querying projects for team member:", req.user.id);
    const memberQuery = await projectsRef.where('teamMembers', 'array-contains', req.user.id).get();
    console.log(`Found ${memberQuery.docs.length} projects as team member`);
    
    // Combine results
    const projectDocs = [...ownerQuery.docs, ...memberQuery.docs];
    
    // Remove duplicates (in case user is both owner and team member)
    const uniqueProjects = Array.from(new Set(projectDocs.map(doc => doc.id)))
      .map(id => {
        const doc = projectDocs.find(doc => doc.id === id);
        return { id: doc.id, ...doc.data() };
      });
    
    // Get user data for owner and team members
    const userIds = new Set();
    uniqueProjects.forEach(project => {
      userIds.add(project.owner);
      project.teamMembers?.forEach(memberId => userIds.add(memberId));
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
    
    // Populate owner and team members
    const populatedProjects = uniqueProjects.map(project => {
      return {
        ...project,
        owner: usersData[project.owner] || project.owner,
        teamMembers: project.teamMembers?.map(memberId => 
          usersData[memberId] || memberId
        ) || []
      };
    });
    
    // Sort by createdAt in descending order
    populatedProjects.sort((a, b) => 
      b.createdAt?.toDate?.() - a.createdAt?.toDate?.() || 0
    );

    res.json(populatedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects" });
  }
});

// Create a new project
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const db = req.db;
    const { title, description, teamMembers } = req.body;
    
    const newProject = {
      title,
      description,
      owner: req.user.id,
      teamMembers: teamMembers || [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const projectRef = await db.collection('projects').add(newProject);
    
    // Get the created project
    const projectDoc = await projectRef.get();
    const project = { id: projectDoc.id, ...projectDoc.data() };
    
    // Get owner data
    const ownerDoc = await db.collection('users').doc(project.owner).get();
    const ownerData = ownerDoc.exists ? ownerDoc.data() : null;
    
    // Get team members data
    const teamMembersData = [];
    if (project.teamMembers && project.teamMembers.length > 0) {
      const teamMemberQueries = project.teamMembers.map(memberId => 
        db.collection('users').doc(memberId).get()
      );
      
      const teamMemberDocs = await Promise.all(teamMemberQueries);
      
      teamMemberDocs.forEach(memberDoc => {
        if (memberDoc.exists) {
          const userData = memberDoc.data();
          teamMembersData.push({
            id: memberDoc.id,
            displayName: userData.displayName,
            image: userData.image
          });
        }
      });
    }
    
    // Populate project with user data
    const populatedProject = {
      ...project,
      owner: ownerData ? {
        id: ownerDoc.id,
        displayName: ownerData.displayName,
        image: ownerData.image
      } : project.owner,
      teamMembers: teamMembersData
    };

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Error creating project" });
  }
});

// Update a project
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const db = req.db;
    const projectId = req.params.id;
    const { title, description, teamMembers, status } = req.body;
    
    // Get the project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const project = projectDoc.data();
    
    // Check if user is owner or team member
    if (project.owner !== req.user.id && !project.teamMembers?.includes(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to update this project" });
    }
    
    // Update the project
    const updates = {
      updatedAt: new Date()
    };
    
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (teamMembers) updates.teamMembers = teamMembers;
    if (status) updates.status = status;
    
    await db.collection('projects').doc(projectId).update(updates);
    
    // Get the updated project
    const updatedProjectDoc = await db.collection('projects').doc(projectId).get();
    const updatedProject = { id: updatedProjectDoc.id, ...updatedProjectDoc.data() };
    
    // Get owner data
    const ownerDoc = await db.collection('users').doc(updatedProject.owner).get();
    const ownerData = ownerDoc.exists ? ownerDoc.data() : null;
    
    // Get team members data
    const teamMembersData = [];
    if (updatedProject.teamMembers && updatedProject.teamMembers.length > 0) {
      const teamMemberQueries = updatedProject.teamMembers.map(memberId => 
        db.collection('users').doc(memberId).get()
      );
      
      const teamMemberDocs = await Promise.all(teamMemberQueries);
      
      teamMemberDocs.forEach(memberDoc => {
        if (memberDoc.exists) {
          const userData = memberDoc.data();
          teamMembersData.push({
            id: memberDoc.id,
            displayName: userData.displayName,
            image: userData.image
          });
        }
      });
    }
    
    // Populate project with user data
    const populatedProject = {
      ...updatedProject,
      owner: ownerData ? {
        id: ownerDoc.id,
        displayName: ownerData.displayName,
        image: ownerData.image
      } : updatedProject.owner,
      teamMembers: teamMembersData
    };
    
    res.json(populatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Error updating project" });
  }
});

// Delete a project
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const db = req.db;
    const projectId = req.params.id;
    
    // Get the project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    const project = projectDoc.data();
    
    // Only owner can delete the project
    if (project.owner !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this project" });
    }
    
    // Delete the project
    await db.collection('projects').doc(projectId).delete();
    
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project" });
  }
});

module.exports = router; 