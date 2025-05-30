# Firebase Authentication Fix Guide

Your Firebase Admin SDK is experiencing authentication errors (Error 16: UNAUTHENTICATED). This is a common issue that can be resolved by regenerating the service account key.

## 🚨 Issue Confirmed

The diagnostic script confirmed:
- ✅ System time is synchronized
- ✅ Service account key structure is valid
- ❌ Firebase connection fails with authentication error

## 🔧 Solution: Regenerate Service Account Key

### Step 1: Generate New Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **collabease-49374**
3. Click the gear icon (⚙️) and select **Project settings**
4. Click on the **Service accounts** tab
5. Under "Firebase Admin SDK", click **Generate new private key**
6. Click **Generate key** in the confirmation dialog
7. A new JSON file will be downloaded to your computer

### Step 2: Replace the Current Key

#### Option A: Automatic Replacement (Recommended)
1. Save the downloaded JSON file somewhere safe (like Downloads folder)
2. Run the replacement script:
   ```bash
   node replace-service-key.js /path/to/your/downloaded/file.json
   ```

#### Option B: Manual Replacement
1. Rename the downloaded file to `serviceAccountKey.json`
2. Replace the current `serviceAccountKey.json` file in your server directory

### Step 3: Verify the Fix

After replacing the key, test the connection:
```bash
node test-firebase.js
```

If successful, you should see:
```
✅ All Firebase operations completed successfully!
```

### Step 4: Restart Your Server

After confirming the fix works, restart your main server:
```bash
npm start
```

## 🧐 Why This Happens

This authentication error typically occurs due to:

1. **Expired or Invalid Service Account Keys**: Firebase service account keys can become invalid over time or due to various factors
2. **System Time Issues**: If your system clock is out of sync (we already fixed this)
3. **Permission Changes**: Sometimes Firebase project permissions change
4. **Network/Infrastructure Issues**: Google's auth servers may temporarily reject certain keys

## 🔍 Additional Troubleshooting

If regenerating the key doesn't work:

1. **Check Firestore Security Rules**: Make sure your Firestore rules allow server-side access
2. **Verify Project ID**: Ensure the project ID in your service account matches your Firebase project
3. **Check IAM Permissions**: The service account needs proper Firestore permissions
4. **Clear Node Modules**: Sometimes clearing `node_modules` and reinstalling helps:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📞 Need Help?

If you continue having issues:
1. Run the diagnostic script again: `node fix-firebase-auth.js`
2. Check the Firebase Console for any project-level issues
3. Verify your Firebase project is active and properly configured 