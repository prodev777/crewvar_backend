import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify/${token}`;
  
  const mailOptions = {
    from: `"Crewvar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Crewvar - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #069B93; color: white; padding: 20px; text-align: center;">
          <h1>🚢 Welcome to Crewvar!</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #00374D;">Almost there!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Thank you for joining Crewvar - the social network for cruise crew members. 
            We're excited to help you connect with your fellow crew members!
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            To complete your registration, please verify your email address by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #069B93; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            If the button doesn't work, you can also copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all;">
            ${verificationUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 14px; color: #666;">
            This verification link will expire in 24 hours. If you didn't create an account with Crewvar, 
            you can safely ignore this email.
          </p>
          <p style="font-size: 14px; color: #666;">
            Welcome aboard! 🌊<br>
            The Crewvar Team
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`;
  
  const mailOptions = {
    from: `"Crewvar" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Crewvar - Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #069B93; color: white; padding: 20px; text-align: center;">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            We received a request to reset your Crewvar password. If you made this request, 
            click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #069B93; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; 
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            If you didn't request a password reset, you can safely ignore this email. 
            Your password will remain unchanged.
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all;">
            Reset link: ${resetUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 14px; color: #666;">
            This reset link will expire in 1 hour for security reasons.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};
