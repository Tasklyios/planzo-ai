
import { createContext, useContext, useState } from "react";

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    action: JSX.Element;
  };
  variant?: "default" | "destructive";
};

type ToastContextProps = {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => void;
  removeToast: (id: string) => void;
  toast: {
    default: (props: Omit<ToastProps, "id" | "variant">) => void;
    destructive: (props: Omit<ToastProps, "id" | "variant">) => void;
    success: (description: string, title?: string) => void;
    error: (description: string, title?: string) => void;
    info: (description: string, title?: string) => void;
  };
};

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Create a standalone toast function that can be imported directly
const createToastHelpers = (addToast: (toast: Omit<ToastProps, "id">) => void) => ({
  default(props: Omit<ToastProps, "id" | "variant">) {
    addToast({ ...props, variant: "default" });
  },
  destructive(props: Omit<ToastProps, "id" | "variant">) {
    addToast({ ...props, variant: "destructive" });
  },
  success(description: string, title = "Success") {
    addToast({ title, description, variant: "default" });
  },
  error(description: string, title = "Error") {
    addToast({ title, description, variant: "destructive" });
  },
  info(description: string, title = "Information") {
    addToast({ title, description, variant: "default" });
  }
});

// Export a standalone toast function
export const toast = {
  default(props: Omit<ToastProps, "id" | "variant">) {
    const ctx = useToast();
    ctx.addToast({ ...props, variant: "default" });
  },
  destructive(props: Omit<ToastProps, "id" | "variant">) {
    const ctx = useToast();
    ctx.addToast({ ...props, variant: "destructive" });
  },
  success(description: string, title = "Success") {
    const ctx = useToast();
    ctx.addToast({ title, description, variant: "default" });
  },
  error(description: string, title = "Error") {
    const ctx = useToast();
    ctx.addToast({ title, description, variant: "destructive" });
  },
  info(description: string, title = "Information") {
    const ctx = useToast();
    ctx.addToast({ title, description, variant: "default" });
  }
};

// Export the provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...toast }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Create the toast helpers using the addToast function
  const toastHelpers = createToastHelpers(addToast);

  // Create the context value with all the necessary properties
  const contextValue: ToastContextProps = {
    toasts,
    addToast,
    removeToast,
    toast: toastHelpers
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}
