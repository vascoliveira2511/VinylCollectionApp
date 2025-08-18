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
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background-color: #f5f2e8;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #f8f5f0;
              border-radius: 24px;
              border: 1px solid #e8e3d5;
              overflow: hidden;
            }
            .header {
              background: #f8f5f0;
              padding: 48px 40px 24px;
              text-align: center;
              border-bottom: 1px solid #e8e3d5;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              margin: 0;
              font-size: 32px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 8px;
            }
            .header .subtitle {
              font-size: 16px;
              color: #6b6b6b;
              margin: 0;
            }
            .vinyl-icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 24px;
              background: #1a1a1a;
              border-radius: 50%;
              position: relative;
              overflow: hidden;
            }
            .vinyl-icon::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 12px;
              height: 12px;
              background: #f8f5f0;
              border-radius: 50%;
            }
            .vinyl-icon::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 36px;
              height: 36px;
              border: 2px solid #e76037;
              border-radius: 50%;
            }
            .content {
              padding: 40px;
            }
            .content h2 {
              font-family: 'Playfair Display', serif;
              font-size: 24px;
              margin: 0 0 16px 0;
              color: #1a1a1a;
            }
            .content p {
              color: #2a2a2a;
              margin: 16px 0;
            }
            .button {
              display: inline-block;
              background: #e76037;
              color: #fefcf8;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 16px;
              font-weight: 600;
              margin: 24px 0;
              font-family: 'Inter', sans-serif;
              border: 1px solid #d55530;
              transition: all 0.3s ease;
            }
            .link-text {
              word-break: break-all;
              color: #6b6b6b;
              font-size: 14px;
              font-family: 'JetBrains Mono', monospace;
              background: #f0ede0;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e8e3d5;
            }
            .footer {
              background: #f0ede0;
              padding: 24px 40px;
              text-align: center;
              font-size: 14px;
              color: #6b6b6b;
              border-top: 1px solid #e8e3d5;
            }
            .footer p {
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="vinyl-icon"></div>
              <h1>${APP_NAME}</h1>
              <p class="subtitle">Organize your music, one record at a time</p>
            </div>
            <div class="content">
              <h2>Verify your email address</h2>
              <p>Welcome to ${APP_NAME}! Please verify your email address to complete your account setup and start organizing your vinyl collection.</p>
              
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="link-text">${verificationUrl}</div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6b6b6b;">
                If you didn't create an account with ${APP_NAME}, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p><strong>${APP_NAME}</strong> © ${new Date().getFullYear()}</p>
              <p>Built for vinyl enthusiasts</p>
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
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background-color: #f5f2e8;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #f8f5f0;
              border-radius: 24px;
              border: 1px solid #e8e3d5;
              overflow: hidden;
            }
            .header {
              background: #f8f5f0;
              padding: 48px 40px 24px;
              text-align: center;
              border-bottom: 1px solid #e8e3d5;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              margin: 0;
              font-size: 32px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 8px;
            }
            .header .subtitle {
              font-size: 16px;
              color: #6b6b6b;
              margin: 0;
            }
            .lock-icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 24px;
              background: #c8542a;
              border-radius: 16px;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .lock-icon::before {
              content: '🔒';
              font-size: 28px;
              color: #fefcf8;
            }
            .content {
              padding: 40px;
            }
            .content h2 {
              font-family: 'Playfair Display', serif;
              font-size: 24px;
              margin: 0 0 16px 0;
              color: #1a1a1a;
            }
            .content p {
              color: #2a2a2a;
              margin: 16px 0;
            }
            .button {
              display: inline-block;
              background: #c8542a;
              color: #fefcf8;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 16px;
              font-weight: 600;
              margin: 24px 0;
              font-family: 'Inter', sans-serif;
              border: 1px solid #b04a24;
              transition: all 0.3s ease;
            }
            .link-text {
              word-break: break-all;
              color: #6b6b6b;
              font-size: 14px;
              font-family: 'JetBrains Mono', monospace;
              background: #f0ede0;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e8e3d5;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #d4a54b;
              border-radius: 12px;
              padding: 16px;
              margin: 20px 0;
              color: #856404;
            }
            .footer {
              background: #f0ede0;
              padding: 24px 40px;
              text-align: center;
              font-size: 14px;
              color: #6b6b6b;
              border-top: 1px solid #e8e3d5;
            }
            .footer p {
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="lock-icon"></div>
              <h1>Password Reset</h1>
              <p class="subtitle">Secure your ${APP_NAME} account</p>
            </div>
            <div class="content">
              <h2>Reset your password</h2>
              <p>We received a request to reset the password for your ${APP_NAME} account. Click the button below to create a new password.</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your security.
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="link-text">${resetUrl}</div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6b6b6b;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </div>
            <div class="footer">
              <p><strong>${APP_NAME}</strong> © ${new Date().getFullYear()}</p>
              <p>Built for vinyl enthusiasts</p>
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
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.6;
              color: #1a1a1a;
              background-color: #f5f2e8;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #f8f5f0;
              border-radius: 24px;
              border: 1px solid #e8e3d5;
              overflow: hidden;
            }
            .header {
              background: #f8f5f0;
              padding: 48px 40px 24px;
              text-align: center;
              border-bottom: 1px solid #e8e3d5;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              margin: 0;
              font-size: 32px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 8px;
            }
            .header .subtitle {
              font-size: 16px;
              color: #6b6b6b;
              margin: 0;
            }
            .welcome-icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 24px;
              background: #6b7a55;
              border-radius: 16px;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .welcome-icon::before {
              content: '🎉';
              font-size: 28px;
            }
            .content {
              padding: 40px;
            }
            .content h2 {
              font-family: 'Playfair Display', serif;
              font-size: 24px;
              margin: 0 0 16px 0;
              color: #1a1a1a;
            }
            .content p {
              color: #2a2a2a;
              margin: 16px 0;
            }
            .button {
              display: inline-block;
              background: #e76037;
              color: #fefcf8;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 16px;
              font-weight: 600;
              margin: 24px 0;
              font-family: 'Inter', sans-serif;
              border: 1px solid #d55530;
              transition: all 0.3s ease;
            }
            .feature-list {
              background: #f0ede0;
              border-radius: 16px;
              padding: 24px;
              margin: 24px 0;
              border: 1px solid #e8e3d5;
            }
            .feature-list h3 {
              font-family: 'Playfair Display', serif;
              margin: 0 0 16px 0;
              color: #1a1a1a;
              font-size: 20px;
            }
            .feature-list ul {
              margin: 0;
              padding-left: 0;
              list-style: none;
            }
            .feature-list li {
              margin: 12px 0;
              padding-left: 24px;
              position: relative;
              color: #2a2a2a;
            }
            .feature-list li::before {
              content: '→';
              position: absolute;
              left: 0;
              color: #e76037;
              font-weight: 600;
            }
            .footer {
              background: #f0ede0;
              padding: 24px 40px;
              text-align: center;
              font-size: 14px;
              color: #6b6b6b;
              border-top: 1px solid #e8e3d5;
            }
            .footer p {
              margin: 8px 0;
            }
            .footer .signature {
              font-style: italic;
              color: #2a2a2a;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="welcome-icon"></div>
              <h1>Welcome to ${APP_NAME}!</h1>
              <p class="subtitle">Your collection journey begins</p>
            </div>
            <div class="content">
              <h2>Hey ${username}, you're all set!</h2>
              <p>Your email has been verified and your account is ready to use. You can now start building and organizing your vinyl collection with all the tools you need.</p>
              
              <div class="feature-list">
                <h3>What you can do now</h3>
                <ul>
                  <li>Add your vinyl records with detailed information</li>
                  <li>Search and discover new releases via Discogs integration</li>
                  <li>View collection statistics and insights</li>
                  <li>Connect with friends and share recommendations</li>
                  <li>Rate and review your favorite albums</li>
                  <li>Scan barcodes to quickly add records</li>
                </ul>
              </div>
              
              <a href="${APP_URL}" class="button">Start Building Your Collection</a>
              
              <p>If you have any questions or need help getting started, don't hesitate to reach out. We're here to help you organize your music, one record at a time.</p>
            </div>
            <div class="footer">
              <p class="signature">Happy collecting!</p>
              <p><strong>${APP_NAME}</strong> © ${new Date().getFullYear()}</p>
              <p>Built for vinyl enthusiasts</p>
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