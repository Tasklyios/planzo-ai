
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

type AccountType = 'personal' | 'ecommerce' | 'business';
type ContentType = 'talking_head' | 'text_based' | 'mixed';
type ContentNiche = 'Education' | 'Entertainment' | 'Lifestyle' | 'Technology' | 'Fashion & Beauty' | 'Health & Fitness' | 'Other' | string;
type PostingFrequency = 'daily' | 'multiple_times_a_week' | 'weekly' | 'monthly' | 'irregularly';

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

const contentTypes = [
  {
    value: 'talking_head',
    title: 'Talking Head Videos',
    description: 'Face-to-camera videos where you directly speak to your audience',
    imageUrl: '/images/talking_head.jpg'
  },
  {
    value: 'text_based',
    title: 'Text-Based Visual Content',
    description: 'Videos with animated text, graphics, and visuals with minimal on-camera presence',
    imageUrl: '/images/text_based.jpg'
  },
  {
    value: 'mixed',
    title: 'Mixed Content Approach',
    description: 'Combination of talking head segments with text-based visuals for variety',
    imageUrl: '/images/mixed_content.jpg'
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

const platformOptions = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'pinterest', label: 'Pinterest' },
];

interface OnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const Onboarding = ({ open, onOpenChange, onComplete }: OnboardingProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<AccountType>('personal');
  const [brandName, setBrandName] = useState('');
  
  // Personal brand specific fields
  const [contentNiche, setContentNiche] = useState<ContentNiche>('');
  const [customNiche, setCustomNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [contentType, setContentType] = useState<ContentType | ''>('');
  const [postingFrequency, setPostingFrequency] = useState<PostingFrequency | ''>('');
  
  // Business specific fields
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessNiche, setBusinessNiche] = useState('');
  
  // E-commerce specific
  const [productNiche, setProductNiche] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNextStep = () => {
    if (!selectedType) {
      toast({
        variant: "destructive",
        title: "Please select an account type",
      });
      return;
    }
    setStep(2);
  };

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatforms((current) => {
      if (current.includes(platform)) {
        return current.filter((p) => p !== platform);
      } else {
        return [...current, platform];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      // Combine niche fields correctly
      const finalContentNiche = contentNiche === 'Other' && customNiche 
        ? customNiche 
        : contentNiche;

      // Base profile data common to all account types
      const profileData: Record<string, any> = {
        account_type: selectedType,
        brand_name: brandName,
        target_audience: targetAudience,
        posting_platforms: selectedPlatforms,
        onboarding_completed: true,
      };

      // Add specific fields based on account type
      if (selectedType === 'personal') {
        profileData.content_niche = finalContentNiche;
        profileData.content_type = contentType;
        profileData.posting_frequency = postingFrequency;
      } else if (selectedType === 'business') {
        profileData.content_niche = finalContentNiche;
        profileData.business_niche = businessNiche;
        profileData.business_description = businessDescription;
      } else if (selectedType === 'ecommerce') {
        profileData.content_niche = finalContentNiche;
        profileData.product_niche = productNiche;
      }

      console.log("Saving profile data:", profileData);

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', session.user.id);

      if (error) throw error;

      // Update localStorage with correct values based on account type
      let nicheToStore = finalContentNiche || "";
      let videoTypeToStore = finalContentNiche || "";
      
      if (selectedType === 'business' && businessNiche) {
        nicheToStore = businessNiche;
        videoTypeToStore = businessNiche;
      } else if (selectedType === 'ecommerce' && productNiche) {
        nicheToStore = productNiche;
        videoTypeToStore = productNiche;
      }
      
      localStorage.setItem("niche", nicheToStore);
      localStorage.setItem("videoType", videoTypeToStore);
      localStorage.setItem("audience", targetAudience || "");
      if (selectedPlatforms?.length > 0) {
        localStorage.setItem("platform", selectedPlatforms[0]);
      }

      toast({
        title: "Welcome to TrendAI!",
        description: "Your preferences have been saved.",
      });

      onComplete();
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepChange = async (nextStep: number) => {
    // Only validate when moving to next step, not when going back
    if (nextStep > step) {
      // Validate step 2 based on account type
      if (step === 2 && selectedType === 'personal' && nextStep === 3) {
        if (!contentType) {
          toast({
            variant: "destructive",
            title: "Missing information",
            description: "Please select a content type",
          });
          return;
        }
      }
      
      // Validate final step based on account type before submission
      if (nextStep === 4) {
        if (selectedType === 'personal' && (!finalContentNiche() || !targetAudience || selectedPlatforms.length === 0 || !postingFrequency)) {
          toast({
            variant: "destructive",
            title: "Missing information",
            description: "Please fill out all required fields",
          });
          return;
        }
        
        if (selectedType === 'business' && (!businessDescription || !businessNiche || !contentNiche || !targetAudience || selectedPlatforms.length === 0)) {
          toast({
            variant: "destructive",
            title: "Missing information",
            description: "Please fill out all required fields",
          });
          return;
        }
        
        if (selectedType === 'ecommerce' && (!productNiche || !contentNiche || !targetAudience || selectedPlatforms.length === 0)) {
          toast({
            variant: "destructive",
            title: "Missing information",
            description: "Please fill out all required fields",
          });
          return;
        }
      }
    }
    
    setStep(nextStep);
  };

  const finalContentNiche = () => {
    return contentNiche === 'Other' && customNiche 
      ? customNiche 
      : contentNiche;
  };

  const renderContentTypeStep = () => {
    return (
      <>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-dark mb-2">
            What type of content do you want to create?
          </h1>
          <p className="text-dark/70">
            This helps us tailor your content ideas to your preferred format
          </p>
        </div>

        <div className="grid gap-6">
          {contentTypes.map((type) => (
            <Card 
              key={type.value} 
              className={`cursor-pointer relative overflow-hidden transition-all ${
                contentType === type.value 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setContentType(type.value as ContentType)}
            >
              <div className="absolute top-4 right-4 z-10">
                <RadioGroupItem 
                  value={type.value} 
                  id={`content-${type.value}`} 
                  checked={contentType === type.value}
                  className="h-6 w-6"
                />
              </div>
              <CardContent className="p-6 grid md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <div className="aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden">
                    {type.imageUrl ? (
                      <img 
                        src={type.imageUrl} 
                        alt={type.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">Image placeholder</div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-3">
                  <h3 className="font-semibold text-lg mb-2">{type.title}</h3>
                  <p className="text-muted-foreground text-sm">{type.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleStepChange(2)}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={() => handleStepChange(4)}
            disabled={!contentType}
          >
            Continue
          </Button>
        </div>
      </>
    );
  };

  const renderPersonalDetailsStep = () => {
    return (
      <>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-dark mb-2">
            Tell us about your content
          </h1>
          <p className="text-dark/70">
            Help us understand your content focus
          </p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="contentNiche">What niche is your account?</Label>
            <RadioGroup
              value={contentNiche}
              onValueChange={setContentNiche}
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
            
            {contentNiche === 'Other' && (
              <div className="mt-4">
                <Label htmlFor="customNiche">Specify your niche</Label>
                <Input
                  id="customNiche"
                  placeholder="Enter your custom niche"
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postingFrequency">How often do you want to post?</Label>
            <RadioGroup
              value={postingFrequency}
              onValueChange={setPostingFrequency as (value: string) => void}
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

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              placeholder="Who is your content for? (e.g., 25-34 year-old fitness enthusiasts)"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Posting Platforms</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {platformOptions.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={platform.id} 
                    checked={selectedPlatforms.includes(platform.id)} 
                    onCheckedChange={() => handlePlatformChange(platform.id)}
                  />
                  <Label 
                    htmlFor={platform.id} 
                    className="cursor-pointer"
                  >
                    {platform.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (selectedType === 'personal') {
                  handleStepChange(3); // Go back to content type step
                } else {
                  handleStepChange(2); // Go back to account type step
                }
              }}
            >
              Back
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </form>
      </>
    );
  };

  // Modified renderTypeSpecificFields to include the enhanced personal brand flow
  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case 'personal':
        return (
          <>
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-medium">What will your content focus on?</h3>
                <p className="text-muted-foreground mt-1">
                  This will help us generate more relevant ideas for your content
                </p>
              </div>
              
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => handleStepChange(3)}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        );
      case 'business':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description (what your business does)</Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe your business and its main offerings"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="min-h-[80px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessNiche">Business Niche</Label>
              <Input
                id="businessNiche"
                placeholder="E.g., SaaS, Consulting, Retail, etc."
                value={businessNiche}
                onChange={(e) => setBusinessNiche(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentNiche">Content Niche</Label>
              <Input
                id="contentNiche"
                placeholder="What topics will your content focus on?"
                value={contentNiche}
                onChange={(e) => setContentNiche(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                placeholder="Who is your content for? (e.g., 25-34 year-old fitness enthusiasts)"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Posting Platforms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {platformOptions.map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={platform.id} 
                      checked={selectedPlatforms.includes(platform.id)} 
                      onCheckedChange={() => handlePlatformChange(platform.id)}
                    />
                    <Label 
                      htmlFor={platform.id} 
                      className="cursor-pointer"
                    >
                      {platform.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case 'ecommerce':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="productNiche">Product Niche (what you sell)</Label>
              <Input
                id="productNiche"
                placeholder="Describe your products or product categories"
                value={productNiche}
                onChange={(e) => setProductNiche(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentNiche">Content Niche</Label>
              <Input
                id="contentNiche"
                placeholder="What topics will your content focus on?"
                value={contentNiche}
                onChange={(e) => setContentNiche(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                placeholder="Who is your content for? (e.g., 25-34 year-old fitness enthusiasts)"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Posting Platforms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {platformOptions.map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={platform.id} 
                      checked={selectedPlatforms.includes(platform.id)} 
                      onCheckedChange={() => handlePlatformChange(platform.id)}
                    />
                    <Label 
                      htmlFor={platform.id} 
                      className="cursor-pointer"
                    >
                      {platform.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Account Type Selection
        return (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-dark mb-2">
                Welcome to TrendAI
              </h1>
              <p className="text-dark/70">
                Let's personalize your experience. How will you be using TrendAI?
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-8">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand or Channel Name</Label>
                <Input
                  id="brandName"
                  placeholder="Enter your brand or channel name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              
              <RadioGroup
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as AccountType)}
                className="grid gap-4"
              >
                {accountTypes.map((type) => (
                  <div key={type.value} className="relative">
                    <RadioGroupItem
                      value={type.value}
                      id={type.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={type.value}
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !selectedType}
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </>
        );
      case 2: // Account Type Specific Step
        return (
          <div className="space-y-6">
            {renderTypeSpecificFields()}
            
            {selectedType !== 'personal' && (
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => handleStepChange(4)}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        );
      case 3: // Content Type Selection (Personal brand only)
        return renderContentTypeStep();
      case 4: // Final details step
        return renderPersonalDetailsStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <div className="p-8">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Onboarding;
