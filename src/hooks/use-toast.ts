
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

interface ToastContextValue extends ToastState {
  addToast: (props: Omit<ToastProps, "id">) => void;
  updateToast: (id: string, props: Partial<ToastProps>) => void;
  dismissToast: (id: string) => void;
  toast: (props: Omit<ToastProps, "id">) => void; // Add toast function directly to the context
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

// We need to use a functional approach without JSX in a .ts file
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
      toast, // Include toast in the context value
    }),
    [state, addToast, updateToast, dismissToast, toast]
  );

  // Use React.createElement instead of JSX
  return React.createElement(
    ToastContext.Provider,
    { value },
    children
  );
}

// Helper function to create toast - now just a wrapper around the context's toast
export function toast({ title, description, variant = "default", action }: Omit<ToastProps, "id">) {
  const context = useToast();
  context.toast({ title, description, variant, action });
}
