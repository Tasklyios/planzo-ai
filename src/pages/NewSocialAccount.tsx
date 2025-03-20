
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";

// Define schema for the form
const socialAccountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  platform: z.string().min(1, "Platform is required"),
  avatar_url: z.string().optional(),
  make_active: z.boolean().default(false),
});

type FormValues = z.infer<typeof socialAccountSchema>;

const NewSocialAccount = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // Get user subscription
  const { data: subscription } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      const { data } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      return data?.tier || 'free';
    },
  });

  // Fetch social accounts to check limits
  const { data: accounts } = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      const { data } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', session.user.id);
        
      return data || [];
    },
  });

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(socialAccountSchema),
    defaultValues: {
      name: "",
      platform: "",
      avatar_url: "",
      make_active: false,
    },
  });

  // Watch avatar_url to update preview
  const avatarUrl = form.watch("avatar_url");
  useEffect(() => {
    setPreviewUrl(avatarUrl || "");
  }, [avatarUrl]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user can add more accounts
      const maxAccounts = subscription === 'business' ? 4 : (subscription === 'plus' ? 3 : (subscription === 'pro' ? 2 : 0));
      
      if (accounts && accounts.length >= maxAccounts) {
        toast({
          title: "Account limit reached",
          description: `Your ${subscription} plan allows a maximum of ${maxAccounts} social accounts.`,
          variant: "destructive",
        });
        navigate('/social-accounts');
        return;
      }

      // If making this account active, deactivate all other accounts
      if (values.make_active) {
        await supabase
          .from('social_accounts')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }
      
      // If this is the first account and make_active isn't explicitly set, make it active by default
      const shouldBeActive = values.make_active || (!accounts || accounts.length === 0);

      // Insert the new account
      const { data, error } = await supabase
        .from('social_accounts')
        .insert({
          user_id: user.id,
          name: values.name,
          platform: values.platform,
          avatar_url: values.avatar_url || null,
          is_active: shouldBeActive,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Account created",
        description: "Your social account has been created successfully.",
      });

      // Redirect back to accounts page
      navigate('/social-accounts');
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast({
        title: "Error creating account",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user doesn't have pro, plus, or business plan, redirect to accounts page
  useEffect(() => {
    if (subscription && subscription !== 'pro' && subscription !== 'plus' && subscription !== 'business') {
      toast({
        title: "Feature not available",
        description: "Multiple social accounts are only available for Pro, Plus, and Business plans.",
        variant: "destructive",
      });
      navigate('/social-accounts');
    }
  }, [subscription, navigate, toast]);

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate('/social-accounts')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Accounts
      </Button>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Add New Social Account</CardTitle>
          <CardDescription>
            Create a new social media account to manage content for different platforms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_150px] gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Personal Instagram" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your account a memorable name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the social media platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/avatar.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          Direct link to an image for this account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="make_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Make Active Account
                          </FormLabel>
                          <FormDescription>
                            Set this as your active account for content creation
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex flex-col items-center justify-start gap-4">
                  <Label>Avatar Preview</Label>
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={previewUrl} alt="Avatar preview" />
                    <AvatarFallback>
                      {form.getValues().name ? form.getValues().name.substring(0, 2).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <CardFooter className="px-0 pb-0 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/social-accounts')}
                  className="mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewSocialAccount;
