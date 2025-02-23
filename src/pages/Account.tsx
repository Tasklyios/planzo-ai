
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

interface Profile {
  content_personality?: string | null;
  content_style?: string | null;
  account_type?: string;
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
        .select('content_personality, content_style, account_type')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data || {});
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          content_personality: profile.content_personality,
          content_style: profile.content_style,
        })
        .eq('id', session.user.id);

      if (error) throw error;

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
                <h2 className="text-xl font-semibold mb-6">Theme Settings</h2>
                <div className="space-y-4">
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

              <div className="widget-box p-6">
                <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Your email"
                    />
                  </div>
                </div>
              </div>

              <div className="widget-box p-6">
                <h2 className="text-xl font-semibold mb-6">Billing</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-accent">
                    <div>
                      <p className="font-medium">Free Plan</p>
                      <p className="text-sm text-muted-foreground">Basic features included</p>
                    </div>
                    <Button>
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="widget-box p-6">
              <h2 className="text-xl font-semibold mb-6">Customize Experience</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-6">
                <div className="space-y-4">
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
