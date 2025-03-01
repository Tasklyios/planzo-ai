
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === "undefined") {
        return initialValue;
      }
      
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // Dispatch a storage event to notify other tabs
        try {
          const event = new StorageEvent('storage', {
            key: key,
            oldValue: localStorage.getItem(key),
            newValue: JSON.stringify(valueToStore),
            storageArea: localStorage
          });
          window.dispatchEvent(event);
        } catch (e) {
          // Fallback for browsers not supporting StorageEvent constructor
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Listen for changes to this localStorage item in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, [key]);

  return [storedValue, setValue] as const;
}
