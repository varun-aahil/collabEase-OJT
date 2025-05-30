#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function replaceServiceAccountKey(newKeyPath) {
  console.log('🔑 Firebase Service Account Key Replacement Tool\n');
  
  // Validate input
  if (!newKeyPath) {
    console.error('❌ Error: Please provide the path to your new service account key file');
    console.log('Usage: node replace-service-key.js /path/to/your/new-key.json');
    process.exit(1);
  }
  
  // Check if new key file exists
  if (!fs.existsSync(newKeyPath)) {
    console.error(`❌ Error: File not found at ${newKeyPath}`);
    process.exit(1);
  }
  
  // Validate the new key file
  try {
    console.log('📝 Validating new service account key...');
    const newKeyContent = fs.readFileSync(newKeyPath, 'utf8');
    const newKeyData = JSON.parse(newKeyContent);
    
    // Check required fields
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !newKeyData[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Error: New key file is missing required fields:', missingFields.join(', '));
      process.exit(1);
    }
    
    // Check if it's a service account
    if (newKeyData.type !== 'service_account') {
      console.error('❌ Error: This is not a service account key file');
      process.exit(1);
    }
    
    // Check private key format
    if (!newKeyData.private_key.includes('BEGIN PRIVATE KEY') || 
        !newKeyData.private_key.includes('END PRIVATE KEY')) {
      console.error('❌ Error: Private key format appears invalid');
      process.exit(1);
    }
    
    console.log('✅ New key file validation passed');
    console.log('   Project ID:', newKeyData.project_id);
    console.log('   Client Email:', newKeyData.client_email);
    
    // Backup existing key
    const currentKeyPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(currentKeyPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(__dirname, `serviceAccountKey.backup.${timestamp}.json`);
      
      console.log('\n💾 Creating backup of current key...');
      fs.copyFileSync(currentKeyPath, backupPath);
      console.log('   Backup saved to:', backupPath);
    }
    
    // Replace the key
    console.log('\n🔄 Replacing service account key...');
    fs.copyFileSync(newKeyPath, currentKeyPath);
    console.log('✅ Service account key replaced successfully!');
    
    // Test the new key
    console.log('\n🧪 Testing new key...');
    const { initializeFirebase } = require('./config/firebase');
    
    try {
      const db = initializeFirebase();
      console.log('✅ Firebase initialization successful with new key');
      
      // Quick test of Firestore connection
      return testFirestoreConnection(db);
    } catch (error) {
      console.error('❌ Error initializing Firebase with new key:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error validating or replacing key:', error.message);
    process.exit(1);
  }
}

async function testFirestoreConnection(db) {
  try {
    console.log('   Testing Firestore connection...');
    const testRef = db.collection('_connection_test');
    const snapshot = await testRef.limit(1).get();
    
    console.log('✅ Firestore connection test successful!');
    console.log('🎉 Your Firebase authentication should now be working!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Run your server: npm start');
    console.log('2. Test your application to confirm projects are loading');
    console.log('3. If you still have issues, check Firestore Security Rules');
    
    return true;
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error.message);
    console.log('\n🤔 The key was replaced but Firestore is still not accessible.');
    console.log('This might be due to:');
    console.log('- Firestore Security Rules blocking access');
    console.log('- Project permissions issues');
    console.log('- Firestore service not enabled');
    console.log('\nPlease check your Firebase Console and Firestore settings.');
    
    return false;
  }
}

// Get command line argument
const newKeyPath = process.argv[2];

// If no path provided, show usage
if (!newKeyPath) {
  console.log('🔑 Firebase Service Account Key Replacement Tool\n');
  console.log('This tool helps you replace your current Firebase service account key');
  console.log('with a new one from the Firebase Console.\n');
  console.log('Usage:');
  console.log('  node replace-service-key.js /path/to/your/new-key.json\n');
  console.log('Example:');
  console.log('  node replace-service-key.js ~/Downloads/collabease-49374-firebase-adminsdk-abc123.json');
  process.exit(1);
}

// Run the replacement
replaceServiceAccountKey(newKeyPath)
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 