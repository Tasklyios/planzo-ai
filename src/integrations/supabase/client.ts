
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hhkabxkelgabcsczsljf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoa2FieGtlbGdhYmNzY3pzbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNTk4NjEsImV4cCI6MjA1NTczNTg2MX0.qs_R_XUTkDcxltdlj7ZABrHMSCaGFYstxTkXUCCKghU";

// Helper function to get site URL depending on environment
const getSiteUrl = () => {
  return window.location.hostname === 'localhost' 
    ? 'http://localhost:8080'
    : 'https://planzoai.com';
};

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
    // Storage options directly in the auth config
    storageKey: 'planzo-auth'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

// Helper function to check for auth-related parameters in URL
export const hasAuthParamsInUrl = () => {
  try {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const queryParams = new URLSearchParams(url.search);
    
    // Check common auth params in both hash and query params
    const authParams = [
      'access_token', 'refresh_token', 'provider_token', 'error_description',
      'code', 'token_type', 'expires_in', 'type', 'flow', 'error', 'error_code',
      'token' // Added token parameter from Supabase docs
    ];
    
    return authParams.some(param => 
      hashParams.has(param) || queryParams.has(param) ||
      url.hash.includes(`${param}=`) || url.search.includes(`${param}=`)
    );
  } catch (error) {
    console.error("Error checking for auth params:", error);
    return false;
  }
};

// Helper function specifically to detect password recovery flows
export const isPasswordResetFlow = () => {
  try {
    // Check the current path first - important!
    const pathname = window.location.pathname;
    if (pathname === '/password-reset' || pathname === '/reset-password') {
      console.log("Password reset detected based on URL path");
      return true;
    }
    
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const queryParams = new URLSearchParams(url.search);
    
    // Check for standard Supabase password reset parameters
    // Per Supabase docs: ?token=[TOKEN]&type=recovery&redirect_to=[URL]
    const hasToken = queryParams.has('token');
    const isRecoveryType = queryParams.get('type') === 'recovery';
    const hasRedirectTo = queryParams.has('redirect_to');
    
    // Check explicitly for the Supabase recovery URL pattern
    if (hasToken && isRecoveryType) {
      console.log("Supabase recovery flow detected via token and type parameters");
      return true;
    }
    
    // Legacy checks
    const isRecoveryTypeFromHash = 
      hashParams.get('type') === 'recovery' || 
      queryParams.get('type') === 'recovery';
      
    // Check for access tokens which might be part of recovery process
    const hasTokens = 
      hashParams.has('access_token') || 
      queryParams.has('access_token') ||
      hashParams.has('refresh_token') || 
      queryParams.has('refresh_token') ||
      hashParams.has('code') ||
      queryParams.has('code');
    
    // Check for error parameters that might indicate an expired reset link
    const hasErrorParams = 
      (hashParams.get('error') === 'access_denied' || queryParams.get('error') === 'access_denied') &&
      (hashParams.get('error_code') === 'otp_expired' || queryParams.get('error_code') === 'otp_expired');
    
    if (isRecoveryTypeFromHash || hasTokens || hasErrorParams) {
      console.log("Detected password reset flow in URL parameters");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking for password reset flow:", error);
    return false;
  }
};

// Helper function to handle type casting for IDs in Supabase queries
export function cast<T>(value: T): T {
  return value as T;
}

// Create typed versions of common Supabase methods to avoid TS errors
export const supabaseTyped = {
  from: supabase.from,
  auth: supabase.auth,
  storage: supabase.storage,
  functions: supabase.functions,
  rpc: supabase.rpc,
  // Type-safe alternatives for common queries
  selectFrom: <T extends keyof Database['public']['Tables']>(
    table: T,
    columns?: string
  ) => {
    return supabase
      .from(table)
      .select(columns || '*');
  }
};
