#!/usr/bin/env node

const { initializeFirebase } = require('./config/firebase');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Firebase Authentication Diagnostic Script\n');

async function checkSystemTime() {
  console.log('1. Checking system time synchronization...');
  
  try {
    // Get current system time
    const systemTime = new Date();
    console.log('   System time:', systemTime.toISOString());
    
    // Try to get accurate time from world time API
    const https = require('https');
    const worldTimePromise = new Promise((resolve, reject) => {
      const req = https.get('https://worldtimeapi.org/api/timezone/UTC', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const timeData = JSON.parse(data);
            resolve(new Date(timeData.utc_datetime));
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });

    try {
      const worldTime = await worldTimePromise;
      const timeDiff = Math.abs(systemTime.getTime() - worldTime.getTime());
      const timeDiffSeconds = timeDiff / 1000;
      
      console.log('   World time:  ', worldTime.toISOString());
      console.log('   Time difference:', timeDiffSeconds.toFixed(2), 'seconds');
      
      if (timeDiffSeconds > 300) { // 5 minutes
        console.log('   ❌ CRITICAL: System time is more than 5 minutes off!');
        console.log('   This is likely causing the Firebase authentication errors.');
        console.log('   Please sync your system time.');
        
        // Try to fix time on macOS
        if (process.platform === 'darwin') {
          console.log('\n   To fix on macOS, run:');
          console.log('   sudo sntp -sS time.apple.com');
        } else if (process.platform === 'linux') {
          console.log('\n   To fix on Linux, run:');
          console.log('   sudo apt-get install ntp');
          console.log('   sudo systemctl restart ntp');
        }
        return false;
      } else if (timeDiffSeconds > 30) {
        console.log('   ⚠️  WARNING: System time is', timeDiffSeconds.toFixed(2), 'seconds off');
        console.log('   This might cause authentication issues.');
        return false;
      } else {
        console.log('   ✅ System time is synchronized');
        return true;
      }
    } catch (err) {
      console.log('   ⚠️  Could not verify time synchronization (network issue)');
      console.log('   Assuming time is correct...');
      return true;
    }
  } catch (error) {
    console.log('   ⚠️  Error checking system time:', error.message);
    return true;
  }
}

function checkServiceAccountKey() {
  console.log('\n2. Checking service account key...');
  
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.log('   ❌ Service account key file not found');
    return false;
  }
  
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    // Check required fields
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      console.log('   ❌ Service account key is missing required fields:', missingFields.join(', '));
      return false;
    }
    
    // Check if private key looks valid
    if (!serviceAccount.private_key.includes('BEGIN PRIVATE KEY') || 
        !serviceAccount.private_key.includes('END PRIVATE KEY')) {
      console.log('   ❌ Private key format appears invalid');
      return false;
    }
    
    console.log('   ✅ Service account key structure looks valid');
    console.log('   Project ID:', serviceAccount.project_id);
    console.log('   Client Email:', serviceAccount.client_email);
    
    return true;
  } catch (error) {
    console.log('   ❌ Error reading service account key:', error.message);
    return false;
  }
}

async function testFirebaseConnection() {
  console.log('\n3. Testing Firebase connection...');
  
  try {
    const db = initializeFirebase();
    console.log('   ✅ Firebase initialization successful');
    
    // Test a simple Firestore operation
    console.log('   Testing Firestore connection...');
    const testRef = db.collection('_test_connection');
    const snapshot = await testRef.limit(1).get();
    
    console.log('   ✅ Firestore connection successful');
    console.log('   Documents queried:', snapshot.docs.length);
    
    return true;
  } catch (error) {
    console.log('   ❌ Firebase connection failed');
    console.log('   Error code:', error.code);
    console.log('   Error message:', error.message);
    
    if (error.code === 16) {
      console.log('\n   This is the UNAUTHENTICATED error we\'re trying to fix.');
    }
    
    return false;
  }
}

function provideSolutions() {
  console.log('\n🔧 Potential Solutions:\n');
  
  console.log('1. **Regenerate Service Account Key**:');
  console.log('   - Go to Firebase Console → Project Settings → Service Accounts');
  console.log('   - Click "Generate New Private Key"');
  console.log('   - Download the new JSON file');
  console.log('   - Replace your current serviceAccountKey.json with the new file');
  
  console.log('\n2. **Sync System Time**:');
  if (process.platform === 'darwin') {
    console.log('   - Run: sudo sntp -sS time.apple.com');
  } else if (process.platform === 'linux') {
    console.log('   - Run: sudo apt-get install ntp');
    console.log('   - Run: sudo systemctl restart ntp');
  } else {
    console.log('   - Ensure your system clock is synchronized with internet time');
  }
  
  console.log('\n3. **Check Firestore Security Rules**:');
  console.log('   - Make sure your Firestore rules allow admin access');
  console.log('   - Rules for admin should look like:');
  console.log('     rules_version = \'2\';');
  console.log('     service cloud.firestore {');
  console.log('       match /databases/{database}/documents {');
  console.log('         match /{document=**} {');
  console.log('           allow read, write: if request.auth != null;');
  console.log('         }');
  console.log('       }');
  console.log('     }');
  
  console.log('\n4. **Restart the Server**:');
  console.log('   - After making changes, restart your Node.js server');
  console.log('   - Clear any cached credentials');
}

async function main() {
  const timeOk = await checkSystemTime();
  const keyOk = checkServiceAccountKey();
  const connectionOk = await testFirebaseConnection();
  
  console.log('\n📊 Summary:');
  console.log('   System Time:', timeOk ? '✅' : '❌');
  console.log('   Service Account Key:', keyOk ? '✅' : '❌');
  console.log('   Firebase Connection:', connectionOk ? '✅' : '❌');
  
  if (!connectionOk) {
    provideSolutions();
  } else {
    console.log('\n🎉 All checks passed! Your Firebase setup should be working correctly.');
  }
  
  process.exit(connectionOk ? 0 : 1);
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 