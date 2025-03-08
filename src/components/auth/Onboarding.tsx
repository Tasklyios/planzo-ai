
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          account_type: selectedType,
          content_personality: personality,
          content_style: contentStyle,
          onboarding_completed: true,
        })
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
                  Tell us about your content style
                </h1>
                <p className="text-dark/70">
                  This helps our AI understand your unique voice and create more personalized content ideas.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="personality">What's your content personality?</Label>
                  <Textarea
                    id="personality"
                    placeholder="E.g., Energetic and funny, Professional and educational, Casual and relatable..."
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">How would you describe your content style?</Label>
                  <Textarea
                    id="style"
                    placeholder="E.g., Tutorial-based with step-by-step instructions, Story-driven content with personal experiences, Quick tips and tricks with engaging visuals..."
                    value={contentStyle}
                    onChange={(e) => setContentStyle(e.target.value)}
                    className="min-h-[100px]"
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
