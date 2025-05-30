const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const { v4: uuidv4 } = require('uuid');

// Get all team members (using users collection)
router.get("/", isAuthenticated, async (req, res) => {
  try {
    console.log("GET /api/team - Fetching team members");
    const db = req.db;
    const usersRef = db.collection('users');
    
    // Get all users
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log('No team members found');
      return res.json([]);
    }
    
    const teamMembers = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      teamMembers.push({
        id: doc.id,
        name: userData.displayName || userData.name || 'Unknown User',
        email: userData.email,
        status: userData.status || 'active',
        role: userData.role || 'Member',
        avatar: userData.image || userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=4e73df&color=ffffff`,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt
      });
    });
    
    // Sort by name
    teamMembers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log(`Found ${teamMembers.length} team members`);
    res.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Error fetching team members", error: error.message });
  }
});

// Send team invitation
router.post("/invite", isAuthenticated, async (req, res) => {
  try {
    console.log("POST /api/team/invite - Sending invitation");
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const db = req.db;
    
    // Check if user already exists
    const usersRef = db.collection('users');
    const existingUserQuery = await usersRef.where('email', '==', email).get();
    
    if (!existingUserQuery.empty) {
      return res.status(400).json({ 
        message: "User with this email is already a team member",
        userExists: true
      });
    }
    
    // Generate invitation token
    const inviteToken = uuidv4();
    const inviteId = uuidv4();
    
    // Store invitation in database
    const invitationData = {
      id: inviteId,
      email: email,
      token: inviteToken,
      invitedBy: req.user.id,
      invitedByName: req.user.name || 'Team Member',
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };
    
    await db.collection('invitations').doc(inviteId).set(invitationData);
    
    // Generate invite link
    const inviteLink = `${req.protocol}://${req.get('host')}/invite/${inviteToken}`;
    
    console.log(`Invitation created for ${email} with token ${inviteToken}`);
    
    // In a real app, you would send an email here
    // For now, we'll just return the link
    res.json({
      message: "Invitation created successfully",
      inviteLink: inviteLink,
      email: email,
      expiresAt: invitationData.expiresAt
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ message: "Error creating invitation", error: error.message });
  }
});

// Get invitation details
router.get("/invite/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const db = req.db;
    
    // Find invitation by token
    const invitationsRef = db.collection('invitations');
    const inviteQuery = await invitationsRef.where('token', '==', token).get();
    
    if (inviteQuery.empty) {
      return res.status(404).json({ message: "Invalid invitation token" });
    }
    
    const inviteDoc = inviteQuery.docs[0];
    const inviteData = inviteDoc.data();
    
    // Check if invitation has expired
    if (inviteData.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ message: "Invitation has expired" });
    }
    
    // Check if invitation is already used
    if (inviteData.status !== 'pending') {
      return res.status(400).json({ message: "Invitation has already been used" });
    }
    
    res.json({
      email: inviteData.email,
      invitedBy: inviteData.invitedByName,
      createdAt: inviteData.createdAt,
      expiresAt: inviteData.expiresAt
    });
  } catch (error) {
    console.error("Error getting invitation:", error);
    res.status(500).json({ message: "Error getting invitation", error: error.message });
  }
});

// Accept invitation (this would be called when user registers with the invite token)
router.post("/invite/:token/accept", isAuthenticated, async (req, res) => {
  try {
    const { token } = req.params;
    const db = req.db;
    
    // Find invitation by token
    const invitationsRef = db.collection('invitations');
    const inviteQuery = await invitationsRef.where('token', '==', token).get();
    
    if (inviteQuery.empty) {
      return res.status(404).json({ message: "Invalid invitation token" });
    }
    
    const inviteDoc = inviteQuery.docs[0];
    const inviteData = inviteDoc.data();
    
    // Check if invitation has expired
    if (inviteData.expiresAt.toDate() < new Date()) {
      return res.status(400).json({ message: "Invitation has expired" });
    }
    
    // Check if invitation is already used
    if (inviteData.status !== 'pending') {
      return res.status(400).json({ message: "Invitation has already been used" });
    }
    
    // Mark invitation as accepted
    await inviteDoc.ref.update({
      status: 'accepted',
      acceptedBy: req.user.id,
      acceptedAt: new Date()
    });
    
    res.json({ message: "Invitation accepted successfully" });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ message: "Error accepting invitation", error: error.message });
  }
});

// Delete team member
router.delete("/:userId", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.db;
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // In a real app, you might want to add authorization checks here
    // (e.g., only admins can delete users, or users can't delete themselves)
    
    // Mark user as inactive instead of deleting
    await db.collection('users').doc(userId).update({
      status: 'inactive',
      deactivatedAt: new Date(),
      deactivatedBy: req.user.id
    });
    
    console.log(`User ${userId} deactivated by ${req.user.id}`);
    
    res.json({ message: "Team member removed successfully" });
  } catch (error) {
    console.error("Error removing team member:", error);
    res.status(500).json({ message: "Error removing team member", error: error.message });
  }
});

// Update team member status
router.patch("/:userId/status", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const db = req.db;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'active' or 'inactive'" });
    }
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update user status
    await db.collection('users').doc(userId).update({
      status: status,
      updatedAt: new Date(),
      statusUpdatedBy: req.user.id
    });
    
    console.log(`User ${userId} status updated to ${status} by ${req.user.id}`);
    
    res.json({ message: "User status updated successfully" });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Error updating user status", error: error.message });
  }
});

// Get all invitations (for admin view)
router.get("/invitations", isAuthenticated, async (req, res) => {
  try {
    console.log("GET /api/team/invitations - Fetching all invitations");
    const db = req.db;
    const invitationsRef = db.collection('invitations');
    
    // Get all invitations, ordered by creation date
    const snapshot = await invitationsRef.orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      return res.json([]);
    }
    
    const invitations = [];
    snapshot.forEach(doc => {
      const inviteData = doc.data();
      invitations.push({
        id: doc.id,
        email: inviteData.email,
        status: inviteData.status,
        invitedBy: inviteData.invitedByName,
        createdAt: inviteData.createdAt,
        expiresAt: inviteData.expiresAt,
        acceptedAt: inviteData.acceptedAt || null
      });
    });
    
    res.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ message: "Error fetching invitations", error: error.message });
  }
});

module.exports = router; 