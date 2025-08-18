import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_NAME = 'Vinyl Collection';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Verify your ${APP_NAME} account`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background: #5a6fd8;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .logo {
              font-size: 36px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎵</div>
              <h1>Welcome to ${APP_NAME}!</h1>
            </div>
            <div class="content">
              <h2>Verify your email address</h2>
              <p>Thanks for signing up for ${APP_NAME}! Please verify your email address to complete your account setup and start organizing your vinyl collection.</p>
              
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationUrl}</p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you didn't create an account with ${APP_NAME}, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>This email was sent from ${APP_NAME}. © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Reset your ${APP_NAME} password`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              background: #ff6b6b;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background: #ff5757;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .logo {
              font-size: 36px;
              margin-bottom: 10px;
            }
            .warning {
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
          <div class="container">
            <div class="header">
              <div class="logo">🔐</div>
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset your password</h2>
              <p>We received a request to reset the password for your ${APP_NAME} account. Click the button below to create a new password.</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your security.
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </div>
            <div class="footer">
              <p>This email was sent from ${APP_NAME}. © ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log('Password reset email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string, username: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Welcome to ${APP_NAME}! 🎵`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${APP_NAME}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .button {
              display: inline-block;
              background: #48bb78;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .feature-list {
              background: #f8f9fa;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .feature-list ul {
              margin: 0;
              padding-left: 20px;
            }
            .feature-list li {
              margin: 8px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .logo {
              font-size: 48px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎵</div>
              <h1>Welcome to ${APP_NAME}!</h1>
            </div>
            <div class="content">
              <h2>Hey ${username}, you're all set! 🎉</h2>
              <p>Your email has been verified and your account is ready to use. You can now start building and organizing your vinyl collection!</p>
              
              <div class="feature-list">
                <h3>🚀 Here's what you can do:</h3>
                <ul>
                  <li>📀 Add your vinyl records with detailed information</li>
                  <li>🔍 Search and discover new releases via Discogs integration</li>
                  <li>📊 View collection statistics and charts</li>
                  <li>👥 Connect with friends and share recommendations</li>
                  <li>⭐ Rate and review your favorite albums</li>
                  <li>📱 Scan barcodes to quickly add records</li>
                </ul>
              </div>
              
              <a href="${APP_URL}" class="button">Start Building Your Collection</a>
              
              <p>If you have any questions or need help getting started, don't hesitate to reach out!</p>
            </div>
            <div class="footer">
              <p>Happy collecting! 🎶<br>The ${APP_NAME} Team</p>
              <p>© ${new Date().getFullYear()} ${APP_NAME}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }

    console.log('Welcome email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}