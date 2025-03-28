
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
      
      if (!isPasswordResetFlow()) {
        console.log("Not a password reset flow, redirecting to auth page");
        navigate("/auth");
        return;
      }

      try {
        // Explicitly attempt to initialize a session from the URL
        // This needs to happen BEFORE checking the session
        const url = window.location.href;
        const { error: setupError } = await supabase.auth.getSessionFromUrl({ 
          storeSession: true // Important: Store the session
        });
        
        if (setupError) {
          console.error("Error setting up session from URL:", setupError);
          setTokenError("Your password reset link is invalid or has expired. Please request a new one.");
          setIsValidToken(false);
          setLoading(false);
          return;
        }
        
        // Now check if we have a valid session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error validating reset token:", error);
          setTokenError(error.message || "Your password reset link is invalid or has expired");
          setIsValidToken(false);
          setLoading(false);
          return;
        }
        
        if (!data.session) {
          console.log("No session found, token might be expired");
          setTokenError("Your password reset link has expired. Please request a new one.");
          setIsValidToken(false);
          setLoading(false);
          return;
        }
        
        // Token is valid, allow password reset
        console.log("Valid token found, showing password reset form");
        setIsValidToken(true);
        setTokenError(null);
        setLoading(false);
      } catch (error: any) {
        console.error("Error in password reset flow:", error);
        setTokenError(error?.message || "An error occurred. Please try again or request a new reset link.");
        setIsValidToken(false);
        setLoading(false);
      }
    };
    
    verifyResetToken();
  }, [navigate, location, toast]);

  const handleRequestNewLink = () => {
    navigate("/auth?expired=true");
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
        description: error.message || "An error occurred. Please try again.",
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
