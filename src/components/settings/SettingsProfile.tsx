
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const SettingsProfile = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");
  
  // Profile data
  const [accountType, setAccountType] = useState<string>("personal");
  const [contentNiche, setContentNiche] = useState("");
  const [productNiche, setProductNiche] = useState("");
  const [businessNiche, setBusinessNiche] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentType, setContentType] = useState("");
  const [postingFrequency, setPostingFrequency] = useState("");
  const [postingPlatforms, setPostingPlatforms] = useState<string[]>([]);
  const [brandName, setBrandName] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
            
          if (error) {
            throw error;
          }
          
          if (profile) {
            setAccountType(profile.account_type || "personal");
            setContentNiche(profile.content_niche || "");
            setProductNiche(profile.product_niche || "");
            setBusinessNiche(profile.business_niche || "");
            setBusinessDescription(profile.business_description || "");
            setTargetAudience(profile.target_audience || "");
            setContentType(profile.content_type || "");
            setPostingFrequency(profile.posting_frequency || "");
            setPostingPlatforms(profile.posting_platforms || []);
            setBrandName(profile.brand_name || "");
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [toast]);
  
  const handleSaveProfile = async () => {
    if (!userId) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          account_type: accountType,
          content_niche: contentNiche,
          product_niche: productNiche,
          business_niche: businessNiche,
          business_description: businessDescription,
          target_audience: targetAudience,
          content_type: contentType,
          posting_frequency: postingFrequency,
          posting_platforms: postingPlatforms,
          brand_name: brandName
        })
        .eq("id", userId);
        
      if (error) throw error;
      
      toast({
        title: "Profile saved",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        title: "Error saving profile",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Render different fields based on account type
  const renderAccountTypeFields = () => {
    switch(accountType) {
      case "personal":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content-niche">Content Niche</Label>
              <Input
                id="content-niche"
                value={contentNiche}
                onChange={(e) => setContentNiche(e.target.value)}
                placeholder="e.g. Fitness, Technology, Cooking"
              />
            </div>
          </div>
        );
        
      case "ecommerce":
        return (
          <div className="space-y-4">
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
              <Label htmlFor="product-niche">Product Niche</Label>
              <Input
                id="product-niche"
                value={productNiche}
                onChange={(e) => setProductNiche(e.target.value)}
                placeholder="e.g. Skincare, Electronics, Apparel"
              />
            </div>
          </div>
        );
        
      case "business":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Business Name</Label>
              <Input
                id="brand-name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Your business name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-niche">Business Niche</Label>
              <Input
                id="business-niche"
                value={businessNiche}
                onChange={(e) => setBusinessNiche(e.target.value)}
                placeholder="e.g. B2B Software, Consulting, Retail"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-description">Business Description</Label>
              <Textarea
                id="business-description"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Describe your business and what you offer"
                className="min-h-[100px]"
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="account-type">Account Type</Label>
          <RadioGroup 
            id="account-type" 
            value={accountType} 
            onValueChange={setAccountType}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="personal" id="personal" />
              <Label htmlFor="personal">Personal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ecommerce" id="ecommerce" />
              <Label htmlFor="ecommerce">E-commerce</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="business" id="business" />
              <Label htmlFor="business">Business</Label>
            </div>
          </RadioGroup>
        </div>
        
        {renderAccountTypeFields()}
        
        <div className="space-y-2">
          <Label htmlFor="target-audience">Target Audience</Label>
          <Input
            id="target-audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g. Young adults interested in fitness"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content-type">Content Type</Label>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="inspirational">Inspirational</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="posting-frequency">Posting Frequency</Label>
          <Select value={postingFrequency} onValueChange={setPostingFrequency}>
            <SelectTrigger>
              <SelectValue placeholder="Select posting frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="multiple-per-week">Multiple times per week</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Primary Platform</Label>
          <RadioGroup 
            value={postingPlatforms[0] || ""} 
            onValueChange={(value) => setPostingPlatforms([value])}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tiktok" id="tiktok" />
              <Label htmlFor="tiktok">TikTok</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="instagram" id="instagram" />
              <Label htmlFor="instagram">Instagram</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="youtube" id="youtube" />
              <Label htmlFor="youtube">YouTube</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="linkedin" id="linkedin" />
              <Label htmlFor="linkedin">LinkedIn</Label>
            </div>
          </RadioGroup>
        </div>
        
        <Button
          onClick={handleSaveProfile}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsProfile;
