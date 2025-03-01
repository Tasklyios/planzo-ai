import { Link, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
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
  Palette,
  LayoutPanelLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
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
          ? "bg-[#0073FF] text-white"
          : "hover:bg-[#E5F0FF] dark:hover:bg-accent"
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

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
};

const AppSidebar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
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
    <div className="w-64 border-r h-screen flex flex-col fixed">
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-[#0073FF]" />
          <span className="text-[#0073FF]">Planzo AI</span>
        </h1>
      </div>
      <Separator />
      
      {/* Main navigation - scrollable area */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        <SidebarCategory title="Overview" defaultOpen={true}>
          <SidebarItem
            href="/dashboard"
            icon={<Grid3X3 className="w-5 h-5" />}
            label="Dashboard"
          />
          <SidebarItem
            href="/planner"
            icon={<LayoutPanelLeft className="w-5 h-5" />}
            label="Content Planner"
          />
          <SidebarItem
            href="/calendar"
            icon={<Calendar className="w-5 h-5" />}
            label="Calendar"
          />
        </SidebarCategory>
        
        <SidebarCategory title="Create" defaultOpen={true}>
          <SidebarItem
            href="/generator"
            icon={<LightbulbIcon className="w-5 h-5" />}
            label="Generate Ideas"
          />
          <SidebarItem
            href="/script"
            icon={<BookOpen className="w-5 h-5" />}
            label="Generate Scripts"
          />
          <SidebarItem
            href="/hooks"
            icon={<Anchor className="w-5 h-5" />}
            label="Generate Hooks"
          />
        </SidebarCategory>
        
        <SidebarCategory title="Library" defaultOpen={true}>
          <SidebarItem
            href="/ideas"
            icon={<Film className="w-5 h-5" />}
            label="Saved Ideas"
          />
          <SidebarItem
            href="/find-your-style"
            icon={<Palette className="w-5 h-5" />}
            label="Content Style"
          />
        </SidebarCategory>
      </div>
      
      {/* User account section - always visible at bottom */}
      <div className="mt-auto px-4 py-4 border-t border-border">
        <div className="space-y-1">
          <SidebarItem
            href="/account"
            icon={<UserCircle className="w-5 h-5" />}
            label="Account"
          />
          <SidebarItem
            href="/billing"
            icon={<CreditCard className="w-5 h-5" />}
            label="Billing"
          />
          <SidebarItem
            href="#"
            onClick={handleLogout}
            icon={<LogOut className="w-5 h-5" />}
            label="Logout"
          />
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
