
import { useToast } from "@/components/ui/use-toast";

// Interface for service options
interface ServiceOptions {
  retryCount?: number;
  fallbackValue?: any;
  notifyUser?: boolean;
  errorMessage?: string;
}

// Default options
const defaultOptions: ServiceOptions = {
  retryCount: 2,
  fallbackValue: null,
  notifyUser: true,
  errorMessage: "Service temporarily unavailable. Please try again later."
};

/**
 * A wrapper function to make API calls more resilient
 * 
 * @param serviceFunction The async function to call
 * @param options Options for resilience behavior
 * @returns A tuple with [data, error, isLoading]
 */
export const useResilientService = <T>(
  serviceFunction: (...args: any[]) => Promise<T>,
  options: ServiceOptions = {}
) => {
  const { toast } = useToast();
  const mergedOptions = { ...defaultOptions, ...options };

  const executeWithResilience = async (...args: any[]): Promise<[T | null, Error | null, boolean]> => {
    let attempts = 0;
    let lastError: Error | null = null;
    
    try {
      // Set loading state
      const loadingState: [T | null, Error | null, boolean] = [null, null, true];
      
      while (attempts <= mergedOptions.retryCount!) {
        try {
          // Attempt to call the service
          const result = await serviceFunction(...args);
          
          // Return successful result
          return [result, null, false];
        } catch (error) {
          lastError = error as Error;
          attempts++;
          
          // If we haven't exceeded retry count, wait before retrying
          if (attempts <= mergedOptions.retryCount!) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      }
      
      // All attempts failed
      if (mergedOptions.notifyUser) {
        toast({
          title: "Service Error",
          description: mergedOptions.errorMessage,
          variant: "destructive",
        });
      }
      
      // Return fallback value with error
      return [mergedOptions.fallbackValue, lastError, false];
    } catch (error) {
      // Something unexpected happened in our resilience logic
      console.error("Resilience wrapper error:", error);
      return [mergedOptions.fallbackValue, error as Error, false];
    }
  };

  return executeWithResilience;
};

/**
 * A simpler wrapper function for one-off resilient API calls
 */
export const callWithResilience = async <T>(
  serviceFunction: (...args: any[]) => Promise<T>,
  args: any[] = [],
  options: ServiceOptions = {}
): Promise<T | null> => {
  const mergedOptions = { ...defaultOptions, ...options };
  let attempts = 0;
  
  while (attempts <= mergedOptions.retryCount!) {
    try {
      return await serviceFunction(...args);
    } catch (error) {
      attempts++;
      
      // If we've exceeded retry count, throw the error
      if (attempts > mergedOptions.retryCount!) {
        console.error(`Service call failed after ${attempts} attempts:`, error);
        
        // Return fallback value
        return mergedOptions.fallbackValue;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
  
  return mergedOptions.fallbackValue;
};
