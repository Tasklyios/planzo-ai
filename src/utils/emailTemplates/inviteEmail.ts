
import { emailStyles, createEmailTemplate } from "../emailTemplates";

export const generateInviteEmail = (inviteLink: string, invitedBy: string, isDark: boolean = false) => {
  // In Supabase, use {{ .ConfirmationURL }} for the invite link placeholder
  const content = `
    <h1 style="${isDark ? emailStyles.darkHeading : emailStyles.heading}">You've Been Invited to PlanzoAI</h1>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">You have been invited to join PlanzoAI - the AI-powered content planning platform for creators.</p>
    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" style="${emailStyles.button}">Accept Invitation</a>
    </div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">Or copy and paste this URL into your browser:</p>
    <div style="${isDark ? emailStyles.darkCode : emailStyles.code}">{{ .ConfirmationURL }}</div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">This invitation will expire in 7 days.</p>
  `;
  
  return createEmailTemplate(content, isDark);
};
