
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tables } from "@/integrations/supabase/types";

type ProfileData = Tables<"profiles">;

const SettingsProfile = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [accountType, setAccountType] = useState("personal");
  const [contentNiche, setContentNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentStyle, setContentStyle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [contentType, setContentType] = useState("");
  const [postingFrequency, setPostingFrequency] = useState("");
  const [postingPlatforms, setPostingPlatforms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [enableOptimization, setEnableOptimization] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (profileData) {
          setAccountType(profileData.account_type || "personal");
          setContentNiche(profileData.content_niche || "");
          setTargetAudience(profileData.target_audience || "");
          setContentStyle(profileData.content_style || "");
          setBrandName(profileData.brand_name || "");
          setBusinessDescription(profileData.business_description || "");
          setContentType(profileData.content_type || "");
          setPostingFrequency(profileData.posting_frequency || "");
          setPostingPlatforms(profileData.posting_platforms || []);
          setEnableOptimization(profileData.enable_optimization !== false); // default to true
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          account_type: accountType,
          content_niche: contentNiche,
          target_audience: targetAudience,
          content_style: contentStyle,
          brand_name: brandName,
          business_description: businessDescription,
          content_type: contentType,
          posting_frequency: postingFrequency,
          posting_platforms: postingPlatforms,
          enable_optimization: enableOptimization
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile settings have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const platformOptions = [
    "TikTok", "Instagram", "YouTube", "Facebook", "Twitter", "LinkedIn", "Pinterest"
  ];

  const handlePlatformToggle = (platform: string) => {
    if (postingPlatforms.includes(platform)) {
      setPostingPlatforms(postingPlatforms.filter(p => p !== platform));
    } else {
      setPostingPlatforms([...postingPlatforms, platform]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="account-type">Account Type</Label>
          <Select 
            value={accountType} 
            onValueChange={setAccountType}
          >
            <SelectTrigger id="account-type">
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="creator">Creator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {accountType === "business" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Your brand name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-description">Business Description</Label>
              <Textarea
                id="business-description"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Briefly describe your business"
                rows={3}
              />
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="content-niche">Content Niche</Label>
          <Input
            id="content-niche"
            value={contentNiche}
            onChange={(e) => setContentNiche(e.target.value)}
            placeholder="e.g. Tech, Fashion, Finance, etc."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="target-audience">Target Audience</Label>
          <Textarea
            id="target-audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Describe your target audience"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content-type">Content Type</Label>
          <Input
            id="content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            placeholder="e.g. Educational, Entertainment, Tutorials"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Posting Platforms</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {platformOptions.map(platform => (
              <div key={platform} className="flex items-center space-x-2">
                <Switch 
                  id={`platform-${platform}`}
                  checked={postingPlatforms.includes(platform)}
                  onCheckedChange={() => handlePlatformToggle(platform)}
                />
                <Label htmlFor={`platform-${platform}`}>{platform}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="posting-frequency">Posting Frequency</Label>
          <Select 
            value={postingFrequency} 
            onValueChange={setPostingFrequency}
          >
            <SelectTrigger id="posting-frequency">
              <SelectValue placeholder="Select posting frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="multiple-times-week">Multiple times per week</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="occasionally">Occasionally</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {(accountType === "creator" || accountType === "business") && (
          <div className="space-y-2">
            <Label htmlFor="content-style">Content Style</Label>
            <Textarea
              id="content-style"
              value={contentStyle}
              onChange={(e) => setContentStyle(e.target.value)}
              placeholder="Describe your content style and voice"
              rows={3}
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="enable-optimization" 
            checked={enableOptimization}
            onCheckedChange={setEnableOptimization}
          />
          <Label htmlFor="enable-optimization">Enable idea optimization based on my profile</Label>
        </div>
        
        <Button onClick={handleSaveProfile} disabled={isLoading} className="mt-4">
          {isLoading ? "Saving..." : "Save Profile Settings"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsProfile;
