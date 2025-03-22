
// This is a re-export from our main toast hook
import { useToast as useToastHook, toast as toastFunction } from "@/hooks/use-toast";
import type { ToasterToast } from "@/hooks/use-toast";

// Export types
export type { ToasterToast };
export type ToastProps = Pick<ToasterToast, "id" | "title" | "description" | "action" | "variant">;
export type ToastActionElement = React.ReactElement;

// Export the hook and toast function
export const useToast = useToastHook;
export const toast = toastFunction;
