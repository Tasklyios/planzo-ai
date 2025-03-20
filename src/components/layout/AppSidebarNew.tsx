
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { Sidebar, SidebarHeader, SidebarBody, SidebarFooter } from "@/components/ui/sidebar-new";
import { SidebarMenuSection, SidebarMenuItem } from "@/components/ui/sidebar-menu-section";
import { SocialAccount } from '@/types/socialAccount';
import { useToast } from '@/components/ui/use-toast';
import {
  Grid3X3,
  LayoutGrid,
  CalendarDays,
  FileText,
  MessageSquare,
  Lightbulb,
  Anchor,
  Film,
  BookmarkIcon,
  Paintbrush,
  CircleUser,
  CreditCard,
  LogOut,
  Instagram,
  Youtube,
  Tiktok,
  Settings,
  Plus,
  CheckCircle
} from 'lucide-react';
import { invalidateQueries } from '@/services/cacheService';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define props for the AppSidebarNew component
interface AppSidebarNewProps {
  isMobile?: boolean;
  closeDrawer?: () => void;
  className?: string;
}

const AppSidebarNew = ({ isMobile = false, closeDrawer, className }: AppSidebarNewProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState<SocialAccount | null>(null);

  // Fetch social accounts on component mount
  React.useEffect(() => {
    fetchSocialAccounts();
  }, [user]);

  const fetchSocialAccounts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSocialAccounts(data || []);
      
      // Set active account (either from localStorage or the first account)
      const savedActiveAccountId = localStorage.getItem('activeAccountId');
      if (savedActiveAccountId && data) {
        const savedAccount = data.find(acc => acc.id === savedActiveAccountId);
        if (savedAccount) {
          setActiveAccount(savedAccount);
        } else if (data.length > 0) {
          setActiveAccount(data[0]);
          localStorage.setItem('activeAccountId', data[0].id);
        }
      } else if (data && data.length > 0) {
        setActiveAccount(data[0]);
        localStorage.setItem('activeAccountId', data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching social accounts:', error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your social accounts. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const setAccountActive = async (account: SocialAccount) => {
    try {
      setActiveAccount(account);
      localStorage.setItem('activeAccountId', account.id);
      
      // Update other accounts to be inactive
      const { error } = await supabase
        .from('social_accounts')
        .update({ is_active: false })
        .eq('user_id', user?.id)
        .neq('id', account.id);
      
      if (error) throw error;
      
      // Set this account to active
      const { error: updateError } = await supabase
        .from('social_accounts')
        .update({ is_active: true })
        .eq('id', account.id);
      
      if (updateError) throw updateError;
      
      // Invalidate queries to update UI
      await invalidateQueries('social_accounts');
      
      toast({
        title: "Account Switched",
        description: `Now working with ${account.name}`,
      });
      
      // Reload social accounts
      fetchSocialAccounts();
      
      // Close drawer on mobile
      if (isMobile && closeDrawer) {
        closeDrawer();
      }
    } catch (error: any) {
      console.error('Error setting account active:', error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to switch accounts. Please try again.",
      });
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && closeDrawer) {
      closeDrawer();
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'tiktok':
        return <Tiktok className="h-5 w-5" />;
      default:
        return <CircleUser className="h-5 w-5" />;
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  return (
    <Sidebar className={className}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="relative">
            {activeAccount ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activeAccount.avatar_url || undefined} alt={activeAccount.name} />
                      <AvatarFallback>
                        {getPlatformIcon(activeAccount.platform)}
                      </AvatarFallback>
                    </Avatar>
                    {activeAccount.is_active && (
                      <CheckCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {socialAccounts.map((account) => (
                    <DropdownMenuItem 
                      key={account.id}
                      onClick={() => setAccountActive(account)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={account.avatar_url || undefined} alt={account.name} />
                          <AvatarFallback>
                            {getPlatformIcon(account.platform)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{account.name}</span>
                        {account.id === activeAccount.id && (
                          <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation('/social-accounts/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add New Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/social-accounts')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Manage Accounts</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-full p-0"
                onClick={() => handleNavigation('/social-accounts/new')}
              >
                <Plus className="h-6 w-6" />
              </Button>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {activeAccount ? activeAccount.name : 'Add Account'}
            </span>
            <span className="text-xs text-muted-foreground">
              {activeAccount ? activeAccount.platform : 'Get Started'}
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarBody>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <SidebarMenuSection title="Overview">
            <SidebarMenuItem 
              icon={<Grid3X3 />}
              text="Dashboard"
              href="/dashboard"
              active={location.pathname === '/dashboard'}
            />
            <SidebarMenuItem
              icon={<LayoutGrid />}
              text="Content Planner"
              href="/content-planner" 
              active={location.pathname === '/content-planner'}
            />
            <SidebarMenuItem
              icon={<CalendarDays />}
              text="Calendar"
              href="/calendar"
              active={location.pathname === '/calendar'}
            />
          </SidebarMenuSection>
          
          <SidebarMenuSection title="Create">
            <SidebarMenuItem
              icon={<Lightbulb />}
              text="Generate Ideas"
              href="/idea-generator"
              active={location.pathname === '/idea-generator'}
            />
            <SidebarMenuItem
              icon={<FileText />}
              text="Generate Scripts"
              href="/script"
              active={location.pathname === '/script'}
            />
            <SidebarMenuItem
              icon={<Anchor />}
              text="Generate Hooks"
              href="/hooks"
              active={location.pathname === '/hooks'}
            />
          </SidebarMenuSection>
          
          <SidebarMenuSection title="Library">
            <SidebarMenuItem
              text="Saved Ideas"
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
        
          <SidebarMenuSection title="Social Accounts">
            {socialAccounts.length === 0 && !loading ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                <p>No accounts added yet.</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm" 
                  onClick={() => handleNavigation('/social-accounts/new')}
                >
                  Add your first account
                </Button>
              </div>
            ) : (
              socialAccounts.map((account) => (
                <SidebarMenuItem
                  key={account.id}
                  icon={getPlatformIcon(account.platform)}
                  text={account.name}
                  href="#"
                  active={activeAccount?.id === account.id}
                />
              ))
            )}
            <SidebarMenuItem
              icon={<Settings />}
              text="Manage Accounts"
              href="/social-accounts"
              active={location.pathname === '/social-accounts'}
            />
          </SidebarMenuSection>
        </ScrollArea>
      </SidebarBody>
      
      <SidebarFooter>
        <div className="flex flex-col gap-2 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleNavigation('/account')}>
                <CircleUser className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleNavigation('/billing')}>
                <CreditCard className="h-5 w-5" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebarNew;
