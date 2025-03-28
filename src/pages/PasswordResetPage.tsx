import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isPasswordResetFlow } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";

const PasswordResetPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isValidToken, setIsValidToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    // Force light mode on reset page
    const root = window.document.documentElement;
    const originalTheme = root.classList.contains('dark') ? 'dark' : 'light';
    
    root.classList.remove('dark');
    root.classList.add('light');
    
    return () => {
      if (originalTheme === 'dark') {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    };
  }, []);

  useEffect(() => {
    const verifyResetToken = async () => {
      setLoading(true);
      const hash = window.location.hash;
      const query = window.location.search;
      
      // Debug logging
      let info = `URL: ${window.location.href}\n`;
      info += `Hash: ${hash}\n`;
      info += `Query: ${query}\n`;
      
      try {
        // Check if this is a recovery flow
        if (!isPasswordResetFlow()) {
          info += "Not detected as password reset flow\n";
          setTokenError("Invalid password reset link. Please request a new one.");
          setIsValidToken(false);
          setDebugInfo(info);
          setLoading(false);
          return;
        }
        
        info += "Detected as password reset flow\n";
        
        // Get any existing session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          info += "Valid session found\n";
          setIsValidToken(true);
          setTokenError(null);
        } else {
          info += "No session found, attempting to establish from URL\n";
          
          // Look for error parameters
          const hashParams = new URLSearchParams(hash.substring(1));
          const queryParams = new URLSearchParams(query);
          
          const errorCode = hashParams.get('error_code') || queryParams.get('error_code');
          const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');
          
          if (errorCode || errorDesc) {
            info += `Error detected: ${errorCode} - ${errorDesc}\n`;
            setTokenError(errorDesc || "Your password reset link is invalid. Please request a new one.");
            setIsValidToken(false);
            setDebugInfo(info);
            setLoading(false);
            return;
          }
          
          // This will attempt to use the recovery token to establish a session
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            info += `Error refreshing session: ${error.message}\n`;
            setTokenError("Your password reset link has expired or is invalid. Please request a new one.");
            setIsValidToken(false);
          } else if (data.session) {
            info += "Successfully established session\n";
            setIsValidToken(true);
            setTokenError(null);
          } else {
            info += "Failed to establish session, no error returned\n";
            setTokenError("Unable to verify your password reset link. Please request a new one.");
            setIsValidToken(false);
          }
        }
      } catch (error: any) {
        info += `Exception: ${error.message}\n`;
        setTokenError("An error occurred. Please try again or request a new reset link.");
        setIsValidToken(false);
      } finally {
        setDebugInfo(info);
        setLoading(false);
      }
    };
    
    verifyResetToken();
  }, [navigate, location]);

  const handleRequestNewLink = () => {
    navigate("/reset-password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
      });
      setResetLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Your password must be at least 6 characters long.",
      });
      setResetLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password updated successfully",
        description: "Your password has been reset. You will be redirected to login.",
      });

      // Sign out after successful password reset
      await supabase.auth.signOut();
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error resetting password",
        description: error.message,
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              Password Reset Link Expired
            </h1>
            <p className="text-[#555555] mb-6">
              {tokenError || "Your password reset link has expired. Please request a new one."}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-2 bg-gray-100 text-xs text-left overflow-auto max-h-40 rounded">
                <pre>{debugInfo}</pre>
              </div>
            )}
            <button
              onClick={handleRequestNewLink}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#333333] mb-2">
            Reset Your Password
          </h1>
          <p className="text-[#555555] mb-6">
            Please enter your new password below
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Enter your new password"
                required
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Confirm your new password"
                required
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={resetLoading}
          >
            {resetLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetPage;
