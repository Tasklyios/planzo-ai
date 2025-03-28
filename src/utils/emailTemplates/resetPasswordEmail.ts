
import { emailStyles, createEmailTemplate } from "../emailTemplates";

export const generateResetPasswordEmail = (resetLink: string, isDark: boolean = false) => {
  // Extract any token information from the provided link
  const url = new URL(resetLink.startsWith('http') ? resetLink : `https://planzoai.com${resetLink}`);
  
  // Build a clean, reliable reset link that points directly to the auth page with recovery type
  const authUrl = new URL('https://planzoai.com/auth');
  authUrl.searchParams.set('type', 'recovery');
  
  // Preserve any tokens from the original link
  if (url.searchParams.has('token')) {
    authUrl.searchParams.set('token', url.searchParams.get('token')!);
  }
  if (url.searchParams.has('token_hash')) {
    authUrl.searchParams.set('token_hash', url.searchParams.get('token_hash')!);
  }
  if (url.hash) {
    // Copy the hash tokens to query parameters for easier processing
    const hashParams = new URLSearchParams(url.hash.substring(1));
    if (hashParams.has('access_token')) {
      authUrl.searchParams.set('access_token', hashParams.get('access_token')!);
    }
    if (hashParams.has('refresh_token')) {
      authUrl.searchParams.set('refresh_token', hashParams.get('refresh_token')!);
    }
  }
  
  const finalLink = authUrl.toString();
  
  const content = `
    <h1 style="${isDark ? emailStyles.darkHeading : emailStyles.heading}">Reset Your Password</h1>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">A password reset has been requested for your PlanzoAI account. Click the button below to set a new password.</p>
    <div style="text-align: center;">
      <a href="${finalLink}" style="${emailStyles.button}">Reset Password</a>
    </div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">Or copy and paste this URL into your browser:</p>
    <div style="${isDark ? emailStyles.darkCode : emailStyles.code}">${finalLink}</div>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">If you didn't request a password reset, you can safely ignore this email.</p>
    <p style="${isDark ? emailStyles.darkParagraph : emailStyles.paragraph}">This password reset link will expire in 24 hours.</p>
  `;
  
  return createEmailTemplate(content, isDark);
};
