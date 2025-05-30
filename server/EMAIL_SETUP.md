# 📧 Email Setup for Team Invitations

## 🚀 Quick Setup Guide

### 1. **Gmail App Password Setup**
1. Go to your Google Account settings
2. Enable 2-Factor Authentication (required)
3. Go to **Security** → **2-Step Verification** → **App passwords**
4. Generate an app password for "Mail"
5. Copy the 16-character password

### 2. **Environment Variables**
Add these to your `server/.env` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
```

### 3. **Test Email Sending**
```bash
# In server directory
node test-email.js
```

## 🔄 **How It Works**

### **Automatic Flow:**
1. **User clicks "Send Invite"** → Team.jsx
2. **API creates invitation** → server/routes/team.js
3. **Generates unique token** → UUID
4. **Saves to Firestore** → invitations collection
5. **Sends email automatically** → server/config/email.js
6. **User receives email** → with clickable link

### **Email Template:**
- ✅ Beautiful HTML design
- ✅ Responsive layout
- ✅ Clear call-to-action button
- ✅ 7-day expiration notice
- ✅ Fallback plain text

## 🧪 **Testing Current Invitations**

```bash
# Check existing invitations
node check-invitations.js

# Test invitation link
# Visit: http://localhost:3000/invite/[token]
```

## 📱 **Alternative Email Services**

Instead of Gmail, you can use:

### **SendGrid:**
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
```

### **Mailgun:**
```env
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain
```

### **SMTP (Custom):**
```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## 🔧 **Troubleshooting**

### **Email not sending?**
1. Check Gmail app password (not regular password)
2. Verify 2FA is enabled
3. Check console logs for errors
4. Test with: `node test-email.js`

### **Email goes to spam?**
1. Add your domain to SPF records
2. Use a custom domain email
3. Consider professional email service

### **Production deployment?**
1. Use environment variables
2. Consider SendGrid/Mailgun for reliability
3. Add proper error handling
4. Monitor email delivery rates 