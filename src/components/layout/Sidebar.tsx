
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Bookmark,
  Calendar as CalendarIcon,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const MENU_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/generator', label: 'Generator', icon: Sparkles },
  { path: '/ideas', label: 'Ideas', icon: Bookmark },
  { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
] as const;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0">
      <div className="p-6">
        <div className="text-2xl font-bold text-[#4F92FF]">TrendAI</div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-[#4F92FF] text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            className="justify-start space-x-3"
            onClick={() => navigate('/account')}
          >
            <User className="h-5 w-5" />
            <span>Account</span>
          </Button>
          <Button
            variant="ghost"
            className="justify-start space-x-3"
            onClick={() => navigate('/account')}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Button>
          <Button
            variant="ghost"
            className="justify-start space-x-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
