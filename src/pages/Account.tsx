import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import AuthGuard from "@/components/AuthGuard";
import { MultiSelect } from "@/components/ui/multi-select";

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
}

export default function Account() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    account_type: 'personal',
    posting_platforms: []
  });
  const { toast } = useToast();

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get email from auth
      if (session.user.email) {
        setProfile(prev => ({ ...prev, email: session.user.email }));
      }

      // Get profile data from profiles table
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

      // Update email if changed
      if (profile.email !== session.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ 
          email: profile.email 
        });
        if (emailError) throw emailError;
      }

      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          content_niche: profile.content_niche,
          target_audience: profile.target_audience,
          posting_platforms: profile.posting_platforms,
          product_niche: profile.product_niche,
          business_niche: profile.business_niche
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

  const renderAccountTypeFields = () => {
    switch (profile.account_type) {
      case 'personal':
        return (
          <>
            <div className="space-y-2">
              <Label>Content Niche</Label>
              <Input
                value={profile.content_niche || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, content_niche: e.target.value }))}
                placeholder="e.g., Fitness, Technology, Fashion"
                disabled={loading}
              />
            </div>
          </>
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

  return (
    <AuthGuard>
      <div className="container mx-auto py-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account preferences and content settings</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={profile.email || ''} 
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    disabled={loading}
                  />
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
                  className="w-full mt-6"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
