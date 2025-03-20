
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { ToastProvider } from "@/components/ui/toast"

// Properly declare the global variable to avoid TypeScript errors
declare global {
  interface Window {
    LOVABLE_BADGE_ENABLED: boolean;
  }
}

// Disable the Lovable badge
window.LOVABLE_BADGE_ENABLED = false;

// Create a client
const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <ToastProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ToastProvider>
);
