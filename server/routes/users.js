const express = require("express");
const router = express.Router();
const { getAuth } = require("firebase-admin/auth");
const { isAuthenticated } = require("../middleware/auth");

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture
    };
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

// Create or update user in Firestore
router.post("/", async (req, res) => {
  try {
    const { uid, displayName, email, photoURL } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: "User ID (uid) is required" });
    }

    const db = req.db;
    const userRef = db.collection('users').doc(uid);
    
    // Check if user already exists
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      // Update existing user
      await userRef.update({
        displayName: displayName || userDoc.data().displayName,
        email: email || userDoc.data().email,
        photoURL: photoURL || userDoc.data().photoURL,
        updatedAt: new Date()
      });
    } else {
      // Create new user
      await userRef.set({
        displayName: displayName || "",
        email: email || "",
        photoURL: photoURL || "",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const updatedUserDoc = await userRef.get();
    
    res.status(200).json({
      id: updatedUserDoc.id,
      ...updatedUserDoc.data()
    });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const db = req.db;
    const userRef = db.collection('users').doc(req.user.id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create user if not exists
      await userRef.set({
        displayName: req.user.displayName || "",
        email: req.user.email || "",
        photoURL: req.user.photoURL || "",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const newUserDoc = await userRef.get();
      return res.status(200).json({
        id: newUserDoc.id,
        ...newUserDoc.data()
      });
    }
    
    res.status(200).json({
      id: userDoc.id,
      ...userDoc.data()
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for team member selection)
router.get("/", isAuthenticated, async (req, res) => {
  try {
    console.log("GET /api/users - Fetching all users for team selection");
    const db = req.db;
    const usersRef = db.collection('users');
    
    // Get all users
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log('No users found');
      return res.json([]);
    }
    
    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        name: userData.displayName || userData.name || 'Unknown User',
        displayName: userData.displayName,
        email: userData.email,
        avatar: userData.image || userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=4e73df&color=ffffff`,
        image: userData.image || userData.photoURL,
        role: userData.role || 'Member'
      });
    });
    
    // Sort by name
    users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

// Get current user profile
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    console.log("GET /api/users/profile - User authenticated:", req.user.id);
    const db = req.db;
    
    // Get user document
    const userDoc = await db.collection('users').doc(req.user.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userData = userDoc.data();
    const user = {
      id: userDoc.id,
      name: userData.displayName || userData.name || 'Unknown User',
      displayName: userData.displayName,
      email: userData.email,
      avatar: userData.image || userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=4e73df&color=ffffff`,
      image: userData.image || userData.photoURL,
      role: userData.role || 'Member',
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt
    };
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile", error: error.message });
  }
});

// Update user profile
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    console.log("PUT /api/users/profile - Updating user:", req.user.id);
    const db = req.db;
    const { displayName, role } = req.body;
    
    const updates = {
      updatedAt: new Date()
    };
    
    if (displayName !== undefined) updates.displayName = displayName;
    if (role !== undefined) updates.role = role;
    
    await db.collection('users').doc(req.user.id).update(updates);
    
    // Get updated user
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const userData = userDoc.data();
    
    const user = {
      id: userDoc.id,
      name: userData.displayName || userData.name || 'Unknown User',
      displayName: userData.displayName,
      email: userData.email,
      avatar: userData.image || userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=4e73df&color=ffffff`,
      image: userData.image || userData.photoURL,
      role: userData.role || 'Member',
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };
    
    res.json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Error updating user profile", error: error.message });
  }
});

module.exports = router; 