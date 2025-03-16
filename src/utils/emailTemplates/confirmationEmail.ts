
import { emailStyles, createEmailTemplate } from "../emailTemplates";

export const generateConfirmationEmail = (confirmationLink: string, isDark: boolean = false) => {
  const content = `
    <h1 style="${isDark ? emailStyles.darkHeading : emailStyles.heading}">Confirm Your Email Address</h1>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">Thanks for signing up for PlanzoAI! Please confirm your email address by clicking the button below.</p>
    <div style="text-align: center;">
      <a href="${confirmationLink}" style="${emailStyles.button}">Confirm Email Address</a>
    </div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">Or copy and paste this URL into your browser:</p>
    <div style="${isDark ? emailStyles.darkCode : emailStyles.code}">${confirmationLink}</div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">If you didn't create an account with PlanzoAI, you can safely ignore this email.</p>
  `;
  
  return createEmailTemplate(content, isDark);
};
