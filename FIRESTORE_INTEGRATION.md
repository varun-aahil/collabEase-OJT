# Firestore Integration Guide

This guide explains how to integrate Firebase (Firestore and Authentication) into the CollabEase project.

## Server-Side Setup

1. **Firebase Service Account**:
   - You've already created a `serviceAccountKey.json` file in the server directory.
   - Replace the placeholder values with your actual Firebase service account credentials.
   - You can get these credentials from the Firebase Console:
     - Go to Project Settings > Service Accounts
     - Click "Generate New Private Key"
     - Save the JSON file and use its contents to replace the placeholders

2. **Environment Variables**:
   - Create a `.env` file in the server directory with the following content:
   ```
   # Session
   SESSION_SECRET=your_session_secret

   # Firebase (choose one option)
   # Option 1: JSON string of your Firebase service account
   # FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"collabease-49374",...}

   # Option 2: Use serviceAccountKey.json file in the server directory
   # No need to set FIREBASE_SERVICE_ACCOUNT if using this option
   ```

3. **Start the Server**:
   ```
   cd server
   npm install
   npm start
   ```

## Client-Side Setup

1. **Firebase Configuration**:
   - The Firebase client configuration is already set up in `client/src/firebase.js`.
   - It includes the necessary imports for Firebase Authentication and Firestore functionality.

2. **Authentication**:
   - The project now uses Firebase Authentication directly.
   - Implementation is handled in the client code.
   - The server validates Firebase ID tokens for API requests.

3. **Using Firebase in Components**:
   - For authentication:
   ```javascript
   import { 
     createUserWithEmailAndPassword, 
     signInWithEmailAndPassword, 
     signInWithPopup, 
     signOut,
     GoogleAuthProvider 
   } from 'firebase/auth';
   import { auth, googleProvider } from '../firebase';

   // Register with email and password
   const registerUser = async (email, password) => {
     try {
       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
       return userCredential.user;
     } catch (error) {
       console.error('Registration error:', error);
       throw error;
     }
   };

   // Sign in with email and password
   const loginUser = async (email, password) => {
     try {
       const userCredential = await signInWithEmailAndPassword(auth, email, password);
       return userCredential.user;
     } catch (error) {
       console.error('Login error:', error);
       throw error;
     }
   };

   // Sign in with Google
   const signInWithGoogle = async () => {
     try {
       const result = await signInWithPopup(auth, googleProvider);
       return result.user;
     } catch (error) {
       console.error('Google sign-in error:', error);
       throw error;
     }
   };

   // Sign out
   const logoutUser = async () => {
     try {
       await signOut(auth);
     } catch (error) {
       console.error('Logout error:', error);
       throw error;
     }
   };
   ```

   - For Firestore:
   ```javascript
   import { db } from '../firebase';
   import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

   // Get all projects
   const getProjects = async () => {
     const projectsCollection = collection(db, 'projects');
     const projectsSnapshot = await getDocs(projectsCollection);
     return projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   };

   // Get projects for a specific user
   const getUserProjects = async (userId) => {
     const projectsCollection = collection(db, 'projects');
     const q = query(
       projectsCollection, 
       where('owner', '==', userId)
     );
     const projectsSnapshot = await getDocs(q);
     return projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   };

   // Create a new project
   const createProject = async (projectData) => {
     const projectsCollection = collection(db, 'projects');
     const docRef = await addDoc(projectsCollection, {
       ...projectData,
       createdAt: new Date()
     });
     return { id: docRef.id, ...projectData };
   };
   ```

4. **API Requests**:
   - The project includes an API utility (`client/src/utils/api.js`) that automatically adds the Firebase ID token to requests.
   - Example usage:
   ```javascript
   import { getProjects, createProject } from '../utils/api';

   // Get all projects
   const fetchProjects = async () => {
     try {
       const response = await getProjects();
       setProjects(response.data);
     } catch (error) {
       console.error('Error fetching projects:', error);
     }
   };

   // Create a new project
   const handleCreateProject = async (projectData) => {
     try {
       const response = await createProject(projectData);
       setProjects([...projects, response.data]);
     } catch (error) {
       console.error('Error creating project:', error);
     }
   };
   ```

5. **Start the Client**:
   ```
   cd client
   npm install
   npm start
   ```

## Data Structure

Here's the recommended data structure for Firestore collections:

### Users Collection
```
users/{userId}
{
  email: string,
  displayName: string,
  firstName: string,
  lastName: string,
  image: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Projects Collection
```
projects/{projectId}
{
  title: string,
  description: string,
  owner: string (userId),
  teamMembers: array of strings (userIds),
  status: string ('active', 'completed', 'archived'),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Tasks Collection
```
tasks/{taskId}
{
  title: string,
  description: string,
  project: string (projectId),
  assignedTo: string (userId),
  createdBy: string (userId),
  dueDate: timestamp,
  status: string ('todo', 'in-progress', 'completed'),
  priority: string ('low', 'medium', 'high'),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Security Rules

Don't forget to set up Firestore security rules to protect your data. Here's a basic example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects can be read by team members and written by owners
    match /projects/{projectId} {
      allow read: if request.auth != null && (
        resource.data.owner == request.auth.uid || 
        request.auth.uid in resource.data.teamMembers
      );
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.owner == request.auth.uid;
    }
    
    // Tasks can be read by project team members and updated by assignees or creators
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.assignedTo == request.auth.uid || 
        resource.data.createdBy == request.auth.uid
      );
      allow delete: if request.auth != null && resource.data.createdBy == request.auth.uid;
    }
  }
} 