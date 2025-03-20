
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export function useSupabaseUser() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getSession() {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    getSession();
  }, []);

  return { session, user, isLoading, error };
}
