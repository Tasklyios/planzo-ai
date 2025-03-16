
import { emailStyles, createEmailTemplate } from "../emailTemplates";

export const generateChangeEmailEmail = (confirmationLink: string, isDark: boolean = false) => {
  // In Supabase, use {{ .ConfirmationURL }} for the email change confirmation link placeholder
  const content = `
    <h1 style="${isDark ? emailStyles.darkHeading : emailStyles.heading}">Confirm Email Change</h1>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">We received a request to change your email address for your PlanzoAI account. Click the button below to confirm this change.</p>
    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" style="${emailStyles.button}">Confirm Email Change</a>
    </div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">Or copy and paste this URL into your browser:</p>
    <div style="${isDark ? emailStyles.darkCode : emailStyles.code}">{{ .ConfirmationURL }}</div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">If you didn't request this change, please contact support immediately.</p>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">This link will expire in 24 hours.</p>
  `;
  
  return createEmailTemplate(content, isDark);
};
