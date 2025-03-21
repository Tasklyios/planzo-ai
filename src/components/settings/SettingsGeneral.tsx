
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Key, 
  Save, 
  Lock,
  Edit,
  AlertTriangle
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const emailChangeSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
});

const SettingsGeneral = () => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailPopoverOpen, setEmailPopoverOpen] = useState(false);

  // Email change form
  const emailChangeForm = useForm({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        setEmail(user.email || "");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setFirstName(profileData.first_name || "");
          setLastName(profileData.last_name || "");
        }
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateName = async () => {
    if (!user) return;

    setIsUpdatingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your name has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangeEmail = async (data) => {
    if (!user) return;
    
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: data.newEmail,
      });

      if (error) throw error;

      setEmailPopoverOpen(false);
      emailChangeForm.reset();
      
      toast({
        title: "Email change requested",
        description: "Please check your new email inbox for a confirmation link.",
      });
    } catch (error) {
      console.error("Error updating email:", error);
      toast({
        variant: "destructive",
        title: "Error updating email",
        description: error.message,
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <div className="space-y-8 w-full">
      <Card className="p-6 border border-border/40 shadow-sm w-full">
        <div className="space-y-6 w-full">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-medium">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first-name" className="text-sm font-medium">First Name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="w-full transition-all focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name" className="text-sm font-medium">Last Name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                className="w-full transition-all focus:border-primary"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted w-full"
              />
              <Popover open={emailPopoverOpen} onOpenChange={setEmailPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">Change Email Address</h4>
                    </div>
                    
                    <Form {...emailChangeForm}>
                      <form onSubmit={emailChangeForm.handleSubmit(handleChangeEmail)} className="space-y-4">
                        <FormField
                          control={emailChangeForm.control}
                          name="newEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Email Address</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your new email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-amber-100 dark:bg-amber-950/40 p-3 rounded-md flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-amber-800 dark:text-amber-300">
                            You'll need to verify this email change by clicking on a confirmation link sent to your new email address.
                          </p>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEmailPopoverOpen(false);
                              emailChangeForm.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            size="sm"
                            disabled={isUpdatingEmail}
                          >
                            {isUpdatingEmail ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <Button
            onClick={handleUpdateName}
            disabled={isUpdatingName}
            className="mt-4 gap-2"
          >
            <Save size={16} />
            {isUpdatingName ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>
      
      <Card className="p-6 border border-border/40 shadow-sm w-full">
        <div className="space-y-4 w-full">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-medium">Password & Security</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Regularly updating your password helps maintain the security of your account.
            </p>
            <Button variant="outline" className="gap-2">
              <Key size={16} />
              Change Password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsGeneral;
