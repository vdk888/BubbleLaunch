// Try to import nodemailer, but provide a fallback if it's not available
let nodemailer: any;
let nodemailerAvailable = true;

try {
  // Dynamic import for nodemailer
  nodemailer = await import('nodemailer');
} catch (error) {
  console.warn('Nodemailer package not available. Email notifications will be disabled.');
  nodemailerAvailable = false;
}
import dotenv from 'dotenv';
import { getAllSubscribers } from './notionSubscriberService.js';

dotenv.config();

// Email configuration
const emailAddress = process.env.EMAIL_ADDRESS;
const emailPassword = process.env.BUBBLE_INVEST_EMAIL_PASSWORD;

if (!emailAddress || !emailPassword) {
  console.warn('EMAIL_ADDRESS or BUBBLE_INVEST_EMAIL_PASSWORD not set in .env. Email notification functionality will be disabled.');
}

// Create a transporter object using SMTP transport (if nodemailer is available)
let transporter: any = null;

if (nodemailerAvailable && emailAddress && emailPassword) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailAddress,
        pass: emailPassword,
      },
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
  }
}

/**
 * Send notification email to all subscribers about a new blog post
 * @param title - The title of the new blog post
 * @param summary - A brief summary of the blog post
 * @param notionUrl - The URL to the blog post in Notion
 * @returns Promise<boolean> - Whether the emails were sent successfully
 */
export async function notifySubscribersAboutNewPost(
  title: string, 
  summary: string, 
  notionUrl: string
): Promise<boolean> {
  if (!nodemailerAvailable) {
    console.warn('Email notification disabled: Nodemailer package not available');
    return false;
  }
  
  if (!emailAddress || !emailPassword) {
    console.warn('Email notification disabled: Missing email configuration');
    return false;
  }
  
  if (!transporter) {
    console.warn('Email notification disabled: Email transporter not initialized');
    return false;
  }

  try {
    // Get all active subscribers from Notion
    const subscribers = await getAllSubscribers();
    
    if (subscribers.length === 0) {
      console.log('No active subscribers found to notify');
      return true; // No subscribers is not an error
    }
    
    console.log(`Sending email notification to ${subscribers.length} subscribers`);

    // Create email content
    const subject = `New Blog Post: ${title}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Blog Post Published!</h2>
        <h3 style="color: #444;">${title}</h3>
        <p style="color: #666; line-height: 1.6;">${summary}</p>
        <div style="margin: 30px 0;">
          <a href="${notionUrl}" 
             style="background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Read Full Post
          </a>
        </div>
        <p style="color: #999; font-size: 0.8em; margin-top: 40px;">
          You're receiving this email because you subscribed to blog updates.
          <br>
          <a href="[unsubscribe-url]" style="color: #999;">Unsubscribe</a>
        </p>
      </div>
    `;

    // Send emails to all subscribers (using BCC for privacy)
    const mailOptions = {
      from: `"My Personal Blog" <${emailAddress}>`,
      bcc: subscribers.join(','), // Use BCC to hide recipients from each other
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Successfully sent email notification to ${subscribers.length} subscribers`);
    return true;
  } catch (error) {
    console.error('Error sending email notifications:', error);
    return false;
  }
}
