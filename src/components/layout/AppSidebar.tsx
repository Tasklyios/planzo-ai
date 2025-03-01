
import { Link, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Sparkles, BookCopy, Zap, Calendar, Film, PenTool, Grid3X3, UserCircle, CreditCard, Palette, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent"
      )}
    >
      {icon}
      {label}
    </Link>
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
          <Sparkles className="w-5 h-5 mr-2" />
          ContentCraft
        </h1>
      </div>
      <Separator />
      
      {/* Main navigation - scrollable area */}
      <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <SidebarItem
          href="/dashboard"
          icon={<Grid3X3 className="w-5 h-5" />}
          label="Dashboard"
        />
        <SidebarItem
          href="/generator"
          icon={<Zap className="w-5 h-5" />}
          label="Generate Ideas"
        />
        <SidebarItem
          href="/script"
          icon={<PenTool className="w-5 h-5" />}
          label="Script Creator"
        />
        <SidebarItem
          href="/planner"
          icon={<BookCopy className="w-5 h-5" />}
          label="Content Planner"
        />
        <SidebarItem
          href="/find-your-style"
          icon={<Palette className="w-5 h-5" />}
          label="Find Your Style"
        />
        <SidebarItem
          href="/ideas"
          icon={<Film className="w-5 h-5" />}
          label="Saved Ideas"
        />
        <SidebarItem
          href="/calendar"
          icon={<Calendar className="w-5 h-5" />}
          label="Calendar"
        />
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
