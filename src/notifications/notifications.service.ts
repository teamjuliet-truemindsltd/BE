import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private configService: ConfigService) {}

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const apiKey = this.configService.get<string>('BREVO_API_KEY');
      const senderEmail = this.configService.get<string>('SMTP_USER');
      const senderName = this.configService.get<string>('SMTP_FROM_NAME') || 'TalentFlow LMS';

      if (!apiKey) {
        throw new Error('BREVO_API_KEY is not defined in environment variables');
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Brevo API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      this.logger.log(`Email sent via Brevo: ${data.messageId}`);
      return data;
    } catch (error) {
      this.logger.error('Error sending email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to send email notification');
    }
  }

  async sendOtpEmail(email: string, otp: string) {
    const subject = 'Your Verification Code - TrueMinds TalentFlow';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Welcome to TrueMinds TalentFlow!</h2>
        <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
        <div style="font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0; color: #007bff; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 TrueMinds TalentFlow LMS. All rights reserved.</p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }
}
