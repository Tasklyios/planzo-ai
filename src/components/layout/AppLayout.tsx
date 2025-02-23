
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Sparkles,
  Bookmark,
  Calendar,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navigationItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Sparkles, label: "Generate Ideas", href: "/generate" },
    { icon: Bookmark, label: "Saved Ideas", href: "/ideas" },
    { icon: Calendar, label: "Calendar", href: "/calendar" },
  ];

  const bottomItems = [
    { icon: User, label: "Account", href: "/account" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
          isCollapsed ? "w-[80px]" : "w-[240px]"
        )}
      >
        {/* Logo section */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-[#4F92FF]" />
            {!isCollapsed && (
              <span className="text-xl font-bold text-[#222831]">Lovable</span>
            )}
          </Link>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors",
                  location.pathname === item.href
                    ? "bg-[#4F92FF] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            {bottomItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors",
                  location.pathname === item.href
                    ? "bg-[#4F92FF] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 h-auto"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-[72px] translate-x-1/2 rounded-full w-6 h-6 p-0 bg-white border shadow-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? ">" : "<"}
        </Button>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[#F9FAFC]">{children}</main>
    </div>
  );
};

export default AppLayout;
