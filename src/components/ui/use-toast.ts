
// This is a re-export from our main toast hook
import { useToast as useToastHook, toast } from "@/hooks/use-toast";

// Export the hook and toast function
export const useToast = () => {
  return {
    ...useToastHook()
  };
};

export { toast };
