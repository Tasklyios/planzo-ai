
// This is a re-export from our main toast hook
import { useToast as useToastHook, toast as toastImpl } from "@/hooks/use-toast";

// Export the hook and toast function
export const useToast = useToastHook;
export const toast = toastImpl;

// This is a backward compatibility fix for code that accesses toast directly
export default {
  useToast: useToastHook,
  toast: toastImpl
};
