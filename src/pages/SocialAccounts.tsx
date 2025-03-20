
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useQueryClient } from "@tanstack/react-query";
import { SocialAccount } from "@/types/socialAccount";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Instagram,
  Youtube,
  Twitter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const SocialAccounts = () => {
  const { user } = useSupabaseUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxAccounts, setMaxAccounts] = useState(1);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [activatingAccountId, setActivatingAccountId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>("free");

  useEffect(() => {
    const fetchAccountsAndSubscription = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user subscription to determine max accounts
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (subscriptionError) {
          console.error("Error fetching subscription:", subscriptionError);
        } else if (subscriptionData) {
          setUserTier(subscriptionData.tier);
          
          // Set max accounts based on tier
          if (subscriptionData.tier === "business") {
            setMaxAccounts(4);
          } else if (subscriptionData.tier === "plus") {
            setMaxAccounts(3);
          } else if (subscriptionData.tier === "pro") {
            setMaxAccounts(2);
          } else {
            setMaxAccounts(1);
          }
        }
        
        // Fetch user's social accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from("social_accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        if (accountsError) {
          throw accountsError;
        }
        
        setAccounts(accountsData as SocialAccount[]);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching accounts",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccountsAndSubscription();
  }, [user, toast]);

  const handleCreateAccount = () => {
    if (accounts.length >= maxAccounts) {
      toast({
        variant: "destructive",
        title: "Account limit reached",
        description: `Your ${userTier} plan allows a maximum of ${maxAccounts} social account${maxAccounts > 1 ? 's' : ''}.`,
      });
      return;
    }
    
    navigate("/social-accounts/new");
  };

  const handleEditAccount = (id: string) => {
    navigate(`/social-accounts/new?edit=${id}`);
  };

  const getAccountIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'twitter':
      case 'x':
        return <Twitter className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteAccountId(id);
  };

  const cancelDelete = () => {
    setDeleteAccountId(null);
  };

  const deleteAccount = async () => {
    if (!deleteAccountId) return;
    
    setDeletingAccountId(deleteAccountId);
    
    try {
      // Check if this is the active account
      const accountToDelete = accounts.find(account => account.id === deleteAccountId);
      let needsActivation = false;
      
      // Delete the account
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("id", deleteAccountId);
      
      if (error) throw error;
      
      // If we deleted the active account, we need to activate another one
      if (accountToDelete?.is_active && accounts.length > 1) {
        needsActivation = true;
        
        // Find another account to activate
        const accountToActivate = accounts.find(account => account.id !== deleteAccountId);
        
        if (accountToActivate) {
          await setAccountAsActive(accountToActivate.id);
        }
      }
      
      // Remove the deleted account from local state
      setAccounts(prev => prev.filter(account => account.id !== deleteAccountId));
      
      toast({
        title: "Account deleted",
        description: needsActivation 
          ? "The active account was deleted. Another account has been set as active."
          : "The social account has been deleted.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting account",
        description: error.message,
      });
    } finally {
      setDeleteAccountId(null);
      setDeletingAccountId(null);
    }
  };

  const setAccountAsActive = async (id: string) => {
    if (!user) return;
    
    setActivatingAccountId(id);
    
    try {
      // Step 1: Set all accounts as inactive
      const { error: updateError } = await supabase
        .from("social_accounts")
        .update({ is_active: false })
        .eq("user_id", user.id);
      
      if (updateError) throw updateError;
      
      // Step 2: Set the selected account as active
      const { error: activateError } = await supabase
        .from("social_accounts")
        .update({ is_active: true })
        .eq("id", id);
      
      if (activateError) throw activateError;
      
      // Update local state
      setAccounts(prev => 
        prev.map(account => ({
          ...account,
          is_active: account.id === id
        }))
      );
      
      // Step 3: Call the edge function to invalidate queries
      const { error: invalidateError } = await supabase.functions.invoke("invalidate-queries", {
        method: "POST",
        body: { action: "switch_account" }
      });

      if (invalidateError) {
        console.error("Error invalidating queries:", invalidateError);
      }
      
      toast({
        title: "Account activated",
        description: "All content will now be associated with this account."
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error activating account",
        description: error.message,
      });
    } finally {
      setActivatingAccountId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Social Accounts</h1>
          <p className="text-muted-foreground">
            Manage your social accounts and switch between them.
          </p>
        </div>
        <Button onClick={handleCreateAccount} disabled={accounts.length >= maxAccounts}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>
      
      {accounts.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="pt-8 pb-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No accounts yet</h3>
            <p className="text-muted-foreground">
              Create your first social account to start generating content.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleCreateAccount}>
              <Plus className="mr-2 h-4 w-4" />
              Create Account
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <Card key={account.id} className={account.is_active ? "border-2 border-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={account.avatar_url || ""} alt={account.name} />
                        <AvatarFallback>
                          {getAccountIcon(account.platform)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <CardDescription>{account.platform}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditAccount(account.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDelete(account.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  {account.is_active ? (
                    <Badge variant="default" className="bg-primary">Active</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setAccountAsActive(account.id)}
                      disabled={!!activatingAccountId}
                    >
                      {activatingAccountId === account.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        <>Set as Active</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">About Social Accounts</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4">
                  Your current plan ({userTier}) allows you to create and manage up to {maxAccounts} social account{maxAccounts !== 1 ? 's' : ''}.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Free plan: 1 social account</li>
                  <li>Pro plan: 2 social accounts</li>
                  <li>Plus plan: 3 social accounts</li>
                  <li>Business plan: 4 social accounts</li>
                </ul>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    Content generation limits are shared across all accounts. When you set an
                    account as active, all new content will be associated with that account.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      <AlertDialog open={!!deleteAccountId} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this social account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingAccountId}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteAccount} 
              disabled={!!deletingAccountId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAccountId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SocialAccounts;
