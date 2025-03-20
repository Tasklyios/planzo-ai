
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { SocialAccount } from "@/types/socialAccount";
import { cn } from "@/lib/utils";
import { SidebarMenu, SidebarMenuSection, SidebarMenuItem } from "@/components/ui/sidebar-new";
import { Button } from "@/components/ui/button";
import {
  Home,
  Calendar,
  BookText,
  Lightbulb,
  VideoIcon,
  Anchor,
  Settings,
  LogOut,
  Loader2,
  User,
  CreditCard,
  UserCog,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { invalidateQueries } from "@/services/cacheService";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const AppSidebarNew = ({ className }: { className?: string }) => {
  const { user } = useSupabaseUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeAccount, setActiveAccount] = useState<SocialAccount | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [switchingAccount, setSwitchingAccount] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true);
        
        const { data, error } = await supabase
          .from("social_accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          setAccounts(data as SocialAccount[]);
          
          // Find active account
          const active = data.find(acc => acc.is_active);
          setActiveAccount(active as SocialAccount || null);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoadingAccounts(false);
      }
    };
    
    fetchAccounts();
    
    // Subscribe to changes in the social_accounts table
    const channel = supabase
      .channel("social_accounts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "social_accounts",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  
  const switchAccount = async (accountId: string) => {
    if (!user || switchingAccount) return;
    
    setSwitchingAccount(accountId);
    
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
        .eq("id", accountId);
      
      if (activateError) throw activateError;
      
      // Step 3: Invalidate queries
      await invalidateQueries("switch_account");
      
      // Update local state
      setAccounts(prev => 
        prev.map(account => ({
          ...account,
          is_active: account.id === accountId
        }))
      );
      
      const newActiveAccount = accounts.find(acc => acc.id === accountId) || null;
      setActiveAccount(newActiveAccount);
      
      toast({
        title: "Account switched",
        description: "Now using " + (newActiveAccount?.name || "new account")
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error switching account",
        description: error.message,
      });
    } finally {
      setSwitchingAccount(null);
    }
  };

  return (
    <div className={cn("flex flex-col h-full py-2 px-2", className)}>
      <SidebarMenu>
        <SidebarMenuSection title="Overview">
          <SidebarMenuItem 
            icon={<Home />} 
            text="Dashboard" 
            href="/dashboard"
            active={location.pathname === '/dashboard'}
          />
          <SidebarMenuItem 
            icon={<Calendar />} 
            text="Calendar"
            href="/calendar"
            active={location.pathname === '/calendar'}
          />
          <SidebarMenuItem
            icon={<BookText />}
            text="Content Planner"
            href="/content-planner"
            active={location.pathname === '/content-planner'}
          />
        </SidebarMenuSection>
        
        <SidebarMenuSection title="Create">
          <SidebarMenuItem
            icon={<Lightbulb />}
            text="Idea Generator"
            href="/idea-generator"
            active={location.pathname === '/idea-generator'}
          />
          <SidebarMenuItem
            icon={<VideoIcon />}
            text="Script Generator"
            href="/script"
            active={location.pathname === '/script'}
          />
          <SidebarMenuItem
            icon={<Anchor />}
            text="Hook Generator"
            href="/hooks"
            active={location.pathname === '/hooks'}
          />
        </SidebarMenuSection>
        
        <SidebarMenuSection title="Library">
          <SidebarMenuItem
            text="Video Ideas"
            href="/ideas"
            active={location.pathname === '/ideas'}
          />
          <SidebarMenuItem
            text="Saved Hooks"
            href="/saved-hooks"
            active={location.pathname === '/saved-hooks'}
          />
          <SidebarMenuItem
            text="Content Style"
            href="/find-your-style"
            active={location.pathname === '/find-your-style'}
          />
        </SidebarMenuSection>
        
        {accounts.length > 0 && (
          <SidebarMenuSection title="Accounts">
            {loadingAccounts ? (
              <div className="px-2 py-1 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="px-2 py-1 mb-1">
                  {activeAccount ? (
                    <div className="flex items-center justify-between rounded-md px-3 py-2 bg-primary/10">
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={activeAccount.avatar_url || ""} />
                          <AvatarFallback>{activeAccount.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate max-w-[120px]">
                          {activeAccount.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs">Active</Badge>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground px-3 py-2">
                      No active account
                    </div>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between text-sm h-9 px-3"
                      disabled={accounts.length <= 1 || loadingAccounts}
                    >
                      <span>Switch Account</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Select an account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {accounts.map(account => (
                      <DropdownMenuItem
                        key={account.id}
                        className={cn(
                          "flex items-center cursor-pointer",
                          account.is_active && "bg-accent"
                        )}
                        disabled={account.is_active || !!switchingAccount}
                        onClick={() => switchAccount(account.id)}
                      >
                        <div className="flex items-center flex-1">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={account.avatar_url || ""} />
                            <AvatarFallback>{account.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{account.name}</span>
                        </div>
                        {switchingAccount === account.id && (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/social-accounts")}>
                      <span className="text-sm">Manage Accounts</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </SidebarMenuSection>
        )}
        
        <div className="mt-auto">
          <SidebarMenuSection>
            <SidebarMenuItem
              icon={<User />}
              text="Social Accounts"
              href="/social-accounts"
              active={location.pathname === '/social-accounts'}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-sm h-9 px-3">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/billing")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuSection>
        </div>
      </SidebarMenu>
    </div>
  );
};

export default AppSidebarNew;
