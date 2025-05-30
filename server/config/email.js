const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  // For development - using Gmail SMTP
  // You can also use other services like SendGrid, Mailgun, etc.
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password (not regular password)
    }
  });
};

// Send invitation email
const sendInvitationEmail = async (email, inviteLink, invitedByName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'CollabEase Team',
        address: process.env.EMAIL_USER || 'noreply@collabease.com'
      },
      to: email,
      subject: `🎉 You're invited to join CollabEase!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              font-family: 'Arial', sans-serif;
              background-color: #f8f9fa;
              padding: 20px;
            }
            .email-card {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 2rem;
              font-weight: bold;
              color: #4e73df;
              margin-bottom: 10px;
            }
            .invite-btn {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(45deg, #4e73df, #224abe);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6c757d;
              font-size: 0.9rem;
            }
            .expires {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-card">
              <div class="header">
                <div class="logo">CollabEase</div>
                <h1>🎉 You're Invited!</h1>
              </div>
              
              <p>Hi there!</p>
              
              <p><strong>${invitedByName}</strong> has invited you to join their team on <strong>CollabEase</strong> - a powerful project management and collaboration platform.</p>
              
              <p>With CollabEase, you can:</p>
              <ul>
                <li>📋 Manage projects and tasks with Kanban boards</li>
                <li>👥 Collaborate with your team in real-time</li>
                <li>🎯 Track progress and stay organized</li>
                <li>💬 Communicate effectively with team members</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${inviteLink}" class="invite-btn">Accept Invitation & Join Team</a>
              </div>
              
              <div class="expires">
                ⏰ <strong>Important:</strong> This invitation expires in 7 days. Make sure to accept it soon!
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${inviteLink}
              </p>
              
              <div class="footer">
                <p>Best regards,<br>The CollabEase Team</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        You're invited to join CollabEase!
        
        ${invitedByName} has invited you to join their team on CollabEase.
        
        Click this link to accept the invitation:
        ${inviteLink}
        
        This invitation expires in 7 days.
        
        Best regards,
        The CollabEase Team
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvitationEmail
}; 