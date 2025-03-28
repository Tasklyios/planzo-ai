
import { emailStyles, createEmailTemplate } from "../emailTemplates";

// Note: This utility is maintained for legacy purposes, but the actual template
// used will be configured in Supabase's email template settings

export const generateResetPasswordEmail = (resetLink: string, isDark: boolean = false) => {
  // Extract any token information from the provided link
  const url = new URL(resetLink.startsWith('http') ? resetLink : `https://planzoai.com${resetLink}`);
  
  // For OTP-based flow, we would typically display the token/code here
  // but since Supabase handles template rendering with {{ .Token }}, 
  // we'll use a placeholder for preview purposes
  const sampleOtpCode = "123456"; // This is just for preview, actual code will be inserted by Supabase
  
  const content = `
    <h1 style="${isDark ? emailStyles.darkHeading : emailStyles.heading}">Reset Your Password</h1>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">A password reset has been requested for your PlanzoAI account. Use the 6-digit code below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: ${isDark ? '#2a2a2a' : '#f4f4f4'}; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; display: inline-block; color: ${isDark ? '#ffffff' : '#333333'};">
        ${sampleOtpCode}
      </div>
    </div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">Enter this code on the password reset page to create a new password.</p>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">If you didn't request a password reset, you can safely ignore this email.</p>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">This code will expire in 24 hours.</p>
  `;
  
  return createEmailTemplate(content, isDark);
};
