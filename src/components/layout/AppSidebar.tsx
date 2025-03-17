
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRightLeft, 
  Calendar, 
  Clipboard,
  CreditCard, 
  Home, 
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
  Heart,
  ChevronDown,
  Anchor
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Logo } from "@/components/ui/logo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";

interface AppSidebarProps {
  isMobile?: boolean;
  closeDrawer?: () => void;
}

const AppSidebar = ({ isMobile, closeDrawer }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<string[]>(["overview", "generate", "library"]);

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

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const isSectionOpen = (section: string) => {
    return openSections.includes(section);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-4 py-4">
        <Link to="/" className="flex items-center" onClick={closeDrawer}>
          <Logo size="large" className="ml-[-4px]" />
        </Link>
      </div>
      
      <ScrollArea className="flex-1 px-2 pb-20">
        <div className="space-y-0.5">
          <Accordion
            type="multiple"
            defaultValue={["overview", "generate", "library"]}
            className="w-full"
          >
            <AccordionItem value="overview" className="border-none">
              <AccordionTrigger className="py-1 px-2 hover:no-underline">
                <h3 className="text-xs font-medium text-muted-foreground">Overview</h3>
              </AccordionTrigger>
              <AccordionContent className="pt-0.5 pb-0">
                <div className="space-y-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-10 px-2 py-1.5 text-sm",
                      isActive("/dashboard") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/dashboard")}
                  >
                    <Home className="mr-1.5 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-10 px-2 py-1.5 text-sm",
                      isActive("/content-planner") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/content-planner")}
                  >
                    <Clipboard className="mr-1.5 h-4 w-4" />
                    Content Planner
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-10 px-2 py-1.5 text-sm",
                      isActive("/calendar") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/calendar")}
                  >
                    <Calendar className="mr-1.5 h-4 w-4" />
                    Content Calendar
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <Separator className="my-0.5" />

            <AccordionItem value="generate" className="border-none">
              <AccordionTrigger className="py-1 px-2 hover:no-underline">
                <h3 className="text-xs font-medium text-muted-foreground">Generate</h3>
              </AccordionTrigger>
              <AccordionContent className="pt-0.5 pb-0">
                <div className="space-y-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-10 px-2 py-1.5 text-sm",
                      isActive("/idea-generator") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/idea-generator")}
                  >
                    <Rocket className="mr-1.5 h-4 w-4" />
                    Generate Ideas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-10 px-2 py-1.5 text-sm",
                      isActive("/script") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/script")}
                  >
                    <FileText className="mr-1.5 h-4 w-4" />
                    Generate Scripts
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-10 px-2 py-1.5 text-sm",
                      isActive("/hooks") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/hooks")}
                  >
                    <Anchor className="mr-1.5 h-4 w-4" />
                    Generate Hooks
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <Separator className="my-0.5" />

            <AccordionItem value="library" className="border-none">
              <AccordionTrigger className="py-1 px-2 hover:no-underline">
                <h3 className="text-xs font-medium text-muted-foreground">Library</h3>
              </AccordionTrigger>
              <AccordionContent className="pt-0.5 pb-0">
                <div className="space-y-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-10 px-2 py-1.5 text-sm",
                      isActive("/ideas") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/ideas")}
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    Saved Ideas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-10 px-2 py-1.5 text-sm",
                      isActive("/saved-hooks") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/saved-hooks")}
                  >
                    <Heart className="mr-1.5 h-4 w-4" />
                    Saved Hooks
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
      
      {/* Sticky Account Section - Always Expanded */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/40 p-2">
        <div className="space-y-0.5">
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Account</h3>
          <div className="space-y-0 pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-10 px-2 py-1.5 text-sm",
                isActive("/account") 
                  ? "bg-primary text-white font-medium" 
                  : "text-foreground"
              )}
              onClick={() => handleNavigation("/account")}
            >
              <User className="mr-1.5 h-4 w-4" />
              My Account
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-10 px-2 py-1.5 text-sm",
                isActive("/billing") 
                  ? "bg-primary text-white font-medium" 
                  : "text-foreground"
              )}
              onClick={() => handleNavigation("/billing")}
            >
              <CreditCard className="mr-1.5 h-4 w-4" />
              Billing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-10 px-2 py-1.5 text-sm text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
