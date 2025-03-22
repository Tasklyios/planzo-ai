import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Save, User, Lock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const profileSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const SettingsGeneral = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setCurrentEmail(data.user.email);
        emailForm.setValue("email", data.user.email);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', data.user.id)
          .single();
          
        if (profileData) {
          setFirstName(profileData.first_name || '');
          setLastName(profileData.last_name || '');
          profileForm.setValue("firstName", profileData.first_name || '');
          profileForm.setValue("lastName", profileData.last_name || '');
        }
      }
    };
    getCurrentUser();
  }, []);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: currentEmail,
    },
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: firstName,
      lastName: lastName,
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmitEmail = async (values: z.infer<typeof emailSchema>) => {
    if (values.email === currentEmail) {
      toast({
        title: "No changes detected",
        description: "Your email is already set to this address.",
      });
      return;
    }

    setIsLoadingEmail(true);
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
      setIsLoadingEmail(false);
    }
  };

  const onSubmitProfile = async (values: z.infer<typeof profileSchema>) => {
    if (values.firstName === firstName && values.lastName === lastName) {
      toast({
        title: "No changes detected",
        description: "Your profile information is already up to date.",
      });
      return;
    }

    setIsLoadingProfile(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user?.id) throw new Error("User not found");
      
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: values.firstName,
          last_name: values.lastName
        })
        .eq('id', userData.user.id);
      
      if (error) throw error;
      
      setFirstName(values.firstName);
      setLastName(values.lastName);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const onSubmitPassword = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: values.newPassword 
      });
      
      if (error) throw error;
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update password",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ''
      );
      
      if (error) throw error;
      
      await supabase.auth.signOut();
      navigate('/auth');
      
      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete account",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsDeletingAccount(false);
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
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4 w-full">
              <FormField
                control={emailForm.control}
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
                disabled={isLoadingEmail || emailForm.getValues("email") === currentEmail}
              >
                {isLoadingEmail ? (
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

      <Card className="w-full border-border/40">
        <CardHeader>
          <CardTitle className="text-xl">Profile Information</CardTitle>
          <CardDescription>Update your name and profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4 w-full">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative w-full">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="First name" 
                            className="pl-10 w-full" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="relative w-full">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Last name" 
                            className="pl-10 w-full" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full md:w-auto" 
                disabled={isLoadingProfile || (profileForm.getValues("firstName") === firstName && profileForm.getValues("lastName") === lastName)}
              >
                {isLoadingProfile ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Update Profile
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="w-full border-border/40">
        <CardHeader>
          <CardTitle className="text-xl">Password Settings</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4 w-full">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative w-full">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10 w-full" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative w-full">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10 w-full" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative w-full">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10 w-full" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full md:w-auto" 
                disabled={isLoadingPassword}
              >
                {isLoadingPassword ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Update Password
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground border-t pt-4">
          <p>Note: For security reasons, you will be asked to sign in again after changing your password.</p>
        </CardFooter>
      </Card>

      <Card className="w-full border-border/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            Delete Account
          </CardTitle>
          <CardDescription>Permanently delete your account and all of your data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            This action cannot be undone. Once you delete your account, all of your data including ideas, scripts, and profile information will be permanently removed.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full md:w-auto"
              >
                <AlertTriangle className="h-4 w-4 mr-2" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  To confirm, type <span className="font-semibold">delete my account</span> below:
                </p>
                <Input 
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="delete my account"
                  className="mb-2"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => {
                    e.preventDefault();
                    if (deleteConfirmationText.toLowerCase() === "delete my account") {
                      handleDeleteAccount();
                    } else {
                      toast({
                        variant: "destructive",
                        title: "Confirmation failed",
                        description: "Please type 'delete my account' to confirm deletion."
                      });
                    }
                  }}
                  disabled={isDeletingAccount || deleteConfirmationText.toLowerCase() !== "delete my account"}
                >
                  {isDeletingAccount ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground border-t pt-4 flex flex-col items-start">
          <p className="mb-1">Before deleting your account, please consider:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Downloading any data you want to keep</li>
            <li>Cancelling any active subscriptions</li>
            <li>Contacting support if you're having issues with our service</li>
          </ul>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SettingsGeneral;
