
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
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
  const [personality, setPersonality] = useState('');
  const [contentStyle, setContentStyle] = useState('');
  const [inspirationSources, setInspirationSources] = useState('');
  const [brandName, setBrandName] = useState('');
  
  // Common fields for all account types
  const [contentNiche, setContentNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      // Base profile data common to all account types
      const profileData: Record<string, any> = {
        account_type: selectedType,
        content_personality: personality,
        content_style: contentStyle,
        inspiration_sources: inspirationSources,
        content_niche: contentNiche,
        target_audience: targetAudience,
        posting_platforms: selectedPlatforms,
        brand_name: brandName,
        onboarding_completed: true,
      };

      // Add specific fields based on account type
      if (selectedType === 'business') {
        profileData.business_description = businessDescription;
        profileData.business_niche = businessNiche;
      } else if (selectedType === 'ecommerce') {
        profileData.product_niche = productNiche;
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

  const renderAccountTypeSpecificFields = () => {
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
              />
            </div>
          </>
        );
      case 'business':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="businessDescription">Tell us what your business does</Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe your business and its main offerings"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessNiche">Business Niche</Label>
              <Input
                id="businessNiche"
                placeholder="E.g., SaaS, Consulting, Retail, etc."
                value={businessNiche}
                onChange={(e) => setBusinessNiche(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentNiche">Content Niche</Label>
              <Input
                id="contentNiche"
                placeholder="What topics will your content focus on?"
                value={contentNiche}
                onChange={(e) => setContentNiche(e.target.value)}
              />
            </div>
          </>
        );
      case 'ecommerce':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="productNiche">What do you sell?</Label>
              <Input
                id="productNiche"
                placeholder="Describe your products or product categories"
                value={productNiche}
                onChange={(e) => setProductNiche(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentNiche">Content Niche</Label>
              <Input
                id="contentNiche"
                placeholder="What topics will your content focus on?"
                value={contentNiche}
                onChange={(e) => setContentNiche(e.target.value)}
              />
            </div>
          </>
        );
      default:
        return null;
    }
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
                  disabled={loading}
                >
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-dark mb-2">
                  Tell us about your content
                </h1>
                <p className="text-dark/70">
                  This helps our AI understand your unique voice and create more personalized content ideas.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand or Channel Name</Label>
                  <Input
                    id="brandName"
                    placeholder="Enter your brand or channel name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </div>
                
                {/* Render fields specific to the selected account type */}
                {renderAccountTypeSpecificFields()}

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    placeholder="Who is your content for? (e.g., 25-34 year-old fitness enthusiasts)"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
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

                <div className="space-y-2">
                  <Label htmlFor="personality">What's your content personality?</Label>
                  <Textarea
                    id="personality"
                    placeholder="E.g., Energetic and funny, Professional and educational, Casual and relatable..."
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="min-h-[80px]"
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inspiration">What sources inspire your content?</Label>
                  <Textarea
                    id="inspiration"
                    placeholder="E.g., Industry blogs, competitor channels, news sites, social media trends..."
                    value={inspirationSources}
                    onChange={(e) => setInspirationSources(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

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
