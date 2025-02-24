
import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SearchBar } from "@/components/SearchBar";
import { 
  Menu,
  LayoutDashboard,
  Lightbulb,
  BookmarkIcon,
  CalendarIcon,
  UserCircle,
  CreditCard,
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
      setIsOpen(false);
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-sm z-50 px-4">
          <div className="h-full flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">TrendAI</h1>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <nav className="h-full flex flex-col bg-card">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-2xl font-bold text-primary">TrendAI</h2>
                  </div>
                  <div className="flex-1 overflow-auto py-2">
                    <div className="space-y-1">
                      <Link 
                        to="/dashboard" 
                        className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        <span>Dashboard</span>
                      </Link>
                      <Link 
                        to="/generator" 
                        className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Lightbulb className="h-5 w-5" />
                        <span>Generator</span>
                      </Link>
                      <Link 
                        to="/ideas" 
                        className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <BookmarkIcon className="h-5 w-5" />
                        <span>Ideas</span>
                      </Link>
                      <Link 
                        to="/calendar" 
                        className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <CalendarIcon className="h-5 w-5" />
                        <span>Calendar</span>
                      </Link>
                    </div>
                  </div>
                  <div className="border-t border-border p-2">
                    <div className="space-y-1">
                      <Link 
                        to="/account" 
                        className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <UserCircle className="h-5 w-5" />
                        <span>My Account</span>
                      </Link>
                      <Link 
                        to="/billing" 
                        className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <CreditCard className="h-5 w-5" />
                        <span>Billing</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Search Bar */}
          <div className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-center px-4 md:px-8">
            <SearchBar />
          </div>

          <main className="flex-1 p-4 md:p-8 mt-8 md:mt-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
