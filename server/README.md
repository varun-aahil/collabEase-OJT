# CollabEase Server

This is the backend server for the CollabEase project management application.

## Setup

### Prerequisites
- Node.js and npm
- Firebase project with Firestore and Authentication enabled

### Firebase Setup

1. **Create a Firebase project** if you haven't already:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the setup steps

2. **Enable Firestore**:
   - In your Firebase project, go to "Firestore Database"
   - Click "Create database" and follow the setup steps

3. **Enable Authentication**:
   - In your Firebase project, go to "Authentication"
   - Click "Get started" and enable the providers you want (Email/Password, Google, etc.)

4. **Generate a service account key**:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file

### Server Setup

1. **Install dependencies**:
   ```
   npm install
   ```

2. **Set up Firebase credentials** using the automated setup script:
   ```
   npm run setup
   ```
   
   This script will guide you through setting up your Firebase service account credentials:
   - You can either provide the path to your downloaded JSON file
   - Or manually enter the required information

3. **Create a .env file** (optional):
   ```
   # Session
   SESSION_SECRET=your_session_secret
   
   # Firebase (only needed if not using serviceAccountKey.json)
   # FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
   ```

4. **Start the server**:
   ```
   npm start
   ```

## Troubleshooting

### "Failed to parse private key" Error

If you see this error, it means the private key in your serviceAccountKey.json file is not properly formatted. The private key should:

1. Include the BEGIN and END markers:
   ```
   -----BEGIN PRIVATE KEY-----
   ...key content...
   -----END PRIVATE KEY-----
   ```

2. Have proper newlines:
   - In the JSON file, newlines should be represented as `\n`
   - The key should start with `"-----BEGIN PRIVATE KEY-----\n"` and end with `\n-----END PRIVATE KEY-----\n"`

To fix this issue:
- Run `npm run setup` and provide the path to your downloaded JSON file
- Or manually edit the serviceAccountKey.json file to ensure the private key is properly formatted

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects for the authenticated user
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Tasks
- `GET /api/tasks/project/:projectId` - Get all tasks for a project
- `GET /api/tasks/my-tasks` - Get tasks assigned to the authenticated user
- `GET /api/tasks/stats` - Get task statistics for the authenticated user
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id/status` - Update a task's status
- `DELETE /api/tasks/:id` - Delete a task 