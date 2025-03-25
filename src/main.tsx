
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

// Register service worker for offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
