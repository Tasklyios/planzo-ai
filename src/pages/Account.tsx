import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Monitor, Moon, Sun } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('content_personality, content_style, account_type, content_niche, target_audience, posting_platforms, business_niche, product_niche')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        // Update localStorage with the fetched values
        if (data.content_niche) localStorage.setItem("niche", data.content_niche);
        if (data.target_audience) localStorage.setItem("audience", data.target_audience);
        if (data.posting_platforms && data.posting_platforms.length > 0) {
          localStorage.setItem("platform", data.posting_platforms[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data",
      });
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
        description: "Failed to update profile. Please try again.",
      });
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
                <h2 className="text-xl font-semibold mb-6">Account Type</h2>
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
