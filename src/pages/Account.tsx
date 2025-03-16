
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import AuthGuard from "@/components/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

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

const contentTypes = [
  {
    value: "talking_head",
    title: "Talking Head Videos",
    description: "Face-to-camera videos where you directly speak to your audience"
  },
  {
    value: "text_based",
    title: "Text-Based Visual Content",
    description: "Videos with animated text, graphics, and visuals with minimal on-camera presence"
  },
  {
    value: "mixed",
    title: "Mixed Content Approach",
    description: "Combination of talking head segments with text-based visuals for variety"
  },
];

const contentNiches = [
  { value: 'Education', label: 'Education & Learning' },
  { value: 'Entertainment', label: 'Entertainment & Comedy' },
  { value: 'Lifestyle', label: 'Lifestyle & Daily Vlogs' },
  { value: 'Technology', label: 'Technology & Gadgets' },
  { value: 'Fashion & Beauty', label: 'Fashion & Beauty' },
  { value: 'Health & Fitness', label: 'Health & Fitness' },
  { value: 'Other', label: 'Other (Custom)' },
];

const postingFrequencies = [
  { value: 'daily', label: 'Daily (5-7 times per week)' },
  { value: 'multiple_times_a_week', label: 'Multiple times a week (2-4 times)' },
  { value: 'weekly', label: 'Weekly (Once a week)' },
  { value: 'monthly', label: 'Monthly (1-3 times per month)' },
  { value: 'irregularly', label: 'Irregular schedule' },
];

interface Profile {
  id?: string;
  account_type: string;
  content_niche?: string | null;
  target_audience?: string | null;
  posting_platforms?: string[] | null;
  business_niche?: string | null;
  product_niche?: string | null;
  business_description?: string | null;
  content_type?: string | null;
  posting_frequency?: string | null;
}

export default function Account() {
  const [activeTab, setActiveTab] = useState<'settings' | 'customize'>('settings');
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
  const [isCustomNiche, setIsCustomNiche] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Account component mounted, fetching profile");
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log("Fetching profile data...");
      setLoading(true);
      setFetchError(null);
      
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

      const { data, error } = await supabase
        .from('profiles')
        .select('account_type, content_niche, target_audience, posting_platforms, business_niche, product_niche, business_description, content_type, posting_frequency')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log("Profile data fetched:", data);
      
      if (data) {
        setProfile(data as Profile);
        
        // Check if content_niche is a custom value
        const isStandardNiche = contentNiches.some(niche => niche.value === data.content_niche);
        setIsCustomNiche(!isStandardNiche && data.content_niche !== null);
        
        if (data.content_niche) localStorage.setItem("niche", data.content_niche);
        if (data.target_audience) localStorage.setItem("audience", data.target_audience);
        if (data.posting_platforms && data.posting_platforms.length > 0) {
          localStorage.setItem("platform", data.posting_platforms[0]);
        }
        
        if (data.business_niche) localStorage.setItem("videoType", data.business_niche);
        if (data.product_niche) localStorage.setItem("videoType", data.product_niche);
        
        triggerStorageEvents();
      } else {
        console.log("No profile found, creating default profile");
        const defaultProfile: Profile = {
          account_type: 'personal',
          content_niche: '',
          target_audience: '',
          posting_platforms: [],
        };
        
        setProfile(defaultProfile);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            account_type: defaultProfile.account_type,
            content_niche: defaultProfile.content_niche,
            target_audience: defaultProfile.target_audience,
            posting_platforms: defaultProfile.posting_platforms
          });
          
        if (insertError) {
          console.error("Error creating default profile:", insertError);
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

  const triggerStorageEvents = () => {
    try {
      window.dispatchEvent(new Event('storage'));
      
      const customEvent = new CustomEvent('localStorageChange');
      window.dispatchEvent(customEvent);
      
      console.log("Storage events triggered");
    } catch (e) {
      console.warn('Could not dispatch storage event', e);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      console.log("Updating profile:", profile);
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

      if (!profile.account_type) {
        profile.account_type = 'personal';
      }

      const updateData: any = {
        id: session.user.id,
        account_type: profile.account_type,
        content_niche: profile.content_niche || null,
        target_audience: profile.target_audience || null,
        posting_platforms: profile.posting_platforms || [],
        business_niche: profile.business_niche || null,
        business_description: profile.business_description || null,
        product_niche: profile.product_niche || null,
        content_type: profile.content_type || null,
        posting_frequency: profile.posting_frequency || null
      };

      console.log("Updating profile with:", updateData);

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData);

      if (error) throw error;

      let nicheToStore = profile.content_niche || "";
      let videoTypeValue = profile.content_niche || "";
      
      if (profile.account_type === 'business' && profile.business_niche) {
        nicheToStore = profile.business_niche;
        videoTypeValue = profile.business_niche;
      } else if (profile.account_type === 'ecommerce' && profile.product_niche) {
        nicheToStore = profile.product_niche;
        videoTypeValue = profile.product_niche;
      }
      
      localStorage.setItem("niche", nicheToStore);
      localStorage.setItem("videoType", videoTypeValue);
      
      if (profile.target_audience) {
        localStorage.setItem("audience", profile.target_audience);
      }
      
      if (profile.posting_platforms && profile.posting_platforms.length > 0) {
        localStorage.setItem("platform", profile.posting_platforms[0]);
      }

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
      
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLocalStorage = (key: string, value: string) => {
    const oldValue = localStorage.getItem(key);
    console.log(`Updating localStorage: ${key} = ${value} (was: ${oldValue})`);
    
    localStorage.setItem(key, value);
    
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

  const handleContentNicheChange = (value: string) => {
    setProfile(prev => ({ ...prev, content_niche: value }));
    setIsCustomNiche(value === 'Other');
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
                  
                  <div className="flex flex-col space-y-2">
                    <Label>Password</Label>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                    >
                      {isChangingPassword ? "Cancel" : "Change Password"}
                    </Button>
                  </div>
                  
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
              <h2 className="text-xl font-semibold mb-6">Customize Content Settings</h2>
              <p className="text-muted-foreground mb-6">
                Customize your content settings to match your audience and niche. These settings will be used to generate content tailored to your needs.
              </p>
              
              <form className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Type</h3>
                  <RadioGroup
                    value={profile.account_type}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, account_type: value }))}
                    className="grid gap-4"
                  >
                    {accountTypes.map((option) => (
                      <div key={option.value} className="relative">
                        <RadioGroupItem
                          value={option.value}
                          id={`account-${option.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`account-${option.value}`}
                          className="flex flex-col space-y-1 p-4 rounded-lg border-2 border-muted bg-accent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <div className="font-semibold">{option.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                {profile.account_type === 'personal' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Content Details</h3>
                    
                    <div className="space-y-4">
                      <Label>Content Type</Label>
                      <RadioGroup
                        value={profile.content_type || ''}
                        onValueChange={(value) => setProfile(prev => ({ ...prev, content_type: value }))}
                        className="grid gap-4"
                      >
                        {contentTypes.map((option) => (
                          <Card 
                            key={option.value}
                            className={`cursor-pointer ${profile.content_type === option.value ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => setProfile(prev => ({ ...prev, content_type: option.value }))}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2">
                                <RadioGroupItem 
                                  value={option.value} 
                                  id={`content-type-${option.value}`}
                                  className="peer sr-only" 
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium">{option.title}</h4>
                                  <p className="text-sm text-muted-foreground">{option.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contentNiche">Content Niche</Label>
                      <RadioGroup
                        value={profile.content_niche || ''}
                        onValueChange={handleContentNicheChange}
                        className="grid grid-cols-2 gap-2 mt-2"
                      >
                        {contentNiches.map((niche) => (
                          <div key={niche.value} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              id={`niche-${niche.value}`} 
                              value={niche.value} 
                            />
                            <Label 
                              htmlFor={`niche-${niche.value}`} 
                              className="cursor-pointer"
                            >
                              {niche.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      {(isCustomNiche || profile.content_niche === 'Other') && (
                        <div className="mt-2">
                          <Input
                            placeholder="Specify your niche"
                            value={isCustomNiche ? profile.content_niche || '' : ''}
                            onChange={(e) => setProfile(prev => ({ ...prev, content_niche: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postingFrequency">Posting Frequency</Label>
                      <RadioGroup
                        value={profile.posting_frequency || ''}
                        onValueChange={(value) => setProfile(prev => ({ ...prev, posting_frequency: value }))}
                        className="grid gap-2 mt-2"
                      >
                        {postingFrequencies.map((frequency) => (
                          <div key={frequency.value} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              id={`frequency-${frequency.value}`} 
                              value={frequency.value} 
                            />
                            <Label 
                              htmlFor={`frequency-${frequency.value}`} 
                              className="cursor-pointer"
                            >
                              {frequency.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Input
                        id="targetAudience"
                        value={profile.target_audience || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                        placeholder="Describe your target audience"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="postingPlatform">Primary Posting Platform</Label>
                      <Input
                        id="postingPlatform"
                        value={profile.posting_platforms?.[0] || ''}
                        onChange={(e) => 
                          setProfile(prev => ({ 
                            ...prev, 
                            posting_platforms: e.target.value ? [e.target.value] : [] 
                          }))
                        }
                        placeholder="Which platform do you primarily post on?"
                      />
                    </div>
                  </div>
                )}
                
                {profile.account_type === 'business' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Business Details</h3>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="businessDescription">Business Description</Label>
                      <Textarea
                        id="businessDescription"
                        value={profile.business_description || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, business_description: e.target.value }))}
                        placeholder="Describe what your business does"
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="businessNiche">Business Niche</Label>
                      <Input
                        id="businessNiche"
                        value={profile.business_niche || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, business_niche: e.target.value }))}
                        placeholder="What industry is your business in? (e.g., consulting, education)"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="contentNiche">Content Niche</Label>
                      <Input
                        id="contentNiche"
                        value={profile.content_niche || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, content_niche: e.target.value }))}
                        placeholder="What topics will your content focus on?"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Input
                        id="targetAudience"
                        value={profile.target_audience || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                        placeholder="Describe your target audience"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="postingPlatform">Primary Posting Platform</Label>
                      <Input
                        id="postingPlatform"
                        value={profile.posting_platforms?.[0] || ''}
                        onChange={(e) => 
                          setProfile(prev => ({ 
                            ...prev, 
                            posting_platforms: e.target.value ? [e.target.value] : [] 
                          }))
                        }
                        placeholder="Which platform do you primarily post on?"
                      />
                    </div>
                  </div>
                )}
                
                {profile.account_type === 'ecommerce' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">E-commerce Details</h3>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="productNiche">Product Niche</Label>
                      <Input
                        id="productNiche"
                        value={profile.product_niche || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, product_niche: e.target.value }))}
                        placeholder="What products do you sell? (e.g., clothing, electronics)"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="contentNiche">Content Niche</Label>
                      <Input
                        id="contentNiche"
                        value={profile.content_niche || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, content_niche: e.target.value }))}
                        placeholder="What topics will your content focus on?"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Input
                        id="targetAudience"
                        value={profile.target_audience || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                        placeholder="Describe your target audience"
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="postingPlatform">Primary Posting Platform</Label>
                      <Input
                        id="postingPlatform"
                        value={profile.posting_platforms?.[0] || ''}
                        onChange={(e) => 
                          setProfile(prev => ({ 
                            ...prev, 
                            posting_platforms: e.target.value ? [e.target.value] : [] 
                          }))
                        }
                        placeholder="Which platform do you primarily post on?"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    type="button"
                    onClick={handleUpdateProfile}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
