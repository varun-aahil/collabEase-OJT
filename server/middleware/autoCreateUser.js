const admin = require('firebase-admin');

const autoCreateUser = async (req, res, next) => {
  try {
    // Only run this for authenticated requests
    if (!req.user) {
      return next();
    }

    const db = req.db;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check if user document already exists in Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`🆕 New user detected: ${userEmail} (${userId})`);
      console.log('📝 Creating Firestore user document...');
      
      try {
        let authUser = null;
        let newUserData;

        // Try to get additional user info from Firebase Auth
        try {
          authUser = await admin.auth().getUser(userId);
          console.log(`✅ Retrieved Firebase Auth data for: ${userEmail}`);
        } catch (authError) {
          console.log(`⚠️ Could not retrieve Firebase Auth data for ${userEmail}, using basic info`);
          // Use fallback data if Firebase Auth lookup fails
        }

        if (authUser) {
          // Use full Firebase Auth data
          newUserData = {
            email: authUser.email,
            displayName: authUser.displayName || authUser.email.split('@')[0],
            name: authUser.displayName || authUser.email.split('@')[0],
            status: 'active',
            role: 'Member',
            createdAt: new Date(),
            lastLoginAt: new Date(),
            photoURL: authUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.displayName || authUser.email.split('@')[0])}&background=4e73df&color=ffffff`,
            uid: authUser.uid,
            autoCreated: true,
            firstLogin: new Date()
          };
        } else {
          // Use fallback data from request
          const displayName = req.user.displayName || req.user.name || userEmail.split('@')[0];
          newUserData = {
            email: userEmail,
            displayName: displayName,
            name: displayName,
            status: 'active',
            role: 'Member',
            createdAt: new Date(),
            lastLoginAt: new Date(),
            photoURL: req.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4e73df&color=ffffff`,
            uid: userId,
            autoCreated: true,
            firstLogin: new Date(),
            fallbackCreated: true
          };
        }

        // Create user document with Firebase Auth UID as document ID
        await db.collection('users').doc(userId).set(newUserData);
        console.log(`✅ Auto-created user document for: ${userEmail}`);

        // Optional: Create welcome notification
        try {
          const notificationsRouter = require('../routes/notifications');
          await notificationsRouter.createNotification(db, {
            userId: userId,
            message: `Welcome to CollabEase! Your account has been created successfully.`,
            type: 'welcome',
            senderName: 'CollabEase System',
            senderPhoto: 'https://ui-avatars.com/api/?name=CollabEase&background=4e73df&color=ffffff',
            metadata: {
              welcome: true,
              autoCreated: true
            }
          });
          console.log(`📧 Welcome notification created for: ${userEmail}`);
        } catch (notificationError) {
          console.error('❌ Failed to create welcome notification:', notificationError.message);
          // Don't fail the request if notification creation fails
        }

        // Optional: Add to team automatically (configurable)
        const AUTO_ADD_TO_TEAM = process.env.AUTO_ADD_NEW_USERS_TO_TEAM === 'true';
        
        if (AUTO_ADD_TO_TEAM) {
          console.log(`👥 Auto-adding ${userEmail} to team...`);
          // No additional action needed since they're already in the users collection
          // The GET /api/team endpoint will include them automatically
          console.log(`✅ ${userEmail} automatically added to team`);
        }

      } catch (createError) {
        console.error(`❌ Failed to auto-create user document for ${userEmail}:`, createError.message);
        // Don't fail the request, just log the error
      }
    } else {
      // User exists, just update last login time
      await db.collection('users').doc(userId).update({
        lastLoginAt: new Date()
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error in autoCreateUser middleware:', error.message);
    // Don't fail the request, just continue
    next();
  }
};

module.exports = { autoCreateUser }; 