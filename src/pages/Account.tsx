
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const themeOptions = [
  {
    value: "light",
    title: "Light",
    description: "Light theme for bright environments",
    icon: Sun,
  },
  {
    value: "dark",
    title: "Dark",
    description: "Dark theme for low-light environments",
    icon: Moon,
  },
  {
    value: "system",
    title: "System",
    description: "Sync with your system preferences",
    icon: Monitor,
  },
];

const accountTypes = [
  {
    value: "personal",
    title: "Personal Brand",
    description: "Create content for your personal brand",
  },
  {
    value: "business",
    title: "Business",
    description: "Create content for your business",
  },
  {
    value: "ecommerce",
    title: "E-commerce",
    description: "Create content for your online store",
  },
];

interface Profile {
  content_personality?: string | null;
  content_style?: string | null;
  account_type?: string;
  content_niche?: string | null;
  target_audience?: string | null;
  posting_platforms?: string[] | null;
  business_niche?: string | null;
  product_niche?: string | null;
}

export default function Account() {
  const [activeTab, setActiveTab] = useState<'settings' | 'customize'>('settings');
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!session?.user) {
        setFetchError("No authenticated user found. Please log in again.");
        return;
      }

      setEmail(session.user.email || "");

      // Fetch profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('content_personality, content_style, account_type, content_niche, target_audience, posting_platforms, business_niche, product_niche')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      if (data) {
        setProfile(data);
        // Update localStorage with the fetched values
        if (data.content_niche) localStorage.setItem("niche", data.content_niche);
        if (data.target_audience) localStorage.setItem("audience", data.target_audience);
        if (data.posting_platforms && data.posting_platforms.length > 0) {
          localStorage.setItem("platform", data.posting_platforms[0]);
        }
      } else {
        // If no profile found, we'll create default values
        setProfile({
          account_type: 'personal',
          content_personality: '',
          content_style: '',
          content_niche: '',
          target_audience: '',
          posting_platforms: [],
        });
      }
    } catch (error: any) {
      console.error('Error in fetchProfile:', error);
      setFetchError(error.message || "Failed to load profile data");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load profile data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to update your profile",
        });
        return;
      }

      const updateData: Profile = {
        content_personality: profile.content_personality,
        content_style: profile.content_style,
        account_type: profile.account_type,
        content_niche: profile.content_niche,
        target_audience: profile.target_audience,
        posting_platforms: profile.posting_platforms,
      };

      // Add niche based on account type
      if (profile.account_type === 'business') {
        updateData.business_niche = profile.business_niche;
      } else if (profile.account_type === 'ecommerce') {
        updateData.product_niche = profile.product_niche;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id);

      if (error) throw error;

      // Update localStorage after successful save
      if (profile.content_niche) localStorage.setItem("niche", profile.content_niche);
      if (profile.target_audience) localStorage.setItem("audience", profile.target_audience);
      if (profile.posting_platforms && profile.posting_platforms.length > 0) {
        localStorage.setItem("platform", profile.posting_platforms[0]);
      }

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
      });
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    try {
      setLoading(true);
      
      if (!newEmail) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter a new email address.",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;
      
      toast({
        title: "Verification email sent",
        description: "Please check your inbox to verify your new email address.",
      });
      
      setIsChangingEmail(false);
      setNewEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change email. Please try again.",
      });
      console.error('Error changing email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all password fields.",
        });
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "New passwords do not match.",
        });
        return;
      }

      // First, verify the current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Current password is incorrect.",
        });
        return;
      }

      // Then update the password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
      });
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchProfile();
  };

  if (fetchError) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-20">
          <div className="max-w-2xl mx-auto space-y-8">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
            <div className="text-center">
              <Button onClick={handleRetry} disabled={loading}>
                {loading ? "Retrying..." : "Retry"}
              </Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Account</h1>
            <div className="inline-flex items-center rounded-lg border p-1 bg-card shadow-sm">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('customize')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'customize'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Customize
              </button>
            </div>
          </div>

          {activeTab === 'settings' ? (
            <div className="space-y-6">
              <div className="widget-box p-6">
                <h2 className="text-xl font-semibold mb-6">Email and Password</h2>
                
                <div className="space-y-6">
                  {/* Email display */}
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2">
                      <Input id="email" value={email} disabled className="flex-1" />
                      <Button 
                        variant="outline" 
                        onClick={() => setIsChangingEmail(!isChangingEmail)}
                      >
                        {isChangingEmail ? "Cancel" : "Change"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Email change form */}
                  {isChangingEmail && (
                    <div className="flex flex-col space-y-4 p-4 border rounded-md bg-accent/10">
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="newEmail">New Email</Label>
                        <Input 
                          id="newEmail" 
                          type="email" 
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email address"
                        />
                      </div>
                      <Button 
                        onClick={handleChangeEmail} 
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Update Email"}
                      </Button>
                    </div>
                  )}
                  
                  {/* Password change button */}
                  <div className="flex flex-col space-y-2">
                    <Label>Password</Label>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                    >
                      {isChangingPassword ? "Cancel" : "Change Password"}
                    </Button>
                  </div>
                  
                  {/* Password change form */}
                  {isChangingPassword && (
                    <div className="flex flex-col space-y-4 p-4 border rounded-md bg-accent/10">
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password" 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <Button 
                        onClick={handleChangePassword} 
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Update Password"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="widget-box p-6">
                <h2 className="text-xl font-semibold mb-6">Theme Settings</h2>
                <RadioGroup
                  value={theme}
                  onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
                  className="grid gap-4"
                >
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div key={option.value} className="relative">
                        <RadioGroupItem
                          value={option.value}
                          id={`theme-${option.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`theme-${option.value}`}
                          className="flex items-center gap-4 p-4 rounded-lg border-2 border-muted bg-accent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Icon className="h-5 w-5" />
                          <div>
                            <div className="font-semibold">{option.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          ) : (
            <div className="widget-box p-6">
              <h2 className="text-xl font-semibold mb-6">Customize Experience</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-6">
                <div className="space-y-4">
                  <div className="widget-box p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-6">Account Type</h3>
                    <RadioGroup
                      value={profile.account_type || 'personal'}
                      onValueChange={(value) => setProfile(prev => ({ ...prev, account_type: value }))}
                      className="grid gap-4"
                    >
                      {accountTypes.map((type) => (
                        <div key={type.value} className="relative">
                          <RadioGroupItem
                            value={type.value}
                            id={`account-${type.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`account-${type.value}`}
                            className="flex flex-col p-4 rounded-lg border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <span className="font-semibold">{type.title}</span>
                            <span className="text-sm text-muted-foreground">
                              {type.description}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {profile.account_type === 'business' && (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="business_niche">Business Niche</Label>
                      <Input
                        id="business_niche"
                        placeholder="E.g., Technology, Services, Retail..."
                        value={profile.business_niche || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, business_niche: e.target.value }))}
                      />
                    </div>
                  )}

                  {profile.account_type === 'ecommerce' && (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="product_niche">Product Niche</Label>
                      <Input
                        id="product_niche"
                        placeholder="E.g., Fashion, Electronics, Home Decor..."
                        value={profile.product_niche || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, product_niche: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="content_niche">Content Niche</Label>
                    <Input
                      id="content_niche"
                      placeholder="E.g., Technology, Fitness, Personal Development..."
                      value={profile.content_niche || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, content_niche: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Input
                      id="target_audience"
                      placeholder="E.g., Entrepreneurs, Students, Fitness Enthusiasts..."
                      value={profile.target_audience || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="posting_platforms">Preferred Platforms (comma-separated)</Label>
                    <Input
                      id="posting_platforms"
                      placeholder="E.g., TikTok, Instagram, YouTube..."
                      value={profile.posting_platforms?.join(', ') || ''}
                      onChange={(e) => setProfile(prev => ({ 
                        ...prev, 
                        posting_platforms: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                      }))}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="personality">Content Personality</Label>
                    <Textarea
                      id="personality"
                      placeholder="E.g., Energetic and funny, Professional and educational, Casual and relatable..."
                      value={profile.content_personality || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, content_personality: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="style">Content Style</Label>
                    <Textarea
                      id="style"
                      placeholder="E.g., Tutorial-based with step-by-step instructions, Story-driven content with personal experiences..."
                      value={profile.content_style || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, content_style: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
