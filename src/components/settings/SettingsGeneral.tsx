import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Save } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const SettingsGeneral = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");

  // Get current user and email
  useState(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setCurrentEmail(data.user.email);
        form.setValue("email", data.user.email);
      }
    };
    getCurrentUser();
  }, []);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: currentEmail,
    },
  });

  const onSubmit = async (values: z.infer<typeof emailSchema>) => {
    if (values.email === currentEmail) {
      toast({
        title: "No changes detected",
        description: "Your email is already set to this address.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: values.email });
      
      if (error) throw error;
      
      toast({
        title: "Verification email sent",
        description: "Please check your new email inbox to confirm the change.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update email",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full border-border/40">
        <CardHeader>
          <CardTitle className="text-xl">Email Settings</CardTitle>
          <CardDescription>Update your email address</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="flex items-center w-full">
                        <div className="relative w-full">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="your@email.com" 
                            className="pl-10 w-full" 
                            {...field} 
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full md:w-auto" 
                disabled={isLoading || form.getValues("email") === currentEmail}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Update Email
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground border-t pt-4">
          <p>Note: You will receive a verification email to confirm this change.</p>
        </CardFooter>
      </Card>

      {/* Add additional general settings sections here */}
      <Card className="w-full border-border/40">
        <CardHeader>
          <CardTitle className="text-xl">Account Preferences</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Additional account settings will be available here in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsGeneral;
