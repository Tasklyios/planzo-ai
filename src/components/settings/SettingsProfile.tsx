import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type ProfileData = Tables<"profiles">;

const contentTypes = [
  { value: "talking_head", label: "Talking Head Videos", description: "Face-to-camera content where you speak directly to your audience" },
  { value: "text_based", label: "Text-Overlay Videos", description: "Videos that primarily use text overlays with visuals or b-roll footage" },
  { value: "mixed", label: "Mixed Format", description: "Combination of talking head segments with text overlays and visual elements" }
];

const contentNiches = [
  "Education",
  "Entertainment",
  "Lifestyle",
  "Technology",
  "Fashion & Beauty",
  "Health & Fitness",
  "Entrepreneur / Motivational",
  "Fitness"
];

const postingFrequencies = [
  "Daily",
  "3-5 times per week",
  "1-2 times per week",
  "A few times a month",
  "Monthly"
];

const platformOptions = [
  "TikTok", "Instagram", "YouTube", "Facebook", "Twitter", "LinkedIn", "Pinterest"
];

const SettingsProfile = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [accountType, setAccountType] = useState("personal");
  const [isCustomNiche, setIsCustomNiche] = useState(false);
  const [contentNiche, setContentNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentStyle, setContentStyle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [contentType, setContentType] = useState("");
  const [postingFrequency, setPostingFrequency] = useState("");
  const [postingPlatforms, setPostingPlatforms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [enableOptimization, setEnableOptimization] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [productNiche, setProductNiche] = useState("");
  const [businessNiche, setBusinessNiche] = useState("");

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
          setFirstName(profileData.first_name || "");
          setLastName(profileData.last_name || "");
          setProductNiche(profileData.product_niche || "");
          setBusinessNiche(profileData.business_niche || "");
          
          if (profileData.content_niche && !contentNiches.includes(profileData.content_niche)) {
            setIsCustomNiche(true);
            setCustomNiche(profileData.content_niche);
          }
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let nicheField = "";
      if (accountType === "personal") {
        nicheField = isCustomNiche ? customNiche || "" : contentNiche || "";
      } else if (accountType === "ecommerce") {
        nicheField = productNiche || "";
      } else {
        nicheField = businessNiche || "";
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          account_type: accountType,
          content_niche: accountType === "personal" ? nicheField : contentNiche,
          product_niche: accountType === "ecommerce" ? nicheField : productNiche,
          business_niche: accountType === "business" ? nicheField : businessNiche,
          target_audience: targetAudience,
          content_style: contentStyle,
          brand_name: brandName,
          business_description: businessDescription,
          content_type: contentType,
          posting_frequency: postingFrequency,
          posting_platforms: postingPlatforms,
          enable_optimization: enableOptimization,
          first_name: firstName,
          last_name: lastName,
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

  const handlePlatformToggle = (platform: string) => {
    if (postingPlatforms.includes(platform)) {
      setPostingPlatforms(postingPlatforms.filter(p => p !== platform));
    } else {
      setPostingPlatforms([...postingPlatforms, platform]);
    }
  };

  const handleContentTypeChange = (value: string) => {
    try {
      const isValidType = contentTypes.some(type => type.value === value);
      if (isValidType) {
        setContentType(value);
        
        if (user) {
          supabase
            .from("profiles")
            .update({ content_type: value })
            .eq("id", user.id)
            .then(({ error }) => {
              if (error) {
                console.error("Error updating content type:", error);
              }
            });
        }
      } else {
        console.warn("Invalid content type selected:", value);
      }
    } catch (error) {
      console.error("Error handling content type change:", error);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Type</h3>
            <RadioGroup
              value={accountType}
              onValueChange={setAccountType}
              className="grid grid-cols-1 gap-4 pt-2"
            >
              <div className={`flex items-center space-x-2 rounded-lg border p-4 ${accountType === "personal" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="personal" id="personal" className="sr-only" />
                <label htmlFor="personal" className="flex flex-1 cursor-pointer items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">Personal Brand</p>
                      <p className="text-sm text-muted-foreground">
                        For creators, influencers, and personal accounts
                      </p>
                    </div>
                  </div>
                  {accountType === "personal" && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </label>
              </div>

              <div className={`flex items-center space-x-2 rounded-lg border p-4 ${accountType === "ecommerce" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="ecommerce" id="ecommerce" className="sr-only" />
                <label htmlFor="ecommerce" className="flex flex-1 cursor-pointer items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">E-commerce</p>
                      <p className="text-sm text-muted-foreground">
                        For online stores and product-based businesses
                      </p>
                    </div>
                  </div>
                  {accountType === "ecommerce" && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </label>
              </div>

              <div className={`flex items-center space-x-2 rounded-lg border p-4 ${accountType === "business" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="business" id="business" className="sr-only" />
                <label htmlFor="business" className="flex flex-1 cursor-pointer items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">Business</p>
                      <p className="text-sm text-muted-foreground">
                        For service providers, agencies, and companies
                      </p>
                    </div>
                  </div>
                  {accountType === "business" && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Personal Information</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName"
                  placeholder="First Name" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  placeholder="Last Name" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {accountType === "personal" && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Content Details</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base">Content Type</Label>
                    <RadioGroup
                      value={contentType}
                      onValueChange={handleContentTypeChange}
                      className="grid grid-cols-1 gap-4 pt-2"
                    >
                      {contentTypes.map((type) => (
                        <div 
                          key={type.value}
                          className={`flex items-center space-x-2 rounded-lg border p-4 ${contentType === type.value ? "border-primary bg-primary/5" : "border-border"}`}
                        >
                          <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                          <label htmlFor={type.value} className="flex flex-1 cursor-pointer items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-sm font-medium">{type.label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {type.description}
                                </p>
                              </div>
                            </div>
                            {contentType === type.value && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-base">Content Niche</Label>
                    
                    <Tabs defaultValue={isCustomNiche ? "custom" : "predefined"} onValueChange={(value) => setIsCustomNiche(value === "custom")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="predefined">Common Niches</TabsTrigger>
                        <TabsTrigger value="custom">Custom Niche</TabsTrigger>
                      </TabsList>
                      <TabsContent value="predefined" className="space-y-4 pt-4">
                        <RadioGroup
                          value={contentNiche}
                          onValueChange={setContentNiche}
                          className="grid grid-cols-2 gap-2"
                        >
                          {contentNiches.map((niche) => (
                            <div key={niche} className={`flex items-center space-x-2 rounded-lg border p-3 ${contentNiche === niche ? "border-primary bg-primary/5" : "border-border"}`}>
                              <RadioGroupItem value={niche} id={`niche-${niche}`} className="sr-only" />
                              <label htmlFor={`niche-${niche}`} className="flex flex-1 cursor-pointer items-center justify-between">
                                <span className="text-sm">{niche}</span>
                                {contentNiche === niche && (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                )}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </TabsContent>
                      <TabsContent value="custom" className="space-y-4 pt-4">
                        <Input 
                          placeholder="Enter your custom niche..." 
                          value={customNiche}
                          onChange={(e) => setCustomNiche(e.target.value)}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base">Posting Frequency</Label>
                    <RadioGroup
                      value={postingFrequency}
                      onValueChange={setPostingFrequency}
                      className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {postingFrequencies.map((frequency) => (
                        <div 
                          key={frequency}
                          className={`flex items-center space-x-2 rounded-lg border p-3 ${postingFrequency === frequency ? "border-primary bg-primary/5" : "border-border"}`}
                        >
                          <RadioGroupItem value={frequency} id={`freq-${frequency}`} className="sr-only" />
                          <label htmlFor={`freq-${frequency}`} className="flex flex-1 cursor-pointer items-center justify-between">
                            <span className="text-sm">{frequency}</span>
                            {postingFrequency === frequency && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {accountType === "ecommerce" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Business Information</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Niche</Label>
                  <Input 
                    placeholder="What products do you sell?" 
                    value={productNiche}
                    onChange={(e) => setProductNiche(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input 
                    placeholder="Who is your target customer?" 
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input 
                    placeholder="Your store or brand name" 
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {accountType === "business" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Business Information</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Business Niche</Label>
                  <Input 
                    placeholder="Your industry or niche" 
                    value={businessNiche}
                    onChange={(e) => setBusinessNiche(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input 
                    placeholder="Who are your ideal clients?" 
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Business Description</Label>
                  <Textarea 
                    placeholder="Briefly describe your business and what you offer"
                    className="resize-none" 
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(accountType === "ecommerce" || accountType === "business" || accountType === "personal") && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Platform & Content Settings</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Posting Platforms</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {platformOptions.map(platform => (
                      <div key={platform} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`platform-${platform}`}
                          checked={postingPlatforms.includes(platform)}
                          onCheckedChange={() => handlePlatformToggle(platform)}
                        />
                        <Label htmlFor={`platform-${platform}`} className="text-sm">{platform}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Content Style</Label>
                  <Textarea
                    placeholder="Describe your content style and voice"
                    value={contentStyle}
                    onChange={(e) => setContentStyle(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Switch 
                    id="enable-optimization" 
                    checked={enableOptimization}
                    onCheckedChange={setEnableOptimization}
                  />
                  <Label htmlFor="enable-optimization">Enable idea optimization based on my profile</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveProfile} 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsProfile;

