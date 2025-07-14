// utilities/mailService.ts
import nodemailer from 'nodemailer';
import WelcomeTemplate from '@/components/MailTemplate/welcomeTemplate';

// Email configuration types
export interface EmailConfig {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export interface UserEmailData {
  name: string;
  email: string;
  userId?: string;
  resetToken?: string;
  verificationToken?: string;
}

export enum EmailTemplate {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  VERIFICATION = 'verification',
  ONBOARDING_COMPLETE = 'onboarding_complete'
}

// Initialize Nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // Can be changed based on your email provider
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Verifies email configuration is working
 * @returns Promise<boolean> - Whether verification was successful
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
}

/**
 * Send an email with provided configuration
 * @param config - Email configuration
 * @returns Promise<boolean> - Whether email was sent successfully
 */
export async function sendEmail(config: EmailConfig): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      ...config,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${config.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Get template for welcome email
 * @param user - User data for email personalization
 * @returns HTML template for welcome email
 */
function getWelcomeTemplate(user: UserEmailData): string {
  return WelcomeTemplate({ user });
}

/**
 * Get template for password reset email
 * @param user - User data for email personalization
 * @returns HTML template for password reset email
 */
function getPasswordResetTemplate(user: UserEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Force</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f8fb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 24px rgba(0,0,0,0.07);">
        <h2 style="color: #222; text-align: center; margin-bottom: 30px;">Password Reset Request</h2>
        <p style="color: #555; line-height: 1.6;">Hi ${user.name},</p>
        <p style="color: #555; line-height: 1.6;">We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/reset-password?token=${user.resetToken}" 
             style="background: linear-gradient(90deg, #4CAF50 0%, #43a047 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Reset Password
          </a>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">This link will expire in 24 hours.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get template for verification email
 * @param user - User data for email personalization
 * @returns HTML template for verification email
 */
function getVerificationTemplate(user: UserEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - Force</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f8fb; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 24px rgba(0,0,0,0.07);">
        <h2 style="color: #222; text-align: center; margin-bottom: 30px;">Verify Your Email</h2>
        <p style="color: #555; line-height: 1.6;">Hi ${user.name},</p>
        <p style="color: #555; line-height: 1.6;">Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/verify-email?token=${user.verificationToken}" 
             style="background: linear-gradient(90deg, #4285F4 0%, #1a57cb 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Verify Email
          </a>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">This link will expire in 24 hours.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get template for onboarding completion email
 * @param user - User data for email personalization
 * @returns HTML template for onboarding completion email
 */
function getOnboardingCompleteTemplate(user: UserEmailData): string {
  return WelcomeTemplate({ user });
}

/**
 * Get the appropriate email template based on template type
 * @param template - Type of email template to use
 * @param user - User data for email personalization
 * @returns HTML template for the specified email type
 */
function getEmailTemplate(template: EmailTemplate, user: UserEmailData): string {
  switch (template) {
    case EmailTemplate.WELCOME:
      return getWelcomeTemplate(user);
    case EmailTemplate.PASSWORD_RESET:
      return getPasswordResetTemplate(user);
    case EmailTemplate.VERIFICATION:
      return getVerificationTemplate(user);
    case EmailTemplate.ONBOARDING_COMPLETE:
      return getOnboardingCompleteTemplate(user);
    default:
      throw new Error(`Email template ${template} not found`);
  }
}

/**
 * Send a template-based email to a user
 * @param template - Type of email template to use
 * @param user - User data for email personalization
 * @param customSubject - Optional custom subject line
 * @returns Promise<boolean> - Whether email was sent successfully
 */
export async function sendTemplatedEmail(
  template: EmailTemplate,
  user: UserEmailData,
  customSubject?: string
): Promise<boolean> {
  try {
    // Generate subject based on template if not provided
    let subject = customSubject;
    if (!subject) {
      switch (template) {
        case EmailTemplate.WELCOME:
          subject = 'Welcome to Force - Registration Successful';
          break;
        case EmailTemplate.PASSWORD_RESET:
          subject = 'Reset Your Force Account Password';
          break;
        case EmailTemplate.VERIFICATION:
          subject = 'Verify Your Force Account Email';
          break;
        case EmailTemplate.ONBOARDING_COMPLETE:
          subject = '🎉 Welcome to Force Beta - Your Account is Ready!';
          break;
        default:
          subject = 'Force Account Notification';
      }
    }

    const htmlContent = getEmailTemplate(template, user);
    
    return await sendEmail({
      to: user.email,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error(`Error sending ${template} email:`, error);
    return false;
  }
}

export default {
  sendEmail,
  sendTemplatedEmail,
  verifyEmailConfig,
  EmailTemplate,
};