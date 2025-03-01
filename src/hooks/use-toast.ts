
import * as React from "react";

export interface ToastActionElement {
  altText: string;
  action: React.ReactNode;
}

export interface ToastProps {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
}

interface ToastState {
  toasts: ToastProps[];
}

// Updated interface with the toast function
export interface ToastContextValue extends ToastState {
  addToast: (props: Omit<ToastProps, "id">) => void;
  updateToast: (id: string, props: Partial<ToastProps>) => void;
  dismissToast: (id: string) => void;
  toast: (props: Omit<ToastProps, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(
    (state: ToastState, action: any) => {
      switch (action.type) {
        case "ADD_TOAST":
          return {
            ...state,
            toasts: [...state.toasts, { id: crypto.randomUUID(), ...action.toast }],
          };
        case "UPDATE_TOAST":
          return {
            ...state,
            toasts: state.toasts.map((t) =>
              t.id === action.id ? { ...t, ...action.toast } : t
            ),
          };
        case "DISMISS_TOAST":
          return {
            ...state,
            toasts: state.toasts.filter((t) => t.id !== action.id),
          };
        default:
          return state;
      }
    },
    { toasts: [] }
  );

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    dispatch({ type: "ADD_TOAST", toast });
  }, []);

  const updateToast = React.useCallback((id: string, toast: Partial<ToastProps>) => {
    dispatch({ type: "UPDATE_TOAST", id, toast });
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    dispatch({ type: "DISMISS_TOAST", id });
  }, []);

  // Add toast function directly to context value
  const toast = React.useCallback((props: Omit<ToastProps, "id">) => {
    addToast(props);
  }, [addToast]);

  const value = React.useMemo(
    () => ({
      ...state,
      addToast,
      updateToast,
      dismissToast,
      toast,
    }),
    [state, addToast, updateToast, dismissToast, toast]
  );

  return React.createElement(
    ToastContext.Provider,
    { value },
    children
  );
}

// Standalone toast function implementation
type ToastFunction = {
  (props: Omit<ToastProps, "id">): void;
  default: (props: Omit<ToastProps, "id" | "variant">) => void;
  destructive: (props: Omit<ToastProps, "id" | "variant">) => void;
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
};

// Create a properly callable toast function
const toastFunction = ((props: Omit<ToastProps, "id">) => {
  const context = useToast();
  context.toast(props);
}) as ToastFunction;

// Add helper methods
toastFunction.default = (props: Omit<ToastProps, "id" | "variant">) => {
  toastFunction({ ...props, variant: "default" });
};

toastFunction.destructive = (props: Omit<ToastProps, "id" | "variant">) => {
  toastFunction({ ...props, variant: "destructive" });
};

toastFunction.success = (description: string, title?: string) => {
  toastFunction({ title: title || "Success", description, variant: "default" });
};

toastFunction.error = (description: string, title?: string) => {
  toastFunction({ title: title || "Error", description, variant: "destructive" });
};

toastFunction.info = (description: string, title?: string) => {
  toastFunction({ title: title || "Info", description, variant: "default" });
};

export const toast = toastFunction;
