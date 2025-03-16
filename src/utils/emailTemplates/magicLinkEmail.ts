
import { emailStyles, createEmailTemplate } from "../emailTemplates";

export const generateMagicLinkEmail = (magicLink: string, isDark: boolean = false) => {
  // In Supabase, use {{ .ConfirmationURL }} for the confirmation link placeholder
  const content = `
    <h1 style="${isDark ? emailStyles.darkHeading : emailStyles.heading}">Sign in to PlanzoAI</h1>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">Click the button below to sign into your PlanzoAI account. This link will expire in 24 hours.</p>
    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" style="${emailStyles.button}">Sign In to PlanzoAI</a>
    </div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">Or copy and paste this URL into your browser:</p>
    <div style="${isDark ? emailStyles.darkCode : emailStyles.code}">{{ .ConfirmationURL }}</div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">If you didn't request this email, you can safely ignore it.</p>
  `;
  
  return createEmailTemplate(content, isDark);
};
