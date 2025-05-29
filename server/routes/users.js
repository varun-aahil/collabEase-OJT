const express = require("express");
const router = express.Router();
const { getAuth } = require("firebase-admin/auth");

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

module.exports = router; 