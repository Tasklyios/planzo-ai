import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";
import AuthGuard from "@/components/AuthGuard";
import { CreditCard, Moon, Sun, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";

const platformOptions = [
  { label: "TikTok", value: "TikTok" },
  { label: "Instagram Reels", value: "Instagram Reels" },
  { label: "YouTube Shorts", value: "YouTube Shorts" }
];

interface ProfileData {
  email?: string;
  account_type: string;
  content_niche?: string;
  target_audience?: string;
  posting_platforms?: string[];
  product_niche?: string;
  business_niche?: string;
  content_personality?: string;
  content_style?: string;
}

const accountTypes = [
  {
    value: 'personal',
    title: 'Create ideas for my personal brand',
    description: 'Perfect for content creators, influencers, and personal branding',
  },
  {
    value: 'ecommerce',
    title: 'Create ideas for my e-commerce brand',
    description: 'Ideal for online stores and digital product sellers',
  },
  {
    value: 'business',
    title: 'Create ideas for my business',
    description: 'Great for companies and organizations looking to grow their online presence',
  },
];

export default function Account() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'customize'>('settings');
  const [profile, setProfile] = useState<ProfileData>({
    account_type: 'personal',
    posting_platforms: []
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const getProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      if (session.user.email) {
        setProfile(prev => ({ ...prev, email: session.user.email }));
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      if (profileData) {
        setProfile(prev => ({
          ...prev,
          ...profileData
        }));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No user logged in");

      if (profile.email !== session.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ 
          email: profile.email 
        });
        if (emailError) throw emailError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          account_type: profile.account_type,
          content_niche: profile.content_niche,
          target_audience: profile.target_audience,
          posting_platforms: profile.posting_platforms,
          product_niche: profile.product_niche,
          business_niche: profile.business_niche,
          content_personality: profile.content_personality,
          content_style: profile.content_style
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Your profile has been updated.",
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

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email || '', {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const renderAccountTypeFields = () => {
    switch (profile.account_type) {
      case 'personal':
        return (
          <div className="space-y-2">
            <Label>Content Niche</Label>
            <Input
              value={profile.content_niche || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, content_niche: e.target.value }))}
              placeholder="e.g., Fitness, Technology, Fashion"
              disabled={loading}
            />
          </div>
        );
      case 'ecommerce':
        return (
          <>
            <div className="space-y-2">
              <Label>Product Niche</Label>
              <Input
                value={profile.product_niche || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, product_niche: e.target.value }))}
                placeholder="e.g., Fashion Accessories, Home Decor"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Content Niche</Label>
              <Input
                value={profile.content_niche || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, content_niche: e.target.value }))}
                placeholder="e.g., Product Tutorials, Behind the Scenes"
                disabled={loading}
              />
            </div>
          </>
        );
      case 'business':
        return (
          <>
            <div className="space-y-2">
              <Label>Business Niche</Label>
              <Input
                value={profile.business_niche || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, business_niche: e.target.value }))}
                placeholder="e.g., Professional Services, Restaurant"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Content Niche</Label>
              <Input
                value={profile.content_niche || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, content_niche: e.target.value }))}
                placeholder="e.g., Industry Insights, Customer Success Stories"
                disabled={loading}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const themeOptions = [
    {
      value: "light",
      title: "Light",
      description: "Light theme for bright environments",
      icon: Sun
    },
    {
      value: "dark",
      title: "Dark",
      description: "Dark theme for low-light environments",
      icon: Moon
    },
    {
      value: "system",
      title: "System",
      description: "Follows your system preferences",
      icon: Monitor
    }
  ];

  return (
    <AuthGuard>
      <div className="container mx-auto py-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Account</h1>
            <div className="inline-flex items-center rounded-lg border p-1 bg-white shadow-sm">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('customize')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'customize'
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                Customize
              </button>
            </div>
          </div>

          {activeTab === 'settings' ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
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
                            className="flex items-center gap-4 p-4 rounded-lg border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
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

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      value={profile.email || ''} 
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleResetPassword}
                    className="w-full"
                  >
                    Reset Password
                  </Button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Billing</h2>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/billing')}
                  className="w-full"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  View Billing Details
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">AI Customization</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Account Type</Label>
                    <RadioGroup
                      value={profile.account_type}
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

                  {renderAccountTypeFields()}

                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Input
                      value={profile.target_audience || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                      placeholder="e.g., Young Professionals, Fitness Enthusiasts"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Content Personality</Label>
                    <Textarea
                      value={profile.content_personality || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, content_personality: e.target.value }))}
                      placeholder="E.g., Energetic and funny, Professional and educational, Casual and relatable..."
                      className="min-h-[100px]"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Content Style</Label>
                    <Textarea
                      value={profile.content_style || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, content_style: e.target.value }))}
                      placeholder="E.g., Tutorial-based with step-by-step instructions, Story-driven content with personal experiences..."
                      className="min-h-[100px]"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Posting Platforms</Label>
                    <div className="relative">
                      <MultiSelect
                        options={platformOptions}
                        value={profile.posting_platforms?.map(p => ({ label: p, value: p })) || []}
                        onChange={(selected) => setProfile(prev => ({ 
                          ...prev, 
                          posting_platforms: selected.map(s => s.value)
                        }))}
                        disabled={loading}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
