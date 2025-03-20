
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserCircle2, Package2, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the form schema with appropriate types
const profileFormSchema = z.object({
  accountType: z.enum(["personal", "ecommerce", "business"]),
  contentNiche: z.string().optional(),
  customNiche: z.string().optional(),
  productNiche: z.string().optional(),
  businessNiche: z.string().optional(),
  targetAudience: z.string().optional(),
  brandName: z.string().optional(),
  businessDescription: z.string().optional(),
  contentType: z.string().optional(),
  postingFrequency: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Predefined content niches
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

// Posting frequency options
const postingFrequencies = [
  "Daily",
  "3-5 times per week",
  "1-2 times per week",
  "A few times a month",
  "Monthly"
];

// Content type options
const contentTypes = [
  { value: "talking_head", label: "Talking Head Videos" },
  { value: "text_based", label: "Text-Overlay Videos" },
  { value: "mixed", label: "Mixed Format" }
];

const SettingsProfile = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCustomNiche, setIsCustomNiche] = useState(false);

  // Initialize form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      accountType: "personal",
      contentNiche: "",
      customNiche: "",
      productNiche: "",
      businessNiche: "",
      targetAudience: "",
      brandName: "",
      businessDescription: "",
      contentType: "",
      postingFrequency: "",
    },
  });

  const accountType = form.watch("accountType");

  // Fetch user data
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
            // Ensure accountType is properly validated as one of the allowed enum values
            const accountType = profile.account_type || "personal";
            if (accountType === "personal" || accountType === "ecommerce" || accountType === "business") {
              form.setValue("accountType", accountType as "personal" | "ecommerce" | "business");
            } else {
              form.setValue("accountType", "personal"); // Default to personal if invalid
            }
            
            form.setValue("contentNiche", profile.content_niche || "");
            form.setValue("productNiche", profile.product_niche || "");
            form.setValue("businessNiche", profile.business_niche || "");
            form.setValue("targetAudience", profile.target_audience || "");
            form.setValue("brandName", profile.brand_name || "");
            form.setValue("businessDescription", profile.business_description || "");
            form.setValue("contentType", profile.content_type || "");
            form.setValue("postingFrequency", profile.posting_frequency || "");
            
            // Check if the content niche is custom
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

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userId) return;
    
    setIsSubmitting(true);
    try {
      // Determine which niche field to use based on account type
      let contentNicheValue = "";
      if (data.accountType === "personal") {
        contentNicheValue = isCustomNiche ? data.customNiche || "" : data.contentNiche || "";
      }
      
      // Update profile in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          account_type: data.accountType,
          content_niche: data.accountType === "personal" ? contentNicheValue : data.contentNiche,
          product_niche: data.accountType === "ecommerce" ? data.productNiche : "",
          business_niche: data.accountType === "business" ? data.businessNiche : "",
          target_audience: data.targetAudience,
          brand_name: data.brandName,
          business_description: data.businessDescription,
          content_type: data.contentType,
          posting_frequency: data.postingFrequency,
        })
        .eq("id", userId);

      if (error) throw error;
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });
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

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Account Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className={`flex items-center rounded-lg border p-4 ${field.value === "personal" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value="personal" id="personal" className="sr-only" />
                      <label htmlFor="personal" className="flex flex-1 cursor-pointer items-center">
                        <UserCircle2 className="mr-3 h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Personal Brand</p>
                          <p className="text-xs text-muted-foreground">
                            For creators, influencers, and personal accounts
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className={`flex items-center rounded-lg border p-4 ${field.value === "ecommerce" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value="ecommerce" id="ecommerce" className="sr-only" />
                      <label htmlFor="ecommerce" className="flex flex-1 cursor-pointer items-center">
                        <Package2 className="mr-3 h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">E-commerce</p>
                          <p className="text-xs text-muted-foreground">
                            For online stores and product-based businesses
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className={`flex items-center rounded-lg border p-4 ${field.value === "business" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value="business" id="business" className="sr-only" />
                      <label htmlFor="business" className="flex flex-1 cursor-pointer items-center">
                        <Building2 className="mr-3 h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Business</p>
                          <p className="text-xs text-muted-foreground">
                            For service providers, agencies, and companies
                          </p>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Render appropriate fields based on account type */}
          {accountType === "personal" && (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Content Niche</FormLabel>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your content niche" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contentNiches.map((niche) => (
                                <SelectItem key={niche} value={niche}>
                                  {niche}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

              <FormField
                control={form.control}
                name="postingFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posting Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select posting frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {postingFrequencies.map((frequency) => (
                          <SelectItem key={frequency} value={frequency}>
                            {frequency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="Who is your target audience?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {accountType === "ecommerce" && (
            <div className="space-y-6">
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
          )}

          {accountType === "business" && (
            <div className="space-y-6">
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
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your business name" {...field} />
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
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SettingsProfile;
