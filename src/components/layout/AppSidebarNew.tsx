
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
  Settings
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
import { useState } from "react";
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

interface AppSidebarProps {
  isMobile?: boolean;
  closeDrawer?: () => void;
}

const AppSidebarNew = ({ isMobile, closeDrawer }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

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
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-popover border-border"
                >
                  <DropdownMenuItem onClick={() => handleNavigation('/account')} className="text-popover-foreground hover:bg-primary/10">
                    <User className="mr-2 h-4 w-4" />
                    <span>Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/settings')} className="text-popover-foreground hover:bg-primary/10">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/billing')} className="text-popover-foreground hover:bg-primary/10">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-popover-foreground hover:bg-primary/10">
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
