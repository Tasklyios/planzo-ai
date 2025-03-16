
import { Logo } from "@/components/ui/logo";

export const emailStyles = {
  container: `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #ffffff;
    color: #333333;
  `,
  darkContainer: `
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #1A1F2C;
    color: #ffffff;
  `,
  header: `
    text-align: center;
    padding: 20px 0;
  `,
  heading: `
    font-size: 24px;
    font-weight: 600;
    color: #333333;
    margin-bottom: 16px;
  `,
  darkHeading: `
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 16px;
  `,
  subheading: `
    font-size: 18px;
    color: #666666;
    margin-bottom: 24px;
  `,
  darkSubheading: `
    font-size: 18px;
    color: #aaaaaa;
    margin-bottom: 24px;
  `,
  paragraph: `
    font-size: 16px;
    line-height: 1.5;
    color: #555555;
    margin-bottom: 16px;
  `,
  darkParagraph: `
    font-size: 16px;
    line-height: 1.5;
    color: #dddddd;
    margin-bottom: 16px;
  `,
  button: `
    display: inline-block;
    padding: 12px 24px;
    background-color: #2582FF;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    margin: 16px 0;
    text-align: center;
  `,
  footer: `
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #eeeeee;
    text-align: center;
    font-size: 14px;
    color: #888888;
  `,
  darkFooter: `
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #333333;
    text-align: center;
    font-size: 14px;
    color: #888888;
  `,
  link: `
    color: #2582FF;
    text-decoration: underline;
  `,
  logoWrapper: `
    text-align: center;
    margin-bottom: 20px;
  `,
  code: `
    background-color: #f4f4f4;
    padding: 12px;
    border-radius: 4px;
    font-family: monospace;
    margin: 16px 0;
    display: inline-block;
  `,
  darkCode: `
    background-color: #2a2a2a;
    padding: 12px;
    border-radius: 4px;
    font-family: monospace;
    margin: 16px 0;
    display: inline-block;
    color: #ffffff;
  `,
};

// Helper to create full HTML template with consistent structure
export const createEmailTemplate = (content: string, isDark: boolean = false) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PlanzoAI</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${isDark ? '#121212' : '#f5f5f5'};">
  <div style="${isDark ? emailStyles.darkContainer : emailStyles.container}">
    <div style="${emailStyles.logoWrapper}">
      <img src="https://planzoai.com/lovable-uploads/${isDark ? '76ed71b9-cb94-48eb-acd1-a0326fc07c10' : '8c458d9d-037f-4dbe-8a47-782b5bd31a4a'}.png" alt="PlanzoAI Logo" style="height: 34px;">
    </div>
    ${content}
    <div style="${isDark ? emailStyles.darkFooter : emailStyles.footer}">
      <p>&copy; ${new Date().getFullYear()} PlanzoAI. All rights reserved.</p>
      <p>
        <a href="https://planzoai.com/terms" style="${emailStyles.link}">Terms of Service</a> • 
        <a href="https://planzoai.com/privacy" style="${emailStyles.link}">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
