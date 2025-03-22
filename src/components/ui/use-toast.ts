
// This is a re-export from our main toast hook
import { 
  useToast as useToastHook, 
  toast as toastFunction, 
  type ToastProps, 
  type ToastActionElement 
} from "@/hooks/use-toast";

// Export types
export type { ToastProps, ToastActionElement };

// Export the hook and toast function
export const useToast = useToastHook;
export const toast = toastFunction;
