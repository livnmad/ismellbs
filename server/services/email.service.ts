import nodemailer from 'nodemailer';
import crypto from 'crypto';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    // For production, use real SMTP credentials from env variables
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Fallback to console logging if SMTP not configured
    if (!process.env.SMTP_USER) {
      console.warn('⚠️  WARNING: SMTP not configured. Emails will be logged to console only.');
    }
  }

  /**
   * Generate a secure password reset token
   */
  generateResetToken(): { token: string; expires: number } {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour from now
    return { token, expires };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `https://www.ismellbullshit.com/password_reset?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"I Smell Bullshit" <noreply@ismellbullshit.com>',
      to: email,
      subject: 'Password Reset Request - I Smell Bullshit',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff6b35; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .button { display: inline-block; padding: 12px 24px; background: #ff6b35; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 15px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💩 I Smell Bullshit</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password for your I Smell Bullshit account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border: 1px solid #ddd;">
                ${resetUrl}
              </p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated email from I Smell Bullshit.</p>
              <p>If you have questions, please contact your administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request - I Smell Bullshit

Hello,

We received a request to reset your password for your I Smell Bullshit account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

---
I Smell Bullshit
      `.trim(),
    };

    try {
      if (process.env.SMTP_USER) {
        await this.transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to: ${email}`);
      } else {
        // Log to console if SMTP not configured (development)
        console.log('\n📧 PASSWORD RESET EMAIL (SMTP not configured):');
        console.log(`To: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('\n');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send new account creation email
   */
  async sendAccountCreationEmail(email: string, tempPassword: string): Promise<boolean> {
    const loginUrl = 'https://www.ismellbullshit.com/login';

    const mailOptions = {
      from: process.env.SMTP_FROM || '"I Smell Bullshit" <noreply@ismellbullshit.com>',
      to: email,
      subject: 'Welcome to I Smell Bullshit - Your Account Has Been Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff6b35; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .credentials { background: white; padding: 15px; border: 2px solid #ff6b35; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background: #ff6b35; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 15px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💩 Welcome to I Smell Bullshit!</h1>
            </div>
            <div class="content">
              <h2>Your Account Has Been Created</h2>
              <p>Hello,</p>
              <p>An administrator has created an account for you on I Smell Bullshit.</p>
              
              <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px;">${tempPassword}</code></p>
              </div>

              <div class="warning">
                <strong>🔒 Important Security Steps:</strong>
                <ol>
                  <li>Log in using the temporary password above</li>
                  <li><strong>Change your password immediately</strong> after logging in</li>
                  <li>Choose a strong, unique password</li>
                  <li>Never share your password with anyone</li>
                </ol>
              </div>

              <p style="text-align: center;">
                <a href="${loginUrl}" class="button">Log In Now</a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email from I Smell Bullshit.</p>
              <p>If you have questions, please contact your administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to I Smell Bullshit!

Your Account Has Been Created

Hello,

An administrator has created an account for you on I Smell Bullshit.

Your Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

IMPORTANT SECURITY STEPS:
1. Log in using the temporary password above
2. Change your password immediately after logging in
3. Choose a strong, unique password
4. Never share your password with anyone

Log in here: ${loginUrl}

---
I Smell Bullshit
      `.trim(),
    };

    try {
      if (process.env.SMTP_USER) {
        await this.transporter.sendMail(mailOptions);
        console.log(`✅ Account creation email sent to: ${email}`);
      } else {
        // Log to console if SMTP not configured (development)
        console.log('\n📧 ACCOUNT CREATION EMAIL (SMTP not configured):');
        console.log(`To: ${email}`);
        console.log(`Temporary Password: ${tempPassword}`);
        console.log(`Login URL: ${loginUrl}`);
        console.log('\n');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to send account creation email:', error);
      return false;
    }
  }
}

export default new EmailService();
