import { Link, useLocation } from "react-router-dom";
import { 
  Calendar, 
  Film, 
  Grid3X3, 
  UserCircle, 
  CreditCard, 
  LogOut,
  ChevronDown,
  ChevronUp,
  LightbulbIcon,
  BookOpen,
  Anchor,
  LayoutPanelLeft,
  BookmarkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const SidebarItem = ({ href, icon, label, onClick }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-white"
          : "hover:bg-primary/10 dark:hover:bg-accent"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

interface SidebarCategoryProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const SidebarCategory = ({ title, children, defaultOpen = false }: SidebarCategoryProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-xs uppercase font-medium text-muted-foreground hover:text-foreground">
        <span>{title}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 py-1 space-y-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface AppSidebarProps {
  isMobile?: boolean;
  onNavItemClick?: () => void;
}

const AppSidebar = ({ isMobile = false, onNavItemClick }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate("/auth");
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: error.message,
      });
    }
  };

  return (
    <div className={cn(
      "border-r h-screen flex flex-col",
      isMobile ? "w-full" : "w-64 fixed"
    )}>
      <div className="px-4 py-4 h-16 flex items-center">
        <Link to="/dashboard" className="flex items-center" onClick={onNavItemClick}>
          <Logo size="medium" />
        </Link>
      </div>
      
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        <SidebarCategory title="Overview" defaultOpen={true}>
          <SidebarItem
            href="/dashboard"
            icon={<Grid3X3 className="w-5 h-5" />}
            label="Dashboard"
            onClick={onNavItemClick}
          />
          <SidebarItem
            href="/planner"
            icon={<LayoutPanelLeft className="w-5 h-5" />}
            label="Content Planner"
            onClick={onNavItemClick}
          />
          <SidebarItem
            href="/calendar"
            icon={<Calendar className="w-5 h-5" />}
            label="Calendar"
            onClick={onNavItemClick}
          />
        </SidebarCategory>
        
        <SidebarCategory title="Create" defaultOpen={true}>
          <SidebarItem
            href="/generator"
            icon={<LightbulbIcon className="w-5 h-5" />}
            label="Generate Ideas"
            onClick={onNavItemClick}
          />
          <SidebarItem
            href="/script"
            icon={<BookOpen className="w-5 h-5" />}
            label="Generate Scripts"
            onClick={onNavItemClick}
          />
          <SidebarItem
            href="/hooks"
            icon={<Anchor className="w-5 h-5" />}
            label="Generate Hooks"
            onClick={onNavItemClick}
          />
        </SidebarCategory>
        
        <SidebarCategory title="Library" defaultOpen={true}>
          <SidebarItem
            href="/ideas"
            icon={<Film className="w-5 h-5" />}
            label="Saved Ideas"
            onClick={onNavItemClick}
          />
          <SidebarItem
            href="/saved-hooks"
            icon={<BookmarkIcon className="w-5 h-5" />}
            label="Saved Hooks"
            onClick={onNavItemClick}
          />
        </SidebarCategory>
      </div>
      
      <div className="mt-auto px-4 py-4 border-t border-border">
        <div className="space-y-1">
          <SidebarItem
            href="/account"
            icon={<UserCircle className="w-5 h-5" />}
            label="Account"
            onClick={onNavItemClick}
          />
          <SidebarItem
            href="/billing"
            icon={<CreditCard className="w-5 h-5" />}
            label="Billing"
            onClick={onNavItemClick}
          />
          <button
            onClick={() => {
              handleLogout();
              if (onNavItemClick) onNavItemClick();
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full hover:bg-primary/10 dark:hover:bg-accent"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
