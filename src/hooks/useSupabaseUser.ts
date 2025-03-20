
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export function useSupabaseUser() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
      }
    });

    // Then check for an existing session
    async function getSession() {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          console.error("Auth error:", err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, isLoading, error };
}
