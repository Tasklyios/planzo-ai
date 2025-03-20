
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BookOpen,
  Anchor, 
  CalendarIcon, 
  LayoutGrid,
  BookText,
  LogOut, 
  LightbulbIcon, 
  FileText, 
  User, 
  Bookmark,
  CreditCard,
  PaintBucket,
  ChevronsUpDown,
  Settings,
  Users,
  ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Logo } from "@/components/ui/logo";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar-new";
import { useEffect, useState } from "react";
import PricingSheet from "@/components/pricing/PricingSheet";
import {
  InfoCard,
  InfoCardContent,
  InfoCardTitle,
  InfoCardDescription,
  InfoCardMedia,
  InfoCardFooter,
  InfoCardDismiss,
  InfoCardAction,
} from "@/components/ui/info-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

interface SocialAccount {
  id: string;
  name: string;
  avatar_url?: string;
  platform: string;
  is_active: boolean;
}

interface AppSidebarProps {
  isMobile?: boolean;
  closeDrawer?: () => void;
}

const AppSidebarNew = ({ isMobile, closeDrawer }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountsSwitcherOpen, setAccountsSwitcherOpen] = useState(false);

  // Fetch user subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
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
  const { data: socialAccounts, isLoading: accountsLoading } = useQuery({
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

  // Get active account
  const activeAccount = socialAccounts?.find(account => account.is_active);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account."
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again."
      });
    }
    
    if (closeDrawer) {
      closeDrawer();
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (closeDrawer) {
      closeDrawer();
    }
    setAccountMenuOpen(false);
  };

  const handleSwitchAccount = async (accountId: string) => {
    try {
      // Deactivate all accounts
      await supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      // Activate selected account
      await supabase
        .from('social_accounts')
        .update({ is_active: true })
        .eq('id', accountId);
      
      // Refresh data
      await fetch('/api/invalidate-queries');
      
      toast({
        title: "Account switched",
        description: "You are now using a different social account."
      });
      
      // Close dropdown
      setAccountsSwitcherOpen(false);
    } catch (error) {
      console.error("Error switching account:", error);
      toast({
        variant: "destructive",
        title: "Error switching account",
        description: "There was a problem switching accounts. Please try again."
      });
    }
  };

  // Check if user can add more accounts
  const canAddMoreAccounts = () => {
    if (!socialAccounts || !subscription) return false;
    
    const currentCount = socialAccounts.length;
    if (subscription === 'pro' && currentCount < 2) return true;
    if (subscription === 'business' && currentCount < 4) return true;
    if (subscription === 'plus' && currentCount < 3) return true;
    
    return false;
  };

  // Define the menu categories and items
  const MENU_CATEGORIES = [
    {
      title: "OVERVIEW",
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-4 w-4" /> },
        { path: '/content-planner', label: 'Content Planner', icon: <BookText className="h-4 w-4" /> },
        { path: '/calendar', label: 'Calendar', icon: <CalendarIcon className="h-4 w-4" /> },
      ]
    },
    {
      title: "CREATE",
      items: [
        { path: '/idea-generator', label: 'Generate Ideas', icon: <LightbulbIcon className="h-4 w-4" /> },
        { path: '/script', label: 'Generate Scripts', icon: <FileText className="h-4 w-4" /> },
        { path: '/hooks', label: 'Generate Hooks', icon: <Anchor className="h-4 w-4" /> },
      ]
    },
    {
      title: "LIBRARY",
      items: [
        { path: '/ideas', label: 'Saved Ideas', icon: <LayoutGrid className="h-4 w-4" /> },
        { path: '/saved-hooks', label: 'Saved Hooks', icon: <Bookmark className="h-4 w-4" /> },
        { path: '/find-your-style', label: 'Content Style', icon: <PaintBucket className="h-4 w-4" /> },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-4 py-4 mb-1">
        <Link to="/" className="flex items-center" onClick={closeDrawer}>
          <Logo size="large" className="ml-[-4px]" />
        </Link>
      </div>
      
      {/* Account Switcher - Only show for pro/business users */}
      {(subscription === 'pro' || subscription === 'plus' || subscription === 'business') && (
        <div className="px-4 mb-4">
          <DropdownMenu open={accountsSwitcherOpen} onOpenChange={setAccountsSwitcherOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between text-left font-normal"
                disabled={accountsLoading || !socialAccounts?.length}
              >
                <div className="flex items-center gap-2 truncate">
                  {accountsLoading ? (
                    <Skeleton className="h-6 w-6 rounded-full" />
                  ) : activeAccount ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={activeAccount.avatar_url} alt={activeAccount.name} />
                      <AvatarFallback>{activeAccount.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="truncate">
                    {accountsLoading 
                      ? <Skeleton className="h-4 w-24" /> 
                      : activeAccount?.name || 'No accounts'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[240px]">
              {socialAccounts && socialAccounts.map(account => (
                <DropdownMenuItem 
                  key={account.id} 
                  onClick={() => handleSwitchAccount(account.id)}
                  className={cn("cursor-pointer gap-2", account.is_active && "bg-accent")}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={account.avatar_url} alt={account.name} />
                    <AvatarFallback>{account.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{account.name}</span>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => handleNavigation('/social-accounts')}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Manage accounts</span>
              </DropdownMenuItem>

              {canAddMoreAccounts() && (
                <DropdownMenuItem 
                  onClick={() => handleNavigation('/social-accounts/new')}
                  className="cursor-pointer"
                >
                  <span>+ Add new account</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <SidebarContent className="gap-0">
        {MENU_CATEGORIES.map((category) => (
          <SidebarGroup key={category.title} className="p-0 py-0.5">
            <SidebarGroupLabel className="h-6 px-4">{category.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0 px-2">
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      isActive={isActive(item.path)}
                      onClick={() => handleNavigation(item.path)}
                      className="py-1.5"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter>
        <InfoCard>
          <InfoCardContent>
            <InfoCardTitle>Upgrade Your Account</InfoCardTitle>
            <InfoCardDescription>
              Get access to all premium features and unlimited content generation.
            </InfoCardDescription>
            <InfoCardMedia
              media={[
                {
                  src: "/placeholder.svg",
                  alt: "Premium features"
                }
              ]}
              shrinkHeight={60}
              expandHeight={120}
            />
            <InfoCardFooter>
              <InfoCardDismiss>Dismiss</InfoCardDismiss>
              <InfoCardAction>
                <Button variant="link" className="p-0 h-auto text-xs underline">
                  <PricingSheet 
                    trigger={
                      <span>Upgrade now</span>
                    }
                  />
                </Button>
              </InfoCardAction>
            </InfoCardFooter>
          </InfoCardContent>
        </InfoCard>
        
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu open={accountMenuOpen} onOpenChange={setAccountMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-full justify-between gap-3 h-12 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">My Account</span>
                        <span className="text-xs text-muted-foreground">
                          Settings & Billing
                        </span>
                      </div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleNavigation('/account')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/billing')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  {(subscription === 'pro' || subscription === 'plus' || subscription === 'business') && (
                    <DropdownMenuItem onClick={() => handleNavigation('/social-accounts')}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Social Accounts</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </div>
  );
};

export default AppSidebarNew;
