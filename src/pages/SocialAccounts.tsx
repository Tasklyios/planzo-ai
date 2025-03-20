
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  PlusCircle, 
  Trash2, 
  Pencil, 
  MoreVertical,
  Check,
  X,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  TikTok,
  Globe
} from "lucide-react";
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";

// Define schema for the form
const socialAccountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  platform: z.string().min(1, "Platform is required"),
  avatar_url: z.string().optional(),
});

type SocialAccount = {
  id: string;
  name: string;
  platform: string;
  avatar_url?: string;
  is_active: boolean;
  user_id: string;
};

type FormValues = z.infer<typeof socialAccountSchema>;

const SocialAccounts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Fetch social accounts
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      const { data } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_active', { ascending: false });
        
      return data as SocialAccount[] || [];
    },
  });

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(socialAccountSchema),
    defaultValues: {
      name: "",
      platform: "",
      avatar_url: "",
    },
  });

  // Reset form when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      form.reset({
        name: selectedAccount.name,
        platform: selectedAccount.platform,
        avatar_url: selectedAccount.avatar_url || "",
      });
    } else {
      form.reset({
        name: "",
        platform: "",
        avatar_url: "",
      });
    }
  }, [selectedAccount, form]);

  const handleCreateAccount = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user can add more accounts
      const maxAccounts = subscription === 'business' ? 4 : (subscription === 'plus' ? 3 : (subscription === 'pro' ? 2 : 0));
      
      if (accounts && accounts.length >= maxAccounts) {
        toast({
          title: "Account limit reached",
          description: `Your plan allows a maximum of ${maxAccounts} social accounts.`,
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      // Set all existing accounts as inactive if this is the first account
      if (!accounts || accounts.length === 0) {
        values.is_active = true;
      }

      // Insert the new account
      const { data, error } = await supabase
        .from('social_accounts')
        .insert({
          user_id: user.id,
          name: values.name,
          platform: values.platform,
          avatar_url: values.avatar_url || null,
          is_active: !accounts || accounts.length === 0, // First account is active by default
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Account created",
        description: "Your social account has been created successfully.",
      });

      refetchAccounts();
      setIsCreating(false);
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

  const handleUpdateAccount = async (values: FormValues) => {
    if (!selectedAccount) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('social_accounts')
        .update({
          name: values.name,
          platform: values.platform,
          avatar_url: values.avatar_url || null,
        })
        .eq('id', selectedAccount.id);

      if (error) throw error;

      toast({
        title: "Account updated",
        description: "Your social account has been updated successfully.",
      });

      refetchAccounts();
      setIsEditing(false);
      setSelectedAccount(null);
    } catch (error: any) {
      console.error("Error updating account:", error);
      toast({
        title: "Error updating account",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', selectedAccount.id);

      if (error) throw error;

      // If we deleted the active account, set the first remaining account as active
      if (selectedAccount.is_active && accounts && accounts.length > 1) {
        const accountsWithoutDeleted = accounts.filter(a => a.id !== selectedAccount.id);
        if (accountsWithoutDeleted.length > 0) {
          await supabase
            .from('social_accounts')
            .update({ is_active: true })
            .eq('id', accountsWithoutDeleted[0].id);
        }
      }

      toast({
        title: "Account deleted",
        description: "Your social account has been deleted successfully.",
      });

      refetchAccounts();
      setIsDeleting(false);
      setSelectedAccount(null);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error deleting account",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActive = async (account: SocialAccount) => {
    if (account.is_active) return; // Already active
    
    setIsLoading(true);
    try {
      // Deactivate all accounts
      await supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('user_id', account.user_id);
      
      // Activate selected account
      await supabase
        .from('social_accounts')
        .update({ is_active: true })
        .eq('id', account.id);
      
      toast({
        title: "Account activated",
        description: `You are now using ${account.name} as your active account.`,
      });

      refetchAccounts();
    } catch (error: any) {
      console.error("Error setting active account:", error);
      toast({
        title: "Error activating account",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'twitter':
      case 'x':
        return <Twitter className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'tiktok':
        return <TikTok className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  // Check if can add more accounts
  const canAddMoreAccounts = () => {
    if (!accounts || !subscription) return false;
    
    const maxAccounts = 
      subscription === 'business' ? 4 : 
      subscription === 'plus' ? 3 :
      subscription === 'pro' ? 2 : 0;
    
    return accounts.length < maxAccounts;
  };

  // Get account limit message
  const getAccountLimitMessage = () => {
    if (!subscription) return '';
    
    const maxAccounts = 
      subscription === 'business' ? 4 : 
      subscription === 'plus' ? 3 :
      subscription === 'pro' ? 2 : 0;
    
    return `Your ${subscription} plan allows ${maxAccounts} social account${maxAccounts !== 1 ? 's' : ''}.`;
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Social Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your social media accounts
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)} 
          disabled={!canAddMoreAccounts() || isLoading}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {accountsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : accounts && accounts.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {getAccountLimitMessage()} Accounts share the same usage limits.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className={account.is_active ? "border-primary shadow-sm" : "shadow-sm"}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={account.avatar_url} alt={account.name} />
                        <AvatarFallback>{account.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium">{account.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          {getPlatformIcon(account.platform)}
                          <span className="ml-1 capitalize">{account.platform}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsEditing(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsDeleting(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {account.is_active && (
                    <Badge variant="outline" className="mt-2 bg-primary/10 border-primary/20 text-primary">
                      Active Account
                    </Badge>
                  )}
                </CardHeader>
                <CardFooter>
                  <Button 
                    variant={account.is_active ? "outline" : "default"}
                    className="w-full"
                    disabled={account.is_active || isLoading}
                    onClick={() => handleSetActive(account)}
                  >
                    {account.is_active ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Current Active Account
                      </>
                    ) : (
                      "Set as Active Account"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>No Social Accounts</CardTitle>
            <CardDescription>
              You don't have any social accounts yet. Add your first account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {getAccountLimitMessage()}
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setIsCreating(true)} 
              disabled={!canAddMoreAccounts() || isLoading}
              className="w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Account
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Create/Edit Account Dialog */}
      <Dialog open={isCreating || isEditing} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setIsEditing(false);
          setSelectedAccount(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Social Account" : "Add Social Account"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update your social account details below." 
                : "Add a new social account to manage content for different platforms."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(isEditing ? handleUpdateAccount : handleCreateAccount)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Personal Instagram" {...field} />
                    </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setSelectedAccount(null);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Account"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={(open) => {
        if (!open) {
          setIsDeleting(false);
          setSelectedAccount(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the account "{selectedAccount?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleting(false);
                setSelectedAccount(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocialAccounts;
