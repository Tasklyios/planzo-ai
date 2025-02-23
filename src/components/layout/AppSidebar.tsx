
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarIcon,
  Lightbulb,
  BookmarkIcon,
  UserCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
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
  {
    title: "Account",
    icon: UserCircle,
    path: "/account",
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                  >
                    <Link 
                      to={item.path}
                      className={`flex items-center gap-2 ${
                        location.pathname === item.path ? "text-[#4F92FF] font-medium" : "text-gray-600"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
