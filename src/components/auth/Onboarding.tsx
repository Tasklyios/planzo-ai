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

type AccountType = 'personal' | 'ecommerce' | 'business';

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
  const [contentNiche, setContentNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  // Business specific fields
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessNiche, setBusinessNiche] = useState('');
  
  // E-commerce specific
  const [productNiche, setProductNiche] = useState('');
  
  // Content personality fields (common for all account types, but asked after initial type-specific questions)
  const [personality, setPersonality] = useState('');
  const [contentStyle, setContentStyle] = useState('');
  const [inspirationSources, setInspirationSources] = useState('');
  
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      // Base profile data common to all account types
      const profileData: Record<string, any> = {
        account_type: selectedType,
        target_audience: targetAudience,
        posting_platforms: selectedPlatforms,
        brand_name: brandName,
        onboarding_completed: true,
      };

      // Add content personality fields in final step
      if (step === 3) {
        profileData.content_personality = personality;
        profileData.content_style = contentStyle;
      }

      // Add specific fields based on account type
      if (selectedType === 'personal') {
        profileData.content_niche = contentNiche;
      } else if (selectedType === 'business') {
        profileData.business_description = businessDescription;
        profileData.business_niche = businessNiche;
        profileData.content_niche = contentNiche;
      } else if (selectedType === 'ecommerce') {
        profileData.product_niche = productNiche;
        profileData.content_niche = contentNiche;
      }

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: "Welcome to TrendAI!",
        description: "Your preferences have been saved.",
      });

      onComplete();
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

  const handleStepChange = async (nextStep: number) => {
    // Only validate when moving to next step, not when going back
    if (nextStep > step) {
      // Validate step 2 based on account type
      if (step === 2) {
        if (selectedType === 'personal' && (!contentNiche || !targetAudience || selectedPlatforms.length === 0)) {
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

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case 'personal':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="contentNiche">Content Niche</Label>
              <Input
                id="contentNiche"
                placeholder="What topics do you create content about?"
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

  const renderContentPersonalityFields = () => {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="personality">What's your content personality?</Label>
          <Textarea
            id="personality"
            placeholder="E.g., Energetic and funny, Professional and educational, Casual and relatable..."
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="min-h-[80px]"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="style">How would you describe your content style?</Label>
          <Textarea
            id="style"
            placeholder="E.g., Tutorial-based with step-by-step instructions, Story-driven content with personal experiences, Quick tips and tricks with engaging visuals..."
            value={contentStyle}
            onChange={(e) => setContentStyle(e.target.value)}
            className="min-h-[80px]"
            required
          />
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <div className="p-8">
          {step === 1 ? (
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
          ) : step === 2 ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-dark mb-2">
                  Tell us about your {selectedType === 'personal' ? 'content' : selectedType === 'business' ? 'business' : 'e-commerce store'}
                </h1>
                <p className="text-dark/70">
                  Help us understand your {selectedType === 'personal' ? 'content focus' : selectedType === 'business' ? 'business needs' : 'e-commerce goals'}
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleStepChange(3); }} className="space-y-6">
                {renderTypeSpecificFields()}

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
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-dark mb-2">
                  Tell us about your content style
                </h1>
                <p className="text-dark/70">
                  This helps our AI understand your unique voice and create more personalized content ideas.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {renderContentPersonalityFields()}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="w-full"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-full"
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Onboarding;
