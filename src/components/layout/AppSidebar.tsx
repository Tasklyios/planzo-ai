
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRightLeft, 
  Calendar, 
  Clock, 
  CreditCard, 
  Home, 
  Layers, 
  LogOut, 
  MessageSquare, 
  Rocket, 
  Settings, 
  User, 
  PanelLeftOpen,
  Sparkles,
  FileText,
  BookOpen,
  Save,
  Heart 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Logo } from "@/components/ui/logo";

interface AppSidebarProps {
  isMobile?: boolean;
  closeDrawer?: () => void;
}

const AppSidebar = ({ isMobile, closeDrawer }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

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
  };

  return (
    <ScrollArea className="h-full py-2">
      <div className="space-y-1 px-2">
        <div className="flex items-center mb-2">
          <Link to="/" className="flex items-center gap-2" onClick={closeDrawer}>
            <Logo size="small" />
          </Link>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={closeDrawer}>
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Overview</h3>
          <div className="space-y-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/dashboard") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/dashboard")}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/content-planner") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/content-planner")}
            >
              <Clock className="mr-2 h-4 w-4" />
              Content Planner
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/calendar") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/calendar")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Content Calendar
            </Button>
          </div>
        </div>

        <Separator className="my-1" />

        <div className="space-y-1">
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Generate</h3>
          <div className="space-y-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/idea-generator") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/idea-generator")}
            >
              <Rocket className="mr-2 h-4 w-4" />
              Generate Ideas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/script") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/script")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Scripts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/hooks") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/hooks")}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Generate Hooks
            </Button>
          </div>
        </div>

        <Separator className="my-1" />

        <div className="space-y-1">
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Library</h3>
          <div className="space-y-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/ideas") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/ideas")}
            >
              <Save className="mr-2 h-4 w-4" />
              Saved Ideas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/saved-hooks") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/saved-hooks")}
            >
              <Heart className="mr-2 h-4 w-4" />
              Saved Hooks
            </Button>
          </div>
        </div>

        <Separator className="my-1" />
        
        <div className="space-y-1">
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Account</h3>
          <div className="space-y-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/account") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/account")}
            >
              <User className="mr-2 h-4 w-4" />
              My Account
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1",
                isActive("/billing") && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => handleNavigation("/billing")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 px-2 py-1 text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default AppSidebar;
