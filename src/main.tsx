
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App.tsx'
import './index.css'

// Properly declare the global variable to avoid TypeScript errors
declare global {
  interface Window {
    LOVABLE_BADGE_ENABLED: boolean;
    toast?: any; // Add toast to the Window interface
  }
}

// Disable the Lovable badge by setting the LOVABLE_BADGE_ENABLED global variable to false
// This prevents the badge from being displayed on the launched website
window.LOVABLE_BADGE_ENABLED = false;

// Custom fallback component for the error boundary
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200 dark:bg-gray-800 dark:border-red-800">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Enhanced global error handler with more details
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Try to log more details if available
  if (event.reason && event.reason.stack) {
    console.error('Stack trace:', event.reason.stack);
  }
  
  // Notify the user about the error if it's critical
  if (event.reason && event.reason.message && event.reason.message.includes("network") || 
      event.reason && event.reason.message && event.reason.message.includes("fetch")) {
    // Only show a toast for network-related errors
    try {
      // Try to use the toast if available
      const toast = window.toast;
      if (typeof toast === 'function') {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive"
        });
      }
    } catch (e) {
      // If toast is not available, do nothing
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary 
    FallbackComponent={ErrorFallback} 
    onReset={() => window.location.href = '/'}
    onError={(error) => {
      console.error("React Error Boundary caught an error:", error);
    }}
  >
    <App />
  </ErrorBoundary>
);
