#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

console.log('\n=== Firebase Service Account Setup ===\n');
console.log('This script will help you set up your Firebase service account credentials.');
console.log('You can either enter the path to your downloaded JSON file or enter the credentials manually.\n');

rl.question('Do you have a Firebase service account JSON file? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    rl.question('\nEnter the path to your Firebase service account JSON file: ', (filePath) => {
      try {
        const expandedPath = filePath.replace(/^~/, process.env.HOME);
        const resolvedPath = path.resolve(expandedPath);
        
        if (!fs.existsSync(resolvedPath)) {
          console.error(`\nError: File not found at ${resolvedPath}`);
          rl.close();
          return;
        }
        
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        
        // Check if the file has the required fields
        if (!serviceAccount.type || !serviceAccount.project_id || !serviceAccount.private_key) {
          console.error('\nError: Invalid Firebase service account JSON file. Missing required fields.');
          rl.close();
          return;
        }
        
        // Write the file
        fs.writeFileSync(serviceAccountPath, JSON.stringify(serviceAccount, null, 2));
        console.log(`\nSuccess! Firebase service account credentials saved to ${serviceAccountPath}`);
        rl.close();
      } catch (error) {
        console.error('\nError:', error.message);
        rl.close();
      }
    });
  } else {
    console.log('\nPlease enter the following information from your Firebase service account:');
    
    const serviceAccount = {
      type: 'service_account',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      universe_domain: 'googleapis.com'
    };
    
    rl.question('\nProject ID: ', (project_id) => {
      serviceAccount.project_id = project_id;
      
      rl.question('Private Key ID: ', (private_key_id) => {
        serviceAccount.private_key_id = private_key_id;
        
        rl.question('Client Email: ', (client_email) => {
          serviceAccount.client_email = client_email;
          
          rl.question('Client ID: ', (client_id) => {
            serviceAccount.client_id = client_id;
            
            rl.question('Client X509 Cert URL: ', (client_x509_cert_url) => {
              serviceAccount.client_x509_cert_url = client_x509_cert_url;
              
              console.log('\nNow enter your private key. This is a long string that starts with "-----BEGIN PRIVATE KEY-----"');
              console.log('and ends with "-----END PRIVATE KEY-----"');
              console.log('You can copy it from your downloaded JSON file.\n');
              
              rl.question('Private Key (paste the entire key, including BEGIN and END lines): ', (private_key) => {
                // Format the private key correctly
                serviceAccount.private_key = private_key
                  .replace(/\\n/g, '\n') // Replace escaped newlines with actual newlines
                  .trim(); // Trim any extra whitespace
                
                // Make sure the key has the correct format
                if (!serviceAccount.private_key.startsWith('-----BEGIN PRIVATE KEY-----')) {
                  serviceAccount.private_key = '-----BEGIN PRIVATE KEY-----\n' + serviceAccount.private_key;
                }
                
                if (!serviceAccount.private_key.endsWith('-----END PRIVATE KEY-----')) {
                  serviceAccount.private_key = serviceAccount.private_key + '\n-----END PRIVATE KEY-----\n';
                }
                
                // Write the file
                fs.writeFileSync(serviceAccountPath, JSON.stringify(serviceAccount, null, 2));
                console.log(`\nSuccess! Firebase service account credentials saved to ${serviceAccountPath}`);
                rl.close();
              });
            });
          });
        });
      });
    });
  }
});

rl.on('close', () => {
  console.log('\nSetup complete. You can now run the server with "npm start".\n');
  process.exit(0);
}); 