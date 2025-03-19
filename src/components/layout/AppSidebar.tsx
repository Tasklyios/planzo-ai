
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Home,
  Calendar,
  Lightbulb,
  User,
  CreditCard,
  LogOut,
  Moon,
  Sun,
  Settings,
  Rocket,
  Mail,
  BookText,
  Search,
  ArrowUp,
} from "lucide-react";

interface AppSidebarProps {
  isMobile?: boolean;
  closeDrawer?: () => void;
}

export default function AppSidebar({ isMobile = false, closeDrawer }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Signed out successfully",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Sign out failed",
      });
    }
  };

  const handleNavLinkClick = (path: string) => {
    navigate(path);
    if (isMobile && closeDrawer) {
      closeDrawer();
    }
  };

  return (
    <div className="flex flex-col h-full py-4">
      <div className="px-3 pb-2 text-2xl font-bold text-center">
        <Link 
          to="/dashboard" 
          className="flex items-center justify-center"
          onClick={() => isMobile && closeDrawer && closeDrawer()}
        >
          <span className="text-primary">Creator</span>
          <span className="ml-1">AI</span>
        </Link>
      </div>

      <div className="mt-4 flex-1 px-3 space-y-1">
        <Button
          variant={location.pathname === "/dashboard" ? "default" : "ghost"}
          className={cn("w-full justify-start", location.pathname === "/dashboard" ? "bg-primary" : "")}
          onClick={() => handleNavLinkClick("/dashboard")}
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={location.pathname === "/ideas" ? "default" : "ghost"}
          className={cn("w-full justify-start", location.pathname === "/ideas" ? "bg-primary" : "")}
          onClick={() => handleNavLinkClick("/ideas")}
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          Ideas
        </Button>
        <Button
          variant={location.pathname === "/calendar" ? "default" : "ghost"}
          className={cn("w-full justify-start", location.pathname === "/calendar" ? "bg-primary" : "")}
          onClick={() => handleNavLinkClick("/calendar")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Calendar
        </Button>
        <Button
          variant={location.pathname === "/hooks" ? "default" : "ghost"}
          className={cn("w-full justify-start", location.pathname === "/hooks" ? "bg-primary" : "")}
          onClick={() => handleNavLinkClick("/hooks")}
        >
          <ArrowUp className="mr-2 h-4 w-4" />
          Hooks
        </Button>
        <Button
          variant={location.pathname === "/script" ? "default" : "ghost"}
          className={cn("w-full justify-start", location.pathname === "/script" ? "bg-primary" : "")}
          onClick={() => handleNavLinkClick("/script")}
        >
          <BookText className="mr-2 h-4 w-4" />
          Scripts
        </Button>
        <Button
          variant={location.pathname === "/email-templates" ? "default" : "ghost"}
          className={cn("w-full justify-start", location.pathname === "/email-templates" ? "bg-primary" : "")}
          onClick={() => handleNavLinkClick("/email-templates")}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email Templates
        </Button>
      </div>

      <div className="px-3 mt-auto space-y-1">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => handleNavLinkClick("/account")}
        >
          <User className="mr-2 h-4 w-4" />
          Account
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => handleNavLinkClick("/billing")}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Billing
        </Button>
        <Button
          variant="ghost"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start"
        >
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" /> Light Mode
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" /> Dark Mode
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
