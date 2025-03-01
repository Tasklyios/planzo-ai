
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Monitor, Moon, Sun, Plus, Trash2, Check, Palette } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { StyleProfile } from "@/types/idea";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
  id?: string;
  content_personality?: string | null;
  content_style?: string | null;
  account_type: string;
  content_niche?: string | null;
  target_audience?: string | null;
  posting_platforms?: string[] | null;
  business_niche?: string | null;
  product_niche?: string | null;
  active_style_profile_id?: string | null;
}

export default function Account() {
  const [activeTab, setActiveTab] = useState<'settings' | 'customize' | 'styles'>('settings');
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile>({account_type: 'personal'});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [styleProfiles, setStyleProfiles] = useState<StyleProfile[]>([]);
  const [newProfileName, setNewProfileName] = useState("");
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Add new state variables for the style profile creation dialog
  const [isNewProfileDialogOpen, setIsNewProfileDialogOpen] = useState(false);
  const [newProfileContentStyle, setNewProfileContentStyle] = useState("");
  const [newProfileContentPersonality, setNewProfileContentPersonality] = useState("");

  useEffect(() => {
    console.log("Account component mounted, fetching profile");
    fetchProfile();
    fetchStyleProfiles();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log("Fetching profile data...");
      setLoading(true);
      setFetchError(null);
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      
      if (!session?.user) {
        console.error("No authenticated user found");
        setFetchError("No authenticated user found. Please log in again.");
        return;
      }

      setEmail(session.user.email || "");

      // Fetch profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('content_personality, content_style, account_type, content_niche, target_audience, posting_platforms, business_niche, product_niche, active_style_profile_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log("Profile data fetched:", data);
      
      if (data) {
        setProfile(data as Profile);
        
        // Update localStorage with the fetched values
        if (data.content_niche) localStorage.setItem("niche", data.content_niche);
        if (data.target_audience) localStorage.setItem("audience", data.target_audience);
        if (data.posting_platforms && data.posting_platforms.length > 0) {
          localStorage.setItem("platform", data.posting_platforms[0]);
        }
        
        // Set videoType based on account type
        if (data.account_type === 'ecommerce' && data.product_niche) {
          localStorage.setItem("videoType", data.product_niche);
          localStorage.setItem("niche", data.product_niche);
        } else if (data.account_type === 'business' && data.business_niche) {
          localStorage.setItem("videoType", data.business_niche);
          localStorage.setItem("niche", data.business_niche);
        } else if (data.content_niche) {
          localStorage.setItem("videoType", data.content_niche);
        }

        if (data.active_style_profile_id) {
          setActiveProfileId(data.active_style_profile_id);
        }
        
        // Trigger a storage event to notify other tabs
        triggerStorageEvents();
      } else {
        // If no profile found, insert a default profile
        console.log("No profile found, creating default profile");
        const defaultProfile: Profile = {
          account_type: 'personal', // This is required
          content_personality: '',
          content_style: '',
          content_niche: '',
          target_audience: '',
          posting_platforms: [],
        };
        
        setProfile(defaultProfile);
        
        // Insert the default profile - explicitly setting account_type as required
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            account_type: defaultProfile.account_type,
            content_personality: defaultProfile.content_personality,
            content_style: defaultProfile.content_style,
            content_niche: defaultProfile.content_niche,
            target_audience: defaultProfile.target_audience,
            posting_platforms: defaultProfile.posting_platforms
          });
          
        if (insertError) {
          console.error("Error creating default profile:", insertError);
          // We'll continue anyway since we set the state locally
        }
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

  const fetchStyleProfiles = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('style_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("Style profiles fetched:", data);
      setStyleProfiles(data || []);

    } catch (error: any) {
      console.error('Error fetching style profiles:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch style profiles. " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerStorageEvents = () => {
    try {
      window.dispatchEvent(new Event('storage'));
      
      // Also dispatch a custom event as a fallback
      const customEvent = new CustomEvent('localStorageChange');
      window.dispatchEvent(customEvent);
      
      console.log("Storage events triggered");
    } catch (e) {
      console.warn('Could not dispatch storage event', e);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      console.log("Updating profile...");
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

      // Ensure account_type is always defined for the update
      if (!profile.account_type) {
        profile.account_type = 'personal'; // Default value if somehow undefined
      }

      // Prepare the update data based on account type - explicitly type as required by Supabase
      const updateData: any = {
        id: session.user.id,
        account_type: profile.account_type,
        content_personality: profile.content_personality || null,
        content_style: profile.content_style || null,
        content_niche: profile.content_niche || null,
        target_audience: profile.target_audience || null,
        posting_platforms: profile.posting_platforms || [],
        business_niche: profile.business_niche || null,
        product_niche: profile.product_niche || null
      };

      console.log("Updating profile with:", updateData);

      // Try upsert instead of update to handle missing profile records
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          account_type: profile.account_type, // This is required
          content_personality: profile.content_personality,
          content_style: profile.content_style,
          content_niche: profile.content_niche,
          target_audience: profile.target_audience,
          posting_platforms: profile.posting_platforms || [],
          business_niche: profile.business_niche,
          product_niche: profile.product_niche
        });

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      console.log("Profile updated successfully");

      // Update localStorage with correct values based on account type
      let nicheToStore = profile.content_niche || "";
      let videoTypeValue = profile.content_niche || "";
      
      if (profile.account_type === 'business' && profile.business_niche) {
        nicheToStore = profile.business_niche;
        videoTypeValue = profile.business_niche;
      } else if (profile.account_type === 'ecommerce' && profile.product_niche) {
        nicheToStore = profile.product_niche;
        videoTypeValue = profile.product_niche;
      }
      
      // Use the updateLocalStorage helper to ensure cross-tab updates
      updateLocalStorage("niche", nicheToStore);
      updateLocalStorage("videoType", videoTypeValue);
      
      if (profile.target_audience) {
        updateLocalStorage("audience", profile.target_audience);
      }
      
      if (profile.posting_platforms && profile.posting_platforms.length > 0) {
        updateLocalStorage("platform", profile.posting_platforms[0]);
      }

      // Force a refresh of localStorage data to ensure consistency
      triggerStorageEvents();

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
      
      // Refresh profile data from the server to confirm the update
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLocalStorage = (key: string, value: string) => {
    const oldValue = localStorage.getItem(key);
    console.log(`Updating localStorage: ${key} = ${value} (was: ${oldValue})`);
    
    localStorage.setItem(key, value);
    
    // Dispatch a storage event to notify other tabs
    try {
      const event = new StorageEvent('storage', {
        key: key,
        oldValue: oldValue || '',
        newValue: value,
        storageArea: localStorage,
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.warn('Could not dispatch storage event', e);
      
      // Fallback: dispatch a custom event
      const customEvent = new CustomEvent('localStorageChange', { 
        detail: { key, oldValue, newValue: value } 
      });
      window.dispatchEvent(customEvent);
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

  // Update createNewStyleProfile to use the dialog data
  const createNewStyleProfile = async () => {
    try {
      if (!newProfileName.trim()) {
        toast({
          variant: "destructive",
          title: "Name Required",
          description: "Please provide a name for your style profile.",
        });
        return;
      }

      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to create a style profile",
        });
        return;
      }

      // Create new style profile with content style and personality from the dialog
      const { data, error } = await supabase
        .from('style_profiles')
        .insert({
          user_id: session.user.id,
          name: newProfileName.trim(),
          content_style: newProfileContentStyle.trim(),
          content_personality: newProfileContentPersonality.trim(),
          is_active: false
        })
        .select('*')
        .single();

      if (error) throw error;

      toast({
        title: "Style Profile Created",
        description: "Your new style profile has been created successfully.",
      });

      setStyleProfiles([data, ...styleProfiles]);
      setNewProfileName("");
      setNewProfileContentStyle("");
      setNewProfileContentPersonality("");
      setIsNewProfileDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating style profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create style profile. " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteStyleProfile = async (profileId: string) => {
    try {
      setLoading(true);
      
      // Check if this is the active profile
      if (profile.active_style_profile_id === profileId) {
        // Clear the active profile reference first
        await supabase
          .from('profiles')
          .update({ active_style_profile_id: null })
          .eq('id', profile.id);
        
        setProfile(prev => ({ ...prev, active_style_profile_id: null }));
        setActiveProfileId(null);
      }

      const { error } = await supabase
        .from('style_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      setStyleProfiles(styleProfiles.filter(p => p.id !== profileId));
      
      toast({
        title: "Style Profile Deleted",
        description: "The style profile has been deleted successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting style profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete style profile. " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const activateStyleProfile = async (profileId: string) => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const profileToActivate = styleProfiles.find(p => p.id === profileId);
      if (!profileToActivate) {
        throw new Error("Style profile not found");
      }

      // Update the active profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          active_style_profile_id: profileId,
          content_style: profileToActivate.content_style,
          content_personality: profileToActivate.content_personality
        })
        .eq('id', session.user.id);

      if (error) throw error;

      // Update local profile state
      setProfile(prev => ({ 
        ...prev, 
        active_style_profile_id: profileId,
        content_style: profileToActivate.content_style,
        content_personality: profileToActivate.content_personality 
      }));
      
      setActiveProfileId(profileId);

      // Update localStorage
      if (profileToActivate.content_style) {
        localStorage.setItem("contentStyle", profileToActivate.content_style);
      }
      
      if (profileToActivate.content_personality) {
        localStorage.setItem("contentPersonality", profileToActivate.content_personality);
      }

      // Trigger storage events
      triggerStorageEvents();

      toast({
        title: "Style Profile Activated",
        description: `"${profileToActivate.name}" is now your active style profile.`,
      });
    } catch (error: any) {
      console.error('Error activating style profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to activate style profile. " + error.message,
      });
    } finally {
      setLoading(false);
    }
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
                onClick={() => setActiveTab('styles')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'styles'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Style Profiles
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
          ) : activeTab === 'styles' ? (
            <div className="widget-box p-6">
              <h2 className="text-xl font-semibold mb-6">Style Profiles</h2>
              <p className="text-muted-foreground mb-6">
                Create and manage your content style profiles to quickly switch between different styles.
              </p>
              
              <div className="space-y-6">
                {/* Create new style profile button */}
                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={() => setIsNewProfileDialogOpen(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Style Profile
                  </Button>
                </div>
                
                {/* Style profiles list */}
                <div className="space-y-3">
                  {styleProfiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>You don't have any style profiles yet.</p>
                      <p className="mt-2">Create a new one or use Find Your Style to analyze content.</p>
                    </div>
                  ) : (
                    styleProfiles.map(profile => (
                      <div 
                        key={profile.id} 
                        className={`p-4 border rounded-lg relative ${
                          activeProfileId === profile.id ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        {activeProfileId === profile.id && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-20">
                            <h3 className="font-medium">{profile.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {profile.content_personality || "No personality set"}
                            </p>
                            {profile.content_style && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                <span className="font-medium">Style:</span> {profile.content_style}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {activeProfileId !== profile.id && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => activateStyleProfile(profile.id)}
                                disabled={loading}
                              >
                                Activate
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 mt-auto"
                              onClick={() => deleteStyleProfile(profile.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                        placeholder="E.g., Fashion, Electronics, Home goods..."
                        value={profile.product_niche || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, product_niche: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="content_niche">Content Niche</Label>
                    <Input
                      id="content_niche"
                      placeholder="E.g., Fitness, Technology, Cooking..."
                      value={profile.content_niche || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, content_niche: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Input
                      id="target_audience"
                      placeholder="E.g., Young adults, Professionals, Parents..."
                      value={profile.target_audience || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="content_style">Content Style</Label>
                    <Textarea
                      id="content_style"
                      placeholder="Describe the style of your content..."
                      className="h-24"
                      value={profile.content_style || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, content_style: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="content_personality">Content Personality</Label>
                    <Textarea
                      id="content_personality"
                      placeholder="Describe the personality or tone of your content..."
                      className="h-24"
                      value={profile.content_personality || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, content_personality: e.target.value }))}
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          )}

          {/* Style Profile creation dialog */}
          <Dialog open={isNewProfileDialogOpen} onOpenChange={setIsNewProfileDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Style Profile</DialogTitle>
                <DialogDescription>
                  Create a new style profile to quickly switch between different content styles.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="profileName">Profile Name</Label>
                  <Input
                    id="profileName" 
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="E.g., Professional, Casual, Energetic..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contentStyle">Content Style</Label>
                  <Textarea
                    id="contentStyle"
                    value={newProfileContentStyle}
                    onChange={(e) => setNewProfileContentStyle(e.target.value)}
                    placeholder="Describe the style of your content..."
                    className="h-20"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contentPersonality">Content Personality</Label>
                  <Textarea
                    id="contentPersonality"
                    value={newProfileContentPersonality}
                    onChange={(e) => setNewProfileContentPersonality(e.target.value)}
                    placeholder="Describe the personality or tone of your content..."
                    className="h-20"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewProfileDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createNewStyleProfile}
                  disabled={loading || !newProfileName.trim()}
                >
                  {loading ? "Creating..." : "Create Profile"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  );
}
