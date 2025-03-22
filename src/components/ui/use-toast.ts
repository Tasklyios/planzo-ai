
// This is a re-export from our main toast hook
import { useToast as useToastHook, toast as toastFunction, ToastProps, ToastActionElement, ToastProvider } from "@/hooks/use-toast";

// Export types
export type { ToastProps, ToastActionElement };

// Export the hook, toast function and provider
export const useToast = useToastHook;
export const toast = toastFunction;
export { ToastProvider };
