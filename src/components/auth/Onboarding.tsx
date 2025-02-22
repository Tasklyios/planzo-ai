
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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

const Onboarding = () => {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<AccountType>('personal');
  const navigate = useNavigate();
  const { toast } = useToast();

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
          onboarding_completed: true,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: "Welcome to TrendAI!",
        description: "Your preferences have been saved.",
      });

      navigate('/dashboard');
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
    <div className="min-h-screen bg-gradient-to-b from-light-bg to-light-bg-2 flex items-center justify-center p-4">
      <div className="max-w-xl w-full glass rounded-2xl p-8 shadow-xl fade-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-dark mb-2">
            Welcome to TrendAI
          </h1>
          <p className="text-dark/70">
            Let's personalize your experience. How will you be using TrendAI?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Continue to Dashboard"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
