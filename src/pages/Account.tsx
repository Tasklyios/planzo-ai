import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Package2, UserCircle, Building2, LogOut, Mail, Key, CreditCard, Sun, Moon, Save } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import LinkSubscriptionDialog from "@/components/billing/LinkSubscriptionDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";

const contentNiches = [
  "Education",
  "Entertainment", 
  "Lifestyle",
  "Technology",
  "Fashion & Beauty",
  "Health & Fitness",
  "Other"
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

const profileFormSchema = z.object({
  accountType: z.enum(["personal", "ecommerce", "business"]),
  contentNiche: z.string().optional(),
  productNiche: z.string().optional(),
  businessNiche: z.string().optional(),
  contentType: z.string().optional(),
  postingFrequency: z.string().optional(),
  targetAudience: z.string().optional(),
  brandName: z.string().optional(),
  businessDescription: z.string().optional(),
  customNiche: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Account = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isCustomNiche, setIsCustomNiche] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const { theme, setTheme } = useTheme();
  const [userEmail, setUserEmail] = useState("");
  const [isResetEmailSent, setIsResetEmailSent] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isEmailChanging, setIsEmailChanging] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      accountType: "personal",
      contentNiche: "",
      productNiche: "",
      businessNiche: "",
      contentType: "",
      postingFrequency: "",
      targetAudience: "",
      brandName: "",
      businessDescription: "",
      customNiche: "",
    },
  });

  useEffect(() => {
    const getProfile = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/auth");
          return;
        }
        
        setUser(session.user);
        setUserEmail(session.user.email || "");
        setNewEmail(session.user.email || "");
        
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        if (profile) {
          const accountType = profile.account_type || "personal";
          if (accountType === "personal" || accountType === "ecommerce" || accountType === "business") {
            form.setValue("accountType", accountType as "personal" | "ecommerce" | "business");
          } else {
            form.setValue("accountType", "personal");
          }
          
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
        
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
          
        if (subscriptionError && subscriptionError.code !== "PGRST116") {
          throw subscriptionError;
        }
        
        setSubscription(subscriptionData || { tier: "free" });
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          variant: "destructive",
          title: "Error loading profile",
          description: "There was an error loading your profile information.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    getProfile();
  }, [navigate, toast, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      
      if (!user) return;
      
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
          content_type: data.contentType,
          posting_frequency: data.postingFrequency
        })
        .eq("id", user.id);
        
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const fetchSubscription = async () => {
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();
      
    if (subscriptionError && subscriptionError.code !== "PGRST116") {
      throw subscriptionError;
    }
    
    setSubscription(subscriptionData || { tier: "free" });
  };

  const handleSubscriptionLinked = () => {
    fetchSubscription();
    setShowLinkDialog(false);
  };

  const sendPasswordResetEmail = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      setIsResetEmailSent(true);
      
      toast({
        title: "Password reset link sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast({
        variant: "destructive",
        title: "Error sending reset email",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmail = async () => {
    if (!newEmail || newEmail === userEmail) {
      setIsEditingEmail(false);
      return;
    }

    try {
      setIsEmailChanging(true);
      
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;
      
      toast({
        title: "Email update initiated",
        description: "Check your new email for a confirmation link.",
      });
      
      setIsEditingEmail(false);
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast({
        variant: "destructive",
        title: "Error updating email",
        description: error.message,
      });
    } finally {
      setIsEmailChanging(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    toast({
      title: "Theme updated",
      description: `Theme changed to ${newTheme} mode.`,
    });
  };

  if (!user && !isLoading) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="container max-w-screen-lg py-6 lg:py-10">
      <div className="flex flex-col space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue="account">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>
          
          <Separator className="my-6" />
          
          <TabsContent value="account" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 w-1/3 bg-muted rounded"></div>
                <div className="h-10 w-full bg-muted rounded"></div>
                <div className="h-10 w-full bg-muted rounded"></div>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Email Address</CardTitle>
                    <CardDescription>
                      Your email address and account settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        {isEditingEmail ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <Input 
                              value={newEmail} 
                              onChange={(e) => setNewEmail(e.target.value)}
                              type="email"
                              placeholder="Enter new email"
                              className="max-w-xs"
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setIsEditingEmail(false)}
                              disabled={isEmailChanging}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={updateEmail}
                              disabled={isEmailChanging}
                            >
                              {isEmailChanging ? "Saving..." : <Save className="h-4 w-4" />}
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{userEmail}</p>
                            <p className="text-sm text-muted-foreground">Your account email</p>
                          </div>
                        )}
                      </div>
                      {!isEditingEmail && (
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditingEmail(true)}
                        >
                          Change Email
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                      Reset your account password.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Password Reset</p>
                          <p className="text-sm text-muted-foreground">Send a password reset link to your email</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={sendPasswordResetEmail}
                        disabled={isLoading || isResetEmailSent}
                      >
                        {isResetEmailSent ? "Email Sent" : "Reset Password"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Billing</CardTitle>
                    <CardDescription>
                      Manage your subscription and billing information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Current Plan</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription?.tier === "free" && "Free Plan"}
                            {subscription?.tier === "pro" && "Pro Plan"}
                            {subscription?.tier === "plus" && "Plus Plan"}
                            {subscription?.tier === "business" && "Business Plan"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {subscription?.tier === "free" && "Free"}
                            {subscription?.tier === "pro" && "$9.99/month"}
                            {subscription?.tier === "plus" && "$14.99/month"}
                            {subscription?.tier === "business" && "$39.99/month"}
                          </p>
                        </div>
                      </div>
                      {subscription?.current_period_end && subscription?.tier !== "free" && (
                        <div className="flex items-center">
                          <div className="text-sm text-muted-foreground">
                            Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 space-x-4">
                      <Button asChild>
                        <Link to="/billing">Manage Subscription</Link>
                      </Button>
                      {subscription?.tier === "free" && (
                        <Button variant="outline" onClick={() => setShowLinkDialog(true)}>
                          Link Existing Subscription
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize how the app looks and feels.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <Button 
                          variant={theme === "light" ? "default" : "outline"} 
                          className="flex flex-col items-center justify-center h-24 p-4"
                          onClick={() => handleThemeChange("light")}
                        >
                          <Sun className="h-8 w-8 mb-2" />
                          <span>Light</span>
                        </Button>
                        <Button 
                          variant={theme === "dark" ? "default" : "outline"} 
                          className="flex flex-col items-center justify-center h-24 p-4"
                          onClick={() => handleThemeChange("dark")}
                        >
                          <Moon className="h-8 w-8 mb-2" />
                          <span>Dark</span>
                        </Button>
                        <Button 
                          variant={theme === "system" ? "default" : "outline"} 
                          className="flex flex-col items-center justify-center h-24 p-4"
                          onClick={() => handleThemeChange("system")}
                        >
                          <div className="h-8 w-8 mb-2 flex items-center justify-center">
                            <Sun className="h-5 w-5 dark:hidden" />
                            <Moon className="h-5 w-5 hidden dark:block" />
                          </div>
                          <span>System</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sign Out</CardTitle>
                    <CardDescription>
                      Sign out of your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="profile" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 w-1/3 bg-muted rounded"></div>
                <div className="h-10 w-full bg-muted rounded"></div>
                <div className="h-10 w-full bg-muted rounded"></div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Type</CardTitle>
                      <CardDescription>
                        Change the type of account you have.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <FormField
                        control={form.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                              >
                                <div className={`flex items-center space-x-2 rounded-lg border p-4 ${field.value === "personal" ? "border-primary bg-primary/5" : "border-border"}`}>
                                  <RadioGroupItem value="personal" id="account-personal" className="sr-only" />
                                  <label htmlFor="account-personal" className="flex flex-1 cursor-pointer items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                        <UserCircle className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Personal Brand</p>
                                      </div>
                                    </div>
                                    {field.value === "personal" && (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    )}
                                  </label>
                                </div>

                                <div className={`flex items-center space-x-2 rounded-lg border p-4 ${field.value === "ecommerce" ? "border-primary bg-primary/5" : "border-border"}`}>
                                  <RadioGroupItem value="ecommerce" id="account-ecommerce" className="sr-only" />
                                  <label htmlFor="account-ecommerce" className="flex flex-1 cursor-pointer items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                        <Package2 className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">E-commerce</p>
                                      </div>
                                    </div>
                                    {field.value === "ecommerce" && (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    )}
                                  </label>
                                </div>

                                <div className={`flex items-center space-x-2 rounded-lg border p-4 ${field.value === "business" ? "border-primary bg-primary/5" : "border-border"}`}>
                                  <RadioGroupItem value="business" id="account-business" className="sr-only" />
                                  <label htmlFor="account-business" className="flex flex-1 cursor-pointer items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                        <Building2 className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Business</p>
                                      </div>
                                    </div>
                                    {field.value === "business" && (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    )}
                                  </label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {form.watch("accountType") === "personal" && (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Content Preferences</CardTitle>
                          <CardDescription>
                            Tell us about the content you want to create.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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

                          <div className="space-y-2">
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
                                            <SelectValue placeholder="Select a niche" />
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
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {form.watch("accountType") === "ecommerce" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>E-commerce Details</CardTitle>
                        <CardDescription>
                          Tell us about your online store.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                      </CardContent>
                    </Card>
                  )}

                  {form.watch("accountType") === "business" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Business Details</CardTitle>
                        <CardDescription>
                          Tell us about your business.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                      </CardContent>
                    </Card>
                  )}

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            )}
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-8 w-1/3 bg-muted rounded"></div>
                    <div className="h-10 w-full bg-muted rounded"></div>
                  </div>
                ) : (
                  <div>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Current Plan</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription?.tier === "free" && "Free Plan"}
                            {subscription?.tier === "pro" && "Pro Plan"}
                            {subscription?.tier === "plus" && "Plus Plan"}
                            {subscription?.tier === "business" && "Business Plan"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {subscription?.tier === "free" && "Free"}
                            {subscription?.tier === "pro" && "$9.99/month"}
                            {subscription?.tier === "plus" && "$14.99/month"}
                            {subscription?.tier === "business" && "$39.99/month"}
                          </p>
                        </div>
                      </div>
                      {subscription?.current_period_end && subscription?.tier !== "free" && (
                        <div className="flex items-center">
                          <div className="text-sm text-muted-foreground">
                            Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 space-x-4">
                      <Button asChild>
                        <Link to="/billing">Manage Subscription</Link>
                      </Button>
                      {subscription?.tier === "free" && (
                        <Button variant="outline" onClick={() => setShowLinkDialog(true)}>
                          Link Existing Subscription
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Manage your account settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {showLinkDialog && (
        <LinkSubscriptionDialog 
          onSuccess={handleSubscriptionLinked} 
        />
      )}
    </div>
  );
};

export default Account;

