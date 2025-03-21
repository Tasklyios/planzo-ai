import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Sparkles
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
import PricingSheet from "@/components/pricing/PricingSheet";

interface AppSidebarProps {
  isMobile?: boolean;
  closeDrawer?: () => void;
}

const AppSidebar = ({ isMobile, closeDrawer }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<string[]>(["overview", "create", "library"]);

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
      <div className="px-4 py-4 mb-2">
        <Link to="/" className="flex items-center" onClick={closeDrawer}>
          <Logo size="large" className="ml-[-4px]" />
        </Link>
      </div>
      
      <ScrollArea className="flex-1 px-3 pb-20">
        <div className="space-y-4">
          <Accordion
            type="multiple"
            defaultValue={["overview", "create", "library"]}
            className="w-full"
          >
            <AccordionItem value="overview" className="border-none">
              <AccordionTrigger className="py-1 px-2 hover:no-underline group flex justify-between">
                <span className="text-xs font-medium text-muted-foreground">OVERVIEW</span>
              </AccordionTrigger>
              <AccordionContent className="pt-0.5 pb-1">
                <div className="space-y-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start rounded-md h-8 px-2 py-1.5 text-sm",
                      isActive("/dashboard") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/dashboard")}
                  >
                    <LayoutGrid className="mr-1.5 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start rounded-md h-8 px-2 py-1.5 text-sm",
                      isActive("/content-planner") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/content-planner")}
                  >
                    <BookText className="mr-1.5 h-4 w-4" />
                    Content Planner
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start rounded-md h-8 px-2 py-1.5 text-sm",
                      isActive("/calendar") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/calendar")}
                  >
                    <CalendarIcon className="mr-1.5 h-4 w-4" />
                    Calendar
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="create" className="border-none mt-2">
              <AccordionTrigger className="py-1 px-2 hover:no-underline group flex justify-between">
                <span className="text-xs font-medium text-muted-foreground">CREATE</span>
              </AccordionTrigger>
              <AccordionContent className="pt-0.5 pb-1">
                <div className="space-y-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start rounded-md h-8 px-2 py-1.5 text-sm",
                      isActive("/idea-generator") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/idea-generator")}
                  >
                    <LightbulbIcon className="mr-1.5 h-4 w-4" />
                    Generate Ideas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start rounded-md h-8 px-2 py-1.5 text-sm",
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
                      "w-full justify-start rounded-md h-8 px-2 py-1.5 text-sm",
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

            <AccordionItem value="library" className="border-none mt-2">
              <AccordionTrigger className="py-1 px-2 hover:no-underline group flex justify-between">
                <span className="text-xs font-medium text-muted-foreground">LIBRARY</span>
              </AccordionTrigger>
              <AccordionContent className="pt-0.5 pb-1">
                <div className="space-y-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start rounded-md h-8 px-2 py-1.5 text-sm",
                      isActive("/ideas") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/ideas")}
                  >
                    <LayoutGrid className="mr-1.5 h-4 w-4" />
                    Saved Ideas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start rounded-md h-8 px-2 py-1.5 text-sm",
                      isActive("/saved-hooks") 
                        ? "bg-primary text-white font-medium" 
                        : "text-foreground"
                    )}
                    onClick={() => handleNavigation("/saved-hooks")}
                  >
                    <Bookmark className="mr-1.5 h-4 w-4" />
                    Saved Hooks
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="mt-4 px-2">
            <PricingSheet 
              trigger={
                <Button variant="default" className="w-full flex items-center justify-start gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Sparkles className="h-4 w-4" />
                  Upgrade Plan
                </Button>
              }
            />
          </div>
        </div>
      </ScrollArea>
      
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/40 p-2">
        <div className="space-y-0.5">
          <h3 className="px-2 text-xs font-medium text-muted-foreground">Account</h3>
          <div className="space-y-0.5 pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-2 py-1.5 text-sm",
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
                "w-full justify-start h-8 px-2 py-1.5 text-sm",
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
              className="w-full justify-start h-8 px-2 py-1.5 text-sm text-muted-foreground"
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
