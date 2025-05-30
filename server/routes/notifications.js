const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");

// Get notifications for authenticated user
router.get("/", isAuthenticated, async (req, res) => {
  try {
    console.log("GET /api/notifications - Fetching notifications for user:", req.user.id);
    const db = req.db;
    const notificationsRef = db.collection('notifications');
    
    // Get notifications for this user, ordered by creation date (newest first)
    const snapshot = await notificationsRef
      .where('userId', '==', req.user.id)
      .limit(20) // Limit to last 20 notifications
      .get();
    
    if (snapshot.empty) {
      console.log('No notifications found for user');
      return res.json([]);
    }
    
    const notifications = [];
    snapshot.forEach(doc => {
      const notificationData = doc.data();
      notifications.push({
        id: doc.id,
        message: notificationData.message,
        type: notificationData.type || 'info',
        read: notificationData.read || false,
        time: notificationData.createdAt,
        photo: notificationData.senderPhoto || "https://ui-avatars.com/api/?name=User",
        senderName: notificationData.senderName,
        metadata: notificationData.metadata || {}
      });
    });
    
    console.log(`Found ${notifications.length} notifications for user`);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
});

// Mark notification as read
router.patch("/:notificationId/read", isAuthenticated, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const db = req.db;
    
    // Check if notification exists and belongs to user
    const notificationDoc = await db.collection('notifications').doc(notificationId).get();
    
    if (!notificationDoc.exists) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    const notificationData = notificationDoc.data();
    if (notificationData.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Mark as read
    await db.collection('notifications').doc(notificationId).update({
      read: true,
      readAt: new Date()
    });
    
    console.log(`Notification ${notificationId} marked as read`);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error updating notification", error: error.message });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", isAuthenticated, async (req, res) => {
  try {
    const db = req.db;
    const notificationsRef = db.collection('notifications');
    
    // Get all unread notifications for this user
    const snapshot = await notificationsRef
      .where('userId', '==', req.user.id)
      .where('read', '==', false)
      .get();
    
    if (snapshot.empty) {
      return res.json({ message: "No unread notifications" });
    }
    
    // Batch update to mark all as read
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: new Date()
      });
    });
    
    await batch.commit();
    
    console.log(`Marked ${snapshot.size} notifications as read for user ${req.user.id}`);
    res.json({ message: `Marked ${snapshot.size} notifications as read` });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Error updating notifications", error: error.message });
  }
});

// Create a notification (internal helper function)
const createNotification = async (db, {
  userId,
  message,
  type = 'info',
  senderName = 'System',
  senderPhoto = null,
  metadata = {}
}) => {
  try {
    const notificationData = {
      userId,
      message,
      type,
      senderName,
      senderPhoto,
      metadata,
      read: false,
      createdAt: new Date()
    };
    
    const docRef = await db.collection('notifications').add(notificationData);
    console.log(`Created notification ${docRef.id} for user ${userId}: ${message}`);
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Export the helper function
router.createNotification = createNotification;

module.exports = router; 