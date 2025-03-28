import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Mail, CheckCircle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PricingDialog from "@/components/pricing/PricingDialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Onboarding from "@/components/auth/Onboarding";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(location.search);
  const shouldSignUp = searchParams.get('signup') === 'true';
  
  useEffect(() => {
    const currentDomain = window.location.hostname;
    if (currentDomain === 'planzo.netlify.app') {
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      window.location.href = `https://planzoai.com${currentPath}${currentSearch}`;
    }
  }, []);

  useEffect(() => {
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

  const [isSignUp, setIsSignUp] = useState(shouldSignUp);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);

  // Check for password reset flow
  useEffect(() => {
    const checkForPasswordReset = async () => {
      const query = new URLSearchParams(location.search);
      // Check if we have a token in the URL (used by Supabase for password reset)
      const hasToken = query.has('token') || 
                      query.has('access_token') ||
                      query.has('refresh_token');
      
      // Check if we're in a recovery flow
      const isRecovery = query.get("type") === "recovery";
      
      if (isRecovery || (hasToken && !isEmailVerificationRedirect())) {
        console.log("Password reset flow detected");
        setIsResetPassword(true);
        
        // If we have a token but aren't already authenticated, attempt to extract and use it
        if (hasToken) {
          try {
            // This will set the auth session using the recovery token
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              console.error("Error getting session from reset token:", error);
              toast({
                variant: "destructive",
                title: "Password Reset Error",
                description: "There was a problem with your password reset link. Please request a new one.",
              });
            } else if (data.session) {
              console.log("Successfully authenticated with reset token");
            }
          } catch (error) {
            console.error("Error in password reset flow:", error);
          }
        }
      }
    };
    
    checkForPasswordReset();
  }, [location.search]);

  const isEmailVerificationRedirect = () => {
    const searchParams = new URLSearchParams(location.search);
    // These parameters indicate email verification, not password reset
    return searchParams.has('error_description') || 
           (searchParams.has('access_token') && !searchParams.get('type')); 
  };

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (isEmailVerificationRedirect()) {
        const searchParams = new URLSearchParams(location.search);
        
        if (searchParams.has('error_description')) {
          toast({
            variant: "destructive",
            title: "Verification Error",
            description: searchParams.get('error_description'),
          });
          return;
        }
        
        if (searchParams.has('access_token') && searchParams.has('refresh_token')) {
          setIsEmailVerified(true);
          
          const { error } = await supabase.auth.signOut();
          if (error) console.error("Error signing out after verification:", error);
          
          toast({
            title: "Email Verified",
            description: "Your email has been verified. Please sign in with your credentials.",
          });
        }
      }
    };
    
    checkEmailVerification();
  }, [location, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailExistsError(null);
    setShowVerifyEmail(false);

    try {
      if (isSignUp) {
        console.log("Signing up with email:", email);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              account_type: 'personal'
            }
          }
        });
        
        if (error) {
          if (error.message.includes("already registered")) {
            setEmailExistsError("An account with this email already exists, please sign in instead.");
            return;
          }
          throw error;
        }
        
        console.log("Sign up successful, user created:", data?.user?.id);
        
        setShowVerifyEmail(true);
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        console.log("Sign in successful, checking onboarding status...");
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setShowOnboarding(true);
          return;
        }
        
        console.log("Profile data:", profileData);
        
        const hasCompletedOnboarding = profileData && profileData.onboarding_completed;
        
        if (!hasCompletedOnboarding) {
          console.log("User needs to complete onboarding");
          setShowOnboarding(true);
        } else {
          localStorage.setItem('has_seen_pricing', 'true');
          console.log("User has completed onboarding, redirecting to dashboard");
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAuthAndNavigate = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        if (isEmailVerificationRedirect()) {
          console.log("Auth check: Email verification redirect detected");
          return;
        }
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setShowOnboarding(true);
          return;
        }
        
        if (profileData?.onboarding_completed) {
          localStorage.setItem('has_seen_pricing', 'true');
          navigate("/dashboard");
        } else {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully.",
      });
      
      // Sign out to ensure clean state after password reset
      await supabase.auth.signOut();
      
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
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
    localStorage.setItem('has_seen_pricing', 'true');
    setShowPricing(false);
    navigate("/dashboard");
  };

  const handleOnboardingComplete = () => {
    console.log("Onboarding completed, redirecting to dashboard");
    setShowOnboarding(false);
    localStorage.setItem('has_seen_pricing', 'true');
    navigate("/dashboard");
  };

  if (isResetPassword) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl fade-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#333333] mb-2">
              Reset Your Password
            </h1>
            <p className="text-[#555555]">
              Please enter your new password below
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#333333]" htmlFor="new-password">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" size={20} />
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter your new password"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#333333]" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" size={20} />
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Confirm your new password"
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
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isEmailVerified) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl fade-up">
          <div className="text-center mb-8">
            <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#333333] mb-2">
              Email Verified!
            </h1>
            <p className="text-[#555555]">
              Thanks for verifying your email. You can now sign in with your new account.
            </p>
          </div>

          <Button 
            className="w-full"
            onClick={() => {
              setIsEmailVerified(false);
              setIsSignUp(false);
              window.history.replaceState({}, document.title, "/auth");
            }}
          >
            Sign In Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl fade-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#333333] mb-2">
              {isForgotPassword 
                ? "Reset Your Password" 
                : isSignUp 
                  ? "Create an Account" 
                  : "Welcome Back"}
            </h1>
            <p className="text-[#555555]">
              {isForgotPassword
                ? "Enter your email to receive a password reset link"
                : isSignUp
                  ? "Sign up to start creating amazing videos"
                  : "Sign in to your account"}
            </p>
          </div>

          {emailExistsError && (
            <Alert className="mb-6 bg-amber-50 border-amber-200">
              <AlertTitle className="text-amber-800">Email already exists</AlertTitle>
              <AlertDescription className="text-amber-700">
                {emailExistsError}
              </AlertDescription>
            </Alert>
          )}

          {showVerifyEmail && !emailExistsError && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertTitle className="text-blue-800">Check your email!</AlertTitle>
              <AlertDescription className="text-blue-700">
                We've sent a confirmation link to your email address. Please check your inbox and click the link to verify your account.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 mb-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FcGoogle size={20} />
              <span className="text-dark dark:text-white">Continue with Google</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-dark/60 dark:text-white/60">Or continue with</span>
            </div>
          </div>

          {isForgotPassword ? (
            resetSent ? (
              <div className="text-center space-y-4">
                <p className="text-green-600">
                  A password reset link has been sent to your email.
                </p>
                <p className="text-[#555555]">
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
                  <label className="text-sm font-medium text-[#333333]" htmlFor="reset-email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" size={20} />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                <label className="text-sm font-medium text-[#333333]" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-[#333333]" htmlFor="password">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsForgotPassword(true);
                      }}
                      className="text-sm text-[#0073FF] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" size={20} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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

          <div className="mt-6 text-center">
            <p className="text-dark/70 dark:text-white/70">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setShowVerifyEmail(false);
                  setEmailExistsError(null);
                }}
                className="ml-1 text-[#0073FF] hover:underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <Onboarding 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {showPricing && (
        <PricingDialog 
          open={showPricing}
          onOpenChange={setShowPricing}
          onContinueFree={handleContinueFree}
        />
      )}
    </>
  );
};

export default Auth;
