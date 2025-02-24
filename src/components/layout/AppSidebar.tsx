
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarIcon,
  Lightbulb,
  BookmarkIcon,
  UserCircle,
  CreditCard,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const mainMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "Generator",
    icon: Lightbulb,
    path: "/generator",
  },
  {
    title: "Ideas",
    icon: BookmarkIcon,
    path: "/ideas",
  },
  {
    title: "Calendar",
    icon: CalendarIcon,
    path: "/calendar",
  },
];

const accountMenuItems = [
  {
    title: "My Account",
    icon: UserCircle,
    path: "/account",
  },
  {
    title: "Billing",
    icon: CreditCard,
    path: "/billing",
  },
];

export function AppSidebar() {
  const location = useLocation();
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

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-4">
        <h1 className="text-2xl font-bold text-primary">TrendAI</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                  >
                    <Link 
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive(item.path) 
                          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-primary font-medium shadow-sm border border-primary/10" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 transition-colors ${
                        isActive(item.path) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      }`} />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountMenuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                  >
                    <Link 
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive(item.path) 
                          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-primary font-medium shadow-sm border border-primary/10" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 transition-colors ${
                        isActive(item.path) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      }`} />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip="Logout"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent/50 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="flex-1">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
