import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog-onboarding";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package2, UserCircle, Building2, ArrowRight, ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const accountFormSchema = z.object({
  accountType: z.enum(["personal", "ecommerce", "business"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  contentNiche: z.string().optional(),
  productNiche: z.string().optional(),
  businessNiche: z.string().optional(),
  targetAudience: z.string().optional(),
  brandName: z.string().optional(),
  businessDescription: z.string().optional(),
  contentType: z.string().optional(),
  postingFrequency: z.string().optional(),
  customNiche: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

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

const contentTypes = [
  { value: "talking_head", label: "Talking Head Videos", description: "Face-to-camera content where you speak directly to your audience" },
  { value: "text_based", label: "Text-Overlay Videos", description: "Videos that primarily use text overlays with visuals or b-roll footage" },
  { value: "mixed", label: "Mixed Format", description: "Combination of talking head segments with text overlays and visual elements" }
];

interface OnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const Onboarding = ({ open, onOpenChange, onComplete }: OnboardingProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomNiche, setIsCustomNiche] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountType: "personal",
      firstName: "",
      lastName: "",
      contentNiche: "",
      productNiche: "",
      businessNiche: "",
      targetAudience: "",
      brandName: "",
      businessDescription: "",
      contentType: "",
      postingFrequency: "",
      customNiche: "",
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUserId(session.user.id);
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
            
          if (profile) {
            const accountType = profile.account_type || "personal";
            if (accountType === "personal" || accountType === "ecommerce" || accountType === "business") {
              form.setValue("accountType", accountType as "personal" | "ecommerce" | "business");
            } else {
              form.setValue("accountType", "personal");
            }
            
            form.setValue("firstName", profile.first_name || "");
            form.setValue("lastName", profile.last_name || "");
            form.setValue("contentNiche", profile.content_niche || "");
            form.setValue("productNiche", profile.product_niche || "");
            form.setValue("businessNiche", profile.business_niche || "");
            form.setValue("targetAudience", profile.target_audience || "");
            form.setValue("brandName", profile.brand_name || "");
            form.setValue("businessDescription", profile.business_description || "");
            form.setValue("contentType", profile.content_type || "");
            form.setValue("postingFrequency", profile.posting_frequency || "");
            
            if (profile.content_niche && !contentNiches.includes(profile.content_niche)) {
              setIsCustomNiche(true);
              form.setValue("customNiche", profile.content_niche);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [form]);

  const updateProfileField = async (field: string, value: string) => {
    if (!userId || !value) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", userId);
        
      if (error) throw error;
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handleNameChange = async (field: "firstName" | "lastName", value: string) => {
    const supabaseField = field === "firstName" ? "first_name" : "last_name";
    await updateProfileField(supabaseField, value);
  };

  const onSubmit = async (data: AccountFormValues) => {
    if (!userId) return;
    
    setIsSubmitting(true);
    try {
      let nicheField = "";
      if (data.accountType === "personal") {
        nicheField = isCustomNiche ? data.customNiche || "" : data.contentNiche || "";
      } else if (data.accountType === "ecommerce") {
        nicheField = data.productNiche || "";
      } else {
        nicheField = data.businessNiche || "";
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({
          account_type: data.accountType,
          content_niche: data.accountType === "personal" ? nicheField : data.contentNiche,
          product_niche: data.accountType === "ecommerce" ? nicheField : data.productNiche,
          business_niche: data.accountType === "business" ? nicheField : data.businessNiche,
          target_audience: data.targetAudience,
          brand_name: data.brandName,
          business_description: data.businessDescription,
          onboarding_completed: true,
          content_type: data.contentType,
          posting_frequency: data.postingFrequency,
          first_name: data.firstName,
          last_name: data.lastName,
        })
        .eq("id", userId);

      if (error) throw error;
      
      toast({
        title: "Profile updated!",
        description: "Your account has been set up successfully.",
      });
      
      onComplete();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step < getMaxSteps()) {
      setStep(step + 1);
    } else {
      form.handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getMaxSteps = () => {
    const accountType = form.getValues("accountType");
    if (accountType === "personal") return 5;
    if (accountType === "ecommerce") return 4;
    return 4;
  };

  const getProgressPercentage = () => {
    return (step / getMaxSteps()) * 100;
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="accountType"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-base font-semibold">What type of account are you creating?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 gap-4 pt-2"
              >
                <div className={`flex items-center space-x-2 rounded-lg border p-4 ${field.value === "personal" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="personal" id="personal" className="sr-only" />
                  <label htmlFor="personal" className="flex flex-1 cursor-pointer items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <UserCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Personal Brand</p>
                        <p className="text-sm text-muted-foreground">
                          For creators, influencers, and personal accounts
                        </p>
                      </div>
                    </div>
                    {field.value === "personal" && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </label>
                </div>

                <div className={`flex items-center space-x-2 rounded-lg border p-4 ${field.value === "ecommerce" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="ecommerce" id="ecommerce" className="sr-only" />
                  <label htmlFor="ecommerce" className="flex flex-1 cursor-pointer items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Package2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">E-commerce</p>
                        <p className="text-sm text-muted-foreground">
                          For online stores and product-based businesses
                        </p>
                      </div>
                    </div>
                    {field.value === "ecommerce" && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </label>
                </div>

                <div className={`flex items-center space-x-2 rounded-lg border p-4 ${field.value === "business" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="business" id="business" className="sr-only" />
                  <label htmlFor="business" className="flex flex-1 cursor-pointer items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Business</p>
                        <p className="text-sm text-muted-foreground">
                          For service providers, agencies, and companies
                        </p>
                      </div>
                    </div>
                    {field.value === "business" && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderNameStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-2">Tell us your name</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This will be used to personalize your experience
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="First Name" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    handleNameChange("firstName", e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Last Name" 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleNameChange("lastName", e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderPersonalStep3 = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="contentType"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-base font-semibold">What type of content do you want to post?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 gap-4 pt-2"
              >
                {contentTypes.map((type) => (
                  <div 
                    key={type.value}
                    className={`flex items-center space-x-2 rounded-lg border p-4 ${field.value === type.value ? "border-primary bg-primary/5" : "border-border"}`}
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
                      {field.value === type.value && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderPersonalStep4 = () => (
    <div className="space-y-4">
      <div className="space-y-4">
        <FormLabel className="text-base font-semibold">What niche is your account?</FormLabel>
        
        <Tabs defaultValue={isCustomNiche ? "custom" : "predefined"} onValueChange={(value) => setIsCustomNiche(value === "custom")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predefined">Common Niches</TabsTrigger>
            <TabsTrigger value="custom">Custom Niche</TabsTrigger>
          </TabsList>
          <TabsContent value="predefined" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="contentNiche"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-2"
                    >
                      {contentNiches.map((niche) => (
                        <div key={niche} className={`flex items-center space-x-2 rounded-lg border p-3 ${field.value === niche ? "border-primary bg-primary/5" : "border-border"}`}>
                          <RadioGroupItem value={niche} id={`niche-${niche}`} className="sr-only" />
                          <label htmlFor={`niche-${niche}`} className="flex flex-1 cursor-pointer items-center justify-between">
                            <span className="text-sm">{niche}</span>
                            {field.value === niche && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="custom" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="customNiche"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Enter your custom niche..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  const renderPersonalStep5 = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="postingFrequency"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-base font-semibold">How often do you want to post on your account?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 gap-3 pt-2"
              >
                {postingFrequencies.map((frequency) => (
                  <div 
                    key={frequency}
                    className={`flex items-center space-x-2 rounded-lg border p-3 ${field.value === frequency ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <RadioGroupItem value={frequency} id={`freq-${frequency}`} className="sr-only" />
                    <label htmlFor={`freq-${frequency}`} className="flex flex-1 cursor-pointer items-center justify-between">
                      <span className="text-sm">{frequency}</span>
                      {field.value === frequency && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderEcommerceStep3 = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="productNiche"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Niche</FormLabel>
            <FormControl>
              <Input placeholder="What products do you sell?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="targetAudience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Audience</FormLabel>
            <FormControl>
              <Input placeholder="Who is your target customer?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="brandName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand Name</FormLabel>
            <FormControl>
              <Input placeholder="Your store or brand name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderBusinessStep3 = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="businessNiche"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Niche</FormLabel>
            <FormControl>
              <Input placeholder="Your industry or niche" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="targetAudience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Audience</FormLabel>
            <FormControl>
              <Input placeholder="Who are your ideal clients?" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="businessDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Briefly describe your business and what you offer"
                className="resize-none" 
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep = () => {
    const accountType = form.getValues("accountType");
    
    if (step === 1) return renderStep1();
    if (step === 2) return renderNameStep();
    
    if (accountType === "personal") {
      if (step === 3) return renderPersonalStep3();
      if (step === 4) return renderPersonalStep4();
      if (step === 5) return renderPersonalStep5();
    } else if (accountType === "ecommerce") {
      if (step === 3) return renderEcommerceStep3();
    } else if (accountType === "business") {
      if (step === 3) return renderBusinessStep3();
    }
    
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[500px]">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Set up your account</DialogTitle>
            <DialogDescription>
              Tell us about yourself so we can provide the best experience for you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4 space-y-2 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Step {step} of {getMaxSteps()}
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStep()}
            </form>
          </Form>
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6">
            {step > 1 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                disabled={isSubmitting}
                className="mt-2 sm:mt-0"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <div className={step === 1 ? "w-full flex justify-end" : ""}>
              <Button 
                type="button" 
                onClick={nextStep}
                disabled={isSubmitting}
                className="group"
              >
                {step < getMaxSteps() ? (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
                  </>
                ) : (
                  isSubmitting ? 'Saving...' : 'Complete'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Onboarding;
