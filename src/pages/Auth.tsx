
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PricingDialog from "@/components/pricing/PricingDialog";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        setShowPricing(true); // Show pricing dialog after successful signup
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      setResetSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const redirectURL = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080'
        : window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: redirectURL
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleContinueFree = () => {
    setShowPricing(false);
    navigate("/dashboard");
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-light-bg to-light-bg-2 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass rounded-2xl p-8 shadow-xl fade-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-dark mb-2">
              {isForgotPassword 
                ? "Reset Your Password" 
                : isSignUp 
                  ? "Create an Account" 
                  : "Welcome Back"}
            </h1>
            <p className="text-dark/70">
              {isForgotPassword
                ? "Enter your email to receive a password reset link"
                : isSignUp
                  ? "Sign up to start creating amazing videos"
                  : "Sign in to your account"}
            </p>
          </div>

          {!isForgotPassword && (
            <div className="space-y-4 mb-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FcGoogle size={20} />
                <span className="text-dark">Continue with Google</span>
              </button>
            </div>
          )}

          {!isForgotPassword && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-dark/60">Or continue with</span>
              </div>
            </div>
          )}

          {isForgotPassword ? (
            resetSent ? (
              <div className="text-center space-y-4">
                <p className="text-green-600">
                  A password reset link has been sent to your email.
                </p>
                <p className="text-dark/70">
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <Button 
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetSent(false);
                  }}
                  className="mt-4"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-dark" htmlFor="reset-email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" size={20} />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-primary hover:underline text-sm"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-dark" htmlFor="password">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsForgotPassword(true);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" size={20} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{isSignUp ? "Sign Up" : "Sign In"}</>
                )}
              </button>
            </form>
          )}

          {!isForgotPassword && (
            <div className="mt-6 text-center">
              <p className="text-dark/70">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-1 text-primary hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      <PricingDialog 
        open={showPricing}
        onOpenChange={setShowPricing}
        onContinueFree={handleContinueFree}
      />
    </>
  );
};

export default Auth;
