
// src/hooks/use-toast.ts
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
};

const ToastContext = createContext<ToastContextProps>({
  toasts: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addToast: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  removeToast: () => {},
});

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// External accessor for adding toasts
export const toast = {
  default(props: Omit<ToastProps, "id" | "variant">) {
    const context = useToast();
    context.addToast({ ...props, variant: "default" });
  },
  destructive(props: Omit<ToastProps, "id" | "variant">) {
    const context = useToast();
    context.addToast({ ...props, variant: "destructive" });
  },
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

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// Shorthand toast functions
toast.success = (description: string, title = "Success") => {
  const context = useToast();
  context.addToast({ title, description, variant: "default" });
};

toast.error = (description: string, title = "Error") => {
  const context = useToast();
  context.addToast({ title, description, variant: "destructive" });
};

toast.info = (description: string, title = "Information") => {
  const context = useToast();
  context.addToast({ title, description, variant: "default" });
};
