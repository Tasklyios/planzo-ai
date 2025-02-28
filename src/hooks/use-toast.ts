
// This is a wrapper around the shadcn/ui toast component
import {
  type ToastActionElement,
  type ToastProps,
} from "@/components/ui/toast";

import { useState, createContext, useContext } from "react";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const TOAST_LIMIT = 10;
const TOAST_REMOVE_DELAY = 1000;

type ToastContextType = {
  toasts: ToasterToast[];
  addToast: (toast: Omit<ToasterToast, "id">) => string;
  updateToast: (id: string, toast: Partial<ToasterToast>) => void;
  dismissToast: (id: string) => void;
};

const initialState: ToastContextType = {
  toasts: [],
  addToast: () => "",
  updateToast: () => {},
  dismissToast: () => {},
};

const ToastContext = createContext(initialState);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  const addToast = (toast: Omit<ToasterToast, "id">): string => {
    const id = crypto.randomUUID();

    setToasts((prevToasts) => {
      const newToasts = [...prevToasts, { ...toast, id }];
      return newToasts.slice(-TOAST_LIMIT);
    });

    return id;
  };

  const updateToast = (id: string, toast: Partial<ToasterToast>) => {
    setToasts((prevToasts) =>
      prevToasts.map((t) => (t.id === id ? { ...t, ...toast } : t))
    );
  };

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => {
      const targetToast = prevToasts.find((t) => t.id === id);
      if (!targetToast) return prevToasts;

      if (targetToast.onOpenChange) {
        targetToast.onOpenChange(false);
      }

      return prevToasts.filter((t) => t.id !== id);
    });
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, updateToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const toast = {
  default: (props: Omit<ToasterToast, "id" | "variant">) => {
    const { addToast } = useToast();
    return addToast({ ...props, variant: "default" });
  },
  destructive: (props: Omit<ToasterToast, "id" | "variant">) => {
    const { addToast } = useToast();
    return addToast({ ...props, variant: "destructive" });
  },
};
