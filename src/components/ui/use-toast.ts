
// This is a re-export from our main toast hook
import { useToast as useToastHook, toast as toastFunction, ToastProvider as ToastProviderComponent } from "@/hooks/use-toast";
import type { ToasterToast } from "@/hooks/use-toast";

// Export types
export type { ToasterToast };
export type ToastProps = Pick<ToasterToast, "id" | "title" | "description" | "action" | "variant">;
export type ToastActionElement = React.ReactElement;

// Export the hook, toast function, and provider
export const useToast = useToastHook;
export const toast = toastFunction;
export const ToastProvider = ToastProviderComponent;
