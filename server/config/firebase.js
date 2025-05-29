const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const initializeFirebase = () => {
  try {
    let app;
    
    // Check if we're using environment variables or a service account file
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Using FIREBASE_SERVICE_ACCOUNT environment variable');
      
      try {
        // Parse the JSON from environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        app = initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:', error);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT format: ' + error.message);
      }
    } else {
      console.log('Looking for serviceAccountKey.json file');
      
      // Path to the service account file
      const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
      
      // Check if the file exists
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Service account file not found at ${serviceAccountPath}. Please create this file or set FIREBASE_SERVICE_ACCOUNT environment variable.`);
      }
      
      try {
        // Load from a file
        const serviceAccount = require(serviceAccountPath);
        
        // Validate the private key format
        if (!serviceAccount.private_key || 
            !serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
          throw new Error('Invalid private key format. The private key must be in PEM format and include "-----BEGIN PRIVATE KEY-----"');
        }
        
        app = initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (error) {
        console.error('Error loading service account from file:', error);
        throw new Error('Invalid service account file: ' + error.message);
      }
    }
    
    // Initialize Auth
    getAuth(app);
    
    console.log('Firebase initialized successfully');
    return getFirestore();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    
    // Provide more helpful error message
    if (error.message.includes('Failed to parse private key')) {
      console.error('\nThe private_key in your serviceAccountKey.json file is not properly formatted.');
      console.error('Make sure it includes the correct format: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
      console.error('When you download the JSON from Firebase, the private key comes with escaped newlines (\\n).');
      console.error('You need to either keep these escaped newlines or replace them with actual newlines in the JSON file.\n');
    }
    
    process.exit(1);
  }
};

module.exports = { initializeFirebase }; 