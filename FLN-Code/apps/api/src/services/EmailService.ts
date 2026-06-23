import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_mockkey';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@numikids.com';

const resend = RESEND_API_KEY.startsWith('re_mock') ? null : new Resend(RESEND_API_KEY);

export class EmailService {
  /**
   * Sends email verification code to parent/teacher.
   */
  static async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const subject = `Verify Your FLN Account`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
        <h2 style="color: #D48D53;">Welcome to FLN!</h2>
        <p>Thank you for registering. Please verify your email address to get started.</p>
        <p>Your 6-digit verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; background-color: #FAF6EE; padding: 15px; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; color: #4A3E3D;">
          ${token}
        </div>
        <p>If you didn't request this email, you can safely ignore it.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
        <p style="font-size: 12px; color: #999;">FLN, Inc. - Foundational Literacy & Numeracy learning platform.</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }

  /**
   * Sends the weekly parent digest email.
   */
  static async sendWeeklyDigest(
    parentEmail: string,
    childName: string,
    stats: { stars: number; sessions: number; streak: number; focusSkill: string }
  ): Promise<boolean> {
    const subject = `Weekly Progress Report for ${childName} - NumiKids`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #FF6B6B; text-align: center;">NumiKids Weekly Progress Digest</h2>
        <p>Hello parent,</p>
        <p>Here is your weekly summary of how <strong>${childName}</strong> is doing on NumiKids:</p>
        
        <div style="background-color: #FFFDF7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Stars Earned this Week:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: #FFD93D; font-size: 18px;">⭐ ${stats.stars}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Sessions Completed:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 18px;">🎮 ${stats.sessions}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Current Streak:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: #FF6B6B; font-size: 18px;">🔥 ${stats.streak} Days</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Recommended Focus Area:</strong></td>
              <td style="padding: 8px 0; text-align: right; color: #4ECDC4;"><strong>${stats.focusSkill}</strong></td>
            </tr>
          </table>
        </div>
        
        <p>Keep supporting ${childName}'s learning journey!</p>
        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent/dashboard" 
             style="background-color: #FF6B6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Go to Parent Dashboard
          </a>
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
        <p style="font-size: 12px; color: #999; text-align: center;">NumiKids, Inc. - Safe, gamified math education for early learners.</p>
      </div>
    `;

    return this.sendEmail(parentEmail, subject, html);
  }

  /**
   * Sends a streak reminder if the child hasn't logged in today by evening.
   */
  static async sendStreakReminder(parentEmail: string, childName: string, streakDays: number): Promise<boolean> {
    const subject = `Keep ${childName}'s ${streakDays}-Day Math Streak Going!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #FF6B6B; text-align: center;">🔥 Streak Warning!</h2>
        <p>Hello,</p>
        <p>Don't let <strong>${childName}</strong> lose their amazing <strong>${streakDays}-day streak</strong> on NumiKids!</p>
        <p>Just 5 minutes of play today will keep the streak alive and help lock in their math skills.</p>
        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/home" 
             style="background-color: #4ECDC4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Start Play Session
          </a>
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 40px;" />
        <p style="font-size: 12px; color: #999; text-align: center;">If you've already completed today's lesson, you're all set!</p>
      </div>
    `;

    return this.sendEmail(parentEmail, subject, html);
  }

  /**
   * Sends an achievement email when a child earns a new badge.
   */
  static async sendAchievementNotification(
    parentEmail: string,
    childName: string,
    badgeName: string,
    badgeDescription: string
  ): Promise<boolean> {
    const subject = `🏆 Achievement Unlocked: ${childName} earned the ${badgeName} badge!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
        <h2 style="color: #95E06C;">Congratulations! 🏆</h2>
        <p style="font-size: 16px;"><strong>${childName}</strong> has earned a new badge on NumiKids:</p>
        
        <div style="margin: 30px auto; padding: 20px; border: 2px dashed #95E06C; border-radius: 10px; display: inline-block; background-color: #FFFDF7;">
          <span style="font-size: 48px;">⭐</span>
          <h3 style="margin: 10px 0; color: #2D2D2D;">${badgeName}</h3>
          <p style="margin: 0; color: #6B7280;">${badgeDescription}</p>
        </div>
        
        <p>This is a major milestone in their foundational numeracy journey. Celebrate this success with them!</p>
        
        <p style="margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/parent/dashboard" 
             style="background-color: #FF6B6B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Badges on Dashboard
          </a>
        </p>
      </div>
    `;

    return this.sendEmail(parentEmail, subject, html);
  }

  /**
   * Helper method to send email. Checks if in mock mode.
   */
  private static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!resend) {
      console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      console.log(`[MOCK EMAIL BODY]`, html.replace(/<[^>]*>/g, '').substring(0, 300) + '...');
      return true;
    }

    try {
      const response = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: to,
        subject: subject,
        html: html
      });

      if (response.error) {
        console.error('Resend email error:', response.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to send email via Resend:', err);
      return false;
    }
  }
}
export default EmailService;
