
import { emailStyles, createEmailTemplate } from "../emailTemplates";

export const generateResetPasswordEmail = (resetLink: string, isDark: boolean = false) => {
  // Make sure the URL includes the type=recovery parameter
  const content = `
    <h1 style="${isDark ? emailStyles.darkHeading : emailStyles.heading}">Reset Your Password</h1>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">A password reset has been requested for your PlanzoAI account. Click the button below to set a new password.</p>
    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}&type=recovery" style="${emailStyles.button}">Reset Password</a>
    </div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">Or copy and paste this URL into your browser:</p>
    <div style="${isDark ? emailStyles.darkCode : emailStyles.code}">{{ .ConfirmationURL }}&type=recovery</div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">If you didn't request a password reset, you can safely ignore this email.</p>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">This password reset link will expire in 24 hours.</p>
  `;
  
  return createEmailTemplate(content, isDark);
};
