
import { useLocation, Link } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { 
  Calendar, 
  Home, 
  Lightbulb, 
  FileText, 
  User, 
  CreditCard, 
  AnchorIcon,
  LayoutGrid,
  Settings,
  Sparkles,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon, label, href, active, onClick }: SidebarItemProps) => (
  <Link to={href} className="w-full" onClick={onClick}>
    <Button 
      variant="ghost" 
      className={cn(
        "w-full justify-start mb-1 font-normal",
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      )}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  </Link>
);

const LogoutItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onClick) onClick();
  };
  
  return (
    <Button 
      variant="ghost" 
      className="w-full justify-start mb-1 font-normal hover:bg-accent"
      onClick={handleLogout}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  );
};

interface AppSidebarProps {
  isMobile?: boolean;
  closeDrawer?: () => void;
}

export default function AppSidebar({ isMobile = false, closeDrawer }: AppSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Grouped navigation items by category
  const navCategories = [
    {
      title: "Overview",
      items: [
        { 
          label: "Dashboard", 
          href: "/dashboard", 
          icon: <Home className="h-5 w-5" /> 
        },
        { 
          label: "Content Planner", 
          href: "/planner", 
          icon: <LayoutGrid className="h-5 w-5" /> 
        },
        { 
          label: "Content Calendar", 
          href: "/calendar", 
          icon: <Calendar className="h-5 w-5" /> 
        }
      ]
    },
    {
      title: "Generate",
      items: [
        { 
          label: "Generate Ideas", 
          href: "/generator", 
          icon: <Sparkles className="h-5 w-5" /> 
        },
        { 
          label: "Generate Scripts", 
          href: "/script", 
          icon: <FileText className="h-5 w-5" /> 
        },
        { 
          label: "Generate Hooks", 
          href: "/hooks", 
          icon: <AnchorIcon className="h-5 w-5" /> 
        }
      ]
    },
    {
      title: "Library",
      items: [
        { 
          label: "Saved Ideas", 
          href: "/ideas", 
          icon: <Lightbulb className="h-5 w-5" /> 
        },
        { 
          label: "Saved Hooks", 
          href: "/saved-hooks", 
          icon: <Lightbulb className="h-5 w-5" /> 
        }
      ]
    }
  ];

  const accountCategory = {
    title: "Account",
    items: [
      { 
        label: "My Account", 
        href: "/account", 
        icon: <User className="h-5 w-5" /> 
      },
      { 
        label: "Billing", 
        href: "/billing", 
        icon: <CreditCard className="h-5 w-5" /> 
      }
    ]
  };
  
  return (
    <div className="h-full flex flex-col bg-card border-r px-3 py-4 overflow-y-auto">
      <div className="flex items-center mb-6 px-4">
        <Logo />
      </div>
      <div className="space-y-6 flex-1">
        {navCategories.map((category, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-medium text-xs uppercase text-muted-foreground px-4">
              {category.title}
            </h3>
            <div className="space-y-1">
              {category.items.map((item) => (
                <SidebarItem 
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={currentPath === item.href}
                  onClick={isMobile && closeDrawer ? closeDrawer : undefined}
                />
              ))}
            </div>
            {index < navCategories.length - 1 && (
              <Separator className="my-2" />
            )}
          </div>
        ))}
      </div>
      <div className="pt-4 mt-4 border-t border-border">
        <div className="space-y-2">
          <h3 className="font-medium text-xs uppercase text-muted-foreground px-4">
            {accountCategory.title}
          </h3>
          <div className="space-y-1">
            {accountCategory.items.map((item) => (
              <SidebarItem 
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={currentPath === item.href}
                onClick={isMobile && closeDrawer ? closeDrawer : undefined}
              />
            ))}
            <LogoutItem 
              icon={<LogOut className="h-5 w-5" />}
              label="Log Out"
              onClick={isMobile && closeDrawer ? closeDrawer : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
