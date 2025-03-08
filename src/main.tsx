
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Properly declare the global variable to avoid TypeScript errors
declare global {
  interface Window {
    LOVABLE_BADGE_ENABLED: boolean;
  }
}

// Disable the Lovable badge by setting the LOVABLE_BADGE_ENABLED global variable to false
// This prevents the badge from being displayed on the launched website
window.LOVABLE_BADGE_ENABLED = false;

// Add error handling for better debugging of issues on production
const renderApp = () => {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error("Root element not found in the DOM");
      return;
    }
    
    const root = createRoot(rootElement);
    root.render(<App />);
    
    console.log("App successfully rendered");
  } catch (error) {
    console.error("Failed to render app:", error);
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: system-ui, sans-serif;">
        <h2>Application Error</h2>
        <p>There was an error loading the application. Please try again or contact support.</p>
        <p>Error details: ${error instanceof Error ? error.message : String(error)}</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
};

renderApp();
